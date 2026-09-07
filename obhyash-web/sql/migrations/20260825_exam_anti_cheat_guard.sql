-- ══════════════════════════════════════════════════════════════════════════
-- MIGRATION: Live Exam Anti-Cheat Guard & Tab Switch Prevention
-- ══════════════════════════════════════════════════════════════════════════

-- 1. Add anti-cheat switches to public.app_config table
ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS exam_anti_cheat_enabled BOOLEAN DEFAULT TRUE;

ALTER TABLE public.app_config 
ADD COLUMN IF NOT EXISTS max_tab_switches_allowed INTEGER DEFAULT 2;

-- 2. Add tab_switches_count column to live_exam_attempts table
ALTER TABLE public.live_exam_attempts 
ADD COLUMN IF NOT EXISTS tab_switches_count INTEGER DEFAULT 0;
