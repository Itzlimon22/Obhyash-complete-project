-- ==============================================================================
-- FIX: PUBLIC PROFILES VIEW
-- ==============================================================================
-- Problem: strict RLS prevents users from seeing Leaderboards/Search results.
-- Solution: Create a specific VIEW that exposes only NON-SENSITIVE data.
-- ==============================================================================

-- 1. Create the View (Safe columns only)
DROP VIEW IF EXISTS public.public_profiles;
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
    id,
    name,
    avatar_url,
    avatar_color,
    institute,
    division,
    xp,
    level,
    exams_taken,
    streak,
    role
FROM public.users;

-- 2. Grant Access to Authenticated Users (and Anon if needed)
-- Note: Views created by a superuser/admin bypass the underlying table's RLS
-- unless 'security_invoker' is set to true. We WANT to bypass RLS here 
-- because the RLS on 'users' allows ONLY the owner.
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon; -- Optional: for public landing pages

-- 3. (Verification)
-- SELECT * FROM public.public_profiles LIMIT 5;
