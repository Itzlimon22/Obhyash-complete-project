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

  // Use atomic stored procedure with anti-brute-force rate limiting (3 failed attempts = 10 min lockout)
  const { data: redeemRes, error: txnError } = await supabaseAdmin.rpc(
    'redeem_referral_by_code',
    {
      p_code: code.trim().toUpperCase(),
      p_user_id: targetUserId,
    },
  );

  if (txnError) {
    return NextResponse.json({ error: txnError.message }, { status: 400 });
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
