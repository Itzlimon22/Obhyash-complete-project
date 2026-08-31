"use client";

import React, { useMemo } from "react";
import { ExamResult, UserProfile } from "@/lib/types";
import LiveExamSlider from "./LiveExamSlider";
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
      { correct: number; wrong: number; skipped: number; total: number }
    > = {};

    history.forEach((exam) => {
      const subjectKey = exam.subject || "সাধারণ";
      if (!subjectsMap[subjectKey]) {
        subjectsMap[subjectKey] = { correct: 0, wrong: 0, skipped: 0, total: 0 };
      }

      subjectsMap[subjectKey].correct += exam.correctCount || 0;
      subjectsMap[subjectKey].wrong += exam.wrongCount || 0;
      subjectsMap[subjectKey].total += exam.totalQuestions || 0;
      subjectsMap[subjectKey].skipped +=
        (exam.totalQuestions || 0) - (exam.correctCount || 0) - (exam.wrongCount || 0);
    });

    return Object.entries(subjectsMap).map(([name, stats]) => ({
      name,
      ...stats,
    }));
  }, [history]);

  const effectiveUser = currentUser || user;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-5 flex flex-col gap-4 sm:gap-5 font-['HindSiliguri']">
      {/* 1. Live Exam Announcement / Countdown Slider */}
      <LiveExamSlider
        onExamClick={(examId, cat) => {
          if (onLiveExamClick) onLiveExamClick();
        }}
      />

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
