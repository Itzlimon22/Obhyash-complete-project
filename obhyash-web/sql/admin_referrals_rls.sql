-- SQL Migration: Admin RLS for Referrals
-- Run this to allow Admin users to view all referrals and referral_history

-- For referrals: Allow Admin to read all
CREATE POLICY "Admin can read all referrals"
  ON public.referrals FOR SELECT
  USING (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'Admin'
    )
  );

-- For referral_history: Allow Admin to read all
CREATE POLICY "Admin can read all referral history"
  ON public.referral_history FOR SELECT
  USING (
    exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.role = 'Admin'
    )
  );
