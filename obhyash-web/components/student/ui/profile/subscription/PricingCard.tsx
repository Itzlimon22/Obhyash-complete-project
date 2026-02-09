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
            <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl -translate-y-10 translate-x-10" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl translate-y-10 -translate-x-10" />
          </>
        )}

        <div className="p-8 flex-1 flex flex-col items-center text-center relative z-10">
          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl shadow-sm',
              isBestValue
                ? 'bg-gradient-to-br from-indigo-500 to-rose-500 text-white shadow-rose-500/20'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400',
            )}
          >
            {isBestValue ? (
              <Crown className="w-7 h-7" />
            ) : (
              <Zap className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-lg font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
            {plan.name}
          </h3>

          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
              {plan.currency}
              {plan.price}
            </span>
            <span className="text-neutral-400 font-bold">
              /{plan.billingCycle}
            </span>
          </div>

          <ul className="space-y-3 w-full text-left mb-8">
            {plan.features.map((feature, idx) => (
              <li
                key={idx}
                className="flex items-center gap-3 text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                    isBestValue
                      ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
                  )}
                >
                  <Check className="w-3 h-3" strokeWidth={3} />
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
                'w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-xl active:scale-95',
                isCurrent
                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-default shadow-none'
                  : isBestValue
                    ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-rose-500/25 hover:shadow-rose-500/40'
                    : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200',
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
