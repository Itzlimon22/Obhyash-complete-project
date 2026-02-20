-- ==========================================
-- SCRIPT: ADD MISSING COLUMNS TO REPORTS TABLE
-- DESCRIPTION: Adds reporter_name, image_url, and resolution tracking columns 
-- that were originally omitted from the initial reports schema.
-- ==========================================

ALTER TABLE IF EXISTS public.reports
ADD COLUMN IF NOT EXISTS reporter_name TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS admin_comment TEXT;
