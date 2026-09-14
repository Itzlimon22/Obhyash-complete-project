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
  Trash2,
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
  onDelete?: () => void;
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
  onDelete,
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
        "relative mb-5 sm:mb-6 scroll-mt-24 rounded-[16px] bg-white dark:bg-[#000000] transition-all duration-200 font-['HindSiliguri',sans-serif]",
        isFlagged
          ? 'border-[#FB923C] border-2 ring-2 ring-[#FB923C]/20 shadow-md'
          : 'border-[#E5E7EB] dark:border-[#333333] border shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:shadow-none',
      )}
    >
      {/* ── Top Question Section (Flutter: EdgeInsets.fromLTRB(14, 14, 14, 10)) ── */}
      <div className="p-3.5 pt-3.5 pb-2.5 sm:p-4 sm:pb-3">
        {/* Stimulus / Passage (উদ্দীপক) if present */}
        {question.passage && (
          <div className="mb-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1 uppercase tracking-wider">
              উদ্দীপক
            </span>
            <MathRenderer text={question.passage} />
          </div>
        )}

        {/* Serial number + Question text INLINE (Flutter: '**${_toBengaliNumeral(widget.serialNumber)}.** ${widget.question.question}') */}
        <div className="text-[16.5px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.5]">
          <MathRenderer
            text={
              serialNumber !== undefined
                ? `**${BanglaNameHelper.toBanglaNumeral(serialNumber)}.** ${question.question}`
                : question.question
            }
          />
        </div>

        {/* Question Image (if any) */}
        {question.imageUrl && (
          <div className="my-2.5 max-w-md mx-auto rounded-xl overflow-hidden border border-[#E5E7EB] dark:border-[#262626] bg-neutral-50 dark:bg-[#111] p-1.5">
            <img
              src={question.imageUrl}
              alt="Question diagram"
              className="max-h-60 mx-auto object-contain rounded-lg"
            />
          </div>
        )}

        {/* ── Tags + Action Buttons Row (Below Question Text) ── */}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {/* Left: Source Tag & Flagged Badge */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Unified Source Tag (Board / University & Year - Short Form e.g. DB '24) */}
            {!hideMetadata && sourceTags && (readOnly || showFeedback || showAnswer) && (
              <span className="inline-flex items-center px-2 py-[3px] rounded-[6px] bg-[#E0F7FA] dark:bg-[#0E3A4A] border border-[#B2EBF2] dark:border-[#164E63] text-[11px] font-semibold text-[#006064] dark:text-[#A5F3FC] leading-none tracking-tight">
                {sourceTags}
              </span>
            )}

            {/* Flagged Badge */}
            {isFlagged && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[4px] bg-[#FEF3C7] dark:bg-[#78350F]/30 text-[11.5px] font-semibold text-[#D97706] dark:text-[#FBBF24] leading-none">
                চিহ্নিত
              </span>
            )}
          </div>

          {/* Right: Actions (Flag during exam, Bookmark, Report) */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Flag Button (during active exam) */}
            {onToggleFlag && !showFeedback && (
              <button
                type="button"
                onClick={onToggleFlag}
                title={isFlagged ? 'ফ্ল্যাগ বাতিল করো' : 'রিভিউর জন্য চিহ্নিত করো'}
                className={cn(
                  'px-2 py-1 rounded-[6px] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer',
                  isFlagged
                    ? 'text-[#D97706] dark:text-[#FBBF24] bg-[#FEF3C7] dark:bg-[#78350F]/40'
                    : 'text-[#9CA3AF] dark:text-[#525252] hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/60',
                )}
              >
                <Flag size={14} className={isFlagged ? 'fill-[#D97706] dark:fill-[#FBBF24]' : ''} />
                <span className="text-[11px]">{isFlagged ? 'চিহ্নিত' : 'ফ্ল্যাগ'}</span>
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
                className="p-1.5 rounded-[6px] text-[#9CA3AF] dark:text-[#525252] hover:text-[#F59E0B] dark:hover:text-[#F59E0B] hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer"
              >
                <Bookmark
                  size={18}
                  className={cn(
                    isBookmarked
                      ? 'fill-[#F59E0B] text-[#F59E0B]'
                      : 'text-inherit',
                  )}
                />
              </button>
            )}

            {/* Delete Button matching Flutter _IconBtn with AppIcons.trash */}
            {onDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                title="প্রশ্নটি মুছে ফেলো"
                className="p-1.5 rounded-[6px] text-[#DC2626] dark:text-[#EF4444]/85 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Trash2 size={17} />
              </button>
            )}

            {/* Report Button (in review mode) */}
            {onReport && (readOnly || showFeedback) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onReport();
                }}
                title="রিপোর্ট করো"
                className="p-1.5 rounded-[6px] text-[#9CA3AF] dark:text-[#525252] hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Flag size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Options List (Flutter: EdgeInsets.fromLTRB(10, 0, 10, 14) with 8px bottom spacing) ── */}
      <div className="px-2.5 pb-3.5 sm:px-3.5 sm:pb-4 flex flex-col gap-2">
        {question.options.map((option, idx) => {
          const banglaIndex = BANGLA_INDICES[idx] || `${idx + 1}`;
          const isSelected = isUserSelected(idx);
          const isCorrect = isCorrectAnswer(idx);

          // ── Flutter-Matching Exact State Colors ──
          let boxBg = 'bg-[#F8F9FA] dark:bg-[#1F1F1F]';
          let boxBorder = 'border-[#E5E7EB] dark:border-[#333333] hover:border-neutral-300 dark:hover:border-neutral-600';
          let bulletBg = 'bg-transparent';
          let bulletBorder = 'border-[#D1D5DB] dark:border-[#525252]';
          let bulletText = 'text-[#475569] dark:text-[#E4E4E7]';
          let optionTextColor = 'text-[#0F172A] dark:text-[#F4F4F5]';
          let isBold = false;
          let trailingBadge: React.ReactNode = null;

          if (showFeedback || showAnswer) {
            if (isCorrect) {
              // Deep Rich Forest/Emerald Green Correct Option
              boxBg = 'bg-[#D1FAE5] dark:bg-[#064E3B]/55';
              boxBorder = 'border-[#047857] dark:border-[#10B981] border-[1.8px]';
              bulletBg = 'bg-[#047857] dark:bg-[#059669]';
              bulletBorder = 'border-[#047857] dark:border-[#059669]';
              bulletText = 'text-white';
              optionTextColor = 'text-[#064E3B] dark:text-[#A7F3D0]';
              isBold = true;
              trailingBadge = (
                <CheckCircle2
                  size={20}
                  className="text-[#047857] dark:text-[#34D399] shrink-0"
                />
              );
            } else if (isSelected) {
              // Refined Crimson for Wrong Selected
              boxBg = 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/20';
              boxBorder = 'border-[#FCA5A5] dark:border-[#B91C1C] border-[1.8px]';
              bulletBg = 'bg-[#DC2626]';
              bulletBorder = 'border-[#DC2626]';
              bulletText = 'text-white';
              optionTextColor = 'text-[#991B1B] dark:text-[#FCA5A5]';
              isBold = true;
              trailingBadge = (
                <XCircle
                  size={20}
                  className="text-[#DC2626] dark:text-[#F87171] shrink-0"
                />
              );
            }
          } else if (isSelected) {
            // Selected Option during active exam
            boxBg = 'bg-[#E5E7EB] dark:bg-[#27272A]';
            boxBorder = 'border-[#9CA3AF] dark:border-[#525252]';
            bulletBg = 'bg-[#1F2937] dark:bg-[#E5E5E5]';
            bulletBorder = 'border-[#1F2937] dark:border-[#E5E5E5]';
            bulletText = 'text-white dark:text-[#1F2937]';
            optionTextColor = 'text-[#111827] dark:text-white';
            isBold = true;
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
                'w-full flex items-center justify-between gap-3 px-3.5 py-2.5 sm:py-3 rounded-[12px] border transition-all text-left group touch-manipulation',
                boxBg,
                boxBorder,
                !readOnly && !showFeedback && !isLocked && 'cursor-pointer active:scale-[0.99]',
                isLocked && !showFeedback && !showAnswer && isSelected && 'cursor-default',
              )}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Circular Badge Indicator (Flutter: 26x26, 13.0px, w600) */}
                <div
                  className={cn(
                    'w-[26px] h-[26px] rounded-full border-[1.4px] flex items-center justify-center text-[13px] shrink-0 transition-colors',
                    bulletBg,
                    bulletBorder,
                    bulletText,
                    isBold ? 'font-bold' : 'font-semibold',
                  )}
                >
                  <span>{banglaIndex}</span>
                </div>

                {/* Option Text (Flutter: 16.0px, w500 / w700, line-height 1.45) */}
                <div
                  className={cn(
                    'flex-1 min-w-0 text-[16px] leading-[1.45]',
                    optionTextColor,
                    isBold ? 'font-bold' : 'font-medium',
                  )}
                >
                  <MathRenderer text={option} />
                  {optionImageUrl && (
                    <img
                      src={optionImageUrl}
                      alt={`Option ${banglaIndex}`}
                      className="max-h-28 object-contain rounded-lg border border-[#E5E7EB] dark:border-[#333333] mt-1.5 bg-white p-1"
                    />
                  )}
                </div>
              </div>

              {/* Trailing Feedback Icon */}
              {trailingBadge && (
                <div className="shrink-0 ml-2">
                  {trailingBadge}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Explanation Panel (Flutter Warm Book Page Theme) ── */}
      {showFeedback &&
        (question.explanation || question.explanationImageUrl) && (
          <div className="mx-2.5 mb-3 sm:mx-3.5 sm:mb-3.5 rounded-[10px] border border-[#E2D7C9] dark:border-[#27272A] overflow-hidden transition-all duration-200">
            {/* Toggle Header */}
            <div
              onClick={() => setIsExplanationOpen(!isExplanationOpen)}
              className="px-3.5 py-2 sm:py-2.5 bg-[#F3ECE4] dark:bg-[#141416] flex items-center justify-between cursor-pointer select-none transition-colors"
            >
              <div className="flex items-center gap-2 text-[#42352B] dark:text-[#F4F4F5] font-bold text-[16.5px] leading-tight">
                <BookOpen size={15} className="text-[#42352B] dark:text-[#F4F4F5]" />
                <span>ব্যাখ্যা</span>
              </div>

              {/* Chevron Button */}
              <div className="p-1 rounded-[6px] bg-[#E7DDD0] dark:bg-[#1E1E22] border border-[#E2D7C9] dark:border-[#27272A] flex items-center justify-center text-[#42352B] dark:text-[#F4F4F5]">
                {isExplanationOpen ? (
                  <ChevronUp size={15} />
                ) : (
                  <ChevronDown size={15} />
                )}
              </div>
            </div>

            {/* Explanation Content */}
            {isExplanationOpen && (
              <div className="p-3.5 sm:p-4 bg-[#FAF7F2] dark:bg-[#09090B] border-t border-[#E8DFD3] dark:border-[#27272A] text-[#2E2621] dark:text-[#F4F4F5] text-[14.5px] leading-[1.6] animate-in fade-in duration-200">
                {question.explanation && (
                  <MathRenderer text={question.explanation} block={true} />
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
