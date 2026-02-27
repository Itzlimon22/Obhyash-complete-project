-- Run this script in your Supabase SQL Editor

-- 1. Create the new blog comments table
CREATE TABLE public.blog_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_slug TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Policy: Anyone can read comments
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.blog_comments
FOR SELECT 
USING (true);

-- Policy: Only logged-in users can insert their own comments
CREATE POLICY "Users can insert their own comments."
ON public.blog_comments
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments."
ON public.blog_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments."
ON public.blog_comments
FOR DELETE
USING (auth.uid() = user_id);

-- 4. Create an index on post_slug for faster queries since we query by slug often
CREATE INDEX idx_blog_comments_post_slug ON public.blog_comments(post_slug);
