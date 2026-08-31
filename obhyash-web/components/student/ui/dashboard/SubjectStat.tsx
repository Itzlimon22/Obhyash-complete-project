"use client";

import React from "react";
import { BarChart2, ChevronRight } from "lucide-react";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";

export interface SubjectData {
  id?: string;
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
}

export interface SubjectStatProps {
  data: SubjectData[];
  isLoading?: boolean;
  onSubjectClick?: (subjectId: string) => void;
}

export const SubjectStat: React.FC<SubjectStatProps> = ({
  data,
  isLoading = false,
  onSubjectClick,
}) => {
  if (isLoading) {
    return (
      <div className="p-5 sm:p-6 rounded-[20px] bg-white dark:bg-[#000000] border border-neutral-200 dark:border-[#2A2A2A] shadow-sm animate-pulse font-['HindSiliguri']">
        <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-lg mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-neutral-100 dark:bg-neutral-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 sm:p-6 rounded-[20px] bg-white dark:bg-[#000000] border border-neutral-200 dark:border-[#2A2A2A] shadow-sm font-['HindSiliguri']">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#059669]/20 text-emerald-600 dark:text-emerald-400">
          <BarChart2 size={18} strokeWidth={2.5} />
        </div>
        <h3 className="text-lg sm:text-xl font-black text-neutral-900 dark:text-white">
          সাবজেক্ট ভিত্তিক রিপোর্ট
        </h3>
      </div>

      {/* Content */}
      {data.length === 0 ? (
        <div className="py-8 text-center rounded-xl bg-neutral-50 dark:bg-[#1C1C1E]/50 border border-neutral-200 dark:border-[#27272A] text-neutral-500 dark:text-neutral-400 text-sm font-bold">
          এখনও কোনো পরীক্ষা দেওয়া হয়নি।
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((subject, idx) => {
            const accuracy =
              subject.total > 0
                ? Math.round((subject.correct / subject.total) * 100)
                : 0;
            const emoji = BanglaNameHelper.getSubjectEmoji(
              subject.name,
              subject.id || subject.name
            );

            let badgeColor =
              "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
            if (accuracy < 50) {
              badgeColor =
                "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800";
            } else if (accuracy < 70) {
              badgeColor =
                "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
            }

            return (
              <div
                key={idx}
                onClick={() =>
                  onSubjectClick && onSubjectClick(subject.id || subject.name)
                }
                className="p-3.5 sm:p-4 rounded-2xl bg-[#F8FAFC] dark:bg-[#121214] border border-neutral-200 dark:border-[#222226] hover:border-neutral-300 dark:hover:border-neutral-700 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1C1C20] border border-neutral-200 dark:border-[#2A2A30] flex items-center justify-center text-lg shrink-0">
                      {emoji}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {BanglaNameHelper.formatSubject(subject.name, subject.name)}
                      </h4>
                      <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <span>
                          {BanglaNameHelper.toBanglaNumeral(subject.total)}টি প্রশ্ন
                        </span>
                        <span>•</span>
                        <span>
                          {BanglaNameHelper.toBanglaNumeral(subject.correct)} সঠিক
                        </span>
                        <span>•</span>
                        <span>
                          {BanglaNameHelper.toBanglaNumeral(subject.wrong)} ভুল
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-lg border text-xs font-black",
                        badgeColor
                      )}
                    >
                      {BanglaNameHelper.toBanglaNumeral(accuracy)}%
                    </span>
                    <ChevronRight
                      size={18}
                      className="text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-white transition-colors"
                    />
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${(subject.correct / Math.max(subject.total, 1)) * 100}%`,
                    }}
                    className="h-full bg-emerald-500"
                  />
                  <div
                    style={{
                      width: `${(subject.wrong / Math.max(subject.total, 1)) * 100}%`,
                    }}
                    className="h-full bg-red-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SubjectStat;
