-- FINAL FIX: RLS Policies - Allow User to Update Their Own Profile
-- This is the root cause of your issue

-- =====================================================
-- STEP 1: Completely Remove All Existing Policies
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated to update own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

-- =====================================================
-- STEP 2: Create Simple, Permissive Policies
-- =====================================================

-- Allow SELECT for own profile
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow UPDATE for own profile (THIS IS THE KEY ONE!)
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow INSERT for own profile (for signup)
CREATE POLICY "users_insert_own"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 3: Ensure RLS is Enabled
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Verify the Policies Were Created
-- =====================================================
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY cmd, policyname;

-- You should see 3 policies:
-- 1. users_select_own (SELECT)
-- 2. users_update_own (UPDATE) <- This is the critical one
-- 3. users_insert_own (INSERT)
