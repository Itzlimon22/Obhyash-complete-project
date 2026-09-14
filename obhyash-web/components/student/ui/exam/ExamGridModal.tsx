"use client";

import React from "react";
import { X, Check, Bookmark, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";

export interface ExamGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalQuestions: number;
  userAnswers: Record<string | number, number>;
  flaggedQuestions: Set<string | number>;
  questionIds: (string | number)[];
  onSelectQuestion: (index: number) => void;
}

export const ExamGridModal: React.FC<ExamGridModalProps> = ({
  isOpen,
  onClose,
  totalQuestions,
  userAnswers,
  flaggedQuestions,
  questionIds,
  onSelectQuestion,
}) => {
  if (!isOpen) return null;

  const answeredCount = Object.keys(userAnswers).length;
  const flaggedCount = flaggedQuestions.size;
  const remainingCount = totalQuestions - answeredCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#000000] rounded-t-[24px] sm:rounded-[24px] shadow-2xl flex flex-col max-h-[82vh] border border-[#E5E7EB] dark:border-[#27272A] z-10 animate-in slide-in-from-bottom duration-300 font-['HindSiliguri']">
        {/* Drag handle */}
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E7EB] dark:border-[#27272A]">
          <div>
            <h3 className="text-lg font-black text-[#0F172A] dark:text-white leading-tight">
              প্রশ্ন তালিকা ({BanglaNameHelper.toBanglaNumeral(totalQuestions)}টি)
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#A1A1AA]">
              যেকোনো প্রশ্নে সরাসরি যেতে ক্লিক করো
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748B] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Indicators Legend */}
        <div className="px-5 py-2.5 bg-neutral-50 dark:bg-[#18181B] border-b border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-around text-xs font-bold">
          <div className="flex items-center gap-1.5 text-[#12544F] dark:text-[#34D399]">
            <div className="w-3.5 h-3.5 rounded-full bg-[#12544F] dark:bg-[#12544F] flex items-center justify-center text-white text-[9px]">
              ✓
            </div>
            <span>উত্তর দেওয়া ({BanglaNameHelper.toBanglaNumeral(answeredCount)})</span>
          </div>

          <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
            <div className="w-3.5 h-3.5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[9px]">
              ★
            </div>
            <span>রিভিউ ({BanglaNameHelper.toBanglaNumeral(flaggedCount)})</span>
          </div>

          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
            <div className="w-3.5 h-3.5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[9px]" />
            <span>বাকি ({BanglaNameHelper.toBanglaNumeral(remainingCount)})</span>
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 overscroll-contain">
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
            {Array.from({ length: totalQuestions }).map((_, idx) => {
              const qId = questionIds[idx];
              const isAnswered = qId !== undefined && userAnswers[qId] !== undefined;
              const isFlagged = qId !== undefined && flaggedQuestions.has(qId);

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onSelectQuestion(idx);
                    onClose();
                  }}
                  className={cn(
                    "aspect-square rounded-2xl flex flex-col items-center justify-center text-base font-black transition-all active:scale-95 relative",
                    isAnswered
                      ? "bg-[#12544F] dark:bg-[#12544F] text-white border border-[#12544F] shadow-sm shadow-[#12544F]/20"
                      : "bg-[#F8FAFC] dark:bg-[#18181B] text-[#334155] dark:text-[#D4D4D8] border border-[#E2E8F0] dark:border-[#27272A] hover:border-neutral-400 dark:hover:border-neutral-600",
                    isFlagged && "ring-2 ring-orange-500 ring-offset-1 dark:ring-offset-[#141417]"
                  )}
                >
                  <span>{BanglaNameHelper.toBanglaNumeral(idx + 1)}</span>
                  {isFlagged && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB] dark:border-[#27272A]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-[14px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-sm transition"
          >
            বন্ধ করো
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamGridModal;
