-- ==============================================================
-- SQL Migration: Notification Delivery Logs, Anti-Fatigue & Delivery History
-- Obhyash Platform
-- ==============================================================

-- 1. Create notification_delivery_logs table to track every automated message sent
CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(60) NOT NULL, -- 'live_exam_30m', 'live_exam_started', 'leaderboard_published', 'streak_at_risk', 'streak_milestone', 'inactivity_comeback', 'low_activity', 'morning_routine'
    reference_id VARCHAR(100), -- exam_id, date, milestone number, etc.
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    route VARCHAR(255),
    channel_id VARCHAR(100) DEFAULT 'obhyash_general',
    fcm_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Performance Indexes for Instant Anti-Fatigue Queries
CREATE INDEX IF NOT EXISTS idx_notif_logs_user_created 
    ON public.notification_delivery_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notif_logs_user_type_ref 
    ON public.notification_delivery_logs(user_id, notification_type, reference_id);

CREATE INDEX IF NOT EXISTS idx_notif_logs_type_created 
    ON public.notification_delivery_logs(notification_type, created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all notification delivery logs" ON public.notification_delivery_logs;
CREATE POLICY "Admins can view all notification delivery logs"
    ON public.notification_delivery_logs FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own notification delivery logs" ON public.notification_delivery_logs;
CREATE POLICY "Users can view own notification delivery logs"
    ON public.notification_delivery_logs FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Enable Realtime if desired
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'notification_delivery_logs'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_delivery_logs;
    END IF;
END $$;
