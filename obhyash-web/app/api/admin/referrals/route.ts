import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const GET = async (request: NextRequest) => {
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

  // 2. Fetch all referrals history across the platform with pagination
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const {
    data: history,
    error: historyErr,
    count,
  } = await supabaseAdmin
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
      { count: 'exact' },
    )
    .order('redeemed_at', { ascending: false })
    .range(from, to);

  if (historyErr) {
    return NextResponse.json({ error: historyErr.message }, { status: 500 });
  }

  // Aggregate stats (Note: For large datasets, this should be a separate query or an RPC)
  // For now, we'll fetch the total count for the stats
  const { count: totalRedemptionsCount } = await supabaseAdmin
    .from('referral_history')
    .select('*', { count: 'exact', head: true });

  const { data: uniqueReferrersData } = await supabaseAdmin
    .from('referral_history')
    .select('referral(owner_id)');

  const uniqueReferrers = new Set(
    uniqueReferrersData?.map((h: any) => h.referral?.owner_id).filter(Boolean),
  ).size;

  return NextResponse.json({
    data: history,
    totalCount: count || 0,
    stats: {
      totalRedemptions: totalRedemptionsCount || 0,
      uniqueReferrers,
    },
  });
};
