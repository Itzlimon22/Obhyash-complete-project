-- ==============================================================================
-- Migration: 20260820_production_streak_system.sql
-- Description: Production-grade Streak Engine with Bangladesh Timezone (Asia/Dhaka)
--              Triggers, RPC Functions, and Historical Backfill.
-- ==============================================================================

-- 1. Core Streak Calculation Function (Atomic & Tamper-proof)
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
        SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
        FROM public.exam_results
        WHERE user_id = p_user_id
          AND (status IS NULL OR status = 'evaluated' OR score IS NOT NULL)

        UNION

        SELECT (COALESCE(submit_time, created_at) AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
        FROM public.live_exam_attempts
        WHERE user_id = p_user_id
          AND (status = 'submitted' OR score IS NOT NULL)
    )
    SELECT ARRAY_AGG(exam_date ORDER BY exam_date DESC)
    INTO v_active_dates
    FROM combined_dates;

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
        -- Active today: start counting backwards from today
        v_cursor := v_today;
    ELSIF v_yesterday = ANY(v_active_dates) THEN
        -- Not yet active today, but active yesterday: streak is alive, count from yesterday
        v_cursor := v_yesterday;
    ELSE
        -- Missed yesterday and today: streak is broken
        v_cursor := NULL;
    END IF;

    IF v_cursor IS NOT NULL THEN
        WHILE v_cursor = ANY(v_active_dates) LOOP
            v_streak := v_streak + 1;
            v_cursor := (v_cursor - INTERVAL '1 day')::DATE;
        END LOOP;
    END IF;

    -- Update public.users table directly (SECURITY DEFINER allows updating streak)
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.recalculate_user_streak(UUID) TO anon, authenticated, service_role;


-- 2. Unified Streak Info RPC for Web & Mobile Clients
CREATE OR REPLACE FUNCTION public.get_user_streak_info(p_user_id UUID DEFAULT auth.uid())
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_uid UUID := COALESCE(p_user_id, auth.uid());
    v_today DATE := (NOW() AT TIME ZONE 'Asia/Dhaka')::DATE;
    v_start_of_week DATE;
    v_day_of_week INT;
    v_week_activity BOOLEAN[] := ARRAY[false, false, false, false, false, false, false];
    v_last_30_days INT[] := ARRAY_FILL(0, ARRAY[30]);
    v_sync_res JSONB;
    v_streak INT := 0;
    v_has_today BOOLEAN := FALSE;
    v_last_active DATE := NULL;
    r RECORD;
    v_diff INT;
    v_thirty_days_ago DATE := v_today - INTERVAL '29 days';
BEGIN
    IF v_uid IS NULL THEN
        RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;

    -- Run sync to ensure latest accurate streak
    v_sync_res := public.recalculate_user_streak(v_uid);
    v_streak := COALESCE((v_sync_res->>'streak')::INT, 0);
    v_has_today := COALESCE((v_sync_res->>'has_completed_today')::BOOLEAN, false);
    IF (v_sync_res->>'last_active_date') IS NOT NULL THEN
        v_last_active := (v_sync_res->>'last_active_date')::DATE;
    END IF;

    -- Calculate current week (Sun=0 to Sat=6) in Asia/Dhaka
    v_day_of_week := EXTRACT(DOW FROM v_today)::INT;
    v_start_of_week := v_today - (v_day_of_week * INTERVAL '1 day')::INTERVAL;

    -- Compute week activity (Sun=1 to Sat=7 in 1-based PG array)
    FOR r IN (
        WITH all_exams AS (
            SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
            FROM public.exam_results
            WHERE user_id = v_uid
              AND (status IS NULL OR status = 'evaluated' OR score IS NOT NULL)
              AND (created_at AT TIME ZONE 'Asia/Dhaka')::DATE >= v_start_of_week

            UNION

            SELECT (COALESCE(submit_time, created_at) AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
            FROM public.live_exam_attempts
            WHERE user_id = v_uid
              AND (status = 'submitted' OR score IS NOT NULL)
              AND (COALESCE(submit_time, created_at) AT TIME ZONE 'Asia/Dhaka')::DATE >= v_start_of_week
        )
        SELECT DISTINCT exam_date FROM all_exams
    ) LOOP
        v_diff := (r.exam_date - v_start_of_week);
        IF v_diff >= 0 AND v_diff < 7 THEN
            v_week_activity[v_diff + 1] := true;
        END IF;
    END LOOP;

    -- Compute 30 days activity heatmap (index 1 to 30: 1 = 29 days ago, 30 = today)
    FOR r IN (
        WITH all_exams AS (
            SELECT (created_at AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
            FROM public.exam_results
            WHERE user_id = v_uid
              AND (status IS NULL OR status = 'evaluated' OR score IS NOT NULL)
              AND (created_at AT TIME ZONE 'Asia/Dhaka')::DATE >= v_thirty_days_ago

            UNION ALL

            SELECT (COALESCE(submit_time, created_at) AT TIME ZONE 'Asia/Dhaka')::DATE AS exam_date
            FROM public.live_exam_attempts
            WHERE user_id = v_uid
              AND (status = 'submitted' OR score IS NOT NULL)
              AND (COALESCE(submit_time, created_at) AT TIME ZONE 'Asia/Dhaka')::DATE >= v_thirty_days_ago
        )
        SELECT exam_date, COUNT(*)::INT AS cnt
        FROM all_exams
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
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_streak_info(UUID) TO anon, authenticated, service_role;


-- 3. Automatic Triggers on Exam Completion
CREATE OR REPLACE FUNCTION public.trg_fn_recalc_streak_exam_results()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        PERFORM public.recalculate_user_streak(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_streak_sync_on_exam_results ON public.exam_results;
CREATE TRIGGER trg_streak_sync_on_exam_results
AFTER INSERT OR UPDATE OF status, score ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_recalc_streak_exam_results();


CREATE OR REPLACE FUNCTION public.trg_fn_recalc_streak_live_exams()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.user_id IS NOT NULL THEN
        PERFORM public.recalculate_user_streak(NEW.user_id);
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_streak_sync_on_live_exams ON public.live_exam_attempts;
CREATE TRIGGER trg_streak_sync_on_live_exams
AFTER INSERT OR UPDATE OF status, submit_time, score ON public.live_exam_attempts
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_recalc_streak_live_exams();


-- 4. Initial Backfill: Recalculate streak for all existing users with exams
DO $$
DECLARE
    u_rec RECORD;
BEGIN
    FOR u_rec IN (
        SELECT DISTINCT user_id 
        FROM (
            SELECT user_id FROM public.exam_results WHERE user_id IS NOT NULL
            UNION
            SELECT user_id FROM public.live_exam_attempts WHERE user_id IS NOT NULL
        ) all_u
    ) LOOP
        PERFORM public.recalculate_user_streak(u_rec.user_id);
    END LOOP;
END;
$$;
