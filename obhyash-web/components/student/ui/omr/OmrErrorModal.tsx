'use client';

import React from 'react';

interface OmrErrorModalProps {
  error: string;
  onRetry: () => void;
  onSendToExaminer: () => void;
  onCancel: () => void;
}

const OmrErrorModal: React.FC<OmrErrorModalProps> = ({
  error,
  onRetry,
  onSendToExaminer,
  onCancel,
}) => {
  return (
    /* ── Backdrop ─────────────────────────────────────────────────── */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="omr-error-title"
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-300"
    >
      {/* ── Sheet ──────────────────────────────────────────────────── */}
      <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-4 duration-300 ease-out">
        {/* Top accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-red-600" />

        <div className="rounded-t-3xl bg-white dark:bg-neutral-900 border border-b-0 border-neutral-200/70 dark:border-neutral-700/50 shadow-2xl px-6 pb-8 pt-5">
          {/* ── Drag handle ────────────────────────────────────────── */}
          <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" />

          {/* ── Icon + Heading ─────────────────────────────────────── */}
          <div className="flex items-start gap-4 mb-4">
            {/* Gradient icon badge */}
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600 shadow-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="white"
                className="w-6 h-6"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3
                id="omr-error-title"
                className="text-lg font-bold text-neutral-900 dark:text-white leading-snug"
              >
                মূল্যায়ন ত্রুটি
              </h3>
              <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {error}
              </p>
            </div>
          </div>

          {/* ── Hint banner ────────────────────────────────────────── */}
          <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 px-4 py-3 mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              আবার চেষ্টা করো অথবা উত্তরপত্রটি সরাসরি পরীক্ষকের কাছে পাঠাও।
            </p>
          </div>

          {/* ── Action buttons ─────────────────────────────────────── */}
          <div className="flex flex-col gap-2.5">
            {/* Primary: Retry */}
            <button
              onClick={onRetry}
              className="w-full py-3.5 rounded-2xl bg-emerald-900 hover:bg-emerald-950 active:scale-[0.98] text-white font-bold text-sm transition-all duration-150 shadow-md"
            >
              পুনরায় চেষ্টা করো
            </button>

            {/* Secondary: Send to examiner */}
            <button
              onClick={onSendToExaminer}
              className="w-full py-3.5 rounded-2xl bg-white dark:bg-black hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-[0.98] text-black dark:text-white font-semibold text-sm transition-all duration-150 border border-neutral-300 dark:border-neutral-700"
            >
              ম্যানুয়ালি পাঠাও
            </button>

            {/* Ghost: Cancel */}
            <button
              onClick={onCancel}
              className="w-full py-3 rounded-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium text-sm transition-colors duration-150"
            >
              বাতিল করো
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OmrErrorModal;
