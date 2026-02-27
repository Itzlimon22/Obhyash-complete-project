-- Run this script in your Supabase SQL Editor

-- 1. Create the new blog likes table
CREATE TABLE public.blog_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_slug TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    -- Ensure a user can only like a specific post ONE time
    UNIQUE(post_slug, user_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Policy: Anyone can read total likes
CREATE POLICY "Public likes are viewable by everyone." 
ON public.blog_likes
FOR SELECT 
USING (true);

-- Policy: Only logged-in users can insert their own like
CREATE POLICY "Users can insert their own likes."
ON public.blog_likes
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own like (unlike)
CREATE POLICY "Users can delete their own likes."
ON public.blog_likes
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Create an index on post_slug for faster queries since we count likes per slug
CREATE INDEX idx_blog_likes_post_slug ON public.blog_likes(post_slug);
