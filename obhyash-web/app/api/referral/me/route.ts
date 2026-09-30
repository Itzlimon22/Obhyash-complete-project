import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const GET = async (req: Request) => {
  try {
    const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, supabaseServiceKey);
    let user: any = null;

    // 1. Try Bearer token from Authorization header first
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token);
      if (tokenUser) user = tokenUser;
    }

    // 2. Fallback to cookie authentication
    if (!user) {
      try {
        const supabase = await createClient();
        const { data: { user: cookieUser } } = await supabase.auth.getUser();
        if (cookieUser) user = cookieUser;
      } catch (_) {}
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 0. Run initial queries in parallel (Config, User Referral, Scratch Cards, Has Used)
    const [cfgRes, refRes, scratchRes, hasUsedRes] = await Promise.all([
      supabaseAdmin
        .from('app_config')
        .select('referral_system_enabled')
        .eq('id', 'global_config')
        .maybeSingle()
        .then((r) => r, () => null),
      supabaseAdmin
        .from('referrals')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()
        .then((r) => r, () => null),
      supabaseAdmin
        .from('scratch_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then((r) => r, () => null),
      supabaseAdmin
        .from('referral_history')
        .select('id', { count: 'exact', head: true })
        .eq('redeemed_by', user.id)
        .then((r) => r, () => null),
    ]);

    const isReferralSystemEnabled =
      cfgRes?.data?.referral_system_enabled !== undefined && cfgRes?.data?.referral_system_enabled !== null
        ? cfgRes.data.referral_system_enabled
        : true;

    let referral = refRes?.data || null;

    // Auto-create referral code if doesn't exist yet
    if (!referral) {
      try {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let attempt = 0; attempt < 5; attempt++) {
          let randCode = '';
          for (let i = 0; i < 8; i++) {
            randCode += chars.charAt(Math.floor(Math.random() * chars.length));
          }

          const { data: createdRef, error: insertErr } = await supabaseAdmin
            .from('referrals')
            .insert({
              owner_id: user.id,
              code: randCode,
            })
            .select('*')
            .single();

          if (createdRef && !insertErr) {
            referral = createdRef;
            break;
          }
        }
      } catch (e) {
        console.warn('Error creating referral:', e);
      }
    }

    const scratchCards = scratchRes?.data || [];
    const hasUsedReferral = ((hasUsedRes as any)?.count || 0) > 0;

    if (!referral) {
      return NextResponse.json({
        referral: null,
        history: [],
        totalApproved: 0,
        scratchCards,
        hasUsedReferral,
        is_enabled: isReferralSystemEnabled,
      });
    }

    // 2. Fetch history and totalApproved in parallel
    const [histRes, countRes] = await Promise.all([
      supabaseAdmin
        .from('referral_history')
        .select('id, redeemed_at, redeemed_by, admin_status, reward_given')
        .eq('referral_id', referral.id)
        .order('redeemed_at', { ascending: false })
        .then((r) => r, () => null),
      supabaseAdmin
        .from('referral_history')
        .select('id', { count: 'exact', head: true })
        .eq('referral_id', referral.id)
        .eq('admin_status', 'Approved')
        .then((r) => r, () => null),
    ]);

    const history = histRes?.data || [];
    const totalApproved = (countRes as any)?.count || 0;

    // 3. Batch fetch redeemer user details
    const redeemerIds = Array.from(
      new Set(history.map((h: any) => h.redeemed_by).filter(Boolean)),
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

    const enriched = history.map((h: any) => ({
      ...h,
      redeemed_by: userMap[h.redeemed_by] || {
        name: 'Student',
        email: h.redeemed_by || '',
      },
    }));

    return NextResponse.json({
      referral,
      history: enriched,
      totalApproved,
      scratchCards,
      hasUsedReferral,
      is_enabled: isReferralSystemEnabled,
    });
  } catch (error: any) {
    console.error('Error in /api/referral/me:', error);
    return NextResponse.json(
      { referral: null, history: [], totalApproved: 0, scratchCards: [], hasUsedReferral: true, is_enabled: true },
      { status: 200 },
    );
  }
};
