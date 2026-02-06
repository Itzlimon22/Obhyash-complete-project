-- =====================================================
-- NOTIFICATION SYSTEM DATABASE SCHEMA
-- Run this in Supabase SQL Editor to enable notifications
-- =====================================================

-- =====================================================
-- STEP 1: Create Notifications Table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Content
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('exam_result', 'achievement', 'level_up', 'announcement', 'system')),
  
  -- Metadata
  is_read boolean DEFAULT false,
  action_url text,
  icon text,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Related Data (JSON for flexibility)
  metadata jsonb DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  read_at timestamptz,
  expires_at timestamptz
);

-- =====================================================
-- STEP 2: Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);

-- =====================================================
-- STEP 3: Enable RLS (Row Level Security)
-- =====================================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_select_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_insert_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON public.notifications;
DROP POLICY IF EXISTS "users_delete_own_notifications" ON public.notifications;

-- Users can view their own notifications
CREATE POLICY "users_select_own_notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own notifications (for admin/system use)
CREATE POLICY "users_insert_own_notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications (mark as read, etc.)
CREATE POLICY "users_update_own_notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "users_delete_own_notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- STEP 4: Helper Functions
-- =====================================================

-- Function to create a notification for a user
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_priority text DEFAULT 'normal',
  p_action_url text DEFAULT NULL,
  p_icon text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    priority,
    action_url,
    icon,
    metadata
  ) VALUES (
    p_user_id,
    p_title,
    p_message,
    p_type,
    p_priority,
    p_action_url,
    p_icon,
    p_metadata
  )
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE user_id = auth.uid() AND is_read = false;
END;
$$;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count()
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COUNT(*)
  FROM public.notifications
  WHERE user_id = auth.uid() AND is_read = false;
$$;

-- =====================================================
-- STEP 5: Trigger for Auto-Notifications
-- =====================================================

-- Trigger function for exam result notifications
CREATE OR REPLACE FUNCTION notify_exam_result()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification when exam result is saved
  PERFORM create_notification(
    NEW.user_id,
    'পরীক্ষার ফলাফল প্রকাশিত',
    'আপনার ' || NEW.subject || ' পরীক্ষার ফলাফল প্রকাশিত হয়েছে। স্কোর: ' || NEW.score || '/' || NEW.total_marks,
    'exam_result',
    'normal',
    '/exam-history',
    '📊',
    jsonb_build_object('exam_id', NEW.id, 'subject', NEW.subject, 'score', NEW.score)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_exam_result ON public.exam_results;

-- Create trigger on exam_results table
CREATE TRIGGER trigger_notify_exam_result
AFTER INSERT ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION notify_exam_result();

-- Trigger function for level up notifications
CREATE OR REPLACE FUNCTION notify_level_up()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification when user levels up
  IF OLD.level IS DISTINCT FROM NEW.level AND NEW.level IS NOT NULL THEN
    PERFORM create_notification(
      NEW.id,
      'অভিনন্দন! লেভেল আপগ্রেড',
      'আপনি ' || NEW.level || ' লেভেলে উন্নীত হয়েছেন! 🎉',
      'level_up',
      'high',
      '/leaderboard',
      '🏆',
      jsonb_build_object('new_level', NEW.level, 'old_level', OLD.level, 'xp', NEW.xp)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_level_up ON public.users;

-- Create trigger on users table for level changes
CREATE TRIGGER trigger_notify_level_up
AFTER UPDATE ON public.users
FOR EACH ROW
WHEN (OLD.level IS DISTINCT FROM NEW.level)
EXECUTE FUNCTION notify_level_up();

-- =====================================================
-- STEP 6: Seed Some Test Notifications (Optional)
-- =====================================================

-- Uncomment to create test notifications for the current user
-- Replace with your actual user ID for testing
/*
DO $$
DECLARE
  test_user_id uuid := 'YOUR_USER_ID_HERE';
BEGIN
  PERFORM create_notification(
    test_user_id,
    'স্বাগতম!',
    'আপনার ওভহ্যাশ অ্যাকাউন্টে স্বাগতম। পরীক্ষা শুরু করতে প্রস্তুত হন!',
    'system',
    'normal',
    '/dashboard',
    '👋'
  );
  
  PERFORM create_notification(
    test_user_id,
    'পদার্থবিজ্ঞান পরীক্ষা',
    'আপনার পদার্থবিজ্ঞান পরীক্ষার ফলাফল প্রকাশিত হয়েছে।',
    'exam_result',
    'normal',
    '/exam-history',
    '📊'
  );
END $$;
*/

-- =====================================================
-- STEP 7: Verification Queries
-- =====================================================

-- Verify table created
SELECT 'Notifications table created' as status, COUNT(*) as row_count FROM public.notifications;

-- Verify indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'notifications'
ORDER BY indexname;

-- Verify RLS policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Verify functions created
SELECT 
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname LIKE '%notification%'
  AND pronamespace = 'public'::regnamespace
ORDER BY proname;

-- =====================================================
-- SUCCESS!
-- =====================================================

SELECT 'Notification system database setup completed successfully!' as status;
