"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Zap, CheckCircle2, Award, Target, Sparkles } from "lucide-react";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { supabase } from "@/services/core";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { celebration } from "@/lib/confetti";

export interface MasterDailyMission {
  id: string;
  title: string;
  description: string;
  metricType: "exams_count" | "correct_answers" | "streak" | "accuracy_80" | "live_or_practice" | "total_mcqs";
  target: number;
  xpReward: number;
  deepColor: string;
}

export interface DailyQuestInstance extends MasterDailyMission {
  current: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

// 10 Most Essential & Effective Master Missions (100% Identical to Flutter MasterMissionsPool)
const MASTER_MISSIONS_POOL: MasterDailyMission[] = [
  // 1. Full Model Test
  {
    id: "mission_exam_1",
    title: "মডেল টেস্ট চ্যাম্পিয়ন",
    description: "আজকের যেকোনো ১টি পূর্ণাঙ্গ মডেল টেস্ট বা পরীক্ষা সম্পন্ন করো",
    metricType: "exams_count",
    target: 1,
    xpReward: 30,
    deepColor: "#12544F", // Viridian Forest
  },
  // 2. 15 Correct Answers
  {
    id: "mission_correct_15",
    title: "নির্ভুল নিশানাবাজ",
    description: "আজ কমপক্ষে ১৫টি প্রশ্নের সঠিক উত্তর দাও",
    metricType: "correct_answers",
    target: 15,
    xpReward: 25,
    deepColor: "#740A03", // Deep Crimson
  },
  // 3. 30 Correct Answers Pro Challenge
  {
    id: "mission_correct_30",
    title: "মাস্টার ব্রেইন",
    description: "আজ কমপক্ষে ৩০টি প্রশ্নের সঠিক উত্তর দিয়ে পারদর্শী হও",
    metricType: "correct_answers",
    target: 30,
    xpReward: 40,
    deepColor: "#601D49", // Royal Mulberry
  },
  // 4. Daily Streak
  {
    id: "mission_streak_1",
    title: "অবিচল অনুশীলন",
    description: "আজকের ডেইলি পড়ার স্ট্রিক বজায় রাখো",
    metricType: "streak",
    target: 1,
    xpReward: 20,
    deepColor: "#601D49", // Royal Mulberry
  },
  // 5. Double Exam Challenge
  {
    id: "mission_exam_2",
    title: "ডাবল চ্যালেঞ্জ",
    description: "আজ যেকোনো ২টি ভিন্ন বিষয়ে পরীক্ষা সম্পন্ন করো",
    metricType: "exams_count",
    target: 2,
    xpReward: 45,
    deepColor: "#12544F", // Viridian Forest
  },
  // 6. 80%+ Accuracy Exam
  {
    id: "mission_accuracy_80",
    title: "পারফেকশনিস্ট",
    description: "যেকোনো একটি পরীক্ষায় ৮০% বা তার বেশি নির্ভুল স্কোর অর্জন করো",
    metricType: "accuracy_80",
    target: 1,
    xpReward: 35,
    deepColor: "#601D49", // Royal Mulberry
  },
  // 7. Live / Practice Exam Participation
  {
    id: "mission_live_practice",
    title: "প্রতিযোগিতার মাঠে",
    description: "আজকের লাইভ এক্সাম বা কোনো অনুশীলনী পরীক্ষায় অংশগ্রহণ করো",
    metricType: "live_or_practice",
    target: 1,
    xpReward: 30,
    deepColor: "#740A03", // Deep Crimson
  },
  // 8. 10 Correct Answers Sprint
  {
    id: "mission_speed_correct_10",
    title: "কুইক স্প্রিন্টার",
    description: "যেকোনো পরীক্ষায় কমপক্ষে ১০টি সঠিক উত্তর দিয়ে সাবমিট করো",
    metricType: "correct_answers",
    target: 10,
    xpReward: 20,
    deepColor: "#12544F", // Viridian Forest
  },
  // 9. Solve 40 MCQs
  {
    id: "mission_solve_40_mcqs",
    title: "এমসিকিউ ম্যারাথন",
    description: "আজ সব মিলিয়ে মোট ৪০টি প্রশ্ন সমাধান করো",
    metricType: "total_mcqs",
    target: 40,
    xpReward: 40,
    deepColor: "#12544F", // Viridian Forest
  },
  // 10. 20 Correct Answers Goal
  {
    id: "mission_correct_20",
    title: "লক্ষ্য পূরণ",
    description: "আজ বিভিন্ন পরীক্ষায় মোট ২০টি প্রশ্নের সঠিক উত্তর দাও",
    metricType: "correct_answers",
    target: 20,
    xpReward: 30,
    deepColor: "#601D49", // Royal Mulberry
  },
];

// 32-bit FNV-1a deterministic hash (100% Identical to Flutter MasterMissionsPool.getTodaysMissions)
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

  const len = MASTER_MISSIONS_POOL.length; // 10
  const index1 = hash % len;
  let index2 = (hash >> 8) % len;
  if (index2 === index1) index2 = (index1 + 1) % len;

  return [MASTER_MISSIONS_POOL[index1], MASTER_MISSIONS_POOL[index2]];
}

export interface DailyQuestsCardProps {
  userId?: string;
}

export const DailyQuestsCard: React.FC<DailyQuestsCardProps> = ({ userId }) => {
  const [quests, setQuests] = useState<DailyQuestInstance[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  const loadQuests = useCallback(async () => {
    try {
      let uid = userId;
      if (!uid) {
        const { data } = await supabase.auth.getUser();
        uid = data?.user?.id;
      }
      if (!uid) {
        setIsLoading(false);
        return;
      }

      const now = new Date();
      const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayStart = todayDateOnly.toISOString();
      const todayKey = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

      // 1. Fetch today's exam results
      const { data: examResults } = await supabase
        .from("exam_results")
        .select("correct_count, wrong_count, total_questions, created_at")
        .eq("user_id", uid)
        .gte("created_at", todayStart);

      let todayExamsCount = examResults?.length || 0;
      let todayCorrectAnswers = 0;
      let todayTotalMcqs = 0;
      let todayAccuracy80Count = 0;

      if (examResults) {
        for (const r of examResults) {
          const correct = Number(r.correct_count) || 0;
          const wrong = Number(r.wrong_count) || 0;
          const total = Number(r.total_questions) || correct + wrong;

          todayCorrectAnswers += correct;
          todayTotalMcqs += correct + wrong;

          if (total > 0 && correct / total >= 0.8) {
            todayAccuracy80Count++;
          }
        }
      }

      // 2. Fetch today's live exam attempts
      let todayLiveOrPracticeCount = 0;
      try {
        const { data: liveAttempts } = await supabase
          .from("live_exam_attempts")
          .select("correct_count, wrong_count, submit_time")
          .eq("user_id", uid)
          .gte("submit_time", todayStart);

        if (liveAttempts && liveAttempts.length > 0) {
          todayLiveOrPracticeCount += liveAttempts.length;
          todayExamsCount += liveAttempts.length;

          for (const l of liveAttempts) {
            const c = Number(l.correct_count) || 0;
            const w = Number(l.wrong_count) || 0;
            todayCorrectAnswers += c;
            todayTotalMcqs += c + w;
          }
        }
      } catch (_) {}

      // 3. User streak
      const { data: userProfile } = await supabase
        .from("users")
        .select("streak, streak_count")
        .eq("id", uid)
        .maybeSingle();
      const currentStreak =
        userProfile?.streak_count ?? userProfile?.streak ?? 0;

      // 4. Select the 2 Random Missions for Today
      const assignedMissions = getTodaysMissions(uid, now);

      // 5. Check server claimed state from daily_quests_state
      const serverClaimedIds = new Set<string>();
      try {
        const { data: stateRes } = await supabase
          .from("daily_quests_state")
          .select("claimed_ids, quest_date")
          .eq("user_id", uid)
          .order("quest_date", { ascending: false })
          .limit(3);

        if (stateRes) {
          for (const row of stateRes) {
            const qDate = row.quest_date?.toString();
            if (qDate === todayKey || qDate === todayStart.substring(0, 10)) {
              const claimed = row.claimed_ids;
              if (Array.isArray(claimed)) {
                claimed.forEach((c) => serverClaimedIds.add(String(c)));
              }
            }
          }
        }
      } catch (e) {
        console.warn("[DailyQuestsCard] state check:", e);
      }

      // 6. Resolve quest instances
      const resolvedQuests: DailyQuestInstance[] = assignedMissions.map((m) => {
        const localKey = `quest_claimed_${uid}_${todayKey}_${m.id}`;
        const isLocalClaimed =
          typeof window !== "undefined" &&
          localStorage.getItem(localKey) === "true";
        const isClaimed = serverClaimedIds.has(m.id) || isLocalClaimed;

        let currentVal = 0;
        switch (m.metricType) {
          case "exams_count":
            currentVal = todayExamsCount;
            break;
          case "correct_answers":
            currentVal = todayCorrectAnswers;
            break;
          case "streak":
            currentVal = currentStreak > 0 || todayExamsCount > 0 ? 1 : 0;
            break;
          case "accuracy_80":
            currentVal = todayAccuracy80Count;
            break;
          case "live_or_practice":
            currentVal = todayLiveOrPracticeCount;
            break;
          case "total_mcqs":
            currentVal = todayTotalMcqs;
            break;
          default:
            currentVal = todayExamsCount;
        }

        const clamped = Math.min(Math.max(currentVal, 0), m.target);
        return {
          ...m,
          current: clamped,
          isCompleted: clamped >= m.target,
          isClaimed,
        };
      });

      setQuests(resolvedQuests);
    } catch (err) {
      console.warn("[DailyQuestsCard] load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadQuests();
  }, [loadQuests]);

  const handleClaim = async (quest: DailyQuestInstance) => {
    if (!quest.isCompleted || quest.isClaimed || isClaiming) return;

    try {
      setIsClaiming(quest.id);

      let uid = userId;
      if (!uid) {
        const { data } = await supabase.auth.getUser();
        uid = data?.user?.id;
      }
      if (!uid) return;

      const now = new Date();
      const todayKey = `${now.getFullYear()}-${(now.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${now.getDate().toString().padStart(2, "0")}`;

      // Optimistic update
      if (typeof window !== "undefined") {
        localStorage.setItem(`quest_claimed_${uid}_${todayKey}_${quest.id}`, "true");
      }
      setQuests((prev) =>
        prev.map((q) => (q.id === quest.id ? { ...q, isClaimed: true } : q))
      );

      // Trigger celebration confetti
      celebration.quickWin();
      toast.success(`🎉 অভিনন্দন! +${quest.xpReward} XP দাবি করা হয়েছে!`);

      // Try server RPC
      try {
        await supabase.rpc("claim_daily_quest", {
          p_user_id: uid,
          p_quest_id: quest.id,
          p_xp_reward: quest.xpReward,
          p_quest_date: todayKey,
        });
      } catch (_) {
        try {
          await supabase.rpc("claim_daily_quest", {
            p_user_id: uid,
            p_quest_id: quest.id,
            p_xp_reward: quest.xpReward,
          });
        } catch (_) {
          try {
            await supabase.rpc("increment_user_xp", {
              p_user_id: uid,
              p_xp: quest.xpReward,
            });
          } catch (_) {}
        }
      }
    } catch (e) {
      console.warn("[DailyQuestsCard] Claim error:", e);
    } finally {
      setIsClaiming(null);
      loadQuests();
    }
  };

  if (isLoading) return null;

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const isAllCompleted = quests.length > 0 && completedCount === quests.length;

  return (
    <div className="p-4 sm:p-5 rounded-[20px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] shadow-sm font-['HindSiliguri']">
      {/* ── Header: Zap Badge + Title + Subtitle Badge ── */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#E6F0EC] dark:bg-[#12544F]/20 flex items-center justify-center text-[#12544F] dark:text-[#34D399]">
            <Zap className="w-4.5 h-4.5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-[15px] font-semibold text-[#18181B] dark:text-white leading-tight">
              আজকের মিশন
            </h3>
            <span className="text-[11.5px] text-neutral-500 dark:text-neutral-400">
              মিশন সম্পন্ন করে XP রিওয়ার্ড জিতুন
            </span>
          </div>
        </div>

        {/* Completion Pill */}
        <div
          className={cn(
            "px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-colors",
            isAllCompleted
              ? "bg-[#12544F]/15 dark:bg-[#12544F]/25 text-[#12544F] dark:text-[#34D399] border border-[#12544F]/30"
              : "bg-neutral-100 dark:bg-[#27272A] text-neutral-600 dark:text-neutral-300"
          )}
        >
          {isAllCompleted ? "সব সম্পন্ন! 🎉" : `${BanglaNameHelper.toBanglaNumeral(completedCount)}/${BanglaNameHelper.toBanglaNumeral(quests.length)} সম্পন্ন`}
        </div>
      </div>

      {/* ── Mission Items List ── */}
      <div className="flex flex-col gap-2.5">
        {quests.map((quest) => {
          const progressPercent = Math.min(
            100,
            Math.round((quest.current / quest.target) * 100)
          );

          return (
            <div
              key={quest.id}
              className={cn(
                "p-3 sm:p-3.5 rounded-2xl border transition-all duration-200",
                quest.isClaimed
                  ? "bg-neutral-50/60 dark:bg-[#202024]/50 border-neutral-200/60 dark:border-neutral-800"
                  : quest.isCompleted
                  ? "bg-white dark:bg-[#222226] border-[#12544F]/40 shadow-xs"
                  : "bg-white dark:bg-[#1E1E22] border-neutral-200/80 dark:border-[#2C2C30]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: quest.deepColor }}
                    />
                    <h4 className="text-xs sm:text-[13.5px] font-bold text-neutral-900 dark:text-white truncate">
                      {quest.title}
                    </h4>
                  </div>
                  <p className="text-[11.5px] text-neutral-500 dark:text-neutral-400 line-clamp-1 leading-snug">
                    {quest.description}
                  </p>
                </div>

                {/* Right Action / XP Badge */}
                <div className="shrink-0">
                  {quest.isClaimed ? (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-[#27272A] text-neutral-500 dark:text-neutral-400 text-xs font-bold">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>দাবি সম্পন্ন</span>
                    </div>
                  ) : quest.isCompleted ? (
                    <button
                      onClick={() => handleClaim(quest)}
                      disabled={isClaiming === quest.id}
                      className="px-3 py-1.5 rounded-xl bg-[#12544F] hover:bg-[#0D3E3A] text-white text-xs font-bold shadow-xs hover:shadow-md transition-all active:scale-95 flex items-center gap-1 cursor-pointer animate-pulse"
                    >
                      <Sparkles size={12} />
                      <span>দাবি করো (+{BanglaNameHelper.toBanglaNumeral(quest.xpReward)} XP)</span>
                    </button>
                  ) : (
                    <div
                      className="px-2.5 py-1 rounded-xl text-xs font-bold border"
                      style={{
                        color: quest.deepColor,
                        borderColor: `${quest.deepColor}40`,
                        backgroundColor: `${quest.deepColor}12`,
                      }}
                    >
                      +{BanglaNameHelper.toBanglaNumeral(quest.xpReward)} XP
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar & Numerical Counter */}
              <div className="mt-2.5 flex items-center gap-2.5">
                <div className="flex-1 h-2 rounded-full bg-neutral-100 dark:bg-[#27272A] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressPercent}%`,
                      backgroundColor: quest.deepColor,
                    }}
                  />
                </div>
                <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400 tabular-nums shrink-0">
                  {BanglaNameHelper.toBanglaNumeral(quest.current)}/
                  {BanglaNameHelper.toBanglaNumeral(quest.target)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyQuestsCard;
