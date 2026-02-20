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
    data: { user },
  } = await supabase.auth.getUser();

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
    data: { user },
  } = await supabase.auth.getUser();

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

  return data.map((method: any) => ({
    id: method.id,
    type: method.type,
    last4: method.last4,
    number: method.number,
    expiry: method.expiry,
    isDefault: method.is_default,
  }));
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
    data: { user },
  } = await supabase.auth.getUser();

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
    type: data.type,
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
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('subscription_history')
      .select('*, plan:subscription_plans(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch active subscription:', error);
      throw error;
    }

    if (data && data.plan) {
      const plan = (
        Array.isArray(data.plan) ? data.plan[0] : data.plan
      ) as DbSubscriptionPlan;
      return {
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
        colorTheme: plan.display_name.toLowerCase().includes('year')
          ? 'emerald'
          : plan.price > 0
            ? 'indigo'
            : 'slate',
        isPopular: plan.display_name.toLowerCase().includes('offer'),
        expiresAt: data.expires_at, // Include expiry date from subscription_history
      };
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

// Actual implementation for extending subscription
export const extendSubscription = async (
  userId: string,
  days: number,
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  try {
    // 1. Get latest active subscription
    const { data: sub, error } = await supabase
      .from('subscription_history')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error finding subscription to extend:', error);
      return false;
    }

    if (!sub) {
      console.log('No active subscription found to extend for user:', userId);
      // Optional: Could grant a new 1-day subscription here if desired logic
      return false;
    }

    // 2. Calculate new date
    const currentExpiry = new Date(sub.expires_at);
    const newExpiry = new Date(
      currentExpiry.getTime() + days * 24 * 60 * 60 * 1000,
    );

    // 3. Update DB
    const { error: updateError } = await supabase
      .from('subscription_history')
      .update({ expires_at: newExpiry.toISOString() })
      .eq('id', sub.id);

    if (updateError) throw updateError;

    // 4. Notify User
    await createNotification(
      userId,
      'বোনাস সাবস্ক্রিপশন!',
      `আপনার রিপোর্টের জন্য ধন্যবাদ। পুরস্কার হিসেবে আপনার সাবস্ক্রিপশনের মেয়াদ ${days} দিন বাড়ানো হয়েছে!`,
      'success',
      {
        actionUrl: '/subscription',
        priority: 'high',
      },
    );

    return true;
  } catch (err) {
    console.error('Failed to extend subscription:', err);
    return false;
  }
};
