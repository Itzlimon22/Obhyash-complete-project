-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Add auth_system_mode column to public.app_config
-- Description: Allows admin to toggle between modern minimal auth ('minimal')
-- and classic multi-step auth ('classic') directly from database config.
-- ══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.app_config
ADD COLUMN IF NOT EXISTS auth_system_mode TEXT DEFAULT 'minimal';

-- Ensure existing global_config row has default value
UPDATE public.app_config
SET auth_system_mode = COALESCE(auth_system_mode, 'minimal')
WHERE id = 'global_config';
