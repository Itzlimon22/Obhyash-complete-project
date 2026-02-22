import React from 'react';
import { Question, UserAnswers } from '@/lib/types';

interface QuestionPaletteProps {
  questions: Question[];
  userAnswers: UserAnswers;
  flaggedQuestions: Set<number>;
  onQuestionClick: (id: number) => void;
}

/**
 * Renders a grid of question numbers to allow quick navigation.
 * Each cell is color-coded based on the state (Answered, Flagged, Not Answered).
 */
const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  userAnswers,
  flaggedQuestions,
  onQuestionClick,
}) => {
  // Helper to determine the CSS class based on the question status
  // Priority: Flagged > Answered > Default
  const getStatusClass = (id: number) => {
    const isAnswered = userAnswers[id] !== undefined;
    const isFlagged = flaggedQuestions.has(id);

    if (isFlagged)
      return 'bg-red-400 text-white border-red-500 ring-2 ring-red-100 dark:ring-red-900/50';
    if (isAnswered) return 'bg-emerald-500 text-white border-emerald-600';
    return 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700';
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
        প্রশ্ন তালিকা
      </h3>

      {/* Grid container with scrolling enabled */}
      <div className="flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-4 gap-2.5">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() =>
                onQuestionClick(
                  typeof q.id === 'string' ? parseInt(q.id) : q.id,
                )
              }
              className={`
                h-10 w-full rounded-md flex items-center justify-center text-sm font-semibold border transition-all
                ${getStatusClass(typeof q.id === 'string' ? parseInt(q.id) : q.id)}
              `}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Legend for the colors */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-emerald-500 border border-emerald-600"></div>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            উত্তর দেওয়া হয়েছে
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-red-400 border border-red-500"></div>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            রিভিউয়ের জন্য মার্ক করা
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"></div>
          <span className="text-sm text-slate-700 dark:text-slate-300">
            উত্তর দেওয়া হয়নি
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
