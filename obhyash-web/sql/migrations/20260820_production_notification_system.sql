-- ============================================================================
-- OBHYASH PRODUCTION NOTIFICATION SYSTEM MIGRATION
-- ============================================================================

-- 1. Device Push Tokens Table (Supports multi-device per user)
CREATE TABLE IF NOT EXISTS public.user_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL UNIQUE,
    platform TEXT NOT NULL CHECK (platform IN ('android', 'ios', 'web')),
    device_model TEXT,
    app_version TEXT,
    is_active BOOLEAN DEFAULT true,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user 
    ON public.user_fcm_tokens(user_id) WHERE is_active = true;

-- 2. In-App Notifications Table (Powers the notification center / bell modal)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('streak', 'live_exam', 'result', 'announcement', 'system', 'leaderboard', 'milestone')),
    data JSONB DEFAULT '{}'::jsonb, -- e.g. { "route": "/exam-setup", "exam_id": "..." }
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
    ON public.notifications(user_id, is_read, created_at DESC);

-- 3. User Notification Preferences Table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_reminders BOOLEAN DEFAULT true,
    live_exam_alerts BOOLEAN DEFAULT true,
    results_alerts BOOLEAN DEFAULT true,
    daily_challenge BOOLEAN DEFAULT true,
    humor_mode BOOLEAN DEFAULT true, -- Enable witty / Chorcha style reminders
    sound_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- 4a. Policies for user_fcm_tokens
DROP POLICY IF EXISTS "Users can view own FCM tokens" ON public.user_fcm_tokens;
CREATE POLICY "Users can view own FCM tokens"
    ON public.user_fcm_tokens FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own FCM tokens" ON public.user_fcm_tokens;
CREATE POLICY "Users can insert own FCM tokens"
    ON public.user_fcm_tokens FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own FCM tokens" ON public.user_fcm_tokens;
CREATE POLICY "Users can update own FCM tokens"
    ON public.user_fcm_tokens FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own FCM tokens" ON public.user_fcm_tokens;
CREATE POLICY "Users can delete own FCM tokens"
    ON public.user_fcm_tokens FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 4b. Policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Service role / triggers can insert notifications
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications"
    ON public.notifications FOR INSERT
    TO authenticated, service_role
    WITH CHECK (true);

-- 4c. Policies for user_notification_preferences
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can view own preferences"
    ON public.user_notification_preferences FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own preferences" ON public.user_notification_preferences;
CREATE POLICY "Users can manage own preferences"
    ON public.user_notification_preferences FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 5. Helper Function to Insert Notification
CREATE OR REPLACE FUNCTION public.create_user_notification(
    p_user_id UUID,
    p_title TEXT,
    p_body TEXT,
    p_type TEXT DEFAULT 'system',
    p_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_notif_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, body, type, data, is_read, created_at)
    VALUES (p_user_id, p_title, p_body, p_type, p_data, false, NOW())
    RETURNING id INTO v_notif_id;

    RETURN v_notif_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_user_notification(UUID, TEXT, TEXT, TEXT, JSONB) TO authenticated, service_role;


-- 6. Trigger: Auto-Send Notification when Exam is Evaluated
CREATE OR REPLACE FUNCTION public.trg_notify_on_exam_evaluated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_name TEXT := 'শিক্ষার্থী';
    v_subject TEXT := COALESCE(NEW.subject_label, NEW.subject, 'পরীক্ষা');
    v_score NUMERIC := COALESCE(NEW.score, 0);
    v_total NUMERIC := COALESCE(NEW.total_marks, NEW.total_questions, 0);
    v_title TEXT;
    v_body TEXT;
BEGIN
    IF NEW.user_id IS NULL THEN
        RETURN NEW;
    END IF;

    SELECT COALESCE(name, 'শিক্ষার্থী') INTO v_user_name FROM public.users WHERE id = NEW.user_id;

    IF v_score >= (v_total * 0.8) THEN
        v_title := 'দারুণ রেজাল্ট! 🌟 ' || v_subject;
        v_body := v_user_name || ', তুমি ' || v_total || ' নম্বরের মধ্যে ' || v_score || ' পেয়েছ! এই ধারাবাহিকতা ধরে রাখো 🔥';
    ELSIF v_score >= (v_total * 0.5) THEN
        v_title := 'ভালো হয়েছে! 👍 ' || v_subject;
        v_body := 'তোমার স্কোর: ' || v_score || '/' || v_total || '। ভুলগুলো দেখে নিয়ে আরেকটু ঝালিয়ে নাও 📚';
    ELSE
        v_title := 'হতাশ হয়ো না! 💪 ' || v_subject;
        v_body := v_user_name || ', প্র্যাকটিসই সাফল্যের চাবিকাঠি। সমাধান দেখে রিভিশন দিয়ে নাও 🎯';
    END IF;

    PERFORM public.create_user_notification(
        NEW.user_id,
        v_title,
        v_body,
        'result',
        jsonb_build_object('route', '/history', 'result_id', NEW.id)
    );

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exam_evaluated_notification ON public.exam_results;
CREATE TRIGGER trg_exam_evaluated_notification
AFTER INSERT ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.trg_notify_on_exam_evaluated();
