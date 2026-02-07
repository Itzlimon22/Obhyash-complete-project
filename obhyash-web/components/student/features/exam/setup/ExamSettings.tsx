import React from 'react';
import { Minus, Plus, Zap, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EXAM_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  NEGATIVE_MARKING_OPTIONS,
} from '@/lib/constants';
import { Difficulty } from '@/lib/types';
interface ExamSettingsProps {
  examTypes: string[];
  setExamTypes: React.Dispatch<React.SetStateAction<string[]>>;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  questionCount: number;
  setQuestionCount: (n: number) => void;
  duration: number;
  setDuration: (n: number) => void;
  negativeMarking: number;
  setNegativeMarking: (n: number) => void;
}

export const ExamSettings: React.FC<ExamSettingsProps> = ({
  examTypes,
  setExamTypes,
  difficulty,
  setDifficulty,
  questionCount,
  setQuestionCount,
  duration,
  setDuration,
  negativeMarking,
  setNegativeMarking,
}) => {
  const toggleExamType = (id: string) => {
    setExamTypes((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Must have at least one
        return prev.filter((t) => t !== id);
      }
      return [...prev, id];
    });
  };

  const handleRangeChange = (setter: (n: number) => void, value: string) => {
    setter(parseInt(value, 10));
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 delay-100">
      {/* 1. Exam Type Cards */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-neutral-900 dark:text-white">
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
                  'flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-200 text-left hover:shadow-sm',
                  isSelected
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-500/10'
                    : 'border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-200',
                )}
              >
                <div className="flex w-full justify-between items-center mb-1">
                  <span
                    className={cn(
                      'font-bold text-sm',
                      isSelected
                        ? 'text-rose-700 dark:text-rose-300'
                        : 'text-neutral-900 dark:text-white',
                    )}
                  >
                    {type.label}
                  </span>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </div>
                <span className="text-xs text-neutral-500 leading-relaxed max-w-[90%]">
                  {type.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Difficulty Segmented Control */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-neutral-900 dark:text-white">
          কঠিনতা (Difficulty)
        </label>
        <div className="bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl flex gap-1">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setDifficulty(opt.id as Difficulty)}
              className={cn(
                'flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200',
                difficulty === opt.id
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm scale-[1.02]'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Sliders Section */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800 space-y-8">
        {/* Question Count */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm">
              <HelpCircle size={18} className="text-rose-500" />
              প্রশ্নের সংখ্যা
            </div>
            <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">
              {questionCount}
            </span>
          </div>

          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={questionCount}
            onChange={(e) =>
              handleRangeChange(setQuestionCount, e.target.value)
            }
            className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
            <span>Min: 5</span>
            <span>Max: 100</span>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-neutral-900 dark:text-white font-bold text-sm">
              <Clock size={18} className="text-blue-500" />
              সময় (Time)
            </div>
            <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400">
              {duration}{' '}
              <span className="text-sm font-medium text-neutral-500">min</span>
            </span>
          </div>

          <input
            type="range"
            min={5}
            max={180}
            step={5}
            value={duration}
            onChange={(e) => handleRangeChange(setDuration, e.target.value)}
            className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
            <span>5 min</span>
            <span>3 hours</span>
          </div>
        </div>

        {/* Negative Marking */}
        <div className="space-y-3 pt-2">
          <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">
            নেগেটিভ মার্কিং (Negative Marking)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {NEGATIVE_MARKING_OPTIONS.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setNegativeMarking(val)}
                className={cn(
                  'py-2 rounded-xl text-xs font-bold border-b-2 transition-all',
                  negativeMarking === val
                    ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border-rose-500'
                    : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-transparent hover:bg-neutral-100',
                )}
              >
                {val === 0 ? '0' : `-${val}`}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
