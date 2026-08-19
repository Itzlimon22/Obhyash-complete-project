-- ==============================================================================
-- Migration: 20260818_anti_spam_protection.sql
-- Description: Comprehensive anti-spam protections for app_complaints and app_feature_requests
-- Features:
--   1. Rate Limiting / 3-minute Cooldown per user
--   2. Max 5 Submissions per 24 hours per user
--   3. Max 3 Pending Submissions limit
--   4. Duplicate text submission detection (7 days window)
--   5. Minimum (15 chars) and Maximum (1000 chars) length constraints
-- ==============================================================================

-- 1. Anti-Spam Trigger Function for app_complaints
CREATE OR REPLACE FUNCTION public.check_complaint_anti_spam()
RETURNS TRIGGER AS $$
DECLARE
    v_pending_count INT;
    v_recent_count INT;
    v_last_submitted_at TIMESTAMPTZ;
    v_duplicate_exists BOOLEAN;
    v_desc_len INT;
BEGIN
    v_desc_len := LENGTH(TRIM(NEW.description));

    -- Rule 5: Min & Max Length check
    IF v_desc_len < 15 THEN
        RAISE EXCEPTION 'মতামতের বিবরণ কমপক্ষে ১৫ অক্ষর হতে হবে।';
    END IF;
    IF v_desc_len > 1000 THEN
        RAISE EXCEPTION 'মতামতের বিবরণ সর্বোচ্চ ১০০০ অক্ষরের মধ্যে হতে হবে।';
    END IF;

    -- Rule 1: Cooldown check (3 minutes)
    SELECT created_at INTO v_last_submitted_at
    FROM public.app_complaints
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_submitted_at IS NOT NULL AND v_last_submitted_at > NOW() - INTERVAL '3 minutes' THEN
        RAISE EXCEPTION 'অনুগ্রহ করে পরবর্তী বার্তা পাঠানোর জন্য ৩ মিনিট অপেক্ষা করুন।';
    END IF;

    -- Rule 2: Daily limit check (Max 5 submissions in last 24 hours)
    SELECT COUNT(*) INTO v_recent_count
    FROM public.app_complaints
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '24 hours';

    IF v_recent_count >= 5 THEN
        RAISE EXCEPTION 'আজকের জন্য আপনার আবেদনের দৈনিক সীমা (৫টি) পূর্ণ হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।';
    END IF;

    -- Rule 3: Max Pending requests limit (Max 3 Pending / In Progress)
    SELECT COUNT(*) INTO v_pending_count
    FROM public.app_complaints
    WHERE user_id = NEW.user_id
      AND status IN ('Pending', 'In Progress');

    IF v_pending_count >= 3 THEN
        RAISE EXCEPTION 'আপনার ৩টি আবেদন বর্তমানে প্রক্রিয়াধীন আছে। নতুন বার্তা পাঠানোর পূর্বে সেগুলোর সমাধান হওয়া পর্যন্ত অপেক্ষা করুন।';
    END IF;

    -- Rule 4: Duplicate text detection in last 7 days
    SELECT EXISTS (
        SELECT 1
        FROM public.app_complaints
        WHERE user_id = NEW.user_id
          AND LOWER(TRIM(description)) = LOWER(TRIM(NEW.description))
          AND created_at > NOW() - INTERVAL '7 days'
    ) INTO v_duplicate_exists;

    IF v_duplicate_exists THEN
        RAISE EXCEPTION 'আপনি ইতিপূর্বে হুবহু একই বিবরণ পাঠিয়েছেন। নতুন কোনো তথ্য থাকলে তা উল্লেখ করুন।';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to app_complaints
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_complaints') THEN
        DROP TRIGGER IF EXISTS trg_check_complaint_anti_spam ON public.app_complaints;
        CREATE TRIGGER trg_check_complaint_anti_spam
        BEFORE INSERT ON public.app_complaints
        FOR EACH ROW
        EXECUTE FUNCTION public.check_complaint_anti_spam();
    END IF;
END $$;


-- 2. Anti-Spam Trigger Function for app_feature_requests
CREATE OR REPLACE FUNCTION public.check_feature_request_anti_spam()
RETURNS TRIGGER AS $$
DECLARE
    v_pending_count INT;
    v_recent_count INT;
    v_last_submitted_at TIMESTAMPTZ;
    v_duplicate_exists BOOLEAN;
    v_title_len INT;
    v_desc_len INT;
BEGIN
    v_title_len := LENGTH(TRIM(NEW.title));
    v_desc_len := LENGTH(TRIM(NEW.description));

    -- Rule 5: Min & Max Length check
    IF v_title_len < 5 THEN
        RAISE EXCEPTION 'ফিচারের শিরোনাম কমপক্ষে ৫ অক্ষর হতে হবে।';
    END IF;
    IF v_desc_len < 15 THEN
        RAISE EXCEPTION 'ফিচারের বিবরণ কমপক্ষে ১৫ অক্ষর হতে হবে।';
    END IF;
    IF v_desc_len > 1000 THEN
        RAISE EXCEPTION 'ফিচারের বিবরণ সর্বোচ্চ ১০০০ অক্ষরের মধ্যে হতে হবে।';
    END IF;

    -- Rule 1: Cooldown check (3 minutes)
    SELECT created_at INTO v_last_submitted_at
    FROM public.app_feature_requests
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_submitted_at IS NOT NULL AND v_last_submitted_at > NOW() - INTERVAL '3 minutes' THEN
        RAISE EXCEPTION 'অনুগ্রহ করে পরবর্তী ফিচার রিকোয়েস্ট পাঠানোর জন্য ৩ মিনিট অপেক্ষা করুন।';
    END IF;

    -- Rule 2: Daily limit check (Max 5 submissions in last 24 hours)
    SELECT COUNT(*) INTO v_recent_count
    FROM public.app_feature_requests
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '24 hours';

    IF v_recent_count >= 5 THEN
        RAISE EXCEPTION 'আজকের জন্য আপনার ফিচার রিকোয়েস্টের দৈনিক সীমা (৫টি) পূর্ণ হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।';
    END IF;

    -- Rule 3: Max Pending requests limit (Max 3 Under Review / In Progress)
    SELECT COUNT(*) INTO v_pending_count
    FROM public.app_feature_requests
    WHERE user_id = NEW.user_id
      AND status IN ('Under Review', 'In Progress');

    IF v_pending_count >= 3 THEN
        RAISE EXCEPTION 'আপনার ৩টি ফিচার রিকোয়েস্ট বর্তমানে পর্যালোচনায় আছে। নতুন রিকোয়েস্ট পাঠানোর পূর্বে সেগুলোর সমাপ্তি পর্যন্ত অপেক্ষা করুন।';
    END IF;

    -- Rule 4: Duplicate title/text detection in last 7 days
    SELECT EXISTS (
        SELECT 1
        FROM public.app_feature_requests
        WHERE user_id = NEW.user_id
          AND (LOWER(TRIM(title)) = LOWER(TRIM(NEW.title)) OR LOWER(TRIM(description)) = LOWER(TRIM(NEW.description)))
          AND created_at > NOW() - INTERVAL '7 days'
    ) INTO v_duplicate_exists;

    IF v_duplicate_exists THEN
        RAISE EXCEPTION 'আপনি ইতিপূর্বে হুবহু একই ফিচারের প্রস্তাব পাঠিয়েছেন।';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to app_feature_requests
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_feature_requests') THEN
        DROP TRIGGER IF EXISTS trg_check_feature_request_anti_spam ON public.app_feature_requests;
        CREATE TRIGGER trg_check_feature_request_anti_spam
        BEFORE INSERT ON public.app_feature_requests
        FOR EACH ROW
        EXECUTE FUNCTION public.check_feature_request_anti_spam();
    END IF;
END $$;


-- 3. Smart & Friendly Anti-Spam Trigger Function for public.reports (Question Reports)
CREATE OR REPLACE FUNCTION public.check_question_report_anti_spam()
RETURNS TRIGGER AS $$
DECLARE
    v_recent_count INT;
    v_duplicate_pending BOOLEAN;
    v_last_submitted_at TIMESTAMPTZ;
    v_desc_len INT;
BEGIN
    -- If guest submission, skip user-based rate limit
    IF NEW.reporter_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Description length check (optional field, max 500 chars)
    IF NEW.description IS NOT NULL THEN
        v_desc_len := LENGTH(TRIM(NEW.description));
        IF v_desc_len > 500 THEN
            RAISE EXCEPTION 'মন্তব্যের বিবরণ সর্বোচ্চ ৫০০ অক্ষরের মধ্যে হতে হবে।';
        END IF;
    END IF;

    -- Rule 1: No duplicate pending report on the exact same question
    SELECT EXISTS (
        SELECT 1
        FROM public.reports
        WHERE reporter_id = NEW.reporter_id
          AND question_id = NEW.question_id
          AND status = 'Pending'
    ) INTO v_duplicate_pending;

    IF v_duplicate_pending THEN
        RAISE EXCEPTION 'এই প্রশ্নটিতে আপনার রিপোর্ট ইতিমধ্যে পেন্ডিং রয়েছে। আমাদের টিম এটি যাচাই করছে।';
    END IF;

    -- Rule 2: 15-second micro-cooldown between reports (Prevents rapid-fire / automated spam)
    SELECT created_at INTO v_last_submitted_at
    FROM public.reports
    WHERE reporter_id = NEW.reporter_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_submitted_at IS NOT NULL AND v_last_submitted_at > NOW() - INTERVAL '15 seconds' THEN
        RAISE EXCEPTION 'অনুগ্রহ করে পরবর্তী প্রশ্ন রিপোর্টের জন্য কয়েক সেকেন্ড অপেক্ষা করুন।';
    END IF;

    -- Rule 3: Generous daily limit check (Max 30 question reports in 24 hours)
    SELECT COUNT(*) INTO v_recent_count
    FROM public.reports
    WHERE reporter_id = NEW.reporter_id
      AND created_at > NOW() - INTERVAL '24 hours';

    IF v_recent_count >= 30 THEN
        RAISE EXCEPTION 'আজকের জন্য প্রশ্ন রিপোর্টের সর্বোচ্চ সীমা (৩০টি) পূর্ণ হয়েছে।';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to public.reports
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
        DROP TRIGGER IF EXISTS trg_check_question_report_anti_spam ON public.reports;
        CREATE TRIGGER trg_check_question_report_anti_spam
        BEFORE INSERT ON public.reports
        FOR EACH ROW
        EXECUTE FUNCTION public.check_question_report_anti_spam();
    END IF;
END $$;


-- 4. High-Security Anti-Fraud & Anti-Spam Trigger Function for payment_requests
CREATE OR REPLACE FUNCTION public.check_payment_request_security()
RETURNS TRIGGER AS $$
DECLARE
    v_clean_trx TEXT;
    v_pending_exists BOOLEAN;
    v_duplicate_trx_exists BOOLEAN;
    v_recent_attempts INT;
    v_last_submitted_at TIMESTAMPTZ;
BEGIN
    -- Normalize TrxID
    v_clean_trx := UPPER(TRIM(COALESCE(NEW.transaction_id, '')));
    NEW.transaction_id := v_clean_trx;

    -- Rule 1: TrxID Basic Syntax & Length (6 to 25 uppercase alphanumeric characters)
    IF v_clean_trx = '' OR LENGTH(v_clean_trx) < 6 OR LENGTH(v_clean_trx) > 25 THEN
        RAISE EXCEPTION 'সঠিক ট্রানজেকশন আইডি (TrxID) প্রদান করুন (ন্যূনতম ৬ ও সর্বোচ্চ ২৫ অক্ষর)।';
    END IF;

    IF NOT (v_clean_trx ~ '^[A-Z0-9]+$') THEN
        RAISE EXCEPTION 'ট্রানজেকশন আইডিতে (TrxID) শুধুমাত্র ইংরেজি অক্ষর ও সংখ্যা ব্যবহার করা যাবে।';
    END IF;

    -- Disallow known dummy/trivial test TrxIDs
    IF v_clean_trx IN ('123456', '12345678', '00000000', 'AAAAAAAA', 'TEST1234', 'ASDFGHJK', 'ABCDEF1234', '11111111', '1234567890', 'TRANSACTION') THEN
        RAISE EXCEPTION 'অনুগ্রহ করে পেমেন্ট করার পর প্রাপ্ত আসল ট্রানজেকশন আইডি (TrxID) প্রদান করুন।';
    END IF;

    -- Rule 2: Max 1 Active Pending Payment Request per User
    SELECT EXISTS (
        SELECT 1
        FROM public.payment_requests
        WHERE user_id = NEW.user_id
          AND status = 'Pending'
    ) INTO v_pending_exists;

    IF v_pending_exists THEN
        RAISE EXCEPTION 'আপনার একটি পেমেন্ট রিকোয়েস্ট ইতিমধ্যে প্রক্রিয়াধীন আছে। সেটি যাচাই সম্পন্ন হওয়া পর্যন্ত অপেক্ষা করুন।';
    END IF;

    -- Rule 3: Global Unique TrxID Check (Prevent reusing or stealing already submitted TrxIDs)
    SELECT EXISTS (
        SELECT 1
        FROM public.payment_requests
        WHERE UPPER(TRIM(transaction_id)) = v_clean_trx
          AND status IN ('Approved', 'Pending')
    ) INTO v_duplicate_trx_exists;

    IF v_duplicate_trx_exists THEN
        RAISE EXCEPTION 'এই ট্রানজেকশন আইডিটি (TrxID) ইতিমধ্যে ব্যবহার করা হয়েছে। অনুগ্রহ করে সঠিক TrxID দিন।';
    END IF;

    -- Rule 4: Cooldown Check (2 minutes between payment attempts per user)
    SELECT created_at INTO v_last_submitted_at
    FROM public.payment_requests
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_submitted_at IS NOT NULL AND v_last_submitted_at > NOW() - INTERVAL '2 minutes' THEN
        RAISE EXCEPTION 'অনুগ্রহ করে পরবর্তী পেমেন্ট রিকোয়েস্টের জন্য ২ মিনিট অপেক্ষা করুন।';
    END IF;

    -- Rule 5: Daily Limit Check (Max 3 payment requests per user in 24 hours)
    SELECT COUNT(*) INTO v_recent_attempts
    FROM public.payment_requests
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '24 hours';

    IF v_recent_attempts >= 3 THEN
        RAISE EXCEPTION 'আজকের জন্য আপনার পেমেন্ট রিকোয়েস্ট সীমা (৩টি) পূর্ণ হয়েছে। সহায়তার জন্য সাপোর্টে যোগাযোগ করুন।';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to public.payment_requests
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_requests') THEN
        DROP TRIGGER IF EXISTS trg_check_payment_request_security ON public.payment_requests;
        CREATE TRIGGER trg_check_payment_request_security
        BEFORE INSERT ON public.payment_requests
        FOR EACH ROW
        EXECUTE FUNCTION public.check_payment_request_security();
    END IF;
END $$;

-- 5. Support 'Cancelled' status so users can cancel mistake submissions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payment_requests') THEN
        ALTER TABLE public.payment_requests 
        DROP CONSTRAINT IF EXISTS payment_requests_status_check;

        ALTER TABLE public.payment_requests 
        ADD CONSTRAINT payment_requests_status_check 
        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled'));

        -- Policy: Allow users to cancel their own pending payment requests
        DROP POLICY IF EXISTS "Users can cancel their own pending payment requests" ON public.payment_requests;
        CREATE POLICY "Users can cancel their own pending payment requests"
        ON public.payment_requests
        FOR UPDATE
        USING (auth.uid() = user_id AND status = 'Pending')
        WITH CHECK (auth.uid() = user_id AND status = 'Cancelled');
    END IF;
END $$;


-- 6. Anti-Brute-Force Protection for Referral Code Redemption (3 failed attempts = 10 min lockout)
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

-- Secure RPC for redeeming referral code with anti-brute-force lockout
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
        RAISE EXCEPTION 'অনুগ্রহ করে রেফারেল কোড লিখুন।';
    END IF;

    -- 1. Check existing lockout
    SELECT * INTO v_log
    FROM public.referral_attempt_logs
    WHERE user_id = p_user_id;

    IF v_log.locked_until IS NOT NULL AND v_log.locked_until > NOW() THEN
        v_lock_seconds := EXTRACT(EPOCH FROM (v_log.locked_until - NOW()))::INT;
        RAISE EXCEPTION 'ভুল কোড দেওয়ার কারণে রেফারেল ইনপুট সাময়িকভাবে লক আছে। আর % মিনিট % সেকেন্ড অপেক্ষা করুন।', 
            (v_lock_seconds / 60), (v_lock_seconds % 60);
    END IF;

    -- 2. Lookup referral code
    SELECT * INTO v_referral
    FROM public.referrals
    WHERE UPPER(TRIM(code)) = v_clean_code;

    -- 3. If code not found (Invalid attempt)
    IF v_referral IS NULL THEN
        -- If previous lockout expired, reset failed count
        IF v_log.locked_until IS NOT NULL AND v_log.locked_until <= NOW() THEN
            v_log.failed_attempts := 0;
        END IF;

        IF v_log.user_id IS NULL THEN
            INSERT INTO public.referral_attempt_logs (user_id, failed_attempts, last_attempt_at)
            VALUES (p_user_id, 1, NOW());
            v_remaining_attempts := 2;
        ELSE
            IF v_log.failed_attempts + 1 >= 3 THEN
                -- Lock for 10 minutes
                UPDATE public.referral_attempt_logs
                SET failed_attempts = 0,
                    locked_until = NOW() + INTERVAL '10 minutes',
                    last_attempt_at = NOW()
                WHERE user_id = p_user_id;

                RAISE EXCEPTION 'পর পর ৩ বার ভুল কোড দেওয়া হয়েছে! আগামী ১০ মিনিটের জন্য রেফারেল ক্লেইম লক করা হলো।';
            ELSE
                UPDATE public.referral_attempt_logs
                SET failed_attempts = failed_attempts + 1,
                    last_attempt_at = NOW()
                WHERE user_id = p_user_id;
                v_remaining_attempts := 3 - (v_log.failed_attempts + 1);
            END IF;
        END IF;

        RAISE EXCEPTION 'ভুল রেফারেল কোড! (আর % বার চেষ্টা করা যাবে)', v_remaining_attempts;
    END IF;

    -- 4. If code is valid, execute transaction
    PERFORM public.redeem_referral_tx(v_referral.id, p_user_id);

    -- Reset failed attempts on success
    INSERT INTO public.referral_attempt_logs (user_id, failed_attempts, locked_until, last_attempt_at)
    VALUES (p_user_id, 0, NULL, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET failed_attempts = 0, locked_until = NULL, last_attempt_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'message', 'রেফারেল কোড সফলভাবে ক্লেইম করা হয়েছে! আপনি ১ মাসের প্রিমিয়াম এক্সেস পেয়েছেন। 🎉'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Anti-Spam Trigger for Blog Comments & Discussions
CREATE OR REPLACE FUNCTION public.check_blog_comment_anti_spam()
RETURNS TRIGGER AS $$
DECLARE
    v_clean_content TEXT;
    v_last_comment_at TIMESTAMPTZ;
    v_recent_comment_count INT;
    v_duplicate_exists BOOLEAN;
BEGIN
    v_clean_content := TRIM(COALESCE(NEW.content, ''));

    -- Rule 1: Minimum & Maximum Character Limit
    IF LENGTH(v_clean_content) < 3 THEN
        RAISE EXCEPTION 'কমেন্ট অন্তত ৩ অক্ষরের হতে হবে।';
    END IF;

    IF LENGTH(v_clean_content) > 1000 THEN
        RAISE EXCEPTION 'কমেন্ট সর্বোচ্চ ১০০০ অক্ষরের মধ্যে হতে হবে।';
    END IF;

    -- Rule 2: 20-Second Micro Cooldown per user
    SELECT created_at INTO v_last_comment_at
    FROM public.blog_comments
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_comment_at IS NOT NULL AND v_last_comment_at > NOW() - INTERVAL '20 seconds' THEN
        RAISE EXCEPTION 'অনুগ্রহ করে পরবর্তী কমেন্টের জন্য ২০ সেকেন্ড অপেক্ষা করুন।';
    END IF;

    -- Rule 3: Rate Limiting (Max 20 comments per hour per user)
    SELECT COUNT(*) INTO v_recent_comment_count
    FROM public.blog_comments
    WHERE user_id = NEW.user_id
      AND created_at > NOW() - INTERVAL '1 hour';

    IF v_recent_comment_count >= 20 THEN
        RAISE EXCEPTION 'আপনার প্রতি ঘণ্টার কমেন্ট করার সীমা পূর্ণ হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।';
    END IF;

    -- Rule 4: Duplicate Comment Prevention (Same content on same post in 24 hours)
    SELECT EXISTS (
        SELECT 1
        FROM public.blog_comments
        WHERE user_id = NEW.user_id
          AND post_slug = NEW.post_slug
          AND TRIM(content) = v_clean_content
          AND created_at > NOW() - INTERVAL '24 hours'
    ) INTO v_duplicate_exists;

    IF v_duplicate_exists THEN
        RAISE EXCEPTION 'আপনি ইতিমধ্যে এই ব্লগে একই মন্তব্য পোস্ট করেছেন।';
    END IF;

    -- Rule 5: Block suspicious phishing/telegram/whatsapp spam links in comments
    IF v_clean_content ~* '(t\.me\/|telegram\.me\/|wa\.me\/|whatsapp\.com\/channel\/|bit\.ly\/|cutt\.ly\/|tinyurl\.com\/|free-crypto|free-money|casino|porn|bet365)' THEN
        RAISE EXCEPTION 'স্প্যাম বা ক্ষতিকর লিংক যুক্ত কমেন্ট করা নিষিদ্ধ।';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger to public.blog_comments
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'blog_comments') THEN
        DROP TRIGGER IF EXISTS trg_check_blog_comment_anti_spam ON public.blog_comments;
        CREATE TRIGGER trg_check_blog_comment_anti_spam
        BEFORE INSERT ON public.blog_comments
        FOR EACH ROW
        EXECUTE FUNCTION public.check_blog_comment_anti_spam();
    END IF;
END $$;


-- 8. Enhanced Referral & Scratch Card Reward Granting (Extends existing subscriptions smoothly)
CREATE OR REPLACE FUNCTION public.redeem_referral_tx(
    p_referral_id uuid,
    p_redeemer_id uuid
) RETURNS void AS $$
DECLARE
    already_used boolean;
    v_owner_id uuid;
    v_total_successful_referrals int;
    v_base_expiry timestamptz;
    v_new_expiry timestamptz;
BEGIN
    -- 1. Verify referral exists and get owner
    SELECT owner_id INTO v_owner_id FROM public.referrals WHERE id = p_referral_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referral not found' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Prevent self‑referral
    IF v_owner_id = p_redeemer_id THEN
        RAISE EXCEPTION 'Cannot redeem own referral code' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Check if this user already redeemed any referral code (1 lifetime use per user)
    SELECT EXISTS (
        SELECT 1 FROM public.referral_history
        WHERE redeemed_by = p_redeemer_id
    ) INTO already_used;
    IF already_used THEN
        RAISE EXCEPTION 'User has already used a referral code' USING ERRCODE = 'P0003';
    END IF;

    -- 4. Insert history record (Approved immediately)
    INSERT INTO public.referral_history (
        id, referral_id, redeemed_by, redeemed_at, admin_status, reward_given
    ) VALUES (
        gen_random_uuid(), p_referral_id, p_redeemer_id, now(), 'Approved', true
    );

    -- 5. Calculate new expiry: If user already has an active subscription, extend it by 1 month; else now() + 1 month
    SELECT 
        CASE 
            WHEN (subscription->>'expiry') IS NOT NULL AND (subscription->>'expiry')::timestamptz > now() 
                THEN (subscription->>'expiry')::timestamptz 
            WHEN subscription_expires_at IS NOT NULL AND subscription_expires_at > now() 
                THEN subscription_expires_at 
            ELSE now() 
        END INTO v_base_expiry
    FROM public.users WHERE id = p_redeemer_id;

    v_new_expiry := COALESCE(v_base_expiry, now()) + interval '1 month';

    -- Update users table with new premium subscription
    UPDATE public.users 
    SET is_subscribed = true,
        subscription_status = 'active',
        subscription_expires_at = v_new_expiry,
        subscription = jsonb_set(
            jsonb_set(
                jsonb_set(
                    COALESCE(subscription, '{}'::jsonb),
                    '{plan}',
                    '"Premium (Referral Bonus)"'
                ),
                '{status}',
                '"active"'
            ),
            '{expiry}',
            to_jsonb(to_char(v_new_expiry, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
        )
    WHERE id = p_redeemer_id;

    -- 6. Check Referrer's total referrals to grant a Scratch Card
    SELECT COUNT(*) INTO v_total_successful_referrals
    FROM public.referral_history
    WHERE referral_id = p_referral_id AND admin_status = 'Approved';

    -- Every 3 referrals, insert an unscratched card
    IF v_total_successful_referrals % 3 = 0 THEN
        INSERT INTO public.scratch_cards (user_id, is_scratched)
        VALUES (v_owner_id, false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 9. Enhanced Scratch Card Reveal (Extends existing subscriptions smoothly)
CREATE OR REPLACE FUNCTION public.reveal_scratch_card_tx(
    p_card_id uuid
) RETURNS text AS $$
DECLARE
    v_user_id uuid;
    v_is_scratched boolean;
    v_rand float;
    v_reward_type text;
    v_interval interval;
    v_base_expiry timestamptz;
    v_new_expiry timestamptz;
BEGIN
    -- Get card details
    SELECT user_id, is_scratched INTO v_user_id, v_is_scratched 
    FROM public.scratch_cards WHERE id = p_card_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found' USING ERRCODE = 'P0001';
    END IF;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized' USING ERRCODE = 'P0002';
    END IF;

    IF v_is_scratched THEN
        RAISE EXCEPTION 'Card already scratched' USING ERRCODE = 'P0003';
    END IF;

    -- Determine Reward using probabilities
    -- 1 Month Free (70%), 50% Off (15%), 2 Months Free (10%), 3 Months Free (5%)
    v_rand := random();
    
    IF v_rand <= 0.70 THEN
        v_reward_type := '1_month_free';
        v_interval := interval '1 month';
    ELSIF v_rand <= 0.85 THEN
        v_reward_type := '50_percent_off';
        v_interval := NULL;
    ELSIF v_rand <= 0.95 THEN
        v_reward_type := '2_months_free';
        v_interval := interval '2 months';
    ELSE
        v_reward_type := '3_months_free';
        v_interval := interval '3 months';
    END IF;

    -- Update card
    UPDATE public.scratch_cards 
    SET is_scratched = true, scratched_at = now(), reward_type = v_reward_type
    WHERE id = p_card_id;

    -- Apply Reward (If free subscription, extend user's subscription)
    IF v_interval IS NOT NULL THEN
        SELECT 
            CASE 
                WHEN (subscription->>'expiry') IS NOT NULL AND (subscription->>'expiry')::timestamptz > now() 
                    THEN (subscription->>'expiry')::timestamptz 
                WHEN subscription_expires_at IS NOT NULL AND subscription_expires_at > now() 
                    THEN subscription_expires_at 
                ELSE now() 
            END INTO v_base_expiry
        FROM public.users WHERE id = v_user_id;

        v_new_expiry := COALESCE(v_base_expiry, now()) + v_interval;

        UPDATE public.users 
        SET is_subscribed = true,
            subscription_status = 'active',
            subscription_expires_at = v_new_expiry,
            subscription = jsonb_set(
                jsonb_set(
                    jsonb_set(
                        COALESCE(subscription, '{}'::jsonb),
                        '{plan}',
                        '"Premium (Gift Reward)"'
                    ),
                    '{status}',
                    '"active"'
                ),
                '{expiry}',
                to_jsonb(to_char(v_new_expiry, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
            )
        WHERE id = v_user_id;
    END IF;

    RETURN v_reward_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 10. Production-Grade Student ID System (e.g. OBH-10492)
-- ==============================================================================

-- 1. Create a dedicated sequence starting at 10001
CREATE SEQUENCE IF NOT EXISTS public.student_id_seq START WITH 10001;

-- 2. Add student_id column if not present
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS student_id TEXT;
    END IF;
END $$;

-- 3. Function to generate random non-serial student IDs (e.g. OBH-74921, OBH-38502, ...)
CREATE OR REPLACE FUNCTION public.generate_next_student_id()
RETURNS TEXT AS $$
DECLARE
    v_id TEXT;
    v_exists BOOLEAN;
    v_random_num INTEGER;
BEGIN
    LOOP
        v_random_num := floor(random() * (99999 - 10000 + 1) + 10000)::INTEGER;
        v_id := 'OBH-' || v_random_num::TEXT;
        SELECT EXISTS (SELECT 1 FROM public.users WHERE student_id = v_id) INTO v_exists;
        IF NOT v_exists THEN
            RETURN v_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Trigger to auto-assign student_id on user creation
CREATE OR REPLACE FUNCTION public.assign_student_id_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_id IS NULL OR TRIM(NEW.student_id) = '' THEN
        NEW.student_id := public.generate_next_student_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS trg_assign_student_id ON public.users;
        CREATE TRIGGER trg_assign_student_id
        BEFORE INSERT ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION public.assign_student_id_trigger();
    END IF;
END $$;

-- 5. Backfill existing users who don't have a student_id yet
DO $$
DECLARE
    r RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        FOR r IN SELECT id FROM public.users WHERE student_id IS NULL OR TRIM(student_id) = '' ORDER BY created_at ASC LOOP
            UPDATE public.users
            SET student_id = public.generate_next_student_id()
            WHERE id = r.id;
        END LOOP;
    END IF;
END $$;

-- 6. Ensure Unique Index on student_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        CREATE UNIQUE INDEX IF NOT EXISTS idx_users_student_id ON public.users (student_id);
    END IF;
END $$;


-- ==============================================================================
-- 11. Enterprise-Grade Account Deletion & Anti-Abuse System
-- ==============================================================================

-- 1. Create audit table to track deleted accounts (Anti-Spam & Anti-Referral-Farming)
CREATE TABLE IF NOT EXISTS public.deleted_accounts_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    email_hash TEXT NOT NULL,
    phone_hash TEXT,
    student_id TEXT,
    had_active_subscription BOOLEAN DEFAULT FALSE,
    reason TEXT,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.deleted_accounts_audit ENABLE ROW LEVEL SECURITY;
-- Only service_role can access audit logs

-- 2. Secure RPC function to execute account deletion with full safety checks
CREATE OR REPLACE FUNCTION public.delete_user_account(p_reason TEXT DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_user RECORD;
    v_has_active_exam BOOLEAN := FALSE;
    v_has_active_sub BOOLEAN := FALSE;
    v_email TEXT;
    v_phone TEXT;
BEGIN
    -- Identify the calling user
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'অননুমোদিত অনুরোধ। অনুগ্রহ করে পুনরায় লগইন করো।' USING ERRCODE = 'P0001';
    END IF;

    -- Fetch user profile
    SELECT * INTO v_user FROM public.users WHERE id = v_user_id;
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'ব্যবহারকারীর অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।' USING ERRCODE = 'P0002';
    END IF;

    -- Protection 1: Admin & Teacher cannot self-delete from client
    IF v_user.role IN ('Admin', 'Teacher') THEN
        RAISE EXCEPTION 'অ্যাডমিন বা শিক্ষক অ্যাকাউন্ট স্বয়ংক্রিয়ভাবে মুছে ফেলা সম্ভব নয়। অনুগ্রহ করে সুপার অ্যাডমিনের সাথে যোগাযোগ করো।' USING ERRCODE = 'P0003';
    END IF;

    -- Protection 2: Suspended / Banned users cannot evade ban by self-deleting
    IF v_user.status = 'Suspended' THEN
        RAISE EXCEPTION 'তোমার অ্যাকাউন্টটি বর্তমানে পর্যালোচনায় রয়েছে। অ্যাকাউন্ট সংক্রান্ত যেকোনো বিষয়ের জন্য সাপোর্টে যোগাযোগ করো।' USING ERRCODE = 'P0004';
    END IF;

    -- Protection 3: Check for ongoing live exam in the last 1 hour
    IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exam_results'
    ) THEN
        SELECT EXISTS (
            SELECT 1 FROM public.exam_results 
            WHERE user_id = v_user_id 
              AND status = 'ongoing' 
              AND started_at > NOW() - INTERVAL '1 hour'
        ) INTO v_has_active_exam;

        IF v_has_active_exam THEN
            RAISE EXCEPTION 'তোমার একটি চলমান পরীক্ষা রয়েছে। পরীক্ষা সমাপ্ত করার পর অ্যাকাউন্ট মুছে ফেলার অনুরোধ করো।' USING ERRCODE = 'P0005';
        END IF;
    END IF;

    -- Check active subscription state
    IF (v_user.is_subscribed = TRUE OR v_user.subscription_status = 'active' OR (v_user.subscription->>'status') = 'active') THEN
        v_has_active_sub := TRUE;
    END IF;

    -- Get email and phone from auth.users
    SELECT email, phone INTO v_email, v_phone FROM auth.users WHERE id = v_user_id;

    -- Protection 4: Log to audit table for anti-referral-farming & anti-abuse detection
    INSERT INTO public.deleted_accounts_audit (
        user_id,
        email_hash,
        phone_hash,
        student_id,
        had_active_subscription,
        reason,
        deleted_at
    ) VALUES (
        v_user_id,
        encode(digest(COALESCE(LOWER(TRIM(v_email)), ''), 'sha256'), 'hex'),
        encode(digest(COALESCE(TRIM(v_phone), ''), 'sha256'), 'hex'),
        v_user.student_id,
        v_has_active_sub,
        p_reason,
        NOW()
    );

    -- 5. Hard purge user data across all tables
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_answers') THEN
        DELETE FROM public.user_answers WHERE user_id = v_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exam_results') THEN
        DELETE FROM public.exam_results WHERE user_id = v_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookmarks') THEN
        DELETE FROM public.bookmarks WHERE user_id = v_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notes') THEN
        DELETE FROM public.notes WHERE user_id = v_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'scratch_cards') THEN
        DELETE FROM public.scratch_cards WHERE user_id = v_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_attempt_logs') THEN
        DELETE FROM public.referral_attempt_logs WHERE user_id = v_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_complaints') THEN
        DELETE FROM public.app_complaints WHERE user_id = v_user_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_feature_requests') THEN
        DELETE FROM public.app_feature_requests WHERE user_id = v_user_id;
    END IF;

    -- Delete from public.users
    DELETE FROM public.users WHERE id = v_user_id;

    -- Delete from auth.users (permanently revoking login)
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'তোমার অ্যাকাউন্ট এবং সমস্ত তথ্য স্থায়ীভাবে মুছে ফেলা হয়েছে।'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;








