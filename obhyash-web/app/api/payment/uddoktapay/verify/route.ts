import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import {
  verifyUddoktaPayInvoice,
  activateSubscriptionFromUddoktaPay,
} from '@/lib/payment/uddoktapay-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const invoiceId = body.invoice_id || body.invoiceId || body.id;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'ইনভয়েস আইডি পাওয়া যায়নি (Missing invoice_id)' },
        { status: 400 },
      );
    }

    // Attempt to get user from authenticated session if available
    let sessionUserId = body.userId || body.user_id;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        sessionUserId = user.id;
      }
    } catch (_) {}

    // 1. Verify with UddoktaPay directly
    const verification = await verifyUddoktaPayInvoice(invoiceId);

    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          verified: false,
          status: verification.status,
          error: verification.error || 'পেমেন্ট গেটওয়ে থেকে কোনো তথ্য পাওয়া যায়নি',
        },
        { status: 400 },
      );
    }

    if (!verification.isCompleted) {
      return NextResponse.json(
        {
          success: true,
          verified: false,
          status: verification.status,
          message:
            verification.status === 'INITIATED' || verification.status === 'PENDING'
              ? 'পেমেন্টটি এখনো প্রক্রিয়াধীন রয়েছে'
              : `পেমেন্টের স্ট্যাটাস: ${verification.status}`,
        },
        { status: 200 },
      );
    }

    // 2. Activate subscription idempotently
    const activation = await activateSubscriptionFromUddoktaPay({
      invoiceId: verification.invoiceId,
      amount: verification.amount,
      paymentMethod: verification.paymentMethod,
      transactionId: verification.transactionId,
      metadata: verification.metadata,
      fallbackUserId: sessionUserId,
    });

    if (!activation.success) {
      return NextResponse.json(
        {
          success: false,
          verified: true,
          error: activation.error || 'সাবস্ক্রিপশন সক্রিয়করণে ত্রুটি হয়েছে',
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      is_subscribed: true,
      alreadyProcessed: activation.alreadyProcessed || false,
      planName: activation.planName,
      expiresAt: activation.expiresAt,
      invoiceId: activation.invoiceId,
      message: 'অভিনন্দন! আপনার সাবস্ক্রিপশন সফলভাবে সক্রিয় করা হয়েছে।',
    });
  } catch (error: any) {
    console.error('[UddoktaPay Verify API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Verification failed' },
      { status: 500 },
    );
  }
}
