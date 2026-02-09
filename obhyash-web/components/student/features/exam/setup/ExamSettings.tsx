import React from 'react';
import { HelpCircle, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EXAM_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  NEGATIVE_MARKING_OPTIONS,
} from '@/lib/constants';
import { Difficulty } from '@/lib/types';

interface ExamTypeSelectionProps {
  examTypes: string[];
  setExamTypes: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ExamTypeSelection: React.FC<ExamTypeSelectionProps> = ({
  examTypes,
  setExamTypes,
}) => {
  const toggleExamType = (id: string) => {
    setExamTypes((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== id);
      }
      return [...prev, id];
    });
  };

  return (
    <div className="space-y-4 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      <label className="block text-base font-bold text-neutral-900 dark:text-white mb-2">
        পরীক্ষার ধরণ (Exam Type)
      </label>
      <div className="grid grid-cols-2 gap-3">
        {EXAM_TYPE_OPTIONS.map((type) => {
          const isSelected = examTypes.includes(type.id);
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => toggleExamType(type.id)}
              className={cn(
                'flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-200 text-left hover:shadow-md',
                isSelected
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900 hover:border-neutral-200',
              )}
            >
              <div className="flex w-full justify-between items-center">
                <span
                  className={cn(
                    'font-bold text-sm',
                    isSelected
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-neutral-600 dark:text-neutral-400',
                  )}
                >
                  {type.label}
                </span>
                {isSelected && (
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shadow-sm shadow-emerald-500/50" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

interface DifficultySelectionProps {
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
}

export const DifficultySelection: React.FC<DifficultySelectionProps> = ({
  difficulty,
  setDifficulty,
}) => {
  return (
    <div className="space-y-4 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      <label className="block text-base font-bold text-neutral-900 dark:text-white mb-2">
        কঠিনতা (Difficulty)
      </label>
      <div className="bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-2xl flex gap-1.5">
        {DIFFICULTY_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setDifficulty(opt.id as Difficulty)}
            className={cn(
              'flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300',
              difficulty === opt.id
                ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-400 shadow-md scale-[1.02]'
                : 'text-neutral-500 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

interface QuestionCountSelectionProps {
  questionCount: number;
  setQuestionCount: (n: number) => void;
  noContainer?: boolean;
}

export const QuestionCountSelection: React.FC<QuestionCountSelectionProps> = ({
  questionCount,
  setQuestionCount,
  noContainer = false,
}) => {
  const content = (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-1">
        <label className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-base">
          <HelpCircle size={20} className="text-emerald-600" />
          প্রশ্নের সংখ্যা
        </label>
        <div className="px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
            {questionCount}
          </span>
        </div>
      </div>
      <div className="px-1">
        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={questionCount}
          onChange={(e) => setQuestionCount(parseInt(e.target.value))}
          className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between mt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          <span>Min: 5</span>
          <span>Max: 100</span>
        </div>
      </div>
    </div>
  );

  if (noContainer) return content;

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      {content}
    </div>
  );
};

interface TimeSelectionProps {
  duration: number;
  setDuration: (n: number) => void;
}

export const TimeSelection: React.FC<TimeSelectionProps> = ({
  duration,
  setDuration,
}) => {
  return (
    <div className="space-y-6 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      <div className="flex justify-between items-center mb-1">
        <label className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-base">
          <Clock size={20} className="text-emerald-600" />
          সময় (Time)
        </label>
        <div className="px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
            {duration}
            <span className="text-xs ml-1 font-bold opacity-70">Min</span>
          </span>
        </div>
      </div>
      <div className="px-1">
        <input
          type="range"
          min={5}
          max={180}
          step={5}
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value))}
          className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-emerald-600"
        />
        <div className="flex justify-between mt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          <span>5 min</span>
          <span>180 min</span>
        </div>
      </div>
    </div>
  );
};

interface NegativeMarkingSelectionProps {
  negativeMarking: number;
  setNegativeMarking: (n: number) => void;
}

export const NegativeMarkingSelection: React.FC<
  NegativeMarkingSelectionProps
> = ({ negativeMarking, setNegativeMarking }) => {
  return (
    <div className="space-y-4 bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      <label className="block text-base font-bold text-neutral-900 dark:text-white mb-2">
        নেগেটিভ মার্কিং (Negative Marking)
      </label>
      <div className="grid grid-cols-5 gap-2">
        {NEGATIVE_MARKING_OPTIONS.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setNegativeMarking(val)}
            className={cn(
              'py-3 rounded-2xl text-xs font-bold transition-all duration-200 border-2',
              negativeMarking === val
                ? 'bg-emerald-700 border-emerald-700 text-white shadow-lg shadow-emerald-500/30 scale-105'
                : 'bg-neutral-50 dark:bg-neutral-800 border-transparent text-neutral-600 dark:text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700',
            )}
          >
            {val === 0 ? '0' : `-${val}`}
          </button>
        ))}
      </div>
    </div>
  );
};

// Main Export remains for compatibility, but Decomposed exports are primary.
export const ExamSettings: React.FC<any> = (props) => {
  return (
    <div className="space-y-6">
      <ExamTypeSelection {...props} />
      <DifficultySelection {...props} />
      <QuestionCountSelection {...props} />
      <TimeSelection {...props} />
      <NegativeMarkingSelection {...props} />
    </div>
  );
};
