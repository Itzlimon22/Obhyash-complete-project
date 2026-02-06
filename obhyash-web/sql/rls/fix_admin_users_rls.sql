-- 1. Create a secure function to check for Admin role (Avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role FROM public.users WHERE id = auth.uid();
  RETURN current_role = 'Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Fix 'users' table RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing restricted policies to avoid conflicts
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Admins can update everything" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
DROP POLICY IF EXISTS "Admins can view everything" ON public.users;

-- Public can read basic info (needed for login/signup checks)
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Admins can do EVERYTHING (Select, Update, Delete)
CREATE POLICY "Admins can manage all users" 
ON public.users FOR ALL 
USING (public.is_admin());


-- 3. Fix/Create 'user_activity_log' table
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "Admins can view logs" ON public.user_activity_log;
DROP POLICY IF EXISTS "Admins can insert logs" ON public.user_activity_log;

-- Admins can View and Insert logs
CREATE POLICY "Admins can manage logs" 
ON public.user_activity_log FOR ALL 
USING (public.is_admin());


-- 4. Fix 'subscription_history' RLS (just to be safe)
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage history" ON public.subscription_history;

CREATE POLICY "Admins can manage history" 
ON public.subscription_history FOR ALL 
USING (public.is_admin());

-- Also allow users to view their own history
CREATE POLICY "Users can view own history" 
ON public.subscription_history FOR SELECT 
USING (auth.uid() = user_id);
