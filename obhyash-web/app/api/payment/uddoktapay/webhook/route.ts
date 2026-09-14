import { NextRequest, NextResponse } from 'next/server';
import {
  verifyUddoktaPayInvoice,
  activateSubscriptionFromUddoktaPay,
} from '@/lib/payment/uddoktapay-service';

const configuredApiKey = process.env.UDDOKTAPAY_API_KEY || '9KrVMoMyjgX5e5itMtDIz2yvngV8Pzfey3d1qm2p';

export async function POST(request: NextRequest) {
  try {
    const rawApiKeyHeader =
      request.headers.get('rt-uddoktapay-api-key') ||
      request.headers.get('RT-UDDOKTAPAY-API-KEY') ||
      request.headers.get('x-api-key');

    const body = await request.json();
    const invoiceId = body.invoice_id || body.invoiceId || body.id;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Missing invoice_id' },
        { status: 400 },
      );
    }

    // 1. Verify header authenticity if provided
    const isHeaderValid = rawApiKeyHeader && rawApiKeyHeader.trim() === configuredApiKey.trim();

    const rawStatus = (body.status || '').toString().trim().toUpperCase();
    let isCompleted = rawStatus === 'COMPLETED';
    let amount = Number(body.amount) || 0;
    let paymentMethod = body.payment_method || body.paymentMethod;
    let transactionId = body.transaction_id || body.transactionId;
    let metadata = (typeof body.metadata === 'object' && body.metadata !== null) ? body.metadata : {};

    // 2. If not authenticated via header or status not completed in body, verify with gateway API
    if (!isHeaderValid || !isCompleted) {
      const verification = await verifyUddoktaPayInvoice(invoiceId);

      if (!verification.success || !verification.isCompleted) {
        console.warn(
          '[UddoktaPay Webhook] Payment not completed or unverified:',
          verification.status,
          verification.error,
        );
        return NextResponse.json(
          { status: 'Ignored, not completed or unverified' },
          { status: 200 },
        );
      }

      isCompleted = true;
      amount = verification.amount || amount;
      paymentMethod = verification.paymentMethod || paymentMethod;
      transactionId = verification.transactionId || transactionId;
      metadata = verification.metadata || metadata;
    }

    // 3. Activate subscription idempotently
    const activation = await activateSubscriptionFromUddoktaPay({
      invoiceId,
      amount,
      paymentMethod,
      transactionId,
      metadata,
    });

    if (!activation.success) {
      console.error('[UddoktaPay Webhook] Activation failed:', activation.error);
      return NextResponse.json(
        { success: false, error: activation.error },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: activation.alreadyProcessed
        ? 'Subscription already active'
        : 'Subscription successfully activated',
      plan: activation.planName,
      expiresAt: activation.expiresAt,
    });
  } catch (error: any) {
    console.error('[UddoktaPay Webhook] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
