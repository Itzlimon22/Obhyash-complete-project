-- Fix Admin Permissions (RLS)
-- This script ensures Admins can View/Update/Delete ALL data.

-- 1. Create a secure function to check if the current user is an admin
-- SECURITY DEFINER allows this function to bypass RLS when reading the users table to check role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (public.get_user_role() = 'Admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (public.get_user_role() = 'Teacher');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Users Table Policies

-- Drop restrictive policies if they exist (from FINAL_RLS_FIX.sql)
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- Drop potentially conflicting policies (to allow re-running this script)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on id or admin" ON public.users;
DROP POLICY IF EXISTS "Enable insert for users based on id" ON public.users;
DROP POLICY IF EXISTS "Enable delete for users based on id or admin" ON public.users;

-- Re-create basic own-access policies + Admin access

-- SELECT: Admins see all, Users see themselves (and maybe public profiles needed for leaderboard? 
-- For now, let's enable Admin access primarily, and restore leaderboard access if needed)
-- Leaderboard usually reads 'name', 'avatar_url', 'xp'. 
-- We might need a "Public Read" policy for specific columns, but Postgres RLS is row-based.
-- Use a view for Leaderboard if privacy is strict, or allow Authenticated to read basic info.
-- "Public profiles are viewable by everyone" was the original. 
-- Let's restore "Authenticated users can view all profiles" but restrict detailed info in frontend, 
-- OR strictly: Users see own, Admins see all. 
-- BUT, Leaderboard needs to see others.
-- Compromise: Allow SELECT for all authenticated users (so Leaderboard works), but rely on App logic to not show emails/phones of others.
-- CAUTION: If we strictly block SELECT, Leaderboard breaks.
-- Use: "Allow Select for Authenticated"
CREATE POLICY "Enable read access for authenticated users"
ON public.users FOR SELECT
TO authenticated
USING (true); 

-- UPDATE: Users can update own, Admins can update all.
CREATE POLICY "Enable update for users based on id or admin"
ON public.users FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR public.is_admin()
)
WITH CHECK (
  auth.uid() = id 
  OR public.is_admin()
);

-- INSERT: Users can insert own (signup) - Admin insert handled by ID match usually or disabled (Admins create via Auth API)
CREATE POLICY "Enable insert for users based on id"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- DELETE: Admins only? Or Users can delete self?
CREATE POLICY "Enable delete for users based on id or admin"
ON public.users FOR DELETE
TO authenticated
USING (
  auth.uid() = id 
  OR public.is_admin()
);

-- 3. Update Questions Table Policies (if RLS enabling)
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- If policies don't exist, create them. 
-- Assuming questions table exists. If not, this part is skipped effectively.

DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
DROP POLICY IF EXISTS "Teachers can update own questions" ON public.questions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.questions;
DROP POLICY IF EXISTS "Enable insert for teachers and admins" ON public.questions;
DROP POLICY IF EXISTS "Enable update for teachers and admins" ON public.questions;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.questions;

-- SELECT: Everyone (Authenticated)
CREATE POLICY "Enable read access for all users"
ON public.questions FOR SELECT
TO authenticated
USING (true);

-- INSERT: Teachers and Admins
CREATE POLICY "Enable insert for teachers and admins"
ON public.questions FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() 
  OR public.is_teacher()
);

-- UPDATE: Teachers (own), Admins (all)
CREATE POLICY "Enable update for teachers and admins"
ON public.questions FOR UPDATE
TO authenticated
USING (
  (public.is_teacher() AND author = (SELECT email FROM public.users WHERE id = auth.uid())) -- Assuming author stored as email? Or check if we can match ID.
  -- Actually, questions might store 'author' as string name/email. 
  -- Safer: (public.is_teacher()) -- Let teachers edit any question? NO.
  -- If we can't easily link 'author' column to auth.uid(), we might just allow all Teachers for now OR rely on Frontend to enforce ownership.
  -- Better: Add 'created_by' (UUID) column to questions if missing.
  -- For now, allow Admins to update all.
  OR public.is_admin()
);

-- DELETE: Admins only (or Teachers own)
CREATE POLICY "Enable delete for admins"
ON public.questions FOR DELETE
TO authenticated
USING (public.is_admin());

-- 4. Exams/Reports (Basic Admin Access)
-- (Add similar checks if tables exist and have RLS)

-- Reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view reports" ON public.reports;
DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;

CREATE POLICY "Admins can view reports" ON public.reports FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE TO authenticated USING (public.is_admin());

