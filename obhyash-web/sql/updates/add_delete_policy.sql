-- ==========================================
-- SCRIPT: ADD EXAM RESULTS DELETE POLICY
-- DESCRIPTION: Fixes the bug where users could not delete their exam history 
-- because the RLS policy for DELETE was missing.
-- ==========================================

CREATE POLICY "Users can delete their own results" 
ON public.exam_results FOR DELETE 
USING (auth.uid() = user_id);
