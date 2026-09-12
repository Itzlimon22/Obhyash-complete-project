'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onMenuClick: () => void;
  isLiveExam?: boolean;
  onSubmit?: () => void;
  isEvaluating?: boolean;
  answeredCount?: number;
  totalQuestions?: number;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onMenuClick,
  isLiveExam,
  onSubmit,
  isEvaluating = false,
}) => {
  /* ── Live Exam Mode ─────────────────────────────────────────── */
  if (isLiveExam) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
        <div className="bg-white/95 dark:bg-[#0A0D10]/95 backdrop-blur-[20px] border-t border-[#E5E7EB] dark:border-[#1E232B] rounded-t-[22px] flex items-center justify-between gap-3 px-4 py-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-5px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.40)]">
          <div className="flex justify-end flex-1">
            <button
              onClick={onSubmit}
              disabled={isEvaluating}
              className="w-auto bg-[#047857] hover:bg-[#065F46] disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 dark:disabled:text-neutral-600 text-white font-bold text-[13px] py-2.5 px-5 rounded-xl shadow-md active:scale-[0.96] transition-all flex items-center justify-center gap-2"
            >
              {isEvaluating ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <div className="w-4 h-4 flex items-center justify-center bg-white/20 rounded-full">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  </div>
                  পরীক্ষা শেষ করো
                </>
              )}
            </button>
          </div>
          <button
            onClick={onMenuClick}
            className="p-2.5 bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 rounded-xl border border-neutral-200 dark:border-neutral-800 active:scale-[0.9] transition-all"
            aria-label="Menu"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <rect x="3" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="3" width="7" height="7" rx="2" />
              <rect x="14" y="14" width="7" height="7" rx="2" />
              <rect x="3" y="14" width="7" height="7" rx="2" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  /* ── 5 Standard Tab Items Matching Flutter App Exactly ───────── */
  const items = [
    {
      id: 'dashboard',
      label: 'হোম',
      outlineIcon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M4 10.5L10.9 4.2a1.7 1.7 0 0 1 2.2 0L20 10.5c.6.5 1 1.3 1 2.1V19a2 2 0 0 1-2 2h-3.5a1 1 0 0 1-1-1v-4a2.5 2.5 0 0 0-5 0v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-6.4c0-.8.4-1.6 1-2.1z" />
        </svg>
      ),
      filledIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.9 4.2a1.7 1.7 0 0 1 2.2 0L20 10.5c.6.5 1 1.3 1 2.1V19a2 2 0 0 1-2 2h-3.5a1 1 0 0 1-1-1v-4a2.5 2.5 0 0 0-5 0v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2v-6.4c0-.8.4-1.6 1-2.1L10.9 4.2zM10 16a2 2 0 0 1 4 0v4h-4v-4z"
          />
        </svg>
      ),
    },
    {
      id: 'history',
      label: 'হিস্ট্রি',
      outlineIcon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M5 6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14.5l-5-3.5-5 3.5V6z" />
          <path d="M15 4h1.5a2 2 0 0 1 2 2v12.5l-3.5-2.5" />
        </svg>
      ),
      filledIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M7 4a2 2 0 0 0-2 2v14.5l5-3.5 5 3.5V6a2 2 0 0 0-2-2H7z" />
          <path d="M16 5.5A2 2 0 0 1 18.5 7v11l-2.5-1.8V5.5z" />
        </svg>
      ),
    },
    {
      id: 'setup',
      label: 'পরীক্ষা',
      outlineIcon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <path d="M12 3.5H7A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-5" />
          <path d="M18.3 2.7a2.1 2.1 0 0 1 3 3L12.5 14.5l-3.8 1 1-3.8L18.3 2.7z" />
        </svg>
      ),
      filledIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M7 3.5A3.5 3.5 0 0 0 3.5 7v10A3.5 3.5 0 0 0 7 20.5h10a3.5 3.5 0 0 0 3.5-3.5v-5h-3.2a2 2 0 0 1-1.4-.6L12.7 8.2A2 2 0 0 1 12 6.8V3.5H7z" />
          <path d="M18.3 2.7a2.1 2.1 0 0 1 3 3L12.5 14.5l-3.8 1 1-3.8L18.3 2.7z" />
        </svg>
      ),
    },
    {
      id: 'question_bank',
      label: 'প্রশ্নব্যাংক',
      outlineIcon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <rect x="3.5" y="4" width="17" height="4.5" rx="1.8" />
          <path d="M5.5 8.5L6.3 17.6A2.4 2.4 0 0 0 8.7 20h6.6a2.4 2.4 0 0 0 2.4-2.4l.8-9.1" />
          <line x1="10.5" y1="13" x2="13.5" y2="13" />
        </svg>
      ),
      filledIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <rect x="3.5" y="4" width="17" height="4.5" rx="1.8" />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M5.5 10h13l-.8 7.6a2.4 2.4 0 0 1-2.4 2.4H8.7a2.4 2.4 0 0 1-2.4-2.4L5.5 10zm4.5 3a1 1 0 0 0 0 2h4a1 1 0 1 0 0-2h-4z"
          />
        </svg>
      ),
    },
    {
      id: 'menu',
      label: 'মেনু',
      action: 'menu' as const,
      outlineIcon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="14" width="7" height="7" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
        </svg>
      ),
      filledIcon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <rect x="3" y="3" width="7" height="7" rx="2.2" />
          <rect x="14" y="3" width="7" height="7" rx="2.2" />
          <rect x="14" y="14" width="7" height="7" rx="2.2" />
          <rect x="3" y="14" width="7" height="7" rx="2.2" />
        </svg>
      ),
    },
  ];

  const handleTap = (item: (typeof items)[0]) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(8);
    }
    if (item.action === 'menu') {
      onMenuClick();
    } else {
      onTabChange(item.id);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-none">
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto w-full bg-white/95 dark:bg-[#0A0D10]/95 backdrop-blur-[20px] rounded-t-[22px] border-t border-[#E5E7EB] dark:border-[#1E232B] shadow-[0_-5px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-5px_20px_rgba(0,0,0,0.40)] px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]"
      >
        <div className="h-[58px] flex items-center justify-around">
          {items.map((item) => {
            const isAction = item.action === 'menu';
            const isActive =
              !isAction &&
              (activeTab === item.id ||
                (item.id === 'question_bank' &&
                  (activeTab === 'question-bank' ||
                    activeTab === 'question_bank')) ||
                (item.id === 'history' && activeTab === 'history') ||
                (item.id === 'setup' &&
                  (activeTab === 'setup' || activeTab === 'exam')));

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.90 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => handleTap(item)}
                className={`flex-1 flex flex-col items-center justify-center py-1 select-none transition-colors duration-200 outline-none ${
                  isActive
                    ? 'text-[#047857] dark:text-[#059669]'
                    : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#374151] dark:hover:text-[#D1D5DB]'
                }`}
              >
                <div
                  className={`transition-transform duration-200 ${
                    isActive ? 'scale-[1.08]' : 'scale-100'
                  }`}
                >
                  {isActive ? item.filledIcon : item.outlineIcon}
                </div>
                <span
                  className={`text-[12px] mt-[3px] tracking-[0.1px] transition-all duration-200 ${
                    isActive ? 'font-bold' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MobileBottomNav;
