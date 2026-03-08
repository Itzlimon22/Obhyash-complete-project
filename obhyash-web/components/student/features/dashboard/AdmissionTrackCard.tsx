'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdmissionTrackCardProps {
  isRegistered: boolean;
  onRegister: () => Promise<void>;
}

const AdmissionTrackCard: React.FC<AdmissionTrackCardProps> = ({
  isRegistered,
  onRegister,
}) => {
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  const handleRegister = async () => {
    if (isRegistered || loading) return;
    setLoading(true);
    try {
      await onRegister();
      setJustRegistered(true);
    } finally {
      setLoading(false);
    }
  };

  const registered = isRegistered || justRegistered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-violet-50 dark:from-indigo-950/30 dark:via-neutral-900 dark:to-violet-950/30 border-indigo-100 dark:border-indigo-900/40 shadow-sm"
    >
      {/* Decorative glow blobs */}
      <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-indigo-200/30 dark:bg-indigo-800/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-violet-200/20 dark:bg-violet-800/10 blur-2xl" />

      <div className="relative flex items-center gap-4 px-4 py-3.5 md:px-5 md:py-4">
        {/* Icon */}
        <div className="shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900/40">
          <span className="text-lg">🎓</span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-extrabold text-sm md:text-base text-neutral-900 dark:text-white leading-tight">
              অ্যাডমিশন ট্র্যাক আসছে!
            </h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 uppercase tracking-wide">
              শীঘ্রই
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
            MBBS · BUET · ঢাকা বিশ্ববিদ্যালয় — আর্লি এক্সেস পেতে রেজিস্টার করো
          </p>
        </div>

        {/* CTA Button */}
        <div className="shrink-0">
          <AnimatePresence mode="wait">
            {registered ? (
              <motion.div
                key="done"
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                    clipRule="evenodd"
                  />
                </svg>
                নিবন্ধিত!
              </motion.div>
            ) : (
              <motion.button
                key="cta"
                initial={{ opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={handleRegister}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? (
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
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
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-3.5 h-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.25a.75.75 0 0 0-1.5 0v2.5h-2.5a.75.75 0 0 0 0 1.5h2.5v2.5a.75.75 0 0 0 1.5 0v-2.5h2.5a.75.75 0 0 0 0-1.5h-2.5v-2.5Z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                আর্লি এক্সেস নিন
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AdmissionTrackCard;
