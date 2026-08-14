"use client";

import React, { useState, useEffect } from "react";
import { X, Flame, Info, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

interface StreakDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number;
  userId: string;
}

export default function StreakDialog({
  isOpen,
  onClose,
  currentStreak,
  userId,
}: StreakDialogProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [activeDays, setActiveDays] = useState<boolean[]>(Array(7).fill(false));

  const dayNames = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];
  const now = new Date();
  const todayIndex = now.getDay(); // 0 = Sunday

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchWeeklyActivity = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        
        // Find most recent Sunday
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        const { data, error } = await supabase
          .from("exam_results")
          .select("created_at, date")
          .eq("user_id", userId)
          .gte("created_at", startOfWeek.toISOString());

        if (error) throw error;

        const updatedActiveDays = Array(7).fill(false);
        data?.forEach((row: any) => {
          const dateStr = row.date || row.created_at;
          if (!dateStr) return;
          const date = new Date(dateStr);
          const diffDays = Math.floor(
            (date.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (diffDays >= 0 && diffDays < 7) {
            updatedActiveDays[diffDays] = true;
          }
        });

        setActiveDays(updatedActiveDays);
      } catch (err) {
        console.error("Error fetching weekly activity:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyActivity();
  }, [isOpen, userId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm sm:p-4">
        {/* Click outside to close */}
        <div className="absolute inset-0" onClick={onClose} />
        
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm overflow-hidden bg-white dark:bg-[#1c1c1e] p-6 shadow-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-[32px] sm:rounded-[24px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle for mobile */}
          <div className="w-10 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center pt-2">
            {/* Flame Icon */}
            <div className="text-emerald-600 mb-2">
              <Flame size={72} fill="currentColor" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <div className="flex items-center gap-2 mb-8">
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                {currentStreak} দিনের স্ট্রাইক
              </h2>
              <Info size={18} className="text-neutral-400" />
            </div>

            {/* Week label */}
            <div className="w-full text-left mb-3">
              <h3 className="text-[15px] font-semibold text-neutral-500 dark:text-neutral-400">
                এই সপ্তাহ
              </h3>
            </div>

            {/* Days Row */}
            <div className="w-full flex justify-between items-center bg-neutral-50 dark:bg-[#2c2c2e] p-5 rounded-[20px] border border-neutral-200 dark:border-neutral-700">
              {isLoading ? (
                <div className="w-full flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                dayNames.map((day, index) => {
                  const isToday = index === todayIndex;
                  const isFuture = index > todayIndex;
                  const isActive = activeDays[index];

                  let circleClasses = "w-[30px] h-[30px] rounded-full flex items-center justify-center ";
                  
                  if (isActive) {
                    circleClasses += "bg-emerald-600 text-white";
                  } else if (isFuture) {
                    circleClasses += "bg-transparent border-2 border-neutral-200 dark:border-neutral-600";
                  } else if (isToday) {
                    circleClasses += "bg-transparent border-2 border-rose-500";
                  } else {
                    circleClasses += "bg-neutral-200 dark:bg-neutral-700";
                  }

                  return (
                    <div key={day} className="flex flex-col items-center gap-3">
                      <span
                        className={`text-[13.5px] ${
                          isToday
                            ? "font-bold text-neutral-900 dark:text-white"
                            : "font-medium text-neutral-500 dark:text-neutral-400"
                        }`}
                      >
                        {day}
                      </span>
                      <div className={circleClasses}>
                        {isActive && <Check size={16} strokeWidth={3.5} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
