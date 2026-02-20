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
  title = 'আপনি কি নিশ্চিত?',
  description = 'এই পদক্ষেপটি পূর্বাবস্থায় ফেরানো যাবে না।',
  confirmLabel = 'মুছে ফেলুন',
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

  // Only run on client (portal requirement)
  if (typeof document === 'undefined') return null;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Full-screen backdrop (rendered in <body>, covers everything) ── */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] backdrop-blur-md
                       bg-white/30 dark:bg-black/50"
            onClick={onClose}
          />

          {/* ── Dialog card ── */}
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
            <motion.div
              key="panel"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="pointer-events-auto relative w-full max-w-[360px] rounded-2xl overflow-hidden
                         bg-white dark:bg-neutral-900
                         border border-neutral-200 dark:border-neutral-700/60
                         shadow-2xl shadow-black/10 dark:shadow-black/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top accent strip */}
              <div className="h-1 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

              <div className="px-6 pt-6 pb-6">
                {/* Icon */}
                <div
                  className="mx-auto mb-4 flex items-center justify-center
                                w-14 h-14 rounded-2xl
                                bg-red-50 dark:bg-red-900/20
                                border border-red-100 dark:border-red-800/30
                                text-red-500 dark:text-red-400"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-7 h-7"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                    />
                  </svg>
                </div>

                {/* Title */}
                <h3
                  className="text-center text-[1.1rem] font-bold tracking-tight
                               text-neutral-900 dark:text-white mb-1.5"
                >
                  {title}
                </h3>

                {/* Description */}
                <p
                  className="text-center text-sm leading-relaxed
                              text-neutral-500 dark:text-neutral-400 mb-6"
                >
                  {description}
                </p>

                {/* Divider */}
                <div className="mb-5 h-px bg-neutral-100 dark:bg-neutral-800" />

                {/* Action buttons */}
                <div className="flex gap-3">
                  {/* Cancel */}
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold
                               border border-neutral-200 dark:border-neutral-700
                               text-neutral-700 dark:text-neutral-300
                               bg-neutral-50 dark:bg-neutral-800
                               hover:bg-neutral-100 dark:hover:bg-neutral-700
                               transition-colors disabled:opacity-50"
                  >
                    বাতিল
                  </button>

                  {/* Confirm / Delete */}
                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white
                               bg-gradient-to-br from-red-500 to-red-700
                               hover:from-red-600 hover:to-red-800
                               shadow-md shadow-red-200 dark:shadow-red-900/30
                               hover:shadow-lg hover:shadow-red-200 dark:hover:shadow-red-900/40
                               hover:-translate-y-px
                               transition-all disabled:opacity-60 flex items-center justify-center gap-2"
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
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Portal renders directly into <body> — escapes all layout stacking contexts
  return createPortal(modal, document.body);
};

export default DeleteConfirmModal;
