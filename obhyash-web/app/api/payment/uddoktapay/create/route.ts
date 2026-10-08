import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ACTIVE_COUPONS } from '@/lib/utils/coupon-system';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      userId,
      planId,
      planName,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      redirectUrl,
      cancelUrl,
    } = body;

    if (!userId || !amount || !planId) {
      return NextResponse.json(
        { success: false, error: 'Missing required payment parameters' },
        { status: 400, headers: corsHeaders },
      );
    }

    const apiKey = process.env.UDDOKTAPAY_API_KEY;
    const baseUrl = process.env.UDDOKTAPAY_BASE_URL || 'https://obhyash.paymently.io/api';

    if (!apiKey) {
      console.error('[UddoktaPay Create API] Missing UDDOKTAPAY_API_KEY on server');
      return NextResponse.json(
        { success: false, error: 'Payment gateway configuration missing on server' },
        { status: 500, headers: corsHeaders },
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
        { status: 503, headers: corsHeaders },
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

    // 1. Resolve Plan and Price Server-Side (Anti-Tampering)
    const { data: dbPlan } = await supabaseAdmin
      .from('subscription_plans')
      .select('id, price, duration_days, display_name, name')
      .or(`id.eq.${planId},name.eq.${planId}`)
      .maybeSingle();

    let officialPrice = 149;
    let resolvedPlanName = planName || 'মাসিক প্ল্যান (১ মাস)';
    let resolvedDurationDays = 30;

    const lowerPlanId = String(planId).toLowerCase();

    if (dbPlan && Number(dbPlan.price) > 0) {
      officialPrice = Number(dbPlan.price);
      resolvedPlanName = dbPlan.display_name || planName || 'Pro Plan';
      resolvedDurationDays = Number(dbPlan.duration_days) || 30;
    } else if (
      lowerPlanId.includes('year') ||
      lowerPlanId.includes('365') ||
      lowerPlanId.includes('annual')
    ) {
      officialPrice = 999;
      resolvedPlanName = 'বার্ষিক প্রো (১ বছর)';
      resolvedDurationDays = 365;
    } else if (
      lowerPlanId.includes('6m') ||
      lowerPlanId.includes('180') ||
      lowerPlanId.includes('master') ||
      lowerPlanId.includes('session')
    ) {
      officialPrice = 599;
      resolvedPlanName = 'ফুল সেশন প্যাক (৬ মাস)';
      resolvedDurationDays = 180;
    } else if (
      lowerPlanId.includes('3m') ||
      lowerPlanId.includes('90') ||
      lowerPlanId.includes('admission') ||
      lowerPlanId.includes('pro')
    ) {
      officialPrice = 349;
      resolvedPlanName = 'এডমিশন প্যাক (৩ মাস)';
      resolvedDurationDays = 90;
    } else {
      officialPrice = 149;
      resolvedPlanName = 'মাসিক প্ল্যান (১ মাস)';
      resolvedDurationDays = 30;
    }

    // 2. Validate Coupon Server-Side (if provided)
    let finalPayableAmount = officialPrice;
    const couponCode = (body.couponCode || body.coupon_code || '').toString().trim().toUpperCase();

    if (couponCode) {
      const { data: dbCoupon } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', couponCode)
        .eq('is_active', true)
        .maybeSingle();

      const now = new Date();
      if (dbCoupon && (!dbCoupon.expires_at || new Date(dbCoupon.expires_at) >= now)) {
        const fixedPrices = dbCoupon.fixed_prices || {};
        if (fixedPrices[officialPrice] !== undefined) {
          finalPayableAmount = Number(fixedPrices[officialPrice]);
        } else {
          const pct = Number(dbCoupon.discount_percentage) || 0;
          const discount = Math.round((officialPrice * pct) / 100);
          finalPayableAmount = Math.max(1, officialPrice - discount);
        }
      } else if (ACTIVE_COUPONS[couponCode]?.isActive) {
        const staticCoupon = ACTIVE_COUPONS[couponCode];
        if (staticCoupon.fixedPrices && staticCoupon.fixedPrices[officialPrice] !== undefined) {
          finalPayableAmount = staticCoupon.fixedPrices[officialPrice];
        } else {
          const discount = Math.round((officialPrice * staticCoupon.discountPercentage) / 100);
          finalPayableAmount = Math.max(1, officialPrice - discount);
        }
      }
    }

    const checkoutEndpoint = `${baseUrl}/checkout-v2`;
    const payload = {
      full_name: name || 'Obhyash Student',
      email: email || 'student@obhyash.com',
      amount: String(finalPayableAmount),
      metadata: {
        user_id: userId,
        userId: userId,
        plan_id: planId,
        planId: planId,
        plan_name: resolvedPlanName,
        duration_days: resolvedDurationDays,
        expected_amount: finalPayableAmount,
        official_price: officialPrice,
        coupon_code: couponCode || null,
      },
      redirect_url: redirectUrl || `${redirectBase}/payment/success`,
      cancel_url: cancelUrl || `${redirectBase}/payment/cancel`,
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
        { status: 500, headers: corsHeaders },
      );
    }

    return NextResponse.json(
      {
        success: true,
        paymentUrl: data.payment_url,
        data,
      },
      { headers: corsHeaders },
    );
  } catch (error: any) {
    console.error('Error creating UddoktaPay payment:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders },
    );
  }
}
