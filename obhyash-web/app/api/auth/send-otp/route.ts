import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';

/**
 * API Route: /api/auth/send-otp
 * Handles OTP generation via Supabase RPC and forwards to Greenweb BD SMS Gateway.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone || typeof phone !== 'string') {
      return NextResponse.json(
        { success: false, error: 'সঠিক মোবাইল নম্বর উল্লেখ করুন।' },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const isDev = process.env.NODE_ENV !== 'production';

    // Call Supabase RPC
    const { data, error } = await supabase.rpc('send_registration_otp', {
      p_phone: phone,
      p_is_dev_mock: isDev,
    });

    if (error) {
      console.error('[send-otp] RPC Error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'ওটিপি পাঠাতে ব্যর্থ হয়েছে।' },
        { status: 500 },
      );
    }

    if (!data?.success) {
      return NextResponse.json(data, { status: 400 });
    }

    const otpCode = data.otp_code;
    const cleanPhone = data.phone;
    const smsToken = process.env.GREENWEB_SMS_TOKEN;

    // Send SMS via Greenweb BD if token is configured
    if (smsToken && otpCode) {
      try {
        const smsMessage = `আপনার অভ্যাস (Obhyash) ভেরিফিকেশন ওটিপি কোড: ${otpCode}। এটি কাউকে শেয়ার করবেন না। মেয়াদ ৫ মিনিট।`;
        const params = new URLSearchParams({
          token: smsToken,
          to: cleanPhone,
          message: smsMessage,
        });

        const greenwebRes = await fetch('https://api.greenweb.com.bd/api.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString(),
        });

        const responseText = await greenwebRes.text();
        console.log(`[send-otp] Greenweb Response for ${cleanPhone}:`, responseText);
      } catch (smsErr) {
        console.error('[send-otp] Greenweb Gateway Fetch Error:', smsErr);
        // We do not fail the request if SMS gateway logs error, but log it
      }
    } else if (isDev) {
      console.log(`\n========================================\n[DEV OTP MOCK] Phone: ${cleanPhone} | Code: ${otpCode}\n========================================\n`);
    }

    return NextResponse.json({
      success: true,
      message: 'মোবাইলে ৬ ডিজিটের ওটিপি কোড পাঠানো হয়েছে।',
      phone: cleanPhone,
      cooldown_seconds: data.cooldown_seconds || 60,
      expires_in_minutes: 5,
      // Only include mock_otp in local dev when SMS token is not configured
      mock_otp: isDev && !smsToken ? otpCode : undefined,
    });
  } catch (err: unknown) {
    console.error('[send-otp] Unhandled Error:', err);
    return NextResponse.json(
      { success: false, error: 'সার্ভারে সাময়িক সমস্যা হয়েছে। পরে চেষ্টা করুন।' },
      { status: 500 },
    );
  }
}
