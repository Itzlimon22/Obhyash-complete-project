'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { FlashcardResult } from './FlashcardMode';
import { Question } from '@/lib/types';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';

interface PracticeSummaryProps {
  results: FlashcardResult[];
  mode?: 'flashcard' | 'exam';
  practicedQuestions?: Question[];
  onPracticeStruggling: (questions: Question[]) => void;
  onBack: () => void;
}

export const PracticeSummary: React.FC<PracticeSummaryProps> = ({
  results,
  onPracticeStruggling,
  onBack,
}) => {
  const { gotItCount, strugglingCount, total, struggling } = useMemo(() => {
    const got = results.filter((r) => r.grade === 'got_it');
    const str = results.filter((r) => r.grade === 'struggling');
    return {
      gotItCount: got.length,
      strugglingCount: str.length,
      total: results.length,
      struggling: str.map((r) => r.question),
    };
  }, [results]);

  const percentage = total > 0 ? Math.round((gotItCount / total) * 100) : 0;
  const circumference = 2 * Math.PI * 54;

  const feedbackTitle =
    percentage >= 80
      ? 'অসাধারণ!'
      : percentage >= 50
      ? 'ভালো প্রচেষ্টা!'
      : 'অনুশীলন শেষ!';

  const feedbackText =
    percentage >= 80
      ? 'তুমি চমৎকার ফলাফল করেছো, চালিয়ে যাও!'
      : percentage >= 50
      ? 'খুব কাছাকাছি! একটু জোর দিলেই আরও ভালো হবে।'
      : 'হতাশ হওয়ার কিছু নেই, আরেকবার চেষ্টা করো।';

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-black flex flex-col justify-between p-6 sm:p-8 font-sans">
      <div className="max-w-md w-full mx-auto my-auto flex flex-col items-center text-center">
        {/* ── Title & Message ── */}
        <div className="mt-4 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#111827] dark:text-white mb-1.5">
            {feedbackTitle}
          </h2>
          <p className="text-sm leading-relaxed text-[#6B7280] dark:text-[#9CA3AF] max-w-xs mx-auto">
            {feedbackText}
          </p>
        </div>

        {/* ── Score Ring (Matching Flutter CustomPaint 1:1) ── */}
        <div className="relative w-44 h-44 flex items-center justify-center mb-8">
          {/* Outer glow */}
          <div className="absolute w-36 h-36 rounded-full bg-[#10B981]/15 blur-2xl pointer-events-none" />

          <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-[#F3F4F6] dark:text-[#27272A]"
            />
            {/* Animated progress arc */}
            <motion.circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="url(#practiceScoreGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 50}
              initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
              animate={{
                strokeDashoffset:
                  2 * Math.PI * 50 - (2 * Math.PI * 50 * percentage) / 100,
              }}
              transition={{ delay: 0.15, duration: 1.1, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient
                id="practiceScoreGrad"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center percentage label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black text-[#111827] dark:text-white leading-none">
              {percentage}%
            </span>
            <span className="text-xs font-semibold text-[#6B7280] dark:text-[#9CA3AF] mt-1">
              সঠিক
            </span>
          </div>
        </div>

        {/* ── Stats Grid (Matching Flutter _StatCard 1:1) ── */}
        <div className="grid grid-cols-3 gap-3 w-full mb-8">
          {/* Card 1: মোট প্রশ্ন */}
          <div className="py-4 px-2 rounded-2xl bg-[#EFF6FF] dark:bg-[#1E3A8A]/30 border-[1.5px] border-[#3B82F6]/20 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-[#3B82F6] dark:text-[#60A5FA] leading-none mb-1">
              {BanglaNameHelper.toBanglaNumeral(total)}
            </span>
            <span className="text-xs font-bold text-[#4B5563] dark:text-[#D1D5DB]">
              মোট প্রশ্ন
            </span>
          </div>

          {/* Card 2: পেরেছি */}
          <div className="py-4 px-2 rounded-2xl bg-[#ECFDF5] dark:bg-[#064E3B]/30 border-[1.5px] border-[#10B981]/20 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-[#10B981] leading-none mb-1">
              {BanglaNameHelper.toBanglaNumeral(gotItCount)}
            </span>
            <span className="text-xs font-bold text-[#4B5563] dark:text-[#D1D5DB]">
              পেরেছি
            </span>
          </div>

          {/* Card 3: ভুল হয়েছে */}
          <div className="py-4 px-2 rounded-2xl bg-[#FEF2F2] dark:bg-[#7F1D1D]/30 border-[1.5px] border-[#EF4444]/20 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-black text-[#EF4444] leading-none mb-1">
              {BanglaNameHelper.toBanglaNumeral(strugglingCount)}
            </span>
            <span className="text-xs font-bold text-[#4B5563] dark:text-[#D1D5DB]">
              ভুল হয়েছে
            </span>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="w-full space-y-3">
          {struggling.length > 0 && (
            <button
              type="button"
              onClick={() => onPracticeStruggling(struggling)}
              className="w-full py-4 px-5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#059669] to-[#047857] shadow-[0_6px_16px_rgba(5,150,105,0.3)] hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={18} className="text-white" />
              <span>
                ভুলগুলো আবার অনুশীলন করো ({BanglaNameHelper.toBanglaNumeral(struggling.length)})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onBack}
            className="w-full py-4 px-5 rounded-2xl font-bold text-base text-[#111827] dark:text-white bg-white dark:bg-[#27272A] border-[1.5px] border-[#E5E7EB] dark:border-[#3F3F46] hover:bg-neutral-50 dark:hover:bg-[#333338] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
          >
            অনুশীলনে ফিরে যাও
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSummary;
