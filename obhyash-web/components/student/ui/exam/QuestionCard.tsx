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
}: QuestionCardProps) {
  const isAnswered = selectedOptionIndex !== undefined;
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

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
          {tags.map((tag, i) => (
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
          px-2 pb-3 md:px-5 md:pb-4
          grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2.5 items-stretch
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
                'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
              iconBg = 'bg-emerald-500 border-emerald-500';
              iconFg = 'text-white';
              textClass = 'text-emerald-700 dark:text-emerald-300 font-bold';
              iconText = '✓';
            } else if (isSelected) {
              boxClass =
                'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
              iconBg = 'bg-red-500 border-red-500';
              iconFg = 'text-white';
              textClass = 'text-red-700 dark:text-red-300 font-bold';
              iconText = '✕';
            } else {
              boxClass =
                'bg-[#f8f9fa] dark:bg-[#1f1f1f] border border-[#e5e7eb] dark:border-[#333] opacity-60';
            }
          } else if (showAnswer && isCorrect) {
            boxClass =
              'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800';
            iconBg = 'bg-emerald-500 border-emerald-500';
            iconFg = 'text-white';
            textClass = 'text-emerald-700 dark:text-emerald-300 font-bold';
            iconText = '✓';
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
                group relative flex items-start gap-2.5 w-full h-full
                px-3 py-1.5 rounded-lg border
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
                  w-5 h-5 rounded-full flex items-center justify-center mt-px
                  shrink-0 transition-all duration-200
                  ${iconBg}
                `}
              >
                <span
                  className={`text-[10px] font-bold leading-none ${iconFg}`}
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
        <div className="mx-2 mb-3 md:mx-5 md:mb-5 animate-fade-in">
          <div
            className="
              rounded-xl overflow-hidden
              bg-neutral-50/80 dark:bg-[#1c1c1c]
              border border-neutral-200/80 dark:border-[#333]
            "
          >
            {/* Toggle Button */}
            <button
              onClick={() => setIsExplanationOpen(!isExplanationOpen)}
              className="w-full flex items-center justify-between p-3 md:p-4 hover:bg-neutral-100/50 dark:hover:bg-[#252525] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-3.5 h-3.5 shrink-0"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
                <h4 className="text-[13px] md:text-[14px] font-bold tracking-wide text-neutral-800 dark:text-neutral-200">
                  সঠিক উত্তর ও ব্যাখ্যা
                </h4>
              </div>
              <div className="text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-800 p-1 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
                {isExplanationOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence>
              {isExplanationOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-4 md:px-5 md:pb-5 pt-1 border-t border-neutral-200/60 dark:border-neutral-800/60"
                >
                  <div className="text-[13px] md:text-[14px] text-neutral-700 dark:text-neutral-300 leading-[1.4] font-serif-exam mt-2">
                    {question.correctAnswerIndex !== undefined && (
                      <div className="mb-2.5 p-2 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-lg">
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold block mb-0.5">
                          সঠিক উত্তর:
                        </span>
                        <div className="text-emerald-800 dark:text-emerald-200 font-medium">
                          <LatexText
                            text={
                              question.options[question.correctAnswerIndex] ||
                              question.correctAnswer ||
                              ''
                            }
                          />
                        </div>
                      </div>
                    )}
                    <LatexText
                      text={question.explanation}
                      className="text-[12px] md:text-[13px]"
                    />
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
