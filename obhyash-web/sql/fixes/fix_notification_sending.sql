-- ==========================================================
-- FIX: Notification Sending for Admins
-- ==========================================================

-- 1. DROP RESTRICTIVE RLS POLICY
-- The old policy only allowed users to insert notifications for themselves.
DROP POLICY IF EXISTS "users_insert_own_notifications" ON public.notifications;

-- 2. CREATE NEW PERMISSIVE RLS POLICY
-- Allows:
-- a) Users to insert notification for themselves (e.g. valid for some flows)
-- b) Admins to insert notifications for ANY user (Critical for Notification Center)
CREATE POLICY "admin_insert_any_notification"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- 3. ENSURE BROADCAST FUNCTION EXISTS (For 'All Users' target)
-- This function runs as SECURITY DEFINER to bypass RLS for bulk inserts
CREATE OR REPLACE FUNCTION broadcast_notification_to_all(
  p_title text,
  p_message text,
  p_type text,
  p_priority text DEFAULT 'normal',
  p_action_url text DEFAULT NULL,
  p_icon text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  -- Insert a notification for every user in the users table
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    priority,
    action_url,
    icon,
    metadata
  )
  SELECT 
    id,
    p_title,
    p_message,
    p_type,
    p_priority,
    p_action_url,
    p_icon,
    p_metadata
  FROM public.users;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'count', v_count,
    'message', 'Notification queued for ' || v_count || ' users'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
