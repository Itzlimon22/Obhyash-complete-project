import React from 'react';
import { Question, UserAnswers } from '@/lib/types';

interface QuestionPaletteProps {
  questions: Question[];
  userAnswers: UserAnswers;
  flaggedQuestions: Set<number>;
  onQuestionClick: (id: number) => void;
}

const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  userAnswers,
  flaggedQuestions,
  onQuestionClick,
}) => {
  const getStatusClass = (id: number) => {
    const isAnswered = userAnswers[id] !== undefined;
    const isFlagged = flaggedQuestions.has(id);

    if (isFlagged)
      return 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700 ring-1 ring-amber-300 dark:ring-amber-700';
    if (isAnswered)
      return 'bg-emerald-600 text-white border-emerald-600 shadow-sm';
    return 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-emerald-300 dark:hover:border-emerald-600';
  };

  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="flex flex-col h-full max-h-full">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="font-bold text-neutral-800 dark:text-white">
          Question Palette
        </h3>
        <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
          {answeredCount}/{questions.length} Attempted
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() =>
                onQuestionClick(
                  typeof q.id === 'string' ? parseInt(q.id) : q.id,
                )
              }
              className={`
                aspect-square rounded-lg flex items-center justify-center text-xs font-bold border transition-all duration-200
                ${getStatusClass(typeof q.id === 'string' ? parseInt(q.id) : q.id)}
              `}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-3 gap-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wide">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-600"></div>{' '}
          Answered
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div> Review
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full border border-neutral-400 bg-white dark:bg-neutral-800"></div>{' '}
          Left
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
