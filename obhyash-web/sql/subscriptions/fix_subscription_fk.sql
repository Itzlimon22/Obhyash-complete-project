-- Helper to verify constraint name before dropping
DO $$
DECLARE
    constraint_name_var text;
BEGIN
    -- Check for constraint on subscription_history
    SELECT conname INTO constraint_name_var
    FROM pg_constraint
    WHERE conrelid = 'subscription_history'::regclass
    AND confrelid = 'subscription_plans'::regclass
    AND contype = 'f';

    IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE subscription_history DROP CONSTRAINT ' || constraint_name_var;
    END IF;
END $$;

-- Re-add constraint with ON DELETE CASCADE
ALTER TABLE subscription_history
ADD CONSTRAINT subscription_history_plan_id_fkey
FOREIGN KEY (plan_id)
REFERENCES subscription_plans(id)
ON DELETE CASCADE;

-- Also checking payment_requests if it links to plans (usually by name, but if by ID)
-- (Based on frontend code, payment_requests has plan_name string, not ID FK, so we skip that)
