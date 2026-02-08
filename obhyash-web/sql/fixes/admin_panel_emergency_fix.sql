-- =====================================================
-- ADMIN PANEL EMERGENCY REPAIR SCRIPT
-- =====================================================
-- Run this script in the Supabase SQL Editor to fix 
-- the "data not loading" issue in the Admin Panel.
-- =====================================================

-- STEP 1: Fix or Create is_admin() function
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role text;
BEGIN
  -- We use SECURITY DEFINER to bypass RLS for this specific check
  SELECT role INTO current_role FROM public.users WHERE id = auth.uid();
  RETURN current_role = 'Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Repair 'users' table policies
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view everything" ON public.users;

-- Ensure Admins can see and manage ALL users
CREATE POLICY "Admins can manage all users" 
ON public.users FOR ALL 
USING (public.is_admin());

-- Ensure everyone can see basic info for auth (needed for some flows)
-- But primarily ensures selecting 'users' isn't empty for admins
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- STEP 3: Repair 'exam_results' table policies
-- =====================================================
-- Standard policy usually only allows users to see their own results.
-- We must explicitly allow Admins to see ALL results.
DROP POLICY IF EXISTS "Admins can view all results" ON public.exam_results;
CREATE POLICY "Admins can view all results" 
ON public.exam_results FOR SELECT 
USING (public.is_admin());

-- STEP 4: Repair 'reports' table policies
-- =====================================================
DROP POLICY IF EXISTS "Admins can manage all reports" ON public.reports;
CREATE POLICY "Admins can manage all reports" 
ON public.reports FOR ALL 
USING (public.is_admin());

-- STEP 5: Diagnostic Verification
-- =====================================================
-- Run these queries after the script finishes to check status

-- A. Check current user's role
SELECT id, email, role, (public.is_admin()) as is_admin_check
FROM public.users 
WHERE id = auth.uid();

-- B. Check if data is now accessible (counts should be > 0)
SELECT 
  (SELECT count(*) FROM public.users) as total_users,
  (SELECT count(*) FROM public.questions) as total_questions,
  (SELECT count(*) FROM public.reports) as pending_reports,
  (SELECT count(*) FROM public.exam_results) as total_exams;

-- C. List active policies
SELECT 
  tablename, 
  policyname, 
  permissive, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename IN ('users', 'questions', 'reports', 'exam_results')
ORDER BY tablename, cmd;
