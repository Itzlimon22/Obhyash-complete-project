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

  // 1. Role-based Admin bypass
  const role = (user.role || '').toString().toLowerCase().trim();
  if (
    role === 'admin' ||
    role === 'super admin' ||
    role === 'superadmin' ||
    role === 'moderator'
  ) {
    return true;
  }

  // 2. Extract expiration timestamp
  const uAny = user as any;
  const rawSub = (user.subscription && typeof user.subscription === 'object'
    ? user.subscription
    : {}) as Record<string, any>;

  const rawExp =
    uAny.subscription_expires_at ||
    rawSub.expiry ||
    rawSub.expires_at ||
    uAny.subscription_end_date;

  if (!rawExp) {
    return false;
  }

  const expDate = new Date(rawExp);
  if (isNaN(expDate.getTime())) {
    return false;
  }

  const now = new Date();
  // If expired in the past, they are NOT Pro
  if (expDate <= now) {
    return false;
  }

  // 3. Check status
  const rawStatus = (rawSub.status || user.subscription_status || '')
    .toString()
    .toLowerCase()
    .trim();

  const isSubscribed = Boolean(
    user.is_subscribed === true ||
    (user as any).is_pro === true ||
    rawStatus === 'active',
  );

  if (!isSubscribed) {
    return false;
  }

  // 4. Check plan
  const rawPlan = (rawSub.plan || user.plan || '').toString().toLowerCase().trim();
  if (rawPlan === 'free' || rawPlan === 'inactive') {
    return false;
  }

  return true;
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
  const rawSub = (user.subscription && typeof user.subscription === 'object'
    ? user.subscription
    : {}) as Record<string, any>;

  const rawExp =
    uAny.subscription_expires_at ||
    rawSub.expiry ||
    rawSub.expires_at ||
    uAny.subscription_end_date;

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

  const rawPlan = (rawSub.plan || user.plan || '').toString().trim();
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
