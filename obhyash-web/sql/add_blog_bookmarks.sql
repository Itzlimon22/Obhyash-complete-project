-- Migration: Blog bookmarks table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.blog_bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
  UNIQUE(user_id, post_slug)
);

ALTER TABLE public.blog_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookmarks"
  ON public.blog_bookmarks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON public.blog_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON public.blog_bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_blog_bookmarks_user_id ON public.blog_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_bookmarks_post_slug ON public.blog_bookmarks(post_slug);
