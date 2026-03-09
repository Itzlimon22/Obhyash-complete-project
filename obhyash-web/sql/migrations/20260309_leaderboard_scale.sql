-- ============================================================
-- Leaderboard Scaling Migration
-- Covers: indexes, materialized view, refresh function, cron
-- Run once in Supabase SQL editor (dashboard or CLI)
-- ============================================================

-- 1. Composite indexes on the underlying users table
-- (public_profiles is a VIEW on public.users — indexes must go on the base table.)
-- These turn full-table-scans into index-only scans.
CREATE INDEX IF NOT EXISTS idx_users_level_xp
  ON public.users (level, xp DESC);

CREATE INDEX IF NOT EXISTS idx_users_institute_xp
  ON public.users (institute, xp DESC)
  WHERE institute IS NOT NULL AND institute <> '';

-- 2. Materialized view: institute rankings (top-5 avg XP per college)
-- Replaces the 5,000-row JS fetch + sort that runs on every page load.
DROP MATERIALIZED VIEW IF EXISTS mv_institute_rankings;

CREATE MATERIALIZED VIEW mv_institute_rankings AS
SELECT
  institute,
  COUNT(*)                                                  AS student_count,
  ROUND(
    AVG(xp) FILTER (WHERE rnk <= 5)
  )::int                                                    AS avg_top5_xp
FROM (
  SELECT
    institute,
    xp,
    ROW_NUMBER() OVER (PARTITION BY institute ORDER BY xp DESC) AS rnk
  FROM public.users
  WHERE institute IS NOT NULL
    AND institute <> ''
    AND role = 'student'
) ranked
GROUP BY institute
HAVING COUNT(*) >= 5
ORDER BY avg_top5_xp DESC;

-- Unique index required for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_institute_rankings_institute
  ON mv_institute_rankings (institute);

-- 3. Grant read access to the anon / authenticated roles
GRANT SELECT ON mv_institute_rankings TO anon, authenticated;

-- 4. RPC: refresh the materialized view (called by the cron job)
CREATE OR REPLACE FUNCTION refresh_institute_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_institute_rankings;
END;
$$;

-- 5. Schedule the refresh every 15 minutes via pg_cron
-- (Enable the pg_cron extension in Supabase Dashboard → Database → Extensions first)
-- If pg_cron is already enabled, this is safe to re-run.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.schedule(
      'refresh-institute-rankings',     -- job name
      '*/15 * * * *',                   -- every 15 minutes
      'SELECT refresh_institute_rankings()'
    );
  ELSE
    RAISE NOTICE 'pg_cron not enabled. Enable it in Supabase Dashboard and re-run the cron.schedule() line.';
  END IF;
END;
$$;

-- 6. RPC: leaderboard_by_level
-- Returns top-100 students for a given level as a single indexed query.
-- The composite index idx_profiles_level_xp makes this extremely fast.
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
    AND role = 'student'
  ORDER BY xp DESC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION leaderboard_by_level(text) TO anon, authenticated;

-- 7. RPC: leaderboard_by_institute
-- Returns top-100 students in a specific institute.
CREATE OR REPLACE FUNCTION leaderboard_by_institute(p_institute text)
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
  WHERE institute = p_institute
  ORDER BY xp DESC
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION leaderboard_by_institute(text) TO anon, authenticated;
