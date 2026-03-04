-- Migration: Add parent_id to blog_comments for threaded replies
-- Run this in Supabase SQL Editor

ALTER TABLE public.blog_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON public.blog_comments(parent_id);
