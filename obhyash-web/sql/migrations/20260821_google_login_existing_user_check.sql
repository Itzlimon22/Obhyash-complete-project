-- ============================================================================
-- MIGRATION: Google Sign-In Existing User Validation & Registration Guard
-- DESCRIPTION:
--   1. check_user_registered: RPC to verify if an email / user_id is already
--      registered in public.users.
--   2. sync_google_login_user: Safely associates Google OAuth user ID with their
--      existing profile if they previously signed up with email/password or phone.
-- ============================================================================

-- 1. Check if user is registered in public.users
CREATE OR REPLACE FUNCTION public.check_user_registered(
    p_user_id UUID DEFAULT NULL,
    p_email TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_exists BOOLEAN := FALSE;
BEGIN
    -- Check if user ID or email exists in public.users
    SELECT EXISTS(
        SELECT 1 FROM public.users
        WHERE (p_user_id IS NOT NULL AND id = p_user_id)
           OR (p_email IS NOT NULL AND TRIM(p_email) <> '' AND LOWER(TRIM(email)) = LOWER(TRIM(p_email)))
    ) INTO v_exists;

    RETURN v_exists;
END;
$$;

-- 2. Link/Sync Google OAuth user with existing profile if needed
CREATE OR REPLACE FUNCTION public.sync_google_login_user(
    p_auth_id UUID,
    p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_row public.users%ROWTYPE;
BEGIN
    IF p_email IS NULL OR TRIM(p_email) = '' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Email is required');
    END IF;

    -- Look up existing profile by auth ID or email
    SELECT * INTO v_user_row
    FROM public.users
    WHERE id = p_auth_id
       OR LOWER(TRIM(email)) = LOWER(TRIM(p_email))
    ORDER BY created_at ASC
    LIMIT 1;

    IF v_user_row.id IS NULL THEN
        -- User not registered!
        RETURN jsonb_build_object('success', false, 'registered', false);
    END IF;

    -- If ID differs (e.g. registered via email/pass before, now signed in via Google with same email)
    IF v_user_row.id <> p_auth_id THEN
        UPDATE public.users
        SET id = p_auth_id,
            updated_at = NOW()
        WHERE id = v_user_row.id;
    END IF;

    -- Update last active timestamp
    UPDATE public.users
    SET last_active = NOW()
    WHERE id = p_auth_id;

    RETURN jsonb_build_object('success', true, 'registered', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_user_registered(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sync_google_login_user(UUID, TEXT) TO anon, authenticated, service_role;
