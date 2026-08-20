import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.UDDOKTAPAY_API_KEY!;
const baseUrl = process.env.UDDOKTAPAY_BASE_URL || 'https://obhyash.paymently.io/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const invoiceId = body.invoice_id || body.invoiceId || body.id;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoice_id' }, { status: 400 });
    }

    // 1. Verify with UddoktaPay Verify Endpoint
    const verifyRes = await fetch(`${baseUrl}/verify-payment`, {
      method: 'POST',
      headers: {
        'RT-UDDOKTAPAY-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || verifyData.status !== 'COMPLETED') {
      console.warn('[UddoktaPay Webhook] Payment not verified or not completed:', verifyData);
      return NextResponse.json({ status: 'Ignored, not completed' }, { status: 200 });
    }

    const {
      amount,
      payment_method,
      transaction_id,
      metadata = {},
    } = verifyData;

    const userId = metadata.user_id;
    const planId = metadata.plan_id || 'pro_monthly';

    if (!userId) {
      console.error('[UddoktaPay Webhook] Missing user_id in metadata');
      return NextResponse.json({ error: 'Missing user_id in metadata' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Calculate Expiration Date
    const now = new Date();
    let expiresAt = new Date(now);

    if (planId.includes('year') || planId.includes('12')) {
      expiresAt.setDate(expiresAt.getDate() + 365);
    } else if (planId.includes('6month') || planId.includes('half')) {
      expiresAt.setDate(expiresAt.getDate() + 180);
    } else if (planId.includes('life')) {
      expiresAt.setFullYear(expiresAt.getFullYear() + 50);
    } else {
      // Default monthly
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    // 3. Update User Subscription in Database
    await supabaseAdmin
      .from('users')
      .update({
        is_pro: true,
        subscription_tier: planId,
        subscription_expires_at: expiresAt.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    // 4. Log Payment Transaction
    try {
      await supabaseAdmin.from('payment_transactions').insert({
        user_id: userId,
        gateway: 'uddoktapay',
        transaction_id: transaction_id || invoiceId,
        invoice_id: invoiceId,
        amount: Number(amount) || 0,
        currency: 'BDT',
        payment_method: payment_method || 'bKash/Nagad',
        status: 'COMPLETED',
        metadata,
        created_at: now.toISOString(),
      });
    } catch (_) {
      // Table might have slight variation, fallback smoothly
    }

    // 5. Send In-App Notification to Student
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: userId,
        title: '🎉 অভিনন্দন! তোমার প্রো সাবস্ক্রিপশন অ্যাক্টিভ হয়েছে',
        message: 'সকল প্রিমিয়াম ফিচার, আনলিমিটেড মডেল টেস্ট ও স্পেশাল কোশ্চেন ব্যাংক আনলক করা হয়েছে।',
        body: 'সকল প্রিমিয়াম ফিচার, আনলিমিটেড মডেল টেস্ট ও স্পেশাল কোশ্চেন ব্যাংক আনলক করা হয়েছে।',
        link: '/profile/my-subscription',
        data: { route: '/profile/my-subscription' },
        type: 'success',
        priority: 'high',
        is_read: false,
        created_at: now.toISOString(),
      });
    } catch (e) {
      console.error('[UddoktaPay Webhook] Notification error:', e);
    }

    return NextResponse.json({ success: true, message: 'Subscription activated' });
  } catch (error: any) {
    console.error('Error in UddoktaPay Webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
