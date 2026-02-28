import React, { useState } from 'react';
import { Question } from '@/lib/types';
import LatexText from '../common/LatexText';
import { toBengaliNumeral } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  serialNumber?: number;
  selectedOptionIndex: number | undefined;
  isFlagged: boolean;
  onSelectOption: (optionIndex: number) => void;
  onToggleFlag: () => void;
  onReport: () => void;
  isOmrMode?: boolean;
  showFeedback?: boolean;
  readOnly?: boolean;
  showAnswer?: boolean;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  hideMetadata?: boolean;
}

const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];

export default function QuestionCard({
  question,
  serialNumber,
  selectedOptionIndex,
  isFlagged,
  onSelectOption,
  onReport,
  isOmrMode = false,
  showFeedback = false,
  readOnly = false,
  showAnswer = false,
  isBookmarked = false,
  onToggleBookmark,
  hideMetadata = false,
}: QuestionCardProps) {
  const isAnswered = selectedOptionIndex !== undefined;
  const [isExplanationOpen, setIsExplanationOpen] = useState(showFeedback);

  // Build institute/year tags
  const tags: string[] = [];
  const len = Math.max(
    question.institutes?.length || 0,
    question.years?.length || 0,
  );
  for (let i = 0; i < len; i++) {
    const inst = question.institutes?.[i] || '';
    const yr = question.years?.[i] || '';
    const combined = `${inst} ${yr}`.trim();
    if (combined) tags.push(combined);
  }
  if (tags.length === 0 && (question.institute || question.year)) {
    tags.push(`${question.institute || ''} ${question.year || ''}`.trim());
  }

  return (
    <div
      id={`question-${question.id}`}
      className={`
        relative mb-6 scroll-mt-24
        bg-white dark:bg-neutral-900
        border border-neutral-200/80 dark:border-neutral-800
        rounded-xl
        transition-all duration-200
        ${isFlagged ? 'ring-2 ring-orange-400' : ''}
      `}
    >
      {/* ── Top section ── */}
      <div className="px-2 pt-3 pb-2 md:px-5 md:pt-5">
        {/* Question text row */}
        <div className="flex items-baseline gap-2 mb-2">
          {/* Serial number */}
          {serialNumber !== undefined && (
            <span className="shrink-0 font-bold text-[14px] md:text-[15px] text-neutral-800 dark:text-neutral-200">
              {toBengaliNumeral(serialNumber)}.
            </span>
          )}

          {/* Question text */}
          <div className="min-w-0 text-[14px] md:text-[15px] text-neutral-900 dark:text-neutral-100 leading-[1.4] font-serif-exam font-medium">
            <LatexText text={question.question} />
          </div>
        </div>

        {/* Tags + action buttons row */}
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {/* Institute/year tags */}
          {!hideMetadata &&
            tags.map((tag, i) => (
              <span
                key={i}
                className="
                inline-flex items-center text-[11px] font-semibold
                px-2.5 py-0.5 rounded-sm
                bg-[#e8f4f0] text-[#1a7a5a]
                dark:bg-[#0d3326] dark:text-[#4ecca3]
                tracking-wide
              "
              >
                {tag}
              </span>
            ))}

          {/* Bookmark button */}
          <motion.button
            whileTap={{ scale: 0.86 }}
            whileHover={{ scale: 1.08 }}
            onClick={onToggleBookmark}
            disabled={!onToggleBookmark}
            title={isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো'}
            className={`
              rounded p-1 transition-colors
              ${!onToggleBookmark ? 'opacity-30 cursor-default' : 'cursor-pointer'}
              ${
                isBookmarked
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300'
              }
            `}
            style={{ border: 'none', background: 'none' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill={isBookmarked ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              className="w-[17px] h-[17px]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z"
              />
            </svg>
          </motion.button>

          {/* Report button */}
          <button
            onClick={onReport}
            title="Report Issue"
            className="
              rounded p-1 transition-colors
              text-neutral-400 hover:text-red-500
              dark:text-neutral-500 dark:hover:text-red-400
            "
            style={{ border: 'none', background: 'none' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-[17px] h-[17px]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Options grid ── */}
      <div
        className={`
    px-4 pb-4 md:px-6 md:pb-5
    grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-3 items-stretch
    ${readOnly || isOmrMode ? 'pointer-events-none' : ''}
  `}
      >
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionIndex === idx;
          const isCorrect = idx === question.correctAnswerIndex;
          const banglaIndex = BANGLA_INDICES[idx] || (idx + 1).toString();

          let iconText = banglaIndex;
          let iconBg =
            'bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 shadow-[0_1px_2px_rgba(0,0,0,0.05)] dark:shadow-none';
          let iconFg = 'text-neutral-600 dark:text-neutral-300';
          let boxClass =
            'bg-[#f8f9fa] dark:bg-[#1f1f1f] border border-[#e5e7eb] dark:border-[#333] hover:bg-[#f1f3f5] dark:hover:bg-[#2a2a2a]';
          let textClass = 'text-neutral-800 dark:text-neutral-200';

          if (showFeedback) {
            if (isCorrect) {
              boxClass =
                'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800';
              iconBg = 'bg-emerald-500 border-emerald-500';
              iconFg = 'text-white';
              textClass = 'text-emerald-700 dark:text-emerald-300 font-bold';
            } else if (isSelected) {
              boxClass =
                'bg-red-50/40 dark:bg-red-900/10 border-red-200 dark:border-red-800';
              iconBg = 'bg-red-500 border-red-500';
              iconFg = 'text-white';
              textClass = 'text-red-700 dark:text-red-300 font-bold';
            } else {
              boxClass =
                'bg-[#f8f9fa] dark:bg-[#1f1f1f] border border-[#e5e7eb] dark:border-[#333] opacity-60';
            }
          } else if (showAnswer && isCorrect) {
            boxClass =
              'bg-emerald-50/40 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800';
            iconBg = 'bg-emerald-500 border-emerald-500';
            iconFg = 'text-white';
            textClass = 'text-emerald-700 dark:text-emerald-300 font-bold';
          } else if (isSelected) {
            boxClass =
              'bg-neutral-200 dark:bg-neutral-700 border-neutral-400 dark:border-neutral-500';
            iconBg =
              'bg-neutral-800 border-neutral-800 dark:bg-neutral-200 dark:border-neutral-200';
            iconFg = 'text-white dark:text-neutral-900';
            textClass = 'text-neutral-900 dark:text-white font-bold';
          }

          return (
            <label
              key={idx}
              className={`
                group relative flex items-center gap-2.5 w-full h-full
                px-3 py-1.5 rounded-md border
                transition-all duration-200
                ${isOmrMode || readOnly ? 'cursor-default' : 'cursor-pointer'}
                ${boxClass}
              `}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={isSelected}
                onChange={() =>
                  !isAnswered && !isOmrMode && !readOnly && onSelectOption(idx)
                }
                disabled={isAnswered || isOmrMode || readOnly}
                className="sr-only"
              />

              {/* Circle badge */}
              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-200
                  ${iconBg}
                `}
              >
                <span
                  className={`text-[14px] font-bold leading-none ${iconFg}`}
                >
                  {iconText}
                </span>
              </div>

              {/* Option text */}
              <div
                className={`flex-1 text-[13px] md:text-[14px] leading-[1.4] select-none font-serif-exam ${textClass}`}
              >
                <LatexText text={option} />
              </div>
            </label>
          );
        })}
      </div>

      {/* ── Explanation ── */}
      {showFeedback && question.explanation && (
        <div className="mx-2 mb-3 md:mx-5 md:mb-5">
          <div
            className={`
              rounded-xl overflow-hidden transition-all duration-300
              ${isExplanationOpen ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/60' : 'bg-neutral-50/80 dark:bg-[#1c1c1c] border-neutral-200/80 dark:border-[#333]'}
              border
            `}
          >
            {/* Header / Toggle Row */}
            <button
              onClick={() => setIsExplanationOpen(!isExplanationOpen)}
              className="w-full flex items-center justify-between p-3 md:px-4 md:py-3.5 transition-colors hover:bg-emerald-100/20 dark:hover:bg-emerald-900/20"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[14px] md:text-[15px] font-extrabold text-emerald-700 dark:text-emerald-400">
                  সঠিক উত্তর :{' '}
                  {BANGLA_INDICES[question.correctAnswerIndex ?? 0] || ''}
                </span>
              </div>
              <div
                className="text-emerald-600 dark:text-emerald-400 p-1 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm bg-white dark:bg-neutral-800 transition-transform duration-300"
                style={{
                  transform: isExplanationOpen
                    ? 'rotate(180deg)'
                    : 'rotate(0deg)',
                }}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence initial={false}>
              {isExplanationOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  <div className="px-4 pb-4 md:px-5 md:pb-5 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/30">
                    <div className="text-[14px] md:text-[15px] text-neutral-700 dark:text-neutral-300 leading-relaxed font-serif-exam mt-3">
                      <LatexText
                        text={question.explanation || ''}
                        className="text-[14px] md:text-[15px]"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
