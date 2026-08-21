-- Add is_referral_blocked to users and referrals
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_referral_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
