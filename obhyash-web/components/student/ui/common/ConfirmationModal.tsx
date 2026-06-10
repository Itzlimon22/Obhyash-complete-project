"use client";

import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unansweredCount: number;
  isEvaluating?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unansweredCount,
  isEvaluating = false,
}) => {
  if (!isOpen) return null;

  const isWarning = unansweredCount > 0;

  // Deep color palette - simplified solid colors
  const colors = isWarning
    ? {
        accentLine: "bg-red-700",
        iconBg: "bg-red-700",
        primary: "bg-red-700 hover:bg-red-800",
        focusRing: "focus:ring-red-600 dark:focus:ring-red-500",
        bannerBg: "bg-red-50 dark:bg-red-950/30",
        bannerBorder: "border-red-200 dark:border-red-800/40",
        bannerText: "text-red-700 dark:text-red-400",
      }
    : {
        accentLine: "bg-emerald-700",
        iconBg: "bg-emerald-700",
        primary: "bg-emerald-700 hover:bg-emerald-800",
        focusRing: "focus:ring-emerald-600 dark:focus:ring-emerald-500",
        bannerBg: "bg-emerald-50 dark:bg-emerald-950/30",
        bannerBorder: "border-emerald-200 dark:border-emerald-800/40",
        bannerText: "text-emerald-700 dark:text-emerald-400",
      };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-300"
    >
      <div className="relative w-full max-w-lg animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ease-out">
        {/* Accent line */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-[1.5px] ${colors.accentLine} rounded-t-3xl`}
        />

        <div className="rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl px-6 pb-8 pt-5 max-h-[50vh] sm:max-h-none overflow-y-auto">
          {/* Drag handle for mobile */}
          <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700 sm:hidden" />

          {/* Icon + Heading */}
          <div className="flex items-start gap-4 mb-4">
            <div
              className={`flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl ${colors.iconBg} shadow-md`}
            >
              {isWarning ? (
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
              ) : (
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
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3
                id="confirm-modal-title"
                className="text-lg font-bold text-neutral-900 dark:text-white leading-snug"
              >
                {isWarning
                  ? "অসম্পূর্ণ পরীক্ষা"
                  : "পরীক্ষা শেষ করুন"}
              </h3>
              <p className="mt-1.5 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {isWarning
                  ? `আপনি এখনো ${unansweredCount}টি প্রশ্নের উত্তর দেননি। তুমি কি নিশ্চিত যে পরীক্ষা জমা দিতে চাও?`
                  : "তুমি সব প্রশ্নের উত্তর দিয়েছো। তুমি কি উত্তরপত্র জমা দিতে প্রস্তুত?"}
              </p>
            </div>
          </div>

          {/* Warning Banner */}
          {isWarning && (
            <div
              className={`flex items-center gap-2.5 rounded-xl ${colors.bannerBg} border ${colors.bannerBorder} px-4 py-3 mb-6`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`w-4 h-4 flex-shrink-0 ${colors.bannerText}`}
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                  clipRule="evenodd"
                />
              </svg>
              <p className={`text-xs ${colors.bannerText} font-medium`}>
                অনুত্তরিত প্রশ্নগুলো ভুল হিসেবে গণ্য হতে পারে।
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`grid grid-cols-2 gap-2.5 ${!isWarning && "mt-6"}`}>
            <button
              onClick={onConfirm}
              disabled={isEvaluating}
              className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all duration-150 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${isEvaluating ? "bg-neutral-400" : `active:scale-[0.98] ${colors.primary}`}`}
            >
              {isEvaluating ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                "জমা দাও"
              )}
            </button>
            <button
              onClick={onClose}
              disabled={isEvaluating}
              className="w-full py-3.5 rounded-2xl bg-white dark:bg-black hover:bg-neutral-100 dark:hover:bg-neutral-900 text-black dark:text-white font-semibold text-sm border border-neutral-300 dark:border-neutral-700 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              ফিরে যাও
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
