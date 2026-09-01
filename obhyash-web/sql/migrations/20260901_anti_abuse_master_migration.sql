-- ==============================================================================
-- MASTER ANTI-ABUSE & REFERRAL FRAUD PROTECTION MIGRATION
-- Incorporates:
-- 1. 15 Days for Redeemer (Instant)
-- 2. Engagement Barrier: Owner gets 7 Days Pro + Scratch Card ONLY after Friend completes 1st Exam
-- 3. 30-Day Device Lock (per-device limit)
-- 4. 24-Hour IP Rate Limit (Max 5 claims per IP/day)
-- 5. Anti-Brute-Force Lockout (3 wrong attempts = 3 min lockout)
-- 6. Anomaly Velocity Detection (10+ in 1 hour flagged for Admin Review)
-- ==============================================================================

-- 1. Ensure referral_history has device_id and ip_address columns
ALTER TABLE public.referral_history 
ADD COLUMN IF NOT EXISTS device_id text,
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_referral_history_device_id 
ON public.referral_history(device_id, redeemed_at DESC) 
WHERE device_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_referral_history_ip_address 
ON public.referral_history(ip_address, redeemed_at DESC) 
WHERE ip_address IS NOT NULL;

-- 2. Core transaction function for referral redemption
CREATE OR REPLACE FUNCTION public.redeem_referral_tx(
    p_referral_id uuid,
    p_redeemer_id uuid,
    p_device_id text DEFAULT NULL,
    p_ip_address text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_owner_id uuid;
    v_redeemer_exp timestamptz;
    v_now timestamptz := now();
    v_hourly_claims int;
    v_ip_claims int;
    v_is_anomaly boolean := false;
    v_admin_id uuid;
BEGIN
    -- 1. Verify referral exists and get owner
    SELECT owner_id INTO v_owner_id
    FROM public.referrals
    WHERE id = p_referral_id;

    IF v_owner_id IS NULL THEN
        RAISE EXCEPTION 'রেফারেল কোডটি পাওয়া যায়নি বা সঠিক নয়!';
    END IF;

    -- 2. Prevent self-referral
    IF v_owner_id = p_redeemer_id THEN
        RAISE EXCEPTION 'নিজের রেফারেল কোড নিজে ব্যবহার করা যাবে না!';
    END IF;

    -- 3. Check monthly cooldown for redeemer user (1 claim per 30 days)
    IF EXISTS (
        SELECT 1 FROM public.referral_history
        WHERE redeemed_by = p_redeemer_id
          AND redeemed_at > (v_now - interval '30 days')
    ) THEN
        RAISE EXCEPTION 'তুমি গত ৩০ দিনে একটি রেফারেল কোড ব্যবহার করেছো। আগামী ৩০ দিন পর আবার নতুন কোড ব্যবহার করতে পারবে।';
    END IF;

    -- 4. DEVICE LOCK: Check if this device has already claimed a referral in the last 30 days
    IF p_device_id IS NOT NULL AND trim(p_device_id) != '' THEN
        IF EXISTS (
            SELECT 1 FROM public.referral_history
            WHERE device_id = trim(p_device_id)
              AND redeemed_at > (v_now - interval '30 days')
        ) THEN
            RAISE EXCEPTION 'এই ডিভাইসে ইতিমধ্যে একটি রেফারেল কোড ব্যবহার করা হয়েছে। প্রতিটি ডিভাইসে প্রতি ৩০ দিনে কেবল ১টি রেফারেল কোড ক্লেইম করা যাবে।';
        END IF;
    END IF;

    -- 5. IP VELOCITY CHECK: Check if this IP had 5+ claims in last 24 hours
    IF p_ip_address IS NOT NULL AND trim(p_ip_address) != '' AND p_ip_address NOT IN ('127.0.0.1', '::1') THEN
        SELECT count(*) INTO v_ip_claims
        FROM public.referral_history
        WHERE ip_address = trim(p_ip_address)
          AND redeemed_at > (v_now - interval '24 hours');

        IF v_ip_claims >= 5 THEN
            RAISE EXCEPTION 'এই আইপি (IP) নেটওয়ার্ক থেকে গত ২৪ ঘণ্টায় সর্বোচ্চ সীমার (৫টি) বেশি রেফারেল ক্লেইম করা হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।';
        END IF;
    END IF;

    -- 6. ANOMALY DETECTION: Check if this referral code had 10+ claims in last 1 hour
    SELECT count(*) INTO v_hourly_claims
    FROM public.referral_history
    WHERE referral_id = p_referral_id
      AND redeemed_at > (v_now - interval '1 hour');

    IF v_hourly_claims >= 10 THEN
        v_is_anomaly := true;
    END IF;

    -- 7. Record referral redemption history
    -- Status is 'Pending Exam' (Waiting for friend to complete 1st exam before owner reward is unlocked)
    -- Or 'Pending Review' if high anomaly spike
    INSERT INTO public.referral_history (
        referral_id,
        redeemed_by,
        redeemed_at,
        admin_status,
        reward_given,
        device_id,
        ip_address
    ) VALUES (
        p_referral_id,
        p_redeemer_id,
        v_now,
        CASE WHEN v_is_anomaly THEN 'Pending Review' ELSE 'Pending Exam' END,
        false,
        NULLIF(trim(p_device_id), ''),
        NULLIF(trim(p_ip_address), '')
    );

    -- 8. Give REDEEMER 15 DAYS of Pro subscription IMMEDIATELY (Capped at 365 days max stacking from now)
    SELECT subscription_expires_at INTO v_redeemer_exp
    FROM public.users
    WHERE id = p_redeemer_id;

    IF v_redeemer_exp IS NULL OR v_redeemer_exp < v_now THEN
        v_redeemer_exp := v_now + interval '15 days';
    ELSE
        v_redeemer_exp := v_redeemer_exp + interval '15 days';
    END IF;

    -- Enforce 365-Day (12 Months) Max Stacking Cap
    IF v_redeemer_exp > (v_now + interval '365 days') THEN
        v_redeemer_exp := v_now + interval '365 days';
    END IF;

    UPDATE public.users
    SET is_subscribed = true,
        subscription_status = 'active',
        subscription_expires_at = v_redeemer_exp,
        subscription = jsonb_set(
            jsonb_set(
                jsonb_set(
                    COALESCE(subscription, '{}'::jsonb),
                    '{plan}',
                    '"Pro"'
                ),
                '{status}',
                '"Active"'
            ),
            '{expiry}',
            to_jsonb(v_redeemer_exp::text)
        )
    WHERE id = p_redeemer_id;

    -- Add redemption record to subscription_history for redeemer
    INSERT INTO public.subscription_history (
        user_id,
        plan_id,
        started_at,
        expires_at,
        is_active,
        plan_name,
        amount,
        currency,
        status,
        payment_method
    ) VALUES (
        p_redeemer_id,
        NULL,
        v_now,
        v_redeemer_exp,
        true,
        'প্রো সাবস্ক্রিপশন (১৫ দিন রেফারেল রিওয়ার্ড)',
        0,
        '৳',
        'completed',
        'referral_bonus'
    );

    -- 9. Insert notification for redeemer (new user)
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        created_at
    ) VALUES (
        p_redeemer_id,
        'রেফারেল প্রো সক্রিয়! 👑',
        'রেফারেল কোড ব্যবহারের মাধ্যমে তোমার অ্যাকাউন্টে ১৫ দিনের সম্পূর্ণ প্রো প্রিমিয়াম সাবস্ক্রিপশন যুক্ত হয়েছে!',
        'referral',
        v_now
    );

    -- 10. Send notification to referral owner (Code Owner)
    IF v_is_anomaly THEN
        FOR v_admin_id IN (
            SELECT id FROM public.users 
            WHERE lower(role) IN ('admin', 'superadmin')
        ) LOOP
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                created_at
            ) VALUES (
                v_admin_id,
                '🚨 অস্বাভাবিক রেফারেল স্পাইক (অ্যানোমালি অ্যালার্ট)',
                'রেফারেল আইডি: ' || p_referral_id::text || ' গত ১ ঘণ্টায় ১০টির বেশি ক্লেইম পেয়েছে। অতিরিক্ত বোনাস "Pending Review" স্ট্যাটাসে রাখা হয়েছে।',
                'fraud_alert',
                v_now
            );
        END LOOP;

        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            created_at
        ) VALUES (
            v_owner_id,
            'রেফারেল বোনাস পর্যালোচনাধীন ⏳',
            'অস্বাভাবিক দ্রুতগতির কারণে নিরাপত্তা স্বার্থে আপনার সর্বশেষ রেফারেল বোনাসটি অ্যাডমিন পর্যালোচনার জন্য রাখা হয়েছে।',
            'referral',
            v_now
        );
    ELSE
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            created_at
        ) VALUES (
            v_owner_id,
            'নতুন বন্ধু যুক্ত হয়েছে! 🎯',
            'তোমার রেফারেল কোড দিয়ে একজন বন্ধু যুক্ত হয়েছে! বন্ধু অন্তত ১টি মডেল টেস্ট বা পরীক্ষা সম্পন্ন করলেই তোমার অ্যাকাউন্টে ৭ দিন প্রো মেম্বারশিপ যোগ হবে।',
            'referral',
            v_now
        );
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Code redemption wrapper RPC
CREATE OR REPLACE FUNCTION public.redeem_referral_by_code(
    p_code text,
    p_user_id uuid,
    p_device_id text DEFAULT NULL,
    p_ip_address text DEFAULT NULL
) RETURNS json AS $$
DECLARE
    v_ref record;
    v_attempt record;
    v_clean_code text := upper(trim(p_code));
    v_now timestamptz := now();
    v_remaining_attempts int := 3;
    v_is_locked boolean := false;
    v_lock_seconds int := 0;
BEGIN
    -- Check anti-brute force lockout
    SELECT * INTO v_attempt
    FROM public.referral_claim_attempts
    WHERE user_id = p_user_id;

    IF v_attempt.lockout_until IS NOT NULL AND v_attempt.lockout_until > v_now THEN
        v_lock_seconds := EXTRACT(EPOCH FROM (v_attempt.lockout_until - v_now))::int;
        RETURN json_build_object(
            'success', false,
            'error', 'ভুল কোড দেওয়ার কারণে ইনপুট সাময়িকভাবে লক আছে। আর ' || (v_lock_seconds / 60)::text || ' মিনিট ' || (v_lock_seconds % 60)::text || ' সেকেন্ড অপেক্ষা করুন।',
            'locked', true,
            'lock_seconds', v_lock_seconds,
            'remaining_attempts', 0
        );
    END IF;

    -- DEVICE LOCK CHECK: Check if this device has already claimed in last 30 days
    IF p_device_id IS NOT NULL AND trim(p_device_id) != '' THEN
        IF EXISTS (
            SELECT 1 FROM public.referral_history
            WHERE device_id = trim(p_device_id)
              AND redeemed_at > (v_now - interval '30 days')
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'এই ডিভাইসে ইতিমধ্যে একটি রেফারেল কোড ব্যবহার করা হয়েছে। প্রতিটি ডিভাইসে প্রতি ৩০ দিনে কেবল ১টি রেফারেল কোড ক্লেইম করা যাবে।',
                'locked', false
            );
        END IF;
    END IF;

    -- IP VELOCITY CHECK: Check if 5+ claims from this IP in 24 hours
    IF p_ip_address IS NOT NULL AND trim(p_ip_address) != '' AND p_ip_address NOT IN ('127.0.0.1', '::1') THEN
        IF (SELECT count(*) FROM public.referral_history WHERE ip_address = trim(p_ip_address) AND redeemed_at > (v_now - interval '24 hours')) >= 5 THEN
            RETURN json_build_object(
                'success', false,
                'error', 'এই আইপি (IP) নেটওয়ার্ক থেকে গত ২৪ ঘণ্টায় সর্বোচ্চ সীমার (৫টি) বেশি রেফারেল ক্লেইম করা হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।',
                'locked', false
            );
        END IF;
    END IF;

    -- Find referral code
    SELECT * INTO v_ref
    FROM public.referrals
    WHERE code = v_clean_code;

    IF v_ref.id IS NULL THEN
        -- Record failed attempt
        IF v_attempt.user_id IS NULL THEN
            INSERT INTO public.referral_claim_attempts (user_id, failed_attempts, last_attempt_at)
            VALUES (p_user_id, 1, v_now);
            v_remaining_attempts := 2;
        ELSE
            IF v_attempt.failed_attempts + 1 >= 3 THEN
                UPDATE public.referral_claim_attempts
                SET failed_attempts = 0,
                    last_attempt_at = v_now,
                    lockout_until = v_now + interval '3 minutes'
                WHERE user_id = p_user_id;
                RETURN json_build_object(
                    'success', false,
                    'error', 'পর পর ৩ বার ভুল কোড দেওয়া হয়েছে! আগামী ৩ মিনিটের জন্য রেফারেল ক্লেইম সাময়িকভাবে লক করা হলো।',
                    'locked', true,
                    'lock_seconds', 180,
                    'remaining_attempts', 0
                );
            ELSE
                UPDATE public.referral_claim_attempts
                SET failed_attempts = failed_attempts + 1,
                    last_attempt_at = v_now
                WHERE user_id = p_user_id;
                v_remaining_attempts := 3 - (v_attempt.failed_attempts + 1);
            END IF;
        END IF;

        RETURN json_build_object(
            'success', false,
            'error', 'ভুল রেফারেল কোড! আর ' || v_remaining_attempts::text || ' বার চেষ্টা করা যাবে।',
            'locked', false,
            'remaining_attempts', v_remaining_attempts
        );
    END IF;

    -- Check if self referral
    IF v_ref.owner_id = p_user_id THEN
        RETURN json_build_object(
            'success', false,
            'error', 'তুমি নিজের রেফারেল কোড নিজে ব্যবহার করতে পারবে না!',
            'locked', false
        );
    END IF;

    -- Check monthly claim limit
    IF EXISTS (
        SELECT 1 FROM public.referral_history
        WHERE redeemed_by = p_user_id
          AND redeemed_at > (v_now - interval '30 days')
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'তুমি গত ৩০ দিনে একটি রেফারেল কোড ব্যবহার করেছো। আগামী ৩০ দিন পর আবার নতুন কোড ব্যবহার করতে পারবে।',
            'locked', false
        );
    END IF;

    -- Successful redemption
    BEGIN
        PERFORM public.redeem_referral_tx(v_ref.id, p_user_id, p_device_id, p_ip_address);

        -- Reset failed attempts
        UPDATE public.referral_claim_attempts
        SET failed_attempts = 0,
            lockout_until = NULL,
            last_attempt_at = v_now
        WHERE user_id = p_user_id;

        RETURN json_build_object(
            'success', true,
            'message', 'অভিনন্দন! রেফারেল কোড সফলভাবে যুক্ত হয়েছে এবং ১৫ দিনের প্রো সাবস্ক্রিপশন সক্রিয় হয়েছে। 🎉'
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM,
            'locked', false
        );
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER: AUTO-REWARD REFERRER WHEN FRIEND COMPLETES 1ST EXAM
CREATE OR REPLACE FUNCTION public.check_and_reward_referrer_on_exam()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid := NEW.user_id;
    v_ref_history record;
    v_owner_id uuid;
    v_owner_exp timestamptz;
    v_total_successful_referrals int;
    v_now timestamptz := now();
    v_redeemer_name text;
BEGIN
    -- Find any pending referral redemption for this student where owner reward has not been granted yet
    FOR v_ref_history IN (
        SELECT rh.id, rh.referral_id, r.owner_id
        FROM public.referral_history rh
        JOIN public.referrals r ON r.id = rh.referral_id
        WHERE rh.redeemed_by = v_user_id
          AND rh.reward_given = false
          AND rh.admin_status IN ('Pending Exam', 'Approved', 'Pending')
    ) LOOP
        v_owner_id := v_ref_history.owner_id;

        -- 1. Mark referral as approved and completed
        UPDATE public.referral_history
        SET admin_status = 'Approved',
            reward_given = true,
            completed_at = v_now
        WHERE id = v_ref_history.id;

        -- 2. Give Code Owner 7 DAYS Pro subscription
        SELECT subscription_expires_at INTO v_owner_exp
        FROM public.users
        WHERE id = v_owner_id;

        IF v_owner_exp IS NULL OR v_owner_exp < v_now THEN
            v_owner_exp := v_now + interval '7 days';
        ELSE
            v_owner_exp := v_owner_exp + interval '7 days';
        END IF;

        -- Enforce 365-Day (12 Months) Max Stacking Cap
        IF v_owner_exp > (v_now + interval '365 days') THEN
            v_owner_exp := v_now + interval '365 days';
        END IF;

        UPDATE public.users
        SET is_subscribed = true,
            subscription_status = 'active',
            subscription_expires_at = v_owner_exp,
            subscription = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        COALESCE(subscription, '{}'::jsonb),
                        '{plan}',
                        '"Pro"'
                    ),
                    '{status}',
                    '"Active"'
                ),
                '{expiry}',
                to_jsonb(v_owner_exp::text)
            )
        WHERE id = v_owner_id;

        -- Record in subscription_history for owner
        INSERT INTO public.subscription_history (
            user_id,
            plan_id,
            started_at,
            expires_at,
            is_active,
            plan_name,
            amount,
            currency,
            status,
            payment_method
        ) VALUES (
            v_owner_id,
            NULL,
            v_now,
            v_owner_exp,
            true,
            'প্রো সাবস্ক্রিপশন (৭ দিন রেফারেল বোনাস - বন্ধু ১ম পরীক্ষা সম্পন্ন করেছে)',
            0,
            '৳',
            'completed',
            'referral_owner_bonus'
        );

        -- 3. Get redeemer student name
        SELECT name INTO v_redeemer_name
        FROM public.users
        WHERE id = v_user_id;

        -- 4. Check scratch cards milestone (1 scratch card per 3 completed referrals)
        SELECT count(*) INTO v_total_successful_referrals
        FROM public.referral_history rh
        JOIN public.referrals r ON r.id = rh.referral_id
        WHERE r.owner_id = v_owner_id
          AND rh.reward_given = true;

        IF (v_total_successful_referrals % 3) = 0 THEN
            INSERT INTO public.scratch_cards (
                user_id,
                reward_type,
                is_scratched,
                created_at
            ) VALUES (
                v_owner_id,
                CASE (floor(random() * 3))::int
                    WHEN 0 THEN '1_month_free'
                    WHEN 1 THEN '50_percent_off'
                    ELSE '2_months_free'
                END,
                false,
                v_now
            );

            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                created_at
            ) VALUES (
                v_owner_id,
                'নতুন স্ক্র্যাচ কার্ড আনলক! 🎁',
                'তোমার রেফার করা বন্ধু ' || COALESCE(v_redeemer_name, 'শিক্ষার্থী') || ' প্রথম পরীক্ষা সম্পন্ন করেছে! ৩টি সফল রেফারেল পূর্ণ হওয়ায় তুমি ৭ দিন প্রো এবং ১টি নতুন স্ক্র্যাচ কার্ড পেয়েছ!',
                'referral',
                v_now
            );
        ELSE
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                created_at
            ) VALUES (
                v_owner_id,
                'রেফারেল বোনাস সক্রিয়! 👑',
                'তোমার রেফার করা বন্ধু ' || COALESCE(v_redeemer_name, 'শিক্ষার্থী') || ' প্রথম পরীক্ষা সম্পন্ন করেছে! তোমার অ্যাকাউন্টে ৭ দিনের ফ্রি প্রো যোগ হয়েছে। 🎉',
                'referral',
                v_now
            );
        END IF;

    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to exam_results table (handles model tests, chapter practice & subject exams)
DROP TRIGGER IF EXISTS trg_reward_referrer_on_exam ON public.exam_results;
CREATE TRIGGER trg_reward_referrer_on_exam
AFTER INSERT ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.check_and_reward_referrer_on_exam();

-- Also attach trigger to live_exam_practice_history table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'live_exam_practice_history') THEN
        DROP TRIGGER IF EXISTS trg_reward_referrer_on_practice ON public.live_exam_practice_history;
        CREATE TRIGGER trg_reward_referrer_on_practice
        AFTER INSERT ON public.live_exam_practice_history
        FOR EACH ROW
        EXECUTE FUNCTION public.check_and_reward_referrer_on_exam();
    END IF;
END $$;
