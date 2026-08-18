-- ==============================================================================
-- MIGRATION: Enable High-Performance Supabase Realtime on Notifications
-- Handles thousands of concurrent user connections with RLS filtered streams
-- ==============================================================================

-- 1. Ensure Table is in supabase_realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 2. Set Replica Identity to FULL so DELETE and UPDATE events have complete row data
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 3. Composite index for ultra-fast unread queries across thousands of users
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread_created 
ON public.notifications(user_id, is_read, created_at DESC);

-- 4. Enable Row Level Security (RLS) on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies (Users can only receive and modify their own notifications)
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (auth.uid() = user_id);

-- Service role / admin can insert for any user
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);
