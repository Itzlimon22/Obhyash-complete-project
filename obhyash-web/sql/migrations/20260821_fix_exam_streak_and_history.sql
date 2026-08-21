-- ==============================================================================
-- Migration: 20260821_fix_exam_streak_and_history.sql
-- Description: 
--  1. Ensures exam_results has both 'created_at' and 'date' columns with DEFAULT NOW().
--  2. Uses COALESCE(created_at, date, NOW()) in streak calculation.
--  3. Safe exception handling on all triggers (so no trigger can roll back exam submission).
--  4. Backfills all streaks immediately.
-- ==============================================================================

-- 1. Ensure columns exist and defaults are set
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS subject_label TEXT;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'evaluated';
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS negative_marking DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'digital';

-- Backfill timestamps
UPDATE public.exam_results SET created_at = COALESCE(created_at, date, NOW()) WHERE created_at IS NULL;
UPDATE public.exam_results SET date = COALESCE(date, created_at, NOW()) WHERE date IS NULL;

-- Ensure notifications table columns
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data JSONB;

-- 2. Core Streak Calculation Function (Using COALESCE for created_at & date)
CREATE OR REPLACE FUNCTION public.recalculate_user_streak(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_today DATE := (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE;
    v_yesterday DATE := v_today - INTERVAL '1 day';
    v_cursor DATE;
    v_streak INT := 0;
    v_has_today BOOLEAN := FALSE;
    v_last_active_date DATE := NULL;
    v_active_dates DATE[];
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'user_id is null');
    END IF;

    -- Collect all distinct calendar dates on which user completed at least 1 exam in Asia/Dhaka time
    WITH combined_dates AS (
        SELECT (COALESCE(created_at, date, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
        FROM public.exam_results
        WHERE user_id = p_user_id
          AND (status IS NULL OR status = 'evaluated' OR score IS NOT NULL)

        UNION

        SELECT (COALESCE(submit_time, created_at, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
        FROM public.live_exam_attempts
        WHERE user_id = p_user_id
          AND (status = 'submitted' OR score IS NOT NULL)
    )
    SELECT ARRAY_AGG(exam_date ORDER BY exam_date DESC)
    INTO v_active_dates
    FROM (
        SELECT DISTINCT exam_date FROM combined_dates WHERE exam_date IS NOT NULL
    ) sub;

    -- If no exams found at all
    IF v_active_dates IS NULL OR array_length(v_active_dates, 1) IS NULL THEN
        UPDATE public.users
        SET streak = 0,
            last_streak_date = NULL,
            updated_at = NOW()
        WHERE id = p_user_id;

        RETURN jsonb_build_object(
            'streak', 0,
            'has_completed_today', false,
            'last_active_date', null
        );
    END IF;

    v_last_active_date := v_active_dates[1];
    v_has_today := (v_today = ANY(v_active_dates));

    -- Determine starting cursor for consecutive days count
    IF v_has_today THEN
        v_cursor := v_today;
    ELSIF v_yesterday = ANY(v_active_dates) THEN
        v_cursor := v_yesterday;
    ELSE
        v_cursor := NULL;
    END IF;

    IF v_cursor IS NOT NULL THEN
        WHILE v_cursor = ANY(v_active_dates) LOOP
            v_streak := v_streak + 1;
            v_cursor := (v_cursor - INTERVAL '1 day')::DATE;
        END LOOP;
    END IF;

    -- Update public.users table safely
    UPDATE public.users
    SET streak = v_streak,
        last_streak_date = (v_last_active_date::TIMESTAMP WITH TIME ZONE AT TIME ZONE 'Asia/Dhaka'),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'streak', v_streak,
        'has_completed_today', v_has_today,
        'last_active_date', v_last_active_date
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('streak', 0, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_user_streak(UUID) TO anon, authenticated, service_role;


-- 3. Unified Streak Info RPC (Bulletproof & Exact Daily Exam Counts)
CREATE OR REPLACE FUNCTION public.get_user_streak_info(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := COALESCE(p_user_id, auth.uid());
    v_today DATE := (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE;
    v_thirty_days_ago DATE := v_today - INTERVAL '29 days';
    v_day_of_week INT;
    v_start_of_week DATE;
    v_week_activity BOOLEAN[] := ARRAY[false, false, false, false, false, false, false];
    v_last_30_days INT[] := ARRAY_FILL(0, ARRAY[30]);
    v_sync_res JSONB;
    v_streak INT := 0;
    v_has_today BOOLEAN := FALSE;
    v_last_active DATE := NULL;
    r RECORD;
    v_diff INT;
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('error', 'user_id is required');
    END IF;

    -- Trigger atomic recalculation
    v_sync_res := public.recalculate_user_streak(v_uid);
    v_streak := COALESCE((v_sync_res->>'streak')::INT, 0);
    v_has_today := COALESCE((v_sync_res->>'has_completed_today')::BOOLEAN, FALSE);
    IF (v_sync_res->>'last_active_date') IS NOT NULL THEN
        v_last_active := (v_sync_res->>'last_active_date')::DATE;
    END IF;

    -- Calculate current week (Sun=0 to Sat=6) in Asia/Dhaka
    v_day_of_week := EXTRACT(DOW FROM v_today)::INT;
    v_start_of_week := v_today - (v_day_of_week * INTERVAL '1 day')::INTERVAL;

    -- Compute week activity (Sun=1 to Sat=7 in 1-based PG array)
    FOR r IN (
        WITH all_exams AS (
            SELECT (COALESCE(created_at, date, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
            FROM public.exam_results
            WHERE user_id = v_uid
              AND (status IS NULL OR status = 'evaluated' OR score IS NOT NULL)
              AND (COALESCE(created_at, date, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE >= v_start_of_week

            UNION ALL

            SELECT (COALESCE(submit_time, created_at, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
            FROM public.live_exam_attempts
            WHERE user_id = v_uid
              AND (status = 'submitted' OR score IS NOT NULL)
              AND (COALESCE(submit_time, created_at, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE >= v_start_of_week
        )
        SELECT DISTINCT exam_date FROM all_exams
    ) LOOP
        v_diff := (r.exam_date - v_start_of_week);
        IF v_diff >= 0 AND v_diff < 7 THEN
            v_week_activity[v_diff + 1] := true;
        END IF;
    END LOOP;

    -- Compute 30 days activity heatmap with EXACT COUNT of exams per day (index 1 to 30: 1 = 29 days ago, 30 = today)
    FOR r IN (
        WITH all_exams AS (
            SELECT (COALESCE(created_at, date, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
            FROM public.exam_results
            WHERE user_id = v_uid
              AND (status IS NULL OR status = 'evaluated' OR score IS NOT NULL)
              AND (COALESCE(created_at, date, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE >= v_thirty_days_ago

            UNION ALL

            SELECT (COALESCE(submit_time, created_at, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
            FROM public.live_exam_attempts
            WHERE user_id = v_uid
              AND (status = 'submitted' OR score IS NOT NULL)
              AND (COALESCE(submit_time, created_at, NOW()) AT TIME ZONE 'Asia/Dhaka')::DATE >= v_thirty_days_ago
        )
        SELECT exam_date, COUNT(*)::INT AS cnt
        FROM all_exams
        WHERE exam_date IS NOT NULL
        GROUP BY exam_date
    ) LOOP
        v_diff := (r.exam_date - v_thirty_days_ago);
        IF v_diff >= 0 AND v_diff < 30 THEN
            v_last_30_days[v_diff + 1] := r.cnt;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'current_streak', v_streak,
        'has_completed_today', v_has_today,
        'last_active_date', v_last_active,
        'week_activity', v_week_activity,
        'last_30_days', v_last_30_days
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'current_streak', 0,
        'has_completed_today', false,
        'error', SQLERRM
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_streak_info(UUID) TO anon, authenticated, service_role;


-- 4. Fail-safe Trigger for Exam Results Streak Sync
CREATE OR REPLACE FUNCTION public.trg_fn_recalc_streak_exam_results()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    BEGIN
        IF NEW.user_id IS NOT NULL THEN
            PERFORM public.recalculate_user_streak(NEW.user_id);
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Never let streak failure abort the exam result insertion
        RAISE WARNING 'Streak recalculation failed in trigger: %', SQLERRM;
    END;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_streak_sync_on_exam_results ON public.exam_results;
CREATE TRIGGER trg_streak_sync_on_exam_results
AFTER INSERT OR UPDATE OF status, score ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_recalc_streak_exam_results();


-- 5. Fail-safe Notification Trigger on Exam Results
CREATE OR REPLACE FUNCTION public.create_user_notification(
    p_user_id UUID,
    p_title TEXT,
    p_body TEXT,
    p_type TEXT DEFAULT 'general',
    p_data JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_notif_id UUID;
    v_link TEXT := p_data->>'route';
BEGIN
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        body,
        link,
        type,
        data,
        is_read,
        created_at
    )
    VALUES (
        p_user_id,
        p_title,
        p_body,
        p_body,
        v_link,
        p_type,
        p_data,
        false,
        NOW()
    )
    RETURNING id INTO v_notif_id;

    RETURN v_notif_id;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

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
    BEGIN
        IF NEW.user_id IS NOT NULL THEN
            SELECT COALESCE(name, 'শিক্ষার্থী') INTO v_user_name FROM public.users WHERE id = NEW.user_id;

            IF v_total > 0 AND v_score >= (v_total * 0.8) THEN
                v_title := 'দারুণ রেজাল্ট! 🌟 ' || v_subject;
                v_body := v_user_name || ', তুমি ' || v_total || ' নম্বরের মধ্যে ' || v_score || ' পেয়েছ! এই ধারাবাহিকতা ধরে রাখো 🔥';
            ELSIF v_total > 0 AND v_score >= (v_total * 0.5) THEN
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
        END IF;
    EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Exam evaluated notification trigger failed: %', SQLERRM;
    END;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exam_evaluated_notification ON public.exam_results;
CREATE TRIGGER trg_exam_evaluated_notification
AFTER INSERT ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.trg_notify_on_exam_evaluated();

-- 6. Atomic XP Increment Function
CREATE OR REPLACE FUNCTION public.increment_user_xp(
    uid UUID DEFAULT NULL,
    amount INT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_xp INT DEFAULT NULL,
    p_xp_delta INT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_target_id UUID := COALESCE(uid, p_user_id, auth.uid());
    v_target_amount INT := COALESCE(amount, p_xp, p_xp_delta, 0);
    v_new_xp INT := 0;
BEGIN
    IF v_target_id IS NULL OR v_target_amount <= 0 THEN
        RETURN 0;
    END IF;

    UPDATE public.users
    SET xp = COALESCE(xp, 0) + v_target_amount,
        updated_at = NOW()
    WHERE id = v_target_id
    RETURNING xp INTO v_new_xp;

    RETURN v_new_xp;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_user_xp(UUID, INT, UUID, INT, INT) TO anon, authenticated, service_role;

-- 7. Backfill streak for all users right now
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT DISTINCT user_id FROM public.exam_results WHERE user_id IS NOT NULL
        UNION
        SELECT DISTINCT user_id FROM public.live_exam_attempts WHERE user_id IS NOT NULL
    ) LOOP
        PERFORM public.recalculate_user_streak(r.user_id);
    END LOOP;
END;
$$;

