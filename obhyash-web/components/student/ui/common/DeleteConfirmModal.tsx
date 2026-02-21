'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'তুমি কি নিশ্চিত?',
  description = 'এই পদক্ষেপটি আর ফিরে পাওয়া যাবে না।',
  confirmLabel = 'মুছে ফেলো',
  isLoading = false,
}) => {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (typeof document === 'undefined') return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Sheet wrapper — bottom on mobile, centered on desktop */}
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none">
            <motion.div
              key="panel"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="pointer-events-auto relative w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent stripe */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-red-600 rounded-t-3xl" />

              <div className="rounded-t-3xl sm:rounded-3xl bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 shadow-2xl px-6 pb-8 pt-5 text-center">
                {/* Drag handle */}
                <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700 sm:hidden" />

                {/* Icon badge */}
                <div className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="white"
                    className="w-7 h-7"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1.5">
                  {title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6">
                  {description}
                </p>

                <div className="h-px bg-neutral-100 dark:bg-neutral-800 mb-5" />

                {/* Stacked action buttons */}
                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm transition-all duration-150 shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <svg
                        className="animate-spin w-4 h-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.2}
                        stroke="currentColor"
                        className="w-4 h-4"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                        />
                      </svg>
                    )}
                    {confirmLabel}
                  </button>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="w-full py-3 rounded-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium text-sm transition-colors duration-150 disabled:opacity-50"
                  >
                    বাতিল করো
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};

export default DeleteConfirmModal;
