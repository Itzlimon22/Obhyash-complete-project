-- MANUAL FIX: Create the missing user profile row
-- Based on the console logs, your user ID is: 0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5

-- Step 1: Check if the row already exists
SELECT * FROM public.users WHERE id = '0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5';

-- Step 2: If it doesn't exist (no results from above), run this INSERT:
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
) VALUES (
  '0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5',  -- Your actual user ID from console
  (SELECT email FROM auth.users WHERE id = '0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5'),  -- Get email from auth
  'Student',  -- Default name (you can change this later)
  'Student',  -- Role
  'Active',   -- Status
  0,          -- XP
  'Beginner', -- Level
  0,          -- examsTaken
  0,          -- enrolledExams
  '#E11D48',  -- avatarColor (rose-600)
  '{"plan": "Free", "status": "Active", "expiry": "2025-12-31"}'::jsonb,
  NOW(),      -- lastActive
  NOW()       -- created_at
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- Step 3: Verify it was created:
SELECT id, email, name, role FROM public.users WHERE id = '0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5';

-- After running this, refresh your dashboard and try updating your profile!
