-- Migration: Add Batch Field to Public Profiles & Leaderboard RPCs with Option B Level Thresholds
-- Description: Exposes student batch in public_profiles view and leaderboard functions
-- Implements Option B balanced XP progression:
-- Explorer: 0-999 XP
-- Challenger: 1000-2999 XP
-- Warrior: 3000-6999 XP
-- Scholar: 7000-14999 XP
-- Legend: 15000+ XP

-- 1. Ensure batch column is indexed on public.users
CREATE INDEX IF NOT EXISTS idx_users_batch_level_xp 
  ON public.users (batch, level, xp DESC);

-- 2. Create Option B level calculation function
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(xp bigint)
RETURNS text LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF xp >= 15000 THEN RETURN 'Legend';
  ELSIF xp >= 7000 THEN RETURN 'Scholar';
  ELSIF xp >= 3000 THEN RETURN 'Warrior';
  ELSIF xp >= 1000 THEN RETURN 'Challenger';
  ELSE RETURN 'Explorer';
  END IF;
END;
$$;

-- 3. Backfill all existing users with Option B levels based on their current XP
UPDATE public.users 
SET level = public.calculate_level_from_xp(COALESCE(xp, 0));

-- 4. Update public_profiles view
DROP VIEW IF EXISTS public.public_profiles CASCADE;
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
    batch,
    stream,
    role,
    is_subscribed,
    COALESCE(subscription->>'plan', 'Free') AS plan
FROM public.users;

GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 5. Drop existing functions first (to avoid PostgreSQL return type change error 42P13)
DROP FUNCTION IF EXISTS public.leaderboard_by_level(text);
DROP FUNCTION IF EXISTS public.leaderboard_by_level(text, integer, integer);
DROP FUNCTION IF EXISTS public.leaderboard_by_institute(text);
DROP FUNCTION IF EXISTS public.leaderboard_by_institute(text, integer, integer);

-- 6. Create leaderboard_by_level with pagination & batch & alias support
CREATE OR REPLACE FUNCTION public.leaderboard_by_level(
  p_level text,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id            uuid,
  name          text,
  institute     text,
  xp            int,
  level         text,
  exams_taken   int,
  avatar_url    text,
  avatar_color  text,
  streak        int,
  batch         text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, name, institute, xp, level, exams_taken, avatar_url, avatar_color, streak, batch
  FROM public.users
  WHERE (
    level ILIKE p_level
    OR (p_level ILIKE 'Explorer' AND level IN ('Explorer', 'Rookie', 'Beginner'))
    OR (p_level ILIKE 'Rookie' AND level IN ('Explorer', 'Rookie', 'Beginner'))
    OR (p_level ILIKE 'Challenger' AND level IN ('Challenger', 'Scout'))
    OR (p_level ILIKE 'Scout' AND level IN ('Challenger', 'Scout'))
    OR (p_level ILIKE 'Scholar' AND level IN ('Scholar', 'Titan', 'Luminary'))
    OR (p_level ILIKE 'Titan' AND level IN ('Scholar', 'Titan', 'Luminary'))
    OR (p_level ILIKE 'Legend' AND level IN ('Legend', 'Apex'))
  )
    AND (role IS NULL OR role = 'student')
  ORDER BY xp DESC
  OFFSET p_offset
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_by_level(text, integer, integer) TO anon, authenticated;

-- Single parameter overload for backward compatibility
CREATE OR REPLACE FUNCTION public.leaderboard_by_level(p_level text)
RETURNS TABLE (
  id            uuid,
  name          text,
  institute     text,
  xp            int,
  level         text,
  exams_taken   int,
  avatar_url    text,
  avatar_color  text,
  streak        int,
  batch         text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM public.leaderboard_by_level(p_level, 0, 100);
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_by_level(text) TO anon, authenticated;

-- 7. Create leaderboard_by_institute with pagination & batch support
CREATE OR REPLACE FUNCTION public.leaderboard_by_institute(
  p_institute text,
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  id            uuid,
  name          text,
  institute     text,
  xp            int,
  level         text,
  exams_taken   int,
  avatar_url    text,
  avatar_color  text,
  streak        int,
  batch         text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id, name, institute, xp, level, exams_taken, avatar_url, avatar_color, streak, batch
  FROM public.users
  WHERE institute = p_institute
    AND (role IS NULL OR role = 'student')
  ORDER BY xp DESC
  OFFSET p_offset
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_by_institute(text, integer, integer) TO anon, authenticated;

-- Single parameter overload for backward compatibility
CREATE OR REPLACE FUNCTION public.leaderboard_by_institute(p_institute text)
RETURNS TABLE (
  id            uuid,
  name          text,
  institute     text,
  xp            int,
  level         text,
  exams_taken   int,
  avatar_url    text,
  avatar_color  text,
  streak        int,
  batch         text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT * FROM public.leaderboard_by_institute(p_institute, 0, 100);
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_by_institute(text) TO anon, authenticated;
