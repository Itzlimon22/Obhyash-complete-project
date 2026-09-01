'use client';

import React, { useState } from 'react';
import { Question } from '@/lib/types';
import { MathRenderer } from '@/components/common/MathRenderer';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import {
  Bookmark,
  Flag,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuestionCardProps {
  question: Question;
  serialNumber?: number;
  selectedOptionIndex?: number;
  isFlagged?: boolean;
  onSelectOption?: (optionIndex: number) => void;
  onToggleFlag?: () => void;
  onReport?: () => void;
  showFeedback?: boolean;
  readOnly?: boolean;
  showAnswer?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  hideMetadata?: boolean;
  initiallyExpanded?: boolean;
}

const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  serialNumber,
  selectedOptionIndex,
  isFlagged = false,
  onSelectOption,
  onToggleFlag,
  onReport,
  showFeedback = false,
  readOnly = false,
  showAnswer = false,
  isBookmarked = false,
  onToggleBookmark,
  hideMetadata = false,
  initiallyExpanded = false,
}) => {
  const [isExplanationOpen, setIsExplanationOpen] = useState(
    showFeedback && initiallyExpanded,
  );

  // Parse institute/year/author tags (e.g. CU-18, DB-24)
  const sourceTags = React.useMemo(() => {
    return BanglaNameHelper.formatQuestionSource({
      institutes:
        question.institutes || (question.institute ? [question.institute] : []),
      years: question.years || (question.year ? [question.year] : []),
      examHistory: question.exam_history || question.examHistory || [],
    });
  }, [question]);

  const correctIndex = question.correctAnswerIndex;
  const isCorrectAnswer = (idx: number) => {
    if (
      question.correctAnswerIndices &&
      question.correctAnswerIndices.length > 0
    ) {
      return question.correctAnswerIndices.includes(idx);
    }
    return idx === correctIndex;
  };

  const isUserSelected = (idx: number) => selectedOptionIndex === idx;

  return (
    <div
      id={`question-${question.id}`}
      className={cn(
        "relative mb-4 sm:mb-5 scroll-mt-24 rounded-[18px] bg-white dark:bg-[#000000] border transition-all duration-200 font-['HindSiliguri',sans-serif]",
        isFlagged
          ? 'border-[#FB923C] ring-2 ring-[#FB923C]/30 shadow-md'
          : 'border-[#E5E7EB] dark:border-[#262626] shadow-[0_4px_12px_rgba(0,0,0,0.03)] dark:shadow-none',
      )}
    >
      {/* ── Top Question Section ── */}
      <div className="p-4 sm:p-5">
        {/* Stimulus / Passage (উদ্দীপক) if present */}
        {question.passage && (
          <div className="mb-3.5 p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1 uppercase tracking-wider">
              উদ্দীপক
            </span>
            <MathRenderer text={question.passage} />
          </div>
        )}

        {/* Question Text with Serial Number */}
        <div className="text-[16px] sm:text-[17px] font-bold text-[#111827] dark:text-[#F5F5F5] leading-relaxed mb-3">
          {serialNumber !== undefined && (
            <span className="mr-1.5 font-bold">
              {BanglaNameHelper.toBanglaNumeral(serialNumber)}.
            </span>
          )}
          <MathRenderer text={question.question} />
        </div>

        {/* Question Image (if any) */}
        {question.imageUrl && (
          <div className="my-3 max-w-md mx-auto rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#262626] bg-neutral-50 dark:bg-[#111] p-2">
            <img
              src={question.imageUrl}
              alt="Question diagram"
              className="max-h-64 mx-auto object-contain rounded-lg"
            />
          </div>
        )}

        {/* ── Source Tag (CU-18) + Bookmark + Report Action Row ── */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Institute / Board Tag (e.g. CU-18) */}
          {!hideMetadata && sourceTags && (readOnly || showFeedback || showAnswer) ? (
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-[6px] bg-[#E0F7FA] dark:bg-[#0E3A4A] border border-[#B2EBF2] dark:border-[#164E63] text-[#006064] dark:text-[#A5F3FC] text-xs font-bold tracking-wide">
              {sourceTags}
            </div>
          ) : (
            <div />
          )}

          {/* Right Action Icons: Flag/Review, Bookmark, Report */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Flag Button (during active exam) */}
            {onToggleFlag && !showFeedback && (
              <button
                type="button"
                onClick={onToggleFlag}
                title={isFlagged ? 'ফ্ল্যাগ বাতিল করো' : 'রিভিউর জন্য ফ্ল্যাগ করো'}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer',
                  isFlagged
                    ? 'bg-[#FEF3C7] dark:bg-[#78350F]/40 text-[#D97706] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#92400E]'
                    : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800',
                )}
              >
                <Flag size={13} className={isFlagged ? 'fill-[#D97706]' : ''} />
                <span>{isFlagged ? 'চিহ্নিত' : 'ফ্ল্যাগ'}</span>
              </button>
            )}

            {/* Bookmark Button */}
            {onToggleBookmark && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark();
                }}
                title={isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো'}
                className="p-1 rounded-lg text-[#9CA3AF] dark:text-[#525252] hover:text-[#1E3A8A] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
              >
                <Bookmark
                  size={18}
                  className={cn(
                    isBookmarked &&
                      'fill-[#1E3A8A] text-[#1E3A8A] dark:fill-[#38BDF8] dark:text-[#38BDF8]',
                  )}
                />
              </button>
            )}

            {/* Report Button (Flag icon in review mode) */}
            {onReport && (readOnly || showFeedback) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReport();
                }}
                title="ভুল প্রশ্ন রিপোর্ট করো"
                className="p-1 rounded-lg text-[#9CA3AF] dark:text-[#525252] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Flag size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Options List Section: 1-Column on Mobile, 2x2 Grid on Desktop ── */}
      <div className="px-3 pb-3 sm:px-4 sm:pb-4 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
        {question.options.map((option, idx) => {
          const banglaIndex = BANGLA_INDICES[idx] || `${idx + 1}`;
          const isSelected = isUserSelected(idx);
          const isCorrect = isCorrectAnswer(idx);

          // ── Flutter-Matching State Colors ──
          let boxBg = 'bg-[#F8F9FA] dark:bg-[#1F1F1F]';
          let boxBorder =
            'border-[#E5E7EB] dark:border-[#333333] hover:border-[#D1D5DB] dark:hover:border-[#474747]';
          let bulletBg = 'bg-transparent';
          let bulletBorder = 'border-[#D1D5DB] dark:border-[#525252]';
          let bulletText = 'text-[#475569] dark:text-[#E4E4E7]';
          let optionTextColor = 'text-[#0F172A] dark:text-[#F4F4F5]';
          let isBold = false;
          let trailingBadge: React.ReactNode = null;

          if (showFeedback || showAnswer) {
            if (isCorrect) {
              // High-Contrast Correct Styling
              boxBg = 'bg-[#F1F5F9] dark:bg-[#27272A]';
              boxBorder =
                'border-[#1E293B] dark:border-[#F8FAFC] shadow-xs border-[1.5px]';
              bulletBg = 'bg-[#1E293B] dark:bg-[#F8FAFC]';
              bulletBorder = 'border-[#1E293B] dark:border-[#F8FAFC]';
              bulletText = 'text-white dark:text-[#0F172A]';
              optionTextColor = 'text-[#0F172A] dark:text-[#FFFFFF]';
              isBold = true;
              trailingBadge = (
                <CheckCircle2
                  size={19}
                  className="text-[#1E293B] dark:text-[#F8FAFC] shrink-0 fill-current/10"
                />
              );
            } else if (isSelected && !isCorrect) {
              // Crimson for Wrong Selected
              boxBg = 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/20';
              boxBorder =
                'border-[#FCA5A5] dark:border-[#B91C1C] border-[1.5px]';
              bulletBg = 'bg-[#DC2626]';
              bulletBorder = 'border-[#DC2626]';
              bulletText = 'text-white';
              optionTextColor = 'text-[#991B1B] dark:text-[#FCA5A5]';
              isBold = true;
              trailingBadge = (
                <XCircle
                  size={19}
                  className="text-[#DC2626] dark:text-[#F87171] shrink-0 fill-current/10"
                />
              );
            }
          } else {
            // Active Exam Mode:
            if (isSelected) {
              boxBg = 'bg-[#E5E7EB] dark:bg-[#27272A]';
              boxBorder = 'border-[#9CA3AF] dark:border-[#525252] border-[1.5px]';
              bulletBg = 'bg-[#1F2937] dark:bg-[#E5E5E5]';
              bulletBorder = 'border-[#1F2937] dark:border-[#E5E5E5]';
              bulletText = 'text-white dark:text-[#1F2937]';
              optionTextColor = 'text-[#111827] dark:text-white';
              isBold = true;
            }
          }

          const isLocked = selectedOptionIndex !== undefined;
          const optionImageUrl = question.optionImages?.[idx];

          return (
            <button
              key={idx}
              type="button"
              disabled={readOnly || showFeedback || isLocked}
              onClick={() => onSelectOption && onSelectOption(idx)}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3 rounded-[12px] border transition-all text-left group',
                boxBg,
                boxBorder,
                !readOnly &&
                  !showFeedback &&
                  !isLocked &&
                  'cursor-pointer active:scale-[0.99]',
                isLocked && !showFeedback && !showAnswer && isSelected && 'cursor-default',
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Circular Badge Indicator (ক, খ, গ, ঘ) */}
                <div
                  className={cn(
                    'w-[26px] h-[26px] rounded-full border flex items-center justify-center text-[13px] font-bold shrink-0 transition-colors',
                    bulletBg,
                    bulletBorder,
                    bulletText,
                    bulletBg === 'bg-transparent' &&
                      'shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
                  )}
                >
                  <span>{banglaIndex}</span>
                </div>

                {/* Option Text & Math Formula */}
                <div
                  className={cn(
                    'flex-1 min-w-0 text-[15px] sm:text-[16px] leading-snug',
                    optionTextColor,
                    isBold ? 'font-bold' : 'font-medium',
                  )}
                >
                  <MathRenderer text={option} />
                  {optionImageUrl && (
                    <img
                      src={optionImageUrl}
                      alt={`Option ${banglaIndex}`}
                      className="max-h-28 object-contain rounded-lg border border-neutral-200 dark:border-neutral-800 mt-1.5 bg-white p-1"
                    />
                  )}
                </div>
              </div>

              {/* Trailing Feedback Icon (Review mode) */}
              {trailingBadge}
            </button>
          );
        })}
      </div>

      {/* ── Explanation Panel (Matching Flutter Warm Book Page Theme) ── */}
      {showFeedback &&
        (question.explanation || question.explanationImageUrl) && (
          <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 rounded-[12px] border border-[#E2D7C9] dark:border-[#27272A] overflow-hidden">
            {/* Toggle Header */}
            <div
              onClick={() => setIsExplanationOpen(!isExplanationOpen)}
              className="px-3.5 py-2.5 bg-[#F3ECE4] dark:bg-[#141416] flex items-center justify-between cursor-pointer select-none transition-colors"
            >
              <div className="flex items-center gap-2 text-[#42352B] dark:text-[#F4F4F5] font-bold text-[15px] sm:text-base">
                <BookOpen size={16} />
                <span>ব্যাখ্যা</span>
              </div>

              {/* Chevron Box */}
              <div className="w-6 h-6 rounded-md bg-[#E7DDD0] dark:bg-[#1E1E22] flex items-center justify-center text-[#42352B] dark:text-[#F4F4F5]">
                {isExplanationOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </div>
            </div>

            {/* Explanation Content */}
            {isExplanationOpen && (
              <div className="p-4 bg-[#FAF7F2] dark:bg-[#09090B] border-t border-[#E8DFD3] dark:border-[#27272A] text-[#2E2621] dark:text-[#F4F4F5] text-[15px] sm:text-base leading-relaxed animate-in fade-in duration-200">
                {question.explanation && (
                  <MathRenderer text={question.explanation} />
                )}
                {question.explanationImageUrl && (
                  <img
                    src={question.explanationImageUrl}
                    alt="Explanation diagram"
                    className="max-h-56 object-contain rounded-lg border border-[#E8DFD3] dark:border-[#27272A] mt-2.5 bg-white p-1"
                  />
                )}
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default QuestionCard;
