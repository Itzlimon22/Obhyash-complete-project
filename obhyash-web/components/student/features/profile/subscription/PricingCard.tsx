import React from 'react';
import { SubscriptionPlan } from '@/lib/types';

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

  // Compact theme classes
  const getThemeClasses = () => {
    if (plan.colorTheme === 'emerald')
      return 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-emerald-500/10';
    if (plan.colorTheme === 'indigo')
      return 'border-emerald-500 ring-1 ring-emerald-500/20 shadow-emerald-500/10';
    return 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600';
  };

  const getHeaderBg = () => {
    if (plan.colorTheme === 'emerald')
      return 'bg-gradient-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20';
    if (plan.colorTheme === 'indigo')
      return 'bg-gradient-to-br from-emerald-50 to-emerald-50 dark:from-emerald-900/20 dark:to-emerald-900/20';
    return 'bg-slate-50 dark:bg-slate-800/50';
  };

  const getTitleColor = () => {
    if (plan.colorTheme === 'emerald')
      return 'text-emerald-700 dark:text-emerald-400';
    if (plan.colorTheme === 'indigo')
      return 'text-emerald-700 dark:text-emerald-400';
    return 'text-slate-600 dark:text-slate-400';
  };

  return (
    <div
      className={`
        relative rounded-xl flex flex-col h-full transition-all duration-300 overflow-hidden
        ${
          isCurrent
            ? `bg-white dark:bg-slate-900 border-2 ${getThemeClasses()} shadow-md scale-[1.01]`
            : `bg-white dark:bg-slate-900 border ${getThemeClasses()} shadow-sm hover:shadow-lg hover:-translate-y-1`
        }
      `}
    >
      {plan.isPopular && (
        <div className="absolute top-0 right-0 bg-gradient-to-bl from-emerald-500 to-emerald-500 text-white text-[9px] font-bold uppercase px-3 py-1 rounded-bl-xl shadow-sm z-10">
          Best Value
        </div>
      )}

      {/* Compact Header */}
      <div
        className={`p-4 border-b border-slate-100 dark:border-slate-800/50 ${getHeaderBg()}`}
      >
        <h3
          className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${getTitleColor()}`}
        >
          {plan.name}
        </h3>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
            {isFree ? 'ফ্রি' : `${plan.currency}${plan.price}`}
          </span>
          {!isFree && (
            <span className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase">
              {plan.billingCycle === 'Yearly'
                ? '/বছর'
                : plan.billingCycle === 'Monthly'
                  ? '/১ মাস'
                  : plan.billingCycle === 'Quarterly'
                    ? '/৩ মাস'
                    : `/${plan.billingCycle}`}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <ul className="space-y-2 mb-5 flex-1">
          {plan.features.map((feature, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 leading-snug"
            >
              <div
                className={`mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${plan.colorTheme === 'slate' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}
              >
                <svg
                  className="w-2 h-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          disabled={isCurrent}
          className={`
                w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wide transition-all active:scale-95
                ${
                  isCurrent
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-default border border-slate-200 dark:border-slate-700'
                    : `text-white shadow-md shadow-${plan.colorTheme}-500/20 ${plan.colorTheme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' : plan.colorTheme === 'indigo' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-800 hover:bg-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200'}`
                }
            `}
        >
          {isCurrent ? 'বর্তমান প্ল্যাও' : 'বেছে নাও'}
        </button>
      </div>
    </div>
  );
};

export default PricingCard;
