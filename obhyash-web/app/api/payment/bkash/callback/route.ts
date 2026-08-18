import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const BKASH_APP_KEY = process.env.BKASH_APP_KEY || '';
const BKASH_APP_SECRET = process.env.BKASH_APP_SECRET || '';
const BKASH_USERNAME = process.env.BKASH_USERNAME || '';
const BKASH_PASSWORD = process.env.BKASH_PASSWORD || '';
const BKASH_BASE_URL = process.env.BKASH_BASE_URL || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

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
  return data.id_token;
}

export async function GET(request: NextRequest) {
  try {
    await connection();
    const searchParams = request.nextUrl.searchParams;
    const paymentID = searchParams.get('paymentID');
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://obhyash.com';
    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    if (status === 'cancel' || status === 'failure') {
      if (orderId) {
        await supabaseAdmin
          .from('payment_requests')
          .update({ status: 'Rejected', admin_notes: `bKash payment ${status}` })
          .eq('id', orderId);
      }
      return NextResponse.redirect(`${appUrl}/subscription?status=failed`);
    }

    if (status === 'success' && paymentID && orderId) {
      // 1. Execute payment with bKash API servers
      const idToken = await getBkashIdToken();
      const execRes = await fetch(`${BKASH_BASE_URL}/tokenized/checkout/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: idToken,
          'X-APP-Key': BKASH_APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
      });

      const execData = await execRes.json();

      if (execData.statusCode === '0000' && execData.trxID) {
        // 2. Verified directly with bKash Server! Update transaction ID
        await supabaseAdmin
          .from('payment_requests')
          .update({
            transaction_id: execData.trxID,
            admin_notes: `Auto-verified via bKash PGW (PaymentID: ${paymentID})`,
          })
          .eq('id', orderId);

        // 3. Atomically activate subscription using database RPC
        await supabaseAdmin.rpc('approve_payment_request', {
          p_request_id: orderId,
          p_admin_notes: `Auto-approved by bKash PGW Gateway (TrxID: ${execData.trxID})`,
        });

        return NextResponse.redirect(`${appUrl}/subscription?status=success&trx=${execData.trxID}`);
      }
    }

    return NextResponse.redirect(`${appUrl}/subscription?status=pending`);
  } catch (err) {
    console.error('Error in /api/payment/bkash/callback:', err);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://obhyash.com';
    return NextResponse.redirect(`${appUrl}/subscription?status=error`);
  }
}
