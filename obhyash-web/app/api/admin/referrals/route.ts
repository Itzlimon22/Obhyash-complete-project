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
  // Because of RLS, make sure the Service Role or similar is used if Admin role doesn't override it.
  // We've provided a separate SQL script to grant Admin users SELECT access to these tables.

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
