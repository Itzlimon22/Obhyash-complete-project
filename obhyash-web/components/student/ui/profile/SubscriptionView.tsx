'use client';

import React, { useState, useEffect } from 'react';
import {
  SubscriptionPlan,
  PaymentMethod,
  UserProfile,
  PaymentSubmission,
} from '@/lib/types';
import PricingCard from './subscription/PricingCard';
import ManualPaymentModal from './subscription/ManualPaymentModal';
import { toast } from 'sonner';
import {
  getSubscriptionPlans,
  getUserPaymentMethods,
  getUserProfile,
  submitManualPayment,
  getUserActiveSubscription,
} from '@/services/database';
import { cn } from '@/lib/utils';
import {
  Zap,
  Headphones,
  Clock,
  Shield,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Check,
} from 'lucide-react';

// â”€â”€ Comparison table feature matrix â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const COMPARISON_FEATURES = [
  {
    label: 'à¦¦à§ˆà¦¨à¦¿à¦• à¦®à¦• à¦ªà¦°à§€à¦•à§à¦·à¦¾',
    free: 'à§©à¦Ÿà¦¿',
    paid: 'à¦¸à§€à¦®à¦¾à¦¹à§€à¦¨',
  },
  {
    label: 'à¦…à¦¨à§à¦¶à§€à¦²à¦¨ à¦ªà§à¦°à¦¶à§à¦¨',
    free: 'à§«à§¦à¦Ÿà¦¿/à¦¦à¦¿à¦¨',
    paid: 'à¦¸à§€à¦®à¦¾à¦¹à§€à¦¨',
  },
  {
    label: 'à¦ªà§à¦°à¦¶à§à¦¨à¦¬à§à¦¯à¦¾à¦‚à¦• à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸',
    free: true,
    paid: true,
  },
  {
    label: 'à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦¬à§à¦¯à¦¾à¦–à§à¦¯à¦¾',
    free: false,
    paid: true,
  },
  {
    label: 'à¦¬à¦¿à¦·à¦¯à¦¼à¦­à¦¿à¦¤à§à¦¤à¦¿à¦• à¦à¦¨à¦¾à¦²à¦¾à¦‡à¦¸à¦¿à¦¸',
    free: false,
    paid: true,
  },
  { label: 'à¦²à¦¿à¦¡à¦¾à¦°à¦¬à§‹à¦°à§à¦¡', free: true, paid: true },
  {
    label: 'à¦ªà§‡à¦ªà¦¾à¦° à¦¸à§à¦•à§à¦°à¦¿à¦ªà§à¦Ÿ à¦†à¦ªà¦²à§‹à¦¡',
    free: false,
    paid: true,
  },
  { label: 'à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦ªà¦°à§€à¦•à§à¦·à¦¾', free: false, paid: true },
  { label: 'AI à¦¸à¦¾à¦œà§‡à¦¶à¦¨', free: false, paid: true },
  {
    label: 'à¦¡à¦¾à¦‰à¦¨à¦²à§‹à¦¡/à¦ªà§à¦°à¦¿à¦¨à§à¦Ÿ',
    free: false,
    paid: true,
  },
  { label: 'à§¨à§ª/à§­ à¦¸à¦¾à¦ªà§‹à¦°à§à¦Ÿ', free: false, paid: true },
];

const TRUST_BADGES = [
  {
    Icon: Headphones,
    label: 'à§¨à§ª/à§­ à¦¸à¦¾à¦ªà§‹à¦°à§à¦Ÿ',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
  },
  {
    Icon: Clock,
    label: 'à¦¤à¦¾à§Žà¦•à§à¦·à¦£à¦¿à¦• à¦…à§à¦¯à¦¾à¦•à§à¦¸à§‡à¦¸',
    color: 'text-green-700',
    bg: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    Icon: Shield,
    label: 'à¦¨à¦¿à¦°à¦¾à¦ªà¦¦ à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    Icon: RefreshCcw,
    label: 'à¦°à¦¿à¦¨à¦¿à¦‰ à¦¸à¦¹à¦œ',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
  },
];

function ComparisonCell({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-4 h-4 text-green-700 mx-auto" />
    ) : (
      <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
    );
  }
  return <span className="text-xs font-bold">{value}</span>;
}

const SubscriptionView: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>('free');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null,
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedPlans, fetchedMethods, user, activeSub] =
          await Promise.all([
            getSubscriptionPlans(),
            getUserPaymentMethods(),
            getUserProfile('me'),
            getUserActiveSubscription(),
          ]);
        setPlans(fetchedPlans);
        setPaymentMethods(fetchedMethods);
        setCurrentUser(user);
        if (activeSub) setCurrentPlanId(activeSub.id);
      } catch (error) {
        console.error('Failed to load upgrade data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (plan.id === 'free' || plan.id === currentPlanId) return;
    setSelectedPlan(plan);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async (data: {
    method: string;
    number: string;
    trxId: string;
  }) => {
    if (!currentUser || !selectedPlan) {
      toast.error('User or Plan details missing.');
      return;
    }
    const submission: PaymentSubmission = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      amount: selectedPlan.price,
      paymentMethod: data.method,
      senderNumber: data.number,
      transactionId: data.trxId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };
    try {
      const success = await submitManualPayment(submission);
      if (success) {
        toast.success(
          `à¦ªà§‡à¦®à§‡à¦¨à§à¦Ÿ à¦œà¦®à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤ à¦¯à¦¾à¦šà¦¾à¦‡ à¦¹à¦²à§‡ ${selectedPlan.name} à¦šà¦¾à¦²à§ à¦¹à¦¬à§‡à¥¤`,
        );
        setIsPaymentModalOpen(false);
        setSelectedPlan(null);
      } else throw new Error('Submission failed');
    } catch {
      toast.error(
        'à¦¤à§à¦°à§à¦Ÿà¦¿ à¦¹à¦¯à¦¼à§‡à¦›à§‡à¥¤ à¦†à¦¬à¦¾à¦° à¦šà§‡à¦·à§à¦Ÿà¦¾ à¦•à¦°à§‹à¥¤',
      );
    }
  };

  const premiumPlans = plans
    .filter((p) => p.price > 0)
    .sort((a, b) => a.price - b.price);

  if (isPaymentModalOpen && selectedPlan) {
    return (
      <ManualPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        savedMethods={paymentMethods}
        onConfirm={handlePaymentConfirm}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 pb-24 sm:pb-20 px-1 animate-fade-in">
      {/* â”€â”€ HERO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-neutral-900 dark:bg-black p-8 sm:p-14 text-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 bg-green-900/50 border border-green-700/50 text-green-400 text-xs font-bold px-3 py-1.5 rounded-full mb-2">
            <Zap size={11} />
            à¦ªà§à¦°à¦¿à¦®à¦¿à¦¯à¦¼à¦¾à¦® à¦ªà§à¦²à§à¦¯à¦¾à¦¨
          </div>
          <h1 className="text-white text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            à¦†à¦°à§‹ à¦¬à§‡à¦¶à¦¿ à¦ªà¦¡à¦¼à§‹,
            <br className="hidden sm:block" /> à¦†à¦°à§‹ à¦­à¦¾à¦²à§‹
            à¦ªà§à¦°à¦¸à§à¦¤à§à¦¤à¦¿ à¦¨à¦¾à¦“
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            à¦¸à§€à¦®à¦¾à¦¹à§€à¦¨ à¦ªà¦°à§€à¦•à§à¦·à¦¾, AI à¦¸à¦¾à¦œà§‡à¦¶à¦¨,
            à¦¬à¦¿à¦¸à§à¦¤à¦¾à¦°à¦¿à¦¤ à¦à¦¨à¦¾à¦²à¦¾à¦‡à¦¸à¦¿à¦¸ â€” à¦¸à¦¬
            à¦•à¦¿à¦›à§ à¦à¦• à¦ªà§à¦²à§à¦¯à¦¾à¦¨à§‡
          </p>
        </div>
      </div>

      {/* â”€â”€ PRICING CARDS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section>
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mb-1">
            à¦¤à§‹à¦®à¦¾à¦° à¦ªà§à¦²à§à¦¯à¦¾à¦¨ à¦¬à§‡à¦›à§‡ à¦¨à¦¾à¦“
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            à¦¯à§‡à¦•à§‹à¦¨à§‹ à¦¸à¦®à¦¯à¦¼ à¦¬à¦¾à¦¤à¦¿à¦² à¦•à¦°à¦¾
            à¦¯à¦¾à¦¬à§‡
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-96 bg-white dark:bg-neutral-900 rounded-3xl animate-pulse border border-neutral-100 dark:border-neutral-800"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {premiumPlans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                isCurrent={currentPlanId === plan.id}
                onSelect={() => handlePlanSelect(plan)}
              />
            ))}
          </div>
        )}
      </section>

      {/* â”€â”€ COMPARISON TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section>
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
            à¦«à§à¦°à¦¿ à¦¬à¦¨à¦¾à¦® à¦ªà§à¦°à¦¿à¦®à¦¿à¦¯à¦¼à¦¾à¦®
          </h2>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
            <div className="p-4 text-sm font-bold text-neutral-500 dark:text-neutral-400">
              à¦«à¦¿à¦šà¦¾à¦°
            </div>
            <div className="p-4 text-center">
              <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                à¦«à§à¦°à¦¿
              </span>
            </div>
            <div className="p-4 text-center bg-green-800/5 dark:bg-green-900/20">
              <span className="text-sm font-bold text-green-800 dark:text-green-400">
                à¦ªà§à¦°à¦¿à¦®à¦¿à¦¯à¦¼à¦¾à¦®
              </span>
            </div>
          </div>

          {/* Rows */}
          {COMPARISON_FEATURES.map((row, i) => (
            <div
              key={i}
              className={cn(
                'grid grid-cols-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0',
                i % 2 === 0 ? '' : 'bg-neutral-50/50 dark:bg-neutral-800/20',
              )}
            >
              <div className="p-3 sm:p-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 font-medium flex items-center">
                {row.label}
              </div>
              <div className="p-3 sm:p-4 flex items-center justify-center text-neutral-500 dark:text-neutral-500">
                <ComparisonCell value={row.free} />
              </div>
              <div className="p-3 sm:p-4 flex items-center justify-center bg-green-800/5 dark:bg-green-900/10 text-green-800 dark:text-green-400">
                <ComparisonCell value={row.paid} />
              </div>
            </div>
          ))}

          {/* CTA footer */}
          <div className="p-4 sm:p-6 grid grid-cols-3">
            <div />
            <div />
            <div className="flex justify-center">
              <button
                onClick={() =>
                  premiumPlans[0] && handlePlanSelect(premiumPlans[0])
                }
                disabled={loading || premiumPlans.length === 0}
                className="px-5 py-2.5 rounded-xl bg-green-800 text-white text-xs sm:text-sm font-bold hover:bg-green-900 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                à¦à¦–à¦¨à¦‡ à¦¶à§à¦°à§ à¦•à¦°à§‹
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* â”€â”€ TRUST BADGES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {TRUST_BADGES.map(({ Icon, label, color, bg }, idx) => (
          <div
            key={idx}
            className={cn(
              'flex flex-col items-center text-center gap-2 p-4 rounded-xl border border-neutral-100 dark:border-neutral-800',
              bg,
            )}
          >
            <Icon className={cn('w-5 h-5', color)} strokeWidth={1.5} />
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionView;
