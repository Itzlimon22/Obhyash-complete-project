-- SQL Migration: Add admin approval status to referral system
-- Run this in your Supabase SQL editor

-- 1. Add admin_status to referral_history table
-- Status can be: 'Pending', 'Approved', 'Rejected'
ALTER TABLE public.referral_history 
ADD COLUMN IF NOT EXISTS admin_status TEXT NOT NULL DEFAULT 'Pending';

-- 2. Update existing rows (if any) to 'Approved' so previous users don't lose their rewards
UPDATE public.referral_history
SET admin_status = 'Approved'
WHERE reward_given = true;

-- 3. Optional: Create an index on admin_status for faster filtering in the Admin dashboard
CREATE INDEX IF NOT EXISTS referral_history_admin_status_idx ON public.referral_history(admin_status);
