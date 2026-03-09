-- =============================================================================
-- Device Session Limiting (Netflix-style)
-- Run this on your Supabase SQL editor.
-- =============================================================================

-- 1. Device sessions table
-- Each row = one active logged-in device for a user.
-- A "device" is identified by a stable token stored in the browser (localStorage).
CREATE TABLE IF NOT EXISTS public.user_devices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_token    text NOT NULL,           -- UUID stored in browser localStorage
  device_name     text NOT NULL,           -- e.g. "Chrome on Windows"
  device_type     text NOT NULL DEFAULT 'web',  -- 'web' | 'mobile' | 'tablet'
  ip_address      text,                    -- last known IP (informational only)
  last_active     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),

  -- One device_token can only be registered once per user
  CONSTRAINT uq_user_device UNIQUE (user_id, device_token)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id
  ON public.user_devices (user_id, last_active DESC);

-- Required for Supabase Realtime DELETE events to carry old record fields
-- (without this, only the primary key is sent in the old record)
ALTER TABLE public.user_devices REPLICA IDENTITY FULL;

-- Auto-remove devices inactive for > 30 days (pg_cron required)
-- Schedule: runs daily at 03:00 UTC
-- SELECT cron.schedule('cleanup-inactive-devices', '0 3 * * *',
--   $$DELETE FROM public.user_devices WHERE last_active < now() - interval '30 days'$$
-- );

-- =============================================================================
-- 2. RLS policies
-- =============================================================================

ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Users can see their own devices only
CREATE POLICY "users_see_own_devices"
  ON public.user_devices FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert new devices for themselves only
CREATE POLICY "users_insert_own_devices"
  ON public.user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own device (last_active heartbeat)
CREATE POLICY "users_update_own_devices"
  ON public.user_devices FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete (revoke) their own devices
CREATE POLICY "users_delete_own_devices"
  ON public.user_devices FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================================
-- 3. Function: get_device_limit_for_plan
-- Returns max devices allowed for a subscription plan.
-- Adjust the numbers to match your product tiers.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_device_limit_for_plan(p_plan text)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  -- All plans: 2 devices max. Adjust later per plan if needed.
  SELECT 2;
$$;

-- =============================================================================
-- 4. Function: check_device_limit
-- Returns true if the user is within their device limit.
-- Called BEFORE registering a new device.
-- =============================================================================

CREATE OR REPLACE FUNCTION check_device_limit(p_user_id uuid, p_device_token text)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_plan        text;
  v_limit       integer;
  v_count       integer;
  v_is_known    boolean;
BEGIN
  -- Get user's current subscription plan
  SELECT COALESCE((subscription->>'plan'), 'Free')
  INTO v_plan
  FROM public.users
  WHERE id = p_user_id;

  v_limit := get_device_limit_for_plan(v_plan);

  -- Check if this device is already registered (re-login = allowed)
  SELECT EXISTS(
    SELECT 1 FROM public.user_devices
    WHERE user_id = p_user_id AND device_token = p_device_token
  ) INTO v_is_known;

  -- Count current registered devices (excluding current token if exists)
  SELECT COUNT(*) INTO v_count
  FROM public.user_devices
  WHERE user_id = p_user_id;

  RETURN json_build_object(
    'allowed',    (v_is_known OR v_count < v_limit),
    'is_known',   v_is_known,
    'count',      v_count,
    'limit',      v_limit,
    'plan',       v_plan
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_device_limit TO authenticated;
GRANT EXECUTE ON FUNCTION get_device_limit_for_plan TO authenticated;
