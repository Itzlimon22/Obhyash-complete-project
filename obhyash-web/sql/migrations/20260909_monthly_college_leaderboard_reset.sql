-- Migration: 20260909_monthly_college_leaderboard_reset.sql
-- Description: Monthly reset support for College and All Colleges Leaderboards

-- 1. Ensure indexes exist for rapid monthly leaderboard queries
CREATE INDEX IF NOT EXISTS idx_users_monthly_xp_active
ON public.users (monthly_xp_reset_at, monthly_xp DESC)
WHERE (role IS NULL OR role = 'student');

CREATE INDEX IF NOT EXISTS idx_users_institute_monthly_xp
ON public.users (institute, monthly_xp_reset_at, monthly_xp DESC)
WHERE (role IS NULL OR role = 'student');

-- 2. Update leaderboard_by_institute to return current-month isolated XP
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
SET search_path = public, pg_temp
AS $$
  SELECT 
    id, 
    name, 
    institute, 
    CASE 
      WHEN monthly_xp_reset_at IS NULL OR date_trunc('month', NOW() AT TIME ZONE 'UTC') > date_trunc('month', monthly_xp_reset_at AT TIME ZONE 'UTC') THEN 0 
      ELSE COALESCE(monthly_xp, 0) 
    END AS xp,
    level, 
    exams_taken, 
    avatar_url, 
    avatar_color, 
    streak, 
    batch
  FROM public.users
  WHERE institute = p_institute
    AND (role IS NULL OR role = 'student')
  ORDER BY 
    CASE 
      WHEN monthly_xp_reset_at IS NULL OR date_trunc('month', NOW() AT TIME ZONE 'UTC') > date_trunc('month', monthly_xp_reset_at AT TIME ZONE 'UTC') THEN 0 
      ELSE COALESCE(monthly_xp, 0) 
    END DESC,
    xp DESC
  OFFSET p_offset
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_by_institute(text, integer, integer) TO anon, authenticated, service_role;

-- Backward-compatibility single argument overload
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
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.leaderboard_by_institute(p_institute, 0, 100);
$$;

GRANT EXECUTE ON FUNCTION public.leaderboard_by_institute(text) TO anon, authenticated, service_role;

-- 3. Maintenance function to reset stale monthly_xp at start of month
CREATE OR REPLACE FUNCTION public.reset_monthly_leaderboard_if_new_month()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_count INT := 0;
BEGIN
  UPDATE public.users
  SET 
    monthly_xp = 0,
    monthly_xp_reset_at = date_trunc('month', NOW() AT TIME ZONE 'UTC')
  WHERE (role IS NULL OR role = 'student')
    AND (
      monthly_xp_reset_at IS NULL 
      OR date_trunc('month', NOW() AT TIME ZONE 'UTC') > date_trunc('month', monthly_xp_reset_at AT TIME ZONE 'UTC')
    )
    AND monthly_xp > 0;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_monthly_leaderboard_if_new_month() TO anon, authenticated, service_role;
