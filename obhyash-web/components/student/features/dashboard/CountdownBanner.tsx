'use client';

import React, { useMemo } from 'react';

// Static map: exam_target → exam date
export const EXAM_DATES: Record<string, Date> = {
  hsc_2026: new Date('2026-04-01'),
  hsc_2027: new Date('2027-04-01'),
  mbbs_2026: new Date('2026-10-05'),
  mbbs_2027: new Date('2027-10-05'),
  ssc_2026: new Date('2026-02-15'),
  ssc_2027: new Date('2027-02-15'),
  other: null as unknown as Date,
};

export const EXAM_LABELS: Record<string, string> = {
  hsc_2026: 'এইচএসসি ২০২৬',
  hsc_2027: 'এইচএসসি ২০২৭',
  mbbs_2026: 'মেডিকেল ভর্তি ২০২৬',
  mbbs_2027: 'মেডিকেল ভর্তি ২০২৭',
  ssc_2026: 'এসএসসি ২০২৬',
  ssc_2027: 'এসএসসি ২০২৭',
  other: 'আমার লক্ষ্য',
};

interface CountdownBannerProps {
  examTarget: string;
  onChangeTarget?: () => void;
}

const CountdownBanner: React.FC<CountdownBannerProps> = ({
  examTarget,
  onChangeTarget,
}) => {
  const { daysLeft, label, urgency } = useMemo(() => {
    const examDate = EXAM_DATES[examTarget];
    const label = EXAM_LABELS[examTarget] || 'আমার লক্ষ্য';

    if (!examDate) return { daysLeft: null, label, urgency: 'normal' as const };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.ceil(
      (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );

    const urgency =
      diff < 0
        ? ('past' as const)
        : diff <= 30
          ? ('critical' as const)
          : diff <= 90
            ? ('urgent' as const)
            : ('normal' as const);

    return { daysLeft: diff, label, urgency };
  }, [examTarget]);

  if (daysLeft === null) return null;

  const colorMap = {
    past: {
      bg: 'bg-neutral-100 dark:bg-neutral-800/60',
      border: 'border-neutral-200 dark:border-neutral-700',
      badge:
        'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300',
      num: 'text-neutral-600 dark:text-neutral-300',
      dot: 'bg-neutral-400',
    },
    critical: {
      bg: 'bg-red-50 dark:bg-red-950/20',
      border: 'border-red-200 dark:border-red-900/40',
      badge: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      num: 'text-red-600 dark:text-red-400',
      dot: 'bg-red-500 animate-pulse',
    },
    urgent: {
      bg: 'bg-amber-50 dark:bg-amber-950/20',
      border: 'border-amber-200 dark:border-amber-900/40',
      badge:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      num: 'text-amber-600 dark:text-amber-400',
      dot: 'bg-amber-500',
    },
    normal: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/20',
      border: 'border-emerald-200 dark:border-emerald-900/30',
      badge:
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      num: 'text-emerald-600 dark:text-emerald-500',
      dot: 'bg-emerald-500',
    },
  };

  const c = colorMap[urgency];

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border ${c.bg} ${c.border} mb-1`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className={`text-sm font-extrabold leading-tight ${c.num}`}>
            {daysLeft < 0 ? (
              'পরীক্ষার সময় শেষ'
            ) : daysLeft === 0 ? (
              'আজই পরীক্ষা! 🔥'
            ) : (
              <>
                <span className="text-lg">{daysLeft}</span>
                {' দিন বাকি'}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${c.badge}`}
        >
          {urgency === 'critical'
            ? '⚠️ শেষ মুহূর্ত'
            : urgency === 'urgent'
              ? '📅 প্রস্তুতি চলছে'
              : urgency === 'past'
                ? '✅ সম্পন্ন'
                : '🎯 লক্ষ্য'}
        </span>
        {onChangeTarget && (
          <button
            onClick={onChangeTarget}
            className="text-[10px] font-bold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors p-1"
            aria-label="Change exam target"
          >
            ✎
          </button>
        )}
      </div>
    </div>
  );
};

export default CountdownBanner;
