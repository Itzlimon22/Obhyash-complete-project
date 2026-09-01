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

  if (data && data.length > 0) {
    return data.map((plan: DbSubscriptionPlan) => {
      let displayName = plan.display_name;
      if (
        plan.duration_days >= 180 ||
        displayName.includes('৬ মাস') ||
        displayName.includes('মাস্টার') ||
        displayName.includes('master_pro') ||
        displayName.includes('full_session')
      ) {
        displayName = 'ফুল সেশন প্যাক (৬ মাস)';
      } else if (
        plan.duration_days >= 90 ||
        displayName.includes('৩ মাস') ||
        displayName.includes('র‍্যাঙ্কার্স') ||
        displayName.includes('pro') ||
        displayName.includes('admission')
      ) {
        displayName = 'এডমিশন প্যাক (৩ মাস)';
      } else if (
        (plan.duration_days >= 15 && plan.duration_days <= 60) ||
        displayName.includes('১ মাস') ||
        displayName.includes('বুস্টার') ||
        displayName.includes('exam_ready') ||
        displayName.includes('monthly')
      ) {
        displayName = 'মাসিক প্ল্যান (১ মাস)';
      }

      return {
        id: plan.id,
        name: displayName,
        price: plan.price,
        currency: plan.currency || '৳',
        duration_days: plan.duration_days,
        billingCycle:
          plan.duration_days >= 365
            ? 'Yearly'
            : plan.duration_days >= 180
              ? 'Half-Yearly'
              : plan.duration_days >= 90
                ? 'Quarterly'
                : plan.duration_days >= 30
                  ? 'Monthly'
                  : `${plan.duration_days} Days`,
        features: plan.features || [],
        colorTheme:
          plan.color_theme ||
          (plan.duration_days >= 180
            ? 'amber'
            : plan.duration_days >= 90
              ? 'emerald'
              : plan.price > 0
                ? 'indigo'
                : 'slate'),
        isPopular:
          plan.is_popular ?? (plan.duration_days >= 90 && plan.duration_days < 180),
      };
    });
  }

  // Fallback default plans if DB table is empty
  return [
    {
      id: 'monthly_plan',
      name: 'মাসিক প্ল্যান (১ মাস)',
      price: 149,
      currency: '৳',
      duration_days: 30,
      billingCycle: 'Monthly',
      features: [
        'সকল প্রিমিয়াম প্রশ্নের সমাধান',
        'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
        'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
      ],
      colorTheme: 'indigo',
      isPopular: false,
    },
    {
      id: 'admission_pro_3m',
      name: 'এডমিশন প্যাক (৩ মাস)',
      price: 349,
      currency: '৳',
      duration_days: 90,
      billingCycle: 'Quarterly',
      features: [
        'সকল প্রিমিয়াম প্রশ্নের সমাধান',
        'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
        'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
        'জাতীয় লাইভ পরীক্ষা ও লিডারবোর্ড',
      ],
      colorTheme: 'emerald',
      isPopular: true,
    },
    {
      id: 'full_session_6m',
      name: 'ফুল সেশন প্যাক (৬ মাস)',
      price: 599,
      currency: '৳',
      duration_days: 180,
      billingCycle: 'Half-Yearly',
      features: [
        'সকল প্রিমিয়াম প্রশ্নের সমাধান',
        'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
        'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
        'অধ্যায়ভিত্তিক ফর্মুলা ব্যাংক',
        '২৪/৭ স্পেশাল সাপোর্ট',
      ],
      colorTheme: 'amber',
      isPopular: false,
    },
  ];
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
    const invoices: Invoice[] = [];

    // 1. Subscription History (all active/granted subscriptions)
    try {
      const { data: subHist } = await supabase
        .from('subscription_history')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (subHist) {
        for (const h of subHist) {
          const rawDate = h.started_at || h.created_at || new Date().toISOString();
          invoices.push({
            id: h.id,
            date: new Date(rawDate).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            amount: h.amount ?? 0,
            currency: '৳',
            status: h.status === 'completed' || h.is_active ? 'valid' : 'checking',
            planName: h.plan_name || 'প্রো সাবস্ক্রিপশন',
            downloadUrl: '#',
            transactionId: h.payment_method === 'referral_bonus' ? 'REFERRAL_REWARD' : (h.id || 'N/A'),
            paymentMethod: h.payment_method || 'Online',
          });
        }
      }
    } catch (_) {}

    // 2. Payment Requests
    try {
      const { data: payData } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['Pending', 'Approved', 'Rejected'])
        .order('requested_at', { ascending: false });

      if (payData) {
        for (const req of payData) {
          // Avoid duplicate entry if already in subscription_history
          const exists = invoices.some((i) => i.id === req.id || i.transactionId === req.transaction_id);
          if (!exists) {
            invoices.push({
              id: req.id,
              date: new Date(req.requested_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
              amount: req.amount,
              currency: req.currency || '৳',
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
            });
          }
        }
      }
    } catch (_) {}

    // 3. Referral Rewards History
    try {
      const { data: myRef } = await supabase
        .from('referrals')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      const myRefId = myRef?.id;
      const refQuery = supabase
        .from('referral_history')
        .select('id, redeemed_at, admin_status, reward_given, redeemed_by, referral_id');

      const { data: refHist } = myRefId
        ? await refQuery.or(`redeemed_by.eq.${user.id},referral_id.eq.${myRefId}`).limit(20)
        : await refQuery.eq('redeemed_by', user.id).limit(20);

      if (refHist) {
        for (const r of refHist) {
          const exists = invoices.some((i) => i.id === r.id);
          if (!exists) {
            invoices.push({
              id: r.id,
              date: new Date(r.redeemed_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }),
              amount: 0,
              currency: '৳',
              status: 'valid',
              planName: '🎁 রেফারেল রিওয়ার্ড বোনাস',
              downloadUrl: '#',
              transactionId: 'REFERRAL_REWARD',
              paymentMethod: 'Referral Bonus',
            });
          }
        }
      }
    } catch (_) {}

    // 4. Scratch Card Gifts
    try {
      const { data: cards } = await supabase
        .from('scratch_cards')
        .select('id, scratched_at, reward_type, is_scratched')
        .eq('user_id', user.id)
        .eq('is_scratched', true)
        .order('scratched_at', { ascending: false })
        .limit(20);

      if (cards) {
        for (const c of cards) {
          let label = '🎁 স্ক্র্যাচ কার্ড গিফট বোনাস';
          if (c.reward_type === '1_month_free') {
            label = '🎁 স্ক্র্যাচ কার্ড গিফট (১ মাস ফ্রি)';
          } else if (c.reward_type === '2_months_free') {
            label = '🎁 স্ক্র্যাচ কার্ড গিফট (২ মাস ফ্রি)';
          } else if (c.reward_type === '3_months_free') {
            label = '🎁 স্ক্র্যাচ কার্ড গিফট (৩ মাস ফ্রি)';
          } else if (c.reward_type === '50_percent_off') {
            label = '🎁 স্ক্র্যাচ কার্ড গিফট (৫০% ছাড় কুপন)';
          }

          invoices.push({
            id: c.id,
            date: new Date(c.scratched_at).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }),
            amount: 0,
            currency: '৳',
            status: 'valid',
            planName: label,
            downloadUrl: '#',
            transactionId: 'SCRATCH_GIFT',
            paymentMethod: 'Gift Reward',
          });
        }
      }
    } catch (_) {}

    return invoices;
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
        let plan = hist.subscription_plans as any;
        const expiry = hist.expires_at;

        // If subscription_plans was not joined directly, try fetching by plan_id
        if (!plan && hist.plan_id) {
          const { data: matchedPlan } = await supabase
            .from('subscription_plans')
            .select('*')
            .eq('id', hist.plan_id)
            .maybeSingle();
          if (matchedPlan) plan = matchedPlan;
        }

        const displayName =
          plan?.display_name ||
          plan?.name ||
          hist.plan_name ||
          'প্রো সাবস্ক্রিপশন';

        const durationDays = plan?.duration_days || hist.duration_days || 15;
        const cycle =
          durationDays >= 365
            ? 'Yearly Plan'
            : durationDays >= 90
              ? 'Quarterly Plan'
              : durationDays >= 30
                ? 'Monthly Plan'
                : `${durationDays} Days Plan`;

        return {
          id: plan?.id || hist.id || 'history_active_sub',
          name: displayName,
          price: plan?.price || hist.amount || 0,
          currency: plan?.currency || '৳',
          billingCycle: cycle,
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
          'subscription, subscription_status, subscription_expires_at, is_subscribed, plan, level',
        )
        .eq('id', user.id)
        .maybeSingle();

      if (userProfile) {
        const sub = (userProfile.subscription || {}) as any;
        const status = (sub?.status || userProfile.subscription_status)?.toString().toLowerCase().trim();
        const expiry =
          userProfile.subscription_expires_at ||
          sub?.expiry ||
          sub?.expires_at;

        const isSub =
          userProfile.is_subscribed === true ||
          status === 'active' ||
          userProfile.plan === 'Pro' ||
          userProfile.plan === 'pro' ||
          userProfile.plan === 'Premium' ||
          userProfile.level === 'Pro' ||
          sub?.plan === 'Pro' ||
          sub?.plan === 'pro' ||
          sub?.plan === 'Premium';

        let expDate = expiry ? new Date(expiry) : null;
        if (!expDate || isNaN(expDate.getTime())) {
          if (isSub) {
            // Default 15 days from now if date not parsed
            expDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
          }
        }

        const isNotExpired = !!expDate && expDate > now;

        if (isSub && isNotExpired && expDate) {
          const rawPlanName = (sub?.plan || userProfile.plan || '').toString();
          const planName =
            !rawPlanName || rawPlanName.toLowerCase() === 'free' || rawPlanName.toLowerCase() === 'pro' || rawPlanName.toLowerCase() === 'premium'
              ? 'প্রো সাবস্ক্রিপশন'
              : rawPlanName;

          const daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const cycle =
            daysLeft >= 365 || planName.toLowerCase().includes('year')
              ? 'Yearly Plan'
              : daysLeft >= 90 || planName.toLowerCase().includes('quarter')
                ? 'Quarterly Plan'
                : 'Monthly Plan';

          return {
            id: 'user_active_plan',
            name: planName,
            price: 0,
            currency: '৳',
            billingCycle: cycle,
            features: [
              'সকল প্রিমিয়াম প্রশ্নের সমাধান',
              'আনলিমিটেড মডেল টেস্ট ও লাইভ এক্সাম',
              'পূর্ণাঙ্গ এনালাইসিস ও পারফরম্যান্স গ্রাফ',
            ],
            colorTheme: 'emerald',
            isPopular: true,
            expiresAt: expDate.toISOString(),
          };
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

  const cleanTrx = (data.transactionId || '').trim().toUpperCase();

  // 1. Validate TrxID format & block dummy TrxIDs
  const dummyTrx = new Set([
    '123456',
    '12345678',
    '00000000',
    'AAAAAAAA',
    'TEST1234',
    'ASDFGHJK',
    'ABCDEF1234',
    '11111111',
    '1234567890',
    'TRANSACTION',
  ]);
  if (!cleanTrx || cleanTrx.length < 6 || dummyTrx.has(cleanTrx)) {
    throw new Error('অনুগ্রহ করে পেমেন্ট করার পর প্রাপ্ত সঠিক ট্রানজেকশন আইডি (TrxID) দিন।');
  }

  // 2. Check if user already has an active pending payment
  const { data: pendingReq } = await supabase
    .from('payment_requests')
    .select('id, transaction_id')
    .eq('user_id', data.userId)
    .eq('status', 'Pending')
    .maybeSingle();

  if (pendingReq) {
    throw new Error(
      'আপনার একটি পেমেন্ট রিকোয়েস্ট ইতিমধ্যে প্রক্রিয়াধীন আছে। সেটি যাচাই সম্পন্ন হওয়া পর্যন্ত অপেক্ষা করুন।',
    );
  }

  // 3. Check if TrxID is already used globally
  const { data: dupTrx } = await supabase
    .from('payment_requests')
    .select('id')
    .eq('transaction_id', cleanTrx)
    .in('status', ['Approved', 'Pending'])
    .maybeSingle();

  if (dupTrx) {
    throw new Error('এই ট্রানজেকশন আইডিটি (TrxID) ইতিমধ্যে ব্যবহার করা হয়েছে। অনুগ্রহ করে সঠিক TrxID দিন।');
  }

  const { error } = await supabase.from('payment_requests').insert({
    user_id: data.userId,
    plan_name: data.planName,
    amount: data.amount,
    currency: 'BDT',
    payment_method: `${data.paymentMethod} (${data.senderNumber})`,
    transaction_id: cleanTrx,
    status: 'Pending',
    requested_at: data.submittedAt || new Date().toISOString(),
  });

  if (error) {
    console.error('Payment Submission Error:', error);
    throw error;
  }

  // Notify Admin
  const ADMIN_ID = 'me';
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
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'extend_subscription',
        userId,
        extensionDays: days,
      }),
    });
    const result = await res.json();
    return result.success === true;
  } catch (err) {
    console.error('Failed to extend subscription:', err);
    return false;
  }
};
