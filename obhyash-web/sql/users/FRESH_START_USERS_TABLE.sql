-- =====================================================
-- FRESH START: Delete and Recreate Users Table
-- WARNING: This will DELETE ALL user data!
-- =====================================================

-- Step 1: Drop existing table (includes all policies automatically)
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: Create fresh users table with correct schema
CREATE TABLE public.users (
  -- Primary key (UUID from Supabase Auth)
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  email text,
  name text,
  phone text,
  
  -- Profile
  avatar_url text,
  "avatarUrl" text,  -- Keep both for compatibility
  "avatarColor" text DEFAULT '#E11D48',
  dob text,
  gender text,
  address text,
  
  -- Academic Info
  institute text,
  goal text,
  division text,  -- Maps to "group" in UI
  batch text,
  target text,
  
  -- SSC/Academic Details
  ssc_roll text,
  ssc_reg text,
  ssc_board text,
  ssc_passing_year text,
  optional_subject text,
  
  -- User Status
  role text DEFAULT 'Student' CHECK (role IN ('Admin', 'Teacher', 'Student')),
  status text DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  
  -- Gamification
  xp bigint DEFAULT 0,
  level text DEFAULT 'Beginner',
  "examsTaken" bigint DEFAULT 0,
  "enrolledExams" bigint DEFAULT 0,
  
  -- Subscription
  subscription jsonb DEFAULT '{"plan": "Free", "status": "Active", "expiry": "2025-12-31"}'::jsonb,
  
  -- Timestamps
  "lastActive" timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Step 3: Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_xp ON public.users(xp DESC);
CREATE INDEX idx_users_level ON public.users(level);

-- Step 4: Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies
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

-- Step 6: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at_trigger
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at();

-- Step 7: Create your current user profile
-- Replace this ID with your actual auth user ID
INSERT INTO public.users (
  id,
  email,
  name,
  role,
  status
)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', 'Student'),
  COALESCE(raw_user_meta_data->>'role', 'Student'),
  'Active'
FROM auth.users
WHERE id = '0a5b1da3-fecf-43dc-b5f8-c51a1d6423a5';  -- YOUR USER ID

-- Step 8: Verify everything
SELECT 'Table created successfully!' as status;
SELECT '✅ User profile created:' as check, * FROM public.users LIMIT 1;
SELECT '✅ RLS Policies created:' as check, policyname, cmd FROM pg_policies WHERE tablename = 'users';

-- =====================================================
-- Done! Now refresh your dashboard and try updating.
-- =====================================================
