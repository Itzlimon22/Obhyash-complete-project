-- ============================================================================
-- MIGRATION: Update Referral Rules: 15 Days for Redeemer, 7 Days for Owner,
--            3-Minute Lockout, Monthly 1-Redeem Cooldown, Scratch Card every 3 Referrals
-- ============================================================================

-- 1. Ensure scratch_cards table exists
CREATE TABLE IF NOT EXISTS public.scratch_cards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    reward_type text,
    is_scratched boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    scratched_at timestamptz
);

ALTER TABLE public.scratch_cards ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own scratch cards" ON public.scratch_cards;
    CREATE POLICY "Users can view their own scratch cards"
        ON public.scratch_cards FOR SELECT
        USING (auth.uid() = user_id);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 2. Core transaction function for referral redemption
CREATE OR REPLACE FUNCTION public.redeem_referral_tx(
    p_referral_id uuid,
    p_redeemer_id uuid
) RETURNS void AS $$
DECLARE
    v_owner_id uuid;
    v_total_successful_referrals int;
    v_redeemer_exp timestamptz;
    v_owner_exp timestamptz;
    v_now timestamptz := now();
BEGIN
    -- 1. Verify referral exists and get owner
    SELECT owner_id INTO v_owner_id FROM public.referrals WHERE id = p_referral_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referral not found' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Prevent self-referral
    IF v_owner_id = p_redeemer_id THEN
        RAISE EXCEPTION 'Cannot redeem own referral code' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Check if redeemer already claimed a referral in the last 30 days
    IF EXISTS (
        SELECT 1 FROM public.referral_history
        WHERE redeemed_by = p_redeemer_id
          AND redeemed_at > v_now - INTERVAL '30 days'
    ) THEN
        RAISE EXCEPTION 'User has already redeemed a referral code this month' USING ERRCODE = 'P0003';
    END IF;

    -- 4. Insert history record (Approved immediately)
    INSERT INTO public.referral_history (
        id, referral_id, redeemed_by, redeemed_at, admin_status, reward_given
    ) VALUES (
        gen_random_uuid(), p_referral_id, p_redeemer_id, v_now, 'Approved', true
    );

    -- 5. Give Redeemer 15 Days Free Pro (Stacking on existing if active)
    SELECT 
        CASE 
            WHEN subscription_expires_at IS NOT NULL AND subscription_expires_at > v_now 
                THEN subscription_expires_at 
            WHEN (subscription->>'expiry') IS NOT NULL AND (subscription->>'expiry')::timestamptz > v_now 
                THEN (subscription->>'expiry')::timestamptz 
            ELSE v_now 
        END INTO v_redeemer_exp
    FROM public.users WHERE id = p_redeemer_id;

    v_redeemer_exp := COALESCE(v_redeemer_exp, v_now) + INTERVAL '15 days';

    UPDATE public.users 
    SET 
        is_subscribed = true,
        subscription_status = 'active',
        subscription_expires_at = v_redeemer_exp,
        plan = 'Pro',
        level = 'Pro',
        subscription = jsonb_build_object(
            'plan', 'Pro',
            'status', 'Active',
            'expiry', to_char(v_redeemer_exp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'source', 'referral_bonus'
        )
    WHERE id = p_redeemer_id;

    -- Insert into subscription_history for redeemer
    INSERT INTO public.subscription_history (
        user_id, started_at, expires_at, is_active, duration_days, amount, payment_method, status
    ) VALUES (
        p_redeemer_id, v_now, v_redeemer_exp, true, 15, 0, 'referral_bonus', 'completed'
    );

    -- 6. Give Code Owner 7 Days Free Pro (Stacking on existing if active)
    SELECT 
        CASE 
            WHEN subscription_expires_at IS NOT NULL AND subscription_expires_at > v_now 
                THEN subscription_expires_at 
            WHEN (subscription->>'expiry') IS NOT NULL AND (subscription->>'expiry')::timestamptz > v_now 
                THEN (subscription->>'expiry')::timestamptz 
            ELSE v_now 
        END INTO v_owner_exp
    FROM public.users WHERE id = v_owner_id;

    v_owner_exp := COALESCE(v_owner_exp, v_now) + INTERVAL '7 days';

    UPDATE public.users 
    SET 
        is_subscribed = true,
        subscription_status = 'active',
        subscription_expires_at = v_owner_exp,
        plan = 'Pro',
        level = 'Pro',
        subscription = jsonb_build_object(
            'plan', 'Pro',
            'status', 'Active',
            'expiry', to_char(v_owner_exp, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'source', 'referral_bonus'
        )
    WHERE id = v_owner_id;

    -- Insert into subscription_history for owner
    INSERT INTO public.subscription_history (
        user_id, started_at, expires_at, is_active, duration_days, amount, payment_method, status
    ) VALUES (
        v_owner_id, v_now, v_owner_exp, true, 7, 0, 'referral_bonus', 'completed'
    );

    -- 7. Scratch Card for Owner: 1 card every 3 successful referrals
    SELECT COUNT(*) INTO v_total_successful_referrals
    FROM public.referral_history
    WHERE referral_id = p_referral_id AND admin_status = 'Approved';

    IF v_total_successful_referrals % 3 = 0 THEN
        INSERT INTO public.scratch_cards (user_id, is_scratched)
        VALUES (v_owner_id, false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atomic redemption with anti-brute-force rate limiting (3 failed attempts = 3 min lockout)
CREATE OR REPLACE FUNCTION public.redeem_referral_by_code(
    p_code TEXT,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_clean_code TEXT;
    v_log RECORD;
    v_referral RECORD;
    v_last_redeemed_at TIMESTAMPTZ;
    v_days_left INT;
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

    -- A. Check if user already claimed a referral in the last 30 days (1 month limit)
    SELECT redeemed_at INTO v_last_redeemed_at
    FROM public.referral_history
    WHERE redeemed_by = p_user_id
    ORDER BY redeemed_at DESC
    LIMIT 1;

    IF v_last_redeemed_at IS NOT NULL AND v_last_redeemed_at > NOW() - INTERVAL '30 days' THEN
        v_days_left := 30 - EXTRACT(DAY FROM (NOW() - v_last_redeemed_at))::INT;
        RETURN jsonb_build_object(
            'success', false,
            'error', format('তুমি গত ৩০ দিনে একটি রেফারেল কোড ব্যবহার করেছো। আগামী %s দিন পর আবার কোড ব্যবহার করতে পারবে।', GREATEST(1, v_days_left))
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
        INSERT INTO public.referral_attempt_logs (user_id, failed_attempts, locked_until, last_attempt_at)
        VALUES (p_user_id, 1, NULL, NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET failed_attempts = public.referral_attempt_logs.failed_attempts + 1,
            last_attempt_at = NOW()
        RETURNING * INTO v_log;

        IF v_log.failed_attempts >= 3 THEN
            -- Lock for 3 minutes as requested
            UPDATE public.referral_attempt_logs
            SET failed_attempts = 3,
                locked_until = NOW() + INTERVAL '3 minutes',
                last_attempt_at = NOW()
            WHERE user_id = p_user_id;

            RETURN jsonb_build_object(
                'success', false,
                'locked', true,
                'lock_seconds', 180,
                'remaining_attempts', 0,
                'error', 'পর পর ৩ বার ভুল কোড দেওয়া হয়েছে! আগামী ৩ মিনিটের জন্য রেফারেল ক্লেইম সাময়িকভাবে লক করা হলো।'
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
        'days_granted', 15,
        'message', 'রেফারেল কোড সফলভাবে ক্লেইম করা হয়েছে! আপনি ১৫ দিনের সম্পূর্ণ প্রো সাবস্ক্রিপশন পেয়েছেন। 🎉'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.redeem_referral_tx(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_referral_by_code(TEXT, UUID) TO authenticated, service_role;
