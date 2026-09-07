-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Single Device Session Lock & Silent Auto-Logout System
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Add single_device_login_enabled master switch to public.app_config table
ALTER TABLE public.app_config ADD COLUMN IF NOT EXISTS single_device_login_enabled BOOLEAN DEFAULT TRUE;

-- 2. Add current_session_id column to public.users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS current_session_id TEXT;

-- 3. Create index on (id, current_session_id) for rapid auth-time lookups
CREATE INDEX IF NOT EXISTS idx_users_current_session_id ON public.users(id, current_session_id);

-- 4. High-performance RPC to securely set active session for current user
CREATE OR REPLACE FUNCTION public.set_active_user_session(p_session_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    UPDATE public.users
    SET current_session_id = p_session_id,
        "lastActive" = NOW()
    WHERE id = auth.uid();
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_active_user_session(TEXT) TO authenticated;

-- 5. Ensure public.users is published to supabase_realtime for instant cross-device broadcast
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
  END IF;
END $$;
