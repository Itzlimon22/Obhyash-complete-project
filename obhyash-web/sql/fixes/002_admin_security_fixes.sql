-- ==========================================
-- ADMIN SECURITY FIXES
-- DESCRIPTION: Secures the 'users' table by restricting RLS and creating a safe view.
-- ==========================================

-- 1. Create Public Profiles View (Safe Data Only)
CREATE OR REPLACE VIEW public_profiles AS
SELECT 
    id,
    name,
    avatar_url,
    avatar_color,
    xp,
    level,
    exams_taken,
    institute,
    division
FROM users;

-- Grant access to the view
GRANT SELECT ON public_profiles TO authenticated;
GRANT SELECT ON public_profiles TO anon;

-- 2. Secure 'users' Table (Private Data)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop insecure "view all" policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
DROP POLICY IF EXISTS "Anyone can view users" ON users;

-- Create strict policies
-- A. Users can view/edit ONLY their own full profile
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" 
ON users FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" 
ON users FOR UPDATE 
USING (auth.uid() = id);

-- B. Admins can view/edit ALL profiles
-- (Relies on is_admin function from previous scripts, ensuring it exists)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role FROM public.users WHERE id = auth.uid();
  RETURN current_role = 'Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP POLICY IF EXISTS "Admins can manage all users" ON users;
CREATE POLICY "Admins can manage all users" 
ON users FOR ALL 
USING (public.is_admin());

-- 3. Optimization for Admin Search
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active DESC);

-- ==========================================
-- Security Fixes Applied
-- ==========================================
