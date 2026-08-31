'use client';

import React from 'react';
import { ExamResult } from '@/lib/types';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import { Zap, Plus, HelpCircle, Calendar } from 'lucide-react';

interface RecentActivitySectionProps {
  history: ExamResult[];
}

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({
  history,
}) => {
  const recent = history.slice(0, 5);

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return '';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="bg-white dark:bg-[#18181B] rounded-[24px] border border-neutral-200 dark:border-[#27272A] shadow-sm font-['HindSiliguri',sans-serif] overflow-hidden">
      {/* Header Row */}
      <div className="p-5 sm:p-6 pb-3 sm:pb-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-[#E11D48]/20 flex items-center justify-center text-base shrink-0">
          ⚡
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white leading-tight">
          সর্বশেষ কার্যক্রম
        </h3>
      </div>

      {recent.length === 0 ? (
        <div className="p-10 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-[#1C1C1E] flex items-center justify-center text-neutral-400 dark:text-neutral-500 mb-3">
            <Plus className="w-6 h-6" />
          </div>
          <p className="text-sm sm:text-base font-medium text-neutral-500 dark:text-neutral-400">
            এখনও কোনো পরীক্ষা দেওয়া হয়নি।
          </p>
        </div>
      ) : (
        <div className="m-3 sm:m-4 mt-0 bg-neutral-50/70 dark:bg-[#262626]/25 rounded-[16px] overflow-hidden divide-y divide-neutral-200/70 dark:divide-[#1C1C1E]">
          {recent.map((exam, idx) => {
            const maxMarks = exam.totalMarks || exam.totalQuestions || 1;
            const scoreVal = exam.score ?? (exam as any).correctCount ?? 0;
            const pct =
              maxMarks > 0 ? Math.min(1.0, Math.max(0.0, scoreVal / maxMarks)) : 0;
            const pctRound = Math.round(pct * 100);

            const progressColor =
              pct >= 0.8
                ? '#059669' // Emerald
                : pct >= 0.5
                ? '#2563EB' // Blue
                : '#DC2626'; // Red

            const strokeDasharray = 2 * Math.PI * 18; // radius 18
            const strokeDashoffset = strokeDasharray * (1 - pct);

            return (
              <div
                key={exam.id || idx}
                className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-100/50 dark:hover:bg-[#202024]/50 transition-colors"
              >
                {/* Circular Score Ring */}
                <div className="relative w-13 h-13 shrink-0 flex items-center justify-center">
                  <svg className="w-13 h-13 transform -rotate-90" viewBox="0 0 44 44">
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      className="stroke-neutral-200 dark:stroke-[#27272A]"
                      strokeWidth="3.5"
                      fill="transparent"
                    />
                    <circle
                      cx="22"
                      cy="22"
                      r="18"
                      stroke={progressColor}
                      strokeWidth="3.5"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <span
                    className="absolute text-xs sm:text-sm font-black tabular-nums"
                    style={{ color: progressColor }}
                  >
                    {pctRound}%
                  </span>
                </div>

                {/* Exam Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] sm:text-base font-bold text-neutral-900 dark:text-white truncate">
                    {BanglaNameHelper.formatSubject(
                      exam.subjectLabel || exam.subject,
                      exam.subject
                    )}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                    {exam.date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(exam.date)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {BanglaNameHelper.toBanglaNumeral(exam.totalQuestions || 0)} প্রশ্ন
                    </span>
                  </div>
                </div>

                {/* Type Badge */}
                <div className="px-2.5 py-1 rounded-[8px] bg-neutral-200/60 dark:bg-[#1C1C1E] text-xs font-bold text-neutral-600 dark:text-neutral-400 shrink-0">
                  {(exam as any).examType || 'Practice'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentActivitySection;
