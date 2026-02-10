-- =====================================================
-- FIX: FILTER LEADERBOARD COUNTS BY STUDENT ROLE
-- =====================================================
-- Problem: Leaderboard counts include admins/other roles.
-- Solution: Update get_level_user_counts to count only students.
-- =====================================================

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
  AND role = 'student'  -- Filter by student role
  GROUP BY level;
$$;

-- Verification
-- SELECT * FROM get_level_user_counts();
