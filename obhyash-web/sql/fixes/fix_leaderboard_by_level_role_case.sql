-- ==============================================================================
-- FIX: leaderboard_by_level RPC — case-insensitive role filter
-- ==============================================================================
-- Bug: previous version used `AND role = 'student'` (case-sensitive lowercase).
-- Users are stored with `role = 'Student'` (capitalised), so the RPC returned
-- 0 rows for every level, causing the leaderboard to appear empty.
-- Fix: use LOWER(role) = 'student' instead.
-- ==============================================================================

CREATE OR REPLACE FUNCTION leaderboard_by_level(p_level text)
RETURNS TABLE (
  id            uuid,
  name          text,
  institute     text,
  xp            int,
  level         text,
  exams_taken   int,
  avatar_url    text,
  avatar_color  text,
  streak        int
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, name, institute, xp, level, exams_taken, avatar_url, avatar_color, streak
  FROM public.users
  WHERE level = p_level
    AND LOWER(role) = 'student'
  ORDER BY xp DESC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION leaderboard_by_level(text) TO anon, authenticated;
