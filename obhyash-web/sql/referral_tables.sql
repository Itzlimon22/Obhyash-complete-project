-- Referral tables migration
-- Run this in your Supabase SQL editor

-- 1. referrals table: stores one code per user
create table if not exists public.referrals (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.users(id) on delete cascade,
  code       text unique not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Index for fast lookup by owner
create index if not exists referrals_owner_id_idx on public.referrals(owner_id);
-- Index for fast lookup by code
create index if not exists referrals_code_idx on public.referrals(code);


-- 2. referral_history table: tracks each redemption
create table if not exists public.referral_history (
  id           uuid primary key default gen_random_uuid(),
  referral_id  uuid not null references public.referrals(id) on delete cascade,
  redeemed_by  uuid not null references public.users(id) on delete cascade,
  redeemed_at  timestamptz not null default now(),
  admin_status text not null default 'Pending', -- 'Pending', 'Approved', 'Rejected'
  reward_given boolean not null default false,

  -- Prevent the same user redeeming the same code twice
  unique (referral_id, redeemed_by)
);

-- Index for fast history lookups
create index if not exists referral_history_ref_idx on public.referral_history(referral_id);


-- 3. RLS policies
alter table public.referrals enable row level security;
alter table public.referral_history enable row level security;

-- Allow anyone to read referral codes (needed for validation)
create policy "Anyone can read referrals"
  on public.referrals for select using (true);

-- Only the owner can insert their own referral
create policy "Owners can insert referrals"
  on public.referrals for insert
  with check (owner_id = auth.uid());

-- Authenticated users can insert history (redemptions)
create policy "Authenticated users can insert history"
  on public.referral_history for insert
  with check (redeemed_by = auth.uid());

-- Users can read history for their own referral
create policy "Owners can read their referral history"
  on public.referral_history for select
  using (
    referral_id in (
      select id from public.referrals where owner_id = auth.uid()
    )
  );
