import {
  SubscriptionPlan,
  Invoice,
  PaymentMethod,
  PaymentSubmission,
} from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';
import { createNotification } from './notification-service';

interface DbSubscriptionPlan {
  id: string;
  display_name: string;
  price: number;
  currency?: string;
  duration_days: number;
  features?: string[];
  color_theme?: string;
  is_popular?: boolean;
  is_active: boolean;
}

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
    throw error;
  }

  if (data) {
    // Map DB plans to Frontend SubscriptionPlan type
    const dbPlans = data.map((plan: DbSubscriptionPlan) => ({
      id: plan.id,
      name: plan.display_name,
      price: plan.price,
      currency: plan.currency || '৳',
      billingCycle:
        plan.duration_days >= 365
          ? 'Yearly'
          : plan.duration_days >= 90
            ? 'Quarterly'
            : plan.duration_days >= 30
              ? 'Monthly'
              : `${plan.duration_days} Days`,
      features: plan.features || [],
      colorTheme:
        plan.color_theme ||
        (plan.display_name.toLowerCase().includes('year')
          ? 'emerald'
          : plan.price > 0
            ? 'indigo'
            : 'slate'),
      isPopular:
        plan.is_popular ?? plan.display_name.toLowerCase().includes('offer'),
    }));

    return dbPlans;
  }

  return [];
};

export const getUserInvoices = async (): Promise<Invoice[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (user) {
    const { data, error } = await supabase
      .from('payment_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['Pending', 'Approved', 'Rejected']) // Fetch all relevant statuses
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
      throw error;
    }

    if (data) {
      return data.map(
        (req: {
          id: string;
          requested_at: string;
          amount: number;
          currency?: string;
          plan_name: string;
          status: string;
          transaction_id?: string;
          payment_method?: string;
        }) => ({
          id: req.id,
          date: new Date(req.requested_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          amount: req.amount,
          currency: req.currency || '৳',
          // Map DB status to Frontend Invoice status
          status:
            req.status === 'Approved'
              ? 'valid'
              : req.status === 'Pending'
                ? 'checking'
                : 'rejected',
          planName: req.plan_name,
          downloadUrl: '#',
          transactionId: req.transaction_id || 'N/A',
          paymentMethod: req.payment_method || 'N/A',
        }),
      );
    }
  }

  return [];
};

export const getUserPaymentMethods = async (): Promise<PaymentMethod[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return [];

  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }

  return data.map(
    (method: {
      id: string;
      type: string;
      last4: string;
      number: string;
      expiry: string;
      is_default: boolean;
    }) => ({
      id: method.id,
      type: method.type as PaymentMethod['type'],
      last4: method.last4,
      number: method.number,
      expiry: method.expiry,
      isDefault: method.is_default,
    }),
  );
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting payment method:', error);
    throw error;
  }
};

export const subscribeToPlan = async (planId: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }
  // Create checkout session logic
  return true;
};

export const addPaymentMethod = async (
  method: Omit<PaymentMethod, 'id'>,
): Promise<PaymentMethod> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('payment_methods')
    .insert({
      user_id: user.id,
      type: method.type,
      number: method.number,
      last4: method.last4,
      expiry: method.expiry,
      is_default: method.isDefault,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }

  return {
    id: data.id,
    type: data.type as PaymentMethod['type'],
    last4: data.last4,
    number: data.number,
    expiry: data.expiry,
    isDefault: data.is_default,
  };
};

export const getUserActiveSubscription =
  async (): Promise<SubscriptionPlan | null> => {
    if (!isSupabaseConfigured() || !supabase) {
      throw new Error('Database configuration missing');
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return null;

    try {
      const now = new Date();

      // 1. Try subscription_history first
      const { data: hist } = await supabase
        .from('subscription_history')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gt('expires_at', now.toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (hist) {
        const plan = hist.subscription_plans as any;
        const expiry = hist.expires_at;
        return {
          id: plan?.id || 'history_active_sub',
          name: plan?.display_name || 'প্রো সাবস্ক্রিপশন (রিওয়ার্ড)',
          price: plan?.price || 0,
          currency: plan?.currency || '৳',
          billingCycle: 'Active Plan',
          features: plan?.features || [
            'সকল প্রিমিয়াম প্রশ্নের সমাধান',
            'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
            'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
          ],
          colorTheme: 'emerald',
          isPopular: true,
          expiresAt: expiry || undefined,
        };
      }

      // 2. Check 'users' table fallback
      const { data: userProfile } = await supabase
        .from('users')
        .select(
          'subscription, subscription_status, subscription_expires_at, is_subscribed',
        )
        .eq('id', user.id)
        .maybeSingle();

      if (userProfile) {
        const sub = userProfile.subscription as any;
        const status = sub?.status || userProfile.subscription_status;
        const expiry =
          sub?.expiry ||
          sub?.expires_at ||
          userProfile.subscription_expires_at;
        const isSub =
          userProfile.is_subscribed ||
          (status && String(status).toLowerCase() === 'active');

        if (isSub && sub?.plan && sub.plan !== 'Free') {
          const expDate = expiry ? new Date(expiry) : null;
          if (!expDate || expDate > now) {
            return {
              id: 'user_active_plan',
              name: sub?.plan || 'প্রো সাবস্ক্রিপশন',
              price: 0,
              currency: '৳',
              billingCycle: 'Active Plan',
              features: [
                'সকল প্রিমিয়াম প্রশ্নের সমাধান',
                'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
                'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
              ],
              colorTheme: 'emerald',
              isPopular: true,
              expiresAt: expiry || undefined,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Subscription check failed:', e);
    }

    return null;
  };

export const submitManualPayment = async (
  data: PaymentSubmission,
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  const { error } = await supabase.from('payment_requests').insert({
    user_id: data.userId,
    plan_name: data.planName,
    amount: data.amount,
    currency: 'BDT',
    payment_method: `${data.paymentMethod} (${data.senderNumber})`,
    transaction_id: data.transactionId,
    status: 'Pending',
    requested_at: data.submittedAt || new Date().toISOString(),
  });

  if (error) {
    console.error('Payment Submission Error:', error);
    throw error;
  }

  // Notify Admin
  // TODO: Replace with actual Admin ID fetching logic
  const ADMIN_ID = 'me'; // For testing purposes, notifying self
  await createNotification(
    ADMIN_ID,
    'New Payment Submitted',
    `User ${data.userId} submitted a payment of ${data.amount} BDT via ${data.paymentMethod}`,
    'info',
    {
      actionUrl: '/admin/subscriptions',
      priority: 'high',
    },
  );

  return true;
};

export const getPaymentSubmissions = async (): Promise<PaymentSubmission[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  const { data, error } = await supabase
    .from('payment_submissions')
    .select('*')
    .order('submittedAt', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const updatePaymentStatus = async (
  id: string,
  status: 'approved' | 'rejected',
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  const { error } = await supabase
    .from('payment_submissions')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const extendSubscription = async (
  userId: string,
  days: number,
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  try {
    const now = new Date();

    // 1. Get latest active subscription from subscription_history
    const { data: sub } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', now.toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 2. Fetch User Profile subscription info
    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription, subscription_expires_at')
      .eq('id', userId)
      .maybeSingle();

    const currentSub = userProfile?.subscription || {};
    let baseDate = now;

    if (sub && sub.expires_at) {
      const exp = new Date(sub.expires_at);
      if (exp > now) baseDate = exp;
    } else if (currentSub.expiry || userProfile?.subscription_expires_at) {
      const exp = new Date(currentSub.expiry || userProfile?.subscription_expires_at);
      if (exp > now) baseDate = exp;
    }

    const newExpiry = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);

    // 3. Update 'users' table
    await supabase
      .from('users')
      .update({
        subscription: {
          ...currentSub,
          plan:
            currentSub.plan && currentSub.plan !== 'Free'
              ? currentSub.plan
              : 'Premium (Reward)',
          expiry: newExpiry.toISOString(),
          expires_at: newExpiry.toISOString(),
          status: 'Active',
        },
        subscription_status: 'Active',
        subscription_expires_at: newExpiry.toISOString(),
        is_subscribed: true,
        updated_at: now.toISOString(),
      })
      .eq('id', userId);

    // 4. Update 'subscription_history' table
    if (sub) {
      await supabase
        .from('subscription_history')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('id', sub.id);
    } else {
      // Find popular or default plan
      const { data: planData } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      // Deactivate older inactive records
      await supabase
        .from('subscription_history')
        .update({ is_active: false })
        .eq('user_id', userId);

      await supabase.from('subscription_history').insert({
        user_id: userId,
        plan_id: planData?.id || null,
        started_at: now.toISOString(),
        expires_at: newExpiry.toISOString(),
        is_active: true,
      });
    }

    // 5. Notify User
    await supabase.from('notifications').insert({
      user_id: userId,
      title: 'রিপোর্ট গৃহীত ও প্রো রিওয়ার্ড! 🎁',
      message: `আপনার রিপোর্টের জন্য ধন্যবাদ। পুরস্কার হিসেবে তোমার অ্যাকাউন্টে ${days} দিনের প্রো সাবস্ক্রিপশন চালু করা হয়েছে!`,
      type: 'reward',
      is_read: false,
      created_at: now.toISOString(),
    });

    return true;
  } catch (err) {
    console.error('Failed to extend subscription:', err);
    return false;
  }
};
