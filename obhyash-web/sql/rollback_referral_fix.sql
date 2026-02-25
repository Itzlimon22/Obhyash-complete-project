-- =====================================================
-- ROLLBACK: UNDO CHANGES FROM fix_referral_system.sql
-- Run this in your Supabase SQL editor to revert to previous state.
-- =====================================================

-- 1. Revert Notification Table Constraint to Original State
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('exam_result', 'achievement', 'level_up', 'announcement', 'system'));


-- 2. Remove Admin-specific RLS Policies added in the fix script
-- (These were the most likely cause of the UI freeze due to subquery overhead)
DROP POLICY IF EXISTS "Admins have full access to referrals" ON public.referrals;
DROP POLICY IF EXISTS "Admins have full access to referral_history" ON public.referral_history;


-- 3. Remove Referral History Status Constraint
ALTER TABLE public.referral_history 
DROP CONSTRAINT IF EXISTS referral_history_admin_status_check;


-- 4. Keep the columns (admin_status, reward_given) as they are safe and data might exist,
-- but if you explicitly want to drop them to return to a very old schema:
-- ALTER TABLE public.referral_history DROP COLUMN IF EXISTS admin_status;
-- ALTER TABLE public.referral_history DROP COLUMN IF EXISTS reward_given;

-- 5. Restore Original "Anyone can read referrals" policy just to be sure
DROP POLICY IF EXISTS "Anyone can read referrals" ON public.referrals;
CREATE POLICY "Anyone can read referrals"
  ON public.referrals FOR SELECT USING (true);

SELECT 'Rollback completed. RLS policies reverted to original state.' as status;
