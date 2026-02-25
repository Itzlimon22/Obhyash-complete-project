-- =====================================================
-- REFERRAL SYSTEM FIX & UPGRADE MIGRATION
-- Run this in your Supabase SQL editor
-- =====================================================

-- 1. Update Notifications Table Constraint
-- The existing constraint restricts types to a narrow set. 
-- We need to allow 'success', 'info', 'warning', and 'error'.

ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('exam_result', 'achievement', 'level_up', 'announcement', 'system', 'success', 'info', 'warning', 'error'));


-- 2. Upgrade Referral History Table
-- Ensure admin_status and reward_given columns exist and have correct defaults.

DO $$ 
BEGIN
    -- Add admin_status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referral_history' AND column_name='admin_status') THEN
        ALTER TABLE public.referral_history ADD COLUMN admin_status text NOT NULL DEFAULT 'Pending';
    END IF;

    -- Update existing NULLs to 'Pending' (just in case)
    UPDATE public.referral_history SET admin_status = 'Pending' WHERE admin_status IS NULL;

    -- Add reward_given if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='referral_history' AND column_name='reward_given') THEN
        ALTER TABLE public.referral_history ADD COLUMN reward_given boolean NOT NULL DEFAULT false;
    END IF;
END $$;


-- 3. Verify Constraints on referral_history
ALTER TABLE public.referral_history 
DROP CONSTRAINT IF EXISTS referral_history_admin_status_check;

ALTER TABLE public.referral_history 
ADD CONSTRAINT referral_history_admin_status_check 
CHECK (admin_status IN ('Pending', 'Approved', 'Rejected'));


-- 4. Re-verify RLS for Referral System
-- Ensure everyone can read referral codes for validation
DROP POLICY IF EXISTS "Anyone can read referrals" ON public.referrals;
CREATE POLICY "Anyone can read referrals"
  ON public.referrals FOR SELECT USING (true);

-- Ensure admins can see and update everything in these tables
-- (Optional but recommended if RLS is tight)
CREATE POLICY "Admins have full access to referrals" 
ON public.referrals 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);

CREATE POLICY "Admins have full access to referral_history" 
ON public.referral_history 
FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'Admin')
);
