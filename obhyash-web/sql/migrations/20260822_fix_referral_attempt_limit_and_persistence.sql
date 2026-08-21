-- ============================================================================
-- MIGRATION: Fix Referral Attempt Limit, Persistence & Brute-Force Lockout
-- DESCRIPTION:
--   1. Ensures referral_attempt_logs table exists and persists failed attempts.
--   2. Updates redeem_referral_by_code to return JSONB response instead of RAISE EXCEPTION
--      so that attempt logs are committed to the DB and not rolled back.
--   3. Adds get_referral_attempt_status RPC to fetch current attempt count & lock state.
-- ============================================================================

-- 1. Ensure table exists with correct schema
CREATE TABLE IF NOT EXISTS public.referral_attempt_logs (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.referral_attempt_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own referral attempt logs" ON public.referral_attempt_logs;
CREATE POLICY "Users can view their own referral attempt logs"
ON public.referral_attempt_logs FOR SELECT
USING (auth.uid() = user_id);

-- 2. Fixed redeem_referral_by_code function
CREATE OR REPLACE FUNCTION public.redeem_referral_by_code(
    p_code TEXT,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_clean_code TEXT;
    v_log RECORD;
    v_referral RECORD;
    v_remaining_attempts INT;
    v_lock_seconds INT;
BEGIN
    v_clean_code := UPPER(TRIM(COALESCE(p_code, '')));

    IF v_clean_code = '' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'অনুগ্রহ করে রেফারেল কোড লিখুন।'
        );
    END IF;

    -- A. Check if user already claimed any referral
    IF EXISTS (SELECT 1 FROM public.referral_history WHERE redeemed_by = p_user_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'তুমি ইতিমধ্যে একটি রেফারেল কোড ব্যবহার করেছো!'
        );
    END IF;

    -- B. Check existing lockout
    SELECT * INTO v_log
    FROM public.referral_attempt_logs
    WHERE user_id = p_user_id;

    IF v_log.locked_until IS NOT NULL AND v_log.locked_until > NOW() THEN
        v_lock_seconds := EXTRACT(EPOCH FROM (v_log.locked_until - NOW()))::INT;
        RETURN jsonb_build_object(
            'success', false,
            'locked', true,
            'lock_seconds', v_lock_seconds,
            'remaining_attempts', 0,
            'error', format('ভুল কোড দেওয়ার কারণে রেফারেল ইনপুট সাময়িকভাবে লক আছে। আর %s মিনিট %s সেকেন্ড অপেক্ষা করুন।', 
                (v_lock_seconds / 60), (v_lock_seconds % 60))
        );
    END IF;

    -- If previous lockout expired, reset failed count
    IF v_log.locked_until IS NOT NULL AND v_log.locked_until <= NOW() THEN
        UPDATE public.referral_attempt_logs
        SET failed_attempts = 0, locked_until = NULL, last_attempt_at = NOW()
        WHERE user_id = p_user_id;
        v_log.failed_attempts := 0;
    END IF;

    -- C. Lookup referral code
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE UPPER(TRIM(code)) = v_clean_code;

    -- D. If code not found (Invalid attempt)
    IF v_referral IS NULL THEN
        -- Increment failed attempts and persist to table
        INSERT INTO public.referral_attempt_logs (user_id, failed_attempts, locked_until, last_attempt_at)
        VALUES (p_user_id, 1, NULL, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET failed_attempts = public.referral_attempt_logs.failed_attempts + 1,
            last_attempt_at = NOW()
        RETURNING * INTO v_log;

        IF v_log.failed_attempts >= 3 THEN
            -- Lock for 10 minutes
            UPDATE public.referral_attempt_logs
            SET failed_attempts = 3,
                locked_until = NOW() + INTERVAL '10 minutes',
                last_attempt_at = NOW()
            WHERE user_id = p_user_id;

            RETURN jsonb_build_object(
                'success', false,
                'locked', true,
                'lock_seconds', 600,
                'remaining_attempts', 0,
                'error', 'পর পর ৩ বার ভুল কোড দেওয়া হয়েছে! আগামী ১০ মিনিটের জন্য রেফারেল ক্লেইম লক করা হলো।'
            );
        ELSE
            v_remaining_attempts := 3 - v_log.failed_attempts;
            RETURN jsonb_build_object(
                'success', false,
                'locked', false,
                'remaining_attempts', v_remaining_attempts,
                'error', format('ভুল রেফারেল কোড! (আর %s বার চেষ্টা করা যাবে)', v_remaining_attempts)
            );
        END IF;
    END IF;

    -- E. Cannot redeem own code
    IF v_referral.owner_id = p_user_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'তুমি নিজের রেফারেল কোড ব্যবহার করতে পারবে না!'
        );
    END IF;

    -- F. Code is valid! Execute transaction
    PERFORM public.redeem_referral_tx(v_referral.id, p_user_id);

    -- Reset failed attempts on success
    INSERT INTO public.referral_attempt_logs (user_id, failed_attempts, locked_until, last_attempt_at)
    VALUES (p_user_id, 0, NULL, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET failed_attempts = 0, locked_until = NULL, last_attempt_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'remaining_attempts', 3,
        'message', 'রেফারেল কোড সফলভাবে ক্লেইম করা হয়েছে! আপনি ১ মাসের প্রিমিয়াম এক্সেস পেয়েছেন। 🎉'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Status getter RPC
CREATE OR REPLACE FUNCTION public.get_referral_attempt_status(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_log RECORD;
    v_lock_seconds INT := 0;
    v_remaining INT := 3;
BEGIN
    SELECT * INTO v_log
    FROM public.referral_attempt_logs
    WHERE user_id = p_user_id;

    IF v_log.user_id IS NOT NULL THEN
        IF v_log.locked_until IS NOT NULL AND v_log.locked_until > NOW() THEN
            v_lock_seconds := EXTRACT(EPOCH FROM (v_log.locked_until - NOW()))::INT;
            v_remaining := 0;
        ELSIF v_log.locked_until IS NOT NULL AND v_log.locked_until <= NOW() THEN
            UPDATE public.referral_attempt_logs
            SET failed_attempts = 0, locked_until = NULL, last_attempt_at = NOW()
            WHERE user_id = p_user_id;
            v_remaining := 3;
        ELSE
            v_remaining := GREATEST(0, 3 - v_log.failed_attempts);
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'remaining_attempts', v_remaining,
        'lock_seconds', v_lock_seconds
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.redeem_referral_by_code(TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_referral_attempt_status(UUID) TO authenticated, service_role;
