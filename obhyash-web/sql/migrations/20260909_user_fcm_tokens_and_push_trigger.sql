-- ==============================================================================
-- Obhyash: Push Notification Infrastructure
-- 1. user_fcm_tokens table     — stores per-device FCM tokens
-- 2. DB Webhook trigger        — fires Edge Function on notifications INSERT
-- ==============================================================================

-- ── 1. user_fcm_tokens ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_fcm_tokens (
    id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    fcm_token   text        NOT NULL UNIQUE,
    platform    text        NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios', 'web')),
    is_active   boolean     NOT NULL DEFAULT true,
    created_at  timestamptz NOT NULL DEFAULT now(),
    last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_user_id
    ON public.user_fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_fcm_tokens_active
    ON public.user_fcm_tokens(user_id) WHERE is_active = true;

-- RLS
ALTER TABLE public.user_fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can upsert their own FCM tokens" ON public.user_fcm_tokens;
CREATE POLICY "Users can upsert their own FCM tokens"
    ON public.user_fcm_tokens FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS (for Edge Function reads)
-- This is the default behaviour for service_role — no policy needed.

-- ── 2. pg_net extension (required for HTTP calls from triggers) ───────────────

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ── 3. Trigger function — calls Edge Function via pg_net on notifications INSERT
CREATE OR REPLACE FUNCTION public.trg_notify_push_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    v_url text := 'https://ufeepgzheopyaefuyegg.supabase.co';
    v_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZWVwZ3poZW9weWFlZnV5ZWdnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTE1MDQwNiwiZXhwIjoyMDg0NzI2NDA2fQ.EAj9CxI6y33WbEh63t-eIRHr3PelzX-KHWKl-t8T2ss';
BEGIN


    -- Fire-and-forget HTTP POST to Edge Function (non-blocking via pg_net)
    PERFORM net.http_post(
        url     := v_url || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
            'Content-Type',  'application/json',
            'Authorization', 'Bearer ' || v_key
        ),
        body    := jsonb_build_object(
            'type',       'INSERT',
            'table',      'notifications',
            'schema',     'public',
            'record',     to_jsonb(NEW)
        )
    );


    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Never block the notification INSERT due to push failure
    RAISE LOG '[push-trigger] Non-fatal error calling Edge Function: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Attach trigger to notifications table ──────────────────────────────────

DROP TRIGGER IF EXISTS trg_push_on_notification_insert ON public.notifications;
CREATE TRIGGER trg_push_on_notification_insert
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_notify_push_on_insert();

DO $$
BEGIN
    RAISE NOTICE 'Push notification trigger installed successfully.';
END $$;

