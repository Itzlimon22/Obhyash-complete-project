import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const GET = async () => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);

    // 1. Get or auto-create referral code for user
    let referral: any = null;
    try {
      const { data: ref } = await supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ref) {
        referral = ref;
      } else {
        // Auto-create referral code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let randCode = '';
        for (let i = 0; i < 8; i++) {
          randCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const { data: createdRef } = await supabaseAdmin
          .from('referrals')
          .insert({
            owner_id: user.id,
            code: randCode,
          })
          .select('*')
          .single();

        referral = createdRef || { code: randCode, owner_id: user.id };
      }
    } catch (e) {
      console.warn('Error fetching or creating referral:', e);
    }

    if (!referral) {
      return NextResponse.json({
        referral: null,
        history: [],
        totalApproved: 0,
        scratchCards: [],
      });
    }

    // 2. Safely get redemption history
    let history: any[] = [];
    try {
      const { data: hist } = await supabaseAdmin
        .from('referral_history')
        .select('id, redeemed_at, redeemed_by, admin_status, reward_given')
        .eq('referral_id', referral.id)
        .order('redeemed_at', { ascending: false });

      if (hist) history = hist;
    } catch (e) {
      console.warn('Error fetching referral history:', e);
    }

    // 3. Batch fetch redeemer user details
    const redeemerIds = Array.from(
      new Set(history.map((h) => h.redeemed_by).filter(Boolean)),
    );
    const userMap: Record<string, { name: string; email: string }> = {};
    if (redeemerIds.length > 0) {
      try {
        const { data: profiles } = await supabaseAdmin
          .from('users')
          .select('id, name, email')
          .in('id', redeemerIds);

        if (profiles) {
          profiles.forEach((p) => {
            userMap[p.id] = {
              name: p.name || 'Student',
              email: p.email || '',
            };
          });
        }
      } catch (e) {
        console.warn('Error batch fetching redeemer profiles:', e);
      }
    }

    const enriched = history.map((h) => ({
      ...h,
      redeemed_by: userMap[h.redeemed_by] || {
        name: 'Student',
        email: h.redeemed_by || '',
      },
    }));

    // 4. Get exact count of approved referrals
    let totalApproved = 0;
    try {
      const { count } = await supabaseAdmin
        .from('referral_history')
        .select('id', { count: 'exact', head: true })
        .eq('referral_id', referral.id)
        .eq('admin_status', 'Approved');

      totalApproved = count || 0;
    } catch (_) {}

    // 5. Get scratch cards
    let scratchCards: any[] = [];
    try {
      const { data: sc } = await supabaseAdmin
        .from('scratch_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (sc) scratchCards = sc;
    } catch (_) {}

    // 6. Check if user has already redeemed any referral code
    let hasUsedReferral = false;
    try {
      const { count: redeemedCount } = await supabaseAdmin
        .from('referral_history')
        .select('id', { count: 'exact', head: true })
        .eq('redeemed_by', user.id);

      hasUsedReferral = (redeemedCount || 0) > 0;
    } catch (_) {}

    return NextResponse.json({
      referral,
      history: enriched,
      totalApproved,
      scratchCards,
      hasUsedReferral,
    });
  } catch (error: any) {
    console.error('Error in /api/referral/me:', error);
    return NextResponse.json(
      { referral: null, history: [], totalApproved: 0, scratchCards: [], hasUsedReferral: true },
      { status: 200 },
    );
  }
};
