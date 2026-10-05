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
        const { data: { session } } = await supabase.auth.getSession();
        uid = session?.user?.id;
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
        const { data: { session } } = await supabase.auth.getSession();
        uid = session?.user?.id;
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
    <div className="p-5 sm:p-6 rounded-[28px] bg-white dark:bg-[#1C1917] border border-[#EFE6DC] dark:border-[#2C2723] shadow-[0_1px_0_#fff_inset,0_18px_40px_-18px_rgba(70,30,20,0.18)] dark:shadow-none flex flex-col gap-[18px] font-sans">
      {/* ── Header: Subtitle + Main Title + Progress Pill ── */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-semibold tracking-[0.08em] text-[#7A1410] dark:text-[#F87171] uppercase">
            দৈনিক লক্ষ্য
          </div>
          <h2 className="mt-0.5 text-2xl font-bold text-[#1B1411] dark:text-white leading-tight font-['Anek_Bangla',sans-serif]">
            আজকের মিশন
          </h2>
        </div>

        {/* Progress Pill with Dots */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5EFE7] dark:bg-[#28231D]">
          {quests.map((q) => (
            <span
              key={q.id}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                q.isCompleted
                  ? "bg-[#7A1410] dark:bg-[#EF4444]"
                  : "bg-[#D9CCC0] dark:bg-[#443D36]"
              )}
            />
          ))}
          <span className="text-sm font-semibold text-[#4A3B33] dark:text-[#D1C7BD] ml-1 font-['Hind_Siliguri',sans-serif]">
            {completedCount}/{quests.length}
          </span>
        </div>
      </div>

      {/* ── Mission Items List ── */}
      <div className="flex flex-col gap-3">
        {quests.map((quest) => {
          const isReadyToClaim = quest.isCompleted && !quest.isClaimed;

          return (
            <div
              key={quest.id}
              className={cn(
                "flex items-center gap-3.5 p-3.5 sm:p-4 rounded-[20px] transition-all duration-200",
                "bg-[#FBF8F4] dark:bg-[#231F1C] border border-[#F0E8DE] dark:border-[#332C26]"
              )}
            >
              {/* Left 56x56 Indicator */}
              <div className="shrink-0">
                {quest.isClaimed ? (
                  <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="w-13 h-13 sm:w-14 sm:h-14">
                    <circle cx="28" cy="28" r="23" fill="#7A1410" stroke="#7A1410" strokeWidth="5" />
                    <path
                      d="M19 28.5l6 6 12-13"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : isReadyToClaim ? (
                  <button
                    onClick={() => handleClaim(quest)}
                    disabled={isClaiming === quest.id}
                    title="দাবি করতে ক্লিক করুন"
                    className="cursor-pointer group active:scale-95 transition-transform"
                  >
                    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="w-13 h-13 sm:w-14 sm:h-14 animate-pulse">
                      <circle cx="28" cy="28" r="23" fill="#7A1410" stroke="#B91C1C" strokeWidth="5" />
                      <path
                        d="M19 28.5l6 6 12-13"
                        fill="none"
                        stroke="#fff"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ) : (
                  <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className="w-13 h-13 sm:w-14 sm:h-14">
                    <circle
                      cx="28"
                      cy="28"
                      r="23"
                      className="fill-white dark:fill-[#1A1715] stroke-[#EADFD3] dark:stroke-[#3D352E]"
                      strokeWidth="5"
                    />
                    {quest.current > 0 && (
                      <circle
                        cx="28"
                        cy="28"
                        r="23"
                        fill="none"
                        stroke="#7A1410"
                        strokeWidth="5"
                        strokeDasharray={`${(quest.current / quest.target) * 144.5} 144.5`}
                        strokeLinecap="round"
                        transform="rotate(-90 28 28)"
                      />
                    )}
                    <text
                      x="28"
                      y="33"
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="700"
                      className="fill-[#1B1411] dark:fill-white font-['Hind_Siliguri',sans-serif]"
                    >
                      {quest.current}
                    </text>
                  </svg>
                )}
              </div>

              {/* Middle & Right Content */}
              <div className="flex-1 flex flex-col gap-2 min-w-0">
                <div
                  className={cn(
                    "text-[14px] sm:text-[15px] leading-[1.4] font-medium font-['Hind_Siliguri',sans-serif]",
                    quest.isClaimed
                      ? "text-[#5E4E45] dark:text-[#A89B91]"
                      : "text-[#1B1411] dark:text-neutral-100"
                  )}
                >
                  {quest.description}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[#4A3B33] dark:text-[#D1C7BD] font-['Hind_Siliguri',sans-serif]">
                    {quest.current}/{quest.target}
                  </span>

                  {quest.isClaimed ? (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E3EFEA] dark:bg-[#133E33] text-[#155A47] dark:text-[#34D399] text-xs font-bold font-['Hind_Siliguri',sans-serif]">
                      ক্লেইমড
                    </span>
                  ) : isReadyToClaim ? (
                    <button
                      onClick={() => handleClaim(quest)}
                      disabled={isClaiming === quest.id}
                      className="px-3 py-1 rounded-full bg-[#7A1410] hover:bg-[#5E0F0C] text-white text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center gap-1 cursor-pointer font-['Hind_Siliguri',sans-serif]"
                    >
                      <Sparkles size={11} />
                      <span>+{quest.xpReward} XP দাবি করুন</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FBEFD0] dark:bg-[#3D3116] text-[#6B4A00] dark:text-[#FBBF24] text-xs font-bold font-['Hind_Siliguri',sans-serif]">
                      +{quest.xpReward} XP
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DailyQuestsCard;
