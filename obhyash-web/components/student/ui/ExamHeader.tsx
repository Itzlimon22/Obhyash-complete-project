import React, { useState } from 'react';
import { ExamDetails, AppState } from '@/lib/types';
import {
  Clock,
  Download,
  FileText,
  ClipboardList,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

interface ExamHeaderProps {
  details: ExamDetails;
  timeLeft: number;
  graceTimeLeft?: number;
  appState: AppState;
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
  onDownloadQuestionPaper,
  onDownloadOMR,
  onExit,
  answeredCount = 0,
  totalQuestions = 0,
}) => {
  const [showDownloads, setShowDownloads] = useState(false);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isGracePeriod = appState === AppState.GRACE_PERIOD;
  const displayTime = isGracePeriod ? graceTimeLeft : timeLeft;
  const progressPct =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const isCritical = !isGracePeriod && timeLeft < 60;
  const isWarning = !isGracePeriod && !isCritical && timeLeft < 300;

  const timerCls = isGracePeriod
    ? 'text-white bg-red-600 border-red-700 shadow-lg shadow-red-500/25 animate-pulse'
    : isCritical
      ? 'text-white bg-red-600 border-red-600 shadow-lg shadow-red-500/30 animate-[pulse_0.8s_ease-in-out_infinite]'
      : isWarning
        ? 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700'
        : 'text-neutral-800 dark:text-neutral-100 bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700';

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-xl border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-sm">
      {/* ── Grace period urgency bar ── */}
      {isGracePeriod && <div className="h-1 w-full bg-red-600 animate-pulse" />}

      <div className="h-14 md:h-16 flex items-center justify-between px-3 md:px-6 gap-2">
        {/* ────────────── LEFT ────────────── */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden md:flex flex-col gap-1 min-w-[140px]">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
                অগ্রগতি
              </span>
              <span className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 tabular-nums">
                {answeredCount}/{totalQuestions}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  answeredCount === totalQuestions
                    ? 'bg-emerald-500'
                    : 'bg-blue-500'
                }`}
                style={{
                  width: `${progressPct}%`,
                }}
              />
            </div>
          </div>

          {totalQuestions - answeredCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
              <span className="text-xs font-bold">
                {totalQuestions - answeredCount}টি উত্তর বাকি
              </span>
            </div>
          )}
        </div>

        {/* ────────────── RIGHT ────────────── */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Downloads dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloads((v) => !v)}
              title="ডাউনলোড করো"
              className="flex items-center gap-1.5 p-2 md:px-3 md:py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
            >
              <Download size={15} />
              <span className="hidden md:inline text-xs font-bold">
                ডাউনলোড
              </span>
            </button>

            {showDownloads && (
              <>
                <div
                  className="fixed inset-0 z-[55]"
                  onClick={() => setShowDownloads(false)}
                />
                <div className="absolute top-full mt-2 right-0 z-[60] w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 pt-3 pb-2">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em]">
                      সংগ্রহ করো
                    </p>
                  </div>
                  <div className="px-2 pb-2 space-y-0.5">
                    <button
                      onClick={() => {
                        onDownloadQuestionPaper();
                        setShowDownloads(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-red-500 shrink-0">
                        <FileText size={15} />
                      </span>
                      প্রশ্নপত্র
                    </button>
                    {/* OMR শিট download — HIDDEN (uncomment to restore)
                    <button
                      onClick={() => { onDownloadOMR(); setShowDownloads(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <span className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 shrink-0">
                        <ClipboardList size={15} />
                      </span>
                      OMR শিট
                    </button>
                    */}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 md:px-4 md:py-2 rounded-xl border transition-all duration-300 ${timerCls}`}
          >
            {isGracePeriod ? (
              <AlertTriangle size={14} className="shrink-0 md:w-4 md:h-4" />
            ) : (
              <Clock size={14} className="shrink-0 md:w-4 md:h-4" />
            )}
            <span className="text-sm md:text-lg font-black font-mono leading-none tracking-tight">
              {formatTime(displayTime)}
            </span>
            {isGracePeriod && (
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-wider opacity-80">
                গ্রেস
              </span>
            )}
          </div>

          {/* Exit — desktop only */}
          {onExit && (
            <button
              onClick={onExit}
              title="পরীক্ষা বাতিল করো"
              className="flex items-center gap-1 md:gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl border border-transparent text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all text-[11px] md:text-xs font-bold"
            >
              <LogOut size={14} className="md:w-[15px] md:h-[15px]" />
              <span>বাতিল</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;
