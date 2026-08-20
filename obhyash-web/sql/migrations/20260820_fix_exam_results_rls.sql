-- ==============================================================================
-- Migration: 20260820_fix_exam_results_rls.sql
-- Description: Adds missing UPDATE & DELETE RLS policies on public.exam_results
--              Allowing student exam sessions to submit, evaluate, and save to history.
-- ==============================================================================

ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;

-- 1. SELECT Policy
DROP POLICY IF EXISTS "Users can view own exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can view own results" ON public.exam_results;
CREATE POLICY "Users can view own exam results"
ON public.exam_results FOR SELECT
USING (auth.uid() = user_id);

-- 2. INSERT Policy
DROP POLICY IF EXISTS "Users can insert own exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can insert own results" ON public.exam_results;
CREATE POLICY "Users can insert own exam results"
ON public.exam_results FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. UPDATE Policy (CRITICAL: Required for session submission)
DROP POLICY IF EXISTS "Users can update own exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can update own results" ON public.exam_results;
CREATE POLICY "Users can update own exam results"
ON public.exam_results FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. DELETE Policy (Required for cleaning up abandoned session drafts)
DROP POLICY IF EXISTS "Users can delete own exam results" ON public.exam_results;
DROP POLICY IF EXISTS "Users can delete own results" ON public.exam_results;
CREATE POLICY "Users can delete own exam results"
ON public.exam_results FOR DELETE
USING (auth.uid() = user_id);

-- 5. Admin / Service Role Access
DROP POLICY IF EXISTS "Admins have full access to exam_results" ON public.exam_results;
DROP POLICY IF EXISTS "Admins can view all results" ON public.exam_results;
CREATE POLICY "Admins have full access to exam_results"
ON public.exam_results FOR ALL
USING (public.is_admin());
