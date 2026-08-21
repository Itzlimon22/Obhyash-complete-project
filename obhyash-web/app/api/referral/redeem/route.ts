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

  const cleanCode = code.trim().toUpperCase();

  // 1. Check if the redeeming user is referral-blocked
  const { data: redeemerProfile } = await supabaseAdmin
    .from('users')
    .select('subscription')
    .eq('id', targetUserId)
    .single();

  if (redeemerProfile?.subscription?.is_referral_blocked) {
    return NextResponse.json(
      { error: 'আপনার অ্যাকাউন্ট থেকে রেফারেল কোড ব্যবহারের সুবিধা স্থগিত রয়েছে।' },
      { status: 403 },
    );
  }

  // 2. Check if the referral code itself is blocked/expired
  const { data: refRecord } = await supabaseAdmin
    .from('referrals')
    .select('expires_at, owner_id')
    .eq('code', cleanCode)
    .maybeSingle();

  if (refRecord?.expires_at && new Date(refRecord.expires_at) < new Date()) {
    return NextResponse.json(
      { error: 'এই রেফারেল কোডটি বর্তমানে অ্যাডমিন কর্তৃক নিষ্ক্রিয় বা স্থগিত রয়েছে।' },
      { status: 400 },
    );
  }

  // Use atomic stored procedure with anti-brute-force rate limiting (3 failed attempts = 10 min lockout)
  const { data: redeemRes, error: txnError } = await supabaseAdmin.rpc(
    'redeem_referral_by_code',
    {
      p_code: cleanCode,
      p_user_id: targetUserId,
    },
  );

  if (txnError) {
    const raw = txnError.message || '';
    let msg = raw;
    const lower = raw.toLowerCase();
    if (lower.includes('own referral') || lower.includes('own')) {
      msg = 'তুমি নিজের রেফারেল কোড ব্যবহার করতে পারবে না!';
    } else if (lower.includes('invalid') || lower.includes('not found')) {
      msg = 'ভুল রেফারেল কোড! অনুগ্রহ করে সঠিক কোড দিন।';
    } else if (lower.includes('already') || lower.includes('used')) {
      msg = 'তুমি ইতিমধ্যে একটি রেফারেল কোড ব্যবহার করেছো!';
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Notify the user that they successfully redeemed
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      title: 'রেফারেল কোড গৃহীত!',
      message:
        'আপনি সফলভাবে রেফারেল কোড ক্লেইম করেছেন এবং ১ মাসের ফ্রি প্রিমিয়াম অ্যাক্টিভ হয়েছে!',
      type: 'system',
      is_read: false,
    });
  } catch (_) {}

  return NextResponse.json({
    success: true,
    message: 'রেফারেল কোড সফলভাবে যুক্ত হয়েছে! ১ মাসের প্রিমিয়াম বোনাস যুক্ত হয়েছে।',
  });
};
