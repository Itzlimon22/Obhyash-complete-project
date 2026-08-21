import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

/**
 * API Route: /api/auth/email-otp/verify
 * Verifies 6-digit email OTP and locks verified email in database.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: 'অনুগ্রহ করে ৬ ডিজিটের সঠিক ওটিপি কোড লিখুন।' },
        { status: 400 },
      );
    }

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

    const { data, error } = await supabase.rpc('verify_email_otp', {
      p_user_id: authUser.id,
      p_email: targetEmail,
      p_otp: otp.trim(),
    });

    if (error) {
      console.error('[verify-email-otp] RPC Error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'ভেরিফিকেশন ব্যর্থ হয়েছে।' },
        { status: 500 },
      );
    }

    if (!data?.success) {
      return NextResponse.json(data, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[verify-email-otp] Unhandled Error:', err);
    return NextResponse.json(
      { success: false, error: 'সার্ভারে সাময়িক সমস্যা হয়েছে। পরে চেষ্টা করুন।' },
      { status: 500 },
    );
  }
}
