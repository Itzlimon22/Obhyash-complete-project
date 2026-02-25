import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const GET = async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get referral code for user
  const { data: referral } = await supabase
    .from('referrals')
    .select('*')
    .eq('owner_id', user.id)
    .single();

  if (!referral) {
    return NextResponse.json({ referral: null, history: [] });
  }

  // Get redemption history
  const { data: history } = await supabase
    .from('referral_history')
    .select('id, redeemed_at, redeemed_by')
    .eq('referral_id', referral.id)
    .order('redeemed_at', { ascending: false });

  // Enrich with user names/emails
  const enriched = await Promise.all(
    (history || []).map(async (h: any) => {
      const { data: redeemerProfile } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', h.redeemed_by)
        .single();
      return {
        ...h,
        redeemed_by: redeemerProfile || {
          name: 'Unknown',
          email: h.redeemed_by,
        },
      };
    }),
  );

  return NextResponse.json({ referral, history: enriched });
};
