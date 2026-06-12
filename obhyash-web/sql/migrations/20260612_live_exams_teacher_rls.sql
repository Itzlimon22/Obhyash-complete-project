-- ==============================================================
-- SQL Migration: Allow Teachers to manage live exams
-- ==============================================================

-- Drop old policies that restrict to Admin
DROP POLICY IF EXISTS "Admins have full access to live_exams" ON public.live_exams;
DROP POLICY IF EXISTS "Admins have full access to live_exam_questions" ON public.live_exam_questions;
DROP POLICY IF EXISTS "Admins have full access to live_exam_attempts" ON public.live_exam_attempts;

-- Create new policies for Admin and Teacher
CREATE POLICY "Admins and Teachers have full access to live_exams" 
    ON public.live_exams FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND (users.role = 'Admin' OR users.role = 'Teacher' OR users.role = 'admin' OR users.role = 'teacher')
        )
    );

CREATE POLICY "Admins and Teachers have full access to live_exam_questions" 
    ON public.live_exam_questions FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND (users.role = 'Admin' OR users.role = 'Teacher' OR users.role = 'admin' OR users.role = 'teacher')
        )
    );

CREATE POLICY "Admins and Teachers have full access to live_exam_attempts" 
    ON public.live_exam_attempts FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() AND (users.role = 'Admin' OR users.role = 'Teacher' OR users.role = 'admin' OR users.role = 'teacher')
        )
    );
