import React from 'react';
import { ExamDetails, AppState } from '@/lib/types';

interface ExamHeaderProps {
  details: ExamDetails;
  timeLeft: number;
  graceTimeLeft?: number;
  appState: AppState;
  isOmrMode: boolean;
  onToggleOmr: () => void;
  onToggleMobilePalette?: () => void;
  onDownloadQuestionPaper: () => void;
  onDownloadOMR: () => void;
  onExit?: () => void;
  minimal?: boolean;
  answeredCount?: number;
  totalQuestions?: number;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
  details,
  timeLeft,
  graceTimeLeft = 0,
  appState,
  isOmrMode,
  onToggleOmr,
  onToggleMobilePalette,
  onDownloadQuestionPaper,
  onExit,
  minimal = false,
  answeredCount = 0,
  totalQuestions = 0,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isGracePeriod = appState === AppState.GRACE_PERIOD;
  const displayTime = isGracePeriod ? graceTimeLeft : timeLeft;

  // Progress calculation
  const progressPercent =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  const getTimerStyles = () => {
    if (isGracePeriod)
      return 'text-red-700 bg-red-100 border-red-300 animate-pulse font-extrabold shadow-md shadow-red-500/20';
    // Critical time (< 60s): Strong Red, Pulse, Shadow
    if (timeLeft < 60)
      return 'text-red-700 bg-red-100 border-red-300 animate-[pulse_0.8s_ease-in-out_infinite] font-extrabold shadow-lg shadow-red-500/30 scale-105 origin-right';
    return 'text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';
  };

  return (
    <>
      <header
        className={`
        z-40 transition-all duration-300
        ${
          minimal
            ? 'sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 shadow-sm'
            : 'bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 shadow-sm'
        }
      `}
      >
        <div className="max-w-7xl mx-auto px-2 md:px-4 h-12 md:h-16 flex items-center justify-between">
          {/* Left: Title & Back (Hidden Title on Mobile) */}
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            {onExit && (
              <button
                onClick={onExit}
                className="p-1.5 md:p-2 -ml-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                title="Exit Exam"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5 8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
            )}

            <div className="flex-col min-w-0 hidden md:flex">
              <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white truncate">
                {details.subjectLabel || details.subject}
              </h1>
              {!minimal && (
                <span className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 truncate">
                  Obhyash Exam Platform
                </span>
              )}
            </div>
          </div>

          {/* Right: Controls & Timer */}
          <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end md:flex-none">
            {/* Question Download Button */}
            {onDownloadQuestionPaper && (
              <button
                onClick={onDownloadQuestionPaper}
                className="p-2 rounded-full bg-neutral-50 dark:bg-neutral-800 text-neutral-500 hover:text-emerald-600 dark:hover:text-emerald-400 border border-neutral-200 dark:border-neutral-700 transition-colors hidden sm:flex"
                title="প্রশ্নপত্র ডাউনলোড করো"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 md:w-5 md:h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
              </button>
            )}

            {/* OMR Toggle (Visible on Mobile now too) */}
            <div className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <span className="text-[10px] md:text-xs font-bold text-neutral-600 dark:text-neutral-300">
                OMR
              </span>
              <button
                onClick={onToggleOmr}
                disabled={isGracePeriod}
                className={`relative w-7 h-4 md:w-8 md:h-4 rounded-full transition-colors ${isOmrMode ? 'bg-red-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${isOmrMode ? 'tranneutral-x-3.5 md:tranneutral-x-4' : 'tranneutral-x-0'}`}
                />
              </button>
            </div>

            {/* Timer */}
            <div
              className={`flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border font-mono font-bold text-sm md:text-xl transition-all duration-300 ${getTimerStyles()}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v6c0 .414.336.75.75.75h4.5a.75.75 0 0 0 0-1.5h-3.75V6Z"
                  clipRule="evenodd"
                />
              </svg>
              {formatTime(displayTime)}
            </div>

            {/* Cockpit Toggle (Mobile Only) */}
            {onToggleMobilePalette && (
              <button
                onClick={onToggleMobilePalette}
                className="lg:hidden p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                aria-label="Open Exam Cockpit"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full bg-red-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>
    </>
  );
};

export default ExamHeader;
