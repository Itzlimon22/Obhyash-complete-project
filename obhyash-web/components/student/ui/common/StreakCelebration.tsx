'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';

interface StreakCelebrationProps {
  count: number;
  onComplete: () => void;
}

const StreakCelebration: React.FC<StreakCelebrationProps> = ({
  count,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 500); // Wait for fade out animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.5, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: -20, opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 200,
            }}
            className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 text-center shadow-2xl relative overflow-hidden border border-neutral-100 dark:border-neutral-800"
          >
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-500" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-100 dark:bg-red-900/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-red-100 dark:bg-red-900/20 rounded-full blur-3xl" />

            {/* Fire Icon with Pulse */}
            <div className="relative mb-6 inline-block">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-red-500/20 rounded-full blur-xl"
              />
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="relative w-24 h-24 bg-red-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-red-500/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-16 h-16 drop-shadow-md"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
            </div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-2 tracking-tight">
                {count} দিন টানা!
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 font-bold mb-6">
                আপনার স্ট্রাইক বাড়ছে, পড়া চালিয়ে যান!
              </p>

              <div className="flex items-center justify-center gap-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                    Gained
                  </span>
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-black">
                    <Sparkles size={14} />
                    <span>+20 XP</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                    Bonus
                  </span>
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-500 font-black">
                    <Zap size={14} fill="currentColor" />
                    <span>Streak</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              onClick={() => setIsVisible(false)}
              className="mt-8 w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl transition-all shadow-lg active:scale-95"
            >
              ধন্যবাদ!
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StreakCelebration;
