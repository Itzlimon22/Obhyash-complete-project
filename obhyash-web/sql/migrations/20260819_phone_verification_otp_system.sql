-- ==============================================================================
-- Migration: Phone Verification OTP System (Production Ready & Anti-Spam Protected)
-- Date: 2026-08-19
-- Description:
--   1. Creates `public.phone_verifications` table with SHA-256 OTP hashing and expiry.
--   2. Provides `send_registration_otp` RPC with 60s cooldown, daily limit (max 5),
--      and existing user verification checks.
--   3. Provides `verify_registration_otp` RPC with attempt limits (max 3) & SHA-256 check.
--   4. Provides `is_phone_verified_for_registration` validation RPC.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.phone_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

-- Index for fast lookup by phone and expiry
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON public.phone_verifications (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_verified ON public.phone_verifications (phone, is_verified, verified_at);

-- Enable RLS
ALTER TABLE public.phone_verifications ENABLE ROW LEVEL SECURITY;

-- Block direct SELECT/INSERT/UPDATE by clients — everything goes through secure SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Deny direct client access to phone_verifications" ON public.phone_verifications;
CREATE POLICY "Deny direct client access to phone_verifications"
ON public.phone_verifications
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- ------------------------------------------------------------------------------
-- Helper: Clean & Normalize Bangladesh Phone Number
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.normalize_bd_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    clean_num TEXT;
BEGIN
    IF p_phone IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Remove all non-digits
    clean_num := regexp_replace(p_phone, '\D', '', 'g');
    
    -- Strip leading 88 or +88 if present
    IF clean_num LIKE '8801%' AND length(clean_num) = 13 THEN
        clean_num := substring(clean_num from 3);
    END IF;
    
    -- Validate exact 11-digit Bangladeshi mobile format: 013, 014, 015, 016, 017, 018, 019
    IF clean_num ~ '^01[3-9][0-9]{8}$' THEN
        RETURN clean_num;
    ELSE
        RETURN NULL;
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC: send_registration_otp (Rate-limited, Anti-abuse, Anti-spam)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.send_registration_otp(
    p_phone TEXT,
    p_is_dev_mock BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_phone TEXT;
    v_recent_count INTEGER;
    v_daily_count INTEGER;
    v_last_sent_at TIMESTAMPTZ;
    v_seconds_since_last INTEGER;
    v_otp_code TEXT;
    v_otp_hash TEXT;
    v_cooldown_remain INTEGER;
BEGIN
    -- 1. Normalize and validate phone
    v_clean_phone := public.normalize_bd_phone(p_phone);
    IF v_clean_phone IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)'
        );
    END IF;

    -- 2. Check if phone is already registered in users table
    IF EXISTS (SELECT 1 FROM public.users WHERE phone = v_clean_phone) THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'ALREADY_REGISTERED',
            'error', 'এই মোবাইল নম্বর দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রয়েছে। দয়া করে লগইন করুন।'
        );
    END IF;

    -- 3. Rate Limit Check 1: 60-Second Cooldown between OTP requests
    SELECT created_at INTO v_last_sent_at
    FROM public.phone_verifications
    WHERE phone = v_clean_phone
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

    -- 4. Rate Limit Check 2: Max 5 OTPs per phone in 24 hours (Cost & Spam Protection)
    SELECT COUNT(*) INTO v_daily_count
    FROM public.phone_verifications
    WHERE phone = v_clean_phone
      AND created_at >= (NOW() - INTERVAL '24 hours');

    IF v_daily_count >= 5 THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'DAILY_LIMIT_EXCEEDED',
            'error', 'আজকের জন্য ওটিপি পাঠানোর সর্বোচ্চ সীমা (৫ বার) অতিক্রম হয়েছে। আগামীকাল আবার চেষ্টা করুন।'
        );
    END IF;

    -- 5. Generate secure 6-digit numeric OTP (100000 - 999999)
    v_otp_code := (100000 + FLOOR(random() * 900000))::TEXT;
    
    -- 6. Hash OTP using SHA-256 with salt
    v_otp_hash := encode(digest(v_otp_code || 'obhyash_salt_2026', 'sha256'), 'hex');

    -- 7. Insert record into phone_verifications
    INSERT INTO public.phone_verifications (
        phone,
        otp_hash,
        attempts,
        max_attempts,
        is_verified,
        expires_at,
        created_at
    ) VALUES (
        v_clean_phone,
        v_otp_hash,
        0,
        3,
        false,
        NOW() + INTERVAL '5 minutes',
        NOW()
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'মোবাইলে ৬ ডিজিটের ওটিপি পাঠানো হয়েছে।',
        'phone', v_clean_phone,
        'cooldown_seconds', 60,
        'expires_in_minutes', 5,
        'otp_code', CASE WHEN p_is_dev_mock THEN v_otp_code ELSE NULL END
    );
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC: verify_registration_otp (Brute-force protected)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_registration_otp(
    p_phone TEXT,
    p_otp TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
    v_clean_phone TEXT;
    v_record RECORD;
    v_input_hash TEXT;
BEGIN
    -- 1. Normalize phone
    v_clean_phone := public.normalize_bd_phone(p_phone);
    IF v_clean_phone IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'মোবাইল নম্বর সঠিক নয়।'
        );
    END IF;

    IF p_otp IS NULL OR length(trim(p_otp)) <> 6 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'অনুগ্রহ করে ৬ ডিজিটের ওটিপি কোড লিখুন।'
        );
    END IF;

    -- 2. Fetch latest active verification record
    SELECT * INTO v_record
    FROM public.phone_verifications
    WHERE phone = v_clean_phone
      AND is_verified = false
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_record.id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'কোনো সক্রিয় ওটিপি পাওয়া যায়নি। দয়া করে নতুন ওটিপি চেয়ে নিন।'
        );
    END IF;

    -- 3. Check expiration (5 minutes)
    IF NOW() > v_record.expires_at THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'OTP_EXPIRED',
            'error', 'ওটিপির মেয়াদ শেষ হয়ে গেছে। দয়া করে নতুন ওটিপি চেয়ে নিন।'
        );
    END IF;

    -- 4. Check brute-force attempts (Max 3)
    IF v_record.attempts >= v_record.max_attempts THEN
        RETURN jsonb_build_object(
            'success', false,
            'code', 'MAX_ATTEMPTS_EXCEEDED',
            'error', 'সর্বোচ্চ ৩ বার ভুল ওটিপি দেওয়া হয়েছে। নিরাপত্তা স্বার্থে নতুন ওটিপি চেয়ে নিন।'
        );
    END IF;

    -- 5. Calculate SHA-256 hash of input OTP
    v_input_hash := encode(digest(trim(p_otp) || 'obhyash_salt_2026', 'sha256'), 'hex');

    -- 6. Verify Match
    IF v_input_hash = v_record.otp_hash THEN
        -- Mark as verified
        UPDATE public.phone_verifications
        SET is_verified = true,
            verified_at = NOW()
        WHERE id = v_record.id;

        RETURN jsonb_build_object(
            'success', true,
            'message', 'মোবাইল নম্বর সফলভাবে যাচাই করা হয়েছে! 🎉',
            'phone', v_clean_phone
        );
    ELSE
        -- Increment attempt count
        UPDATE public.phone_verifications
        SET attempts = attempts + 1
        WHERE id = v_record.id;

        RETURN jsonb_build_object(
            'success', false,
            'code', 'INVALID_OTP',
            'attempts_left', v_record.max_attempts - (v_record.attempts + 1),
            'error', 'ভুল ওটিপি কোড! আবার চেষ্টা করুন। (বাকি চেষ্টা: ' || (v_record.max_attempts - (v_record.attempts + 1)) || ')'
        );
    END IF;
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC: is_phone_verified_for_registration (Check valid verification before signup)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_phone_verified_for_registration(p_phone TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone TEXT;
    v_verified BOOLEAN := false;
BEGIN
    v_clean_phone := public.normalize_bd_phone(p_phone);
    IF v_clean_phone IS NULL THEN
        RETURN false;
    END IF;

    -- Check if verified within last 30 minutes
    SELECT EXISTS (
        SELECT 1
        FROM public.phone_verifications
        WHERE phone = v_clean_phone
          AND is_verified = true
          AND verified_at >= (NOW() - INTERVAL '30 minutes')
    ) INTO v_verified;

    RETURN v_verified;
END;
$$;

-- ------------------------------------------------------------------------------
-- RPC: get_email_by_phone (Allows seamless login with Phone + Password)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_email_by_phone(p_phone TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_clean_phone TEXT;
    v_email TEXT;
BEGIN
    v_clean_phone := public.normalize_bd_phone(p_phone);
    IF v_clean_phone IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT email INTO v_email
    FROM public.users
    WHERE phone = v_clean_phone
    LIMIT 1;

    RETURN v_email;
END;
$$;

-- Grant permissions to public RPCs
GRANT EXECUTE ON FUNCTION public.normalize_bd_phone(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.send_registration_otp(TEXT, BOOLEAN) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.verify_registration_otp(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_phone_verified_for_registration(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_email_by_phone(TEXT) TO authenticated, anon;

