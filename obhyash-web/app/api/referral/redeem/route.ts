import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const POST = async (req: Request) => {
  const supabase = await createClient();
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

  // Helper: extend subscription by 1 month
  const extendSubscription = async (userId: string) => {
    const { data: profile } = await supabase
      .from('users')
      .select('subscription')
      .eq('id', userId)
      .single();
    const sub = profile?.subscription || {};
    const currentExpiry = sub.expiry ? new Date(sub.expiry) : new Date();
    if (currentExpiry < new Date()) currentExpiry.setTime(new Date().getTime());
    currentExpiry.setMonth(currentExpiry.getMonth() + 1);
    await supabase
      .from('users')
      .update({
        subscription: {
          ...sub,
          plan: 'Premium',
          status: 'Active',
          expiry: currentExpiry.toISOString(),
        },
      })
      .eq('id', userId);
  };

  // Extend both users
  await extendSubscription(targetUserId!);
  await extendSubscription(referral.owner_id);

  // Record history
  await supabase.from('referral_history').insert({
    referral_id: referral.id,
    redeemed_by: targetUserId,
    redeemed_at: new Date().toISOString(),
    reward_given: true,
  });

  return NextResponse.json({
    success: true,
    message: '১ মাসের প্রিমিয়াম যোগ করা হয়েছে!',
  });
};
