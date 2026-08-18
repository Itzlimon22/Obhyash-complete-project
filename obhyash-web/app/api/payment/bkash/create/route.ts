import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BKASH_APP_KEY = process.env.BKASH_APP_KEY || '';
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET || '';
const BKASH_USERNAME = process.env.BKASH_USERNAME || '';
const BKASH_PASSWORD = process.env.BKASH_PASSWORD || '';
const BKASH_BASE_URL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

// Helper: Obtain bKash Grant Token
async function getBkashIdToken(): Promise<string> {
  const res = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      username: BKASH_USERNAME,
      password: BKASH_PASSWORD,
    },
    body: JSON.stringify({
      app_key: BKASH_APP_KEY,
      app_secret: BKASH_APP_SECRET,
    }),
  });

  const data = await res.json();
  if (!data.id_token) {
    throw new Error(data.statusMessage || 'Failed to authenticate with bKash');
  }
  return data.id_token;
}

export async function POST(request: NextRequest) {
  try {
    await connection();
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate user from session header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Login required' },
        { status: 401 },
      );
    }

    const token = authHeader.substring(7);
    const { data: authData, error: authErr } = await supabaseAdmin.auth.getUser(token);
    if (authErr || !authData?.user) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication session' },
        { status: 401 },
      );
    }

    const user = authData.user;
    const body = await request.json();
    const { planId, planName, amount } = body;

    if (!planName || !amount) {
      return NextResponse.json(
        { success: false, error: 'planName and amount are required' },
        { status: 400 },
      );
    }

    // 2. Generate unique merchant invoice ID
    const merchantInvoiceNumber = `OBH-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Create a pending payment request record
    const { data: pendingPay, error: insertErr } = await supabaseAdmin
      .from('payment_requests')
      .insert({
        user_id: user.id,
        plan_name: planName,
        amount: Number(amount),
        currency: 'BDT',
        payment_method: 'bKash Automated Gateway',
        transaction_id: merchantInvoiceNumber,
        status: 'Pending',
        requested_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (insertErr || !pendingPay) {
      throw new Error('Failed to initiate payment record');
    }

    // 4. If bKash credentials are fully configured, initiate live bKash Checkout
    if (BKASH_APP_KEY && BKASH_APP_SECRET) {
      const idToken = await getBkashIdToken();
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://obhyash.com';

      const createRes = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: idToken,
          'X-APP-Key': BKASH_APP_KEY,
        },
        body: JSON.stringify({
          mode: '0011',
          payerReference: user.phone || user.email || user.id,
          callbackURL: `${appUrl}/api/payment/bkash/callback?orderId=${pendingPay.id}`,
          amount: amount.toString(),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber,
        }),
      });

      const createData = await createRes.json();
      if (createData.bkashURL) {
        return NextResponse.json({
          success: true,
          paymentId: createData.paymentID,
          bkashURL: createData.bkashURL,
          orderId: pendingPay.id,
        });
      }
    }

    // Fallback: Return order ID for simulated/sandbox test
    return NextResponse.json({
      success: true,
      orderId: pendingPay.id,
      merchantInvoiceNumber,
      message: 'Automated payment session initiated',
    });
  } catch (err: any) {
    console.error('Error in /api/payment/bkash/create:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Payment initiation failed' },
      { status: 500 },
    );
  }
}
