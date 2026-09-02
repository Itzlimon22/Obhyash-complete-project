-- ==============================================================================
-- FIX GHOST PREMIUM & EXPIRED SUBSCRIPTIONS (MIGRATION & CLEANUP SCRIPT)
-- ==============================================================================
-- Problem: Users whose referral/promotional Pro subscriptions expired were still
-- retaining is_subscribed = true, plan = 'Pro', level = 'Pro', or subscription.plan = 'Pro',
-- allowing client-side or partial bypasses to Pro features while Admin panel / subscription
-- services showed them as Free/Expired.
--
-- This script:
-- 1. Updates canonical DB function `public.is_user_subscribed(p_user_id)`
-- 2. Creates automated cron/triggerable helper `public.demote_expired_subscriptions()`
-- 3. Performs an immediate one-time cleanup on `public.users`
-- ==============================================================================

-- 1. Canonical DB function for subscription verification
CREATE OR REPLACE FUNCTION public.is_user_subscribed(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_is_sub BOOLEAN;
    v_status TEXT;
    v_plan TEXT;
    v_expires_at TIMESTAMPTZ;
    v_sub_json JSONB;
BEGIN
    SELECT 
        role,
        is_subscribed,
        subscription_status,
        plan,
        subscription_expires_at,
        subscription
    INTO 
        v_role,
        v_is_sub,
        v_status,
        v_plan,
        v_expires_at,
        v_sub_json
    FROM public.users
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Admins and moderators always have bypass access
    IF LOWER(COALESCE(v_role, '')) IN ('admin', 'super admin', 'superadmin', 'moderator') THEN
        RETURN TRUE;
    END IF;

    -- Check JSON subscription object fallback for expires_at if column is NULL
    IF v_expires_at IS NULL AND v_sub_json IS NOT NULL THEN
        BEGIN
            v_expires_at := (v_sub_json->>'expiry')::TIMESTAMPTZ;
        EXCEPTION WHEN OTHERS THEN
            BEGIN
                v_expires_at := (v_sub_json->>'expires_at')::TIMESTAMPTZ;
            EXCEPTION WHEN OTHERS THEN
                v_expires_at := NULL;
            END;
        END;
    END IF;

    -- If there is no expiration date or expiration is in the past, user is NOT subscribed
    IF v_expires_at IS NULL OR v_expires_at <= NOW() THEN
        RETURN FALSE;
    END IF;

    -- Verify status is active
    IF COALESCE(v_status, '') ILIKE 'active' OR (v_sub_json->>'status') ILIKE 'active' OR v_is_sub = TRUE THEN
        -- Verify plan is not free
        IF LOWER(COALESCE(v_plan, '')) NOT IN ('free', 'inactive', '') 
           OR LOWER(COALESCE(v_sub_json->>'plan', '')) NOT IN ('free', 'inactive', '') THEN
            RETURN TRUE;
        END IF;
    END IF;

    RETURN FALSE;
END;
$$;

-- Grant execution to authenticated and service_role
GRANT EXECUTE ON FUNCTION public.is_user_subscribed(UUID) TO authenticated, service_role, anon;

-- 2. Maintenance procedure to demote all expired users
CREATE OR REPLACE FUNCTION public.demote_expired_subscriptions()
RETURNS TABLE (
    demoted_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    -- Update users whose explicit expiration has passed
    WITH updated_rows AS (
        UPDATE public.users
        SET 
            is_subscribed = FALSE,
            subscription_status = 'Expired',
            plan = 'free',
            subscription = jsonb_set(
                jsonb_set(
                    COALESCE(subscription, '{}'::jsonb),
                    '{status}',
                    '"Expired"'
                ),
                '{plan}',
                '"Free"'
            ),
            -- If gamification level was mistakenly set to 'Pro', revert to Rookie or Scholar
            level = CASE 
                WHEN LOWER(level) = 'pro' THEN 
                    CASE 
                        WHEN COALESCE(xp, 0) >= 30000 THEN 'Legend'
                        WHEN COALESCE(xp, 0) >= 15000 THEN 'Master'
                        WHEN COALESCE(xp, 0) >= 5000  THEN 'Scholar'
                        ELSE 'Rookie'
                    END
                ELSE level
            END,
            updated_at = NOW()
        WHERE 
            LOWER(COALESCE(role, '')) NOT IN ('admin', 'super admin', 'superadmin', 'moderator')
            AND (
                -- Case A: Column expiration is set and in the past
                (subscription_expires_at IS NOT NULL AND subscription_expires_at <= NOW() AND (is_subscribed = TRUE OR subscription_status ILIKE 'active' OR LOWER(plan) = 'pro'))
                OR
                -- Case B: JSON expiry is in the past
                (
                    subscription IS NOT NULL 
                    AND (subscription->>'expiry') IS NOT NULL 
                    AND (subscription->>'expiry') ~ '^\d{4}-\d{2}-\d{2}'
                    AND (subscription->>'expiry')::TIMESTAMPTZ <= NOW()
                    AND (is_subscribed = TRUE OR subscription_status ILIKE 'active' OR LOWER(plan) = 'pro')
                )
                OR
                -- Case C: Marked as subscribed/Pro but has no expiration timestamp at all (orphan state)
                (
                    (is_subscribed = TRUE OR subscription_status ILIKE 'active' OR LOWER(plan) = 'pro')
                    AND subscription_expires_at IS NULL
                    AND (subscription IS NULL OR (subscription->>'expiry') IS NULL OR (subscription->>'expiry') = '')
                )
            )
        RETURNING id
    )
    SELECT COUNT(*)::INT INTO v_count FROM updated_rows;

    RETURN QUERY SELECT v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.demote_expired_subscriptions() TO authenticated, service_role;

-- 3. Execute immediate cleanup on existing database records
SELECT * FROM public.demote_expired_subscriptions();
