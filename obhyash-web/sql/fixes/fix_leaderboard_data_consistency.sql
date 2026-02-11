-- ==============================================================================
-- FIX LEADERBOARD DATA CONSISTENCY
-- ==============================================================================
-- Problem: Users are signed up with level = 'Beginner', but Leaderboard expects 'Rookie'.
-- This script normalizes all users to the correct level based on the Leaderboard system.

-- ========================================
-- STEP 1: Normalize 'Beginner' to 'Rookie'
-- ========================================
UPDATE public.users
SET level = 'Rookie'
WHERE level = 'Beginner';

-- ========================================
-- STEP 2: Ensure all users have a valid level based on XP
-- ========================================
-- This acts as a self-healing step to fix any other discrepancies
UPDATE public.users
SET level = CASE
  WHEN xp >= 5000 THEN 'Legend'
  WHEN xp >= 3500 THEN 'Titan'
  WHEN xp >= 2000 THEN 'Warrior'
  WHEN xp >= 800 THEN 'Scout'
  ELSE 'Rookie'
END;

-- ========================================
-- STEP 3: Verify the fix
-- ========================================
-- SELECT level, COUNT(*) FROM public.users GROUP BY level;
