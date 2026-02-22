'use client';

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Question } from '@/lib/types';
import LatexText from '@/components/student/ui/common/LatexText';
import { toBengaliNumeral } from '@/lib/utils';

export type FlashcardGrade = 'got_it' | 'struggling';

export interface FlashcardResult {
  question: Question;
  grade: FlashcardGrade;
  selectedIndex: number | null;
}

interface FlashcardModeProps {
  questions: Question[];
  onComplete: (results: FlashcardResult[]) => void;
  onExit: () => void;
}

const BANGLA_INDICES = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ', 'ছ', 'জ', 'ঝ', 'ঞ'];

// Tiny Web Audio API beep — no external file needed
function playCorrectSound() {
  try {
    const ctx = new (
      window.AudioContext || (window as any).webkitAudioContext
    )();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.setValueAtTime(1100, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.35);
  } catch (_) {
    // silently fail if audio not available
  }
}

type CardPhase = 'selecting' | 'revealed';

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  questions,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<CardPhase>('selecting');
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [results, setResults] = useState<FlashcardResult[]>([]);
  const [direction, setDirection] = useState(1);

  const current = questions[currentIndex];
  const total = questions.length;
  const correctIndex = current.correctAnswerIndex ?? 0;
  const isCorrect = selectedIdx === correctIndex;

  // Count correct so far for progress bar colour
  const correctSoFar = results.filter((r) => r.grade === 'got_it').length;

  const handleSelect = useCallback(
    (idx: number) => {
      if (phase === 'revealed') return;
      setSelectedIdx(idx);
      setPhase('revealed');
      if (idx === correctIndex) {
        playCorrectSound();
      }
    },
    [phase, correctIndex],
  );

  const handleNext = useCallback(() => {
    const grade: FlashcardGrade =
      selectedIdx === correctIndex ? 'got_it' : 'struggling';
    const newResults = [
      ...results,
      { question: current, grade, selectedIndex: selectedIdx },
    ];

    if (currentIndex + 1 >= total) {
      onComplete(newResults);
      return;
    }

    setDirection(1);
    setResults(newResults);
    setCurrentIndex((i) => i + 1);
    setPhase('selecting');
    setSelectedIdx(null);
  }, [
    selectedIdx,
    correctIndex,
    results,
    current,
    currentIndex,
    total,
    onComplete,
  ]);

  // Option styling mirrored from QuestionCard
  const getOptionClasses = (idx: number) => {
    let bgClass =
      'bg-neutral-50 dark:bg-neutral-800/40 hover:bg-neutral-100 dark:hover:bg-neutral-800';
    let borderClass = 'border-transparent';
    let iconBorder = 'border-neutral-300 dark:border-neutral-600';
    let iconText = BANGLA_INDICES[idx] ?? (idx + 1).toString();

    if (phase === 'revealed') {
      if (idx === correctIndex) {
        bgClass = 'bg-emerald-50 dark:bg-emerald-900/20';
        borderClass = 'border-emerald-500 dark:border-emerald-500';
        iconBorder = 'border-emerald-600 bg-emerald-600 text-white';
        iconText = '✓';
      } else if (idx === selectedIdx) {
        bgClass = 'bg-red-50 dark:bg-red-900/20';
        borderClass = 'border-red-500 dark:border-red-500';
        iconBorder = 'border-red-600 bg-red-600 text-white';
        iconText = '✕';
      } else {
        bgClass = 'bg-neutral-50 dark:bg-neutral-800/40 opacity-60';
      }
    } else if (selectedIdx === idx) {
      bgClass = 'bg-emerald-50 dark:bg-emerald-900/20';
      borderClass = 'border-emerald-500 shadow-sm';
      iconBorder = 'border-emerald-600 bg-emerald-600 text-white';
      iconText = '✓';
    }

    return { bgClass, borderClass, iconBorder, iconText };
  };

  // Left border of card
  const cardBorderLeft =
    phase === 'revealed'
      ? isCorrect
        ? 'border-l-emerald-500'
        : 'border-l-red-500'
      : 'border-l-neutral-200 dark:border-l-neutral-700';

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col">
      {/* ── Top bar ── */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between">
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
            বাতিল
          </button>

          {/* Centre: step dots */}
          <div className="flex items-center gap-1.5">
            {questions.map((_, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              const correct = done && results[i]?.grade === 'got_it';
              const wrong = done && results[i]?.grade === 'struggling';

              return (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    active
                      ? 'w-5 h-2.5 bg-emerald-600'
                      : done
                        ? correct
                          ? 'w-2.5 h-2.5 bg-emerald-500'
                          : wrong
                            ? 'w-2.5 h-2.5 bg-red-500'
                            : 'w-2.5 h-2.5 bg-neutral-300'
                        : 'w-2.5 h-2.5 bg-neutral-200 dark:bg-neutral-700'
                  }`}
                />
              );
            })}
          </div>

          {/* Score counter */}
          <div className="text-sm font-bold tabular-nums text-neutral-500 dark:text-neutral-400">
            {toBengaliNumeral(correctSoFar)}/{toBengaliNumeral(total)} সঠিক
          </div>
        </div>

        {/* Thin animated progress bar */}
        <div className="h-0.5 bg-neutral-100 dark:bg-neutral-800">
          <motion.div
            className="h-full bg-emerald-600"
            animate={{ width: `${(currentIndex / total) * 100}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* ── Card ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-24">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 40 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Card — same structure as QuestionCard */}
              <div
                className={`
                  bg-white dark:bg-neutral-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-300
                  border-l-4 border-y border-r border-neutral-100 dark:border-y-neutral-800 dark:border-r-neutral-800
                  ${cardBorderLeft}
                `}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                      প্রশ্ন {toBengaliNumeral(currentIndex + 1)}
                    </span>
                    {phase === 'revealed' && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCorrect
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {isCorrect ? 'সঠিক' : 'ভুল'}
                      </span>
                    )}
                    {(current.subjectLabel || current.subject) && (
                      <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-bold">
                        {current.subjectLabel || current.subject}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">
                    {current.points} Marks
                  </span>
                </div>

                <div className="px-5 pb-6">
                  {/* Question text */}
                  <h3 className="text-neutral-900 dark:text-neutral-100 font-serif-exam text-lg md:text-xl leading-relaxed mb-6">
                    <LatexText text={current.question} />
                  </h3>

                  {/* 2-column options grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {current.options.map((option, idx) => {
                      const { bgClass, borderClass, iconBorder, iconText } =
                        getOptionClasses(idx);
                      return (
                        <motion.label
                          key={idx}
                          whileTap={
                            phase === 'selecting' ? { scale: 0.98 } : {}
                          }
                          onClick={() => handleSelect(idx)}
                          className={`
                            relative flex items-start gap-4 p-4 rounded-xl transition-all duration-200 border h-full
                            ${phase === 'selecting' ? 'cursor-pointer' : 'cursor-default'}
                            ${bgClass} ${borderClass}
                          `}
                        >
                          <input
                            type="radio"
                            name={`flashcard-${currentIndex}`}
                            checked={selectedIdx === idx}
                            onChange={() => handleSelect(idx)}
                            disabled={phase === 'revealed'}
                            className="sr-only"
                          />
                          {/* Custom radio circle */}
                          <div
                            className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${iconBorder}`}
                          >
                            <span className="text-xs font-bold">
                              {iconText}
                            </span>
                          </div>
                          {/* Option text */}
                          <div
                            className={`text-base font-medium leading-relaxed select-none ${
                              selectedIdx === idx ||
                              (phase === 'revealed' && idx === correctIndex)
                                ? 'text-neutral-900 dark:text-neutral-100'
                                : 'text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            <LatexText text={option} />
                          </div>
                        </motion.label>
                      );
                    })}
                  </div>

                  {/* Explanation — shown after answering, same as QuestionCard */}
                  <AnimatePresence>
                    {phase === 'revealed' && current.explanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800"
                      >
                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                          <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-4 h-4"
                            >
                              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                              <path
                                fillRule="evenodd"
                                d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 0 1 0-1.113ZM17.25 12a5.25 5.25 0 1 1-10.5 0 5.25 5.25 0 0 1 10.5 0Z"
                                clipRule="evenodd"
                              />
                            </svg>
                            ব্যাখ্যা (Explanation)
                          </h4>
                          <div className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-serif-exam">
                            <LatexText text={current.explanation} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Fixed bottom next button ── */}
      <AnimatePresence>
        {phase === 'revealed' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-800"
          >
            <div className="max-w-3xl mx-auto flex items-center gap-4">
              {/* Result chip */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${
                  isCorrect
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                }`}
              >
                {isCorrect ? '✓ সঠিক' : '✗ ভুল'}
              </div>

              {/* Next / finish button */}
              <button
                onClick={handleNext}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all active:scale-[0.98] shadow-md ${
                  isCorrect
                    ? 'bg-emerald-700 hover:bg-emerald-800'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {currentIndex + 1 >= total
                  ? 'ফলাফল দেখো →'
                  : 'পরবর্তী প্রশ্ন →'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlashcardMode;
