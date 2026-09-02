import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const POST = async (req: Request) => {
  const supabase = await createClient();
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await req.json().catch(() => ({}));
  const { code, newUserId, deviceId } = body;

  let targetUserId = user?.id;

  // If no active session, but newUserId is provided (e.g., during signup), use it
  if (!targetUserId && newUserId) {
    targetUserId = newUserId;
  }

  if (!targetUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!code) {
    return NextResponse.json(
      { error: 'Missing referral code' },
      { status: 400 },
    );
  }

  const cleanCode = code.trim().toUpperCase();
  const now = new Date();
  const cleanDeviceId = (
    deviceId ||
    req.headers.get('x-device-id') ||
    ''
  ).trim();

  const clientIp = (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    ''
  ).trim();

  // 1. Check if the redeeming user is referral-blocked
  const { data: redeemerProfile } = await supabaseAdmin
    .from('users')
    .select('subscription, subscription_expires_at, is_subscribed')
    .eq('id', targetUserId)
    .single();

  if (redeemerProfile?.subscription?.is_referral_blocked) {
    return NextResponse.json(
      { error: 'আপনার অ্যাকাউন্ট থেকে রেফারেল কোড ব্যবহারের সুবিধা স্থগিত রয়েছে।' },
      { status: 403 },
    );
  }

  // 2. Check if user already claimed a referral in the last 30 days (1 month limit per account)
  const { data: recentClaims } = await supabaseAdmin
    .from('referral_history')
    .select('redeemed_at')
    .eq('redeemed_by', targetUserId)
    .order('redeemed_at', { ascending: false })
    .limit(1);

  if (recentClaims && recentClaims.length > 0) {
    const lastRedeemedAt = new Date(recentClaims[0].redeemed_at);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (lastRedeemedAt > thirtyDaysAgo) {
      const daysPassed = Math.floor(
        (now.getTime() - lastRedeemedAt.getTime()) / (24 * 60 * 60 * 1000),
      );
      const daysRemaining = Math.max(1, 30 - daysPassed);
      return NextResponse.json(
        {
          error: `তুমি গত ৩০ দিনে একটি রেফারেল কোড ব্যবহার করেছো। আগামী ${daysRemaining} দিন পর আবার কোড ব্যবহার করতে পারবে।`,
        },
        { status: 400 },
      );
    }
  }

  // 3. DEVICE LOCK: Check if this device has claimed in the last 30 days (1 claim per device per 30 days)
  if (cleanDeviceId) {
    const { data: deviceClaims } = await supabaseAdmin
      .from('referral_history')
      .select('redeemed_at, redeemed_by')
      .eq('device_id', cleanDeviceId)
      .order('redeemed_at', { ascending: false })
      .limit(1);

    if (deviceClaims && deviceClaims.length > 0) {
      const lastDeviceRedeemedAt = new Date(deviceClaims[0].redeemed_at);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      if (lastDeviceRedeemedAt > thirtyDaysAgo) {
        const daysPassed = Math.floor(
          (now.getTime() - lastDeviceRedeemedAt.getTime()) / (24 * 60 * 60 * 1000),
        );
        const daysRemaining = Math.max(1, 30 - daysPassed);
        return NextResponse.json(
          {
            error: `এই ডিভাইসে ইতিমধ্যে একটি রেফারেল কোড ব্যবহার করা হয়েছে। প্রতিটি ডিভাইসে প্রতি ৩০ দিনে কেবল ১টি রেফারেল কোড ক্লেইম করা যাবে। আর ${daysRemaining} দিন পর এই ডিভাইস থেকে পুনরায় ক্লেইম করা যাবে।`,
          },
          { status: 400 },
        );
      }
    }
  }

  // 4. IP RATE LIMIT: Check if 5+ claims from this IP in the last 24 hours
  if (clientIp && clientIp !== '127.0.0.1' && clientIp !== '::1') {
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { count: ipClaimsCount } = await supabaseAdmin
      .from('referral_history')
      .select('id', { count: 'exact', head: true })
      .eq('ip_address', clientIp)
      .gt('redeemed_at', twentyFourHoursAgo.toISOString());

    if (ipClaimsCount && ipClaimsCount >= 5) {
      return NextResponse.json(
        {
          error:
            'এই আইপি (IP) নেটওয়ার্ক থেকে গত ২৪ ঘণ্টায় সর্বোচ্চ সীমার (৫টি) বেশি রেফারেল ক্লেইম করা হয়েছে। অনুগ্রহ করে আগামীকাল চেষ্টা করুন।',
        },
        { status: 429 },
      );
    }
  }

  // 5. Check if the referral code exists and is valid
  const { data: refRecord } = await supabaseAdmin
    .from('referrals')
    .select('id, expires_at, owner_id, code')
    .eq('code', cleanCode)
    .maybeSingle();

  if (!refRecord) {
    // Record failed attempt for rate limiting
    const { data: redeemRes } = await supabaseAdmin.rpc(
      'redeem_referral_by_code',
      {
        p_code: cleanCode,
        p_user_id: targetUserId,
        p_device_id: cleanDeviceId || null,
        p_ip_address: clientIp || null,
      },
    );

    return NextResponse.json(
      {
        error: redeemRes?.error || 'ভুল রেফারেল কোড!',
        remaining_attempts: redeemRes?.remaining_attempts ?? 2,
        locked: redeemRes?.locked ?? false,
        lock_seconds: redeemRes?.lock_seconds ?? 0,
      },
      { status: 400 },
    );
  }

  if (refRecord.owner_id === targetUserId) {
    return NextResponse.json(
      { error: 'তুমি নিজের রেফারেল কোড ব্যবহার করতে পারবে না!' },
      { status: 400 },
    );
  }

  if (refRecord.expires_at && new Date(refRecord.expires_at) < now) {
    return NextResponse.json(
      { error: 'এই রেফারেল কোডটি বর্তমানে অ্যাডমিন কর্তৃক নিষ্ক্রিয় বা স্থগিত রয়েছে।' },
      { status: 400 },
    );
  }

  // 6. Use atomic stored procedure with anti-brute-force rate limiting and Device/IP Lock
  const { data: redeemRes, error: txnError } = await supabaseAdmin.rpc(
    'redeem_referral_by_code',
    {
      p_code: cleanCode,
      p_user_id: targetUserId,
      p_device_id: cleanDeviceId || null,
      p_ip_address: clientIp || null,
    },
  );

  if (txnError) {
    return NextResponse.json(
      { error: txnError.message || 'রেফারেল ক্লেইম ব্যর্থ হয়েছে।' },
      { status: 400 },
    );
  }

  if (redeemRes && typeof redeemRes === 'object' && redeemRes.success === false) {
    return NextResponse.json(
      {
        error: redeemRes.error || 'ভুল রেফারেল কোড!',
        remaining_attempts: redeemRes.remaining_attempts,
        locked: redeemRes.locked,
        lock_seconds: redeemRes.lock_seconds,
      },
      { status: 400 },
    );
  }

  const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
  const MAX_STACK_MS = 365 * 24 * 60 * 60 * 1000;
  const maxAllowedExpiry = new Date(now.getTime() + MAX_STACK_MS);

  // 7. ACTIVATE 15 DAYS PRO SUBSCRIPTION FOR REDEEMER IMMEDIATELY (Capped at 365 days max stacking from now)
  let redeemerBase = now;
  const currentRedeemerExp = redeemerProfile?.subscription_expires_at
    ? new Date(redeemerProfile.subscription_expires_at)
    : (redeemerProfile?.subscription?.expiry ? new Date(redeemerProfile.subscription.expiry) : null);

  if (currentRedeemerExp && currentRedeemerExp > now) {
    redeemerBase = currentRedeemerExp;
  }
  let redeemerExpiry = new Date(redeemerBase.getTime() + FIFTEEN_DAYS_MS);
  if (redeemerExpiry > maxAllowedExpiry) {
    redeemerExpiry = maxAllowedExpiry;
  }

  try {
    // Update redeemer's user profile with active Pro subscription (15 days)
    await supabaseAdmin
      .from('users')
      .update({
        is_subscribed: true,
        subscription_status: 'active',
        subscription_expires_at: redeemerExpiry.toISOString(),
        subscription: {
          plan: 'Pro',
          status: 'Active',
          expiry: redeemerExpiry.toISOString(),
          source: 'referral_bonus',
          referral_code: cleanCode,
        },
      })
      .eq('id', targetUserId);

    // Insert active record into subscription_history for redeemer
    await supabaseAdmin
      .from('subscription_history')
      .insert({
        user_id: targetUserId,
        plan_name: 'প্রো সাবস্ক্রিপশন (১৫ দিন রেফারেল রিওয়ার্ড)',
        duration_days: 15,
        amount: 0,
        payment_method: 'referral_bonus',
        is_active: true,
        started_at: now.toISOString(),
        expires_at: redeemerExpiry.toISOString(),
        status: 'completed',
      });

    // 8. Check Anomaly / Velocity Threshold (10+ referrals within 1 hour)
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const { count: hourlyClaimsCount } = await supabaseAdmin
      .from('referral_history')
      .select('id', { count: 'exact', head: true })
      .eq('referral_id', refRecord.id)
      .gt('redeemed_at', oneHourAgo.toISOString());

    const isAnomaly = (hourlyClaimsCount || 0) >= 10;

    // Record referral redemption history
    // Status is 'Pending Exam' until the new user takes their 1st exam, or 'Pending Review' if anomaly
    await supabaseAdmin
      .from('referral_history')
      .update({
        admin_status: isAnomaly ? 'Pending Review' : 'Pending Exam',
        reward_given: false,
        device_id: cleanDeviceId || null,
        ip_address: clientIp || null,
      })
      .eq('referral_id', refRecord.id)
      .eq('redeemed_by', targetUserId);

    if (isAnomaly) {
      // Send Fraud Alert notification to Admins
      try {
        const { data: admins } = await supabaseAdmin
          .from('users')
          .select('id')
          .or('role.eq.Admin,role.eq.SuperAdmin,role.eq.admin');

        if (admins && admins.length > 0) {
          const adminNotifs = admins.map((admin) => ({
            user_id: admin.id,
            title: '🚨 অস্বাভাবিক রেফারেল স্পাইক (অ্যানোমালি অ্যালার্ট)',
            message: `রেফারার (কোড: ${cleanCode}) গত ১ ঘণ্টায় ${(hourlyClaimsCount || 0) + 1}টি রেফারেল পেয়েছেন। অতিরিক্ত রিওয়ার্ড স্বয়ংক্রিয়ভাবে স্থগিত রেখে 'Pending Review' স্ট্যাটাসে পাঠানো হয়েছে।`,
            type: 'fraud_alert',
            is_read: false,
          }));
          await supabaseAdmin.from('notifications').insert(adminNotifs);
        }

        // Notify the owner that their account bonus is in Pending Review
        await supabaseAdmin.from('notifications').insert({
          user_id: refRecord.owner_id,
          title: 'রেফারেল পর্যালোচনাধীন ⏳',
          message: 'স্বাভাবিকের চেয়ে দ্রুত রেফারেল কার্যক্রম পরিলক্ষিত হওয়ায় নিরাপত্তা স্বার্থে আপনার সর্বশেষ রেফারেল বোনাসটি অ্যাডমিন পর্যালোচনার জন্য রাখা হয়েছে।',
          type: 'system',
          is_read: false,
        });
      } catch (alertErr) {
        console.error('Error sending anomaly alerts:', alertErr);
      }
    } else {
      // Notify Code Owner that a new friend joined (reward unlocked after 1st exam)
      try {
        await supabaseAdmin.from('notifications').insert({
          user_id: refRecord.owner_id,
          title: 'নতুন বন্ধু যুক্ত হয়েছে! 🎯',
          message: 'তোমার রেফারেল কোড ব্যবহার করে একজন বন্ধু যুক্ত হয়েছে! বন্ধু অন্তত ১টি মডেল টেস্ট বা পরীক্ষা সম্পন্ন করলেই তোমার অ্যাকাউন্টে ৭ দিন প্রো মেম্বারশিপ যোগ হবে।',
          type: 'referral',
          is_read: false,
        });
      } catch (_) {}
    }
  } catch (err) {
    console.error('Error activating subscription for redeemer:', err);
  }

  // 9. SEND SYSTEM NOTIFICATION TO REDEEMER
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: targetUserId,
      title: '১৫ দিনের ফ্রি প্রো সাবস্ক্রিপশন অ্যাক্টিভ! 🎉',
      message: 'অভিনন্দন! রেফারেল কোড সফলভাবে যুক্ত হয়েছে। আপনার অ্যাকাউন্টে ১৫ দিনের সম্পূর্ণ প্রো সাবস্ক্রিপশন চালু হয়েছে।',
      type: 'system',
      is_read: false,
    });
  } catch (_) {}

  return NextResponse.json({
    success: true,
    message: 'রেফারেল কোড সফলভাবে যুক্ত হয়েছে! ১৫ দিনের ফ্রি প্রো সাবস্ক্রিপশন চালু হয়েছে। 🎉',
    expires_at: redeemerExpiry.toISOString(),
    days_granted: 15,
    owner_reward_pending: true,
    plan: 'Pro',
  });
};
