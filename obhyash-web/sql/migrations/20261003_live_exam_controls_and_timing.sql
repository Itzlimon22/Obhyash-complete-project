-- ==============================================================
-- SQL Migration: Live Exam Practice, Answers & Leaderboard Control
-- Obhyash Platform
-- ==============================================================

-- 1. Ensure is_leaderboard_published, is_answer_published, is_practice_enabled exist
ALTER TABLE public.live_exams 
ADD COLUMN IF NOT EXISTS is_leaderboard_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_answer_published BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_practice_enabled BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_live_exams_lb_published ON public.live_exams(is_leaderboard_published);
CREATE INDEX IF NOT EXISTS idx_live_exams_ans_published ON public.live_exams(is_answer_published);
