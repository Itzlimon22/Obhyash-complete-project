-- ────────────────────────────────────────────────────────
-- Blog comment upvotes
-- Apply this migration in the Supabase SQL Editor
-- ────────────────────────────────────────────────────────

-- 1. Add upvote_count column to blog_comments
ALTER TABLE blog_comments
  ADD COLUMN IF NOT EXISTS upvote_count INTEGER NOT NULL DEFAULT 0;

-- 2. Per-user upvote tracking table
CREATE TABLE IF NOT EXISTS blog_comment_upvotes (
  comment_id UUID  NOT NULL REFERENCES blog_comments(id) ON DELETE CASCADE,
  user_id    UUID  NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (comment_id, user_id)
);

-- 3. RLS
ALTER TABLE blog_comment_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own comment upvotes"
  ON blog_comment_upvotes
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read comment upvotes"
  ON blog_comment_upvotes
  FOR SELECT
  USING (true);

-- 4. Trigger to keep upvote_count in sync
CREATE OR REPLACE FUNCTION _update_comment_upvote_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE blog_comments
       SET upvote_count = upvote_count + 1
     WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE blog_comments
       SET upvote_count = GREATEST(0, upvote_count - 1)
     WHERE id = OLD.comment_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_comment_upvote ON blog_comment_upvotes;
CREATE TRIGGER trg_comment_upvote
  AFTER INSERT OR DELETE ON blog_comment_upvotes
  FOR EACH ROW EXECUTE FUNCTION _update_comment_upvote_count();
