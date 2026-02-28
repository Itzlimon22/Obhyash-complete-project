import React, { useState } from 'react';
import { ExamDetails, AppState } from '@/lib/types';
import Logo from '@/components/student/ui/Logo';

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
  onSubmit?: () => void;
  totalQuestions?: number;
  minimal?: boolean;
  answeredCount?: number;
}

const ExamHeader: React.FC<ExamHeaderProps> = ({
  timeLeft,
  graceTimeLeft = 0,
  appState,
  isOmrMode,
  onToggleOmr,
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

  const isGracePeriod = appState === AppState.GRACE_PERIOD;
  const displayTime = isGracePeriod ? graceTimeLeft : timeLeft;

  const getTimerStyles = () => {
    if (isGracePeriod) {
      return 'text-white bg-red-600 border-red-700 animate-pulse shadow-lg shadow-red-500/30';
    }
    if (timeLeft < 60) {
      return 'text-white bg-red-600 border-red-700 animate-[pulse_0.8s_ease-in-out_infinite] shadow-lg shadow-red-500/50 scale-105';
    }
    return 'text-neutral-900 bg-neutral-100/50 border-neutral-200 dark:bg-neutral-800/50 dark:border-neutral-700 dark:text-neutral-200';
  };

  return (
    <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 h-16 flex items-center justify-between px-4 md:px-6 shadow-sm z-50 sticky top-0">
      {/* ── Left Section: Logo ── */}
      <div className="flex items-center gap-3">
        <Logo variant="icon" size="sm" />
        <div className="hidden md:block">
          <h1 className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-wider">
            Live Exam
          </h1>
        </div>
      </div>

      {/* ── Right Section: Controls ── */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* OMR Toggle */}
        <div
          className={`flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all ${isGracePeriod ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-tighter">
            OMR
          </span>
          <button
            onClick={onToggleOmr}
            disabled={isGracePeriod}
            className={`relative w-8 h-4 rounded-full transition-colors ${isOmrMode ? 'bg-emerald-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 bg-white w-3 h-3 rounded-full shadow-sm transition-transform ${isOmrMode ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>

        {/* Downloads */}
        <div className="relative">
          <button
            onClick={() => setShowDownloads(!showDownloads)}
            className="p-2.5 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-all border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
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
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M12 12.75l-3-3m0 0 3-3m-3 3h7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </button>

          {showDownloads && (
            <>
              <div
                className="fixed inset-0 z-[-1]"
                onClick={() => setShowDownloads(false)}
              ></div>
              <div className="absolute top-12 right-0 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl py-2 w-56 z-[60] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    সংগ্রহ করুন
                  </p>
                </div>
                <button
                  onClick={() => {
                    onDownloadQuestionPaper();
                    setShowDownloads(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-600">
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
                  </div>
                  প্রশ্নপত্র
                </button>
                <button
                  onClick={() => {
                    onDownloadOMR();
                    setShowDownloads(false);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
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
                  </div>
                  OMR শিট
                </button>
              </div>
            </>
          )}
        </div>

        {/* Timer */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 md:px-5 md:py-2.5 rounded-xl border transition-all duration-300 ${getTimerStyles()}`}
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
              d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <span className="text-base md:text-xl font-black font-mono leading-none tracking-tight">
            {formatTime(displayTime)}
          </span>
        </div>

        {/* Exit (Desktop Only) */}
        <div className="hidden md:block">
          {onExit && (
            <button
              onClick={onExit}
              className="px-4 py-2.5 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 transition-all font-black text-[11px] uppercase tracking-widest border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
