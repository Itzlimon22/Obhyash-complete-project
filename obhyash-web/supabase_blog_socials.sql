-- Run this script in your Supabase SQL Editor to enable blog likes and comments

-- ==========================================
-- 1. Create Blog Likes Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.blog_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_slug TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(post_slug, user_id)
);

-- Enable RLS for Blog Likes
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read likes
CREATE POLICY "Anyone can read blog_likes"
ON public.blog_likes
FOR SELECT
USING (true);

-- Allow authenticated users to insert their own likes
CREATE POLICY "Users can insert their own likes"
ON public.blog_likes
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own likes
CREATE POLICY "Users can delete their own likes"
ON public.blog_likes
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_slug ON public.blog_likes(post_slug);

-- ==========================================
-- 2. Create Blog Comments Table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_slug TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Blog Comments
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read comments
CREATE POLICY "Anyone can read blog_comments"
ON public.blog_comments
FOR SELECT
USING (true);

-- Allow authenticated users to insert comments
CREATE POLICY "Users can insert their own comments"
ON public.blog_comments
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.blog_comments
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for sorting comments
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_slug ON public.blog_comments(post_slug);
