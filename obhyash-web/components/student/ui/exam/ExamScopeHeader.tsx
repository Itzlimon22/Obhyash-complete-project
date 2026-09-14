"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, BookOpen, Layers } from "lucide-react";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";

export interface ExamScopeHeaderProps {
  subjectName: string;
  chapters?: string[];
  topics?: string[];
  initiallyExpanded?: boolean;
  className?: string;
}

export const ExamScopeHeader: React.FC<ExamScopeHeaderProps> = ({
  subjectName,
  chapters = [],
  topics = [],
  initiallyExpanded = false,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(initiallyExpanded);

  const cleanChapters = (chapters || [])
    .filter((c) => c && c.trim().length > 0 && c.toLowerCase() !== "all")
    .sort((a, b) => {
      const idxA = BanglaNameHelper.getChapterSortIndex(a, a);
      const idxB = BanglaNameHelper.getChapterSortIndex(b, b);
      if (idxA !== idxB) return idxA - idxB;
      return a.localeCompare(b);
    });

  const cleanTopics = (topics || []).filter(
    (t) => t && t.trim().length > 0 && t.toLowerCase() !== "all"
  );

  const hasSpecificChapters = cleanChapters.length > 0;
  const chapterCountLabel = hasSpecificChapters
    ? `${BanglaNameHelper.toBanglaNumeral(cleanChapters.length)}টি অধ্যায়`
    : "সম্পূর্ণ সিলেবাস";

  const emoji = BanglaNameHelper.getSubjectEmoji(subjectName, subjectName);

  return (
    <div
      className={cn(
        "my-2 rounded-[16px] border transition-all duration-200 overflow-hidden font-['HindSiliguri']",
        isExpanded
          ? "bg-white dark:bg-[#121212] border-[#12544F]/40 dark:border-[#12544F]/40 shadow-xs"
          : "bg-white dark:bg-[#121212] border-neutral-200/80 dark:border-white/[0.08] shadow-xs",
        className
      )}
    >
      {/* ── Header Row (Accordion Trigger) ── */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition select-none cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Emoji Badge */}
          <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-center text-base shrink-0">
            {emoji || "📖"}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="font-['Anek_Bangla',sans-serif] text-base font-bold text-neutral-900 dark:text-white truncate leading-tight">
              {BanglaNameHelper.formatSubject(subjectName, subjectName)}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 font-['Anek_Bangla',sans-serif]">
              <span className="truncate">{chapterCountLabel}</span>
              {cleanTopics.length > 0 && (
                <>
                  <span>•</span>
                  <span>{BanglaNameHelper.toBanglaNumeral(cleanTopics.length)}টি টপিক</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Status Pill + Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            className={cn(
              "px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1 font-['Anek_Bangla',sans-serif]",
              isExpanded
                ? "bg-[#12544F]/10 dark:bg-[#12544F]/25 border-[#12544F]/30 text-[#12544F] dark:text-[#2DD4BF]"
                : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200/80 dark:border-white/[0.08] text-neutral-700 dark:text-neutral-300"
            )}
          >
            <span>{chapterCountLabel}</span>
          </div>

          <div className="text-neutral-400 dark:text-neutral-500">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {/* ── Expanded Content (Chapters & Topics Pills) ── */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-1 border-t border-neutral-100 dark:border-white/[0.08] flex flex-col gap-3 animate-in fade-in duration-200">
          {/* Chapters List */}
          {cleanChapters.length > 0 ? (
            <div>
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1.5 uppercase tracking-wider font-['Anek_Bangla',sans-serif]">
                অধ্যায়সমূহ ({BanglaNameHelper.toBanglaNumeral(cleanChapters.length)}টি)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cleanChapters.map((ch, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-white/[0.08] text-neutral-800 dark:text-neutral-200 text-xs font-semibold font-['Anek_Bangla',sans-serif]"
                  >
                    {ch}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-xs text-neutral-500 dark:text-neutral-400 italic">
              সম্পূর্ণ বিষয়ের সকল অধ্যায় অন্তর্ভুক্ত রয়েছে।
            </div>
          )}

          {/* Topics List (if any) */}
          {cleanTopics.length > 0 && (
            <div>
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1.5 uppercase tracking-wider font-['Anek_Bangla',sans-serif]">
                টপিকসমূহ ({BanglaNameHelper.toBanglaNumeral(cleanTopics.length)}টি)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cleanTopics.map((top, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-[#12544F]/10 dark:bg-[#12544F]/25 border border-[#12544F]/20 dark:border-[#12544F]/30 text-[#12544F] dark:text-[#2DD4BF] text-[11px] font-medium font-['Anek_Bangla',sans-serif]"
                  >
                    {top}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExamScopeHeader;
