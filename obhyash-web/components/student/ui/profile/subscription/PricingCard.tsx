'use client';

import React from 'react';
import { SubscriptionPlan } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';

interface PricingCardProps {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  onSelect: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  isCurrent,
  onSelect,
}) => {
  const isMasterPro = (plan.duration_days ?? 0) >= 180 || plan.price >= 500;
  const isTopRankers = ((plan.duration_days ?? 0) >= 90 && (plan.duration_days ?? 0) < 180) || (plan.price >= 300 && plan.price < 500);

  let badgeText = 'স্টার্টার ⚡';
  let badgeClasses = 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white';
  let containerBorder = 'bg-neutral-200 dark:bg-neutral-800 hover:border-indigo-500/50';
  let accentIconBg = 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400';
  let monthlyText = '৩০ দিন ফুল এক্সেস • এককালীন পেমেন্ট';
  let buttonClasses = 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20';

  if (isMasterPro) {
    badgeText = 'মেগা সেভার 👑 ৫০% সাশ্রয়';
    badgeClasses = 'bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white';
    containerBorder = 'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-700 shadow-2xl shadow-amber-500/20';
    accentIconBg = 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400';
    monthlyText = 'প্রতি মাসে মাত্র ৳৯৯ • সেরা লং-টার্ম ভ্যালু!';
    buttonClasses = 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-amber-500/30';
  } else if (isTopRankers) {
    badgeText = 'জনপ্রিয় 🌟 ৪১% সাশ্রয়';
    badgeClasses = 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 text-white';
    containerBorder = 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 shadow-2xl shadow-emerald-500/20';
    accentIconBg = 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400';
    monthlyText = 'প্রতি মাসে মাত্র ৳১১৬ • সিজন স্পেশাল!';
    buttonClasses = 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-500/30';
  }

  return (
    <div
      className={cn(
        'relative rounded-3xl p-1', // Border container
        containerBorder,
        'flex flex-col h-full transition-transform hover:-translate-y-1 duration-300',
      )}
    >
      <div className={cn(
        'absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg z-20 whitespace-nowrap',
        badgeClasses
      )}>
        {badgeText}
      </div>

      <div className="bg-white dark:bg-neutral-900 rounded-[22px] h-full flex flex-col overflow-hidden relative">
        {/* Background blobs */}
        {isMasterPro && (
          <>
            <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-amber-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-40 h-32 sm:h-40 bg-amber-500/10 rounded-full blur-3xl translate-y-10 -translate-x-10" />
          </>
        )}
        {isTopRankers && (
          <>
            <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-emerald-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-40 h-32 sm:h-40 bg-emerald-500/10 rounded-full blur-3xl translate-y-10 -translate-x-10" />
          </>
        )}

        <div className="p-5 sm:p-7 flex-1 flex flex-col items-center text-center relative z-10">
          <div
            className={cn(
              'w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 text-xl sm:text-2xl shadow-sm',
              accentIconBg
            )}
          >
            {isMasterPro ? (
              <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-500" />
            ) : isTopRankers ? (
              <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500" />
            ) : (
              <Zap className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-500" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-200 tracking-wider mb-2 font-anek">
            {plan.name}
          </h3>

          <div className="flex items-start justify-center gap-1 mb-1 relative">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-400 mt-1 sm:mt-2 font-anek">
              ৳
            </span>
            <span className="text-4xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tighter font-anek">
              {plan.price}
            </span>
            {plan.price > 0 && (
              <span className="text-neutral-500 dark:text-neutral-400 font-bold text-sm sm:text-base mt-auto mb-1.5 ml-1 font-anek">
                /{plan.duration_days ? `${plan.duration_days} দিন` : plan.billingCycle === 'Half-Yearly' ? '৬ মাস' : plan.billingCycle === 'Quarterly' ? '৩ মাস' : 'মাস'}
              </span>
            )}
          </div>

          <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-5 sm:mb-6 font-anek">
            {monthlyText}
          </p>

          <ul className="space-y-2.5 sm:space-y-3 w-full text-left mb-6 sm:mb-8 flex-1">
            {plan.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 font-anek"
              >
                <div
                  className={cn(
                    'w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    accentIconBg
                  )}
                >
                  <Check
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                    strokeWidth={3}
                  />
                </div>
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-auto w-full pt-2">
            <button
              onClick={onSelect}
              className={cn(
                'w-full py-3 sm:py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-95 font-anek',
                isCurrent
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 cursor-default'
                  : buttonClasses
              )}
            >
              {isCurrent ? 'বর্তমান প্ল্যান' : 'এই প্ল্যানটি নাও'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
