'use client';

import React from 'react';
import { SubscriptionPlan } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';

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
  const isFree = plan.price === 0;
  const isPremium =
    plan.colorTheme === 'emerald' || plan.colorTheme === 'indigo';

  // Dynamic theme classes
  const getCardClasses = () => {
    if (isCurrent) {
      return 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10';
    }
    if (plan.colorTheme === 'emerald') {
      return 'hover:ring-2 hover:ring-emerald-400/50 hover:shadow-emerald-500/20';
    }
    if (plan.colorTheme === 'indigo') {
      return 'hover:ring-2 hover:ring-indigo-400/50 hover:shadow-indigo-500/20';
    }
    return 'hover:ring-1 hover:ring-neutral-300 dark:hover:ring-neutral-600';
  };

  const getGradientBg = () => {
    if (plan.colorTheme === 'emerald') {
      return 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent dark:from-emerald-500/20 dark:via-teal-500/10';
    }
    if (plan.colorTheme === 'indigo') {
      return 'bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10';
    }
    return 'bg-neutral-50/50 dark:bg-neutral-800/30';
  };

  const getAccentColor = () => {
    if (plan.colorTheme === 'emerald')
      return 'text-emerald-600 dark:text-emerald-400';
    if (plan.colorTheme === 'indigo')
      return 'text-indigo-600 dark:text-indigo-400';
    return 'text-neutral-600 dark:text-neutral-400';
  };

  const getButtonClasses = () => {
    if (isCurrent) {
      return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-default border border-neutral-200 dark:border-neutral-700';
    }
    if (plan.colorTheme === 'emerald') {
      return 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25';
    }
    if (plan.colorTheme === 'indigo') {
      return 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25';
    }
    return 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-100';
  };

  const PlanIcon = () => {
    if (plan.colorTheme === 'emerald') return <Crown className="w-5 h-5" />;
    if (plan.colorTheme === 'indigo') return <Zap className="w-5 h-5" />;
    return <Sparkles className="w-5 h-5" />;
  };

  return (
    <div
      className={cn(
        'relative rounded-2xl md:rounded-3xl flex flex-col h-full transition-all duration-300 overflow-hidden',
        'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm border border-neutral-200/60 dark:border-neutral-800/60',
        'shadow-xl hover:shadow-2xl hover:-translate-y-1',
        getCardClasses(),
      )}
    >
      {/* Popular Badge */}
      {plan.isPopular && (
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-400 blur-md opacity-60 rounded-full" />
            <div className="relative px-4 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-lg">
              🔥 সেরা অফার
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Badge */}
      {isCurrent && (
        <div className="absolute top-3 right-3 z-10">
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
              Active
            </span>
          </div>
        </div>
      )}

      {/* Gradient Background */}
      <div
        className={cn('absolute inset-0 pointer-events-none', getGradientBg())}
      />

      {/* Header */}
      <div className="relative p-5 md:p-6 text-center border-b border-neutral-100/50 dark:border-neutral-800/50">
        {/* Plan Icon */}
        <div
          className={cn(
            'w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center',
            isPremium
              ? 'bg-gradient-to-br from-white/80 to-white/40 dark:from-neutral-800 dark:to-neutral-800/50 shadow-lg'
              : 'bg-neutral-100 dark:bg-neutral-800',
          )}
        >
          <span className={getAccentColor()}>
            <PlanIcon />
          </span>
        </div>

        <h3
          className={cn(
            'text-sm font-bold uppercase tracking-widest mb-2',
            getAccentColor(),
          )}
        >
          {plan.name}
        </h3>

        {/* Price */}
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white leading-none">
            {isFree ? 'ফ্রি' : `${plan.currency}${plan.price}`}
          </span>
          {!isFree && (
            <span className="text-neutral-500 dark:text-neutral-400 text-xs font-bold">
              /{plan.billingCycle}
            </span>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="relative p-5 md:p-6 flex flex-col flex-1">
        <ul className="space-y-3 mb-6 flex-1">
          {plan.features.map((feature, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 text-sm font-medium text-neutral-600 dark:text-neutral-300"
            >
              <div
                className={cn(
                  'mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                  isPremium
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500',
                )}
              >
                <Check className="w-3 h-3" strokeWidth={3} />
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <button
          onClick={onSelect}
          disabled={isCurrent}
          className={cn(
            'w-full py-3.5 md:py-3 rounded-xl font-bold text-sm tracking-wide transition-all duration-200',
            'active:scale-[0.98] disabled:active:scale-100',
            getButtonClasses(),
          )}
        >
          {isCurrent
            ? '✓ বর্তমান প্ল্যান'
            : isPremium
              ? '🚀 আপগ্রেড করুন'
              : 'বেছে নিন'}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;
