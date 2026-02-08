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
      .eq('status', 'Approved')
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
        }) => ({
          id: req.id,
          date: new Date(req.requested_at).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
          amount: req.amount,
          currency: req.currency || '৳',
          status: 'paid',
          planName: req.plan_name,
          downloadUrl: '#',
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

  // TODO: Implement actual payment method fetching if table exists
  // const { data, error } = await supabase.from('payment_methods').select('*').eq('user_id', user.id);
  return [];
};

export const deletePaymentMethod = async (id: string): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }
  // await supabase.from('payment_methods').delete().eq('id', _id);
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
  // Add payment method logic
  throw new Error('Not implemented');
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
      .select('plan:subscription_plans(*)')
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
