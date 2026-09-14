import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.UDDOKTAPAY_API_KEY!;
const baseUrl = process.env.UDDOKTAPAY_BASE_URL || 'https://obhyash.paymently.io/api';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://obhyash.com';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId, planName, amount, customerName, customerEmail, customerPhone } = body;

    if (!userId || !amount || !planId) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment parameters' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 0. Check master payment emergency switch
    const { data: config } = await supabaseAdmin
      .from('app_config')
      .select('payments_enabled')
      .eq('id', 'global_config')
      .maybeSingle();

    if (config && config.payments_enabled === false) {
      return NextResponse.json(
        {
          success: false,
          error: 'পেমেন্ট গেটওয়ে বর্তমানে সাময়িকভাবে স্থগিত রয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।',
        },
        { status: 503 },
      );
    }

    // Fetch user details if not provided
    let name = customerName;
    let email = customerEmail;
    let phone = customerPhone;

    if (!name || !email) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('name, email, phone')
        .eq('id', userId)
        .single();

      if (user) {
        name = name || user.name || 'Obhyash Student';
        email = email || user.email || 'student@obhyash.com';
        phone = phone || user.phone || '01700000000';
      }
    }

    // Dynamic URL resolution: preserve active domain/origin for user redirect
    const origin = request.headers.get('origin') || request.nextUrl.origin;
    const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));
    const redirectBase = origin || process.env.NEXT_PUBLIC_APP_URL || 'https://obhyash.com';
    const webhookBase = isLocalhost
      ? (process.env.NEXT_PUBLIC_APP_URL || 'https://obhyash.com')
      : redirectBase;

    const checkoutEndpoint = `${baseUrl}/checkout-v2`;
    const payload = {
      full_name: name || 'Obhyash Student',
      email: email || 'student@obhyash.com',
      amount: String(amount),
      metadata: {
        user_id: userId,
        userId: userId,
        plan_id: planId,
        planId: planId,
        plan_name: planName || 'Pro Plan',
      },
      redirect_url: `${redirectBase}/payment/success`,
      cancel_url: `${redirectBase}/payment/cancel`,
      webhook_url: `${webhookBase}/api/payment/uddoktapay/webhook`,
    };

    const response = await fetch(checkoutEndpoint, {
      method: 'POST',
      headers: {
        'RT-UDDOKTAPAY-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error('UddoktaPay checkout error:', data);
      return NextResponse.json(
        { success: false, error: data.message || 'Failed to initialize payment gateway' },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      paymentUrl: data.payment_url,
      data,
    });
  } catch (error: any) {
    console.error('Error creating UddoktaPay payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
