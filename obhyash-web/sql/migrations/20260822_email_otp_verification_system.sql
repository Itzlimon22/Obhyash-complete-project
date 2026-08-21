-- ============================================================================
-- MIGRATION: Email 6-Digit OTP Verification, 1-Time Change & Lock System
-- DESCRIPTION:
--   1. Creates public.email_verifications table for cryptographically hashed OTPs.
--   2. Adds is_email_verified & requires_email_verification columns to public.users.
--   3. Provides send_email_verification_otp, verify_email_otp, update_unverified_email RPCs.
-- ============================================================================

-- 0. Ensure pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Alter users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS requires_email_verification BOOLEAN DEFAULT FALSE;

-- 2. Create email_verifications table
CREATE TABLE IF NOT EXISTS public.email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    is_verified BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup & rate-limiting
CREATE INDEX IF NOT EXISTS idx_email_verifications_email_created 
ON public.email_verifications(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user_created 
ON public.email_verifications(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.email_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role and authenticated manage email verifications" ON public.email_verifications;
CREATE POLICY "Service role and authenticated manage email verifications"
ON public.email_verifications FOR ALL
TO authenticated, service_role
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- RPC: send_email_verification_otp
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_email_verification_otp(
    p_user_id UUID,
    p_email TEXT,
    p_is_dev_mock BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_email TEXT;
    v_last_sent_at TIMESTAMPTZ;
    v_seconds_since_last INTEGER;
    v_cooldown_remain INTEGER;
    v_daily_count INTEGER;
    v_otp_code TEXT;
    v_otp_hash TEXT;
    v_is_locked BOOLEAN;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'ব্যবহারকারীর সেশন পাওয়া যায়নি।');
    END IF;

    v_clean_email := lower(trim(COALESCE(p_email, '')));

    -- Basic email format check
    IF v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'অনুগ্রহ করে একটি সঠিক ইমেইল অ্যাড্রেস লিখুন (যেমন: name@gmail.com)।');
    END IF;

    -- Check if user's current email is already verified and locked
    SELECT (is_email_verified = TRUE AND COALESCE(requires_email_verification, FALSE) = FALSE)
    INTO v_is_locked
    FROM public.users
    WHERE id = p_user_id;

    IF v_is_locked IS TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'আপনার ইমেইলটি ইতিমধ্যে ভেরিফাইড এবং লক আছে।');
    END IF;

    -- Check if email is already verified by another user
    IF EXISTS (
        SELECT 1 FROM public.users 
        WHERE email = v_clean_email AND id <> p_user_id AND is_email_verified = TRUE
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'এই ইমেইলটি অন্য একটি অ্যাকাউন্টে ইতিমধ্যে ভেরিফাইড রয়েছে।');
    END IF;

    -- 60-Second Cooldown Check
    SELECT created_at INTO v_last_sent_at
    FROM public.email_verifications
    WHERE (email = v_clean_email OR user_id = p_user_id)
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_last_sent_at IS NOT NULL THEN
        v_seconds_since_last := EXTRACT(EPOCH FROM (NOW() - v_last_sent_at))::INTEGER;
        IF v_seconds_since_last < 60 THEN
            v_cooldown_remain := 60 - v_seconds_since_last;
            RETURN jsonb_build_object(
                'success', false,
                'code', 'COOLDOWN_ACTIVE',
                'cooldown_seconds', v_cooldown_remain,
                'error', 'অনুগ্রহ করে ' || v_cooldown_remain || ' সেকেন্ড অপেক্ষা করে আবার চেষ্টা করুন।'
            );
        END IF;
    END IF;

    -- Max 5 OTPs per 24 hours
    SELECT COUNT(*) INTO v_daily_count
    FROM public.email_verifications
    WHERE (email = v_clean_email OR user_id = p_user_id)
      AND created_at >= (NOW() - INTERVAL '24 hours');

    IF v_daily_count >= 5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DAILY_LIMIT_EXCEEDED',
            'error', 'আজকের জন্য ওটিপি পাঠানোর সর্বোচ্চ সীমা (৫ বার) অতিক্রম হয়েছে। আগামীকাল আবার চেষ্টা করুন।'
        );
    END IF;

    -- Generate secure 6-digit numeric OTP (100000 - 999999)
    v_otp_code := (100000 + FLOOR(random() * 900000))::TEXT;
    v_otp_hash := encode(digest(v_otp_code || 'obhyash_email_salt_2026', 'sha256'), 'hex');

    -- Insert into email_verifications (expires in 10 minutes)
    INSERT INTO public.email_verifications (
        user_id,
        email,
        otp_hash,
        attempts,
        max_attempts,
        is_verified,
        expires_at,
        created_at
    ) VALUES (
        p_user_id,
        v_clean_email,
        v_otp_hash,
        0,
        3,
        false,
        NOW() + INTERVAL '10 minutes',
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'email', v_clean_email,
        'otp_code', CASE WHEN p_is_dev_mock THEN v_otp_code ELSE NULL END,
        'cooldown_seconds', 60,
        'expires_in_minutes', 10,
        'message', 'আপনার ইমেইলে ৬ ডিজিটের ওটিপি কোড পাঠানো হয়েছে।'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC: verify_email_otp
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_email_otp(
    p_user_id UUID,
    p_email TEXT,
    p_otp TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_email TEXT;
    v_record RECORD;
    v_input_hash TEXT;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'ব্যবহারকারীর সেশন পাওয়া যায়নি।');
    END IF;

    v_clean_email := lower(trim(COALESCE(p_email, '')));

    IF p_otp IS NULL OR length(trim(p_otp)) <> 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'অনুগ্রহ করে ৬ ডিজিটের ওটিপি কোডটি লিখুন।');
    END IF;

    -- Fetch latest active verification record
    SELECT * INTO v_record
    FROM public.email_verifications
    WHERE (email = v_clean_email OR user_id = p_user_id)
      AND is_verified = false
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_record.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'কোনো সক্রিয় ওটিপি পাওয়া যায়নি। দয়া করে নতুন কোড চেয়ে নিন।');
    END IF;

    -- Check expiration
    IF NOW() > v_record.expires_at THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'OTP_EXPIRED',
            'error', 'ওটিপির মেয়াদ শেষ হয়ে গেছে। দয়া করে নতুন ওটিপি চেয়ে নিন।'
        );
    END IF;

    -- Check max attempts
    IF v_record.attempts >= v_record.max_attempts THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'MAX_ATTEMPTS_EXCEEDED',
            'error', 'সর্বোচ্চ ৩ বার ভুল ওটিপি দেওয়া হয়েছে। নতুন ওটিপি চেয়ে নিন।'
        );
    END IF;

    -- Hash input OTP
    v_input_hash := encode(digest(trim(p_otp) || 'obhyash_email_salt_2026', 'sha256'), 'hex');

    -- Verify match
    IF v_record.otp_hash <> v_input_hash THEN
        UPDATE public.email_verifications
        SET attempts = attempts + 1
        WHERE id = v_record.id;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_OTP',
            'remaining_attempts', (v_record.max_attempts - (v_record.attempts + 1)),
            'error', 'ভুল ওটিপি কোড। বাকি সুযোগ: ' || (v_record.max_attempts - (v_record.attempts + 1)) || ' বার।'
        );
    END IF;

    -- Mark verified
    UPDATE public.email_verifications
    SET is_verified = true,
        verified_at = NOW()
    WHERE id = v_record.id;

    -- Update users table: Lock email & set verified
    UPDATE public.users
    SET email = v_clean_email,
        is_email_verified = TRUE,
        requires_email_verification = FALSE,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'email', v_clean_email,
        'message', 'ইমেইল সফলভাবে ভেরিফাই ও সুরক্ষিত করা হয়েছে! 🔒🎉'
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC: update_unverified_email (1-Time change before verification)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_unverified_email(
    p_user_id UUID,
    p_new_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_email TEXT;
    v_is_locked BOOLEAN;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'ব্যবহারকারীর সেশন পাওয়া যায়নি।');
    END IF;

    v_clean_email := lower(trim(COALESCE(p_new_email, '')));

    IF v_clean_email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'সঠিক ইমেইল ফরম্যাট লিখুন (যেমন: student@gmail.com)।');
    END IF;

    -- Check if locked
    SELECT (is_email_verified = TRUE AND COALESCE(requires_email_verification, FALSE) = FALSE)
    INTO v_is_locked
    FROM public.users
    WHERE id = p_user_id;

    IF v_is_locked IS TRUE THEN
        RETURN jsonb_build_object('success', false, 'error', 'নিরাপত্তা স্বার্থে এই ইমেইলটি ইতিমধ্যে ভেরিফাইড এবং লক আছে। পরিবর্তন সম্ভব নয়।');
    END IF;

    -- Check duplicate
    IF EXISTS (
        SELECT 1 FROM public.users
        WHERE email = v_clean_email AND id <> p_user_id AND is_email_verified = TRUE
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'এই ইমেইলটি অন্য একটি অ্যাকাউন্টে ইতিমধ্যে ভেরিফাইড রয়েছে।');
    END IF;

    -- Update email as unverified
    UPDATE public.users
    SET email = v_clean_email,
        is_email_verified = FALSE,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'email', v_clean_email,
        'message', 'ইমেইল সফলভাবে পরিবর্তন করা হয়েছে। এখন ওটিপি দিয়ে ভেরিফাই করুন।'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_email_verification_otp(UUID, TEXT, BOOLEAN) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.verify_email_otp(UUID, TEXT, TEXT) TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.update_unverified_email(UUID, TEXT) TO authenticated, service_role, anon;

NOTIFY pgrst, 'reload schema';
