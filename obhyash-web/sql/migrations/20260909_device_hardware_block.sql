-- =============================================================================
-- Migration: Device Hardware Ban / Block System
-- Date: 2026-09-09
-- Purpose: Permanently ban rogue devices by hardware-backed persistent device ID.
-- Realtime enabled: banned devices are locked immediately in active sessions.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.blocked_devices (
    device_id TEXT PRIMARY KEY,
    reason TEXT DEFAULT 'অভ্যাস প্ল্যাটফর্মের নিরাপত্তা নীতিমালা লঙ্ঘনের কারণে ডিভাইসটি নিষিদ্ধ করা হয়েছে।',
    blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast queries and audits
CREATE INDEX IF NOT EXISTS idx_blocked_devices_created_at 
ON public.blocked_devices (created_at DESC);

-- Enable RLS
ALTER TABLE public.blocked_devices ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: All clients (authenticated or anonymous) can check if their device is banned
DROP POLICY IF EXISTS "Allow public read on blocked_devices" ON public.blocked_devices;
CREATE POLICY "Allow public read on blocked_devices"
  ON public.blocked_devices
  FOR SELECT
  USING (true);

-- 2. Admin Write Policy: Only admins can ban / unban devices
DROP POLICY IF EXISTS "Admins full access on blocked_devices" ON public.blocked_devices;
CREATE POLICY "Admins full access on blocked_devices"
  ON public.blocked_devices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Enable Realtime for instant block/unblock enforcement without app restart
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'blocked_devices'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_devices;
  END IF;
END $$;
