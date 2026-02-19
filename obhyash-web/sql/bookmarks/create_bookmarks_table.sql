-- ==========================================
-- SCRIPT: CREATE BOOKMARKS TABLE
-- DESCRIPTION: Stores per-user question bookmarks persistently.
-- Run this once in the Supabase SQL editor.
-- ==========================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id  TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Prevent duplicate bookmarks for the same question
  UNIQUE(user_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: each user can only read/write their own bookmarks
CREATE POLICY "Users manage own bookmarks"
  ON public.bookmarks
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
