import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.UDDOKTAPAY_API_KEY!;
const baseUrl = process.env.UDDOKTAPAY_BASE_URL || 'https://obhyash.paymently.io/api';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://obhyash.vercel.app';

export async function POST(request: NextRequest) {
  try {
    await connection();
    const body = await request.json();
    const { userId, planId, planName, amount, customerName, customerEmail, customerPhone } = body;

    if (!userId || !amount || !planId) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment parameters' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    const checkoutEndpoint = `${baseUrl}/checkout-v2`;
    const payload = {
      full_name: name || 'Obhyash Student',
      email: email || 'student@obhyash.com',
      amount: String(amount),
      metadata: {
        user_id: userId,
        plan_id: planId,
        plan_name: planName || 'Pro Plan',
      },
      redirect_url: `${appUrl}/payment/success`,
      cancel_url: `${appUrl}/payment/cancel`,
      webhook_url: `${appUrl}/api/payment/uddoktapay/webhook`,
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
