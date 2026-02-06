-- Quick check: Does an admin user exist?
SELECT id, email, name, role FROM public.users WHERE role ILIKE '%admin%';

-- If no results, create an admin user:
-- First, create the user in Supabase Auth Dashboard
-- Then run this (replace UUID with the actual auth user ID):

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
  subscription
) VALUES (
  'YOUR_ADMIN_USER_ID_HERE'::uuid,  -- Replace with actual UUID from auth.users
  'admin@obhyash.com',
  'Admin User',
  'Admin',  -- Capital A
  'Active',
  0,
  'Expert',
  0,
  0,
  '#DC2626',
  '{"plan": "Enterprise", "status": "Active", "expiry": "2030-12-31"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  role = 'Admin',
  name = 'Admin User';
