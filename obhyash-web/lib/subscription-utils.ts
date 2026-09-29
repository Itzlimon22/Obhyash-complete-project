import { UserProfile, User } from '@/lib/types';

/**
 * Normalizes and checks whether a user has active PRO/Premium access.
 * 
 * Rules:
 * 1. Admin / Super Admin / Moderator roles ALWAYS have Pro privileges.
 * 2. Regular students MUST satisfy ALL of the following:
 *    a) Has an active subscription status (is_subscribed=true OR subscription_status='active' OR subscription.status='Active')
 *    b) Has a non-Free plan
 *    c) Has a valid future expiry date (subscription_expires_at OR subscription.expiry > NOW)
 * 
 * If the subscription date is in the past, or status is Expired/Inactive, or no expiry exists,
 * the user is strictly treated as Free (isPro = false).
 */
export function isUserPro(
  user: UserProfile | User | Record<string, any> | null | undefined,
): boolean {
  if (!user) return false;

  const uAny = user as any;
  const meta = (uAny.user_metadata || {}) as Record<string, any>;

  // 1. Role-based bypass for Admins, Moderators, Teachers
  const role = (user.role || meta.role || '').toString().toLowerCase().trim();
  if (
    role === 'admin' ||
    role === 'super admin' ||
    role === 'superadmin' ||
    role === 'moderator' ||
    role === 'teacher'
  ) {
    return true;
  }

  // 2. Safely parse subscription object if it is a JSON string or object
  let rawSub: Record<string, any> = {};
  if (user.subscription && typeof user.subscription === 'object') {
    rawSub = user.subscription;
  } else if (typeof user.subscription === 'string' && user.subscription.trim().startsWith('{')) {
    try {
      rawSub = JSON.parse(user.subscription);
    } catch (_) {}
  } else if (meta.subscription && typeof meta.subscription === 'object') {
    rawSub = meta.subscription;
  }

  // 3. Status check: explicit cancellation / expired status overrides Pro
  const rawStatus = (rawSub.status || user.subscription_status || meta.subscription_status || '')
    .toString()
    .toLowerCase()
    .trim();

  if (rawStatus === 'expired' || rawStatus === 'cancelled' || rawStatus === 'canceled') {
    return false;
  }

  // 4. Extract expiration timestamp
  const rawExp =
    uAny.subscription_expires_at ||
    rawSub.expiry ||
    rawSub.expires_at ||
    uAny.expires_at ||
    uAny.subscription_end_date ||
    meta.subscription_expires_at ||
    meta.expires_at;

  const expDate = rawExp ? new Date(rawExp) : null;
  const isExpValid = expDate !== null && !isNaN(expDate.getTime());
  const now = new Date();

  // If an expiration date is set and has passed, user is strictly NOT Pro
  if (isExpValid && expDate <= now) {
    return false;
  }

  // 5. Plan check
  const rawPlan = (
    rawSub.plan ||
    rawSub.plan_name ||
    user.plan ||
    uAny.subscription_tier ||
    meta.plan ||
    ''
  )
    .toString()
    .toLowerCase()
    .trim();

  const isExplicitlyFree =
    rawPlan === 'free' ||
    rawPlan === 'inactive' ||
    rawPlan === 'rookie' ||
    rawPlan === 'basic' ||
    rawPlan === 'explorer';

  const isPlanPro =
    rawPlan.includes('pro') ||
    rawPlan.includes('premium') ||
    rawPlan.includes('ranker') ||
    rawPlan.includes('booster') ||
    rawPlan.includes('master') ||
    String(uAny.level || '').toLowerCase().trim() === 'pro';

  const hasSubFlag = Boolean(
    user.is_subscribed === true ||
    uAny.is_pro === true ||
    meta.is_pro === true ||
    rawStatus === 'active'
  );

  // If user has active subscription flag or a recognized Pro plan
  if (hasSubFlag || isPlanPro) {
    // If explicitly marked free without valid future expiry and not explicitly is_subscribed
    if (isExplicitlyFree && (!isExpValid || expDate <= now) && user.is_subscribed !== true && uAny.is_pro !== true) {
      return false;
    }
    return true;
  }

  // If user has a valid future expiration date and plan is not explicitly free
  if (isExpValid && expDate > now && !isExplicitlyFree) {
    return true;
  }

  return false;
}

export interface UserSubscriptionDetails {
  isPro: boolean;
  planName: string;
  status: 'Active' | 'Expired' | 'Free';
  expiresAt: string | null;
  daysLeft: number;
}

/**
 * Gets normalized and validated subscription details for a user.
 */
export function getUserSubscriptionDetails(
  user: UserProfile | User | Record<string, any> | null | undefined,
): UserSubscriptionDetails {
  if (!user) {
    return {
      isPro: false,
      planName: 'Free Plan',
      status: 'Free',
      expiresAt: null,
      daysLeft: 0,
    };
  }

  const isPro = isUserPro(user);
  const uAny = user as any;
  const meta = (uAny.user_metadata || {}) as Record<string, any>;

  let rawSub: Record<string, any> = {};
  if (user.subscription && typeof user.subscription === 'object') {
    rawSub = user.subscription;
  } else if (typeof user.subscription === 'string' && user.subscription.trim().startsWith('{')) {
    try {
      rawSub = JSON.parse(user.subscription);
    } catch (_) {}
  } else if (meta.subscription && typeof meta.subscription === 'object') {
    rawSub = meta.subscription;
  }

  const rawExp =
    uAny.subscription_expires_at ||
    rawSub.expiry ||
    rawSub.expires_at ||
    uAny.expires_at ||
    uAny.subscription_end_date ||
    meta.subscription_expires_at ||
    meta.expires_at;

  let expiresAt: string | null = null;
  let daysLeft = 0;

  if (rawExp) {
    const expDate = new Date(rawExp);
    if (!isNaN(expDate.getTime())) {
      expiresAt = expDate.toISOString();
      const diffMs = expDate.getTime() - Date.now();
      daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  const rawPlan = (rawSub.plan || rawSub.plan_name || user.plan || uAny.subscription_tier || meta.plan || '').toString().trim();
  const planName = isPro
    ? rawPlan && rawPlan.toLowerCase() !== 'free'
      ? rawPlan
      : 'Pro Subscription'
    : 'Free Plan';

  const status: 'Active' | 'Expired' | 'Free' = isPro
    ? 'Active'
    : expiresAt && new Date(expiresAt).getTime() <= Date.now()
      ? 'Expired'
      : 'Free';

  return {
    isPro,
    planName,
    status,
    expiresAt,
    daysLeft,
  };
}
