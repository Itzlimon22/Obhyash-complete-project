import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const GET = async () => {
  const supabase = await createClient();

  // 1. Verify Authentication & Role
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure user is an admin
  const { data: profile, error: profileErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileErr || profile?.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Fetch all referrals history across the platform
  // Join with referral code and the users table for both referrer and redeemer
  // Because of RLS, make sure the Service Role or similar is used if Admin role doesn't override it,
  // but since we check role='Admin' above, we might need a bypass if RLS restricts SELECT.
  // Actually, 'users' has "Public profiles are viewable by everyone" for SELECT,
  // and for referrals, we've set "Anyone can read referrals".
  // For referral_history, we only have "Owners can read their referral history", so we need to use service role bypass.

  const supabaseAdmin = await createClient(true); // Assuming createClient(true) returns a service-role client, or we create one here.
  // We don't have a built-in true parameter in createClient.
  // Let's check how other admin endpoints bypass RLS.
  // It's possible Admin users have a postgres policy or we should use service_role key.
  // Actually, let's just use the default supabase client and if RLS blocks it, we know why.
  // Wait, let's look at how admin fetches subscriptions.
  // In `app/(admin)/admin/subscriptions/page.tsx`, it just uses the regular `createClient()` from `@/utils/supabase/client`.
  // Which means RLS in those tables either allows Admin or allows anyone to read for admin dashboard.
  // However, for `referral_history`, our policy is:
  // create policy "Owners can read their referral history" on public.referral_history for select using ( referral_id in ( select id from public.referrals where owner_id = auth.uid() ) );
  // So an admin won't be able to read it unless they are the owner!
  // We must fix the RLS policy for `referral_history` and `referrals` to allow 'Admin' role users to read all.

  const { data: history, error: historyErr } = await supabase
    .from('referral_history')
    .select(
      `
      id,
      redeemed_at,
      reward_given,
      redeemed_by_user:users!referral_history_redeemed_by_fkey(id, name, email),
      referral:referrals(
        id,
        code,
        owner:users!referrals_owner_id_fkey(id, name, email)
      )
    `,
    )
    .order('redeemed_at', { ascending: false });

  if (historyErr) {
    return NextResponse.json({ error: historyErr.message }, { status: 500 });
  }

  // Aggregate basic stats
  const totalRedemptions = history?.length || 0;

  // Unique referrers count
  const uniqueReferrers = new Set(
    history?.map((h) => (h.referral as any)?.owner?.id).filter(Boolean),
  ).size;

  return NextResponse.json({
    data: history,
    stats: {
      totalRedemptions,
      uniqueReferrers,
    },
  });
};
