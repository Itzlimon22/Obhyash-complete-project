'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Question } from '@/lib/types';
import { QuestionCard } from '@/components/student/ui/exam/QuestionCard';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import { cn } from '@/lib/utils';

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

// Tiny Web Audio API synthesizers — matches Flutter audio/correct.wav & audio/wrong.wav
function playCorrectSound() {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
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
  } catch (_) {}
}

function playWrongSound() {
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(220, ctx.currentTime);
    o.frequency.setValueAtTime(160, ctx.currentTime + 0.1);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.35);
  } catch (_) {}
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
  const isCorrect =
    selectedIdx !== null &&
    (selectedIdx === current.correctAnswerIndex ||
      (current.correctAnswerIndices != null &&
        current.correctAnswerIndices.includes(selectedIdx)));

  // Count correct so far
  const correctSoFar = results.filter((r) => r.grade === 'got_it').length;

  const handleSelect = useCallback(
    (idx: number) => {
      if (phase === 'revealed') return;
      setSelectedIdx(idx);
      setPhase('revealed');
      const isCorrectNow =
        idx === current.correctAnswerIndex ||
        (current.correctAnswerIndices != null &&
          current.correctAnswerIndices.includes(idx));
      if (isCorrectNow) {
        playCorrectSound();
      } else {
        playWrongSound();
      }
    },
    [phase, current]
  );

  const handleNext = useCallback(() => {
    const isCorrectLoc =
      selectedIdx !== null &&
      (selectedIdx === current.correctAnswerIndex ||
        (current.correctAnswerIndices != null &&
          current.correctAnswerIndices.includes(selectedIdx)));
    const grade: FlashcardGrade = isCorrectLoc ? 'got_it' : 'struggling';
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
  }, [selectedIdx, results, current, currentIndex, total, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentIndex === 0 || results.length === 0) return;

    const prevResult = results[results.length - 1];
    if (!prevResult) return;

    setDirection(-1);
    setResults(results.slice(0, -1));
    setCurrentIndex((i) => i - 1);
    setSelectedIdx(prevResult.selectedIndex);
    setPhase(prevResult.selectedIndex !== null ? 'revealed' : 'selecting');
  }, [currentIndex, results]);

  const isLast = currentIndex + 1 >= total;
  const nextLabel = isLast
    ? 'ফলাফল দেখো'
    : phase === 'revealed'
    ? 'পরবর্তী প্রশ্ন'
    : 'পরবর্তী (স্কিপ)';

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black flex flex-col font-sans">
      {/* ── Top Status Bar (Matching Flutter 1:1) ── */}
      <div className="bg-white dark:bg-black border-b border-[#E5E5E5] dark:border-[#1C1C1E] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
          {/* Back / Cancel button */}
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 text-base font-bold text-[#525252] dark:text-[#A3A3A3] hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
            <span>বাতিল</span>
          </button>

          {/* Progress dots (if <= 12 questions) */}
          {total <= 12 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {questions.map((_, i) => {
                const done = i < currentIndex;
                const active = i === currentIndex;
                const wasCorrect = done && results[i]?.grade === 'got_it';
                const wasWrong = done && results[i]?.grade === 'struggling';

                let dotColor = 'bg-[#E5E5E5] dark:bg-[#27272A]';
                if (active) dotColor = 'bg-[#059669]';
                else if (wasCorrect) dotColor = 'bg-[#059669]';
                else if (wasWrong) dotColor = 'bg-[#B91C1C]';

                return (
                  <div
                    key={i}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-200',
                      active ? 'w-4' : 'w-1.5',
                      dotColor
                    )}
                  />
                );
              })}
            </div>
          )}

          {/* Counter */}
          <div className="text-base font-bold tabular-nums text-[#737373]">
            {BanglaNameHelper.toBanglaNumeral(correctSoFar)}/
            {BanglaNameHelper.toBanglaNumeral(total)} সঠিক
          </div>
        </div>

        {/* Linear progress bar */}
        <div className="w-full h-[2px] bg-[#E5E5E5] dark:bg-[#1C1C1E]">
          <div
            className="h-full bg-[#059669] transition-all duration-300 ease-out"
            style={{ width: `${(currentIndex / total) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Scrollable Card Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 pb-36">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${current.id}_${currentIndex}`}
              custom={direction}
              initial={{ opacity: 0, x: direction * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 24 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <QuestionCard
                question={current}
                serialNumber={currentIndex + 1}
                selectedOptionIndex={selectedIdx !== null ? selectedIdx : undefined}
                onSelectOption={(idx) => {
                  if (phase !== 'revealed') {
                    handleSelect(idx);
                  }
                }}
                showFeedback={phase === 'revealed'}
                readOnly={phase === 'revealed'}
                showAnswer={phase === 'revealed'}
                initiallyExpanded={true}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Fixed Bottom Navigation (Matching Flutter 1:1) ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom)+0.5rem)] bg-white/95 dark:bg-black/95 backdrop-blur-md border-t border-[#E5E5E5] dark:border-[#1C1C1E] z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          {/* Previous Button */}
          <button
            type="button"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center border transition-all cursor-pointer',
              currentIndex === 0
                ? 'bg-[#F5F5F5] dark:bg-[#1C1C1C] text-[#A3A3A3] border-[#E5E5E5] dark:border-[#27272A] cursor-not-allowed opacity-60'
                : 'bg-white dark:bg-[#1C1C1E] text-black dark:text-white border-[#E5E5E5] dark:border-[#27272A] active:scale-95'
            )}
            title="পূর্ববর্তী প্রশ্ন"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Result Chip */}
          {phase === 'revealed' && (
            <div
              className={cn(
                'px-3 py-2 rounded-[10px] text-base font-bold animate-in fade-in zoom-in-95 duration-200',
                isCorrect
                  ? 'bg-[#059669]/12 text-[#059669]'
                  : 'bg-[#B91C1C]/12 text-[#B91C1C]'
              )}
            >
              {isCorrect ? '✓ সঠিক' : '✗ ভুল'}
            </div>
          )}

          <div className="flex-1" />

          {/* Next / Skip Button */}
          <button
            type="button"
            onClick={handleNext}
            className={cn(
              'px-6 py-3 rounded-xl text-base font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95',
              phase === 'revealed'
                ? isCorrect
                  ? 'bg-[#059669] hover:bg-[#047857]'
                  : 'bg-[#B91C1C] hover:bg-[#991B1B]'
                : 'bg-black dark:bg-[#1C1C1E] hover:bg-neutral-800'
            )}
          >
            <span>{nextLabel}</span>
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlashcardMode;
