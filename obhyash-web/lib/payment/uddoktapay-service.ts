import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.UDDOKTAPAY_API_KEY || '9KrVMoMyjgX5e5itMtDIz2yvngV8Pzfey3d1qm2p';
const baseUrl = process.env.UDDOKTAPAY_BASE_URL || 'https://obhyash.paymently.io/api';

export interface UddoktaPayVerificationResult {
  success: boolean;
  isCompleted: boolean;
  status: string;
  invoiceId: string;
  amount: number;
  paymentMethod?: string;
  transactionId?: string;
  metadata: Record<string, any>;
  data?: any;
  error?: string;
}

export interface ActivationResult {
  success: boolean;
  alreadyProcessed?: boolean;
  userId: string;
  planName: string;
  expiresAt: string;
  invoiceId: string;
  error?: string;
}

/**
 * Verifies an invoice directly with UddoktaPay's /verify-payment API
 */
export async function verifyUddoktaPayInvoice(
  invoiceId: string,
): Promise<UddoktaPayVerificationResult> {
  try {
    const trimmedId = invoiceId?.trim();
    if (!trimmedId) {
      return {
        success: false,
        isCompleted: false,
        status: 'INVALID',
        invoiceId: '',
        amount: 0,
        metadata: {},
        error: 'Invoice ID is empty',
      };
    }

    const res = await fetch(`${baseUrl}/verify-payment`, {
      method: 'POST',
      headers: {
        'RT-UDDOKTAPAY-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invoice_id: trimmedId }),
      cache: 'no-store',
    });

    const data = await res.json();

    if (!res.ok || !data || data.status === false) {
      return {
        success: false,
        isCompleted: false,
        status: data?.status === false ? 'INVALID' : (data?.status || 'ERROR'),
        invoiceId: trimmedId,
        amount: Number(data?.amount) || 0,
        metadata: data?.metadata || {},
        data,
        error: data?.message || 'UddoktaPay verification request failed',
      };
    }

    const rawStatus = (data.status || '').toString().trim().toUpperCase();
    const isCompleted = rawStatus === 'COMPLETED';

    return {
      success: true,
      isCompleted,
      status: rawStatus,
      invoiceId: data.invoice_id || trimmedId,
      amount: Number(data.amount) || 0,
      paymentMethod: data.payment_method || data.paymentMethod,
      transactionId: data.transaction_id || data.transactionId,
      metadata: (typeof data.metadata === 'object' && data.metadata !== null) ? data.metadata : {},
      data,
    };
  } catch (err: any) {
    console.error('[UddoktaPay] Verification error:', err);
    return {
      success: false,
      isCompleted: false,
      status: 'EXCEPTION',
      invoiceId,
      amount: 0,
      metadata: {},
      error: err.message || 'Network exception during verification',
    };
  }
}

/**
 * Activates user subscription given verified UddoktaPay payment details.
 * Completely idempotent: if the invoice has already been activated, it returns
 * the existing valid status without re-extending validity or creating duplicates.
 */
export async function activateSubscriptionFromUddoktaPay(params: {
  invoiceId: string;
  amount: number | string;
  paymentMethod?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
  fallbackUserId?: string;
}): Promise<ActivationResult> {
  const { invoiceId, amount, paymentMethod, transactionId, metadata = {}, fallbackUserId } = params;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables missing');
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // 1. Resolve User ID
  let userId =
    metadata.user_id ||
    metadata.userId ||
    metadata.id ||
    fallbackUserId;

  // Fallback: If user ID not found, look up by email
  if (!userId && (metadata.email || metadata.customerEmail)) {
    const email = (metadata.email || metadata.customerEmail).trim().toLowerCase();
    const { data: userByEmail } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (userByEmail?.id) {
      userId = userByEmail.id;
    }
  }

  if (!userId) {
    return {
      success: false,
      userId: '',
      planName: '',
      expiresAt: '',
      invoiceId,
      error: 'Cannot identify student: missing user_id in metadata',
    };
  }

  // 2. Idempotency Check: check if this invoice was already processed & approved
  const { data: existingReq } = await supabaseAdmin
    .from('payment_requests')
    .select('id, plan_name, status, created_at')
    .eq('user_id', userId)
    .or(`transaction_id.eq.${invoiceId},admin_notes.ilike.%${invoiceId}%`)
    .eq('status', 'Approved')
    .maybeSingle();

  const { data: userProfile } = await supabaseAdmin
    .from('users')
    .select('id, is_subscribed, subscription, subscription_expires_at')
    .eq('id', userId)
    .maybeSingle();

  const isAlreadyAssignedInUser =
    userProfile?.subscription?.invoice_id === invoiceId &&
    userProfile?.is_subscribed === true;

  if (existingReq || isAlreadyAssignedInUser) {
    const existingExpiry =
      userProfile?.subscription_expires_at ||
      userProfile?.subscription?.expiry ||
      userProfile?.subscription?.expires_at ||
      new Date().toISOString();

    const planName =
      userProfile?.subscription?.plan ||
      userProfile?.subscription?.plan_name ||
      existingReq?.plan_name ||
      'Pro Subscription';

    return {
      success: true,
      alreadyProcessed: true,
      userId,
      planName,
      expiresAt: existingExpiry,
      invoiceId,
    };
  }

  // 3. Determine Plan Duration and Display Name
  const rawPlanId = (metadata.plan_id || metadata.planId || '').toString().toLowerCase();
  const rawPlanName = (metadata.plan_name || metadata.planName || metadata.plan_title || '').toString();

  let durationDays = 30;
  let planDisplayName = 'মাসিক প্ল্যান (১ মাস)';

  if (
    rawPlanId.includes('year') ||
    rawPlanId.includes('365') ||
    rawPlanName.includes('বছর') ||
    rawPlanName.includes('Year')
  ) {
    durationDays = 365;
    planDisplayName = 'বার্ষিক প্রো (১ বছর)';
  } else if (
    rawPlanId.includes('6month') ||
    rawPlanId.includes('half') ||
    rawPlanId.includes('180') ||
    rawPlanName.includes('৬ মাস') ||
    rawPlanName.includes('মাস্টার') ||
    rawPlanName.includes('সেশন')
  ) {
    durationDays = 180;
    planDisplayName = 'ফুল সেশন প্যাক (৬ মাস)';
  } else if (
    rawPlanId.includes('quarter') ||
    rawPlanId.includes('90') ||
    rawPlanId.includes('3month') ||
    rawPlanName.includes('৩ মাস') ||
    rawPlanName.includes('এডমিশন') ||
    rawPlanName.includes('র‍্যাঙ্কার্স')
  ) {
    durationDays = 90;
    planDisplayName = 'এডমিশন প্যাক (৩ মাস)';
  } else if (rawPlanName.trim()) {
    planDisplayName = rawPlanName;
  }

  // 4. Calculate Expiry Date with Validity Stacking
  const now = new Date();
  let baseExpiry = now;
  const currentExp = userProfile?.subscription_expires_at
    ? new Date(userProfile.subscription_expires_at)
    : (userProfile?.subscription?.expiry ? new Date(userProfile.subscription.expiry) : null);

  if (currentExp && currentExp > now) {
    baseExpiry = currentExp;
  }

  const expiresAt = new Date(baseExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // 5. Update Users Table (Comprehensive status across all auth/profile fields)
  const { error: userUpdateError } = await supabaseAdmin
    .from('users')
    .update({
      is_subscribed: true,
      subscription_status: 'Active',
      subscription_expires_at: expiresAt.toISOString(),
      subscription: {
        plan: planDisplayName,
        plan_name: planDisplayName,
        expiry: expiresAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        status: 'Active',
        gateway: 'uddoktapay',
        invoice_id: invoiceId,
        amount: Number(amount) || 0,
      },
      updated_at: now.toISOString(),
    })
    .eq('id', userId);

  if (userUpdateError) {
    console.error('[UddoktaPay] Failed to update user profile:', userUpdateError);
    return {
      success: false,
      userId,
      planName: planDisplayName,
      expiresAt: expiresAt.toISOString(),
      invoiceId,
      error: `Failed to update user profile: ${userUpdateError.message}`,
    };
  }

  // 6. Record in payment_requests for Admin Dashboard tracking & history
  try {
    await supabaseAdmin.from('payment_requests').insert({
      user_id: userId,
      plan_name: planDisplayName,
      amount: Number(amount) || 0,
      currency: 'BDT',
      payment_method: paymentMethod ? `UddoktaPay (${paymentMethod})` : 'UddoktaPay',
      transaction_id: transactionId || invoiceId,
      status: 'Approved',
      admin_notes: `Automated UddoktaPay Payment (Invoice: ${invoiceId})`,
      requested_at: now.toISOString(),
      reviewed_at: now.toISOString(),
      reviewed_by: 'UddoktaPay Gateway',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    });
  } catch (reqErr) {
    console.warn('[UddoktaPay] Notice inserting payment_request:', reqErr);
  }

  // 7. Record in subscription_history
  try {
    await supabaseAdmin
      .from('subscription_history')
      .update({ is_active: false })
      .eq('user_id', userId);

    await supabaseAdmin.from('subscription_history').insert({
      user_id: userId,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true,
      created_at: now.toISOString(),
    });
  } catch (histErr) {
    console.warn('[UddoktaPay] Notice inserting subscription_history:', histErr);
  }

  // 8. Send In-App Notification (Must use valid check-constraint type 'system')
  try {
    const formattedExpiry = expiresAt.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title: '🎉 অভিনন্দন! তোমার প্রো সাবস্ক্রিপশন সক্রিয় হয়েছে',
      message: `আপনার ${planDisplayName} সফলভাবে সক্রিয় করা হয়েছে। মেয়াদ: ${formattedExpiry} পর্যন্ত।`,
      body: `আপনার ${planDisplayName} সফলভাবে সক্রিয় করা হয়েছে। মেয়াদ: ${formattedExpiry} পর্যন্ত।`,
      link: '/profile/my-subscription',
      data: { route: '/profile/my-subscription' },
      type: 'system',
      priority: 'high',
      is_read: false,
      created_at: now.toISOString(),
    });
  } catch (notifErr) {
    console.warn('[UddoktaPay] Notice inserting notification:', notifErr);
  }

  return {
    success: true,
    userId,
    planName: planDisplayName,
    expiresAt: expiresAt.toISOString(),
    invoiceId,
  };
}
