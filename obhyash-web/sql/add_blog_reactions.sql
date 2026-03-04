-- Migration: blog_reactions table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.blog_reactions (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_slug  TEXT NOT NULL,
  emoji      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT blog_reactions_unique UNIQUE (user_id, post_slug, emoji)
);

-- Indexes
CREATE INDEX IF NOT EXISTS blog_reactions_post_slug_idx ON public.blog_reactions (post_slug);
CREATE INDEX IF NOT EXISTS blog_reactions_user_idx     ON public.blog_reactions (user_id);

-- RLS
ALTER TABLE public.blog_reactions ENABLE ROW LEVEL SECURITY;

-- Aggregate counts are public (anonymous SELECT on counts done via API)
CREATE POLICY "Public can view reactions"
  ON public.blog_reactions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reactions"
  ON public.blog_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reactions"
  ON public.blog_reactions FOR DELETE
  USING (auth.uid() = user_id);
