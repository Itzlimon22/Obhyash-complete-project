"use client";

import React, { useState, useMemo } from "react";
import { usePersistedState } from "@/hooks/use-persisted-state";
import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Zap,
  Clock,
  AlertTriangle,
  TrendingUp,
  Award,
  ChevronRight,
  BookOpen,
  BarChart3,
  CheckCircle2,
  XCircle,
  Timer,
  Hourglass,
  RotateCcw,
  ShieldAlert,
  Flame,
  Medal,
  Crown,
  Check,
  X,
  Minus,
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
import { ExamResult } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { useAuth } from "@/components/auth/AuthProvider";
import { AnalysisSkeleton } from "@/components/student/ui/common/Skeletons";
import useSWR from "swr";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

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
  bgColor: string;
  borderColor: string;
  tag: string;
  title: string;
  description: string;
  icon: React.ElementType;
  metric?: string;
}

export interface AchievementBadge {
  id: string;
  label: string;
  description: string;
  unlocked: boolean;
  accentColor: string;
  bgLight: string;
  borderLight: string;
  icon: React.ElementType;
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

interface AnalysisViewProps {
  history?: ExamResult[];
  onSubjectClick?: (subject: string) => void;
  onStartExam?: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  history = [],
  onSubjectClick,
  onStartExam,
}) => {
  const [timeFilter, setTimeFilter] = usePersistedState<"all" | "month" | "week">(
    "analysis_time_filter",
    "all"
  );

  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);

  // Fetch or Compute Analytics Data
  const { data: analytics, isLoading } = useSWR(
    !authLoading && (history?.length > 0 || user?.id)
      ? ["overall_analytics_v2", user?.id || history?.[0]?.user_id, timeFilter]
      : null,
    async () => {
      const uid = user?.id || history?.[0]?.user_id;
      if (!uid) return null;

      let dateFilter = new Date();
      if (timeFilter === "week") {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (timeFilter === "month") {
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      } else {
        dateFilter = new Date("1970-01-01");
      }

      let examList: any[] = [];

      try {
        const { data: rawData, error } = await supabase
          .from("exam_results")
          .select(
            "id, score, total_marks, total_questions, correct_count, wrong_count, time_taken, date, created_at, subject, title, status"
          )
          .eq("user_id", uid)
          .gte("created_at", dateFilter.toISOString())
          .order("created_at", { ascending: true });

        if (!error && rawData && rawData.length > 0) {
          examList = rawData;
        } else if (history && history.length > 0) {
          examList = history.filter((h) => {
            const hDate = new Date(h.date || (h as any).created_at || "");
            return hDate >= dateFilter;
          });
        }
      } catch (err) {
        console.warn("[AnalysisView] Error querying exam_results:", err);
        if (history && history.length > 0) {
          examList = history.filter((h) => {
            const hDate = new Date(h.date || (h as any).created_at || "");
            return hDate >= dateFilter;
          });
        }
      }

      if (!examList || examList.length === 0) {
        return null;
      }

      // Compute calculations matching Flutter 1:1
      let totalExams = 0;
      let totalQuestions = 0;
      let totalCorrect = 0;
      let totalWrong = 0;
      let totalTime = 0;
      let scoreSum = 0;
      let highestScore = 0;
      let lowestScore = 100;
      let totalNegativeDeduction = 0;

      const subjectMap: Record<
        string,
        { total: number; correct: number; wrong: number; label?: string }
      > = {};
      const timeline: TimelinePoint[] = [];

      for (const row of examList) {
        const tQuestions = row.total_questions || row.totalQuestions || 0;
        if (tQuestions <= 0) continue;

        totalExams++;
        const correct = row.correct_count ?? row.correctCount ?? 0;
        const wrong = row.wrong_count ?? row.wrongCount ?? 0;
        const score =
          typeof row.score === "number"
            ? row.score
            : tQuestions > 0
            ? (correct / tQuestions) * 100
            : 0;
        const timeTaken = row.time_taken ?? row.timeTaken ?? 0;
        const subject = row.subject || "General";
        const subjectLabel = row.title || row.subject_label;

        const rawDate = row.created_at || row.date || new Date().toISOString();
        const dateObj = new Date(rawDate);

        totalQuestions += tQuestions;
        totalCorrect += correct;
        totalWrong += wrong;
        totalTime += timeTaken;
        scoreSum += score;
        totalNegativeDeduction += wrong * 0.25;

        if (score > highestScore) highestScore = score;
        if (score < lowestScore) lowestScore = score;

        if (!subjectMap[subject]) {
          subjectMap[subject] = {
            total: tQuestions,
            correct: correct,
            wrong: wrong,
            label: subjectLabel,
          };
        } else {
          subjectMap[subject] = {
            total: subjectMap[subject].total + tQuestions,
            correct: subjectMap[subject].correct + correct,
            wrong: subjectMap[subject].wrong + wrong,
            label: subjectLabel || subjectMap[subject].label,
          };
        }

        const dayMonth = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
        timeline.push({
          label: dayMonth,
          score: Math.round(score),
          date: dateObj,
        });
      }

      const avgScore = totalExams > 0 ? scoreSum / totalExams : 0;
      const avgAccuracy =
        totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      const avgTimePerQuestion =
        totalQuestions > 0 ? totalTime / totalQuestions : 0;

      // Subject Data
      const subjectData: SubjectAnalytics[] = Object.entries(subjectMap)
        .map(([rawName, val]) => {
          const skipped = Math.max(0, val.total - val.correct - val.wrong);
          const acc = val.total > 0 ? (val.correct / val.total) * 100 : 0;
          const displayName = BanglaNameHelper.formatSubject(
            rawName,
            val.label
          );
          return {
            rawName,
            displayName,
            total: val.total,
            correct: val.correct,
            wrong: val.wrong,
            skipped,
            accuracy: acc,
          };
        })
        .sort((a, b) => b.accuracy - a.accuracy);

      // Mastery Score Algorithm matching Flutter
      const volumeBonus = Math.min(1.0, totalQuestions / 200.0) * 10.0;
      const examBonus = Math.min(1.0, totalExams / 15.0) * 10.0;
      const masteryIndex = Math.min(
        100.0,
        Math.max(0, avgScore * 0.45 + avgAccuracy * 0.35 + volumeBonus + examBonus)
      );

      let masteryTier = "নতুন শুরু (Kickstart)";
      let masterySubtitle = "নিয়মিত টেস্ট দিয়ে নিজের বেসিক ও নির্ভুলতা বাড়াও।";
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
      }

      // Smart Study Guidelines
      const guidelines: StudyGuideline[] = [];

      if (subjectData.length > 0) {
        const best = subjectData[0];
        guidelines.push({
          color: "#059669",
          bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
          borderColor: "border-emerald-500/30",
          tag: "সর্বোচ্চ শক্তি",
          title: best.displayName,
          metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(best.accuracy))}% নির্ভুলতা`,
          description:
            "এই বিষয়ে তোমার নির্ভুলতা সবচেয়ে বেশি! নিয়মিত রিভিশন বজায় রেখে এই শক্তিকে ১০০% মার্কসে রূপান্তর করো।",
          icon: Trophy,
        });

        if (subjectData.length > 1) {
          const worst = subjectData[subjectData.length - 1];
          if (worst.accuracy < 75) {
            guidelines.push({
              color: "#F59E0B",
              bgColor: "bg-amber-500/10 dark:bg-amber-500/15",
              borderColor: "border-amber-500/30",
              tag: "অগ্রাধিকার রিভিশন",
              title: worst.displayName,
              metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(worst.accuracy))}% নির্ভুলতা`,
              description:
                "অধ্যায়ের মূল সূত্র ও গুরুত্বপূর্ণ কনসেপ্টগুলো প্রতিদিন অন্তত ১০ মিনিট অনুশীলন করে দুর্বলতা কাটিয়ে ওঠো।",
              icon: AlertTriangle,
            });
          }
        }
      }

      // Speed guideline
      if (avgTimePerQuestion > 0) {
        if (avgTimePerQuestion < 25) {
          guidelines.push({
            color: "#0284C7",
            bgColor: "bg-sky-500/10 dark:bg-sky-500/15",
            borderColor: "border-sky-500/30",
            tag: "টাইমিং বিশ্লেষণ",
            title: "উচ্চ সমাধান গতি",
            metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(avgTimePerQuestion))} সে./প্রশ্ন`,
            description:
              "প্রশ্নের উত্তর করার গতি চমৎকার। তবে তাড়াহুড়ো এড়িয়ে প্রতিটি প্রশ্নের অপশন মনোযোগ দিয়ে পড়ার অভ্যাস করো।",
            icon: Zap,
          });
        } else if (avgTimePerQuestion <= 50) {
          guidelines.push({
            color: "#059669",
            bgColor: "bg-emerald-500/10 dark:bg-emerald-500/15",
            borderColor: "border-emerald-500/30",
            tag: "টাইমিং বিশ্লেষণ",
            title: "আদর্শ গতি ও ব্যালান্স",
            metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(avgTimePerQuestion))} সে./প্রশ্ন`,
            description:
              "প্রতি প্রশ্নে গড় সময় পরীক্ষার জন্য নিখুঁত ও আদর্শ। এই ইতিবাচক রিদম ধরে রাখো।",
            icon: Timer,
          });
        } else {
          guidelines.push({
            color: "#8B5CF6",
            bgColor: "bg-purple-500/10 dark:bg-purple-500/15",
            borderColor: "border-purple-500/30",
            tag: "টাইমিং পরামর্শ",
            title: "গতি বৃদ্ধির সুযোগ",
            metric: `${BanglaNameHelper.toBanglaNumeral(Math.round(avgTimePerQuestion))} সে./প্রশ্ন`,
            description:
              "নিয়মিত প্র্যাকটিস ও শর্টকাট টেকনিক কাজে লাগিয়ে প্রশ্ন সমাধানের সময় আরও কিছুটা কমিয়ে আনো।",
            icon: Hourglass,
          });
        }
      }

      // Negative Marking Guideline
      if (totalWrong > 0) {
        guidelines.push({
          color: "#E11D48",
          bgColor: "bg-rose-500/10 dark:bg-rose-500/15",
          borderColor: "border-rose-500/30",
          tag: "স্কোর রিকভারি",
          title: "নেগেটিভ মার্কিং পুনরুদ্ধার",
          metric: `+${BanglaNameHelper.toBanglaNumeral(totalNegativeDeduction.toFixed(1))} নম্বর সুযোগ`,
          description: `ভুল উত্তরের কারণে মোট ${BanglaNameHelper.toBanglaNumeral(totalWrong)}টি প্রশ্নে নম্বর কেটেছে। নিশ্চিত না হয়ে আন্দাজে দাগানো কমালেই স্কোর অনেক বাড়বে।`,
          icon: Target,
        });
      }

      // Achievements List matching Flutter 1:1
      const achievements: AchievementBadge[] = [
        {
          id: "first",
          label: "প্রথম সূচনা",
          description: "প্রথম পরীক্ষা সম্পন্ন",
          unlocked: totalExams >= 1,
          accentColor: "#004633",
          bgLight: "bg-emerald-500/10",
          borderLight: "border-emerald-500/30",
          icon: Award,
        },
        {
          id: "ten",
          label: "১০ পরীক্ষা ক্লাব",
          description: "১০টি পরীক্ষায় অংশগ্রহণ",
          unlocked: totalExams >= 10,
          accentColor: "#1D4ED8",
          bgLight: "bg-blue-500/10",
          borderLight: "border-blue-500/30",
          icon: Medal,
        },
        {
          id: "fifty",
          label: "৫০ পরীক্ষা লিজেন্ড",
          description: "৫০টি পরীক্ষা সফল সম্পন্ন",
          unlocked: totalExams >= 50,
          accentColor: "#0B132B",
          bgLight: "bg-indigo-500/10",
          borderLight: "border-indigo-500/30",
          icon: Crown,
        },
        {
          id: "score80",
          label: "৮০%+ স্কোর",
          description: "গড়ে ৮০%+ স্কোর অর্জন",
          unlocked: avgScore >= 80,
          accentColor: "#059669",
          bgLight: "bg-emerald-500/10",
          borderLight: "border-emerald-500/30",
          icon: Award,
        },
        {
          id: "score90",
          label: "৯০%+ জিনিয়াস",
          description: "গড়ে ৯০%+ উচ্চমান স্কোর",
          unlocked: avgScore >= 90,
          accentColor: "#2563EB",
          bgLight: "bg-sky-500/10",
          borderLight: "border-sky-500/30",
          icon: Zap,
        },
        {
          id: "perfect",
          label: "পারফেক্ট ১০০",
          description: "১০০% নির্ভুল স্কোর",
          unlocked: highestScore >= 100,
          accentColor: "#B91C1C",
          bgLight: "bg-rose-500/10",
          borderLight: "border-rose-500/30",
          icon: Trophy,
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
        totalSkipped: Math.max(0, totalQuestions - totalCorrect - totalWrong),
        avgTimePerQuestion,
        highestScore,
        lowestScore: lowestScore <= 100 ? lowestScore : highestScore,
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

  const formatDuration = (seconds: number) => {
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

  if (isLoading) return <AnalysisSkeleton />;

  if (!analytics || analytics.totalExams === 0) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-6 py-12 flex flex-col items-center justify-center text-center min-h-[60vh] font-['HindSiliguri']">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-[#004633] dark:text-emerald-400 mb-4 shadow-sm">
          <BarChart3 size={32} />
        </div>
        <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-2">
          কোনো পারফরম্যান্স রেকর্ড নেই
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mb-6 leading-relaxed">
          বিশ্লেষণ ও স্মার্ট গাইডলাইন দেখতে অন্তত একটি অনলাইন পরীক্ষা সম্পন্ন করো।
        </p>
        <button
          onClick={onStartExam}
          className="px-6 py-2.5 rounded-xl bg-[#004633] hover:bg-[#003728] text-white font-bold text-sm shadow-md transition-all active:scale-95"
        >
          পরীক্ষা শুরু করো 🚀
        </button>
      </div>
    );
  }

  const a = analytics;
  const unlockedCount = a.achievements.filter((e) => e.unlocked).length;

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 flex flex-col gap-5 font-['HindSiliguri']">
      {/* ── 1. HEADER & TIME FILTER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#141416] p-4 rounded-2xl border border-neutral-200/80 dark:border-[#27272A] shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
            পারফরম্যান্স অ্যানালিটিক্স
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-medium">
            তোমার সামগ্রিক প্রস্তুতির স্বয়ংক্রিয় ট্র্যাকিং
          </p>
        </div>

        {/* Time Filter Pills */}
        <div className="inline-flex bg-neutral-100 dark:bg-[#1C1C1F] p-1 rounded-xl border border-neutral-200/60 dark:border-neutral-800">
          {[
            { id: "all", label: "সর্বমোট" },
            { id: "month", label: "৩০ দিন" },
            { id: "week", label: "৭ দিন" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeFilter(tab.id as any)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all",
                timeFilter === tab.id
                  ? "bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. MASTERY HERO CARD (Midnight Navy & Book Deep Green) ── */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#0B132B] via-[#0D233A] to-[#004633] border border-emerald-500/30 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-4">
          {/* Top Row: Tier Pill & Exam Count */}
          <div className="flex items-center justify-between gap-2">
            <span className="px-3 py-1 rounded-full bg-white/15 border border-emerald-400/40 text-xs font-black text-white tracking-wide">
              {a.masteryTier}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-black/30 text-emerald-300 text-xs font-bold">
              {BanglaNameHelper.toBanglaNumeral(a.totalExams)}টি পরীক্ষা সম্পন্ন
            </span>
          </div>

          {/* Big Score */}
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl sm:text-5xl font-black text-white leading-none">
              {BanglaNameHelper.toBanglaNumeral(Math.round(a.masteryIndex))}
            </span>
            <span className="text-lg font-bold text-white/70">/১০০</span>
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm font-medium text-white/90 leading-snug">
            মাস্টারি সূচক · {a.masterySubtitle}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden mt-1">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${a.masteryIndex}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </div>
        </div>

        {/* Ambient Glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* ── 3. FOUR CORE PILLARS GRID (Center Aligned, Minimalist) ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* 1. Avg Score */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-[#27272A] shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            গড় স্কোর
          </span>
          <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white my-1">
            {BanglaNameHelper.toBanglaNumeral(Math.round(a.avgScore))}%
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            সর্বোচ্চ {BanglaNameHelper.toBanglaNumeral(Math.round(a.highestScore))}%
          </span>
        </div>

        {/* 2. Accuracy */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-[#27272A] shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            নির্ভুলতার হার
          </span>
          <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white my-1">
            {BanglaNameHelper.toBanglaNumeral(Math.round(a.avgAccuracy))}%
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {BanglaNameHelper.toBanglaNumeral(a.totalCorrect)}টি সঠিক উত্তর
          </span>
        </div>

        {/* 3. Speed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-[#27272A] shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            গড় সমাধান গতি
          </span>
          <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white my-1">
            {BanglaNameHelper.toBanglaNumeral(Math.round(a.avgTimePerQuestion))} সে.
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            প্রতি প্রশ্ন সমাধানে
          </span>
        </div>

        {/* 4. Study Time */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-[#27272A] shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            মোট অধ্যয়ন সময়
          </span>
          <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white my-1">
            {formatDuration(a.totalTime)}
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {BanglaNameHelper.toBanglaNumeral(a.totalQuestions)}টি প্রশ্ন সম্পন্ন
          </span>
        </div>
      </div>

      {/* ── 4. SMART AI STUDY GUIDELINES ── */}
      {a.guidelines.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
            স্মার্ট স্টাডি গাইডলাইন ও রিকমেন্ডেশন
          </h2>

          <div className="flex flex-col gap-3">
            {a.guidelines.map((g, idx) => {
              const IconComponent = g.icon;
              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200/80 dark:border-[#27272A] shadow-sm pl-4 pr-4 py-3.5 flex flex-col gap-2"
                >
                  {/* Left Accent Bar */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: g.color }}
                  />

                  {/* Top Tag & Metric Pill */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${g.color}20`,
                          color: g.color,
                        }}
                      >
                        <IconComponent size={15} />
                      </div>
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-md"
                        style={{
                          backgroundColor: `${g.color}15`,
                          color: g.color,
                        }}
                      >
                        {g.tag}
                      </span>
                    </div>

                    {g.metric && (
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-[#1C1C21] border border-neutral-200 dark:border-[#2C2C34] text-neutral-800 dark:text-neutral-200">
                        {g.metric}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
                      {g.title}
                    </h4>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed mt-1">
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
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-[#27272A] shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
            স্কোর ও অগ্রগতির টাইমলাইন
          </h2>
          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-extrabold border border-blue-200 dark:border-blue-800/40">
            সর্বোচ্চ: {BanglaNameHelper.toBanglaNumeral(Math.round(a.highestScore))}%
          </span>
        </div>

        {a.timelineData.length === 0 ? (
          <div className="h-44 flex items-center justify-center text-xs text-neutral-400">
            কোনো টাইমলাইন তথ্য নেই
          </div>
        ) : (
          <div className="h-48 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={a.timelineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  stroke="currentColor"
                  className="text-neutral-200 dark:text-neutral-800"
                  vertical={false}
                />
                <XAxis
                  dataKey="label"
                  stroke="currentColor"
                  className="text-neutral-400 dark:text-neutral-500 text-[11px] font-bold"
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="currentColor"
                  className="text-neutral-400 dark:text-neutral-500 text-[11px] font-bold"
                  tickLine={false}
                  tickFormatter={(v) => BanglaNameHelper.toBanglaNumeral(v)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as TimelinePoint;
                      return (
                        <div className="p-2.5 rounded-xl bg-neutral-900/95 text-white border border-neutral-700 text-xs shadow-xl backdrop-blur-md">
                          <p className="font-bold text-neutral-400">
                            তারিখ: {data.label}
                          </p>
                          <p className="font-black text-sm text-emerald-400 mt-0.5">
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
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── 6. SUBJECT MASTERY BREAKDOWN ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-[#27272A] shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
            বিষয়ভিত্তিক দক্ষতা ও পারদর্শিতা
          </h2>
          <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
            {BanglaNameHelper.toBanglaNumeral(a.subjectData.length)}টি বিষয়
          </span>
        </div>

        {a.subjectData.length === 0 ? (
          <p className="text-xs text-neutral-400 py-4 text-center">
            কোনো বিষয়ভিত্তিক তথ্য নেই
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {a.subjectData.map((s, idx) => {
              const pct = Math.round(s.accuracy);
              const badgeColor =
                pct >= 80
                  ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40"
                  : pct >= 60
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40"
                  : "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/40";

              return (
                <div
                  key={idx}
                  onClick={() => onSubjectClick?.(s.rawName)}
                  className="p-3.5 sm:p-4 rounded-xl bg-neutral-50/70 dark:bg-[#18181B] border border-neutral-200/80 dark:border-[#27272A] flex flex-col gap-2.5 cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-black text-neutral-900 dark:text-white truncate">
                      {s.displayName}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-black px-2 py-0.5 rounded-lg border",
                        badgeColor
                      )}
                    >
                      {BanglaNameHelper.toBanglaNumeral(s.total)}টি প্রশ্ন ·{" "}
                      {BanglaNameHelper.toBanglaNumeral(pct)}%
                    </span>
                  </div>

                  {/* Multi-segment Progress Bar (Deep Green, Crimson, Slate Gray) */}
                  <div className="w-full h-2 rounded-full overflow-hidden flex bg-neutral-200 dark:bg-neutral-800">
                    {s.correct > 0 && (
                      <div
                        style={{ width: `${(s.correct / s.total) * 100}%` }}
                        className="h-full bg-[#004633] dark:bg-emerald-500"
                        title={`সঠিক: ${s.correct}`}
                      />
                    )}
                    {s.wrong > 0 && (
                      <div
                        style={{ width: `${(s.wrong / s.total) * 100}%` }}
                        className="h-full bg-[#B91C1C] dark:bg-rose-500"
                        title={`ভুল: ${s.wrong}`}
                      />
                    )}
                    {s.skipped > 0 && (
                      <div
                        style={{ width: `${(s.skipped / s.total) * 100}%` }}
                        className="h-full bg-neutral-300 dark:bg-neutral-600"
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

      {/* ── 7. OVERALL ANSWER BREAKDOWN ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-[#27272A] shadow-sm flex flex-col gap-3.5">
        <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
          উত্তরের সামগ্রিক বিভাজন
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Correct */}
          <div className="p-3 sm:p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex flex-col items-center justify-center text-center">
            <span className="text-lg sm:text-2xl font-black text-[#004633] dark:text-emerald-400">
              {BanglaNameHelper.toBanglaNumeral(a.totalCorrect)}
            </span>
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-0.5">
              সঠিক উত্তর
            </span>
          </div>

          {/* Wrong */}
          <div className="p-3 sm:p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 flex flex-col items-center justify-center text-center">
            <span className="text-lg sm:text-2xl font-black text-[#B91C1C] dark:text-rose-400">
              {BanglaNameHelper.toBanglaNumeral(a.totalWrong)}
            </span>
            <span className="text-xs font-bold text-neutral-600 dark:text-neutral-400 mt-0.5">
              ভুল উত্তর
            </span>
          </div>

          {/* Skipped */}
          <div className="p-3 sm:p-4 rounded-xl bg-neutral-100/80 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center text-center">
            <span className="text-lg sm:text-2xl font-black text-neutral-600 dark:text-neutral-300">
              {BanglaNameHelper.toBanglaNumeral(a.totalSkipped)}
            </span>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-0.5">
              ছেড়ে দেওয়া
            </span>
          </div>
        </div>
      </div>

      {/* ── 8. MILESTONES & ACHIEVEMENTS ROOM ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141416] border border-neutral-200/80 dark:border-[#27272A] shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white">
            মাইলফলক ও অর্জন
          </h2>
          <span className="text-xs font-extrabold text-[#1D4ED8] dark:text-blue-400">
            {BanglaNameHelper.toBanglaNumeral(unlockedCount)}/
            {BanglaNameHelper.toBanglaNumeral(a.achievements.length)} অর্জিত
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {a.achievements.map((ach) => {
            const IconComp = ach.icon;
            return (
              <div
                key={ach.id}
                className={cn(
                  "p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all",
                  ach.unlocked
                    ? `${ach.bgLight} ${ach.borderLight}`
                    : "bg-neutral-50/50 dark:bg-[#18181B]/50 border-neutral-200/60 dark:border-neutral-800 opacity-60"
                )}
              >
                <span className="text-xs font-black text-neutral-900 dark:text-white truncate max-w-[120px]">
                  {ach.label}
                </span>
                <span
                  className="text-[11px] font-bold mt-0.5"
                  style={{
                    color: ach.unlocked ? ach.accentColor : "inherit",
                  }}
                >
                  {ach.unlocked ? "আনলকড ✨" : "লকড 🔒"}
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
