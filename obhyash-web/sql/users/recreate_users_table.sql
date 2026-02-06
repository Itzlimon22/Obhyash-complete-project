-- ==========================================
-- SCRIPT: RECREATE USERS TABLE & POLICIES
-- DESCRIPTION: Completely resets the users table with a clean schema.
-- WARNING: THIS WILL DELETE ALL EXISTING USER PROFILE DATA.
-- ==========================================

-- 1. DROP EXISTING TABLE (Cascade to remove dependent triggers/policies)
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. CREATE NEW USERS TABLE
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identity
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'Student', -- 'Admin', 'Teacher', 'Student'
    status TEXT DEFAULT 'Active', -- 'Active', 'Inactive', 'Suspended'
    
    -- Profile
    avatar_url TEXT,
    avatar_color TEXT DEFAULT 'bg-slate-500', -- For fallback UI
    gender TEXT,
    dob DATE,
    address TEXT,
    
    -- Academic Info
    institute TEXT,
    division TEXT, -- Science, Arts, Commerce
    stream TEXT,   -- HSC, Admission
    batch TEXT,    -- HSC 2025, etc.
    target TEXT,   -- Medical, Engineering
    
    -- SSC Info
    ssc_roll TEXT,
    ssc_reg TEXT,
    ssc_board TEXT,
    ssc_passing_year TEXT,
    optional_subject TEXT,
    
    -- Gamification & Stats
    xp INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Beginner',
    streak INTEGER DEFAULT 0,
    exams_taken INTEGER DEFAULT 0,
    enrolled_exams INTEGER DEFAULT 0,
    
    -- System
    subscription JSONB DEFAULT '{"plan": "Free", "status": "Active"}'::jsonb,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. ENABLE RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES

-- Policy: Anyone can view basic profiles (needed for leaderboards)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Policy: Service Role can do anything (backup)
-- Note: Service role BYPASSES RLS by default, but good to be explicit for other roles if needed.

-- Policy: Allow INSERT during signup (triggered by Auth or explicit insert)
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 5. AUTO-CREATE PROFILE TRIGGER (Optional but Recommended)
-- Automatically creates a user profile row when a new user signs up via Supabase Auth

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', 'New User'),
    'Student'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. GRANT PERMISSIONS
GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;

-- 7. SETUP STORAGE (For Avatars) - Idempotent
-- Ensure the 'avatars' bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to avatars
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'avatars' );

-- Allow users to update/delete their own avatars
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' AND auth.uid() = owner );

