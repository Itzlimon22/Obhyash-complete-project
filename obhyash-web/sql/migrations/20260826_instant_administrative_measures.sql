-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Instant Administrative Measures (তাৎক্ষণিক জরুরি ব্যবস্থা)
-- Controls:
--   1. payments_enabled: Master switch for bKash / payment gateways
--   2. leaderboard_enabled: Master switch to hide/show student leaderboard
--   3. max_free_exams_per_day: Daily quota limit for free users
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Add emergency administrative controls to public.app_config table
ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS payments_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS leaderboard_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS max_free_exams_per_day INTEGER DEFAULT 5;

-- Ensure default record has these values
UPDATE public.app_config
SET 
  payments_enabled = COALESCE(payments_enabled, TRUE),
  leaderboard_enabled = COALESCE(leaderboard_enabled, TRUE),
  max_free_exams_per_day = COALESCE(max_free_exams_per_day, 5)
WHERE id = 'global_config';

-- 2. Ensure status column index on public.users for fast blocking queries
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
