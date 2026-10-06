'use client';

import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KpiVariant = 'lavender' | 'periwinkle' | 'mint';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtext: string;
  variant?: KpiVariant;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  badgeText?: string;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<
  KpiVariant,
  {
    container: string;
    badge: string;
    value: string;
    subtext: string;
    pillBg: string;
  }
> = {
  lavender: {
    container: 'bg-[#e0d6ff] dark:bg-[#2b214a] text-slate-900 dark:text-purple-100',
    badge: 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-purple-200',
    value: 'text-slate-950 dark:text-white',
    subtext: 'text-slate-700/80 dark:text-purple-200/70',
    pillBg: 'bg-black/10 dark:bg-white/10',
  },
  periwinkle: {
    container: 'bg-[#d0e2ff] dark:bg-[#1e2f4a] text-slate-900 dark:text-blue-100',
    badge: 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-blue-200',
    value: 'text-slate-950 dark:text-white',
    subtext: 'text-slate-700/80 dark:text-blue-200/70',
    pillBg: 'bg-black/10 dark:bg-white/10',
  },
  mint: {
    container: 'bg-[#c2f2d0] dark:bg-[#1a3828] text-slate-900 dark:text-emerald-100',
    badge: 'bg-black/10 dark:bg-white/10 text-slate-900 dark:text-emerald-200',
    value: 'text-slate-950 dark:text-white',
    subtext: 'text-slate-700/80 dark:text-emerald-200/70',
    pillBg: 'bg-black/10 dark:bg-white/10',
  },
};

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtext,
  variant = 'lavender',
  icon: Icon,
  trend,
  badgeText,
  className,
  onClick,
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'relative rounded-3xl p-6 transition-all duration-200 ease-out',
        'hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,0,0,0.06)]',
        'flex flex-col justify-between min-h-[170px]',
        styles.container,
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {/* Top Header Row with Pill */}
      <div className="flex items-center justify-between gap-2">
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide backdrop-blur-sm',
            styles.badge,
          )}
        >
          {Icon ? (
            <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-900/60 dark:bg-white/60 shrink-0" />
          )}
          <span>{badgeText || title}</span>
        </div>

        {trend && (
          <div
            className={cn(
              'inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full',
              trend.isPositive !== false
                ? 'text-emerald-900 bg-emerald-500/20 dark:text-emerald-300'
                : 'text-slate-800 bg-black/10 dark:text-slate-200 dark:bg-white/15',
            )}
          >
            {trend.isPositive !== false ? (
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      {/* Middle Bold Metric */}
      <div className="mt-4 mb-2">
        <h3
          className={cn(
            'text-3xl sm:text-4xl font-extrabold tracking-tight font-sans select-all',
            styles.value,
          )}
        >
          {value}
        </h3>
      </div>

      {/* Bottom Subtitle / Micro Trend */}
      <div className="flex items-center justify-between text-xs">
        <p className={cn('font-medium leading-relaxed truncate', styles.subtext)}>
          {subtext}
        </p>
      </div>
    </div>
  );
};

export default KpiCard;
