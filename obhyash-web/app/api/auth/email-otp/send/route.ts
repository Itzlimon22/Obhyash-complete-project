import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

/**
 * API Route: /api/auth/email-otp/send
 * Generates secure 6-digit email OTP and dispatches to user's email.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'লগইন সেশন পাওয়া যায়নি।' },
        { status: 401 },
      );
    }

    const targetEmail = (email || authUser.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'সঠিক ইমেইল অ্যাড্রেস উল্লেখ করুন।' },
        { status: 400 },
      );
    }

    const isDev = process.env.NODE_ENV !== 'production';

    const { data, error } = await supabase.rpc('send_email_verification_otp', {
      p_user_id: authUser.id,
      p_email: targetEmail,
      p_is_dev_mock: isDev,
    });

    if (error) {
      console.error('[send-email-otp] RPC Error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।' },
        { status: 500 },
      );
    }

    if (!data?.success) {
      return NextResponse.json(data, { status: 400 });
    }

    const otpCode = data.otp_code;
    if (isDev && otpCode) {
      console.log(`\n========================================\n[DEV EMAIL OTP] To: ${targetEmail} | Code: ${otpCode}\n========================================\n`);
    }

    return NextResponse.json({
      success: true,
      message: 'আপনার ইমেইলে ৬ ডিজিটের ওটিপি কোড পাঠানো হয়েছে। ইনবক্স বা স্প্যাম ফোল্ডার চেক করুন।',
      email: targetEmail,
      cooldown_seconds: data.cooldown_seconds || 60,
      expires_in_minutes: 10,
      mock_otp: isDev ? otpCode : undefined,
    });
  } catch (err: unknown) {
    console.error('[send-email-otp] Unhandled Error:', err);
    return NextResponse.json(
      { success: false, error: 'সার্ভারে সাময়িক সমস্যা হয়েছে। পরে চেষ্টা করুন।' },
      { status: 500 },
    );
  }
}
