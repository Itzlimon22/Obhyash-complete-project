-- ==============================================================
-- SQL Migration: Fix Live Exam Stale Attempts, Duration Capping & Zero Scores
-- Obhyash Smart Prep Platform
-- ==============================================================

-- 1. Correct existing stale / uncapped attempts in public.live_exam_attempts
UPDATE public.live_exam_attempts a
SET 
    score = COALESCE(a.score, 0),
    correct_count = COALESCE(a.correct_count, 0),
    wrong_count = COALESCE(a.wrong_count, 0),
    time_taken_seconds = LEAST(
        COALESCE(
            NULLIF(a.time_taken_seconds, 0), 
            CASE 
                WHEN a.submit_time IS NOT NULL AND a.start_time IS NOT NULL 
                THEN GREATEST(0, EXTRACT(EPOCH FROM (a.submit_time - a.start_time))::int)
                ELSE (COALESCE(e.duration_minutes, 30) * 60)
            END
        ),
        (COALESCE(e.duration_minutes, 30) * 60)
    ),
    time_taken_ms = LEAST(
        COALESCE(
            NULLIF(a.time_taken_ms, 0), 
            CASE 
                WHEN a.submit_time IS NOT NULL AND a.start_time IS NOT NULL 
                THEN GREATEST(0, (EXTRACT(EPOCH FROM (a.submit_time - a.start_time)) * 1000)::bigint)
                ELSE (COALESCE(e.duration_minutes, 30) * 60 * 1000)
            END
        ),
        (COALESCE(e.duration_minutes, 30) * 60 * 1000)
    )
FROM public.live_exams e
WHERE a.live_exam_id = e.id
  AND a.status = 'submitted';

-- 2. Update process_live_exam_lifecycle to cap duration & ensure zero score on auto-closed attempts
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
    -- Capping time_taken_seconds to exam duration and defaulting null scores to 0
    WITH closed_attempts AS (
        UPDATE public.live_exam_attempts a
        SET 
            status = 'submitted',
            score = COALESCE(a.score, 0),
            correct_count = COALESCE(a.correct_count, 0),
            wrong_count = COALESCE(a.wrong_count, 0),
            time_taken_seconds = LEAST(
                COALESCE(NULLIF(a.time_taken_seconds, 0), (COALESCE(e.duration_minutes, 30) * 60)),
                (COALESCE(e.duration_minutes, 30) * 60)
            ),
            time_taken_ms = LEAST(
                COALESCE(NULLIF(a.time_taken_ms, 0), (COALESCE(e.duration_minutes, 30) * 60 * 1000)),
                (COALESCE(e.duration_minutes, 30) * 60 * 1000)
            ),
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
                        'type', 'live_exam_results_published',
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

    RETURN jsonb_build_object(
        'success', TRUE,
        'timestamp', v_now,
        'practice_updated', v_practice_updated,
        'stale_attempts_closed', v_stale_attempts_closed,
        'leaderboards_published', v_leaderboards_published,
        'notifications_sent', v_notifs_sent
    );
END;
$$;
