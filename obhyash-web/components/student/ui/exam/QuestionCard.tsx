import React from 'react';
import { Question } from '@/lib/types';
import LatexText from '../common/LatexText';
import { toBengaliNumeral } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QuestionCardProps {
  question: Question;
  serialNumber?: number;
  selectedOptionIndex: number | undefined;
  isFlagged: boolean;
  onSelectOption: (optionIndex: number) => void;
  onToggleFlag: () => void; // (kept for compatibility; UI button removed)
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
        bg-white dark:bg-neutral-900
        rounded-xl mb-4 scroll-mt-24
        border border-neutral-200/80 dark:border-neutral-800
        shadow-sm hover:shadow-md transition-all duration-200
        px-3 py-3 md:px-5 md:py-4
        ${isFlagged ? 'ring-2 ring-orange-300/50' : isAnswered ? 'ring-1 ring-emerald-400/30' : ''}
        ${isOmrMode ? 'opacity-90' : ''}
      `}
    >
      {/* ── Header: Question + Content ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2 min-w-0">
          {serialNumber !== undefined && (
            <span className="shrink-0 mt-[2px] text-base font-bold text-neutral-800 dark:text-neutral-200">
              {toBengaliNumeral(serialNumber)}.
            </span>
          )}

          <div className="min-w-0 font-serif-exam text-base md:text-lg text-neutral-900 dark:text-neutral-100 leading-[1.7]">
            <LatexText text={question.question} />
          </div>
        </div>

        {/* ── Meta & Actions Row (Right-Aligned) ── */}
        <div className="flex justify-end items-center gap-3">
          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className="
                    inline-flex items-center
                    text-[11px] md:text-xs font-semibold
                    px-3 py-1 rounded-full
                    bg-cyan-100/50 text-cyan-800
                    dark:bg-cyan-900/30 dark:text-cyan-300
                  "
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Bookmark */}
            <motion.button
              whileTap={{ scale: 0.86 }}
              whileHover={{ scale: 1.06 }}
              onClick={onToggleBookmark}
              disabled={!onToggleBookmark}
              title={isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো'}
              className={`
                rounded-full px-3 py-1 inline-flex items-center gap-1.5 transition-colors
                ${!onToggleBookmark ? 'opacity-30 cursor-default' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}
                ${isBookmarked ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200' : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'}
              `}
              style={{ border: 'none' }}
            >
              <span className="text-xs font-bold">
                {isBookmarked ? 'বুকমার্ক করা' : 'বুকমার্ক'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                className="w-3.5 h-3.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 11.186 0Z"
                />
              </svg>
            </motion.button>

            {/* Report */}
            <button
              onClick={onReport}
              title="Report Issue"
              className="
                rounded-full p-1.5 transition-colors text-red-500
                hover:bg-red-50 dark:hover:bg-red-900/20
              "
              style={{ border: 'none', background: 'none' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-[18px] h-[18px]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Options ── */}
      <div
        className={`
          mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-2.5
          ${readOnly || isOmrMode ? 'pointer-events-none' : ''}
        `}
      >
        {question.options.map((option, idx) => {
          const isSelected = selectedOptionIndex === idx;
          const isCorrect = idx === question.correctAnswerIndex;
          const banglaIndex = BANGLA_INDICES[idx] || (idx + 1).toString();

          let iconText = banglaIndex;

          // Circle styles
          let iconClass =
            'border-[1.5px] border-neutral-600 text-neutral-600 ' +
            'dark:border-neutral-500 dark:text-neutral-400';

          // Text styles
          let textClass = 'text-neutral-900 dark:text-neutral-200';

          // Container styles (chorcha.net: heavily rounded, gray/off-white background, no explicit heavy borders)
          let containerClass =
            'bg-[#f0f0f0] border-transparent ' +
            'hover:bg-[#e8e8e8] ' +
            'dark:bg-[#1f1f1f] ' +
            'dark:hover:bg-[#2a2a2a]';

          if (showFeedback) {
            if (isCorrect) {
              containerClass =
                'bg-neutral-200/80 dark:bg-neutral-800 border-transparent';
              iconClass =
                'border-emerald-500 bg-emerald-500 text-white font-bold';
              textClass = 'text-neutral-900 dark:text-white font-semibold';
              iconText = '✓';
            } else if (isSelected) {
              containerClass =
                'bg-neutral-200/80 dark:bg-neutral-800 border-transparent';
              iconClass = 'border-red-500 bg-red-500 text-white font-bold';
              textClass = 'text-neutral-900 dark:text-white font-semibold';
              iconText = '✕';
            } else {
              containerClass =
                'bg-[#f0f0f0] border-transparent opacity-60 ' +
                'dark:bg-[#1f1f1f]';
            }
          } else if (showAnswer && isCorrect) {
            containerClass =
              'bg-neutral-200/80 dark:bg-neutral-800 border-transparent';
            iconClass =
              'border-emerald-500 bg-emerald-500 text-white font-bold';
            textClass = 'text-neutral-900 dark:text-white font-semibold';
            iconText = '✓';
          } else if (isSelected) {
            containerClass =
              'bg-neutral-200/80 dark:bg-neutral-800 border-transparent';
            iconClass =
              'border-neutral-800 bg-neutral-800 text-white dark:border-neutral-300 dark:bg-neutral-300 dark:text-neutral-900 font-bold';
            textClass = 'text-neutral-900 dark:text-white font-semibold';
          }

          return (
            <label
              key={idx}
              className={`
                group relative flex items-center gap-4
                px-5 py-3.5 rounded-3xl md:rounded-full border
                transition-all duration-200 h-full
                ${isOmrMode || readOnly ? 'cursor-default' : 'cursor-pointer'}
                ${containerClass}
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

              <div
                className={`
                  w-6 h-6 rounded-full flex items-center justify-center
                  transition-all duration-200 shrink-0
                  ${iconClass}
                `}
              >
                <span className="text-[11px] font-bold leading-none translate-y-px">
                  {iconText}
                </span>
              </div>

              <div
                className={`text-base font-medium leading-[1.6] select-none ${textClass}`}
              >
                <LatexText text={option} />
              </div>
            </label>
          );
        })}
      </div>

      {/* ── Explanation (review/feedback only) ── */}
      {showFeedback && question.explanation && (
        <div className="mt-4 pt-1 animate-fade-in">
          <div
            className="
              p-4 md:p-5 relative rounded-2xl shadow-sm
              bg-emerald-50/80 dark:bg-emerald-950/30
              border border-emerald-200 dark:border-emerald-800/60
            "
          >
            <div className="absolute top-4 right-4 opacity-5 dark:opacity-10 pointer-events-none text-emerald-900 dark:text-emerald-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="60"
                height="60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400"
              >
                <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.226 17.834a.75.75 0 0 0-1.06 1.06l1.591 1.59a.75.75 0 0 0 1.06-1.061l-1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.166 7.226a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591Z" />
              </svg>
              <h4 className="text-xs font-black tracking-wide text-emerald-700 dark:text-emerald-400 uppercase">
                ব্যাখ্যা (Explanation)
              </h4>
            </div>

            <div className="text-[14px] md:text-[15px] text-neutral-800 dark:text-neutral-200 leading-[1.8] font-serif-exam relative z-10">
              <LatexText text={question.explanation} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
