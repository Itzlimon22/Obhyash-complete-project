-- URGENT FIX: RLS Policies for Users Table
-- Run this in Supabase SQL Editor NOW

-- 1. Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Allow public read" ON public.users;

-- 2. Create simple, permissive policies
CREATE POLICY "Users can read own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Verify RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Check if it worked
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'users';
