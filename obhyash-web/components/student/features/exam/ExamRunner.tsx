'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Download,
  Moon,
  Sun,
  AlertTriangle,
  Bookmark,
  Check,
  X,
  Flag,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AppState,
  ExamDetails,
  Question,
  UserAnswers,
  UserProfile,
} from '@/lib/types';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';
import ExamGridModal from '@/components/student/ui/exam/ExamGridModal';
import ReportModal from '@/components/student/ui/common/ReportModal';
import { downloadQuestionPaper } from '@/services/download-service';
import { cn } from '@/lib/utils';

interface ExamRunnerProps {
  appState: AppState;
  examDetails: ExamDetails | null;
  questions: Question[];
  userAnswers: UserAnswers;
  setUserAnswers: React.Dispatch<React.SetStateAction<UserAnswers>>;
  flaggedQuestions: Set<number | string>;
  setFlaggedQuestions: React.Dispatch<
    React.SetStateAction<Set<number | string>>
  >;
  timeLeft: number;
  isEvaluating?: boolean;
  onSubmit: (manual?: boolean) => void;
  onExit: () => void;
  onTimeoutReattempt?: () => void;
  onTimeoutCancel?: () => void;
  setAppState: (state: AppState) => void;
  currentUser?: UserProfile | null;
  bookmarkedIds?: Set<string>;
  onToggleBookmark?: (questionId: string | number) => void;
  navWarning?: any;
  setNavWarning?: any;
  confirmNavigation?: any;
  handleTabChange?: any;
  handleLogoutClick?: any;
  toggleTheme?: () => void;
  isDarkMode?: boolean;
}

export const ExamRunner: React.FC<ExamRunnerProps> = ({
  appState,
  examDetails,
  questions,
  userAnswers,
  setUserAnswers,
  flaggedQuestions,
  setFlaggedQuestions,
  timeLeft,
  isEvaluating = false,
  onSubmit,
  onExit,
  currentUser,
  bookmarkedIds = new Set(),
  onToggleBookmark,
  toggleTheme,
  isDarkMode = false,
}) => {
  const [showGridModal, setShowGridModal] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showExitModal, setShowExitModal] = useState<boolean>(false);
  const [showCheatingWarning, setShowCheatingWarning] =
    useState<boolean>(false);
  const [reportingQuestionId, setReportingQuestionId] = useState<
    string | number | null
  >(null);

  const backgroundWarningsRef = useRef<number>(0);
  const isSubmittingRef = useRef<boolean>(false);

  // Anti-cheat visibility listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        document.hidden &&
        appState === AppState.ACTIVE &&
        !isSubmittingRef.current
      ) {
        backgroundWarningsRef.current += 1;
        if (backgroundWarningsRef.current === 1) {
          setShowCheatingWarning(true);
        } else if (backgroundWarningsRef.current >= 2) {
          toast.error(
            'নিয়ম ভঙ্গের কারণে পরীক্ষাটি স্বয়ংক্রিয়ভাবে সাবমিট করা হয়েছে!',
          );
          isSubmittingRef.current = true;
          onSubmit(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [appState, onSubmit]);

  // Handle Browser Back Button (PopState)
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      window.history.pushState(null, '', window.location.href);
      setShowExitModal(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const progressPercent =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const remainingCount = totalQuestions - answeredCount;

  // Format timer into mm:ss
  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isTimerCritical = timeLeft <= 60;
  const isTimerWarning = timeLeft <= 300 && !isTimerCritical;

  const handleOptionSelect = (qId: string | number, optionIndex: number) => {
    if (userAnswers[qId] !== undefined) return; // Locked after one selected
    setUserAnswers((prev) => ({
      ...prev,
      [qId]: optionIndex,
    }));
  };

  const handleToggleFlag = (qId: string | number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  const handleScrollToQuestion = (index: number) => {
    const q = questions[index];
    if (q) {
      const elem = document.getElementById(`question-${q.id}`);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const confirmSubmit = () => {
    setShowSubmitModal(false);
    isSubmittingRef.current = true;
    onSubmit(true);
  };

  const handleDownloadPdf = () => {
    if (examDetails) {
      toast.info('প্রশ্নপত্র PDF তৈরি হচ্ছে...');
      downloadQuestionPaper(examDetails, questions);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 font-['HindSiliguri',sans-serif] flex flex-col select-none max-w-full overflow-x-hidden">
      {/* ── 1. Top Sticky Exam Header (Matching Flutter 1:1) ── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#000000] border-b border-[#E2E8F0] dark:border-[#27272A] shadow-xs select-none">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2">
          {/* Left: Answered / Total Pill (Clickable Question Palette) */}
          <button
            type="button"
            onClick={() => setShowGridModal(true)}
            title="উত্তর দেওয়া প্রশ্ন / মোট প্রশ্নের সংখ্যা (প্যালেট দেখতে ক্লিক করো)"
            className="h-[34px] px-2.5 py-1.5 rounded-[6px] bg-[#F1F5F9] dark:bg-[#1C1C1E] text-[#475569] dark:text-[#D4D4D4] font-semibold text-[13.5px] flex items-center gap-1 hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span>{BanglaNameHelper.toBanglaNumeral(answeredCount)}</span>
            <span>/</span>
            <span>{BanglaNameHelper.toBanglaNumeral(totalQuestions)}</span>
          </button>

          {/* Middle: Timer Capsule (Matching Flutter Warning/Critical/Normal colors exactly) */}
          <div
            title="অবশিষ্ট সময়। সময় শেষ হলে পরীক্ষা স্বয়ংক্রিয়ভাবে জমা হয়ে যাবে।"
            className={cn(
              'h-[34px] px-2.5 py-1.5 rounded-[6px] border text-sm font-semibold font-mono tabular-nums flex items-center gap-1.5 transition-all duration-300',
              isTimerCritical
                ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-[0_0_8px_rgba(220,38,38,0.3)] animate-pulse'
                : isTimerWarning
                  ? 'bg-[#FFFBEB] dark:bg-[#451A03] border-[#FDE68A] dark:border-[#B45309] text-[#B45309] dark:text-[#FCD34D]'
                  : 'bg-[#F1F5F9] dark:bg-[#1C1C1E] border-[#E2E8F0] dark:border-[#27272A] text-[#27272A] dark:text-[#F5F5F5]',
            )}
          >
            <Clock
              size={14}
              className={cn(
                isTimerCritical
                  ? 'text-white'
                  : isTimerWarning
                    ? 'text-[#B45309] dark:text-[#FCD34D]'
                    : 'text-[#475569] dark:text-[#D4D4D4]',
              )}
            />
            <span>{formatTime(timeLeft)}</span>
          </div>

          {/* Right: Download PDF & Theme Toggle Buttons */}
          <div className="flex items-center gap-1.5">
            {/* Offline PDF Download Button */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              title="অফলাইন প্রশ্নপত্র PDF ডাউনলোড করো"
              className="w-8 h-8 rounded-[6px] bg-[#F1F5F9] dark:bg-[#1C1C1E] flex items-center justify-center text-[#475569] dark:text-[#D4D4D4] hover:opacity-90 active:scale-95 transition cursor-pointer"
            >
              <Download size={16} />
            </button>

            {/* Theme Toggle Button */}
            {toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                title={isDarkMode ? 'লাইট মোড' : 'ডার্ক মোড'}
                className="w-8 h-8 rounded-[6px] bg-[#F1F5F9] dark:bg-[#1C1C1E] flex items-center justify-center text-[#475569] dark:text-[#D4D4D4] hover:opacity-90 active:scale-95 transition cursor-pointer"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Subtle Progress Bar */}
        <div className="w-full h-[2px] bg-[#E2E8F0] dark:bg-[#1C1C1E] overflow-hidden">
          <div
            className="h-full bg-[#12544F] dark:bg-[#10B981] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* ── 2. Main Question Flow Feed ── */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-3 sm:px-4 pt-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] min-w-0 max-w-full overflow-x-hidden">
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {questions.map((question, idx) => {
            const isAnswered = userAnswers[question.id] !== undefined;
            const isFlagged = flaggedQuestions.has(question.id);
            const isBookmarked = bookmarkedIds.has(question.id.toString());

            return (
              <QuestionCard
                key={question.id}
                question={question}
                serialNumber={idx + 1}
                selectedOptionIndex={userAnswers[question.id]}
                isFlagged={isFlagged}
                isBookmarked={isBookmarked}
                onSelectOption={(optIdx) =>
                  handleOptionSelect(question.id, optIdx)
                }
                onToggleFlag={() => handleToggleFlag(question.id)}
                onToggleBookmark={
                  onToggleBookmark
                    ? () => onToggleBookmark(question.id)
                    : undefined
                }
                onReport={() => setReportingQuestionId(question.id)}
              />
            );
          })}
        </div>
      </main>

      {/* ── 3. Bottom Sticky Submit Footer (Matching Flutter 1:1) ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#000000] border-t border-[#E5E7EB] dark:border-[#2C2C2C] px-4 py-2 sm:py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex justify-center items-center shadow-sm">
        <div className="max-w-3xl w-full flex justify-center">
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            disabled={isEvaluating}
            className="h-[38px] min-h-[38px] px-6 py-[7px] rounded-[8px] bg-[#12544F] text-white hover:brightness-110 active:scale-[0.98] font-semibold text-[14.5px] font-['Anek_Bangla',sans-serif] flex items-center justify-center transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {isEvaluating ? 'মূল্যায়ন হচ্ছে...' : 'জমা দাও'}
          </button>
        </div>
      </footer>

      {/* ── 4. Modals & Dialogs ── */}

      {/* Question Navigation Grid Modal */}
      <ExamGridModal
        isOpen={showGridModal}
        onClose={() => setShowGridModal(false)}
        totalQuestions={totalQuestions}
        userAnswers={userAnswers}
        flaggedQuestions={flaggedQuestions}
        questionIds={questions.map((q) => q.id)}
        onSelectQuestion={handleScrollToQuestion}
      />

      {/* Submit Confirmation Dialog (Flutter Style: 'খাতা জমা দিবে?') */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowSubmitModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-2xl border border-neutral-200/80 dark:border-[#2C2C2E] z-10 animate-in zoom-in-95 duration-200 text-center font-['HindSiliguri',sans-serif]">
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4 font-['Anek_Bangla',sans-serif]">
              খাতা জমা দিবে?
            </h3>

            {/* Stats Snapshot Row */}
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-around mb-6">
              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-0.5 font-['Anek_Bangla',sans-serif]">
                  উত্তর দেওয়া
                </span>
                <span className="text-base sm:text-lg font-bold text-[#10B981] font-['Anek_Bangla',sans-serif]">
                  {BanglaNameHelper.toBanglaNumeral(answeredCount)}/
                  {BanglaNameHelper.toBanglaNumeral(totalQuestions)}
                </span>
              </div>

              <div className="w-[1px] h-8 bg-neutral-200 dark:bg-white/[0.08]" />

              <div>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 block mb-0.5 font-['Anek_Bangla',sans-serif]">
                  বাকি আছে
                </span>
                <span
                  className={cn(
                    'text-base sm:text-lg font-bold font-["Anek_Bangla",sans-serif]',
                    remainingCount > 0 ? 'text-rose-500' : 'text-[#10B981]',
                  )}
                >
                  {BanglaNameHelper.toBanglaNumeral(remainingCount)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="py-2.5 px-4 rounded-[8px] bg-[#F1F5F9] dark:bg-[#2C2C2E] border border-[#E2E8F0] dark:border-[#3A3A3C] text-[#475569] dark:text-[#D4D4D4] hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-[0.98] font-semibold text-sm transition cursor-pointer font-['Anek_Bangla',sans-serif]"
              >
                না, পরীক্ষা দিবো
              </button>

              <button
                type="button"
                onClick={confirmSubmit}
                className="py-2.5 px-4 rounded-[8px] bg-[#12544F] text-white hover:brightness-110 active:scale-[0.98] font-semibold text-sm transition cursor-pointer shadow-sm font-['Anek_Bangla',sans-serif]"
              >
                হ্যাঁ, জমা দাও
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit / Navigation Warning Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setShowExitModal(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-2xl border border-neutral-200/80 dark:border-[#2C2C2E] z-10 animate-in zoom-in-95 duration-200 text-center font-['HindSiliguri',sans-serif]">
            <div className="w-14 h-14 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center mx-auto mb-3.5 text-orange-500">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 font-['Anek_Bangla',sans-serif]">
              সতর্কতা
            </h3>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              পরীক্ষা চলাকালীন অবস্থায় বের হওয়া যাবে না। বের হতে চাইলে পরীক্ষাটি
              জমা দিন। আপনি কি পরীক্ষা জমা দিয়ে বের হতে চান?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowExitModal(false)}
                className="py-2.5 px-4 rounded-[8px] bg-[#F1F5F9] dark:bg-[#2C2C2E] border border-[#E2E8F0] dark:border-[#3A3A3C] text-[#475569] dark:text-[#D4D4D4] hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-[0.98] font-semibold text-sm transition cursor-pointer font-['Anek_Bangla',sans-serif]"
              >
                চালিয়ে যাও
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowExitModal(false);
                  confirmSubmit();
                }}
                className="py-2.5 px-4 rounded-[8px] bg-[#12544F] text-white hover:brightness-110 active:scale-[0.98] font-semibold text-sm transition cursor-pointer shadow-sm font-['Anek_Bangla',sans-serif]"
              >
                জমা দাও
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cheating / Window Blur Warning Modal */}
      {showCheatingWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-white dark:bg-[#1C1C1E] rounded-[24px] p-6 shadow-2xl border border-rose-500/30 z-10 animate-in zoom-in-95 duration-200 text-center font-['HindSiliguri',sans-serif]">
            <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto mb-3.5 text-rose-500">
              <AlertTriangle size={28} />
            </div>

            <h3 className="text-xl font-bold text-rose-500 mb-2 font-['Anek_Bangla',sans-serif]">
              সতর্কতা!
            </h3>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed">
              তুমি পরীক্ষা চলাকালীন অন্য ট্যাব বা উইন্ডোতে গিয়েছিলে। এটি
              নিয়ম-বহির্ভূত কাজ। এরপর পুনরায় বের হলে পরীক্ষাটি স্বয়ংক্রিয়ভাবে
              বাতিল ও সাবমিট হয়ে যাবে।
            </p>

            <button
              type="button"
              onClick={() => setShowCheatingWarning(false)}
              className="w-full py-3 px-4 rounded-[12px] bg-[#DC2626] text-white shadow-[0_4px_0_#991B1B] hover:brightness-105 active:shadow-[0_1px_0_#991B1B] active:translate-y-[3px] font-bold text-sm transition cursor-pointer font-['Anek_Bangla',sans-serif]"
            >
              আমি বুঝতে পেরেছি
            </button>
          </div>
        </div>
      )}

      {/* Question Reporting Modal */}
      {reportingQuestionId && (
        <ReportModal
          isOpen={true}
          onClose={() => setReportingQuestionId(null)}
          onSubmit={(data) => {
            setReportingQuestionId(null);
            toast.success('রিপোর্ট গ্রহণ করা হয়েছে। ধন্যবাদ!');
          }}
          questionId={reportingQuestionId}
        />
      )}
    </div>
  );
};

export default ExamRunner;
