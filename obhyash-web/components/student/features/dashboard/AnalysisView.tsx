"use client";

import React, { useState, useEffect, useMemo } from "react";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Zap,
  Timer,
  Hourglass,
  AlertTriangle,
  Award,
  Medal,
  Crown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ExamResult, UserProfile } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { useAuth } from "@/components/auth/AuthProvider";
import { AnalysisSkeleton } from "@/components/student/ui/common/Skeletons";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

// ─── Domain Models ──────────────────────────────────────────────────────────

export interface SubjectAnalytics {
  rawName: string;
  displayName: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
}

export interface TimelinePoint {
  label: string;
  score: number;
  date: Date;
}

export interface StudyGuideline {
  color: string;
  tag: string;
  title: string;
  description: string;
  iconName: string;
  metric?: string;
}

export interface AchievementBadge {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
  accentColor: string;
}

export interface OverallAnalyticsData {
  totalExams: number;
  avgScore: number;
  avgAccuracy: number;
  totalTime: number;
  totalQuestions: number;
  totalCorrect: number;
  totalWrong: number;
  totalSkipped: number;
  avgTimePerQuestion: number;
  highestScore: number;
  lowestScore: number;
  totalNegativeDeduction: number;
  masteryIndex: number;
  masteryTier: string;
  masterySubtitle: string;
  subjectData: SubjectAnalytics[];
  timelineData: TimelinePoint[];
  guidelines: StudyGuideline[];
  achievements: AchievementBadge[];
}

// ─── Theme Colors matching Flutter AppColors ───────────────────────────────

export const AppColors = {
  // Deepest Blue / Navy
  deepestBlue: "#0B132B",
  navyDark: "#1C2541",
  deepBlue: "#1D4ED8",
  vibrantBlue: "#2563EB",
  softBlue: "#3B82F6",

  // Book Deep Green
  deepGreen: "#004633",
  emerald: "#059669",
  mint: "#10B981",

  // Deep Red
  deepRed: "#991B1B",
  crimson: "#B91C1C",
  softRed: "#EF4444",

  // Greys & Neutrals
  slateLight: "#F8FAFC",
  slateBorder: "#E2E8F0",
  slateGray: "#64748B",
  slateMuted: "#94A3B8",

  darkBg: "#09090B",
  darkCard: "#131316",
  darkBorder: "#26262B",
};

// ─── Academic Subject Helpers (1:1 with Flutter) ────────────────────────────

const hasP1 = (lower: string): boolean => {
  return (
    lower.includes("1st") ||
    lower.includes("১ম") ||
    lower.includes("প্রথম") ||
    lower.includes("_1") ||
    lower.includes("-1") ||
    lower.includes(" 1") ||
    lower.endsWith("1")
  );
};

const hasP2 = (lower: string): boolean => {
  return (
    lower.includes("2nd") ||
    lower.includes("২য়") ||
    lower.includes("২য়") ||
    lower.includes("দ্বিতীয়") ||
    lower.includes("দ্বিতীয়") ||
    lower.includes("_2") ||
    lower.includes("-2") ||
    lower.includes(" 2") ||
    lower.endsWith("2")
  );
};

const isNonSubject = (lower: string): boolean => {
  const l = lower.trim();
  if (!l) return true;
  if (
    l === "general" ||
    l === "all" ||
    l === "সব" ||
    l === "সাধারণ" ||
    l === "null"
  ) {
    return true;
  }

  const hasAcademicKeyword =
    l.includes("রসায়ন") ||
    l.includes("রসায়ন") ||
    l.includes("chem") ||
    l.includes("পদার্থ") ||
    l.includes("phys") ||
    l.includes("উচ্চতর গণিত") ||
    l.includes("সাধারণ গণিত") ||
    l.includes("higher_math") ||
    l.includes("h_math") ||
    (l.includes("math") && !l.includes("format")) ||
    l.includes("গণিত") ||
    l.includes("জীব") ||
    l.includes("উদ্ভিদ") ||
    l.includes("প্রাণি") ||
    l.includes("bio") ||
    l.includes("botany") ||
    l.includes("zoology") ||
    l.includes("বাংলা") ||
    l.includes("bangla") ||
    l.includes("ইংরেজি") ||
    l.includes("ইংরেজী") ||
    l.includes("english") ||
    l.includes("আইসিটি") ||
    l.includes("ict") ||
    l.includes("সাধারণ জ্ঞান") ||
    l.includes("হিসাববিজ্ঞান") ||
    l.includes("ফিন্যান্স") ||
    l.includes("ব্যবস্থাপনা") ||
    l.includes("অর্থনীতি") ||
    l.includes("পরিসংখ্যান");

  if (hasAcademicKeyword) return false;

  const nonSubjectKeywords = [
    "buet", "বুয়েট",
    "ruet", "রুয়েট",
    "cuet", "চুয়েট",
    "kuet", "কুয়েট",
    "ckruet", "গুচ্ছ ইঞ্জি",
    "medical", "mbbs", "মেডিকেল",
    "butex", "বুটেক্স",
    "du", "ঢাবি",
    "ju", "জাবি",
    "ru", "রাবি",
    "cu", "চবি",
    "sust", "শাবিপ্রবি",
    "gst", "জিএসটি",
    "iut", "আইইউটি",
    "mist", "এমআইএসটি",
    "bup", "বিইউপি",
    "model", "মডেল",
    "mock", "মক",
    "preli", "প্রিলি",
    "written", "লিখিত",
    "preset", "প্রিসেট",
    "live", "লাইভ",
    "exam", "পরীক্ষা",
    "test", "টেস্ট",
    "practice", "অনুশীলন",
    "daily", "weekly",
  ];

  for (const kw of nonSubjectKeywords) {
    if (l.includes(kw)) return true;
  }

  return true;
};

const resolveAcademicSubject = (
  subject?: string | null,
  subjectLabel?: string | null
): string | null => {
  const s = (subject || "").trim();
  const sl = (subjectLabel || "").trim();
  if (!s && !sl) return null;

  const f1 = BanglaNameHelper.formatSubject(s, sl);
  const f2 = BanglaNameHelper.formatSubject(sl, s);

  for (const raw of [f1, f2, sl, s]) {
    if (!raw.trim()) continue;
    const lower = raw.toLowerCase().replaceAll("-", "_").trim();

    if (isNonSubject(lower)) continue;

    if (lower.includes("physics") || lower.includes("পদার্থ")) {
      if (hasP1(lower)) return "পদার্থবিজ্ঞান ১ম পত্র";
      if (hasP2(lower)) return "পদার্থবিজ্ঞান ২য় পত্র";
      return "পদার্থবিজ্ঞান";
    }
    if (
      lower.includes("chemistry") ||
      lower.includes("chem") ||
      lower.includes("রসায়ন") ||
      lower.includes("রসায়ন")
    ) {
      if (hasP1(lower)) return "রসায়ন ১ম পত্র";
      if (hasP2(lower)) return "রসায়ন ২য় পত্র";
      return "রসায়ন";
    }
    if (
      lower.includes("higher_math") ||
      lower.includes("highermath") ||
      lower.includes("h_math") ||
      lower.includes("উচ্চতর গণিত") ||
      lower.includes("উচ্চতর_গণিত")
    ) {
      if (hasP1(lower)) return "উচ্চতর গণিত ১ম পত্র";
      if (hasP2(lower)) return "উচ্চতর গণিত ২য় পত্র";
      return "উচ্চতর গণিত";
    }
    if (
      lower.includes("general_math") ||
      lower.includes("সাধারণ গণিত") ||
      lower.includes("সাধারণ_গণিত") ||
      lower.includes("ssc_math")
    ) {
      return "সাধারণ গণিত";
    }
    if (
      lower.includes("math") ||
      lower.includes("mathematics") ||
      lower.includes("গণিত")
    ) {
      if (hasP1(lower)) return "উচ্চতর গণিত ১ম পত্র";
      if (hasP2(lower)) return "উচ্চতর গণিত ২য় পত্র";
      return "উচ্চতর গণিত";
    }
    if (
      lower.includes("biology") ||
      lower.includes("bio") ||
      lower.includes("জীববিজ্ঞান") ||
      lower.includes("উদ্ভিদ") ||
      lower.includes("প্রাণি") ||
      lower.includes("botany") ||
      lower.includes("zoology")
    ) {
      if (hasP1(lower) || lower.includes("botany") || lower.includes("উদ্ভিদ")) {
        return "জীববিজ্ঞান ১ম পত্র (উদ্ভিদবিজ্ঞান)";
      }
      if (hasP2(lower) || lower.includes("zoology") || lower.includes("প্রাণি")) {
        return "জীববিজ্ঞান ২য় পত্র (প্রাণিবিজ্ঞান)";
      }
      return "জীববিজ্ঞান";
    }
    if (
      lower.includes("bangla") ||
      lower.includes("bengali") ||
      lower.includes("বাংলা")
    ) {
      if (hasP1(lower)) return "বাংলা ১ম পত্র";
      if (hasP2(lower)) return "বাংলা ২য় পত্র";
      return "বাংলা";
    }
    if (
      lower.includes("english") ||
      lower.includes("ইংরেজি") ||
      lower.includes("ইংরেজী")
    ) {
      if (hasP1(lower)) return "ইংরেজি ১ম পত্র";
      if (hasP2(lower)) return "ইংরেজি ২য় পত্র";
      return "ইংরেজি";
    }
    if (
      lower.includes("ict") ||
      lower.includes("আইসিটি") ||
      lower.includes("তথ্য ও যোগাযোগ")
    ) {
      return "তথ্য ও যোগাযোগ প্রযুক্তি (আইসিটি)";
    }
    if (
      lower.includes("gk") ||
      lower.includes("সাধারণ জ্ঞান") ||
      lower.includes("general_knowledge")
    ) {
      return "সাধারণ জ্ঞান";
    }
    if (
      lower.includes("general_science") ||
      lower.includes("সাধারণ বিজ্ঞান")
    ) {
      return "সাধারণ বিজ্ঞান";
    }
    if (
      lower.includes("bgs") ||
      lower.includes("বাংলাদেশ ও বিশ্বপরিচয়")
    ) {
      return "বাংলাদেশ ও বিশ্বপরিচয়";
    }
    if (lower.includes("accounting") || lower.includes("হিসাববিজ্ঞান")) {
      return "হিসাববিজ্ঞান";
    }
    if (lower.includes("finance") || lower.includes("ফিন্যান্স")) {
      return "ফিন্যান্স ও ব্যাংকিং";
    }
    if (lower.includes("management") || lower.includes("ব্যবসায় সংগঠন")) {
      return "ব্যবসায় সংগঠন ও ব্যবস্থাপনা";
    }
    if (lower.includes("economics") || lower.includes("অর্থনীতি")) {
      return "অর্থনীতি";
    }
    if (lower.includes("statistics") || lower.includes("পরিসংখ্যান")) {
      if (hasP1(lower)) return "পরিসংখ্যান ১ম পত্র";
      if (hasP2(lower)) return "পরিসংখ্যান ২য় পত্র";
      return "পরিসংখ্যান";
    }
  }

  return null;
};

// ─── Format Duration ────────────────────────────────────────────────────────

const formatDuration = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${BanglaNameHelper.toBanglaNumeral(hrs)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি.`;
  }
  if (mins > 0) {
    return `${BanglaNameHelper.toBanglaNumeral(mins)} মিনিট ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
  }
  return `${BanglaNameHelper.toBanglaNumeral(secs)} সেকেন্ড`;
};

// ─── View Props ─────────────────────────────────────────────────────────────

interface AnalysisViewProps {
  currentUser?: UserProfile | null;
  history?: ExamResult[];
  onSubjectClick?: (subject: string) => void;
  onStartExam?: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  currentUser,
  history = [],
  onSubjectClick,
  onStartExam,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [timeFilter, setTimeFilter] = usePersistedState<"all" | "month" | "week">(
    "analysis_time_filter",
    "all"
  );

  const { user: authUser, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // Priority resolution for user ID: passed currentUser > authUser > first history entry
  const activeUserId = currentUser?.id || authUser?.id || history?.[0]?.user_id;

  // Fetch or Compute Analytics Data (matching Flutter 1:1)
  const { data: analytics, isLoading } = useSWR(
    activeUserId
      ? ["overall_analytics_flutter_sync_v1", activeUserId, timeFilter]
      : null,
    async () => {
      if (!activeUserId) return null;

      let rows: any[] = [];

      try {
        let query = supabase
          .from("exam_results")
          .select(
            "score, total_marks, total_questions, correct_count, wrong_count, time_taken, subject, subject_label, negative_marking, date, created_at, questions, user_answers, submission_type"
          )
          .eq("user_id", activeUserId)
          .neq("submission_type", "started");

        if (timeFilter === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          query = query.gte("created_at", weekAgo.toISOString());
        } else if (timeFilter === "month") {
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          query = query.gte("created_at", monthAgo.toISOString());
        }

        const { data: rawData, error } = await query.order("created_at", { ascending: true });

        if (!error && rawData && rawData.length > 0) {
          rows = rawData;
        } else if (history && history.length > 0) {
          let dateLimit: Date | null = null;
          if (timeFilter === "week") {
            dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 7);
          } else if (timeFilter === "month") {
            dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 30);
          }

          rows = history.filter((h) => {
            const isStarted =
              (h as any).submissionType === "started" ||
              (h as any).submission_type === "started";
            if (isStarted) return false;
            if (dateLimit) {
              const hDate = new Date(h.date || (h as any).created_at || "");
              return hDate >= dateLimit;
            }
            return true;
          });
        }
      } catch (err) {
        console.warn("[AnalysisView] Error querying exam_results:", err);
        if (history && history.length > 0) {
          let dateLimit: Date | null = null;
          if (timeFilter === "week") {
            dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 7);
          } else if (timeFilter === "month") {
            dateLimit = new Date();
            dateLimit.setDate(dateLimit.getDate() - 30);
          }

          rows = history.filter((h) => {
            const isStarted =
              (h as any).submissionType === "started" ||
              (h as any).submission_type === "started";
            if (isStarted) return false;
            if (dateLimit) {
              const hDate = new Date(h.date || (h as any).created_at || "");
              return hDate >= dateLimit;
            }
            return true;
          });
        }
      }

      if (!rows || rows.length === 0) {
        return {
          totalExams: 0,
          avgScore: 0,
          avgAccuracy: 0,
          totalTime: 0,
          totalQuestions: 0,
          totalCorrect: 0,
          totalWrong: 0,
          totalSkipped: 0,
          avgTimePerQuestion: 0,
          highestScore: 0,
          lowestScore: 0,
          totalNegativeDeduction: 0,
          masteryIndex: 0,
          masteryTier: "নতুন অভিযাত্রী",
          masterySubtitle: "পরীক্ষা দিয়ে তোমার পারফরম্যান্স ট্র্যাক করো",
          subjectData: [],
          timelineData: [],
          guidelines: [],
          achievements: [],
        } as OverallAnalyticsData;
      }

      let totalExams = rows.length;
      let totalTime = 0;
      let scoreSum = 0;
      let totalQuestions = 0;
      let totalCorrect = 0;
      let totalWrong = 0;
      let highestScore = 0;
      let lowestScore = 100;
      let totalNegativeDeduction = 0;

      const subjectMap: Record<
        string,
        { total: number; correct: number; wrong: number }
      > = {};
      const timeline: TimelinePoint[] = [];

      for (const row of rows) {
        const total = Number(row.total_questions || row.totalQuestions || 0);
        const correct = Number(row.correct_count ?? row.correctCount ?? 0);
        const wrong = Number(row.wrong_count ?? row.wrongCount ?? 0);
        const time = Number(row.time_taken ?? row.timeTaken ?? 0);
        const totalMarks = Number(
          row.total_marks ?? row.totalMarks ?? (total > 0 ? total : 1)
        );
        const rawDbScore =
          row.score !== null && row.score !== undefined
            ? Number(row.score)
            : null;
        const negRate =
          typeof row.negative_marking === "number"
            ? row.negative_marking
            : 0.25;

        // Exact net score with negative marking deduction matching Flutter
        const netScore =
          rawDbScore !== null
            ? rawDbScore
            : Math.min(totalMarks, Math.max(0, correct - wrong * negRate));
        const score =
          totalMarks > 0
            ? Math.min(100, Math.max(0, (netScore / totalMarks) * 100))
            : 0;

        const rawCreatedAt = row.created_at || row.date || "";
        const createdAt = rawCreatedAt ? new Date(rawCreatedAt) : new Date();
        const examSub = (row.subject as string) || "";
        const examSubLabel = (row.subject_label as string) || undefined;

        totalTime += time;
        scoreSum += score;
        totalQuestions += total;
        totalCorrect += correct;
        totalWrong += wrong;
        totalNegativeDeduction += wrong * negRate;

        if (score > highestScore) highestScore = score;
        if (score < lowestScore) lowestScore = score;

        // Populate Subject Breakdown: ONLY genuine academic subjects!
        const questions = row.questions;
        const userAnswers = row.user_answers;
        const answersMap =
          userAnswers && typeof userAnswers === "object"
            ? (userAnswers as Record<string, any>)
            : {};

        if (Array.isArray(questions) && questions.length > 0) {
          // Question-level subject distribution
          for (const q of questions) {
            if (!q || typeof q !== "object") continue;
            const qSub = (q.subject || "").toString();
            const qSubLabel = (q.subject_label || "").toString();

            const academicSub =
              resolveAcademicSubject(qSub, qSubLabel) ||
              resolveAcademicSubject(examSub, examSubLabel);

            if (!academicSub) continue; // Skip non-academic entries

            const qId = (q.id || "").toString();
            const userAns = answersMap[qId];
            const correctAns = (
              q.correct_answer_index ?? q.correctAnswerIndex
            )?.toString();
            const correctIndices =
              q.correct_answer_indices ?? q.correctAnswerIndices;

            const isAnswered =
              userAns !== undefined &&
              userAns !== null &&
              String(userAns).trim().length > 0;
            let isCorrect = false;

            if (isAnswered) {
              if (Array.isArray(correctIndices) && correctIndices.length > 0) {
                isCorrect = correctIndices
                  .map((e) => e.toString())
                  .includes(userAns.toString());
              } else if (correctAns !== undefined && correctAns !== null) {
                isCorrect = userAns.toString() === correctAns.toString();
              }
            }
            const isWrong = isAnswered && !isCorrect;

            const prev = subjectMap[academicSub] || { total: 0, correct: 0, wrong: 0 };
            subjectMap[academicSub] = {
              total: prev.total + 1,
              correct: prev.correct + (isCorrect ? 1 : 0),
              wrong: prev.wrong + (isWrong ? 1 : 0),
            };
          }
        } else {
          // Fallback when question details are not preserved
          const academicSub = resolveAcademicSubject(examSub, examSubLabel);
          if (academicSub) {
            const prev = subjectMap[academicSub] || { total: 0, correct: 0, wrong: 0 };
            subjectMap[academicSub] = {
              total: prev.total + total,
              correct: prev.correct + correct,
              wrong: prev.wrong + wrong,
            };
          }
        }

        const dayMonth = `${createdAt.getDate()}/${createdAt.getMonth() + 1}`;
        timeline.push({
          label: dayMonth,
          score: Math.round(score),
          date: createdAt,
        });
      }

      const avgScore = totalExams > 0 ? scoreSum / totalExams : 0.0;
      const avgAccuracy =
        totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100.0 : 0.0;
      const avgTimePerQuestion =
        totalQuestions > 0 ? totalTime / totalQuestions : 0.0;

      const subjectData: SubjectAnalytics[] = Object.entries(subjectMap)
        .map(([rawName, val]) => {
          const t = val.total;
          const c = val.correct;
          const w = val.wrong;
          const skipped = Math.min(t, Math.max(0, t - c - w));
          const acc = t > 0 ? (c / t) * 100.0 : 0.0;

          return {
            rawName,
            displayName: rawName,
            total: t,
            correct: c,
            wrong: w,
            skipped,
            accuracy: acc,
          };
        })
        .sort((a, b) => b.accuracy - a.accuracy);

      // Mastery Score Algorithm matching Flutter
      const volumeBonus = Math.min(1.0, Math.max(0.0, totalQuestions / 200.0)) * 10.0;
      const examBonus = Math.min(1.0, Math.max(0.0, totalExams / 15.0)) * 10.0;
      const masteryIndex = Math.min(
        100.0,
        Math.max(
          0.0,
          avgScore * 0.45 + avgAccuracy * 0.35 + volumeBonus + examBonus
        )
      );

      let masteryTier: string;
      let masterySubtitle: string;
      if (masteryIndex >= 85) {
        masteryTier = "বিজয় অভিযাত্রী (Elite)";
        masterySubtitle = "অসাধারণ ধারাবাহিকতা! তুমি শীর্ষ প্রস্তুতিতে রয়েছো।";
      } else if (masteryIndex >= 70) {
        masteryTier = "দ্রুত অগ্রগামী (Advanced)";
        masterySubtitle =
          "ধারাবাহিক গতি! ভুলগুলো নিয়মিত সংশোধন করলে কাঙ্ক্ষিত ফলাফল নিশ্চিত।";
      } else if (masteryIndex >= 50) {
        masteryTier = "উন্নতির পথে (Growing)";
        masterySubtitle =
          "প্রস্তুতি সন্তোষজনক। দুর্বল অধ্যায়গুলোতে একটু বাড়তি সময় দাও।";
      } else {
        masteryTier = "নতুন শুরু (Kickstart)";
        masterySubtitle = "নিয়মিত টেস্ট দিয়ে নিজের বেসিক ও নির্ভুলতা বাড়াও।";
      }

      // Smart Study Guidelines matching Flutter
      const guidelines: StudyGuideline[] = [];

      if (subjectData.length > 0) {
        const best = subjectData[0];
        guidelines.push({
          color: "#059669",
          tag: "সর্বোচ্চ শক্তি",
          title: best.displayName,
          metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(best.accuracy))}% নির্ভুলতা`,
          description:
            "এই বিষয়ে তোমার নির্ভুলতা সবচেয়ে বেশি! নিয়মিত রিভিশন বজায় রেখে এই শক্তিকে ১০০% মার্কসে রূপান্তর করো।",
          iconName: "trophy",
        });

        if (subjectData.length > 1) {
          const worst = subjectData[subjectData.length - 1];
          if (worst.accuracy < 75) {
            guidelines.push({
              color: "#F59E0B",
              tag: "অগ্রাধিকার রিভিশন",
              title: worst.displayName,
              metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(worst.accuracy))}% নির্ভুলতা`,
              description:
                "অধ্যায়ের মূল সূত্র ও গুরুত্বপূর্ণ কনসেপ্টগুলো প্রতিদিন অন্তত ১০ মিনিট অনুশীলন করে দুর্বলতা কাটিয়ে ওঠো।",
              iconName: "alert",
            });
          }
        }
      }

      // Speed guideline
      if (avgTimePerQuestion > 0) {
        if (avgTimePerQuestion < 25) {
          guidelines.push({
            color: "#0284C7",
            tag: "টাইমিং বিশ্লেষণ",
            title: "উচ্চ সমাধান গতি",
            metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(avgTimePerQuestion))} সে./প্রশ্ন`,
            description:
              "প্রশ্নের উত্তর করার গতি চমৎকার। তবে তাড়াহুড়ো এড়িয়ে প্রতিটি প্রশ্নের অপশন মনোযোগ দিয়ে পড়ার অভ্যাস করো।",
            iconName: "zap",
          });
        } else if (avgTimePerQuestion <= 50) {
          guidelines.push({
            color: "#059669",
            tag: "টাইমিং বিশ্লেষণ",
            title: "আদর্শ গতি ও ব্যালান্স",
            metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(avgTimePerQuestion))} সে./প্রশ্ন`,
            description:
              "প্রতি প্রশ্নে গড় সময় পরীক্ষার জন্য নিখুঁত ও আদর্শ। এই ইতিবাচক রিদম ধরে রাখো।",
            iconName: "timer",
          });
        } else {
          guidelines.push({
            color: "#8B5CF6",
            tag: "টাইমিং পরামর্শ",
            title: "গতি বৃদ্ধির সুযোগ",
            metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(avgTimePerQuestion))} সে./প্রশ্ন`,
            description:
              "নিয়মিত প্র্যাকটিস ও শর্টকাট টেকনিক কাজে লাগিয়ে প্রশ্ন সমাধানের সময় আরও কিছুটা কমিয়ে আনো।",
            iconName: "hourglass",
          });
        }
      }

      // Negative Marking Guideline
      if (totalWrong > 0) {
        guidelines.push({
          color: "#E11D48",
          tag: "স্কোর রিকভারি",
          title: "নেগেটিভ মার্কিং পুনরুদ্ধার",
          metric: `+${BanglaNameHelper.toBanglaNumeral(totalNegativeDeduction.toFixed(1))} নম্বর সুযোগ`,
          description: `ভুল উত্তরের কারণে মোট ${BanglaNameHelper.toBanglaNumeral(totalWrong)}টি প্রশ্নে নম্বর কেটেছে। নিশ্চিত না হয়ে আন্দাজে দাগানো কমালেই স্কোর অনেক বাড়বে।`,
          iconName: "target",
        });
      }

      // Achievements matching Flutter 1:1
      const achievements: AchievementBadge[] = [
        {
          id: "first",
          label: "প্রথম সূচনা",
          description: "প্রথম পরীক্ষা সম্পন্ন",
          unlocked: totalExams >= 1,
          accentColor: AppColors.deepGreen,
        },
        {
          id: "ten",
          label: "১০ পরীক্ষা ক্লাব",
          description: "১০টি পরীক্ষায় অংশগ্রহণ",
          unlocked: totalExams >= 10,
          accentColor: AppColors.deepBlue,
        },
        {
          id: "fifty",
          label: "৫০ পরীক্ষা লিজেন্ড",
          description: "৫০টি পরীক্ষা সফল সম্পন্ন",
          unlocked: totalExams >= 50,
          accentColor: AppColors.deepestBlue,
        },
        {
          id: "score80",
          label: "৮০%+ স্কোর",
          description: "গড়ে ৮০%+ স্কোর অর্জন",
          unlocked: avgScore >= 80,
          accentColor: AppColors.emerald,
        },
        {
          id: "score90",
          label: "৯০%+ জিনিয়াস",
          description: "গড়ে ৯০%+ উচ্চমান স্কোর",
          unlocked: avgScore >= 90,
          accentColor: AppColors.vibrantBlue,
        },
        {
          id: "perfect",
          label: "পারফেক্ট ১০০",
          description: "১০০% নির্ভুল স্কোর",
          unlocked: highestScore >= 100,
          accentColor: AppColors.crimson,
        },
      ];

      return {
        totalExams,
        avgScore,
        avgAccuracy,
        totalTime,
        totalQuestions,
        totalCorrect,
        totalWrong,
        totalSkipped: Math.min(totalQuestions, Math.max(0, totalQuestions - totalCorrect - totalWrong)),
        avgTimePerQuestion,
        highestScore,
        lowestScore: lowestScore < 100 ? lowestScore : highestScore,
        totalNegativeDeduction,
        masteryIndex,
        masteryTier,
        masterySubtitle,
        subjectData,
        timelineData: timeline,
        guidelines,
        achievements,
      } as OverallAnalyticsData;
    },
    { revalidateOnFocus: false, dedupingInterval: 30000 }
  );

  const isActuallyLoading = isLoading || (!activeUserId && authLoading);
  if (isActuallyLoading && !analytics) {
    return <AnalysisSkeleton />;
  }

  // ─── Empty State matching Flutter _buildEmptyState ────────────────────────
  if (!analytics || analytics.totalExams === 0) {
    return (
      <div className="w-full flex items-center justify-center min-h-[70vh] px-4 font-sans">
        <div className="max-w-md w-full p-8 flex flex-col items-center justify-center text-center">
          <h3 className="text-[17px] font-[800] text-[#0F172A] dark:text-white mb-2">
            কোনো পারফরম্যান্স রেকর্ড নেই
          </h3>
          <p className="text-[13.5px] font-[500] text-[#64748B] dark:text-[#A1A1AA] leading-[1.4] mb-6">
            বিশ্লেষণ ও স্মার্ট গাইডলাইন দেখতে অন্তত একটি অনলাইন পরীক্ষা সম্পন্ন করো।
          </p>
          <button
            type="button"
            onClick={() => {
              if (onStartExam) {
                onStartExam();
              } else {
                router.push("/");
              }
            }}
            className="px-6 py-3 rounded-[14px] bg-[#004633] text-white font-bold text-[14px] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer shadow-md"
          >
            পরীক্ষা শুরু করো
          </button>
        </div>
      </div>
    );
  }

  const a = analytics;
  const unlockedCount = a.achievements.filter((e) => e.unlocked).length;

  return (
    <div className="w-full max-w-2xl mx-auto px-2.5 sm:px-4 pt-4 pb-24 flex flex-col gap-4 font-sans select-text">
      {/* ── 1. HEADER & TIME FILTER BAR ── */}
      <div className="p-1 rounded-[14px] bg-[#E2E8F0] dark:bg-[#19191D] flex items-center">
        {[
          { key: "week", label: "গত ৭ দিন" },
          { key: "month", label: "গত ৩০ দিন" },
          { key: "all", label: "সর্বকালীন" },
        ].map((pill) => {
          const isSelected = timeFilter === pill.key;
          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => setTimeFilter(pill.key as any)}
              className={cn(
                "flex-1 py-[8.5px] text-center text-[13px] rounded-[10px] transition-all cursor-pointer select-none",
                isSelected
                  ? "bg-[#004633] text-white font-[800] shadow-[0_2px_8px_rgba(0,70,51,0.35)]"
                  : "text-[#475569] dark:text-[#A1A1AA] font-[600] hover:text-neutral-900 dark:hover:text-white"
              )}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* ── 2. MASTERY HERO CARD (Midnight Navy & Book Deep Green) ── */}
      <div className="relative overflow-hidden rounded-[24px] p-5 bg-gradient-to-br from-[#0B132B] to-[#004633] border-[1.2px] border-[#10B981]/30 shadow-[0_8px_20px_rgba(11,19,43,0.25)] dark:shadow-[0_8px_20px_rgba(11,19,43,0.6)] text-white">
        {/* Top Row: Tier Pill & Exam Count */}
        <div className="flex items-center justify-between">
          <div className="px-3 py-[4.5px] rounded-[20px] bg-white/15 border border-[#10B981]/40 text-[11.5px] font-[600] text-white tracking-[0.4px]">
            {a.masteryTier}
          </div>
          <div className="px-2.5 py-1 rounded-[10px] bg-black/25 text-[11.5px] font-[600] text-[#10B981]">
            {BanglaNameHelper.toBanglaNumeral(a.totalExams)}টি পরীক্ষা সম্পন্ন
          </div>
        </div>

        {/* Big Score on Left */}
        <div className="flex items-baseline gap-1 mt-4">
          <span className="text-[34px] font-[600] text-white leading-none">
            {BanglaNameHelper.toBanglaNumeral(Math.round(a.masteryIndex))}
          </span>
          <span className="text-[14.5px] font-[500] text-white/70">/১০০</span>
        </div>

        {/* Subtitle */}
        <p className="text-[12.5px] font-normal text-white/90 leading-[1.35] mt-1.5">
          মাস্টারি সূচক · {a.masterySubtitle}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-white/[0.18] h-2 rounded-[6px] overflow-hidden mt-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, Math.max(0, a.masteryIndex))}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full bg-[#10B981] rounded-[6px]"
          />
        </div>
      </div>

      {/* ── 3. FOUR CORE METRICS (CENTER ALIGNED, NO ICONS) ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. Avg Score */}
        <div className="py-3.5 px-2.5 rounded-[18px] bg-[#F8FAFC] dark:bg-[#131316] border border-[#E2E8F0] dark:border-[#26262B] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-normal text-[#64748B] dark:text-[#A1A1AA]">
            গড় স্কোর
          </span>
          <span className="text-[18px] font-[600] text-[#0F172A] dark:text-white leading-[1.1] mt-1 mb-[3px]">
            {BanglaNameHelper.toBanglaNumeral(Math.round(a.avgScore))}%
          </span>
          <span className="text-[11px] font-normal text-[#64748B] dark:text-[#A1A1AA] truncate max-w-full">
            সর্বোচ্চ {BanglaNameHelper.toBanglaNumeral(Math.round(a.highestScore))}%
          </span>
        </div>

        {/* 2. Accuracy */}
        <div className="py-3.5 px-2.5 rounded-[18px] bg-[#F8FAFC] dark:bg-[#131316] border border-[#E2E8F0] dark:border-[#26262B] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-normal text-[#64748B] dark:text-[#A1A1AA]">
            নির্ভুলতার হার
          </span>
          <span className="text-[18px] font-[600] text-[#0F172A] dark:text-white leading-[1.1] mt-1 mb-[3px]">
            {BanglaNameHelper.toBanglaNumeral(Math.round(a.avgAccuracy))}%
          </span>
          <span className="text-[11px] font-normal text-[#64748B] dark:text-[#A1A1AA] truncate max-w-full">
            {BanglaNameHelper.toBanglaNumeral(a.totalCorrect)}টি সঠিক উত্তর
          </span>
        </div>

        {/* 3. Speed */}
        <div className="py-3.5 px-2.5 rounded-[18px] bg-[#F8FAFC] dark:bg-[#131316] border border-[#E2E8F0] dark:border-[#26262B] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-normal text-[#64748B] dark:text-[#A1A1AA]">
            গড় সমাধান গতি
          </span>
          <span className="text-[18px] font-[600] text-[#0F172A] dark:text-white leading-[1.1] mt-1 mb-[3px]">
            {BanglaNameHelper.toBanglaNumeral(Math.round(a.avgTimePerQuestion))} সে.
          </span>
          <span className="text-[11px] font-normal text-[#64748B] dark:text-[#A1A1AA] truncate max-w-full">
            প্রতি প্রশ্ন সমাধানে
          </span>
        </div>

        {/* 4. Total Study Time */}
        <div className="py-3.5 px-2.5 rounded-[18px] bg-[#F8FAFC] dark:bg-[#131316] border border-[#E2E8F0] dark:border-[#26262B] shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] flex flex-col items-center justify-center text-center">
          <span className="text-[12px] font-normal text-[#64748B] dark:text-[#A1A1AA]">
            মোট অধ্যয়ন সময়
          </span>
          <span className="text-[18px] font-[600] text-[#0F172A] dark:text-white leading-[1.1] mt-1 mb-[3px]">
            {formatDuration(a.totalTime)}
          </span>
          <span className="text-[11px] font-normal text-[#64748B] dark:text-[#A1A1AA] truncate max-w-full">
            {BanglaNameHelper.toBanglaNumeral(a.totalQuestions)}টি প্রশ্ন সম্পন্ন
          </span>
        </div>
      </div>

      {/* ── 4. SMART GUIDELINES (CENTER-ALIGNED CARDS) ── */}
      {a.guidelines.length > 0 && (
        <div className="flex flex-col gap-3 mt-1">
          <h2 className="text-[15.5px] font-[600] text-[#0F172A] dark:text-white text-center">
            স্মার্ট গাইডলাইন ও উন্নতির সুযোগ
          </h2>

          <div className="flex flex-col gap-3 mt-0.5">
            {a.guidelines.map((g, idx) => {
              const IconComp =
                g.iconName === "trophy"
                  ? Trophy
                  : g.iconName === "alert"
                  ? AlertTriangle
                  : g.iconName === "zap"
                  ? Zap
                  : g.iconName === "timer"
                  ? Timer
                  : g.iconName === "hourglass"
                  ? Hourglass
                  : Target;

              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-[20px] bg-white dark:bg-[#141417] border border-[#E2E8F0] dark:border-[#27272A] shadow-[0_3px_10px_rgba(0,0,0,0.04)] dark:shadow-[0_3px_10px_rgba(0,0,0,0.25)]"
                >
                  {/* Left Colored Accent Bar (4.5px) */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-[4.5px] rounded-l-[20px]"
                    style={{ backgroundColor: g.color }}
                  />

                  <div className="py-4 pr-4 pl-[18px] flex flex-col">
                    {/* Top Row: Category Tag Pill + Metric Highlight Badge */}
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-[8px] flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${g.color}1A`,
                          color: g.color,
                        }}
                      >
                        <IconComp size={15} />
                      </div>
                      <div
                        className="px-[9px] py-[3.5px] rounded-[8px] text-[11.5px] font-[800]"
                        style={{
                          backgroundColor: `${g.color}15`,
                          color: g.color,
                        }}
                      >
                        {g.tag}
                      </div>

                      <div className="flex-1" />

                      {g.metric && (
                        <div className="px-[9px] py-[3.5px] rounded-[8px] bg-[#F1F5F9] dark:bg-[#1C1C21] border border-[#E2E8F0] dark:border-[#2C2C34] text-[11.5px] font-[800] text-[#1E293B] dark:text-white">
                          {g.metric}
                        </div>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-[14.5px] font-[900] text-[#0F172A] dark:text-white tracking-[-0.2px] mt-2.5">
                      {g.title}
                    </h4>

                    {/* Description */}
                    <p className="text-[12.5px] font-[500] text-[#64748B] dark:text-[#A1A1AA] leading-[1.45] mt-1">
                      {g.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. PERFORMANCE TRAJECTORY CHART ── */}
      <div className="p-[18px] rounded-[20px] bg-[#F8FAFC] dark:bg-[#131316] border border-[#E2E8F0] dark:border-[#26262B] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15.5px] font-[800] text-[#0F172A] dark:text-white">
            স্কোর ও অগ্রগতির টাইমলাইন
          </h2>
          <div className="px-2.5 py-[3px] rounded-[10px] bg-[#1D4ED8]/[0.12] text-[11.5px] font-[800] text-[#1D4ED8]">
            সর্বোচ্চ: {BanglaNameHelper.toBanglaNumeral(Math.round(a.highestScore))}%
          </div>
        </div>

        {a.timelineData.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-xs text-[#64748B] dark:text-[#A1A1AA]">
            কোনো টাইমলাইন তথ্য নেই
          </div>
        ) : !mounted ? (
          <div className="h-[180px] w-full animate-pulse bg-neutral-200/50 dark:bg-neutral-800/40 rounded-xl" />
        ) : (
          <div className="h-[180px] w-full min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
              <AreaChart
                data={a.timelineData}
                margin={{ top: 10, right: 8, left: -22, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="flutterBlueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1D4ED8" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="currentColor"
                  className="text-[#E2E8F0] dark:text-[#27272A]"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="currentColor"
                  className="text-black/50 dark:text-white/50 text-[11px] font-[600]"
                  tickLine={false}
                  interval={Math.max(0, Math.ceil(a.timelineData.length / 5) - 1)}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="currentColor"
                  className="text-black/50 dark:text-white/50 text-[11px] font-[600]"
                  tickLine={false}
                  tickFormatter={(v) => BanglaNameHelper.toBanglaNumeral(v)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length > 0 && payload[0]?.payload) {
                      const data = payload[0].payload as TimelinePoint;
                      return (
                        <div className="p-2 rounded-[10px] bg-[#131316] text-white border border-[#26262B] text-xs shadow-lg">
                          <p className="font-semibold text-white/70">
                            তারিখ: {data.label}
                          </p>
                          <p className="font-bold text-[13px] text-[#10B981] mt-0.5">
                            স্কোর: {BanglaNameHelper.toBanglaNumeral(data.score)}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#1D4ED8"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#flutterBlueGradient)"
                  dot={
                    a.timelineData.length <= 15
                      ? {
                          r: 3.5,
                          fill: "#1D4ED8",
                          stroke: "#FFFFFF",
                          strokeWidth: 1.5,
                        }
                      : false
                  }
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── 6. SUBJECT MASTERY BREAKDOWN ── */}
      <div className="p-[18px] rounded-[20px] bg-[#F8FAFC] dark:bg-[#131316] border border-[#E2E8F0] dark:border-[#26262B] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15.5px] font-[800] text-[#0F172A] dark:text-white">
            বিষয়ভিত্তিক দক্ষতা ও পারদর্শিতা
          </h2>
          <span className="text-[11.5px] font-[700] text-[#64748B] dark:text-[#A1A1AA]">
            {BanglaNameHelper.toBanglaNumeral(a.subjectData.length)}টি বিষয়
          </span>
        </div>

        {a.subjectData.length === 0 ? (
          <p className="text-xs text-[#64748B] dark:text-[#A1A1AA] py-5 text-center">
            কোনো পরীক্ষা দেওয়া হয়নি
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {a.subjectData.map((s, idx) => {
              const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
              const badgeColor =
                pct >= 80
                  ? "text-[#004633] dark:text-[#10B981]"
                  : pct >= 60
                  ? "text-[#1D4ED8] dark:text-[#3B82F6]"
                  : "text-[#B91C1C] dark:text-[#EF4444]";

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (onSubjectClick) {
                      onSubjectClick(s.rawName);
                    } else {
                      router.push(`/subject/${encodeURIComponent(s.rawName)}`);
                    }
                  }}
                  className="p-[14px] rounded-[16px] bg-[#F1F5F9] dark:bg-[#19191D] border border-[#E2E8F0] dark:border-[#2E2E34] flex flex-col gap-2.5 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-600 transition-all select-none"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14.5px] font-[800] text-[#0F172A] dark:text-white truncate">
                      {s.displayName}
                    </span>
                    <span className={cn("text-[12px] font-[800]", badgeColor)}>
                      {BanglaNameHelper.toBanglaNumeral(s.total)}টি প্রশ্ন  ·  {BanglaNameHelper.toBanglaNumeral(pct)}%
                    </span>
                  </div>

                  {/* Multi-segment progress (Deep Green, Crimson, Slate Gray) */}
                  <div className="w-full h-[7px] rounded-[6px] overflow-hidden flex bg-transparent">
                    {s.correct > 0 && (
                      <div
                        style={{ flex: s.correct }}
                        className="h-full bg-[#004633] dark:bg-[#059669]"
                        title={`সঠিক: ${s.correct}`}
                      />
                    )}
                    {s.wrong > 0 && (
                      <div
                        style={{ flex: s.wrong }}
                        className="h-full bg-[#B91C1C]"
                        title={`ভুল: ${s.wrong}`}
                      />
                    )}
                    {s.skipped > 0 && (
                      <div
                        style={{ flex: s.skipped }}
                        className="h-full bg-[#CBD5E1] dark:bg-[#3F3F46]"
                        title={`ছেড়ে দেওয়া: ${s.skipped}`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 7. ANSWER BREAKDOWN (CENTER ALIGNED 3 CARDS) ── */}
      <div className="p-[18px] rounded-[20px] bg-[#F8FAFC] dark:bg-[#131316] border border-[#E2E8F0] dark:border-[#26262B] flex flex-col gap-4">
        <h2 className="text-[15.5px] font-[800] text-[#0F172A] dark:text-white">
          উত্তরের সামগ্রিক বিভাজন
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {/* Correct */}
          <div className="py-3.5 px-1.5 rounded-[14px] bg-[#004633]/[0.08] dark:bg-[#004633]/[0.16] border border-[#004633]/25 flex flex-col items-center justify-center text-center">
            <span className="text-[20px] font-[900] text-[#004633] dark:text-[#10B981] leading-none">
              {BanglaNameHelper.toBanglaNumeral(a.totalCorrect)}
            </span>
            <span className="text-[12px] font-[700] text-[#334155] dark:text-white/70 mt-1">
              সঠিক উত্তর
            </span>
          </div>

          {/* Wrong */}
          <div className="py-3.5 px-1.5 rounded-[14px] bg-[#B91C1C]/[0.08] dark:bg-[#B91C1C]/[0.16] border border-[#B91C1C]/25 flex flex-col items-center justify-center text-center">
            <span className="text-[20px] font-[900] text-[#B91C1C] dark:text-[#EF4444] leading-none">
              {BanglaNameHelper.toBanglaNumeral(a.totalWrong)}
            </span>
            <span className="text-[12px] font-[700] text-[#334155] dark:text-white/70 mt-1">
              ভুল উত্তর
            </span>
          </div>

          {/* Skipped */}
          <div className="py-3.5 px-1.5 rounded-[14px] bg-[#64748B]/[0.08] dark:bg-[#64748B]/[0.16] border border-[#64748B]/25 flex flex-col items-center justify-center text-center">
            <span className="text-[20px] font-[900] text-[#64748B] dark:text-[#94A3B8] leading-none">
              {BanglaNameHelper.toBanglaNumeral(a.totalSkipped)}
            </span>
            <span className="text-[12px] font-[700] text-[#334155] dark:text-white/70 mt-1">
              ছেড়ে দেওয়া
            </span>
          </div>
        </div>
      </div>

      {/* ── 8. MILESTONE & ACHIEVEMENT ROOM ── */}
      <div className="p-[18px] rounded-[20px] bg-[#F8FAFC] dark:bg-[#131316] border border-[#E2E8F0] dark:border-[#26262B] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15.5px] font-[800] text-[#0F172A] dark:text-white">
            মাইলফলক ও অর্জন
          </h2>
          <span className="text-[12px] font-[800] text-[#1D4ED8]">
            {BanglaNameHelper.toBanglaNumeral(unlockedCount)}/{BanglaNameHelper.toBanglaNumeral(a.achievements.length)} অর্জিত
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {a.achievements.map((ach) => {
            const isUnlocked = ach.unlocked;

            return (
              <div
                key={ach.id}
                className={cn(
                  "py-2.5 px-1.5 rounded-[14px] border flex flex-col items-center justify-center text-center transition-all",
                  isUnlocked
                    ? "border-opacity-35"
                    : "bg-[#F1F5F9] dark:bg-[#19191D] border-[#E2E8F0] dark:border-[#27272A]"
                )}
                style={{
                  backgroundColor: isUnlocked
                    ? `${ach.accentColor}18`
                    : undefined,
                  borderColor: isUnlocked
                    ? `${ach.accentColor}55`
                    : undefined,
                }}
              >
                <span
                  className={cn(
                    "text-[12px] font-[800] truncate max-w-full",
                    isUnlocked
                      ? "text-[#0F172A] dark:text-white"
                      : "text-[#64748B] dark:text-[#A1A1AA]"
                  )}
                >
                  {ach.label}
                </span>
                <span
                  className="text-[10.5px] font-[600] mt-1"
                  style={{
                    color: isUnlocked ? ach.accentColor : undefined,
                  }}
                >
                  {isUnlocked ? "আনলকড" : "লকড"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
