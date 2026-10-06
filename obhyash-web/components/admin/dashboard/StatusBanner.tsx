'use client';

import React from 'react';
import { Sparkles, ArrowRight, BookOpen, Laptop, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StatusBannerProps {
  title?: string;
  metric?: string;
  subtext?: string;
  buttonText?: string;
  onAction?: () => void;
  className?: string;
}

export const StatusBanner: React.FC<StatusBannerProps> = ({
  title = 'Upgrade to Pro',
  metric = '$4.20 / Month',
  subtext = '$50 Billed Annually',
  buttonText = 'Upgrade Now',
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative bg-[#0a666b] dark:bg-[#074f53] text-white rounded-3xl p-6 overflow-hidden shadow-card flex flex-col justify-between min-h-[220px]',
        className,
      )}
    >
      {/* Decorative Hand-drawn Vector Doodle Accents */}
      <svg
        className="absolute top-3 right-3 w-28 h-28 opacity-15 pointer-events-none stroke-white"
        fill="none"
        viewBox="0 0 100 100"
        strokeWidth="1.5"
      >
        {/* Book doodle */}
        <path d="M20,30 Q35,25 50,30 Q65,25 80,30 L80,75 Q65,70 50,75 Q35,70 20,75 Z" />
        <path d="M50,30 L50,75" />
        {/* Sparkle star */}
        <path d="M85,15 L88,23 L96,25 L88,27 L85,35 L82,27 L74,25 L82,23 Z" />
        {/* Laptop doodle */}
        <rect x="25" y="45" width="30" height="20" rx="2" strokeDasharray="2 2" />
        <line x1="20" y1="67" x2="60" y2="67" />
      </svg>

      {/* Top Header */}
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 backdrop-blur-md text-emerald-100">
            <Zap className="w-3 h-3 text-[#c6f634]" />
            {title}
          </span>
        </div>
      </div>

      {/* Middle Metric / Value */}
      <div className="relative z-10 my-3">
        <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white select-all">
          {metric}
        </h3>
        <p className="text-xs text-teal-100/80 font-medium mt-1">
          {subtext}
        </p>
      </div>

      {/* Action Button: Neo-Lime Capsule */}
      <div className="relative z-10 pt-1">
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#c6f634] hover:bg-[#b8ea27] text-slate-950 font-bold rounded-full text-xs shadow-md transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <span>{buttonText}</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

export default StatusBanner;
