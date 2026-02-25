import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const POST = async (req: Request) => {
  const supabase = await createClient();
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { code, newUserId } = await req.json();

  let targetUserId = user?.id;

  // If no active session, but newUserId is provided (e.g., during signup), use it
  if (!targetUserId && newUserId) {
    targetUserId = newUserId;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Missing referral code' },
      { status: 400 },
    );
  }

  // Look up referral
  const { data: referral, error: refErr } = await supabase
    .from('referrals')
    .select('*')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (refErr || !referral) {
    return NextResponse.json(
      { error: 'Invalid referral code' },
      { status: 404 },
    );
  }

  if (referral.owner_id === targetUserId) {
    return NextResponse.json(
      { error: 'You cannot use your own referral code' },
      { status: 400 },
    );
  }

  // Check if already redeemed by this targetUser
  const { data: existing } = await supabase
    .from('referral_history')
    .select('id')
    .eq('referral_id', referral.id)
    .eq('redeemed_by', targetUserId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'You have already used this referral code' },
      { status: 400 },
    );
  }

  // Check monthly limit (max 10 redemptions per owner per month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: monthlyRedemptions } = await supabaseAdmin
    .from('referral_history')
    .select('id', { count: 'exact', head: true })
    .eq('referral_id', referral.id)
    .gte('redeemed_at', startOfMonth.toISOString());

  if (monthlyRedemptions && monthlyRedemptions >= 10) {
    return NextResponse.json(
      { error: 'This referral code has reached its monthly limit.' },
      { status: 400 },
    );
  }

  // Record history as Pending
  await supabaseAdmin.from('referral_history').insert({
    referral_id: referral.id,
    redeemed_by: targetUserId,
    redeemed_at: new Date().toISOString(),
    admin_status: 'Pending',
    reward_given: false,
  });

  // Notify the referrer that someone used their code
  await supabaseAdmin.from('notifications').insert({
    user_id: referral.owner_id,
    title: 'নতুন রেফারেল!',
    message:
      'আপনার রেফারেল কোড ব্যবহার করে একজন নতুন ইউজার যুক্ত হয়েছে। অ্যাডমিন রিভিউ করার পর আপনি ১ মাসের ফ্রি প্রিমিয়াম পাবেন।',
    type: 'info',
    is_read: false,
  });

  return NextResponse.json({
    success: true,
    message: 'রেফারেল কোড গৃহীত হয়েছে! অ্যাডমিন এপ্রুভালের পর বোনাস পাবেন।',
  });
};
