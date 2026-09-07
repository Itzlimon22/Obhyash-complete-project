-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Screenshot & Screen Recording Protection (Anti-Piracy)
-- ══════════════════════════════════════════════════════════════════════════

-- Add screenshot_protection_enabled switch to public.app_config table (Default: TRUE)
ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS screenshot_protection_enabled BOOLEAN DEFAULT TRUE;
