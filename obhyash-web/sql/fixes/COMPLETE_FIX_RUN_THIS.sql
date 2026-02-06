-- =====================================================
-- COMPLETE FIX: Run this ENTIRE script in Supabase SQL Editor
-- This fixes BOTH the RLS policies AND creates the missing user row
-- =====================================================

-- PART 1: Fix RLS Policies (Allow Updates)
-- =====================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated to update own row" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;

-- Create fresh, working policies
CREATE POLICY "users_select_own"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_own"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- PART 2: Create Missing User Row
-- =====================================================
-- Your user ID from console: 0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5

INSERT INTO public.users (
  id,
  email,
  name,
  role,
  status,
  xp,
  level,
  "examsTaken",
  "enrolledExams",
  "avatarColor",
  subscription,
  "lastActive",
  created_at
)
SELECT 
  '0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5'::uuid,
  COALESCE(
    (SELECT email FROM auth.users WHERE id = '0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5'),
    'student@obhyash.com'
  ),
  'Student',
  'Student',
  'Active',
  0,
  'Beginner',
  0,
  0,
  '#E11D48',
  '{"plan": "Free", "status": "Active", "expiry": "2025-12-31"}'::jsonb,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE id = '0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5'
);

-- PART 3: Verify Everything
-- =====================================================
-- Check the user exists
SELECT 'User row exists:' as check, * FROM public.users 
WHERE id = '0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5';

-- Check policies are correct
SELECT 'Policies:' as check, policyname, cmd FROM pg_policies 
WHERE tablename = 'users' ORDER BY cmd;

-- =====================================================
-- After running this:
-- 1. Refresh your dashboard
-- 2. Try updating your profile
-- 3. It WILL work!
-- =====================================================
