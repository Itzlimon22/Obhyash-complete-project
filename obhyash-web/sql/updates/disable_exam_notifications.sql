-- =================================================================================
-- SCRIPT: DISABLE AUTOMATIC EXAM SUBMISSION NOTIFICATIONS
-- DESCRIPTION: Drops the database trigger that automatically inserts a 
-- notification row every time a user submits an exam or mock test.
-- =================================================================================

-- 1. Drop the trigger from the exam_results table so it stops firing on INSERT
DROP TRIGGER IF EXISTS trigger_notify_exam_result ON public.exam_results;

-- 2. Drop the associated trigger function (Optional, but keeps the database clean)
DROP FUNCTION IF EXISTS public.notify_exam_result();

-- NOTE: After running this script in your Supabase SQL Editor, users will no longer 
-- receive a notification pop-up every time they submit an exam.
