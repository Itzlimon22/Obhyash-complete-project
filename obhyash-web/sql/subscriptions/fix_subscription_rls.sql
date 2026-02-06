-- Enable RLS on subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Drop potentially conflicting policies
DROP POLICY IF EXISTS "Public can view active plans" ON subscription_plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;
DROP POLICY IF EXISTS "Everything" ON subscription_plans;

-- Policy: Public Read Access (Anon and Authenticated)
CREATE POLICY "Public can view active plans" 
ON subscription_plans FOR SELECT 
USING (true);

-- Policy: Admin Full Access (Insert, Update, Delete)
-- This allows any user who has the 'Admin' role in the public.users table to manage plans.
CREATE POLICY "Admins can manage plans" 
ON subscription_plans FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Admin'
  )
);
