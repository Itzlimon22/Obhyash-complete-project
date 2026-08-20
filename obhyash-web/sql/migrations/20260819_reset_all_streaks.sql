-- Migration: Reset all user streak data to zero
-- Date: 2026-08-19
-- Purpose: Fresh start for the new activity-computed streak system.
--          Streak count and last_streak_date are cleared for every user.
--          Streaks will rebuild naturally as users complete exams going forward.

-- Reset streak and last_streak_date on the main users table
UPDATE public.users
SET
  streak        = 0,
  last_streak_date = NULL;

-- Verify
SELECT
  COUNT(*)                                           AS total_users,
  COUNT(*) FILTER (WHERE streak = 0)                AS zeroed,
  COUNT(*) FILTER (WHERE last_streak_date IS NULL)  AS date_cleared
FROM public.users;
