"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { ExamResult, UserProfile } from "@/lib/types";
import { getSubjectDisplayName } from "@/lib/data/subject-name-map";
import { DashboardSkeleton } from "@/components/student/ui/common/Skeletons";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/animations";
import { useAuth } from "@/components/auth/AuthProvider";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";

// Dashboard Components
import LiveExamSlider from "@/components/student/ui/dashboard/LiveExamSlider";
import DashboardActionGrid from "@/components/student/ui/dashboard/DashboardActionGrid";
import DailyStreakCard from "@/components/student/ui/dashboard/DailyStreakCard";
import DailyQuestsCard from "@/components/student/ui/dashboard/DailyQuestsCard";
import SubjectStat from "./SubjectStat";
import CountdownBanner from "./CountdownBanner";

interface DashboardProps {
  user: UserProfile;
  onMockExamClick: () => void;
  onHistoryClick: () => void;
  onSubjectClick: (subject: string) => void;
  onLeaderboardClick: () => void;
  onAnalysisClick?: () => void;
  onLiveExamClick?: () => void;
  onFormulasClick?: () => void;
  onPracticeClick?: () => void;
  onBookmarksClick?: () => void;
  history: ExamResult[];
  examTarget?: string;
  onChangeTarget?: () => void;
}

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
  const { supabase } = await import("@/services/core");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Auth session not ready for subjects");

  const { getSubjects } = await import("@/services/database");
  return await getSubjects(
    division || undefined,
    stream || undefined,
    optional_subject || undefined,
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  onMockExamClick,
  onHistoryClick,
  onSubjectClick,
  onLeaderboardClick,
  onAnalysisClick = () => {},
  onLiveExamClick = () => {},
  onFormulasClick,
  onPracticeClick = () => {},
  onBookmarksClick = () => {},
  history,
  examTarget,
  onChangeTarget,
}) => {
  const { loading: authLoading, user: authUser } = useAuth();

  const isReady = !authLoading && !!(authUser?.id || user?.id);
  const effectiveUserId = authUser?.id || user?.id;

  type DashboardSubject = {
    id: string;
    name: string;
    label?: string;
    icon?: string;
    group?: string;
    [key: string]: any;
  };

  const [fallbackSubjects] = useState<DashboardSubject[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("obhyash_cached_subjects");
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const { data: subjects = fallbackSubjects, isLoading: isLoadingStats } = useSWR(
    isReady && effectiveUserId
      ? [
          "userSubjects",
          effectiveUserId,
          user?.division,
          user?.stream,
          user?.optional_subject,
        ]
      : null,
    fetchSubjectsOnly,
    {
      revalidateOnFocus: false,
      revalidateIfStale: true,
      dedupingInterval: 30_000,
      onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
        if (retryCount >= 3) return;
        setTimeout(() => revalidate({ retryCount }), 1000 * (retryCount + 1));
      },
      fallbackData: fallbackSubjects,
      onSuccess: (data) => {
        if (data && data.length > 0) {
          localStorage.setItem("obhyash_cached_subjects", JSON.stringify(data));
        }
      },
    },
  );

  const subjectStats = useMemo(() => {
    if (!subjects || subjects.length === 0) {
      // If subjects list is empty, build from history
      const subjectsMap: Record<
        string,
        { id: string; name: string; correct: number; wrong: number; skipped: number; total: number }
      > = {};

      history.forEach((exam) => {
        const subId = exam.subject || "general";
        const subLabel = BanglaNameHelper.formatSubject(subId, exam.subjectLabel || getSubjectDisplayName(subId));
        if (!subjectsMap[subId]) {
          subjectsMap[subId] = {
            id: subId,
            name: subLabel,
            correct: 0,
            wrong: 0,
            skipped: 0,
            total: 0,
          };
        }

        subjectsMap[subId].correct += exam.correctCount || 0;
        subjectsMap[subId].wrong += exam.wrongCount || 0;
        subjectsMap[subId].total += exam.totalQuestions || 0;
        subjectsMap[subId].skipped +=
          (exam.totalQuestions || 0) - (exam.correctCount || 0) - (exam.wrongCount || 0);
      });

      return Object.values(subjectsMap);
    }

    return subjects.map((sub: DashboardSubject) => {
      const subName = (sub.name || "").toLowerCase();
      const subId = (sub.id || "").toLowerCase();

      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let total = 0;

      history.forEach((exam) => {
        const hSub = (exam.subjectLabel || exam.subject || "").toLowerCase();
        const hSubId = (exam.subject || "").toLowerCase();
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
          correct += exam.correctCount || 0;
          wrong += exam.wrongCount || 0;
          total += exam.totalQuestions || 0;
          skipped += (exam.totalQuestions || 0) - (exam.correctCount || 0) - (exam.wrongCount || 0);
        }
      });

      return {
        id: sub.id,
        name: getSubjectDisplayName(sub.id) || sub.name,
        correct,
        wrong,
        skipped,
        total,
      };
    });
  }, [subjects, history]);

  if (isLoadingStats && !subjectStats.length) {
    return <DashboardSkeleton />;
  }

  const effectiveExamTarget = examTarget || user?.exam_target;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="w-full max-w-6xl xl:max-w-7xl mx-auto px-1 sm:px-2 font-['HindSiliguri']"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* ── Left Column: Main Dashboard Controls & Activities (Col Span 7/8) ── */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 sm:gap-6">
          {/* 1. Target Exam Countdown Banner */}
          {effectiveExamTarget && (
            <motion.div variants={fadeInUp}>
              <CountdownBanner
                examTarget={effectiveExamTarget}
                onChangeTarget={onChangeTarget}
              />
            </motion.div>
          )}

          {/* 2. Live Exam Announcement / Status Carousel Slider */}
          <motion.div variants={fadeInUp}>
            <LiveExamSlider
              onExamClick={() => {
                if (onLiveExamClick) onLiveExamClick();
              }}
            />
          </motion.div>

          {/* 3. Primary Action Shortcut Cards Grid */}
          <motion.div variants={fadeInUp}>
            <DashboardActionGrid
              onExamClick={onMockExamClick}
              onFormulasClick={onFormulasClick || onPracticeClick}
              onHistoryClick={onHistoryClick}
              onLeaderboardClick={onLeaderboardClick}
              onAnalysisClick={onAnalysisClick}
              onLiveExamClick={onLiveExamClick}
            />
          </motion.div>

          {/* 4. Daily Streak Card (Flame + 30-Day Activity Heatmap Grid) */}
          <motion.div variants={fadeInUp}>
            <DailyStreakCard
              userStreak={user?.streakCount || 0}
              userId={user?.id}
            />
          </motion.div>

          {/* 5. Daily Quests Card (Master Missions + Claim XP Rewards) */}
          <motion.div variants={fadeInUp}>
            <DailyQuestsCard userId={user?.id} />
          </motion.div>
        </div>

        {/* ── Right Column: Subject-wise Performance Section (Col Span 5/4) ── */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4 sm:gap-6 lg:sticky lg:top-4">
          <motion.div variants={fadeInUp}>
            <SubjectStat
              data={subjectStats}
              onSubjectClick={onSubjectClick}
              isLoading={isLoadingStats}
            />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
