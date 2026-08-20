-- ==============================================================================
-- Migration: 20260820_fix_exam_results_and_history.sql
-- Description: 
-- 1. Adds missing 'subject_label' column to public.exam_results (which caused 42703 errors on submission).
-- 2. Configures complete RLS policies (SELECT, INSERT, UPDATE, DELETE) on exam_results.
-- 3. Attaches automatic streak recalculation triggers on exam_results and live_exam_attempts.
-- 4. Backfills streak for all users immediately.
-- ==============================================================================

-- 1. Ensure all columns exist on public.exam_results
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS subject_label TEXT;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'evaluated';
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS negative_marking DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'digital';

-- Fix any legacy exam rows with missing status
UPDATE public.exam_results 
SET status = 'evaluated' 
WHERE status IS NULL OR status = '';

-- 2. Configure RLS Policies
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can view their own results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can view own results" ON public.exam_results;
CREATE POLICY "Users can view own exam results"
ON public.exam_results FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can insert their own results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can insert own results" ON public.exam_results;
CREATE POLICY "Users can insert own exam results"
ON public.exam_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can update their own results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can update own results" ON public.exam_results;
CREATE POLICY "Users can update own exam results"
ON public.exam_results FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can delete their own results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can delete own results" ON public.exam_results;
CREATE POLICY "Users can delete own exam results"
ON public.exam_results FOR DELETE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access to exam_results" ON public.exam_results;
CREATE POLICY "Admins have full access to exam_results"
ON public.exam_results FOR ALL
USING (auth.role() = 'service_role' OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin'
));

-- 3. Automatic Streak Synchronization Triggers
CREATE OR REPLACE FUNCTION public.trg_auto_recalculate_streak()
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
AFTER INSERT OR UPDATE ON public.exam_results
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_recalculate_streak();

DROP TRIGGER IF EXISTS trg_streak_sync_on_live_exams ON public.live_exam_attempts;
CREATE TRIGGER trg_streak_sync_on_live_exams
AFTER INSERT OR UPDATE ON public.live_exam_attempts
FOR EACH ROW
EXECUTE FUNCTION public.trg_auto_recalculate_streak();

-- 4. Immediate Streak Backfill for all active users
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
