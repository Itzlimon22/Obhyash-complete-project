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
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[82vh] border border-neutral-200/80 dark:border-[#2C2C2E] z-10 animate-in slide-in-from-bottom duration-300 font-['HindSiliguri',sans-serif]">
        {/* Drag handle */}
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-white/[0.08]">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white leading-tight font-['Anek_Bangla',sans-serif]">
              প্রশ্ন তালিকা ({BanglaNameHelper.toBanglaNumeral(totalQuestions)}টি)
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              যেকোনো প্রশ্নে সরাসরি যেতে ক্লিক করো
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Indicators Legend */}
        <div className="px-5 py-2.5 bg-neutral-50 dark:bg-[#121212] border-b border-neutral-100 dark:border-white/[0.08] flex items-center justify-around text-xs font-bold font-['Anek_Bangla',sans-serif]">
          <div className="flex items-center gap-1.5 text-[#12544F] dark:text-[#34D399]">
            <div className="w-3.5 h-3.5 rounded-full bg-[#12544F] flex items-center justify-center text-white text-[9px]">
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
                    "aspect-square rounded-xl flex flex-col items-center justify-center text-base font-bold transition-all active:scale-95 relative cursor-pointer font-['Anek_Bangla',sans-serif]",
                    isAnswered
                      ? "bg-[#12544F] text-white border border-[#12544F] shadow-xs"
                      : "bg-neutral-50 dark:bg-[#18181B] text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-neutral-700",
                    isFlagged && "ring-2 ring-orange-500 ring-offset-1 dark:ring-offset-[#1C1C1E]"
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
        <div className="p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-neutral-100 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-neutral-100 dark:bg-[#2C2C2E] border border-neutral-200/80 dark:border-[#3A3A3C] hover:bg-neutral-200 dark:hover:bg-[#3A3A3C] text-neutral-800 dark:text-neutral-200 font-bold text-sm transition active:scale-95 cursor-pointer font-['Anek_Bangla',sans-serif]"
          >
            বন্ধ করো
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamGridModal;
