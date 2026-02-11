-- ==============================================================================
-- FIX LEADERBOARD ROLE CASING
-- ==============================================================================
-- The previous fix checked for role = 'student', but users are stored as 'Student'.
-- This script updates the RPC to be case-insensitive.

-- ========================================
-- STEP 1: Fix public_profiles view (Ensure role column exists and is correct)
-- ========================================
-- This is just to be safe, overwriting the view helper
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
    id,
    name,
    avatar_url,
    avatar_color,
    xp,
    level,
    exams_taken,
    streak,
    institute,
    division,
    role
FROM public.users;

-- Grant permissions again just in case
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- ========================================
-- STEP 2: Fix get_level_user_counts RPC
-- ========================================
-- Using ILIKE 'student' covers 'Student', 'student', 'STUDENT'
CREATE OR REPLACE FUNCTION get_level_user_counts()
RETURNS TABLE(level text, user_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT
    level,
    COUNT(*)::bigint as user_count
  FROM public.users
  WHERE level IS NOT NULL
  AND role ILIKE 'student'
  GROUP BY level;
$$;

-- ========================================
-- OPTIONAL: Fix any null roles to 'Student' if needed
-- ========================================
-- UPDATE public.users SET role = 'Student' WHERE role IS NULL;
