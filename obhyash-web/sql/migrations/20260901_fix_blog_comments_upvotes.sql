-- ==============================================================
-- SQL Migration: Add Upvote Support & Metrics to Blog Comments
-- Run this in Supabase SQL Editor
-- ==============================================================

-- 1. Ensure blog_comments table exists with upvote_count column
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_slug TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvote_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- In case table already exists without upvote_count column:
ALTER TABLE public.blog_comments
    ADD COLUMN IF NOT EXISTS upvote_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.blog_comments
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE;

-- 2. Create blog_comment_upvotes table
CREATE TABLE IF NOT EXISTS public.blog_comment_upvotes (
    comment_id UUID NOT NULL REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_slug ON public.blog_comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON public.blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON public.blog_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_blog_comment_upvotes_comment_id ON public.blog_comment_upvotes(comment_id);
CREATE INDEX IF NOT EXISTS idx_blog_comment_upvotes_user_id ON public.blog_comment_upvotes(user_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comment_upvotes ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for blog_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.blog_comments;
CREATE POLICY "Anyone can view comments"
    ON public.blog_comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can post comments" ON public.blog_comments;
CREATE POLICY "Authenticated users can post comments"
    ON public.blog_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.blog_comments;
CREATE POLICY "Users can update own comments"
    ON public.blog_comments FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.blog_comments;
CREATE POLICY "Users can delete own comments"
    ON public.blog_comments FOR DELETE
    USING (auth.uid() = user_id);

-- 6. RLS Policies for blog_comment_upvotes
DROP POLICY IF EXISTS "Anyone can view comment upvotes" ON public.blog_comment_upvotes;
CREATE POLICY "Anyone can view comment upvotes"
    ON public.blog_comment_upvotes FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can manage own upvotes" ON public.blog_comment_upvotes;
CREATE POLICY "Users can manage own upvotes"
    ON public.blog_comment_upvotes FOR ALL
    USING (auth.uid() = user_id);

-- 7. Trigger to keep upvote_count strictly in sync
CREATE OR REPLACE FUNCTION public._update_comment_upvote_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.blog_comments
        SET upvote_count = upvote_count + 1
        WHERE id = NEW.comment_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.blog_comments
        SET upvote_count = GREATEST(0, upvote_count - 1)
        WHERE id = OLD.comment_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_upvote ON public.blog_comment_upvotes;
CREATE TRIGGER trg_comment_upvote
    AFTER INSERT OR DELETE ON public.blog_comment_upvotes
    FOR EACH ROW EXECUTE FUNCTION public._update_comment_upvote_count();

NOTIFY pgrst, 'reload schema';
