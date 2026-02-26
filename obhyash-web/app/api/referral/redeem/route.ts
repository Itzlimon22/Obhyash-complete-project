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
  const { data: referral, error: refErr } = await supabaseAdmin
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

  // Use atomic stored procedure for redemption checks and history insertion
  const { error: txnError } = await supabaseAdmin.rpc('redeem_referral_tx', {
    p_referral_id: referral.id,
    p_redeemer_id: targetUserId,
  });

  if (txnError) {
    // Map known error codes to appropriate HTTP status
    const statusMap: Record<string, number> = {
      P0002: 400, // self‑referral
      P0003: 400, // already redeemed
      P0004: 400, // monthly limit reached
    };
    const status = statusMap[txnError.code] ?? 500;
    return NextResponse.json({ error: txnError.message }, { status });
  }

  // Record history as Pending
  const { error: insertErr } = await supabaseAdmin
    .from('referral_history')
    .insert({
      referral_id: referral.id,
      redeemed_by: targetUserId,
      redeemed_at: new Date().toISOString(),
      admin_status: 'Pending',
      reward_given: false,
    });

  if (insertErr) {
    console.error('Insert History Error:', insertErr);
    return NextResponse.json(
      { error: 'Failed to record referral: ' + insertErr.message },
      { status: 500 },
    );
  }

  // Notify the referrer that someone used their code
  const { error: notifErr } = await supabaseAdmin.from('notifications').insert({
    user_id: referral.owner_id,
    title: 'নতুন রেফারেল!',
    message:
      'আপনার রেফারেল কোড ব্যবহার করে একজন নতুন ইউজার যুক্ত হয়েছে। অ্যাডমিন রিভিউ করার পর আপনি ১ মাসের ফ্রি প্রিমিয়াম পাবেন।',
    type: 'system',
    is_read: false,
  });

  if (notifErr) {
    console.error('Insert Notification Error:', notifErr);
    // Even if notification fails, the referral succeeded, so we don't throw 500, but log it.
  }

  // Notify the new user that they successfully used a code
  await supabaseAdmin.from('notifications').insert({
    user_id: targetUserId,
    title: 'রেফারেল কোড গৃহীত!',
    message:
      'আপনি সফলভাবে একটি রেফারেল কোড ব্যবহার করে সাইনআপ করেছেন। অ্যাডমিন এপ্রুভালের পর আপনি ১ মাসের ফ্রি প্রিমিয়াম পাবেন।',
    type: 'system',
    is_read: false,
  });

  return NextResponse.json({
    success: true,
    message: 'রেফারেল কোড গৃহীত হয়েছে! অ্যাডমিন এপ্রুভালের পর বোনাস পাবেন।',
  });
};
