import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const GET = async () => {
  const supabase = await createClient();
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

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
  // We use the service role key to bypass the RLS policies which were rolled back
  // Admin requires full view of all data.
  const { data: history, error: historyErr } = await supabaseAdmin
    .from('referral_history')
    .select(
      `
      id,
      redeemed_at,
      reward_given,
      admin_status,
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
