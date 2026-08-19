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
import { CouponModal } from './subscription/CouponModal';
import { toast } from 'sonner';
import {
  getSubscriptionPlans,
  getUserPaymentMethods,
  getUserProfile,
  submitManualPayment,
  getUserActiveSubscription,
} from '@/services/database';
import { calculateCouponDiscount, AppliedCoupon } from '@/lib/utils/coupon-system';
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
  Tag,
  Sparkles,
  X,
} from 'lucide-react';

// ── Comparison table feature matrix ──────────────────────────────────────────
const COMPARISON_FEATURES = [
  {
    label: 'অনুশীলন প্রশ্ন',
    free: '৫০টি/দিন',
    paid: 'সীমাহীন',
  },
  {
    label: 'মডেল টেস্ট ও কাস্টম পরীক্ষা',
    free: '৩টি/দিন',
    paid: 'সীমাহীন',
  },
  {
    label: 'লাইভ এক্সাম ও প্রতিযোগিতা',
    free: 'সীমিত',
    paid: 'সকল এক্সাম',
  },
  {
    label: 'অধ্যায়ভিত্তিক ফর্মুলা ব্যাংক',
    free: true,
    paid: true,
  },
  {
    label: 'প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান',
    free: false,
    paid: true,
  },
  {
    label: 'বিষয়ভিত্তিক ও পারফরম্যান্স এনালাইসিস',
    free: false,
    paid: true,
  },
  { label: 'মেধা তালিকা ও লাইভ লিডারবোর্ড', free: true, paid: true },
  { label: 'ডেইলি স্ট্রিক ও রিওয়ার্ড কোয়েস্ট', free: true, paid: true },
  {
    label: 'ভুল উত্তর ও বুকমার্ক কালেকশন',
    free: false,
    paid: true,
  },
  { label: 'প্রাইওরিটি হেল্প ও সাপোর্ট', free: false, paid: true },
];

const TRUST_BADGES = [
  {
    Icon: Headphones,
    label: '২৪/৭ সাপোর্ট',
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
  },
  {
    Icon: Clock,
    label: 'তাৎক্ষণিক অ্যাক্সেস',
    color: 'text-green-700',
    bg: 'bg-green-50 dark:bg-green-950/20',
  },
  {
    Icon: Shield,
    label: 'নিরাপদ পেমেন্ট',
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    Icon: RefreshCcw,
    label: 'রিনিউ সহজ',
    color: 'text-purple-600',
    bg: 'bg-purple-50 dark:bg-purple-950/20',
  },
];

function ComparisonCell({
  value,
  isPaid,
}: {
  value: boolean | string;
  isPaid?: boolean;
}) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mx-auto" />
    ) : (
      <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 mx-auto" />
    );
  }
  return (
    <span
      className={cn(
        'text-xs font-bold',
        isPaid
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-neutral-700 dark:text-neutral-300',
      )}
    >
      {value}
    </span>
  );
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
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

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

  const handleApplyCoupon = (code: string): boolean => {
    // Validate with reference 149 plan
    const result = calculateCouponDiscount(code, 149);
    if (result.isValid && result.appliedCoupon) {
      setAppliedCoupon(result.appliedCoupon);
      return true;
    }
    return false;
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  const handlePlanSelect = (plan: SubscriptionPlan) => {
    if (plan.id === 'free' || plan.id === currentPlanId) return;

    // Apply coupon discount to selected plan if active
    let effectivePlan = { ...plan };
    if (appliedCoupon && plan.price > 0) {
      const discount = calculateCouponDiscount(appliedCoupon.code, plan.price);
      if (discount.appliedCoupon) {
        effectivePlan.price = discount.appliedCoupon.finalPrice;
      }
    }

    setSelectedPlan(effectivePlan);
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
          `পেমেন্ট জমা হয়েছে। যাচাই হলে ${selectedPlan.name} চালু হবে।`,
        );
        setIsPaymentModalOpen(false);
        setSelectedPlan(null);
      } else throw new Error('Submission failed');
    } catch {
      toast.error(
        'ত্রুটি হয়েছে। আবার চেষ্টা করো।',
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
    <div className="max-w-5xl mx-auto space-y-8 sm:space-y-10 pb-24 sm:pb-20 px-1 animate-fade-in pt-2">
      {/* ── PRICING CARDS ────────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mb-1">
            তোমার প্ল্যান বেছে নাও
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            যেকোনো সময় বাতিল করা যাবে
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
              {premiumPlans.map((plan) => (
                <PricingCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={currentPlanId === plan.id}
                  onSelect={() => handlePlanSelect(plan)}
                  appliedCoupon={appliedCoupon}
                  onOpenCouponModal={() => setIsCouponModalOpen(true)}
                  onRemoveCoupon={handleRemoveCoupon}
                />
              ))}
            </div>

            {/* Global Coupon Bar Below Packages */}
            <div className="max-w-4xl mx-auto flex items-center justify-center">
              {appliedCoupon ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl shadow-sm text-xs text-emerald-800 dark:text-emerald-300">
                  <Sparkles size={14} className="text-amber-500 shrink-0" />
                  <span>
                    কুপন <strong>{appliedCoupon.code}</strong> কার্যকর রয়েছে (৳{appliedCoupon.discountAmount} ছাড়)
                  </span>
                  <button
                    onClick={handleRemoveCoupon}
                    className="ml-2 text-xs font-bold text-red-600 hover:text-red-700 underline"
                  >
                    মুছে ফেলুন
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-neutral-600 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-400 font-semibold transition-all group underline underline-offset-4"
                >
                  <Tag size={13} className="text-emerald-500" />
                  <span>কুপন আছে?</span>
                </button>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── COMPARISON TABLE ─────────────────────────────────────────────── */}
      <section>
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
            ফ্রি বনাম প্রিমিয়াম
          </h2>
        </div>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="grid grid-cols-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700">
            <div className="p-4 text-sm font-bold text-neutral-500 dark:text-neutral-400">
              ফিচার
            </div>
            <div className="p-4 text-center">
              <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                ফ্রি
              </span>
            </div>
            <div className="p-4 text-center bg-green-800/5 dark:bg-green-900/20">
              <span className="text-sm font-bold text-green-800 dark:text-green-400">
                প্রিমিয়াম
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
                <ComparisonCell value={row.paid} isPaid={true} />
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
                এখনই শুরু করো
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ─────────────────────────────────────────────────── */}
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

      {/* ── COUPON MODAL POPUP ────────────────────────────────────────────── */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
      />
    </div>
  );
};

export default SubscriptionView;
