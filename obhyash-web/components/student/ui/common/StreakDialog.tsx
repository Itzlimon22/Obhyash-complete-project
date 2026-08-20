"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Flame, Info, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

// Global cache for top streaks (persists across component mounts but not page reloads, 
// matching "reset once a day" for active sessions, but session storage can persist across reloads).
let cachedTopStreaks: any[] | null = null;
let lastFetchTime: number | null = null;

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
  const [tabIndex, setTabIndex] = useState(0);
  const [topStreaks, setTopStreaks] = useState<any[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const router = useRouter();

  const dayNames = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহস্পতি", "শুক্র", "শনি"];
  const now = new Date();
  const todayIndex = now.getDay(); // 0 = Sunday

  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchWeeklyActivity = async () => {
      setIsLoading(true);
      try {
        const { fetchUserStreakInfo } = await import("@/services/streak-service");
        const streakInfo = await fetchUserStreakInfo(userId);
        setActiveDays(streakInfo.weekActivity);
      } catch (err) {
        console.error("Error fetching weekly activity:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeeklyActivity();
  }, [isOpen, userId]);

  const fetchTopStreaks = async () => {
    // Check if we have cached data from the last 24 hours
    if (cachedTopStreaks && lastFetchTime) {
      if (Date.now() - lastFetchTime < 24 * 60 * 60 * 1000) {
        setTopStreaks(cachedTopStreaks);
        return;
      }
    }

    if (topStreaks.length > 0) return;
    setIsLoadingLeaderboard(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, name, avatar_url, streak')
        .order('streak', { ascending: false })
        .limit(5);
      if (error) throw error;
      
      cachedTopStreaks = data || [];
      lastFetchTime = Date.now();
      
      setTopStreaks(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

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
          className="relative w-full max-w-sm h-[480px] flex flex-col overflow-hidden bg-white dark:bg-[#1c1c1e] p-6 shadow-2xl border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-[32px] sm:rounded-[24px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle for mobile */}
          <div className="w-10 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto mb-4 sm:hidden" />

          {/* Top Nav Row */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-8" /> {/* Placeholder for balance */}
            
            {/* Tab Switcher */}
            <div className="flex bg-neutral-100 dark:bg-[#2c2c2e] p-1 rounded-xl">
              <button
                onClick={() => setTabIndex(0)}
                className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
                  tabIndex === 0
                    ? "bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
                style={{ fontFamily: 'Anek Bangla' }}
              >
                আমার
              </button>
              <button
                onClick={() => {
                  setTabIndex(1);
                  fetchTopStreaks();
                }}
                className={`px-4 py-1.5 text-[13px] font-bold rounded-lg transition-all ${
                  tabIndex === 1
                    ? "bg-white dark:bg-[#1c1c1e] text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
                style={{ fontFamily: 'Anek Bangla' }}
              >
                টপ ১০
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center flex-1 min-h-0 w-full overflow-y-auto">
            {tabIndex === 0 ? (
              <div className="w-full flex flex-col items-center">
                {/* Flame Icon */}
                <div className="text-emerald-600 mb-2">
                  <Flame size={72} fill="currentColor" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <div className="flex items-center gap-2 mb-8">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-white" style={{ fontFamily: 'Anek Bangla' }}>
                    {currentStreak} দিনের স্ট্রাইক
                  </h2>
                  <Info size={18} className="text-neutral-400" />
                </div>

                {/* Week label */}
                <div className="w-full text-left mb-3">
                  <h3 className="text-[15px] font-semibold text-neutral-500 dark:text-neutral-400" style={{ fontFamily: 'Anek Bangla' }}>
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
                            style={{ fontFamily: 'Anek Bangla' }}
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
            ) : (
              <div className="w-full flex flex-col pt-2 pb-6">
                {isLoadingLeaderboard ? (
                  <div className="w-full flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : topStreaks.length === 0 ? (
                  <div className="text-center text-neutral-500 py-8" style={{ fontFamily: 'Anek Bangla' }}>
                    কোন তথ্য পাওয়া যায়নি
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {topStreaks.map((u, i) => {
                      const isMe = u.id === userId;
                      return (
                        <div
                          key={u.id}
                          onClick={() => {
                            onClose();
                            router.push(`/leaderboard/user/${u.id}`);
                          }}
                          className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                            isMe
                              ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                              : "bg-neutral-50 dark:bg-[#2c2c2e] border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-[#3a3a3c]"
                          }`}
                        >
                          <div className="w-6 text-center font-bold text-neutral-400 dark:text-neutral-500">
                            {i + 1}
                          </div>
                          
                          <div className="relative w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="font-bold text-neutral-500">
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex-1 truncate">
                            <div
                              className={`font-bold text-[15px] truncate ${
                                isMe
                                  ? "text-emerald-700 dark:text-emerald-400"
                                  : "text-neutral-900 dark:text-white"
                              }`}
                              style={{ fontFamily: 'Anek Bangla' }}
                            >
                              {u.name || "অজানা"}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Flame size={16} className="text-emerald-600" fill="currentColor" />
                            <span className="font-bold text-[16px] text-neutral-900 dark:text-white">
                              {u.streak || 0}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
