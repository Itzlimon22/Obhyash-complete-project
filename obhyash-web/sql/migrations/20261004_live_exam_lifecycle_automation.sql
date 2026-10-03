-- ==============================================================
-- SQL Migration: Automated Live Exam Lifecycle, Mobile Push & Leaderboard Dispatch
-- Obhyash Platform
-- ==============================================================

-- 1. Ensure tracking notification columns exist in public.live_exams
ALTER TABLE public.live_exams 
ADD COLUMN IF NOT EXISTS is_leaderboard_notified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_start_notified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_upcoming_notified BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_live_exams_lb_notified ON public.live_exams(is_leaderboard_notified);
CREATE INDEX IF NOT EXISTS idx_live_exams_start_notified ON public.live_exams(is_start_notified);
CREATE INDEX IF NOT EXISTS idx_live_exams_upcoming_notified ON public.live_exams(is_upcoming_notified);

-- 2. PostgreSQL Stored Function to handle live exam lifecycle directly inside database
CREATE OR REPLACE FUNCTION public.process_live_exam_lifecycle()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_now TIMESTAMPTZ := clock_timestamp();
    v_practice_updated INT := 0;
    v_leaderboards_published INT := 0;
    v_notifs_sent INT := 0;
    v_stale_attempts_closed INT := 0;
    v_live_now_notified INT := 0;
    r_exam RECORD;
    r_attempt RECORD;
    r_user RECORD;
BEGIN
    -- Step 1: Auto-enable Practice and Answers for exams that have ended
    WITH updated_exams AS (
        UPDATE public.live_exams
        SET 
            is_practice_enabled = TRUE,
            is_answer_published = TRUE,
            updated_at = v_now
        WHERE 
            end_time <= v_now
            AND (is_practice_enabled IS NOT TRUE OR is_answer_published IS NOT TRUE)
        RETURNING id
    )
    SELECT count(*) INTO v_practice_updated FROM updated_exams;

    -- Step 2: Auto-close any lingering 'ongoing' attempts for exams that ended more than 5 minutes ago
    WITH closed_attempts AS (
        UPDATE public.live_exam_attempts a
        SET 
            status = 'submitted',
            submit_time = COALESCE(a.submit_time, v_now)
        FROM public.live_exams e
        WHERE 
            a.live_exam_id = e.id
            AND a.status = 'ongoing'
            AND e.end_time <= (v_now - INTERVAL '5 minutes')
        RETURNING a.id
    )
    SELECT count(*) INTO v_stale_attempts_closed FROM closed_attempts;

    -- Step 3: Auto-publish leaderboards 15 minutes after end_time & notify participants
    FOR r_exam IN
        SELECT id, title, end_time, is_leaderboard_notified
        FROM public.live_exams
        WHERE 
            end_time <= (v_now - INTERVAL '15 minutes')
            AND is_leaderboard_published IS NOT TRUE
    LOOP
        UPDATE public.live_exams
        SET 
            is_leaderboard_published = TRUE,
            updated_at = v_now
        WHERE id = r_exam.id;

        v_leaderboards_published := v_leaderboards_published + 1;

        -- Dispatch notifications if not already notified
        IF r_exam.is_leaderboard_notified IS NOT TRUE THEN
            FOR r_attempt IN
                SELECT DISTINCT user_id
                FROM public.live_exam_attempts
                WHERE live_exam_id = r_exam.id
            LOOP
                INSERT INTO public.notifications (
                    user_id,
                    title,
                    message,
                    body,
                    link,
                    data,
                    type,
                    priority,
                    is_read,
                    created_at
                ) VALUES (
                    r_attempt.user_id,
                    r_exam.title || ' এর মেধা তালিকা প্রকাশিত হয়েছে',
                    'লাইভ পরীক্ষার ফলাফল ও মেধা তালিকা এখন উন্মুক্ত। তোমার চূড়ান্ত র‍্যাংক ও স্কোর দেখে নাও।',
                    'লাইভ পরীক্ষার ফলাফল ও মেধা তালিকা এখন উন্মুক্ত। তোমার চূড়ান্ত র‍্যাংক ও স্কোর দেখে নাও।',
                    '/live-exams/' || r_exam.id,
                    jsonb_build_object(
                        'route', '/live_exam_details/' || r_exam.id, 
                        'exam_id', r_exam.id, 
                        'type', 'leaderboard_published',
                        'channel_id', 'obhyash_live_exams'
                    ),
                    'live_exam',
                    'high',
                    FALSE,
                    v_now
                );
                v_notifs_sent := v_notifs_sent + 1;
            END LOOP;

            UPDATE public.live_exams
            SET is_leaderboard_notified = TRUE
            WHERE id = r_exam.id;
        END IF;
    END LOOP;

    -- Step 4: Notify when Exam goes LIVE NOW
    FOR r_exam IN
        SELECT id, title, start_time, end_time
        FROM public.live_exams
        WHERE 
            start_time <= v_now
            AND end_time > v_now
            AND is_start_notified IS NOT TRUE
    LOOP
        FOR r_user IN
            SELECT id FROM public.users LIMIT 200
        LOOP
            INSERT INTO public.notifications (
                user_id,
                title,
                message,
                body,
                link,
                data,
                type,
                priority,
                is_read,
                created_at
            ) VALUES (
                r_user.id,
                r_exam.title || ' এখন লাইভ শুরু হয়েছে',
                'লাইভ পরীক্ষা শুরু হয়ে গেছে। দ্রুত অংশগ্রহণ করে সবার সাথে মেধা তালিকায় নিজের অবস্থান নিশ্চিত করো।',
                'লাইভ পরীক্ষা শুরু হয়ে গেছে। দ্রুত অংশগ্রহণ করে সবার সাথে মেধা তালিকায় নিজের অবস্থান নিশ্চিত করো।',
                '/live-exams/' || r_exam.id,
                jsonb_build_object(
                    'route', '/live_exam_details/' || r_exam.id, 
                    'exam_id', r_exam.id, 
                    'type', 'live_exam_started',
                    'channel_id', 'obhyash_live_exams'
                ),
                'live_exam',
                'high',
                FALSE,
                v_now
            );
            v_live_now_notified := v_live_now_notified + 1;
        END LOOP;

        UPDATE public.live_exams
        SET is_start_notified = TRUE
        WHERE id = r_exam.id;
    END LOOP;

    RETURN jsonb_build_object(
        'success', TRUE,
        'timestamp', v_now,
        'practice_updated', v_practice_updated,
        'stale_attempts_closed', v_stale_attempts_closed,
        'leaderboards_published', v_leaderboards_published,
        'notifications_sent', v_notifs_sent,
        'live_now_notified', v_live_now_notified
    );
END;
$$;
