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
import GlobalAnnouncementBanner from "@/components/student/ui/common/GlobalAnnouncementBanner";
import LiveExamSlider from "@/components/student/ui/dashboard/LiveExamSlider";
import DashboardActionGrid from "@/components/student/ui/dashboard/DashboardActionGrid";
import DailyStreakCard from "@/components/student/ui/dashboard/DailyStreakCard";
import DailyQuestsCard from "@/components/student/ui/dashboard/DailyQuestsCard";
import SubjectStat from "./SubjectStat";

interface DashboardProps {
  user: UserProfile;
  initialSubjects?: any[];
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
  const { getSubjects } = await import("@/services/database");
  return await getSubjects(
    division || undefined,
    stream || undefined,
    optional_subject || undefined,
  );
};

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  initialSubjects = [],
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

  const effectiveUserId = user?.id || authUser?.id;

  type DashboardSubject = {
    id: string;
    name: string;
    label?: string;
    icon?: string;
    group?: string;
    [key: string]: any;
  };

  const [fallbackSubjects] = useState<DashboardSubject[]>(() => {
    if (initialSubjects && initialSubjects.length > 0) return initialSubjects;
    if (typeof window === "undefined") return [];
    try {
      const cached = localStorage.getItem("obhyash_cached_subjects");
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });

  const { data: subjects = fallbackSubjects, isLoading: isLoadingStats } = useSWR(
    effectiveUserId
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
      revalidateIfStale: false,
      dedupingInterval: 60_000,
      fallbackData: initialSubjects.length > 0 ? initialSubjects : fallbackSubjects,
      onErrorRetry: (error, _key, _config, revalidate, { retryCount }) => {
        if (retryCount >= 2) return;
        setTimeout(() => revalidate({ retryCount }), 1500 * (retryCount + 1));
      },
      onSuccess: (data) => {
        if (data && data.length > 0) {
          try {
            localStorage.setItem("obhyash_cached_subjects", JSON.stringify(data));
          } catch {}
        }
      },
    },
  );

  const userStream = (user?.stream || (user as any)?.level || (user as any)?.batch || "").toLowerCase();
  const isSsc = userStream.includes("ssc");
  const isAdmission = userStream.includes("admission") || userStream.includes("ভর্তি");
  const isHsc = !isSsc && !isAdmission; // default to HSC

  const userDiv = (user?.division || (user as any)?.group || "").toLowerCase();
  const isScience = userDiv.includes("science") || userDiv.includes("বিজ্ঞান");
  const isHumanities = userDiv.includes("humanities") || userDiv.includes("arts") || userDiv.includes("মানবিক");
  const isBusiness = userDiv.includes("business") || userDiv.includes("commerce") || userDiv.includes("ব্যবসায়") || userDiv.includes("কমার্স");
  const optionalSub = (user?.optional_subject || "").toLowerCase();

  const filteredSubjects = useMemo(() => {
    const seenDisplayNames = new Set<string>();
    const result: DashboardSubject[] = [];

    (subjects || []).forEach((sub: DashboardSubject) => {
      const subId = (sub.id || "").toLowerCase();
      const subName = (sub.name || "").trim().toLowerCase();
      const subStream = (sub.stream || sub.level || "").toLowerCase();
      const subDiv = (sub.division || sub.group || "").toLowerCase();

      if (subId === "hsc_math_general") return;

      // 1. Stream Filtering
      if (isHsc) {
        if (subStream.includes("ssc") && !subStream.includes("hsc")) return;
        if (subId.startsWith("ssc_") || subId.startsWith("ssc-") || subName.startsWith("ssc ")) return;
        if (subName === "গণিত" || subName.includes("সাধারণ গণিত") || subId === "ssc_math") return;
        if (subName.includes("বাংলাদেশ ও বিশ্বপরিচয়") || subId.includes("bgs")) return;
        if (subName.includes("বিজ্ঞান") && !subName.includes("পদার্থ") && !subName.includes("রসায়ন") && !subName.includes("রসায়ন") && !subName.includes("জীব")) return;
      } else if (isSsc) {
        if (subStream.includes("hsc") && !subStream.includes("ssc")) return;
        if (subId.startsWith("hsc_") || subId.startsWith("hsc-")) return;
        if (subName.includes("১ম পত্র") || subName.includes("২য় পত্র") || subName.includes("২য় পত্র")) return;
      }

      // 2. Division / Group Filtering
      if (isScience) {
        // Discard Humanities-only
        if (
          subName.includes("পৌরনীতি") ||
          subName.includes("অর্থনীতি") ||
          subName.includes("সমাজবিজ্ঞান") ||
          subName.includes("সমাজকর্ম") ||
          subName.includes("ইতিহাস") ||
          subName.includes("যুক্তিবিদ্যা") ||
          subName.includes("ভূগোল") ||
          subId.includes("civics") ||
          subId.includes("economics") ||
          subId.includes("sociology") ||
          subId.includes("logic") ||
          subId.includes("geography")
        ) {
          return;
        }
        // Discard Business-only
        if (
          subName.includes("হিসাববিজ্ঞান") ||
          subName.includes("ব্যবসায়") ||
          subName.includes("ব্যবসায়") ||
          subName.includes("ফিন্যান্স") ||
          subName.includes("মার্কেটিং") ||
          subId.includes("accounting") ||
          subId.includes("finance") ||
          subId.includes("marketing")
        ) {
          return;
        }
      } else if (isHumanities) {
        // Discard Science-only
        if (
          subName.includes("পদার্থবিজ্ঞান") ||
          subName.includes("রসায়ন") ||
          subName.includes("রসায়ন") ||
          subName.includes("জীববিজ্ঞান") ||
          subName.includes("উচ্চতর গণিত") ||
          subId.includes("physics") ||
          subId.includes("chem") ||
          subId.includes("bio") ||
          subId.includes("higher_math")
        ) {
          return;
        }
        // Discard Business-only
        if (
          subName.includes("হিসাববিজ্ঞান") ||
          subName.includes("ফিন্যান্স") ||
          subName.includes("মার্কেটিং") ||
          subId.includes("accounting") ||
          subId.includes("finance") ||
          subId.includes("marketing")
        ) {
          return;
        }
      } else if (isBusiness) {
        // Discard Science-only
        if (
          subName.includes("পদার্থবিজ্ঞান") ||
          subName.includes("রসায়ন") ||
          subName.includes("রসায়ন") ||
          subName.includes("জীববিজ্ঞান") ||
          subName.includes("উচ্চতর গণিত") ||
          subId.includes("physics") ||
          subId.includes("chem") ||
          subId.includes("bio") ||
          subId.includes("higher_math")
        ) {
          return;
        }
        // Discard Humanities-only
        if (
          subName.includes("পৌরনীতি") ||
          subName.includes("সমাজবিজ্ঞান") ||
          subName.includes("যুক্তিবিদ্যা") ||
          subId.includes("civics") ||
          subId.includes("sociology") ||
          subId.includes("logic")
        ) {
          return;
        }
      }

      // 3. Optional Subject Filtering
      if (optionalSub.includes("stat") || optionalSub.includes("পরিসংখ্যান")) {
        if (subName.includes("জীববিজ্ঞান") || subId.includes("biology")) return;
      } else {
        if (subName.includes("পরিসংখ্যান") || subId.includes("statistics")) return;
      }

      // 4. Deduplication by Canonical Display Name
      const displayName = BanglaNameHelper.formatSubject(sub.id, sub.name);
      if (seenDisplayNames.has(displayName)) return;
      seenDisplayNames.add(displayName);

      result.push(sub);
    });

    return result;
  }, [subjects, isHsc, isSsc, isScience, isHumanities, isBusiness, optionalSub]);

  // Accurate subject-to-exam matching helper to prevent cross-subject contamination
  const isExamForSubject = (exam: ExamResult, subId: string, subName: string): boolean => {
    const eSub = (exam.subject || "").trim().toLowerCase().replace(/-/g, "_");
    const eLabel = (exam.subjectLabel || "").trim().toLowerCase();
    const sId = (subId || "").trim().toLowerCase().replace(/-/g, "_");
    const sName = (subName || "").trim().toLowerCase();

    // 1. Direct exact ID or label match
    if (eSub && sId && eSub === sId) return true;
    if (eLabel && sName && eLabel === sName) return true;
    if (eSub && sName && eSub === sName) return true;
    if (eLabel && sId && eLabel === sId) return true;

    // 2. Canonical formatted name match
    const canonicalExam = BanglaNameHelper.formatSubject(exam.subject, exam.subjectLabel).trim();
    const canonicalSub = BanglaNameHelper.formatSubject(subId, subName).trim();
    if (canonicalExam && canonicalSub && canonicalExam === canonicalSub) {
      return true;
    }

    // 3. Paper isolation: 1st Paper vs 2nd Paper (MUST NEVER CROSS-MATCH)
    const eHasPaper1 = eSub.includes("1st") || eSub.includes("_1") || eLabel.includes("১ম") || eLabel.includes("1st");
    const eHasPaper2 = eSub.includes("2nd") || eSub.includes("_2") || eLabel.includes("২য়") || eLabel.includes("২য়") || eLabel.includes("2nd");
    const sHasPaper1 = sId.includes("1st") || sId.includes("_1") || sName.includes("১ম") || sName.includes("1st");
    const sHasPaper2 = sId.includes("2nd") || sId.includes("_2") || sName.includes("২য়") || sName.includes("২য়") || sName.includes("2nd");

    if ((eHasPaper1 && sHasPaper2) || (eHasPaper2 && sHasPaper1)) {
      return false;
    }

    // 4. BGS (বাংলাদেশ ও বিশ্বপরিচয়) - MUST NOT match Bangla
    const isSubBgs = sId.includes("bgs") || sName.includes("বিশ্বপরিচয়") || sName.includes("বিশ্ব পরিচয়");
    const isExamBgs = eSub.includes("bgs") || eLabel.includes("বিশ্বপরিচয়") || eLabel.includes("বিশ্ব পরিচয়");
    if (isSubBgs || isExamBgs) {
      return isSubBgs && isExamBgs;
    }

    // 5. Bangla (বাংলা)
    const isSubBangla = (sId.includes("bangla") || sName.includes("বাংলা")) && !isSubBgs;
    const isExamBangla = (eSub.includes("bangla") || eLabel.includes("বাংলা")) && !isExamBgs;
    if (isSubBangla || isExamBangla) {
      if (!isSubBangla || !isExamBangla) return false;
      if (sHasPaper1 && eHasPaper2) return false;
      if (sHasPaper2 && eHasPaper1) return false;
      if (sHasPaper1 && eHasPaper1) return true;
      if (sHasPaper2 && eHasPaper2) return true;
      return !sHasPaper1 && !sHasPaper2 && !eHasPaper1 && !eHasPaper2;
    }

    // 6. English (ইংরেজি)
    const isSubEnglish = sId.includes("english") || sId.includes("eng") || sName.includes("ইংরেজি") || sName.includes("english");
    const isExamEnglish = eSub.includes("english") || eSub.includes("eng") || eLabel.includes("ইংরেজি") || eLabel.includes("english");
    if (isSubEnglish || isExamEnglish) {
      if (!isSubEnglish || !isExamEnglish) return false;
      if (sHasPaper1 && eHasPaper2) return false;
      if (sHasPaper2 && eHasPaper1) return false;
      if (sHasPaper1 && eHasPaper1) return true;
      if (sHasPaper2 && eHasPaper2) return true;
      return !sHasPaper1 && !sHasPaper2 && !eHasPaper1 && !eHasPaper2;
    }

    // 7. Physics (পদার্থবিজ্ঞান)
    const isSubPhysics = sId.includes("physics") || sId.includes("phy") || sName.includes("পদার্থবিজ্ঞান");
    const isExamPhysics = eSub.includes("physics") || eSub.includes("phy") || eLabel.includes("পদার্থবিজ্ঞান");
    if (isSubPhysics || isExamPhysics) {
      if (!isSubPhysics || !isExamPhysics) return false;
      if (sHasPaper1 && eHasPaper2) return false;
      if (sHasPaper2 && eHasPaper1) return false;
      if (sHasPaper1 && eHasPaper1) return true;
      if (sHasPaper2 && eHasPaper2) return true;
      return !sHasPaper1 && !sHasPaper2 && !eHasPaper1 && !eHasPaper2;
    }

    // 8. Chemistry (রসায়ন / রসায়ন)
    const isSubChem = sId.includes("chem") || sName.includes("রসায়ন") || sName.includes("রসায়ন");
    const isExamChem = eSub.includes("chem") || eLabel.includes("রসায়ন") || eLabel.includes("রসায়ন");
    if (isSubChem || isExamChem) {
      if (!isSubChem || !isExamChem) return false;
      if (sHasPaper1 && eHasPaper2) return false;
      if (sHasPaper2 && eHasPaper1) return false;
      if (sHasPaper1 && eHasPaper1) return true;
      if (sHasPaper2 && eHasPaper2) return true;
      return !sHasPaper1 && !sHasPaper2 && !eHasPaper1 && !eHasPaper2;
    }

    // 9. Higher Math (উচ্চতর গণিত) vs General Math (সাধারণ গণিত)
    const isSubHigherMath = sId.includes("higher_math") || sId.includes("highermath") || sId.includes("h_math") || sName.includes("উচ্চতর গণিত");
    const isExamHigherMath = eSub.includes("higher_math") || eSub.includes("highermath") || eSub.includes("h_math") || eLabel.includes("উচ্চতর গণিত");
    const isSubGenMath = (sId.includes("general_math") || sId === "ssc_math" || sName.includes("সাধারণ গণিত") || sName === "গণিত") && !isSubHigherMath;
    const isExamGenMath = (eSub.includes("general_math") || eSub === "ssc_math" || eLabel.includes("সাধারণ গণিত") || eLabel === "গণিত") && !isExamHigherMath;

    if (isSubHigherMath || isExamHigherMath) {
      if (!isSubHigherMath || !isExamHigherMath) return false;
      if (sHasPaper1 && eHasPaper2) return false;
      if (sHasPaper2 && eHasPaper1) return false;
      if (sHasPaper1 && eHasPaper1) return true;
      if (sHasPaper2 && eHasPaper2) return true;
      return !sHasPaper1 && !sHasPaper2 && !eHasPaper1 && !eHasPaper2;
    }

    if (isSubGenMath || isExamGenMath) {
      return isSubGenMath && isExamGenMath;
    }

    // 10. Biology (জীববিজ্ঞান)
    const isSubBio = sId.includes("bio") || sName.includes("জীববিজ্ঞান") || sName.includes("উদ্ভিদ") || sName.includes("প্রাণি");
    const isExamBio = eSub.includes("bio") || eLabel.includes("জীববিজ্ঞান") || eLabel.includes("উদ্ভিদ") || eLabel.includes("প্রাণি");
    if (isSubBio || isExamBio) {
      if (!isSubBio || !isExamBio) return false;
      if (sHasPaper1 && eHasPaper2) return false;
      if (sHasPaper2 && eHasPaper1) return false;
      if (sHasPaper1 && eHasPaper1) return true;
      if (sHasPaper2 && eHasPaper2) return true;
      return !sHasPaper1 && !sHasPaper2 && !eHasPaper1 && !eHasPaper2;
    }

    // 11. ICT (আইসিটি)
    const isSubIct = sId.includes("ict") || sName.includes("আইসিটি") || sName.includes("তথ্য");
    const isExamIct = eSub.includes("ict") || eLabel.includes("আইসিটি") || eLabel.includes("তথ্য");
    if (isSubIct || isExamIct) {
      return isSubIct && isExamIct;
    }

    return false;
  };

  const subjectStats = useMemo(() => {
    if (!filteredSubjects || filteredSubjects.length === 0) {
      // If subjects list is empty, build from history with canonical deduplication
      const subjectsMap: Record<
        string,
        { id: string; name: string; correct: number; wrong: number; skipped: number; total: number }
      > = {};

      history.forEach((exam) => {
        const rawSubId = exam.subject || "general";
        if (rawSubId === "hsc_math_general") return;
        const subLabel = BanglaNameHelper.formatSubject(rawSubId, exam.subjectLabel || getSubjectDisplayName(rawSubId));
        if (isHsc && (subLabel === "গণিত" || rawSubId === "ssc_math" || subLabel.includes("বাংলাদেশ ও বিশ্বপরিচয়"))) return;

        // Group by canonical name to merge duplicates
        const key = subLabel;
        if (!subjectsMap[key]) {
          subjectsMap[key] = {
            id: rawSubId,
            name: subLabel,
            correct: 0,
            wrong: 0,
            skipped: 0,
            total: 0,
          };
        }

        subjectsMap[key].correct += exam.correctCount || 0;
        subjectsMap[key].wrong += exam.wrongCount || 0;
        subjectsMap[key].total += exam.totalQuestions || 0;
        subjectsMap[key].skipped += Math.max(
          0,
          (exam.totalQuestions || 0) - (exam.correctCount || 0) - (exam.wrongCount || 0)
        );
      });

      return Object.values(subjectsMap);
    }

    return filteredSubjects.map((sub: DashboardSubject) => {
      let correct = 0;
      let wrong = 0;
      let skipped = 0;
      let total = 0;

      history.forEach((exam) => {
        if (isExamForSubject(exam, sub.id, sub.name)) {
          correct += exam.correctCount || 0;
          wrong += exam.wrongCount || 0;
          total += exam.totalQuestions || 0;
          skipped += Math.max(
            0,
            (exam.totalQuestions || 0) - (exam.correctCount || 0) - (exam.wrongCount || 0)
          );
        }
      });

      return {
        id: sub.id,
        name: BanglaNameHelper.formatSubject(sub.id, sub.name),
        correct,
        wrong,
        skipped,
        total,
      };
    });
  }, [filteredSubjects, history, isHsc]);

  if (isLoadingStats && !subjectStats.length && !initialSubjects?.length) {
    return <DashboardSkeleton />;
  }

  const effectiveExamTarget = examTarget || user?.exam_target;

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="w-full flex flex-col font-sans"
    >
      {/* 0. Live In-App Global Broadcast Announcement Banner */}
      <GlobalAnnouncementBanner />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-5 items-start">
        {/* ── Left Column: Main Dashboard Controls & Activities (Col Span 7) ── */}
        <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-3.5 sm:gap-4.5">
          {/* 1. Live Exam Announcement / Status Carousel Slider (Hidden per user request, keep for future restore) */}
          {/* <motion.div variants={fadeInUp}>
            <LiveExamSlider
              userId={user?.id}
              onExamClick={() => {
                if (onLiveExamClick) onLiveExamClick();
              }}
            />
          </motion.div> */}

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

        {/* ── Right Column: Subject-wise Performance Section (Col Span 5) ── */}
        <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-3.5 sm:gap-4.5 lg:sticky lg:top-4">
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
