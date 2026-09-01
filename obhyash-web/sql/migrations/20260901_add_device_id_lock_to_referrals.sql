-- ==============================================================================
-- MIGRATION: ADD DEVICE ID LOCK TO REFERRAL REDEMPTION (30-DAY PER-DEVICE LIMIT)
-- ==============================================================================

-- 1. Add device_id column to referral_history if it does not exist
ALTER TABLE public.referral_history 
ADD COLUMN IF NOT EXISTS device_id text;

-- Create an index on device_id and redeemed_at for fast anti-fraud lookups
CREATE INDEX IF NOT EXISTS idx_referral_history_device_id 
ON public.referral_history(device_id, redeemed_at DESC) 
WHERE device_id IS NOT NULL;

-- 2. Core transaction function for referral redemption with Device Lock
CREATE OR REPLACE FUNCTION public.redeem_referral_tx(
    p_referral_id uuid,
    p_redeemer_id uuid,
    p_device_id text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    v_owner_id uuid;
    v_total_successful_referrals int;
    v_redeemer_exp timestamptz;
    v_owner_exp timestamptz;
    v_now timestamptz := now();
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

    -- 5. ANOMALY DETECTION: Check if this referral code had 10+ claims in last 1 hour
    DECLARE
        v_hourly_claims int;
        v_is_anomaly boolean := false;
        v_admin_id uuid;
    BEGIN
        SELECT count(*) INTO v_hourly_claims
        FROM public.referral_history
        WHERE referral_id = p_referral_id
          AND redeemed_at > (v_now - interval '1 hour');

        IF v_hourly_claims >= 10 THEN
            v_is_anomaly := true;
        END IF;

        -- Record referral redemption history
        INSERT INTO public.referral_history (
            referral_id,
            redeemed_by,
            redeemed_at,
            admin_status,
            reward_given,
            device_id
        ) VALUES (
            p_referral_id,
            p_redeemer_id,
            v_now,
            CASE WHEN v_is_anomaly THEN 'Pending Review' ELSE 'Approved' END,
            NOT v_is_anomaly,
            NULLIF(trim(p_device_id), '')
        );

        -- If Anomaly detected, send alert to Admins and skip automatic owner reward
        IF v_is_anomaly THEN
            -- Alert all admins
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

            -- Notify owner about pending review
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
            -- Normal notification for code owner
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                type,
                created_at
            ) VALUES (
                v_owner_id,
                'নতুন সফল রেফারেল! 🎉',
                'তোমার রেফারেল কোড ব্যবহার করে একজন শিক্ষার্থী যুক্ত হয়েছে! তোমার অ্যাকাউন্টে ৭ দিনের প্রো মেম্বারশিপ যোগ করা হয়েছে।',
                'referral',
                v_now
            );
        END IF;
    END;

    -- 6. Insert notification for redeemer (new user)
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

    -- 7. Give REDEEMER 15 DAYS of Pro subscription (add to current expiry if active)
    SELECT subscription_expires_at INTO v_redeemer_exp
    FROM public.users
    WHERE id = p_redeemer_id;

    IF v_redeemer_exp IS NULL OR v_redeemer_exp < v_now THEN
        v_redeemer_exp := v_now + interval '15 days';
    ELSE
        v_redeemer_exp := v_redeemer_exp + interval '15 days';
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

    -- 8. Give CODE OWNER 7 DAYS of Pro subscription (ONLY IF NOT ANOMALY)
    IF NOT EXISTS (
        SELECT 1 FROM public.referral_history 
        WHERE referral_id = p_referral_id AND redeemed_by = p_redeemer_id AND admin_status = 'Pending Review'
    ) THEN
        SELECT subscription_expires_at INTO v_owner_exp
        FROM public.users
        WHERE id = v_owner_id;

        IF v_owner_exp IS NULL OR v_owner_exp < v_now THEN
            v_owner_exp := v_now + interval '7 days';
        ELSE
            v_owner_exp := v_owner_exp + interval '7 days';
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

        -- Add reward record to subscription_history for owner
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
            'প্রো সাবস্ক্রিপশন (৭ দিন রেফারেল বোনাস)',
            0,
            '৳',
            'completed',
            'referral_owner_bonus'
        );

        -- Check if code owner qualifies for a SCRATCH CARD (1 scratch card per 3 referrals)
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
                'অভিনন্দন! প্রতি ৩ জন শিক্ষার্থী রেফার করার মাইলস্টোন পূর্ণ হওয়ায় তুমি ১টি নতুন সারপ্রাইজ স্ক্র্যাচ কার্ড পেয়েছ!',
                'referral',
                v_now
            );
        END IF;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Wrapper RPC for Code Redemption with Device Lock and Rate Limiting
CREATE OR REPLACE FUNCTION public.redeem_referral_by_code(
    p_code text,
    p_user_id uuid,
    p_device_id text DEFAULT NULL
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
        PERFORM public.redeem_referral_tx(v_ref.id, p_user_id, p_device_id);

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
