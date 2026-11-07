"use client";

import React, { useMemo } from "react";
import { ExamResult, UserProfile } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import LiveExamSlider from "./LiveExamSlider";
import GkeCourseBanner from "./GkeCourseBanner";
import DashboardActionGrid from "./DashboardActionGrid";
import DailyStreakCard from "./DailyStreakCard";
import DailyQuestsCard from "./DailyQuestsCard";
import SubjectStat, { SubjectData } from "./SubjectStat";

export interface DashboardProps {
  onMockExamClick: () => void;
  onHistoryClick: () => void;
  onSubjectClick: (subject: string) => void;
  onLeaderboardClick: () => void;
  onFormulasClick?: () => void;
  onAnalysisClick?: () => void;
  onLiveExamClick?: () => void;
  onPracticeClick?: () => void;
  onBookmarksClick?: () => void;
  history: ExamResult[];
  currentUser?: UserProfile | null;
  user?: UserProfile | null;
  examTarget?: string;
  onChangeTarget?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onMockExamClick,
  onHistoryClick,
  onSubjectClick,
  onLeaderboardClick,
  onFormulasClick,
  onAnalysisClick = () => {},
  onLiveExamClick = () => {},
  onPracticeClick,
  history,
  currentUser,
  user,
}) => {
  // Aggregate Subject Stats from History
  const subjectData: SubjectData[] = useMemo(() => {
    const subjectsMap: Record<
      string,
      { id: string; name: string; correct: number; wrong: number; skipped: number; total: number }
    > = {};

    history.forEach((exam) => {
      const canonicalName = BanglaNameHelper.formatSubject(exam.subject, exam.subjectLabel) || "সাধারণ";
      if (!subjectsMap[canonicalName]) {
        subjectsMap[canonicalName] = { id: exam.subject || "", name: canonicalName, correct: 0, wrong: 0, skipped: 0, total: 0 };
      }

      subjectsMap[canonicalName].correct += exam.correctCount || 0;
      subjectsMap[canonicalName].wrong += exam.wrongCount || 0;
      subjectsMap[canonicalName].total += exam.totalQuestions || 0;
      subjectsMap[canonicalName].skipped += Math.max(
        0,
        (exam.totalQuestions || 0) - (exam.correctCount || 0) - (exam.wrongCount || 0)
      );
    });

    return Object.values(subjectsMap);
  }, [history]);

  const effectiveUser = currentUser || user;

  return (
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto px-0 sm:px-2 py-1.5 sm:py-2 flex flex-col gap-3.5 sm:gap-4 font-['HindSiliguri']">
      {/* 1. Medical GKE Course Promo Banner (Obhyash Brand Theme) */}
      <GkeCourseBanner
        onBannerClick={() => {
          if (onLiveExamClick) onLiveExamClick();
        }}
      />

      {/* Previous LiveExamSlider hidden per user request, keep for future restore */}
      {/* <LiveExamSlider
        onExamClick={(examId, cat) => {
          if (onLiveExamClick) onLiveExamClick();
        }}
      /> */}

      {/* 2. 6 Action Cards Grid */}
      <DashboardActionGrid
        onExamClick={onMockExamClick}
        onFormulasClick={onFormulasClick || onPracticeClick || (() => {})}
        onHistoryClick={onHistoryClick}
        onLeaderboardClick={onLeaderboardClick}
        onAnalysisClick={onAnalysisClick}
        onLiveExamClick={onLiveExamClick}
      />

      {/* 3. Daily Streak Card (Flame + 30-Day Activity Grid) */}
      <DailyStreakCard
        userStreak={effectiveUser?.streakCount || 0}
        userId={effectiveUser?.id}
      />

      {/* 4. Daily Quests Card (Master Missions + XP Claim) */}
      <DailyQuestsCard userId={effectiveUser?.id} />

      {/* 5. Subject Performance Report */}
      <SubjectStat
        data={subjectData}
        onSubjectClick={onSubjectClick}
      />
    </div>
  );
};

export default Dashboard;
