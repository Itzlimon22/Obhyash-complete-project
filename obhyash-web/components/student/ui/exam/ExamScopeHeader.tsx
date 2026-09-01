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
        "my-2 rounded-2xl border transition-all duration-200 overflow-hidden font-['HindSiliguri']",
        isExpanded
          ? "bg-white dark:bg-[#141417] border-emerald-500/40 dark:border-emerald-600/40 shadow-md shadow-emerald-900/5"
          : "bg-white dark:bg-[#141417] border-neutral-200 dark:border-[#27272A] shadow-sm",
        className
      )}
    >
      {/* ── Header Row (Accordion Trigger) ── */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition select-none"
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Emoji Badge */}
          <div className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-[#1F1F24] border border-neutral-200 dark:border-[#2E2E33] flex items-center justify-center text-base shrink-0">
            {emoji || "📖"}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-base font-bold text-neutral-900 dark:text-white truncate leading-tight">
              {BanglaNameHelper.formatSubject(subjectName, subjectName)}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
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
              "px-2.5 py-1 rounded-lg border text-xs font-bold transition flex items-center gap-1",
              isExpanded
                ? "bg-emerald-50 dark:bg-[#064E3B]/50 border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300"
                : "bg-neutral-100 dark:bg-[#1F1F24] border-neutral-200 dark:border-[#2E2E33] text-neutral-700 dark:text-neutral-300"
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
        <div className="px-4 pb-4 pt-1 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col gap-3 animate-in fade-in duration-200">
          {/* Chapters List */}
          {cleanChapters.length > 0 ? (
            <div>
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1.5 uppercase tracking-wider">
                অধ্যায়সমূহ ({BanglaNameHelper.toBanglaNumeral(cleanChapters.length)}টি)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cleanChapters.map((ch, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#1C1C20] border border-neutral-200 dark:border-[#2A2A30] text-neutral-800 dark:text-neutral-200 text-xs font-semibold"
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
              <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400 block mb-1.5 uppercase tracking-wider">
                টপিকসমূহ ({BanglaNameHelper.toBanglaNumeral(cleanTopics.length)}টি)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {cleanTopics.map((top, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium"
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
