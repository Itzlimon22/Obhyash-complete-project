-- Fix public_profiles view to include 'role' and ensure it filters/exposes correct data
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
    role -- Ensure role is exposed for filtering
FROM public.users;

-- Fix get_level_user_counts to properly filter by student role
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

-- Grant permissions (just in case)
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
