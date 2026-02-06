-- =====================================================
-- LEADERBOARD DATABASE SETUP
-- Run this in Supabase SQL Editor to enable leaderboard functionality
-- =====================================================

-- =====================================================
-- STEP 1: Add RLS Policy for Leaderboard Viewing
-- =====================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "users_select_leaderboard" ON public.users;

-- Allow authenticated users to view leaderboard data (name, institute, xp, level, etc.)
-- This is separate from viewing one's own profile
CREATE POLICY "users_select_leaderboard"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- STEP 2: Verify and Create Indexes for Performance
-- =====================================================

-- These indexes optimize leaderboard queries by level and XP
CREATE INDEX IF NOT EXISTS idx_users_xp ON public.users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON public.users(level);
CREATE INDEX IF NOT EXISTS idx_users_level_xp ON public.users(level, xp DESC);

-- =====================================================
-- STEP 3: Create Function to Get Level User Counts
-- =====================================================

-- This function efficiently counts users in each level
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
  GROUP BY level;
$$;

-- =====================================================
-- STEP 4: Create Trigger to Update examsTaken
-- =====================================================

-- Function to increment examsTaken when a new exam result is saved
CREATE OR REPLACE FUNCTION increment_user_exams_taken()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the user's examsTaken count
  UPDATE public.users
  SET "examsTaken" = COALESCE("examsTaken", 0) + 1
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_increment_exams_taken ON public.exam_results;

-- Create trigger on exam_results table
-- Note: This assumes exam_results has a user_id column
-- If the column is named differently, adjust accordingly
CREATE TRIGGER trigger_increment_exams_taken
AFTER INSERT ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION increment_user_exams_taken();

-- =====================================================
-- STEP 5: Sync Existing examsTaken Counts (One-time)
-- =====================================================

-- Update existing users' examsTaken based on their exam_results
-- This is a one-time sync for existing data
UPDATE public.users u
SET "examsTaken" = COALESCE(
  (
    SELECT COUNT(*)
    FROM public.exam_results er
    WHERE er.user_id = u.id
  ),
  0
)
WHERE EXISTS (
  SELECT 1 FROM public.exam_results WHERE user_id = u.id
);

-- =====================================================
-- STEP 6: Verification Queries
-- =====================================================

-- Verify RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'users' 
  AND policyname LIKE '%leaderboard%';

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname LIKE 'idx_users_%';

-- Test level counts function
SELECT * FROM get_level_user_counts();

-- Sample leaderboard query (test)
SELECT 
  id,
  name,
  institute,
  xp,
  level,
  "examsTaken",
  "avatarUrl",
  "avatarColor"
FROM public.users
WHERE level = 'Rookie'
ORDER BY xp DESC
LIMIT 10;

-- =====================================================
-- SUCCESS!
-- =====================================================

SELECT 'Leaderboard database setup completed successfully!' as status;
