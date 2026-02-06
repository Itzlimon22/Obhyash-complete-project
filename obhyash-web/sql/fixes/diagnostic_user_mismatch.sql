-- DIAGNOSTIC: Find User ID Mismatch
-- Run this to see what's wrong

-- 1. Check what user is currently logged in (from auth)
SELECT 
  id as auth_user_id,
  email as auth_email,
  created_at as auth_created
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Check what's in the users table
SELECT 
  id as profile_user_id,
  email as profile_email,
  name,
  role
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. Find mismatches (users in auth but not in public.users)
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  'MISSING FROM public.users' as issue
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- =====================================================
-- FIX: Create missing profile rows
-- =====================================================
-- If you see users from step 3, run this to create their profiles:

INSERT INTO public.users (
  id, 
  email, 
  name, 
  role,
  xp,
  level,
  "examsTaken",
  "enrolledExams",
  "avatarColor",
  subscription,
  status
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Student') as name,
  COALESCE(au.raw_user_meta_data->>'role', 'Student') as role,
  0 as xp,
  'Beginner' as level,
  0 as "examsTaken",
  0 as "enrolledExams",
  '#000000' as "avatarColor",
  '{"plan": "Free", "status": "Active", "expiry": "2025-12-31"}'::jsonb as subscription,
  'Active' as status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- After running this, refresh your dashboard and try updating again!
