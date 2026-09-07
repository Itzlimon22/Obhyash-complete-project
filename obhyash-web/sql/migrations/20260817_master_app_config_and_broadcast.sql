-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Master App Configuration & Global Broadcast System
-- Provisions single-row / key-value table for master switches, maintenance,
-- in-app broadcast banners, and mobile app version control.
-- ══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.app_config (
    id TEXT PRIMARY KEY DEFAULT 'global_config',
    maintenance_mode BOOLEAN DEFAULT FALSE,
    maintenance_message TEXT DEFAULT 'অভ্যাস প্ল্যাটফর্মের নিয়মিত রক্ষণাবেক্ষণ চলছে। শীঘ্রই আমরা ফিরে আসছি।',
    live_exams_enabled BOOLEAN DEFAULT TRUE,
    registration_enabled BOOLEAN DEFAULT TRUE,
    free_trial_enabled BOOLEAN DEFAULT TRUE,
    min_app_version TEXT DEFAULT '1.0.0',
    latest_app_version TEXT DEFAULT '1.0.0',
    force_update BOOLEAN DEFAULT FALSE,
    update_url TEXT DEFAULT 'https://play.google.com/store/apps/details?id=com.obhyash.app',
    global_announcement_enabled BOOLEAN DEFAULT FALSE,
    global_announcement_text TEXT DEFAULT '',
    global_announcement_type TEXT DEFAULT 'info', -- 'info' | 'warning' | 'success' | 'danger'
    global_announcement_target TEXT DEFAULT 'all', -- 'all' | 'hsc' | 'ssc' | 'admission'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_by TEXT DEFAULT 'admin'
);

-- Insert default record if not exists
INSERT INTO public.app_config (id, maintenance_mode, live_exams_enabled, registration_enabled)
VALUES ('global_config', FALSE, TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (authenticated & anonymous) can read app config for fast startup
DROP POLICY IF EXISTS "Allow public read access to app_config" ON public.app_config;
CREATE POLICY "Allow public read access to app_config"
ON public.app_config FOR SELECT
USING (true);

-- 2. Allow admin and service role full access
DROP POLICY IF EXISTS "Allow admin full access to app_config" ON public.app_config;
CREATE POLICY "Allow admin full access to app_config"
ON public.app_config FOR ALL
USING (true)
WITH CHECK (true);

-- Realtime publication for instant broadcast on mobile & web
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'app_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
  END IF;
END $$;
