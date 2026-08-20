-- ==============================================================================
-- Migration: 20260820_fix_streak_and_users_trigger.sql
-- Description:
-- 1. Fixes PostgreSQL error 42703 (record "new" has no field "plan") by rewriting
--    protect_user_privileged_columns() to only reference existing columns in public.users.
-- 2. Ensures all required columns exist on public.users (last_streak_date, streak, xp, etc.).
-- 3. Backfills and recalculates streaks for all users who completed exams.
-- ==============================================================================

-- 1. Ensure required columns exist on public.users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_streak_date TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level TEXT DEFAULT 'Beginner';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS exams_taken INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS enrolled_exams INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription JSONB DEFAULT '{"plan": "Free", "status": "Active"}'::jsonb;

-- 2. Fix the Privilege Escalation Trigger (Remove non-existent column references)
CREATE OR REPLACE FUNCTION public.protect_user_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_privileged BOOLEAN := FALSE;
BEGIN
    -- Check if caller is Supabase service_role or Admin
    IF auth.role() = 'service_role' THEN
        v_is_privileged := TRUE;
    ELSIF public.is_admin() THEN
        v_is_privileged := TRUE;
    END IF;

    -- If caller is a regular user (not admin / not service_role), revert privileged columns
    IF NOT v_is_privileged THEN
        -- Prevent role & account status tampering
        NEW.role := OLD.role;
        NEW.status := OLD.status;
        
        -- Prevent manual subscription tampering (Subscription is a JSONB column)
        NEW.subscription := OLD.subscription;
        
        -- Prevent ID and creation timestamp tampering
        NEW.id := OLD.id;
        NEW.created_at := OLD.created_at;
    END IF;

    -- Always update updated_at timestamp
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$;

-- Ensure trigger is cleanly attached
DROP TRIGGER IF EXISTS trg_protect_user_privileged_columns ON public.users;
CREATE TRIGGER trg_protect_user_privileged_columns
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.protect_user_privileged_columns();


-- 3. Core Streak Calculation Function (Asia/Dhaka timezone)
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
    v_total_exams_taken INT := 0;
BEGIN
    IF p_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'user_id is null');
    END IF;

    -- 1. Count total completed exams by user
    SELECT COUNT(*)
    INTO v_total_exams_taken
    FROM (
        SELECT id FROM public.exam_results WHERE user_id = p_user_id AND (status IS NULL OR status = 'evaluated' OR score IS NOT NULL)
        UNION ALL
        SELECT id FROM public.live_exam_attempts WHERE user_id = p_user_id AND (status = 'submitted' OR score IS NOT NULL)
    ) total_e;

    -- 2. Collect all distinct calendar dates on which user completed at least 1 exam in Asia/Dhaka time
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
            exams_taken = 0,
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

    -- Update public.users table directly
    UPDATE public.users
    SET streak = v_streak,
        exams_taken = COALESCE(v_total_exams_taken, 0),
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


-- 4. Unified Streak Info RPC for Flutter UI & Web Dashboard
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

            UNION ALL

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
        SELECT exam_date, COUNT(*) as cnt
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
        'streak_count', v_streak,
        'streak', v_streak,
        'has_completed_today', v_has_today,
        'last_active_date', v_last_active,
        'week_activity', v_week_activity,
        'last_30_days', v_last_30_days,
        'last_30_days_activity', v_last_30_days
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_streak_info(UUID) TO anon, authenticated, service_role;


-- 5. Auto Recalculate Trigger on Exam Submission / Deletion
CREATE OR REPLACE FUNCTION public.trg_auto_recalculate_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.user_id IS NOT NULL THEN
            PERFORM public.recalculate_user_streak(OLD.user_id);
        END IF;
        RETURN OLD;
    ELSE
        IF NEW.user_id IS NOT NULL THEN
            PERFORM public.recalculate_user_streak(NEW.user_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_streak_sync_on_exam_results ON public.exam_results;
CREATE TRIGGER trg_streak_sync_on_exam_results
AFTER INSERT OR UPDATE OR DELETE ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_recalculate_streak();

DROP TRIGGER IF EXISTS trg_streak_sync_on_live_exams ON public.live_exam_attempts;
CREATE TRIGGER trg_streak_sync_on_live_exams
AFTER INSERT OR UPDATE OR DELETE ON public.live_exam_attempts
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_recalculate_streak();


-- 6. Recalculate streak for all users immediately
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
        ) all_users
    ) LOOP
        PERFORM public.recalculate_user_streak(u_rec.user_id);
    END LOOP;
END;
$$;
