-- Function to broadcast notification to ALL users efficiently
-- This avoids fetching all user IDs to the client and sending back thousands of insert requests
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
