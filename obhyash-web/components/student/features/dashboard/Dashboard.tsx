import React, { useState, useRef, useMemo } from "react";
import useSWR from "swr";
import SubjectStat from "./SubjectStat";
import { celebration } from "@/lib/confetti";
import { toast } from "sonner";
import { ExamResult, UserProfile, Subject } from "@/lib/types";
import { getSubjectDisplayName } from "@/lib/data/subject-name-map";
import { DashboardSkeleton } from "@/components/student/ui/common/Skeletons";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp, hoverScale, tapScale } from "@/lib/animations";
import { ClipboardList, Dumbbell, Clock3, Medal, TrendingUp, Bookmark } from "lucide-react";
import DailyRevisionCard from "./DailyRevisionCard";
interface SubjectStats {
  id: string;
  name: string;
  correct: number;
  wrong: number;
  skipped: number;
  total: number;
}

interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  avatarColor?: string;
  avatarUrl?: string;
  gender?: string;
}

interface DashboardProps {
  user: UserProfile;
  onMockExamClick: () => void;
  onHistoryClick: () => void;
  onSubjectClick: (subject: string) => void;
  onLeaderboardClick: () => void;
  onAnalysisClick: () => void;
  onPracticeClick: () => void;
  onBookmarksClick: () => void;
  history: ExamResult[];
  examTarget?: string;
  onChangeTarget?: () => void;
}

import { useAuth } from "@/components/auth/AuthProvider";

const fetchSubjectsOnly = async ([
  _,
  userId,
  division,
  stream,
  optional_subject,
]: [
  string,
  string,
  string | undefined,
  string | undefined,
  string | undefined,
]) => {
  // Guard against race condition: on refresh, Supabase INITIAL_SESSION might fire
  // milliseconds before the internal REST client actually attaches the Bearer token.
  // If we query too early, RLS returns an empty array [] silently and SWR caches it.
  const { supabase } = await import("@/services/core");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Auth session not ready for subjects");

  // userId is already known — pass it through so getSubjects can skip
  // an extra auth.getUser() call which acquires the JS auth lock.
  const { getSubjects } = await import("@/services/database");
  return await getSubjects(
    division || undefined,
    stream || undefined,
    optional_subject || undefined,
  );
};

const fetchLeaderboardStats = async ([_, level, userId]: [string, string, string]) => {
  // Guard: ensure session is ready before fetching
  const { supabase } = await import("@/services/core");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Auth session not ready for leaderboard");

  // Use the lightweight summary endpoint — returns only topUser + userRank + xpDiff.
  // This replaces the old approach that fetched 100 full user rows just to
  // display a 2-row widget on the dashboard.
  const res = await fetch(
    `/api/leaderboard/summary?level=${encodeURIComponent(level)}&userId=${encodeURIComponent(userId)}`,
    { cache: 'no-store' }, // Always fresh — CDN cache is handled server-side
  );
  if (!res.ok) throw new Error(`Leaderboard summary HTTP ${res.status}`);
  return await res.json() as {
    topUser: { id: string; name: string; avatarUrl?: string; avatarColor?: string; xp: number } | null;
    userRank: number;
    xpDiff: number;
  };
};

const Dashboard: React.FC<DashboardProps> = ({
  user,
  onMockExamClick,
  onHistoryClick,
  onSubjectClick,
  onLeaderboardClick,
  onAnalysisClick,
  onPracticeClick,
  onBookmarksClick,
  history,
  examTarget,
  onChangeTarget,
}) => {
  const { loading: authLoading, user: authUser } = useAuth();

  // Only activate SWR keys when:
  // 1. Auth is done loading (authLoading is false)
  // 2. We have a real user with a valid ID
  // Without this, SWR fires with no session → subjects table RLS blocks the query → empty data.
  const isReady = !authLoading && !!(authUser?.id || user?.id);
  const effectiveUserId = authUser?.id || user?.id;

  type DashboardSubject = { id: string; name: string; label?: string; icon?: string; group?: string; [key: string]: any };

  const [fallbackSubjects] = useState<DashboardSubject[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = localStorage.getItem('obhyash_cached_subjects');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const { data: subjects = fallbackSubjects, isLoading: isLoadingStats } = useSWR(
    isReady && effectiveUserId
      ? [
          "userSubjects",
          effectiveUserId,
          user.division,
          user.stream,
          user.optional_subject,
        ]
      : null,
    fetchSubjectsOnly,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,            // Always re-fetch stale data (important after refresh)
      dedupingInterval: 30_000,           // 30s (was 60s — too long after session restores)
      onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
        // Retry up to 3 times with exponential backoff.
        // This recovers from the brief window where auth session is restoring but
        // the Supabase client isn't fully ready yet.
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 1000 * (retryCount + 1));
      },
      fallbackData: fallbackSubjects,
      onSuccess: (data) => {
        if (data && data.length > 0) {
          localStorage.setItem('obhyash_cached_subjects', JSON.stringify(data));
        }
      },
    },
  );

  const subjectStats = useMemo(() => {
    return subjects.map((sub: DashboardSubject) => {
      const subName = sub.name.toLowerCase();
      const subId = sub.id.toLowerCase();

      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let total = 0;

      history.forEach((exam) => {
        const hSub = (exam.subjectLabel || exam.subject).toLowerCase();
        const hSubId = exam.subject.toLowerCase();
        const isMatch =
          hSubId === subId ||
          hSub.includes(subName) ||
          hSub.includes(subId) ||
          (subName === "পদার্থবিজ্ঞান" && hSub.includes("physics")) ||
          (subName === "রসায়ন" && hSub.includes("chemistry")) ||
          (subName === "গণিত" && hSub.includes("math")) ||
          (subName === "জীববিজ্ঞান" && hSub.includes("biology")) ||
          (subName === "বাংলা" && hSub.includes("bangla")) ||
          (subName === "ইংরেজি" && hSub.includes("english")) ||
          (subName === "সাধারণ জ্ঞান" && hSub.includes("gk")) ||
          (subName === "আইসিটি" && hSub.includes("ict"));

        if (isMatch) {
          correct += exam.correctCount;
          wrong += exam.wrongCount;
          total += exam.totalQuestions;
          skipped += exam.totalQuestions - exam.correctCount - exam.wrongCount;
        }
      });

      return {
        id: sub.id,
        name: getSubjectDisplayName(sub.id),
        correct,
        wrong,
        skipped,
        total,
      };
    });
  }, [subjects, history]);

  const prevRankRef = useRef<number>(0);

  const { data: leaderboardSummary, isLoading: isLoadingLeaderboard } =
    useSWR(
      isReady && effectiveUserId
        ? ["leaderboardSummary", user.level || "Rookie", effectiveUserId]
        : null,
      fetchLeaderboardStats,
      {
        revalidateOnFocus: false,
        revalidateIfStale: true,
        dedupingInterval: 180_000,  // 3 min — matches the CDN cache-control
        onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
          if (retryCount >= 3) return;
          setTimeout(() => revalidate({ retryCount }), 1000 * (retryCount + 1));
        },
      },
    );

  // Destructure directly from the summary response — no more client-side array sorting needed.
  const topUser = leaderboardSummary?.topUser ?? null;
  const userRank = leaderboardSummary?.userRank ?? 0;
  const xpDiff = leaderboardSummary?.xpDiff ?? 0;

  React.useEffect(() => {
    if (userRank > 0) {
      if (prevRankRef.current > 0 && userRank < prevRankRef.current) {
        celebration.achievement();
        toast.success("অভিনন্দন! তোমার র‍্যাংক উন্নত হয়েছে!", {
          description: `তুমি এখন #${userRank} স্থানে আছো।`,
        });
      }
      prevRankRef.current = userRank;
    }
  }, [userRank]);

  if (isLoadingStats && !subjectStats.length) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 px-1"
    >
      {/* Daily Spaced Repetition Memory Revision Card (Temporarily hidden) */}
      {/* <motion.div variants={fadeInUp} className="lg:col-span-3">
        <DailyRevisionCard userId={user?.id} />
      </motion.div> */}

      {/* Cards Section */}
      <motion.div variants={fadeInUp} className="lg:col-span-2 grid grid-cols-3 gap-2 sm:gap-3 h-fit">
        {/* মক পরীক্ষা */}
        <motion.button
          variants={fadeInUp}
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={onMockExamClick}
          className="group relative overflow-hidden bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-200 text-center h-[4.5rem] sm:h-20 md:h-24"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform shrink-0">
            <ClipboardList className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-tight">
            মক পরীক্ষা
          </h3>
        </motion.button>

        {/* অনুশীলন */}
        <motion.button
          variants={fadeInUp}
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={onPracticeClick}
          className="group relative overflow-hidden bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-200 text-center h-[4.5rem] sm:h-20 md:h-24"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform shrink-0">
            <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-tight">
            অনুশীলন
          </h3>
        </motion.button>

        {/* ইতিহাস */}
        <motion.button
          variants={fadeInUp}
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={onHistoryClick}
          className="group relative overflow-hidden bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-200 text-center h-[4.5rem] sm:h-20 md:h-24"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform shrink-0">
            <Clock3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-tight">
            ইতিহাস
          </h3>
        </motion.button>

        {/* লিডারবোর্ড */}
        <motion.button
          variants={fadeInUp}
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={onLeaderboardClick}
          className="group relative overflow-hidden bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-200 text-center h-[4.5rem] sm:h-20 md:h-24"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform shrink-0">
            <Medal className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-tight">
            লিডারবোর্ড
          </h3>
        </motion.button>

        {/* এনালাইসিস */}
        <motion.button
          variants={fadeInUp}
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={onAnalysisClick}
          className="group relative overflow-hidden bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-200 text-center h-[4.5rem] sm:h-20 md:h-24"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-tight">
            এনালাইসিস
          </h3>
        </motion.button>

        {/* বুকমার্কস */}
        <motion.button
          variants={fadeInUp}
          whileHover={hoverScale}
          whileTap={tapScale}
          onClick={onBookmarksClick}
          className="group relative overflow-hidden bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900/40 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col items-center justify-center gap-1.5 sm:gap-2 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-200 text-center h-[4.5rem] sm:h-20 md:h-24"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:scale-110 transition-transform shrink-0">
            <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors leading-tight">
            বুকমার্কস
          </h3>
        </motion.button>
      </motion.div>

      {/* Leaderboard Section — HIDDEN (remove comment to restore):
      {/* Leaderboard Section - Order 2 on Mobile, Right Column on Desktop * /}
      <div className="lg:col-span-1 h-full">
        <div
          onClick={onLeaderboardClick}
          className="relative bg-white dark:bg-neutral-900 rounded-3xl p-5 md:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden group cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-900/50 transition-all active:scale-[0.99] duration-200 h-full"
        >
          {/* Subtle Background Pattern * /}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-50 to-transparent dark:from-emerald-900/10 dark:to-transparent rounded-bl-full -mr-4 -mt-4 opacity-50"></div>

          <div className="flex justify-between items-center mb-4 relative z-10">
            <h3 className="text-base font-bold text-neutral-800 dark:text-white flex items-center gap-2">
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.625 6.753 6.753 0 0 0 6.138-5.625.75.75 0 0 0-.584-.86 47.78 47.78 0 0 0-3.07-.542V2.62a.75.75 0 0 0-.75-.75h-3.467a.75.75 0 0 0-.75.75ZM12.75 21.696a.75.75 0 0 1-.75.75H12a.75.75 0 0 1-.75-.75v-3.803a6.753 6.753 0 0 1-5.625-6.138.75.75 0 0 1 .859-.584c.213.036.427.07.641.1V9.75a.75.75 0 0 1 .75-.75h7.5a.75.75 0 0 1 .75.75v1.521c.214-.03.428-.064.641-.1a.75.75 0 0 1 .859.584 6.753 6.753 0 0 1-5.625 6.138v3.803Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              লিডারবোর্ড
            </h3>
            <button className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 group-hover:gap-1.5 transition-all bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">
              সব দেখো
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3 h-3"
              >
                <path
                  fillRule="evenodd"
                  d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Mini Leaderboard Table * /}
          <div className="relative z-10 space-y-2">
            {/* Header Row * /}
            <div className="grid grid-cols-[2rem_2rem_1fr] gap-2.5 items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              <span>#</span>
              <span></span>
              <span>নাম</span>
            </div>

            {/* Topper Row * /}
            <div className="grid grid-cols-[2rem_2rem_1fr] gap-2.5 items-center px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-50/30 dark:from-emerald-900/20 dark:to-emerald-900/5 border border-emerald-100/60 dark:border-emerald-800/30">
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                🥇
              </span>
              {isLoadingLeaderboard ? (
                <>
                  <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-700 animate-pulse"></div>
                  <div className="h-3.5 w-24 bg-neutral-200 dark:bg-neutral-700 rounded-full animate-pulse"></div>
                </>
              ) : topUser ? (
                <>
                  <UserAvatar
                    user={{ id: topUser.id, name: topUser.name, avatar_url: topUser.avatarUrl, avatarColor: topUser.avatarColor } as unknown as UserProfile}
                    size="sm"
                    className="w-7 h-7 text-[11px] shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-800"
                  />
                  <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                    {topUser.name?.split(" ").slice(0, 2).join(" ")}
                  </span>
                </>
              ) : (
                <>
                  <div className="w-7 h-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 text-lg">
                    —
                  </div>
                  <span className="text-sm text-neutral-400 dark:text-neutral-500">
                    কেউ নেই
                  </span>
                </>
              )}
            </div>

            {/* Current User Row * /}
            <div className="grid grid-cols-[2rem_2rem_1fr] gap-2.5 items-center px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-50/30 dark:from-emerald-900/15 dark:to-emerald-900/5 border border-emerald-100/60 dark:border-emerald-800/30">
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                #{userRank || "-"}
              </span>
              <UserAvatar
                user={user}
                size="sm"
                className="w-7 h-7 text-[11px] shadow-sm ring-2 ring-emerald-200 dark:ring-emerald-800"
              />
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate">
                  {user.name?.split(" ").slice(0, 2).join(" ")}
                </span>
                <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full shrink-0">
                  তুমি
                </span>
              </div>
            </div>

            {/* XP Gap Indicator * /}
            {xpDiff > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400 px-3 pt-1">
                <div className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></div>
                শীর্ষে পৌঁছাতে আরও{" "}
                <span className="font-bold text-neutral-700 dark:text-neutral-300">
                  {xpDiff.toLocaleString()} XP
                </span>{" "}
                লাগবে
              </div>
            )}
          </div>
        </div>
      </div>
      */}

      {/* Subject Stats Section - Order 3 on Mobile, Bottom Left on Desktop */}
      <motion.div variants={fadeInUp} className="lg:col-span-2">
        <SubjectStat
          data={subjectStats}
          onSubjectClick={onSubjectClick}
          isLoading={isLoadingStats}
        />
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
