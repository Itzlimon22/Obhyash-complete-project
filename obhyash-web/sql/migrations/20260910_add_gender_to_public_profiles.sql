-- Migration: 20260910_add_gender_to_public_profiles.sql
-- Description: Add gender column to public_profiles view to prevent client queries failing when accessing user profiles

DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
    id,
    student_id,
    name,
    avatar_url,
    avatar_color,
    gender,
    xp, -- Lifetime XP (permanent)
    CASE 
        WHEN monthly_xp_reset_at IS NULL OR date_trunc('month', NOW()) > date_trunc('month', monthly_xp_reset_at)
        THEN 0
        ELSE COALESCE(monthly_xp, 0)
    END AS monthly_xp, -- Pure current calendar month XP
    monthly_xp_reset_at,
    level,
    exams_taken,
    streak,
    institute,
    batch,
    batch_change_count,
    stream,
    role,
    is_subscribed,
    COALESCE(subscription->>'plan', 'Free') AS plan
FROM public.users;

GRANT SELECT ON public.public_profiles TO authenticated, anon;
