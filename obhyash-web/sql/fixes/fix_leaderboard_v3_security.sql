-- ==============================================================================
-- LEADERBOARD COUNT FIX V3 (SECURITY DEFINER)
-- ==============================================================================
-- This script fixes the "Count = 1" issue caused by Row Level Security (RLS).
-- By using SECURITY DEFINER, the function runs with the owner's permissions,
-- allowing it to count all students even if they can't see each other's profiles.

-- 1. Drop the old function
DROP FUNCTION IF EXISTS get_level_user_counts();

-- 2. Create the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION get_level_user_counts()
RETURNS TABLE(level text, user_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER             -- Critical: Bypasses RLS for the count
SET search_path = public      -- Best practice for security
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.level::text,
    COUNT(*)::bigint
  FROM public.users u
  WHERE u.level IS NOT NULL
  AND u.role ILIKE 'student'  -- Case-insensitive
  GROUP BY u.level;
END;
$$;

-- 3. Grant permission to call it
GRANT EXECUTE ON FUNCTION get_level_user_counts() TO authenticated;
GRANT EXECUTE ON FUNCTION get_level_user_counts() TO anon;

-- 4. Data Repair (Just in case)
-- Ensure all students have a role and level
UPDATE public.users 
SET role = 'Student' 
WHERE role IS NULL OR role ILIKE 'student';

UPDATE public.users 
SET level = 'Rookie' 
WHERE level IS NULL OR level = 'Beginner';

-- 5. Final Verification
SELECT level, COUNT(*) as actual_database_count 
FROM public.users 
WHERE role ILIKE 'student' 
GROUP BY level;
