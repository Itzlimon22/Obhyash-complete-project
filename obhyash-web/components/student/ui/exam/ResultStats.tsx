"use client";

import React from "react";
import { Trophy, Clock, Target, MinusCircle, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";

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
    if (mins > 0) {
      return `${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(
        secs
      )} সে.`;
    }
    return `${BanglaNameHelper.toBanglaNumeral(secs)} সেকেন্ড`;
  };

  const roundedPercentage = Math.round(percentage);

  return (
    <div className="flex flex-col gap-4 font-['HindSiliguri']">
      {/* ── 1. Top 3 Cards Row (Matching Flutter _CircularAccuracyCard & _StatCard) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Accuracy Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-0.5">
              সঠিকতা
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {BanglaNameHelper.toBanglaNumeral(roundedPercentage)}%
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold">
              {BanglaNameHelper.toBanglaNumeral(correctCount)}/{BanglaNameHelper.toBanglaNumeral(answeredCount || 1)} নির্ভুল
            </span>
          </div>

          {/* Circular Progress Ring */}
          <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-neutral-200 dark:text-neutral-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600 dark:text-blue-500 transition-all duration-1000 ease-out"
                strokeDasharray={`${roundedPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <Target size={18} className="absolute text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        {/* Score Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-0.5">
              প্রাপ্ত নম্বর
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-red-500 dark:text-red-400">
                {BanglaNameHelper.toBanglaNumeral(finalScore.toFixed(2).replace(/\.00$/, ""))}
              </span>
              <span className="text-sm font-bold text-neutral-400">
                / {BanglaNameHelper.toBanglaNumeral(totalPoints)}
              </span>
            </div>
            {negativeMarksDeduction > 0 && (
              <span className="text-[11px] text-red-500 font-semibold block">
                -{BanglaNameHelper.toBanglaNumeral(negativeMarksDeduction.toFixed(2))} নেগেটিভ
              </span>
            )}
          </div>

          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-center justify-center text-red-500 shrink-0">
            <Trophy size={22} />
          </div>
        </div>

        {/* Time Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-0.5">
              সময় লেগেছে
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400">
                {formatDuration(timeTaken)}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold">
              মোট ব্যয়িত সময়
            </span>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/50 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Clock size={22} />
          </div>
        </div>
      </div>

      {/* ── 2. Summary Table Card (Matching Flutter ResultStats Table) ── */}
      <div className="rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="px-4 py-3.5 bg-neutral-50 dark:bg-[#202024] border-b border-neutral-200 dark:border-[#27272A] flex items-center justify-between">
          <h4 className="text-base font-bold text-neutral-900 dark:text-white">
            ফলাফল বিস্তারিত
          </h4>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
            সংক্ষিপ্ত পরিসংখ্যান
          </span>
        </div>

        {/* 2-Column Table Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-100 dark:divide-neutral-800">
          {/* Left Column */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            <div className="px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">মোট প্রশ্ন</span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {BanglaNameHelper.toBanglaNumeral(totalQuestions)}টি
              </span>
            </div>

            <div className="px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                উত্তর দেওয়া হয়েছে
              </span>
              <span className="font-bold text-neutral-900 dark:text-white">
                {BanglaNameHelper.toBanglaNumeral(answeredCount)}টি
              </span>
            </div>

            <div className="px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                সঠিক উত্তর
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={15} />
                {BanglaNameHelper.toBanglaNumeral(correctCount)}টি
              </span>
            </div>
          </div>

          {/* Right Column */}
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            <div className="px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">ভুল উত্তর</span>
              <span className="font-bold text-red-500 dark:text-red-400 flex items-center gap-1">
                <XCircle size={15} />
                {BanglaNameHelper.toBanglaNumeral(wrongCount)}টি
              </span>
            </div>

            <div className="px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                উত্তর দেওয়া হয়নি
              </span>
              <span className="font-bold text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                <HelpCircle size={15} />
                {BanglaNameHelper.toBanglaNumeral(skippedCount)}টি
              </span>
            </div>

            <div className="px-4 py-3 flex items-center justify-between text-sm">
              <span className="text-neutral-600 dark:text-neutral-400 font-medium">
                নেগেটিভ মার্কিং কর্তন
              </span>
              <span className="font-bold text-red-500 dark:text-red-400 flex items-center gap-1">
                <MinusCircle size={15} />
                -{BanglaNameHelper.toBanglaNumeral(negativeMarksDeduction.toFixed(2))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultStats;
