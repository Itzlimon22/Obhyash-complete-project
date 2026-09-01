'use client';

import React from 'react';
import {
  Trophy,
  Clock,
  Target,
  CheckCircle2,
  XCircle,
  HelpCircle,
  MinusCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ResultStatsProps {
  percentage: number;
  finalScore: number;
  totalPoints: number;
  timeTaken: number; // in seconds
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  negativeMarking: number;
  negativeMarksDeduction: number;
}

export const ResultStats: React.FC<ResultStatsProps> = ({
  percentage,
  finalScore,
  totalPoints,
  timeTaken,
  totalQuestions,
  correctCount,
  wrongCount,
  skippedCount,
  negativeMarking,
  negativeMarksDeduction,
}) => {
  const answeredCount = correctCount + wrongCount;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const roundedPercentage = Math.round(percentage);

  // Dot color for accuracy ring
  const accuracyColor =
    roundedPercentage >= 75
      ? '#10B981'
      : roundedPercentage >= 40
        ? '#F59E0B'
        : '#EF4444';

  return (
    <div className="flex flex-col gap-4 font-['HindSiliguri',sans-serif]">
      {/* ── 1. Top 3 Cards Row (Matching Flutter Exact Layout) ── */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Card 1: সঠিকতা (Accuracy) */}
        <div className="p-3 sm:p-4 rounded-[18px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] shadow-xs flex flex-col items-center justify-between text-center min-h-[140px] sm:min-h-[155px]">
          <div className="flex-1 flex items-center justify-center pt-1">
            {/* Circular Ring with Centered Percentage and Top Dot */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                {/* Background Ring */}
                <path
                  className="text-neutral-100 dark:text-[#27272A]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {/* Active Progress Ring */}
                <path
                  className="transition-all duration-1000 ease-out"
                  strokeDasharray={`${Math.max(roundedPercentage, 2)}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke={accuracyColor}
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>

              {/* Indicator Dot at top of ring */}
              <div
                className="absolute top-0 w-2 h-2 rounded-full"
                style={{ backgroundColor: accuracyColor }}
              />

              {/* Center Percentage */}
              <span className="absolute font-black text-sm sm:text-base text-neutral-900 dark:text-white">
                {roundedPercentage}%
              </span>
            </div>
          </div>

          <span className="text-xs sm:text-[13px] font-bold text-[#64748B] dark:text-[#94A3B8] mt-2">
            সঠিকতা
          </span>
        </div>

        {/* Card 2: প্রাপ্ত নম্বর (Score) */}
        <div className="p-3 sm:p-4 rounded-[18px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] shadow-xs flex flex-col items-center justify-between text-center min-h-[140px] sm:min-h-[155px]">
          {/* Trophy Icon Capsule */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#FEE2E2] dark:bg-[#7F1D1D]/30 flex items-center justify-center text-[#EF4444] dark:text-[#F87171] mt-1">
            <Trophy size={18} />
          </div>

          <div className="flex flex-col items-center my-0.5">
            <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white leading-tight">
              {finalScore.toFixed(2).replace(/\.00$/, '')}
            </span>
            <span className="text-[11px] sm:text-xs font-semibold text-[#94A3B8] dark:text-[#64748B]">
              / {totalPoints}
            </span>
          </div>

          <span className="text-xs sm:text-[13px] font-bold text-[#64748B] dark:text-[#94A3B8]">
            প্রাপ্ত নম্বর
          </span>
        </div>

        {/* Card 3: সময় লেগেছে (Time Taken) */}
        <div className="p-3 sm:p-4 rounded-[18px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] shadow-xs flex flex-col items-center justify-between text-center min-h-[140px] sm:min-h-[155px]">
          {/* Timer Icon Capsule */}
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#CCFBF1] dark:bg-[#134E4A]/40 flex items-center justify-center text-[#0D9488] dark:text-[#2DD4BF] mt-1">
            <Clock size={18} />
          </div>

          <div className="flex flex-col items-center my-0.5">
            <span className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-tight">
              {formatDuration(timeTaken)}
            </span>
          </div>

          <span className="text-xs sm:text-[13px] font-bold text-[#64748B] dark:text-[#94A3B8]">
            সময় লেগেছে
          </span>
        </div>
      </div>

      {/* ── 2. Detailed Performance Table Card (Matching Flutter Exactly) ── */}
      <div className="rounded-[18px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] shadow-xs overflow-hidden">
        {/* Table Title Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-white dark:bg-[#18181B] border-b border-[#E2E8F0] dark:border-[#27272A]">
          <h4 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            ফলাফল বিস্তারিত
          </h4>
        </div>

        {/* 2-Column Table Grid */}
        <div className="grid grid-cols-2 divide-x divide-[#E2E8F0] dark:divide-[#27272A]">
          {/* Left Column */}
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#27272A]">
            {/* Row 1: মোট প্রশ্ন */}
            <div className="px-3 sm:px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                মোট প্রশ্ন
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {totalQuestions}
              </span>
            </div>

            {/* Row 2: উত্তর দেওয়া হয়েছে */}
            <div className="px-3 sm:px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                উত্তর দেওয়া হয়েছে
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {answeredCount}
              </span>
            </div>

            {/* Row 3: উত্তর দেওয়া হয়নি */}
            <div className="px-3 sm:px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                উত্তর দেওয়া হয়নি
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {skippedCount}
              </span>
            </div>
          </div>

          {/* Right Column */}
          <div className="divide-y divide-[#E2E8F0] dark:divide-[#27272A]">
            {/* Row 1: সঠিক উত্তর */}
            <div className="px-3 sm:px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                সঠিক উত্তর
              </span>
              <span className="font-bold text-[#10B981]">
                {correctCount}
              </span>
            </div>

            {/* Row 2: ভুল উত্তর */}
            <div className="px-3 sm:px-4 py-3 flex items-center justify-between text-xs sm:text-sm">
              <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                ভুল উত্তর
              </span>
              <span className="font-bold text-[#EF4444]">
                {wrongCount}
              </span>
            </div>

            {/* Row 3: নেগেটিভ মার্কিং (Highlighted Tint) */}
            <div className="px-3 sm:px-4 py-3 flex items-center justify-between text-xs sm:text-sm bg-[#FEF2F2]/60 dark:bg-[#7F1D1D]/15">
              <span className="text-[#64748B] dark:text-[#94A3B8] font-medium">
                নেগেটিভ ({negativeMarking}x)
              </span>
              <span className="font-bold text-[#EF4444]">
                -{negativeMarksDeduction.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Highlighted Footer Summary Row */}
        <div className="px-4 sm:px-5 py-3.5 bg-white dark:bg-[#18181B] border-t border-[#E2E8F0] dark:border-[#27272A] flex items-center justify-between">
          <span className="font-bold text-sm sm:text-base text-neutral-900 dark:text-white">
            মোট প্রাপ্ত নম্বর
          </span>
          <span className="font-black text-base sm:text-lg text-[#10B981]">
            {finalScore.toFixed(2).replace(/\.00$/, '')} / {totalPoints}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ResultStats;
