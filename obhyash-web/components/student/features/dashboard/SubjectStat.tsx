"use client";

import React, { useState } from "react";
import { ChevronDown, ArrowRight, BarChart2 } from "lucide-react";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";

interface SubjectData {
  id?: string;
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
}

interface SubjectStatProps {
  data: SubjectData[];
  onSubjectClick?: (subject: string) => void;
  isLoading?: boolean;
}

const SubjectItem: React.FC<{
  subject: SubjectData;
  onClick?: () => void;
}> = ({ subject, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const accuracy =
    subject.total > 0 ? Math.round((subject.correct / subject.total) * 100) : 0;

  // Colors matching Flutter SubjectStatCard
  let accBadgeClass = "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400";
  let leftBarColor = "bg-neutral-300 dark:bg-neutral-700";

  if (accuracy >= 80) {
    accBadgeClass = "bg-[#12544F]/12 dark:bg-[#12544F]/25 text-[#12544F] dark:text-[#34D399]";
    leftBarColor = "bg-[#12544F] dark:bg-[#34D399]";
  } else if (accuracy >= 50) {
    accBadgeClass = "bg-[#D97706]/12 dark:bg-[#D97706]/25 text-[#D97706] dark:text-[#FBBF24]";
    leftBarColor = "bg-[#D97706] dark:bg-[#FBBF24]";
  }

  const displayName = BanglaNameHelper.formatSubject(
    subject.id || "",
    subject.name
  );

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all duration-200 shadow-2xs overflow-hidden",
        isOpen
          ? "border-[#12544F] dark:border-[#12544F]/80 bg-white dark:bg-[#1A1A1D] shadow-xs"
          : "border-[#E5E7EB] dark:border-[#27272A] bg-white dark:bg-[#18181B] hover:border-neutral-300 dark:hover:border-neutral-700"
      )}
    >
      {/* Header Row */}
      <div
        className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer select-none group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={cn(
              "w-1 h-5 rounded-full transition-colors shrink-0",
              isOpen ? "bg-[#12544F] dark:bg-[#34D399]" : leftBarColor
            )}
          />
          <h4
            className={cn(
              "font-semibold text-sm sm:text-[14.5px] truncate transition-colors",
              isOpen
                ? "text-[#12544F] dark:text-[#34D399]"
                : "text-neutral-900 dark:text-neutral-100"
            )}
          >
            {displayName}
          </h4>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className={cn(
              "px-2 py-0.5 rounded-lg text-xs font-bold tabular-nums",
              accBadgeClass
            )}
          >
            {BanglaNameHelper.toBanglaNumeral(accuracy)}%
          </div>

          <div
            className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 transition-transform duration-200",
              isOpen ? "rotate-180 text-[#12544F] dark:text-[#34D399]" : "group-hover:text-neutral-600 dark:group-hover:text-neutral-300"
            )}
          >
            <ChevronDown size={16} />
          </div>
        </div>
      </div>

      {/* Accordion Expand Details */}
      {isOpen && (
        <div className="px-3.5 pb-4 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/30">
          {/* 3 Metric Chips: সঠিক, ভুল, স্কিপড */}
          <div className="grid grid-cols-3 gap-2 py-3">
            <div className="bg-white dark:bg-[#151518] p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center shadow-2xs">
              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                সঠিক
              </span>
              <span className="text-base sm:text-lg font-black text-[#12544F] dark:text-[#34D399] leading-tight tabular-nums">
                {BanglaNameHelper.toBanglaNumeral(subject.correct)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#151518] p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center shadow-2xs">
              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                ভুল
              </span>
              <span className="text-base sm:text-lg font-black text-[#740A03] dark:text-[#F87171] leading-tight tabular-nums">
                {BanglaNameHelper.toBanglaNumeral(subject.wrong)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#151518] p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800 text-center shadow-2xs">
              <span className="block text-[10px] text-neutral-400 dark:text-neutral-500 font-bold uppercase tracking-wider">
                স্কিপড
              </span>
              <span className="text-base sm:text-lg font-black text-neutral-500 dark:text-neutral-400 leading-tight tabular-nums">
                {BanglaNameHelper.toBanglaNumeral(subject.skipped)}
              </span>
            </div>
          </div>

          {/* Ratio Progress Bar */}
          <div className="h-2 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden flex mb-3">
            <div
              style={{
                width: `${(subject.correct / Math.max(subject.total, 1)) * 100}%`,
              }}
              className="h-full bg-[#12544F] dark:bg-[#34D399] transition-all"
            />
            <div
              style={{
                width: `${(subject.wrong / Math.max(subject.total, 1)) * 100}%`,
              }}
              className="h-full bg-[#740A03] dark:bg-[#F87171] transition-all"
            />
          </div>

          {/* Detailed Report Button */}
          {onClick && (
            <div className="flex justify-center mt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClick();
                }}
                className="text-xs font-bold text-[#12544F] hover:text-[#092328] dark:text-[#34D399] dark:hover:text-[#6EE7B7] flex items-center justify-center gap-1.5 transition-colors px-4 py-2 rounded-xl bg-[#E6F0EC] dark:bg-[#12544F]/20 hover:bg-[#12544F]/25 w-full cursor-pointer"
              >
                <span>বিস্তারিত রিপোর্ট দেখো</span>
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const SubjectStat: React.FC<SubjectStatProps> = ({
  data,
  onSubjectClick,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="p-5 rounded-[20px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm font-['HindSiliguri']">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#E6F0EC] dark:bg-[#12544F]/20 flex items-center justify-center text-[#12544F] dark:text-[#34D399]">
            <BarChart2 className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-sm sm:text-[15.5px] font-semibold text-neutral-900 dark:text-white">
            সাবজেক্ট ভিত্তিক রিপোর্ট
          </h3>
        </div>
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const attendedData = data.filter((s) => s.total > 0);

  return (
    <div className="p-4 sm:p-5 rounded-[20px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm font-['HindSiliguri']">
      {/* ── Header: BarChart Badge (Viridian Forest) + Title ── */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E6F0EC] dark:bg-[#12544F]/20 flex items-center justify-center text-[#12544F] dark:text-[#34D399]">
            <BarChart2 className="w-4.5 h-4.5" />
          </div>
          <h3 className="text-sm sm:text-[15.5px] font-semibold text-neutral-900 dark:text-white leading-tight">
            সাবজেক্ট ভিত্তিক রিপোর্ট
          </h3>
        </div>
      </div>

      {/* ── Subjects List ── */}
      {attendedData.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl bg-neutral-50 dark:bg-[#202024]/50 border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
          <p className="text-xs sm:text-[13px] text-neutral-500 dark:text-neutral-400 font-medium">
            এখনও কোনো পরীক্ষা দেওয়া হয়নি।
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {attendedData.map((subject) => (
            <SubjectItem
              key={subject.id || subject.name}
              subject={subject}
              onClick={
                onSubjectClick ? () => onSubjectClick(subject.id || "") : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectStat;
