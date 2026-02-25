-- =====================================================
-- EMERGENCY FIX: UI FREEZE & RLS RECURSION
-- Run this in your Supabase SQL editor to restore app functionality.
-- =====================================================

-- 1. Create a safer is_admin function that avoids RLS recursion
-- SECURITY DEFINER allows this function to bypass RLS when checking roles.
CREATE OR REPLACE FUNCTION public.check_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 2. Clean up Referral System Policies (Removing complex subqueries)
-- We'll use the function instead of 'EXISTS (SELECT 1 ...)' directly in the policy.

-- Referrals table
DROP POLICY IF EXISTS "Admins have full access to referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admin can read all referrals" ON public.referrals;
DROP POLICY IF EXISTS "Anyone can read referrals" ON public.referrals;

CREATE POLICY "Anyone can read referrals"
  ON public.referrals FOR SELECT USING (true);

CREATE POLICY "Admins have full access to referrals" 
ON public.referrals 
FOR ALL 
TO authenticated 
USING (public.check_user_is_admin());


-- Referral History table
DROP POLICY IF EXISTS "Admins have full access to referral_history" ON public.referral_history;
DROP POLICY IF EXISTS "Admin can read all referral history" ON public.referral_history;

CREATE POLICY "Admins have full access to referral_history" 
ON public.referral_history 
FOR ALL 
TO authenticated 
USING (public.check_user_is_admin());


-- 3. Cleanup Notification Policies
DROP POLICY IF EXISTS "users_select_own_notifications" ON public.notifications;
CREATE POLICY "users_select_own_notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);


-- 4. Re-check Users Table Policies (The most sensitive part)
-- Ensure 'Admins can manage all users' also uses the safe function.
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
CREATE POLICY "Admins can manage all users" 
ON public.users FOR ALL 
USING (public.check_user_is_admin());

-- Ensure basic SELECT is always possible to prevent login hangs
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);


-- 5. Force Unlock (Optional)
-- This isn't usually needed in Supabase unless a transaction is stuck.
-- If you still see issues, please refresh your Supabase dashboard session.

SELECT 'App recovery script executed. Please refresh your app!' as status;
