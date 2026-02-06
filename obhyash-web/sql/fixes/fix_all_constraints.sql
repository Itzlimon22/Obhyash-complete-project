-- 1. Fix subscription_history Foreign Key (Ensure Cascade Delete)
DO $$
DECLARE
    constraint_name_var text;
BEGIN
    -- Find existing FK on subscription_history -> subscription_plans
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'subscription_history'::regclass
    AND confrelid = 'subscription_plans'::regclass
    AND contype = 'f';

    -- Drop it if found
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE subscription_history DROP CONSTRAINT ' || constraint_name_var;
    END IF;
END $$;

-- Re-add with CASCADE
ALTER TABLE subscription_history
ADD CONSTRAINT subscription_history_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES subscription_plans(id)
ON DELETE CASCADE;


-- 2. Handle payment_requests Foreign Key (if it exists)
DO $$
DECLARE
    constraint_name_var text;
BEGIN
    -- Find existing FK on payment_requests -> subscription_plans
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'payment_requests'::regclass
    AND confrelid = 'subscription_plans'::regclass
    AND contype = 'f';

    -- Drop it if found
    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE payment_requests DROP CONSTRAINT ' || constraint_name_var;
    END IF;
END $$;

-- Re-add with SET NULL (Preserve payment history even if plan is deleted)
DO $$
BEGIN
    -- Only add constraint if plan_id column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_requests' AND column_name = 'plan_id') THEN
        ALTER TABLE payment_requests
        ADD CONSTRAINT payment_requests_plan_id_fkey
        FOREIGN KEY (plan_id)
        REFERENCES subscription_plans(id)
        ON DELETE SET NULL;
    END IF;
END $$;


-- 3. Verify and Fix RLS (Just in case)
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage plans" ON subscription_plans;

CREATE POLICY "Admins can manage plans" 
ON subscription_plans FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Admin'
  )
);
