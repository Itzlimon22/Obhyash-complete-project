-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Referral System Master Control
-- Adds referral_system_enabled toggle to public.app_config table
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Add referral_system_enabled switch to public.app_config table (Default: TRUE)
ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS referral_system_enabled BOOLEAN DEFAULT TRUE;

-- 2. Update existing global_config row to ensure default value is true
UPDATE public.app_config
SET referral_system_enabled = COALESCE(referral_system_enabled, TRUE)
WHERE id = 'global_config';
