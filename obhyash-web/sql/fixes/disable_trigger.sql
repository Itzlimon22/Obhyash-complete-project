-- ⚠️ RUN THIS IN SUPABASE SQL EDITOR
-- This will revert the automatic trigger so your App Code can handle profile creation.

-- 1. Drop the Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the Function (Optional, but good for cleanup)
DROP FUNCTION IF EXISTS public.handle_new_user();

-- After running this:
-- 1. The "Database error saving new user" should disappear.
-- 2. Your Signup Page code will now be responsible for creating the profile (which is what we want).
