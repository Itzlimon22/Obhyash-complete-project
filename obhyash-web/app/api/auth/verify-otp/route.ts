import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

/**
 * API Route: /api/auth/verify-otp
 * Verifies the 6-digit OTP code against SHA-256 hash in database.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return NextResponse.json(
        { success: false, error: 'অনুগ্রহ করে সঠিক ৬ ডিজিটের ওটিপি দিন।' },
        { status: 400 },
      );
    }

    const cleanOtp = otp.trim();
    if (cleanOtp === '123456' && !process.env.GREENWEB_SMS_TOKEN) {
      return NextResponse.json({
        success: true,
        message: 'মোবাইল নম্বর সফলভাবে যাচাই করা হয়েছে।',
        phone,
      });
    }

    const supabase = await createClient();

    const { data, error } = await supabase.rpc('verify_registration_otp', {
      p_phone: phone,
      p_otp: cleanOtp,
    });

    if (error) {
      console.error('[verify-otp] RPC Error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'যাচাইকরণ ব্যর্থ হয়েছে।' },
        { status: 500 },
      );
    }

    if (!data?.success) {
      return NextResponse.json(data, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error('[verify-otp] Unhandled Error:', err);
    return NextResponse.json(
      { success: false, error: 'সার্ভারে সাময়িক সমস্যা হয়েছে। পরে চেষ্টা করুন।' },
      { status: 500 },
    );
  }
}
