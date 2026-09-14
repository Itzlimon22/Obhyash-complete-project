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
        "relative mb-3.5 sm:mb-5 scroll-mt-24 rounded-[16px] bg-white dark:bg-[#121212] border transition-all duration-200 font-['HindSiliguri',sans-serif]",
        isFlagged
          ? 'border-[#FB923C] ring-2 ring-[#FB923C]/30 shadow-md'
          : 'border-neutral-200/80 dark:border-white/[0.08] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-none',
      )}
    >
      {/* ── Top Question Section ── */}
      <div className="p-3.5 sm:p-5">
        {/* ── Flutter-Matching Header Row: Circle ID + Info (Left) & Actions (Right) ── */}
        <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-[#F1F5F9] dark:border-[#202024]">
          {/* Left: Circle Serial Number + "প্রশ্ন ১" + "১ নম্বর" */}
          <div className="flex items-center gap-2.5 min-w-0">
            {serialNumber !== undefined && (
              <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-center shrink-0">
                <span className="font-bold text-xs text-neutral-700 dark:text-neutral-200">
                  {BanglaNameHelper.toBanglaNumeral(serialNumber)}
                </span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                  প্রশ্ন {serialNumber !== undefined ? BanglaNameHelper.toBanglaNumeral(serialNumber) : ''}
                </span>
                <span className="text-[11px] font-bold text-[#12544F] dark:text-[#34D399]">
                  • {BanglaNameHelper.toBanglaNumeral(question.points || 1)} নম্বর
                </span>
                {/* Source Tag if available and review mode */}
                {!hideMetadata && sourceTags && (readOnly || showFeedback || showAnswer) && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 text-[10px] font-bold">
                    {sourceTags}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Actions (Flag, Bookmark, Report) */}
          <div className="flex items-center gap-1 shrink-0">
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
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60',
                )}
              >
                <Flag size={13} className={isFlagged ? 'fill-[#D97706]' : ''} />
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
                className={cn(
                  'p-1.5 rounded-lg transition-colors cursor-pointer',
                  isBookmarked
                    ? 'text-amber-500 hover:text-amber-600 dark:text-amber-400'
                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/60',
                )}
              >
                <Bookmark
                  size={16}
                  className={cn(isBookmarked && 'fill-amber-500 text-amber-500')}
                />
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
                title="ভুল প্রশ্ন রিপোর্ট করো"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
              >
                <Flag size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Stimulus / Passage (উদ্দীপক) if present */}
        {question.passage && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-neutral-800 dark:text-neutral-200 text-sm leading-relaxed">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block mb-1 uppercase tracking-wider">
              উদ্দীপক
            </span>
            <MathRenderer text={question.passage} />
          </div>
        )}

        {/* Question Text (Chorcha / Flutter Benchmark: 16.5px, w600, 1.5 line-height) */}
        <div className="text-[16.5px] font-semibold text-[#0F172A] dark:text-[#F8FAFC] leading-[1.5] mb-1">
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
      </div>

      {/* ── Options List Section: 1-Column on Mobile, 2x2 Grid on Desktop ── */}
      <div className="px-2.5 pb-3 sm:px-4 sm:pb-4 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
        {question.options.map((option, idx) => {
          const banglaIndex = BANGLA_INDICES[idx] || `${idx + 1}`;
          const isSelected = isUserSelected(idx);
          const isCorrect = isCorrectAnswer(idx);

          // ── Flutter-Matching State Colors ──
          let boxBg = 'bg-neutral-50/70 dark:bg-[#18181B]';
          let boxBorder =
            'border-neutral-200/80 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-neutral-700';
          let bulletBg = 'bg-transparent dark:bg-transparent';
          let bulletBorder = 'border-neutral-300 dark:border-neutral-700';
          let bulletText = 'text-[#475569] dark:text-[#E4E4E7]';
          let optionTextColor = 'text-[#0F172A] dark:text-[#F4F4F5]';
          let isBold = false;
          let trailingBadge: React.ReactNode = null;

          if (showFeedback || showAnswer) {
            if (isCorrect) {
              // Deep Rich Green Correct Styling (Flutter viridian / emerald)
              boxBg = 'bg-[#D1FAE5] dark:bg-[#064E3B]/55';
              boxBorder =
                'border-[#047857] dark:border-[#10B981] shadow-xs border-[1.8px]';
              bulletBg = 'bg-[#047857] dark:bg-[#059669]';
              bulletBorder = 'border-[#047857] dark:border-[#059669]';
              bulletText = 'text-white';
              optionTextColor = 'text-[#064E3B] dark:text-[#A7F3D0]';
              isBold = true;
              trailingBadge = (
                <CheckCircle2
                  size={19}
                  className="text-[#047857] dark:text-[#34D399] shrink-0"
                />
              );
            } else if (isSelected && !isCorrect) {
              // Crimson for Wrong Selected (Flutter deepCrimson)
              boxBg = 'bg-[#FEF2F2] dark:bg-[#7F1D1D]/25';
              boxBorder =
                'border-[#FCA5A5] dark:border-[#B91C1C] border-[1.8px]';
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
              boxBg = 'bg-[#12544F]/10 dark:bg-[#12544F]/25';
              boxBorder = 'border-[#12544F] dark:border-[#34D399] border-[1.5px] shadow-xs';
              bulletBg = 'bg-[#12544F] dark:bg-[#059669]';
              bulletBorder = 'border-[#12544F] dark:border-[#059669]';
              bulletText = 'text-white';
              optionTextColor = 'text-[#12544F] dark:text-[#A7F3D0]';
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
                'w-full flex items-center justify-between gap-2.5 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-xl border transition-all text-left group touch-manipulation',
                boxBg,
                boxBorder,
                !readOnly &&
                  !showFeedback &&
                  !isLocked &&
                  'cursor-pointer active:scale-[0.99]',
                isLocked && !showFeedback && !showAnswer && isSelected && 'cursor-default',
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Circular Badge Indicator (ক, খ, গ, ঘ) (Flutter: 13.0px, w600) */}
                <div
                  className={cn(
                    'w-7 h-7 rounded-full border flex items-center justify-center text-[13px] font-semibold shrink-0 transition-colors',
                    bulletBg,
                    bulletBorder,
                    bulletText,
                  )}
                >
                  <span>{banglaIndex}</span>
                </div>

                {/* Option Text & Math Formula (Flutter: 16.0px, w500, line-height 1.45) */}
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
                      className="max-h-28 object-contain rounded-lg border border-neutral-200 dark:border-neutral-800 mt-1.5 bg-white p-1"
                    />
                  )}
                </div>
              </div>

              {/* Right: Radio Button Circle or Trailing Feedback Icon */}
              <div className="shrink-0 ml-1.5">
                {showFeedback || showAnswer ? (
                  trailingBadge
                ) : isSelected ? (
                  <div className="w-5 h-5 rounded-full border-2 border-[#12544F] dark:border-[#10B981] flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#12544F] dark:bg-[#10B981]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border border-neutral-300 dark:border-neutral-600 flex items-center justify-center group-hover:border-neutral-400 dark:group-hover:border-neutral-500 transition-colors" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Explanation Panel (Matching Flutter Warm Book Page Theme) ── */}
      {showFeedback &&
        (question.explanation || question.explanationImageUrl) && (
          <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 rounded-[12px] border border-[#E2D7C9] dark:border-white/[0.08] overflow-hidden">
            {/* Toggle Header */}
            <div
              onClick={() => setIsExplanationOpen(!isExplanationOpen)}
              className="px-3.5 py-2.5 bg-[#F3ECE4] dark:bg-[#1A1A1E] flex items-center justify-between cursor-pointer select-none transition-colors"
            >
              <div className="flex items-center gap-2 text-[#42352B] dark:text-[#F4F4F5] font-bold text-[16.5px] leading-[1.35]">
                <BookOpen size={16} />
                <span>ব্যাখ্যা</span>
              </div>

              {/* Chevron Box */}
              <div className="w-6 h-6 rounded-md bg-[#E7DDD0] dark:bg-[#26262B] flex items-center justify-center text-[#42352B] dark:text-[#F4F4F5]">
                {isExplanationOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
              </div>
            </div>

            {/* Explanation Content (Flutter: 14.5px, w400, line-height 1.6) */}
            {isExplanationOpen && (
              <div className="p-4 bg-[#FAF7F2] dark:bg-[#141416] border-t border-[#E8DFD3] dark:border-white/[0.08] text-[#2E2621] dark:text-[#F4F4F5] text-[14.5px] leading-[1.6] animate-in fade-in duration-200">
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
