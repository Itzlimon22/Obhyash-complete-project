'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { hoverScale, tapScale } from '@/lib/animations';
import { GraduationCap, CheckCircle2, PlusCircle, Loader2 } from 'lucide-react';

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
      whileHover={hoverScale}
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-r from-indigo-50 via-white to-violet-50 dark:from-indigo-950/30 dark:via-neutral-900 dark:to-violet-950/30 border-indigo-100 dark:border-indigo-900/40 shadow-sm cursor-pointer"
    >
      {/* Decorative glow blobs */}
      <div className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full bg-indigo-200/30 dark:bg-indigo-800/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-violet-200/20 dark:bg-violet-800/10 blur-2xl" />

      <div className="relative flex items-center gap-4 px-4 py-3.5 md:px-5 md:py-4">
        {/* Icon */}
        <div className="shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-indigo-900/40 text-white">
          <GraduationCap className="w-5 h-5 md:w-6 md:h-6" />
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
                <CheckCircle2 className="w-3.5 h-3.5" />
                নিবন্ধিত!
              </motion.div>
            ) : (
              <motion.button
                key="cta"
                initial={{ opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                whileTap={tapScale}
                onClick={handleRegister}
                disabled={loading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                আর্লি এক্সেস নাও
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default AdmissionTrackCard;
