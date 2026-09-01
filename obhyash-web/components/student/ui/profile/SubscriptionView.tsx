'use client';

import React, { useState, useEffect } from 'react';
import {
  SubscriptionPlan,
  PaymentMethod,
  UserProfile,
  PaymentSubmission,
} from '@/lib/types';
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
  BookOpen,
  Trophy,
  LineChart,
  Bookmark,
  Binary,
  ShieldCheck,
  Headphones,
  Clock,
  Shield,
  RefreshCw,
  Crown,
  Sparkles,
  Check,
  X,
  XCircle,
  ArrowRight,
  Loader2,
} from 'lucide-react';

const TRUST_BADGES = [
  {
    icon: Headphones,
    label: '২৪/৭ সাপোর্ট',
    iconColor: '#B91C1C',
    bgColor: 'bg-red-50 dark:bg-[#1A0505]',
    borderColor: 'border-red-200 dark:border-red-900/40',
  },
  {
    icon: Clock,
    label: 'তাৎক্ষণিক অ্যাক্সেস',
    iconColor: '#16A34A',
    bgColor: 'bg-emerald-50 dark:bg-[#051A0A]',
    borderColor: 'border-emerald-200 dark:border-emerald-900/40',
  },
  {
    icon: ShieldCheck,
    label: 'নিরাপদ পেমেন্ট',
    iconColor: '#0F172A',
    bgColor: 'bg-blue-50 dark:bg-[#050B1A]',
    borderColor: 'border-blue-200 dark:border-blue-900/40',
  },
  {
    icon: RefreshCw,
    label: 'রিনিউ সহজ',
    iconColor: '#9333EA',
    bgColor: 'bg-purple-50 dark:bg-[#10051A]',
    borderColor: 'border-purple-200 dark:border-purple-900/40',
  },
];

const COMPARISON_FEATURES = [
  { label: 'দৈনিক পরীক্ষা কোটা', free: '২টি / দিন', pro: 'সীমাহীন' },
  { label: 'দৈনিক প্র্যাকটিস সেশন', free: '১টি / দিন', pro: 'সীমাহীন' },
  { label: 'প্রতি পরীক্ষায় প্রশ্ন সংখ্যা', free: 'সর্বোচ্চ ৫০', pro: '১০০+ পূর্ণাঙ্গ' },
  { label: 'বুকমার্ক প্রশ্ন সংরক্ষণ', free: 'সর্বোচ্চ ২৫টি', pro: 'সীমাহীন' },
  { label: 'প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান', free: false, pro: true },
  { label: 'পারফরম্যান্স ও ফলাফল অ্যানালিটিক্স', free: false, pro: true },
  { label: 'জাতীয় লাইভ পরীক্ষা ও লিডারবোর্ড', free: false, pro: true },
  { label: 'অধ্যায়ভিত্তিক ফর্মুলা ব্যাংক', free: false, pro: true },
  { label: 'ডেইলি স্ট্রিক ও মিশন রিওয়ার্ড', free: false, pro: true },
  { label: '১০০% বিজ্ঞাপনমুক্ত পরিবেশ', free: false, pro: true },
];

export const SubscriptionView: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string>('free');
  const [activeSubscription, setActiveSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(0);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedPlans, fetchedMethods, user, activeSub] = await Promise.all([
        getSubscriptionPlans(),
        getUserPaymentMethods(),
        getUserProfile('me'),
        getUserActiveSubscription(),
      ]);

      const premium = fetchedPlans.filter((p) => p.price > 0).sort((a, b) => a.price - b.price);
      setPlans(premium);
      setPaymentMethods(fetchedMethods);
      setCurrentUser(user);
      setActiveSubscription(activeSub);
      if (activeSub) setCurrentPlanId(activeSub.id);

      if (premium.length >= 2) {
        setSelectedPlanIndex(1); // Default to middle/popular plan
      } else {
        setSelectedPlanIndex(0);
      }
    } catch (error) {
      console.error('Failed to load subscription data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyCoupon = (code: string): boolean => {
    const activePlan = plans[selectedPlanIndex] || plans[0];
    const refPrice = activePlan?.price || 149;
    const result = calculateCouponDiscount(code, refPrice);
    if (result.isValid && result.appliedCoupon) {
      setAppliedCoupon(result.appliedCoupon);
      toast.success(`🎉 '${result.appliedCoupon.code}' কুপন সফলভাবে প্রয়োগ হয়েছে!`);
      return true;
    }
    toast.error(result.errorMessage || 'অকার্যকর কুপন কোড!');
    return false;
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    toast.info('কুপন মুছে ফেলা হয়েছে');
  };

  const selectedPlan = plans[selectedPlanIndex] || null;

  const handlePaymentInitiate = () => {
    if (!selectedPlan) return;

    let effectivePlan = { ...selectedPlan };
    if (appliedCoupon && selectedPlan.price > 0) {
      const discount = calculateCouponDiscount(appliedCoupon.code, selectedPlan.price);
      if (discount.appliedCoupon) {
        effectivePlan.price = discount.appliedCoupon.finalPrice;
      }
    }

    setIsPaymentModalOpen(true);
  };

  const handlePaymentConfirm = async (data: {
    method: string;
    number: string;
    trxId: string;
  }) => {
    if (!currentUser || !selectedPlan) {
      toast.error('ব্যবহারকারী বা প্ল্যানের তথ্য পাওয়া যায়নি।');
      return;
    }

    const effectivePrice = appliedCoupon
      ? calculateCouponDiscount(appliedCoupon.code, selectedPlan.price).appliedCoupon?.finalPrice || selectedPlan.price
      : selectedPlan.price;

    const submission: PaymentSubmission = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      amount: effectivePrice,
      paymentMethod: data.method,
      senderNumber: data.number,
      transactionId: data.trxId,
      status: 'pending',
      submittedAt: new Date().toISOString(),
    };

    try {
      const success = await submitManualPayment(submission);
      if (success) {
        toast.success(`পেমেন্ট জমা হয়েছে। যাচাই হলে ${selectedPlan.name} চালু হবে।`);
        setIsPaymentModalOpen(false);
        loadData();
      } else {
        throw new Error('Submission failed');
      }
    } catch {
      toast.error('পেমেন্ট জমা দিতে সমস্যা হয়েছে। আবার চেষ্টা করো।');
    }
  };

  const formatBengaliDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const daysRemaining = activeSubscription?.expiresAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(activeSubscription.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-3 py-3 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── 1. Active Subscription Banner (with Day Count & Stacking Info) ── */}
      {activeSubscription && (
        <div className="mb-6 p-4.5 rounded-[22px] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/40 dark:via-amber-900/20 bg-white dark:bg-[#18181B] border border-amber-200/80 dark:border-amber-900/50 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
            <Crown className="w-6 h-6 animate-pulse" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-neutral-900 dark:text-white truncate leading-tight">
                {activeSubscription.name}
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300 dark:border-emerald-800/50 shrink-0">
                সক্রিয়
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 flex flex-wrap items-center gap-1.5 font-medium">
              <span>মেয়াদ:</span>
              <strong className="text-amber-700 dark:text-amber-400 font-bold">
                {daysRemaining} দিন বাকি
              </strong>
              {activeSubscription.expiresAt && (
                <span className="text-neutral-400 dark:text-neutral-500 text-[11px]">
                  ({formatBengaliDate(activeSubscription.expiresAt)} পর্যন্ত)
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── 2. Master Pricing & Plan Card (1:1 with Flutter) ── */}
      <div className="bg-white dark:bg-[#141417] rounded-[28px] p-5 sm:p-7 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs mb-6">
        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white">
            তোমার প্ল্যান বেছে নাও
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#A1A1AA] mt-1">
            সব প্ল্যানে সম্পূর্ণ প্রিমিয়াম অ্যাক্সেস আনলক হবে
          </p>
        </div>

        {/* Plan Selectors */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3.5 mb-4">
            {plans.map((plan, index) => {
              const isSelected = selectedPlanIndex === index;
              const durationDays = plan.duration_days ?? (plan as any).durationDays ?? 30;
              const isMasterPro = durationDays >= 180;
              const effectivePrice = appliedCoupon
                ? calculateCouponDiscount(appliedCoupon.code, plan.price).appliedCoupon?.finalPrice || plan.price
                : plan.price;
              const hasDiscount = effectivePrice !== plan.price;

              const activeBorder = isSelected
                ? isMasterPro
                  ? 'border-[#D97706] dark:border-[#F59E0B] bg-[#FFFBEB] dark:bg-[#271A0A]'
                  : 'border-[#059669] dark:border-[#10B981] bg-[#F0FDF4] dark:bg-[#062319]'
                : 'border-[#E2E8F0] dark:border-[#27272A] bg-[#F8FAFC] dark:bg-[#1C1C20]';

              const accentColor = isMasterPro ? '#D97706' : '#059669';

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanIndex(index)}
                  className={`p-4 sm:p-5 rounded-[20px] border-2 transition-all cursor-pointer flex items-center justify-between gap-3 shadow-xs ${activeBorder}`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Radio circle */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? `border-[${accentColor}] bg-[${accentColor}] text-white`
                          : 'border-neutral-400 dark:border-neutral-600 bg-transparent'
                      }`}
                      style={{
                        borderColor: isSelected ? accentColor : undefined,
                        backgroundColor: isSelected ? accentColor : undefined,
                      }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-base font-black text-[#0F172A] dark:text-white truncate">
                        {plan.name}
                      </h4>
                    </div>
                  </div>

                  {/* Price info */}
                  <div className="text-right shrink-0">
                    {hasDiscount && (
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through mr-1 font-mono">
                        ৳{plan.price}
                      </span>
                    )}
                    <span className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-white font-mono">
                      ৳{effectivePrice}
                    </span>
                    <span className="block text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                      /{durationDays} দিন
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Validity Stacking Info (Day count added to previous) ── */}
        {daysRemaining > 0 && selectedPlan && (
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-300/80 dark:border-emerald-800/60 flex items-center gap-3 text-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-emerald-900 dark:text-emerald-200 text-[13px]">
                পূর্বের মেয়াদের সাথে নতুন দিন যোগ হবে ⚡
              </p>
              <p className="text-neutral-600 dark:text-neutral-300 text-[11.5px] mt-0.5 leading-relaxed">
                বর্তমান <strong className="text-emerald-700 dark:text-emerald-400 font-bold">{daysRemaining} দিনের</strong> সাথে নতুন প্ল্যানের{' '}
                <strong>{selectedPlan.duration_days ?? (selectedPlan as any).durationDays ?? 30} দিন</strong> যুক্ত হয়ে মোট{' '}
                <strong className="text-emerald-700 dark:text-emerald-400 font-black underline">
                  {daysRemaining + (selectedPlan.duration_days ?? (selectedPlan as any).durationDays ?? 30)} দিন
                </strong>{' '}
                সক্রিয় থাকবে।
              </p>
            </div>
          </div>
        )}

        {/* ── Coupon prompt text link (1:1 with Flutter) ── */}
        <div className="text-center mb-5">
          <button
            type="button"
            onClick={() => {
              if (appliedCoupon) {
                handleRemoveCoupon();
              } else {
                setIsCouponModalOpen(true);
              }
            }}
            className={`text-xs sm:text-sm font-semibold underline underline-offset-4 cursor-pointer transition-colors ${
              appliedCoupon
                ? 'text-red-500 hover:text-red-600'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            {appliedCoupon ? 'কুপন রিমুভ করুন' : 'কুপন আছে?'}
          </button>
        </div>

        {/* ── Primary CTA Button (1:1 with Flutter) ── */}
        {selectedPlan && (
          <div>
            <button
              type="button"
              onClick={handlePaymentInitiate}
              className="w-full py-4 px-6 rounded-[18px] bg-[#004633] hover:bg-[#003828] text-white font-extrabold text-base flex items-center justify-center gap-3 transition-all shadow-md shadow-[#004633]/25 active:scale-[0.99] cursor-pointer"
            >
              <span>পেমেন্ট করতে এগিয়ে যান</span>
              <div className="px-2.5 py-0.5 rounded-lg bg-white/20 text-white font-mono text-sm font-bold flex items-center gap-1.5">
                {appliedCoupon && (
                  <span className="line-through text-white/60 text-xs">
                    ৳{selectedPlan.price}
                  </span>
                )}
                <span>
                  ৳
                  {appliedCoupon
                    ? calculateCouponDiscount(appliedCoupon.code, selectedPlan.price).appliedCoupon?.finalPrice || selectedPlan.price
                    : selectedPlan.price}
                </span>
              </div>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        )}
      </div>

      {/* ── 3. Unified What's Included Features Showcase (1:1 with Flutter) ── */}
      <div className="bg-white dark:bg-[#18181B] rounded-[22px] p-5 sm:p-6 border border-[#E2E8F0] dark:border-[#27272A] shadow-xs mb-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-1.5 rounded-lg bg-[#004633]/10 dark:bg-[#004633]/25 text-[#004633] dark:text-[#34D399]">
            <Crown className="w-4 h-4" />
          </div>
          <h3 className="text-base font-extrabold text-[#0F172A] dark:text-white">
            প্রিমিয়াম প্ল্যানে যা যা থাকছে
          </h3>
        </div>

        <div className="space-y-3.5">
          {[
            { icon: Zap, title: 'সীমাহীন কাস্টম ও পূর্ণাঙ্গ মডেল টেস্ট' },
            { icon: BookOpen, title: 'প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান' },
            { icon: Trophy, title: 'জাতীয় লাইভ পরীক্ষা ও লিডারবোর্ড র‍্যাংকিং' },
            { icon: LineChart, title: 'স্মার্ট পারফরম্যান্স অ্যানালিটিক্স ও রিপোর্ট' },
            { icon: Bookmark, title: 'বুকমার্ক প্রশ্ন ও ফ্ল্যাশকার্ড রিভিশন মোড' },
            { icon: Binary, title: 'সকল বিষয়ের ফর্মুলা ব্যাংক ও চিটশিট' },
            { icon: ShieldCheck, title: '১০০% বিজ্ঞাপনমুক্ত নিরবচ্ছিন্ন প্র্যাকটিস' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#004633]/10 dark:bg-[#004633]/20 border border-[#004633]/20 dark:border-[#004633]/40 flex items-center justify-center text-[#004633] dark:text-[#34D399] shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-bold text-[#0F172A] dark:text-white">
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. Trust Badges Grid (1:1 with Flutter) ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 mb-6">
        {TRUST_BADGES.map((b, i) => {
          const Icon = b.icon;
          return (
            <div
              key={i}
              className={`p-3.5 rounded-[16px] border flex items-center gap-2.5 ${b.bgColor} ${b.borderColor}`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${b.iconColor}15`, color: b.iconColor }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── 5. Comparison Table (1:1 with Flutter) ── */}
      <div className="mb-6">
        <h3 className="text-center text-lg sm:text-xl font-black text-[#0F172A] dark:text-white mb-4">
          ফ্রি বনাম প্রিমিয়াম
        </h3>

        <div className="bg-white dark:bg-[#141416] rounded-[20px] border border-[#E2E8F0] dark:border-[#27272A] overflow-hidden shadow-xs">
          {/* Table Header */}
          <div className="grid grid-cols-12 p-4 bg-[#F8FAFC] dark:bg-[#1E1E22] border-b border-[#E2E8F0] dark:border-[#27272A] text-xs font-bold text-neutral-600 dark:text-neutral-300">
            <div className="col-span-6">ফিচারসমূহ</div>
            <div className="col-span-3 text-center">ফ্রি</div>
            <div className="col-span-3 text-center text-[#004633] dark:text-[#34D399]">
              প্রিমিয়াম
            </div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {COMPARISON_FEATURES.map((row, i) => (
              <div key={i} className="grid grid-cols-12 p-3.5 items-center text-xs">
                <div className="col-span-6 font-semibold text-neutral-800 dark:text-neutral-200">
                  {row.label}
                </div>

                <div className="col-span-3 text-center font-bold text-neutral-500 dark:text-neutral-400">
                  {typeof row.free === 'boolean' ? (
                    row.free ? (
                      <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-neutral-400 mx-auto" />
                    )
                  ) : (
                    <span>{row.free}</span>
                  )}
                </div>

                <div className="col-span-3 text-center font-bold text-[#004633] dark:text-[#34D399]">
                  {typeof row.pro === 'boolean' ? (
                    <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                  ) : (
                    <span>{row.pro}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Payment / Checkout Modal */}
      {isPaymentModalOpen && selectedPlan && (
        <ManualPaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          plan={
            appliedCoupon
              ? {
                  ...selectedPlan,
                  price:
                    calculateCouponDiscount(appliedCoupon.code, selectedPlan.price)
                      .appliedCoupon?.finalPrice || selectedPlan.price,
                }
              : selectedPlan
          }
          savedMethods={paymentMethods}
          onConfirm={handlePaymentConfirm}
        />
      )}

      {/* Coupon Modal */}
      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onApplyCoupon={handleApplyCoupon}
        appliedCoupon={appliedCoupon}
        onRemoveCoupon={handleRemoveCoupon}
      />
    </div>
  );
};

export default SubscriptionView;
