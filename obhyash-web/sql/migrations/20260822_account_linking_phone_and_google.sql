-- ============================================================================
-- MIGRATION: Account Linking Phone & Google Sync RPCs
-- DESCRIPTION:
--   1. Ensures columns is_phone_verified & requires_phone_verification exist on public.users.
--   2. Provides link_user_phone RPC to update/add/reverify phone number safely.
-- ============================================================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS requires_phone_verification BOOLEAN DEFAULT FALSE;

-- Set default for existing users with phone numbers
UPDATE public.users 
SET is_phone_verified = TRUE 
WHERE phone IS NOT NULL AND phone <> '' AND is_phone_verified IS FALSE AND requires_phone_verification IS FALSE;

CREATE OR REPLACE FUNCTION public.link_user_phone(
    p_user_id UUID,
    p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_phone TEXT;
    v_conflict_id UUID;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'ব্যবহারকারীর আইডি পাওয়া যায়নি।');
    END IF;

    -- Clean phone digits
    v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
    
    -- Format to 11 digits: remove leading 88 if provided
    IF length(v_clean_phone) = 13 AND v_clean_phone LIKE '8801%' THEN
        v_clean_phone := substring(v_clean_phone from 3);
    END IF;

    -- Validate Bangladeshi 11 digit mobile number
    IF length(v_clean_phone) <> 11 OR v_clean_phone NOT LIKE '01%' THEN
        RETURN jsonb_build_object('success', false, 'error', 'অনুগ্রহ করে ১১ ডিজিটের সঠিক মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।');
    END IF;

    -- Check for duplicate phone on another user
    SELECT id INTO v_conflict_id
    FROM public.users
    WHERE phone = v_clean_phone AND id <> p_user_id
    LIMIT 1;

    IF v_conflict_id IS NOT NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'এই মোবাইল নম্বরটি অন্য একটি অ্যাকাউন্টে ইতিমধ্যে ব্যবহৃত হয়েছে।');
    END IF;

    -- Update users table with verified status and clear reverification flag
    UPDATE public.users
    SET phone = v_clean_phone,
        is_phone_verified = TRUE,
        requires_phone_verification = FALSE,
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'phone', v_clean_phone,
        'message', 'মোবাইল নম্বর সফলভাবে যুক্ত ও ভেরিফাই করা হয়েছে! 🎉'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.link_user_phone(UUID, TEXT) TO authenticated, service_role, anon;
