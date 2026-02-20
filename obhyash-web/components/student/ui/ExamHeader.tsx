import React, { useState } from 'react';
import { ExamDetails, AppState } from '@/lib/types';

interface ExamHeaderProps {
  details: ExamDetails;
  timeLeft: number;
  graceTimeLeft?: number;
  appState: AppState;
  isOmrMode: boolean;
  onToggleOmr: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onToggleMobilePalette?: () => void;
  onDownloadQuestionPaper: () => void;
  onDownloadOMR: () => void;
  onExit?: () => void;

  // Actions
  onSubmit?: () => void;
  totalQuestions?: number;

  // Optional props to prevent errors
  minimal?: boolean;
  answeredCount?: number;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
  details,
  timeLeft,
  graceTimeLeft = 0,
  appState,
  isOmrMode,
  onToggleOmr,
  isDarkMode,
  onToggleTheme,
  onToggleMobilePalette,
  onDownloadQuestionPaper,
  onDownloadOMR,
  onExit,
}) => {
  const [showDownloads, setShowDownloads] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine which timer to show and its style
  const isGracePeriod = appState === AppState.GRACE_PERIOD;
  const displayTime = isGracePeriod ? graceTimeLeft : timeLeft;

  const getTimerStyles = () => {
    if (isGracePeriod) {
      return 'text-white bg-amber-500 border-amber-600 animate-pulse shadow-lg shadow-amber-500/30';
    }
    if (timeLeft < 60) {
      return 'text-white bg-red-600 border-red-700 animate-[pulse_0.5s_ease-in-out_infinite] shadow-lg shadow-red-500/50 scale-105 transition-all';
    }
    return 'text-neutral-900 bg-neutral-50 border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-200';
  };

  const getTimerLabel = () => {
    if (isGracePeriod) return 'আপলোডের সময়';
    return 'সময় বাকি';
  };

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 h-16 flex items-center justify-between px-3 md:px-6 shadow-sm z-50 transition-colors relative">
      <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
        {/* Back / Exit Button */}
        {onExit && (
          <button
            onClick={onExit}
            className="p-3 -ml-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            title="ফিরে যান"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 md:w-6 md:h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>
        )}

        {/* Mobile Hamburger */}
        {onToggleMobilePalette && (
          <button
            onClick={onToggleMobilePalette}
            className={`${onExit ? '' : '-ml-2'} lg:hidden p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
        )}

        <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-md shadow-sm shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 md:w-6 md:h-6 text-white"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
            />
          </svg>
        </div>
        <div className="truncate">
          <h1 className="text-sm md:text-base font-bold text-neutral-900 dark:text-white">
            Zenith পরীক্ষা
          </h1>
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-medium truncate max-w-[150px] md:max-w-[200px]">
            {details.subjectLabel || details.subject}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* OMR Toggle Switch */}
        <div
          className={`hidden md:flex items-center gap-2 mr-2 bg-neutral-100 dark:bg-neutral-800 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 ${isGracePeriod ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <label
            htmlFor="omr-toggle-header"
            className="text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer select-none"
          >
            OMR
          </label>
          <button
            id="omr-toggle-header"
            onClick={onToggleOmr}
            disabled={isGracePeriod}
            className={`relative w-9 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 ${isOmrMode ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-neutral-600'}`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${isOmrMode ? 'tranneutral-x-4' : 'tranneutral-x-0'}`}
            />
          </button>
        </div>

        {/* ✅ NEW: Download Options Button (Uses the props!) */}
        <div className="relative">
          <button
            onClick={() => setShowDownloads(!showDownloads)}
            className="p-2 rounded-full text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            title="Downloads"
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
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3-3m0 0 3-3m-3 3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </button>

          {/* Download Menu */}
          {showDownloads && (
            <div className="w-full absolute top-10 right-0 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-t-2xl sm:rounded-lg rounded-b-none sm:rounded-b-lg animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-xl py-2 w-48 z-[60]">
              <button
                onClick={() => {
                  onDownloadQuestionPaper();
                  setShowDownloads(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                প্রশ্নপত্র (Question)
              </button>
              <button
                onClick={() => {
                  onDownloadOMR();
                  setShowDownloads(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                OMR শিট
              </button>
              {/* Click outside closer overlay */}
              <div
                className="fixed inset-0 z-[-1]"
                onClick={() => setShowDownloads(false)}
              ></div>
            </div>
          )}
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 md:gap-3 px-3 py-1.5 md:px-4 md:py-2 rounded border transition-all duration-300 ${getTimerStyles()}`}
        >
          <span className="text-xs md:text-sm font-bold opacity-90 hidden xs:inline">
            {getTimerLabel()}
          </span>
          <span className="text-lg md:text-xl font-mono font-bold leading-none">
            {formatTime(displayTime)}
          </span>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
