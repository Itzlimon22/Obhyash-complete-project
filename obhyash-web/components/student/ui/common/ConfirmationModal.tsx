"use client";

import React, { useState, useEffect } from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  unansweredCount: number;
  isOmrMode?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  unansweredCount,
  isOmrMode = false,
}) => {
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimatingIn(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isWarning = !isOmrMode && unansweredCount > 0;

  // Deep color palette
  const colors = isWarning
    ? {
        bg: "bg-gradient-to-br from-rose-950 to-red-950",
        bgLight: "bg-gradient-to-br from-red-50 to-rose-50",
        bgLightDark: "bg-gradient-to-br from-red-950/10 to-rose-950/10",
        primary: "bg-gradient-to-r from-red-700 to-rose-700",
        primaryHover: "hover:from-red-800 hover:to-rose-800",
        icon: "text-red-700 dark:text-red-400",
        iconBg:
          "bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-950/40 dark:to-rose-950/40",
        border: "border-red-200 dark:border-red-800/50",
        bannerBg:
          "bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-950/30 dark:to-rose-950/30",
        bannerBorder: "border-red-300 dark:border-red-700/50",
        bannerText: "text-red-800 dark:text-red-300",
      }
    : {
        bg: "bg-gradient-to-br from-emerald-950 to-green-950",
        bgLight: "bg-gradient-to-br from-emerald-50 to-green-50",
        bgLightDark: "bg-gradient-to-br from-emerald-950/10 to-green-950/10",
        primary: "bg-gradient-to-r from-emerald-700 to-green-700",
        primaryHover: "hover:from-emerald-800 hover:to-green-800",
        icon: "text-emerald-700 dark:text-emerald-400",
        iconBg:
          "bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-950/40 dark:to-green-950/40",
        border: "border-emerald-200 dark:border-emerald-800/50",
        bannerBg:
          "bg-gradient-to-r from-emerald-100 to-green-100 dark:from-emerald-950/30 dark:to-green-950/30",
        bannerBorder: "border-emerald-300 dark:border-emerald-700/50",
        bannerText: "text-emerald-800 dark:text-emerald-300",
      };

  return (
    <>
      {/* Enhanced Backdrop with Blur */}
      <div
        className={`fixed inset-0 z-[99] bg-black/40 backdrop-blur-sm transition-all duration-300 ${isAnimatingIn ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* Modern Modal Container */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none px-4 sm:px-0"
      >
        <div
          className={`relative w-full max-w-md pointer-events-auto transition-all duration-500 transform ${
            isAnimatingIn
              ? "opacity-100 scale-100 sm:translate-y-0 translate-y-0"
              : "opacity-0 scale-95 sm:translate-y-8 translate-y-12"
          }`}
        >
          {/* Animated Accent Line */}
          <div
            className={`absolute inset-x-0 top-0 h-1 ${colors.primary} rounded-t-3xl sm:rounded-t-3xl overflow-hidden`}
          >
            <div className="h-full w-full animate-pulse opacity-75" />
          </div>

          {/* Card Background with Gradient */}
          <div
            className={`rounded-t-3xl sm:rounded-3xl ${colors.bgLight} dark:${colors.bgLightDark} border ${colors.border} shadow-2xl backdrop-blur-xl px-6 py-8 max-h-[70vh] sm:max-h-none overflow-y-auto relative`}
          >
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-t-3xl sm:rounded-3xl">
              <div
                className={`absolute -top-20 -right-20 w-40 h-40 ${colors.primary} rounded-full opacity-5 blur-3xl animate-pulse`}
              />
              <div
                className={`absolute -bottom-20 -left-20 w-40 h-40 ${colors.primary} rounded-full opacity-5 blur-3xl animate-pulse`}
                style={{ animationDelay: "1s" }}
              />
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Drag handle for mobile */}
              <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700 sm:hidden" />

              {/* Header Icon + Title */}
              <div className="flex items-start gap-4 mb-6">
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl ${colors.iconBg} shadow-lg transform transition-transform duration-500 ${isAnimatingIn ? "scale-100 rotate-0" : "scale-75 -rotate-12"}`}
                >
                  {isWarning ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className={`w-7 h-7 ${colors.icon}`}
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
                      stroke="currentColor"
                      className={`w-7 h-7 ${colors.icon}`}
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
                    className="text-xl font-bold text-neutral-900 dark:text-white leading-tight tracking-tight"
                  >
                    {isOmrMode
                      ? "OMR জমা নিশ্চিত করুন"
                      : isWarning
                        ? "অসম্পূর্ণ পরীক্ষা"
                        : "পরীক্ষা শেষ করুন"}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed font-medium">
                    {isOmrMode
                      ? "আপনার OMR উত্তরপত্র জমা দিয়ে মূল্যায়নের জন্য পাঠাবেন?"
                      : isWarning
                        ? `আপনি এখনো ${unansweredCount}টি প্রশ্নের উত্তর দেননি।`
                        : "সব প্রশ্নের উত্তর দিয়েছেন। পরীক্ষা জমা দিতে প্রস্তুত?"}
                  </p>
                </div>
              </div>

              {/* Warning Banner */}
              {isWarning && (
                <div
                  className={`flex items-center gap-3 rounded-2xl ${colors.bannerBg} border ${colors.bannerBorder} px-4 py-3.5 mb-7 animate-in slide-in-from-top-2 duration-500`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className={`w-5 h-5 flex-shrink-0 ${colors.icon}`}
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className={`text-sm font-semibold ${colors.bannerText}`}>
                    অনুত্তরিত প্রশ্নগুলো ভুল হিসেবে গণ্য হবে।
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={onConfirm}
                  className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all duration-300 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-950 transform hover:scale-[1.02] active:scale-[0.98] ${
                    isWarning
                      ? `${colors.primary} ${colors.primaryHover} focus:ring-red-600 dark:focus:ring-red-500`
                      : `${colors.primary} ${colors.primaryHover} focus:ring-emerald-600 dark:focus:ring-emerald-500`
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    জমা দাও
                  </span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-semibold text-sm border-2 border-neutral-300 dark:border-neutral-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-950 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                      />
                    </svg>
                    ফিরুন
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;
