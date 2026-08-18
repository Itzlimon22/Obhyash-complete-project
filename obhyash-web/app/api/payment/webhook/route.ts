import { NextRequest, NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PAYMENT_WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'obhyash_payment_webhook_secret_key_2026';

export async function POST(request: NextRequest) {
  try {
    await connection();
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature') || request.headers.get('x-signature');

    // 1. Verify HMAC Signature if secret is configured
    if (PAYMENT_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', PAYMENT_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        return NextResponse.json(
          { success: false, error: 'Invalid HMAC signature' },
          { status: 401 },
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const { orderId, trxID, status, amount } = payload;

    if (!orderId || !trxID) {
      return NextResponse.json(
        { success: false, error: 'orderId and trxID are required' },
        { status: 400 },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch target payment request
    const { data: payReq, error: fetchErr } = await supabaseAdmin
      .from('payment_requests')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchErr || !payReq) {
      return NextResponse.json(
        { success: false, error: 'Payment request not found' },
        { status: 404 },
      );
    }

    // 3. Prevent duplicate processing (Idempotency)
    if (payReq.status === 'Approved') {
      return NextResponse.json({ success: true, message: 'Already approved' });
    }

    if (status === 'COMPLETED' || status === 'SUCCESS' || status === 'Approved') {
      // Update TrxID
      await supabaseAdmin
        .from('payment_requests')
        .update({
          transaction_id: trxID,
          admin_notes: `Auto-verified via Webhook (Amount: ${amount || payReq.amount})`,
        })
        .eq('id', orderId);

      // Atomically approve and activate subscription
      const { data: rpcRes, error: rpcErr } = await supabaseAdmin.rpc(
        'approve_payment_request',
        {
          p_request_id: orderId,
          p_admin_notes: `Webhook Instant Activation (TrxID: ${trxID})`,
        },
      );

      if (rpcErr) {
        throw rpcErr;
      }

      return NextResponse.json({ success: true, data: rpcRes });
    } else {
      await supabaseAdmin
        .from('payment_requests')
        .update({
          status: 'Rejected',
          admin_notes: `Payment marked ${status} by gateway webhook`,
        })
        .eq('id', orderId);

      return NextResponse.json({ success: true, message: 'Payment rejected' });
    }
  } catch (err: any) {
    console.error('Error in /api/payment/webhook:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
