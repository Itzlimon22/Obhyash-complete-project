-- ==============================================================================
-- Migration: 20260818_subscription_security_and_gateways.sql
-- Description: Complete Subscription Security, Anti-Tamper Triggers,
--              Auto-Expiry Demotion, Single Source of Truth, and Atomic RPCs.
-- ==============================================================================

-- 1. STRICT SECURITY TRIGGER: Anti-Tamper on public.users table
-- Prevents ordinary users/attackers from escalating their privileges, changing
-- role, is_subscribed, subscription, subscription_status, subscription_expires_at,
-- plan, level, or xp directly via Supabase client.
CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS TRIGGER AS $$
DECLARE
    v_caller_role TEXT;
    v_is_admin BOOLEAN := FALSE;
BEGIN
    -- Allow service_role key (server-side API routes & edge functions)
    IF auth.role() = 'service_role' THEN
        v_is_admin := TRUE;
    ELSE
        -- Check if current authenticated user has Admin role
        SELECT role INTO v_caller_role 
        FROM public.users 
        WHERE id = auth.uid();

        v_is_admin := (v_caller_role = 'Admin');
    END IF;

    -- If caller is NOT Admin or service_role, revert all sensitive/privileged columns to OLD values
    IF NOT v_is_admin THEN
        NEW.role := OLD.role;
        NEW.is_subscribed := OLD.is_subscribed;
        NEW.subscription := OLD.subscription;
        NEW.subscription_status := OLD.subscription_status;
        NEW.subscription_expires_at := OLD.subscription_expires_at;
        NEW.level := OLD.level;
        NEW.plan := OLD.plan;
        NEW.xp := OLD.xp;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_user_privileged_columns ON public.users;
CREATE TRIGGER trg_protect_user_privileged_columns
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.protect_user_privileged_columns();


-- ==============================================================================
-- 2. SINGLE SOURCE OF TRUTH: is_user_subscribed Database Function
-- Evaluates real-time validity: must have future expiry AND active status
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_user_subscribed(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_expires_at TIMESTAMPTZ;
    v_status TEXT;
    v_is_sub BOOLEAN;
    v_sub_json JSONB;
BEGIN
    SELECT 
        subscription_expires_at, 
        subscription_status, 
        is_subscribed,
        subscription
    INTO 
        v_expires_at, 
        v_status, 
        v_is_sub,
        v_sub_json
    FROM public.users
    WHERE id = p_user_id;

    -- Fallback to JSON expiry if column was not populated
    IF v_expires_at IS NULL AND v_sub_json IS NOT NULL THEN
        v_expires_at := (v_sub_json->>'expiry')::TIMESTAMPTZ;
        IF v_expires_at IS NULL THEN
            v_expires_at := (v_sub_json->>'expires_at')::TIMESTAMPTZ;
        END IF;
    END IF;

    -- Strict check: must NOT be expired
    IF v_expires_at IS NOT NULL AND v_expires_at > NOW() THEN
        IF (LOWER(COALESCE(v_status, '')) = 'active' OR v_is_sub = TRUE OR LOWER(COALESCE(v_sub_json->>'status', '')) = 'active') THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.is_user_subscribed(UUID) TO anon, authenticated, service_role;


-- ==============================================================================
-- 3. AUTO-DEMOTE EXPIRED SUBSCRIPTIONS FUNCTION
-- Automatically revokes expired subscriptions across users & history tables
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.demote_expired_subscriptions()
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    -- 1. Demote in users table
    UPDATE public.users
    SET 
        is_subscribed = FALSE,
        subscription_status = 'Expired',
        subscription = jsonb_set(
            COALESCE(subscription, '{}'::jsonb), 
            '{status}', 
            '"Expired"'
        ),
        updated_at = NOW()
    WHERE (is_subscribed = TRUE OR LOWER(subscription_status) = 'active' OR LOWER(subscription->>'status') = 'active')
      AND subscription_expires_at IS NOT NULL
      AND subscription_expires_at <= NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- 2. Deactivate records in subscription_history table
    UPDATE public.subscription_history
    SET is_active = FALSE
    WHERE is_active = TRUE AND expires_at <= NOW();

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.demote_expired_subscriptions() TO anon, authenticated, service_role;


-- ==============================================================================
-- 4. ATOMIC RPC: approve_payment_request
-- Ensures payment approval, plan matching, user update, subscription_history
-- logging, and notification creation succeed atomically in a single transaction.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.approve_payment_request(
    p_request_id UUID,
    p_admin_id UUID DEFAULT NULL,
    p_admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_req RECORD;
    v_duration_days INT := 30;
    v_plan_id UUID;
    v_plan_display_name TEXT;
    v_expiry TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Fetch and lock payment request
    SELECT * INTO v_req
    FROM public.payment_requests
    WHERE id = p_request_id
    FOR UPDATE;

    IF v_req.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment request not found');
    END IF;

    IF v_req.status = 'Approved' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Payment request is already approved');
    END IF;

    -- 2. Match Plan from subscription_plans table
    SELECT id, duration_days, display_name 
    INTO v_plan_id, v_duration_days, v_plan_display_name
    FROM public.subscription_plans
    WHERE LOWER(name) = LOWER(v_req.plan_name) 
       OR LOWER(display_name) = LOWER(v_req.plan_name)
       OR LOWER(display_name) ILIKE '%' || LOWER(v_req.plan_name) || '%'
       OR LOWER(v_req.plan_name) ILIKE '%' || LOWER(display_name) || '%'
    LIMIT 1;

    IF v_duration_days IS NULL THEN
        IF LOWER(v_req.plan_name) LIKE '%year%' OR v_req.plan_name LIKE '%বছর%' THEN
            v_duration_days := 365;
        ELSIF LOWER(v_req.plan_name) LIKE '%pro%' OR LOWER(v_req.plan_name) LIKE '%quarter%' OR v_req.plan_name LIKE '%ত্রৈমাসিক%' THEN
            v_duration_days := 90;
        ELSE
            v_duration_days := 30;
        END IF;
    END IF;

    IF v_plan_display_name IS NULL THEN
        v_plan_display_name := v_req.plan_name;
    END IF;

    v_expiry := v_now + (v_duration_days || ' days')::INTERVAL;

    -- 3. Update payment_requests status
    UPDATE public.payment_requests
    SET 
        status = 'Approved',
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        reviewed_at = v_now,
        reviewed_by = COALESCE(p_admin_id, reviewed_by),
        updated_at = v_now
    WHERE id = p_request_id;

    -- 4. Update users table with active subscription
    UPDATE public.users
    SET
        subscription = jsonb_build_object(
            'plan', v_plan_display_name,
            'expiry', v_expiry,
            'expires_at', v_expiry,
            'status', 'Active'
        ),
        subscription_status = 'Active',
        subscription_expires_at = v_expiry,
        is_subscribed = TRUE,
        level = 'Pro',
        plan = 'Pro',
        updated_at = v_now
    WHERE id = v_req.user_id;

    -- 5. Deactivate previous active records in subscription_history and insert new record
    UPDATE public.subscription_history
    SET is_active = FALSE
    WHERE user_id = v_req.user_id;

    INSERT INTO public.subscription_history (
        user_id,
        plan_id,
        payment_request_id,
        started_at,
        expires_at,
        is_active,
        created_at
    ) VALUES (
        v_req.user_id,
        v_plan_id,
        v_req.id,
        v_now,
        v_expiry,
        TRUE,
        v_now
    );

    -- 6. Insert notification for student
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        is_read,
        created_at
    ) VALUES (
        v_req.user_id,
        'পেমেন্ট সফল ও প্রো সাবস্ক্রিপশন সক্রিয়! 🎉',
        'আপনার ' || v_plan_display_name || ' প্ল্যানের পেমেন্ট অনুমোদিত হয়েছে। মেয়াদ: ' || TO_CHAR(v_expiry, 'DD Mon, YYYY') || ' পর্যন্ত।',
        'success',
        FALSE,
        v_now
    );

    RETURN jsonb_build_object(
        'success', true, 
        'user_id', v_req.user_id,
        'plan_name', v_plan_display_name,
        'expires_at', v_expiry
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_payment_request(UUID, UUID, TEXT) TO service_role;
