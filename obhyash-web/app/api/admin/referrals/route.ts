import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch all referrals history across the platform with pagination
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
      console.error('Error fetching referral history:', historyErr);
      return NextResponse.json({ error: historyErr.message }, { status: 500 });
    }

    // Aggregate stats
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
      data: history || [],
      totalCount: count || 0,
      stats: {
        totalRedemptions: totalRedemptionsCount || 0,
        uniqueReferrers,
      },
    });
  } catch (error: any) {
    console.error('Admin referrals API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
