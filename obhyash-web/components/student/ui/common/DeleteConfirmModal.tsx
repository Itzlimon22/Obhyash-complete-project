'use client';

import React from 'react';
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
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop — deep dark with subtle chromatic noise */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(5, 5, 10, 0.72)' }}
            onClick={onClose}
          />

          {/* Centering wrapper */}
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="panel"
              initial={{ scale: 0.88, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="pointer-events-auto relative w-full max-w-[360px] overflow-hidden"
              style={{
                borderRadius: '20px',
                background: 'linear-gradient(160deg, #1c1c24 0%, #141418 100%)',
                boxShadow:
                  '0 32px 64px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.07)',
              }}
            >
              {/* Decorative glow */}
              <div
                className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-25"
                style={{
                  background:
                    'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 70%)',
                  filter: 'blur(24px)',
                }}
              />

              <div className="relative px-7 pt-8 pb-7">
                {/* Icon */}
                <div
                  className="mx-auto mb-5 flex items-center justify-center w-[60px] h-[60px] rounded-[18px]"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(239,68,68,0.18) 0%, rgba(185,28,28,0.12) 100%)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    boxShadow: '0 4px 20px rgba(239,68,68,0.15)',
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                    stroke="currentColor"
                    className="w-7 h-7 text-red-400"
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
                  className="text-center text-[1.15rem] font-bold tracking-tight mb-2"
                  style={{ color: '#f1f1f4' }}
                >
                  {title}
                </h3>

                {/* Description */}
                <p
                  className="text-center text-sm leading-relaxed mb-7"
                  style={{ color: '#8b8ba8' }}
                >
                  {description}
                </p>

                {/* Divider */}
                <div
                  className="mb-5 h-px w-full"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                />

                {/* Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.09)',
                      color: '#a0a0b8',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255,255,255,0.09)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255,255,255,0.05)')
                    }
                  >
                    বাতিল
                  </button>

                  <button
                    onClick={onConfirm}
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    style={{
                      background:
                        'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                      boxShadow: '0 4px 16px rgba(239,68,68,0.35)',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 6px 22px rgba(239,68,68,0.55)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow =
                        '0 4px 16px rgba(239,68,68,0.35)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
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
                        strokeWidth={2}
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
};

export default DeleteConfirmModal;
