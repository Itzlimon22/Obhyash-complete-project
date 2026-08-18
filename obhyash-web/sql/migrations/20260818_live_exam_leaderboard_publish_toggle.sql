-- ==============================================================
-- Migration: Add Leaderboard Publish Toggle to live_exams
-- ==============================================================

ALTER TABLE public.live_exams 
ADD COLUMN IF NOT EXISTS is_leaderboard_published BOOLEAN DEFAULT TRUE;

-- Update existing rows to have is_leaderboard_published = TRUE
UPDATE public.live_exams 
SET is_leaderboard_published = TRUE 
WHERE is_leaderboard_published IS NULL;
