-- COMPREHENSIVE DATABASE FIX SCRIPT
-- Run this in Supabase SQL Editor to ensure schema matches app expectations

-- =====================================================
-- STEP 1: Fix Table Schema (Add Missing Columns)
-- =====================================================

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Add all required columns if they don't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "name" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "gender" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "institute" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "goal" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "division" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "batch" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'Student';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "status" text DEFAULT 'Active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "target" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "avatar_url" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "avatarUrl" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "avatarColor" text DEFAULT '#000000';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "xp" bigint DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "level" text DEFAULT 'Beginner';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "examsTaken" bigint DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "enrolledExams" bigint DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "subscription" jsonb DEFAULT '{"plan": "Free", "status": "Active", "expiry": "2025-12-31"}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "lastActive" timestamptz DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "created_at" timestamptz DEFAULT now();
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "updated_at" timestamptz DEFAULT now();

-- SSC/Academic columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "ssc_roll" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "ssc_reg" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "ssc_board" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "ssc_passing_year" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "optional_subject" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "dob" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "address" text;

-- =====================================================
-- STEP 2: Add Constraints
-- =====================================================

-- Role constraint (case-sensitive)
DO $$ BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin', 'Teacher', 'Student'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Status constraint
DO $$ BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_status_check CHECK (status IN ('Active', 'Inactive', 'Suspended'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- STEP 3: Clean Up Bad Data
-- =====================================================

-- Remove placeholder/broken avatar URLs
UPDATE public.users 
SET avatar_url = NULL 
WHERE avatar_url LIKE '%YOUR_CUSTOM_DOMAIN_OR_R2_URL%';

UPDATE public.users 
SET "avatarUrl" = NULL 
WHERE "avatarUrl" LIKE '%YOUR_CUSTOM_DOMAIN_OR_R2_URL%';

-- Sync avatar_url and avatarUrl (prefer snake_case)
UPDATE public.users 
SET avatar_url = "avatarUrl" 
WHERE avatar_url IS NULL AND "avatarUrl" IS NOT NULL;

UPDATE public.users 
SET "avatarUrl" = avatar_url 
WHERE "avatarUrl" IS NULL AND avatar_url IS NOT NULL;

-- =====================================================
-- STEP 4: Create Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_xp ON public.users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_level ON public.users(level);

-- =====================================================
-- STEP 5: Set up RLS Policies
-- =====================================================

-- Drop existing policies to recreate them fresh
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- Allow authenticated users to insert their profile
CREATE POLICY "Enable insert for authenticated users"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- =====================================================
-- STEP 6: Create Updated_At Trigger
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- DONE! Your database should now match the app schema
-- =====================================================

SELECT 'Database schema fix completed successfully!' as status;
