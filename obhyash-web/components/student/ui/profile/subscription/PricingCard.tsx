'use client';

import React from 'react';
import { SubscriptionPlan } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, Crown, Zap } from 'lucide-react';

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
  const isPremium = plan.price > 0;
  // Assuming the higher priced plan (or specifically named one) is the "Best Value"
  const isBestValue = plan.price === 299 || plan.billingCycle.includes('3');

  return (
    <div
      className={cn(
        'relative rounded-3xl p-1', // Border container
        isBestValue
          ? 'bg-gradient-to-b from-rose-500 via-purple-500 to-indigo-500 shadow-2xl shadow-rose-500/20'
          : 'bg-neutral-200 dark:bg-neutral-800',
        'flex flex-col h-full transition-transform hover:-translate-y-1 duration-300',
      )}
    >
      {isBestValue && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-600 to-indigo-600 text-white text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-20 whitespace-nowrap">
          সেরা অফার 🔥
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-[22px] h-full flex flex-col overflow-hidden relative">
        {/* Background blobs */}
        {isBestValue && (
          <>
            <div className="absolute top-0 right-0 w-32 sm:w-40 h-32 sm:h-40 bg-rose-500/5 rounded-full blur-3xl -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-32 sm:w-40 h-32 sm:h-40 bg-indigo-500/5 rounded-full blur-3xl translate-y-10 -translate-x-10" />
          </>
        )}

        <div className="p-5 sm:p-8 flex-1 flex flex-col items-center text-center relative z-10">
          <div
            className={cn(
              'w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 text-xl sm:text-2xl shadow-sm',
              isBestValue
                ? 'bg-gradient-to-br from-indigo-500 to-rose-500 text-white shadow-rose-500/20'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
            )}
          >
            {isBestValue ? (
              <Crown className="w-6 h-6 sm:w-7 sm:h-7" />
            ) : (
              <Zap className="w-6 h-6 sm:w-7 sm:h-7" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            {plan.name}
          </h3>

          <div className="flex items-start justify-center gap-1 mb-5 sm:mb-8 relative">
            <span className="text-2xl sm:text-3xl font-bold text-neutral-400 mt-1 sm:mt-2">
              {plan.currency}
            </span>
            <span className="text-5xl sm:text-6xl font-black text-neutral-900 dark:text-white tracking-tighter">
              {plan.price}
            </span>
          </div>

          <ul className="space-y-2 sm:space-y-3 w-full text-left mb-5 sm:mb-8">
            {plan.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                <div
                  className={cn(
                    'w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0',
                    isBestValue
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
                  )}
                >
                  <Check
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3"
                    strokeWidth={3}
                  />
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <div className="mt-auto w-full">
            <button
              onClick={onSelect}
              disabled={isCurrent}
              className={cn(
                'w-full py-3 sm:py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-95',
                isCurrent
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-default shadow-none'
                  : 'bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-emerald-500/25 hover:shadow-emerald-500/40',
              )}
            >
              {isCurrent ? 'বর্তমান প্ল্যান' : 'পেমেন্ট করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingCard;
