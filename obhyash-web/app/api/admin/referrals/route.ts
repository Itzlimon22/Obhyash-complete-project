import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // 1. Fetch raw referral history safely without brittle FK constraints
    const {
      data: rawHistory,
      error: historyErr,
      count,
    } = await supabaseAdmin
      .from('referral_history')
      .select('*', { count: 'exact' })
      .order('redeemed_at', { ascending: false })
      .range(from, to);

    if (historyErr) {
      console.warn('Error fetching referral history:', historyErr);
    }

    const historyItems = rawHistory || [];

    // 2. Fetch referrals and users in batch
    const referralIds = Array.from(
      new Set(historyItems.map((h) => h.referral_id).filter(Boolean)),
    );
    const redeemerIds = Array.from(
      new Set(historyItems.map((h) => h.redeemed_by).filter(Boolean)),
    );

    const referralMap: Record<string, { id: string; code: string; owner_id: string }> = {};
    if (referralIds.length > 0) {
      try {
        const { data: refs } = await supabaseAdmin
          .from('referrals')
          .select('id, code, owner_id')
          .in('id', referralIds);

        if (refs) {
          refs.forEach((r) => {
            referralMap[r.id] = r;
          });
        }
      } catch (e) {
        console.warn('Error fetching referrals:', e);
      }
    }

    // Collect all user IDs (both redeemers and referral owners)
    const allUserIds = new Set<string>(redeemerIds);
    Object.values(referralMap).forEach((r) => {
      if (r.owner_id) allUserIds.add(r.owner_id);
    });

    const userMap: Record<string, { id: string; name: string; email: string }> = {};
    if (allUserIds.size > 0) {
      try {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .in('id', Array.from(allUserIds));

        if (users) {
          users.forEach((u) => {
            userMap[u.id] = {
              id: u.id,
              name: u.name || 'User',
              email: u.email || '',
            };
          });
        }
      } catch (e) {
        console.warn('Error batch fetching users for referrals:', e);
      }
    }

    // 3. Map enriched history
    const mappedHistory = historyItems.map((h) => {
      const ref = referralMap[h.referral_id];
      const owner = ref?.owner_id ? userMap[ref.owner_id] : null;
      const redeemer = h.redeemed_by ? userMap[h.redeemed_by] : null;

      return {
        id: h.id,
        redeemed_at: h.redeemed_at || h.created_at,
        reward_given: h.reward_given ?? false,
        admin_status: h.admin_status || 'Pending',
        reward_claimed: h.reward_claimed ?? false,
        reward_paid_at: h.reward_paid_at,
        reward_transaction_id: h.reward_transaction_id,
        redeemed_by_user: redeemer || {
          id: h.redeemed_by || '',
          name: 'ব্যবহারকারী',
          email: '',
        },
        referral: {
          id: h.referral_id || '',
          code: ref?.code || 'N/A',
          owner: owner || {
            id: ref?.owner_id || '',
            name: 'ব্যবহারকারী',
            email: '',
          },
        },
      };
    });

    // 4. Aggregate stats
    let totalRedemptions = 0;
    try {
      const { count: c } = await supabaseAdmin
        .from('referral_history')
        .select('*', { count: 'exact', head: true });
      totalRedemptions = c || 0;
    } catch (_) {}

    const uniqueReferrers = new Set(
      Object.values(referralMap).map((r) => r.owner_id).filter(Boolean),
    ).size;

    return NextResponse.json({
      data: mappedHistory,
      totalCount: count || mappedHistory.length,
      stats: {
        totalRedemptions,
        uniqueReferrers,
      },
    });
  } catch (error: any) {
    console.error('Admin referrals API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', data: [], totalCount: 0 },
      { status: 200 },
    );
  }
}
