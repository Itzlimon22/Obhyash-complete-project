-- Migration: Enable Subscription Validity Stacking / Extension on Renewals
-- Description: When a user renews or buys another package while an active package exists, 
-- the remaining days are preserved and new package days are added on top (stacked).

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
    v_plan_id UUID;
    v_duration_days INTEGER;
    v_plan_display_name TEXT;
    v_base_expiry TIMESTAMPTZ;
    v_expiry TIMESTAMPTZ;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- 1. Fetch payment request
    SELECT * INTO v_req
    FROM public.payment_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Payment request not found');
    END IF;

    IF v_req.status = 'Approved' THEN
        RETURN jsonb_build_object('success', false, 'message', 'Request is already approved');
    END IF;

    -- 2. Match Plan from subscription_plans table
    SELECT id, duration_days, display_name
    INTO v_plan_id, v_duration_days, v_plan_display_name
    FROM public.subscription_plans
    WHERE (id::text = v_req.plan_id OR name = v_req.plan_id OR name = v_req.plan_name OR display_name = v_req.plan_name)
    LIMIT 1;

    IF v_duration_days IS NULL THEN
        IF LOWER(v_req.plan_name) LIKE '%year%' OR v_req.plan_name LIKE '%বছর%' OR v_req.plan_name LIKE '%৬ মাস%' OR v_req.plan_name LIKE '%সেশন%' THEN
            v_duration_days := 180;
        ELSIF LOWER(v_req.plan_name) LIKE '%pro%' OR LOWER(v_req.plan_name) LIKE '%quarter%' OR v_req.plan_name LIKE '%ত্রৈমাসিক%' OR v_req.plan_name LIKE '%৩ মাস%' OR v_req.plan_name LIKE '%এডমিশন%' THEN
            v_duration_days := 90;
        ELSE
            v_duration_days := 30;
        END IF;
    END IF;

    IF v_plan_display_name IS NULL THEN
        v_plan_display_name := v_req.plan_name;
    END IF;

    -- 3. Calculate new expiry with STACKING:
    -- If user already has an active subscription expiring in the future, add new duration to that future date!
    SELECT 
        CASE 
            WHEN (subscription->>'expiry') IS NOT NULL AND (subscription->>'expiry')::timestamptz > v_now 
                THEN (subscription->>'expiry')::timestamptz 
            WHEN subscription_expires_at IS NOT NULL AND subscription_expires_at > v_now 
                THEN subscription_expires_at 
            ELSE v_now 
        END INTO v_base_expiry
    FROM public.users WHERE id = v_req.user_id;

    v_expiry := COALESCE(v_base_expiry, v_now) + (v_duration_days || ' days')::INTERVAL;

    -- 4. Update payment_requests status
    UPDATE public.payment_requests
    SET 
        status = 'Approved',
        admin_notes = COALESCE(p_admin_notes, admin_notes),
        reviewed_at = v_now,
        reviewed_by = COALESCE(p_admin_id, reviewed_by),
        updated_at = v_now
    WHERE id = p_request_id;

    -- 5. Update users table with active subscription
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

    -- 6. Deactivate previous active records in subscription_history and insert new record
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
        p_request_id,
        v_now,
        v_expiry,
        TRUE,
        v_now
    );

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Payment approved successfully with stacked validity',
        'new_expiry', v_expiry,
        'user_id', v_req.user_id
    );
END;
$$;
