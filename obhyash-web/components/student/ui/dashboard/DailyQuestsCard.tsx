"use client";

import React, { useState, useEffect } from "react";
import { Zap, CheckCircle2, Award, Target, ChevronRight } from "lucide-react";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { supabase } from "@/services/core";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface MasterDailyMission {
  id: string;
  title: string;
  description: string;
  metricType: "exams_count" | "correct_answers" | "streak" | "accuracy_80" | "live_or_practice" | "total_mcqs";
  target: number;
  xpReward: number;
  deepColor: string;
}

const MASTER_MISSIONS_POOL: MasterDailyMission[] = [
  {
    id: "mission_exam_1",
    title: "মডেল টেস্ট চ্যাম্পিয়ন",
    description: "আজকের যেকোনো ১টি পূর্ণাঙ্গ মডেল টেস্ট বা পরীক্ষা সম্পন্ন করো",
    metricType: "exams_count",
    target: 1,
    xpReward: 30,
    deepColor: "#004633",
  },
  {
    id: "mission_correct_15",
    title: "নির্ভুল নিশানাবাজ",
    description: "আজ কমপক্ষে ১৫টি প্রশ্নের সঠিক উত্তর দাও",
    metricType: "correct_answers",
    target: 15,
    xpReward: 25,
    deepColor: "#B91C1C",
  },
  {
    id: "mission_correct_30",
    title: "মাস্টার ব্রেইন",
    description: "আজ কমপক্ষে ৩০টি প্রশ্নের সঠিক উত্তর দিয়ে পারদর্শী হও",
    metricType: "correct_answers",
    target: 30,
    xpReward: 40,
    deepColor: "#4F46E5",
  },
  {
    id: "mission_streak_1",
    title: "অবিচল অনুশীলন",
    description: "আজকের পড়ার স্ট্রিক বজায় রাখো",
    metricType: "streak",
    target: 1,
    xpReward: 20,
    deepColor: "#D97706",
  },
  {
    id: "mission_exam_2",
    title: "ডাবল চ্যালেঞ্জ",
    description: "আজ যেকোনো ২টি পরীক্ষা সম্পন্ন করো",
    metricType: "exams_count",
    target: 2,
    xpReward: 45,
    deepColor: "#0F766E",
  },
  {
    id: "mission_accuracy_80",
    title: "পারফেকশনিস্ট",
    description: "যেকোনো একটি পরীক্ষায় ৮০% বা তার বেশি স্কোর অর্জন করো",
    metricType: "accuracy_80",
    target: 1,
    xpReward: 35,
    deepColor: "#7C3AED",
  },
  {
    id: "mission_live_practice",
    title: "প্রতিযোগিতার মাঠে",
    description: "আজকের লাইভ এক্সাম বা কোনো অনুশীলনী পরীক্ষায় অংশগ্রহণ করো",
    metricType: "live_or_practice",
    target: 1,
    xpReward: 30,
    deepColor: "#E11D48",
  },
  {
    id: "mission_solve_40_mcqs",
    title: "এমসিকিউ ম্যারাথন",
    description: "আজ সব মিলিয়ে মোট ৪০টি প্রশ্ন সমাধান করো",
    metricType: "total_mcqs",
    target: 40,
    xpReward: 40,
    deepColor: "#EA580C",
  },
];

// Deterministic 2 missions selection per user per date (matches Flutter FNV-1a hash algorithm)
function getTodaysMissions(userId: string, date: Date): MasterDailyMission[] {
  const dateKey = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  const combinedKey = `${userId || "default_user"}-${dateKey}`;

  let hash = 0x811c9dc5;
  for (let i = 0; i < combinedKey.length; i++) {
    hash ^= combinedKey.charCodeAt(i);
    hash = (hash * 0x01000193) & 0x7fffffff;
  }

  const len = MASTER_MISSIONS_POOL.length;
  const index1 = hash % len;
  let index2 = (hash >> 8) % len;
  if (index2 === index1) index2 = (index1 + 1) % len;

  return [MASTER_MISSIONS_POOL[index1], MASTER_MISSIONS_POOL[index2]];
}

export interface DailyQuestsCardProps {
  userId?: string;
}

export const DailyQuestsCard: React.FC<DailyQuestsCardProps> = ({ userId }) => {
  const [missions, setMissions] = useState<MasterDailyMission[]>([]);
  const [metrics, setMetrics] = useState<Record<string, number>>({
    exams_count: 0,
    correct_answers: 0,
    streak: 0,
    accuracy_80: 0,
    live_or_practice: 0,
    total_mcqs: 0,
  });
  const [claimedMissions, setClaimedMissions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const today = new Date();
    const todayMissions = getTodaysMissions(userId || "guest", today);
    setMissions(todayMissions);

    // Load claimed status from localStorage
    const dateKey = today.toISOString().split("T")[0];
    const saved = localStorage.getItem(`claimed_missions_${userId || "guest"}_${dateKey}`);
    if (saved) {
      try {
        setClaimedMissions(new Set(JSON.parse(saved)));
      } catch (e) {}
    }

    // Fetch today's exam results to compute metrics
    const fetchTodayStats = async () => {
      try {
        let uid = userId;
        if (!uid) {
          const { data } = await supabase.auth.getUser();
          uid = data?.user?.id;
        }
        if (!uid) return;

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const { data: results } = await supabase
          .from("exam_results")
          .select("*")
          .eq("user_id", uid)
          .gte("created_at", startOfDay.toISOString());

        let examsCount = 0;
        let correctAnswers = 0;
        let totalMcqs = 0;
        let accuracy80 = 0;
        let liveOrPractice = results ? results.length : 0;

        if (results) {
          examsCount = results.length;
          results.forEach((r: any) => {
            correctAnswers += r.correct_count || 0;
            totalMcqs += r.total_questions || 0;
            const accuracy = r.total_marks > 0 ? (r.score / r.total_marks) * 100 : 0;
            if (accuracy >= 80) accuracy80 += 1;
          });
        }

        setMetrics({
          exams_count: examsCount,
          correct_answers: correctAnswers,
          streak: examsCount > 0 ? 1 : 0,
          accuracy_80: accuracy80,
          live_or_practice: liveOrPractice,
          total_mcqs: totalMcqs,
        });
      } catch (e) {
        console.warn("[DailyQuestsCard] fetch error:", e);
      }
    };

    fetchTodayStats();
  }, [userId]);

  const handleClaim = (mission: MasterDailyMission) => {
    const today = new Date();
    const dateKey = today.toISOString().split("T")[0];
    const nextClaimed = new Set(claimedMissions);
    nextClaimed.add(mission.id);
    setClaimedMissions(nextClaimed);

    localStorage.setItem(
      `claimed_missions_${userId || "guest"}_${dateKey}`,
      JSON.stringify(Array.from(nextClaimed))
    );

    toast.success(`+${mission.xpReward} XP ক্লেইম করা হয়েছে! 🎉`);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] shadow-sm font-['HindSiliguri']">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-[#2A173B] border border-purple-200 dark:border-purple-900/50 flex items-center justify-center shrink-0">
            <img src="/dashboard-icons/practice_target.svg" alt="Daily Quests" className="w-7 h-7 object-contain drop-shadow-xs" />
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-tight">
              আজকের ডেইলি মিশন
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              মিশন পূরণ করে অতিরিক্ত XP অর্জন করো
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-[#2A173B] border border-purple-200 dark:border-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold shrink-0">
          প্রতিদিন আপডেট
        </span>
      </div>

      {/* Missions List */}
      <div className="flex flex-col gap-3">
        {missions.map((mission) => {
          const currentProgress = Math.min(mission.target, metrics[mission.metricType] || 0);
          const isCompleted = currentProgress >= mission.target;
          const isClaimed = claimedMissions.has(mission.id);
          const progressPercent = Math.min(100, (currentProgress / mission.target) * 100);

          return (
            <div
              key={mission.id}
              className={cn(
                "p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3",
                isClaimed
                  ? "bg-neutral-50/80 dark:bg-[#1C1C20] border-neutral-200 dark:border-[#2E2E33] opacity-75"
                  : isCompleted
                  ? "bg-emerald-50/70 dark:bg-[#064E3B]/20 border-emerald-300 dark:border-emerald-700/50"
                  : "bg-neutral-50/50 dark:bg-[#141417] border-neutral-200/80 dark:border-[#27272A]"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-black text-neutral-900 dark:text-white truncate">
                    {mission.title}
                  </h4>
                  <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-black flex items-center gap-0.5 shrink-0">
                    <Zap size={10} className="fill-purple-500" />
                    +{BanglaNameHelper.toBanglaNumeral(mission.xpReward)} XP
                  </span>
                </div>

                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 truncate">
                  {mission.description}
                </p>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        isCompleted ? "bg-emerald-500" : "bg-purple-600"
                      )}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 shrink-0">
                    {BanglaNameHelper.toBanglaNumeral(currentProgress)}/
                    {BanglaNameHelper.toBanglaNumeral(mission.target)}
                  </span>
                </div>
              </div>

              {/* Claim / Status Button */}
              <div className="shrink-0">
                {isClaimed ? (
                  <span className="px-3 py-1.5 rounded-lg bg-neutral-200 dark:bg-neutral-800 text-neutral-500 text-xs font-bold">
                    ক্লেইমড ✓
                  </span>
                ) : isCompleted ? (
                  <button
                    type="button"
                    onClick={() => handleClaim(mission)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/30 active:scale-95 transition"
                  >
                    ক্লেইম করো
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-xs font-bold">
                    চলমান
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyQuestsCard;
