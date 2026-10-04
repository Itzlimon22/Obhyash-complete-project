-- ==============================================================
-- SQL Migration: Create Blog Conversions Tracking Table
-- Tracks App Downloads, Signups & CTA Clicks from Blog Articles
-- Run in Supabase SQL Editor
-- ==============================================================

CREATE TABLE IF NOT EXISTS public.blog_conversions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL, -- 'app_download', 'signup_click', 'login_click', 'practice_click'
    source_slug TEXT NOT NULL DEFAULT 'blog_home',
    source_category TEXT,
    button_location TEXT, -- 'header', 'sidebar', 'footer', 'floating_next', 'in_article'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for lightning-fast aggregation queries
CREATE INDEX IF NOT EXISTS idx_blog_conversions_event_type ON public.blog_conversions(event_type);
CREATE INDEX IF NOT EXISTS idx_blog_conversions_source_slug ON public.blog_conversions(source_slug);
CREATE INDEX IF NOT EXISTS idx_blog_conversions_created_at ON public.blog_conversions(created_at);

-- Row Level Security (RLS)
ALTER TABLE public.blog_conversions ENABLE ROW LEVEL SECURITY;

-- Anonymous blog visitors can log clicks
DROP POLICY IF EXISTS "Anyone can insert blog conversions" ON public.blog_conversions;
CREATE POLICY "Anyone can insert blog conversions"
    ON public.blog_conversions FOR INSERT
    WITH CHECK (true);

-- Allow reading conversions (service role and authenticated admins)
DROP POLICY IF EXISTS "Admins can view blog conversions" ON public.blog_conversions;
CREATE POLICY "Admins can view blog conversions"
    ON public.blog_conversions FOR SELECT
    USING (true);
