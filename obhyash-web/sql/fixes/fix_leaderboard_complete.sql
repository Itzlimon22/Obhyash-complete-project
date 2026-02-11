-- ==============================================================================
-- COMPLETE LEADERBOARD FIX
-- ==============================================================================
-- Run this in your Supabase SQL Editor to fix the leaderboard permanently.
--
-- Fixes:
-- 1. Updates public_profiles view to include 'role' and 'streak' columns
-- 2. Creates/updates get_level_user_counts() RPC to filter by student role
-- 3. Ensures level is auto-calculated from XP via trigger
-- 4. Backfills any users with incorrect levels
-- ==============================================================================

-- ========================================
-- STEP 1: Fix public_profiles view
-- ========================================
DROP VIEW IF EXISTS public.public_profiles;
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

-- Grant permissions
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- ========================================
-- STEP 2: Fix get_level_user_counts RPC
-- ========================================
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
  AND role = 'student'
  GROUP BY level;
$$;

-- ========================================
-- STEP 3: Auto-calculate level from XP
-- ========================================
CREATE OR REPLACE FUNCTION calculate_level_from_xp(xp bigint)
RETURNS text AS $$
BEGIN
  IF xp >= 5000 THEN RETURN 'Legend';
  ELSIF xp >= 3500 THEN RETURN 'Titan';
  ELSIF xp >= 2000 THEN RETURN 'Warrior';
  ELSIF xp >= 800 THEN RETURN 'Scout';
  ELSE RETURN 'Rookie';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION update_user_level_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level := calculate_level_from_xp(COALESCE(NEW.xp, 0));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_user_level ON public.users;
CREATE TRIGGER trg_update_user_level
BEFORE INSERT OR UPDATE OF xp ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_user_level_trigger();

-- ========================================
-- STEP 4: Backfill existing users
-- ========================================
UPDATE public.users
SET level = calculate_level_from_xp(COALESCE(xp, 0));

-- ========================================
-- VERIFICATION QUERIES (run these to check)
-- ========================================
-- SELECT * FROM public.public_profiles LIMIT 5;
-- SELECT * FROM get_level_user_counts();
