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
  Sparkles,
  BarChart3,
  CheckCircle2,
  XCircle,
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
import { getOverallAnalytics, OverallAnalytics } from "@/services/stats-service";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { useAuth } from "@/components/auth/AuthProvider";
import { AnalysisSkeleton } from "@/components/student/ui/common/Skeletons";
import useSWR from "swr";
import { cn } from "@/lib/utils";

interface AnalysisViewProps {
  history: ExamResult[];
  onSubjectClick?: (subject: string) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  history,
  onSubjectClick,
}) => {
  const [timeFilter, setTimeFilter] = usePersistedState<"all" | "month" | "week">(
    "analysis_time_filter",
    "all"
  );

  const { user, loading: authLoading } = useAuth();

  const { data: analytics, isLoading } = useSWR(
    !authLoading && (history?.length > 0 || user?.id)
      ? ["overall_analytics", history?.[0]?.user_id || user?.id, timeFilter]
      : null,
    async () => {
      const userId = history?.[0]?.user_id || user?.id;
      if (!userId) return null;
      return getOverallAnalytics(userId, timeFilter);
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const formatTime = (seconds: number) => {
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

  const totalQuestions = analytics?.totalQuestions || 0;
  const totalCorrect = analytics?.totalCorrect || 0;
  const totalWrong = analytics?.totalWrong || 0;
  const avgScore = analytics?.avgScore || 0;
  const accuracy = analytics?.avgAccuracy || 0;

  // Compute Mastery Tier matching Flutter
  const masteryTierInfo = useMemo(() => {
    const score = avgScore;
    const count = analytics?.totalExams || 0;
    const acc = accuracy;

    // Weighted index: 50% accuracy + 40% avg score + 10% volume consistency
    const index = Math.min(
      100,
      Math.round(acc * 0.5 + score * 0.4 + Math.min(count * 2, 10))
    );

    if (index >= 90) {
      return {
        title: "গ্র্যান্ড মাস্টার",
        icon: "👑",
        subtitle: "অসাধারণ দক্ষতা! তুমি শীর্ষ মেধা তালিকায় জায়গা করার পথে আছো।",
        gradient: "from-amber-500 via-orange-500 to-amber-600",
        bgLight: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
        index,
      };
    }
    if (index >= 75) {
      return {
        title: "মাস্টার স্কলার",
        icon: "🎓",
        subtitle: "চমৎকার অগ্রগতি! নিয়মিত অনুশীলনে আরো নিখুঁত হও।",
        gradient: "from-indigo-600 via-blue-600 to-indigo-700",
        bgLight: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50",
        index,
      };
    }
    if (index >= 60) {
      return {
        title: "সিনিয়র এক্সপ্লোরার",
        icon: "🚀",
        subtitle: "দৃঢ় ভিত্তি তৈরি হয়েছে। কঠিন প্রশ্নগুলোতে বেশি মনোযোগ দাও।",
        gradient: "from-teal-600 via-emerald-600 to-teal-700",
        bgLight: "bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-900/50",
        index,
      };
    }
    if (index >= 40) {
      return {
        title: "উদীয়মান লার্নার",
        icon: "⭐",
        subtitle: "ভুল উত্তরগুলো বিশ্লেষণ করো ও দুর্বল অধ্যায় রিভিশন দাও।",
        gradient: "from-emerald-600 via-green-600 to-emerald-700",
        bgLight: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50",
        index,
      };
    }
    return {
      title: "নতুন অভিযাত্রী",
      icon: "🌱",
      subtitle: "বেশি বেশি মডেল টেস্ট দিয়ে তোমার পারফরম্যান্স ট্র্যাক করো।",
      gradient: "from-blue-600 via-sky-600 to-blue-700",
      bgLight: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50",
      index,
    };
  }, [avgScore, accuracy, analytics?.totalExams]);

  const bestSubject = useMemo(() => {
    const filtered = (analytics?.subjectData || []).filter((s) => s.total >= 3);
    if (!filtered.length) return null;
    return filtered.reduce((best, s) =>
      s.correct / s.total > best.correct / best.total ? s : best
    );
  }, [analytics]);

  const worstSubject = useMemo(() => {
    const filtered = (analytics?.subjectData || []).filter((s) => s.total >= 3);
    if (filtered.length < 2) return null;
    const worst = filtered.reduce((w, s) =>
      s.correct / s.total < w.correct / w.total ? s : w
    );
    return worst?.name === bestSubject?.name ? null : worst;
  }, [analytics, bestSubject]);

  const bestScore = useMemo(
    () =>
      analytics?.timelineData?.length
        ? Math.max(...analytics.timelineData.map((t) => t.score))
        : null,
    [analytics]
  );

  // Milestone Achievements
  const achievements = useMemo(
    () => [
      {
        id: "first",
        label: "প্রথম পরীক্ষা",
        icon: "🎯",
        unlocked: (analytics?.totalExams || 0) >= 1,
      },
      {
        id: "ten",
        label: "১০ পরীক্ষা",
        icon: "📚",
        unlocked: (analytics?.totalExams || 0) >= 10,
      },
      {
        id: "fifty",
        label: "৫০ পরীক্ষা",
        icon: "🏆",
        unlocked: (analytics?.totalExams || 0) >= 50,
      },
      {
        id: "score80",
        label: "৮০%+ সঠিকতা",
        icon: "⭐",
        unlocked: (analytics?.avgAccuracy || 0) >= 80,
      },
      {
        id: "score90",
        label: "৯০%+ সঠিকতা",
        icon: "💎",
        unlocked: (analytics?.avgAccuracy || 0) >= 90,
      },
      {
        id: "perfect",
        label: "পারফেক্ট স্কোর",
        icon: "🌟",
        unlocked: bestScore === 100,
      },
    ],
    [analytics, bestScore]
  );

  if (isLoading) return <AnalysisSkeleton />;

  if (!analytics || analytics.totalExams === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 font-['HindSiliguri']">
        <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-3 text-neutral-400">
          <BarChart3 size={32} />
        </div>
        <h2 className="text-lg font-black text-neutral-800 dark:text-white">
          কোনো তথ্য পাওয়া যায়নি
        </h2>
        <p className="text-neutral-500 text-xs max-w-sm mt-1 mb-5">
          বিশ্লেষণ দেখতে অন্তত একটি পরীক্ষা সম্পন্ন করো অথবা সময়সীমা পরিবর্তন করো।
        </p>
        <div className="flex gap-2">
          {(["week", "month", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={cn(
                "text-xs font-bold px-4 py-1.5 rounded-xl border transition-all",
                timeFilter === f
                  ? "bg-[#004633] text-white border-[#004633] shadow"
                  : "bg-white dark:bg-[#18181B] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-[#27272A]"
              )}
            >
              {f === "week" ? "সপ্তাহ" : f === "month" ? "মাস" : "সব"}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-24 font-['HindSiliguri'] animate-fade-in px-2 sm:px-4 pt-4">
      {/* ── 1. MASTERY TIER HERO BANNER ─────────────────────────────────── */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white shadow-xl bg-gradient-to-br",
          masteryTierInfo.gradient
        )}
      >
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{masteryTierInfo.icon}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black uppercase tracking-wider border border-white/30">
                {masteryTierInfo.title}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              মাস্টারি ইনডেক্স: {BanglaNameHelper.toBanglaNumeral(masteryTierInfo.index)}%
            </h2>
            <p className="text-xs sm:text-sm text-white/90 font-medium max-w-xl">
              {masteryTierInfo.subtitle}
            </p>
          </div>

          {/* Time Filter Pills */}
          <div className="flex sm:flex-col gap-1.5 self-start sm:self-auto bg-black/20 p-1 rounded-2xl border border-white/20">
            {(["week", "month", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setTimeFilter(f)}
                className={cn(
                  "text-xs font-black px-3 py-1 rounded-xl transition-all",
                  timeFilter === f
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-white/80 hover:text-white"
                )}
              >
                {f === "week" ? "সপ্তাহ" : f === "month" ? "মাস" : "সব"}
              </button>
            ))}
          </div>
        </div>

        {/* Progress Bar inside Hero */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-3">
          <div className="flex-1 h-2 bg-black/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${masteryTierInfo.index}%` }}
            />
          </div>
          <span className="text-xs font-black">
            {BanglaNameHelper.toBanglaNumeral(analytics.totalExams)}টি পরীক্ষা সম্পন্ন
          </span>
        </div>
      </div>

      {/* ── 2. 6-KPI GRID (Matching Flutter) ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          {
            label: "গড় নির্ভুলতা",
            value: `${BanglaNameHelper.toBanglaNumeral(Math.round(accuracy))}%`,
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-[#0C2419]",
            border: "border-emerald-200 dark:border-emerald-900/40",
            icon: Target,
          },
          {
            label: "গড় স্কোর",
            value: `${BanglaNameHelper.toBanglaNumeral(Math.round(avgScore))}%`,
            color: "text-blue-600 dark:text-blue-400",
            bg: "bg-blue-50 dark:bg-[#0E1A2E]",
            border: "border-blue-200 dark:border-blue-900/40",
            icon: TrendingUp,
          },
          {
            label: "মোট পরীক্ষা",
            value: `${BanglaNameHelper.toBanglaNumeral(analytics.totalExams)}টি`,
            color: "text-purple-600 dark:text-purple-400",
            bg: "bg-purple-50 dark:bg-[#201035]",
            border: "border-purple-200 dark:border-purple-900/40",
            icon: BookOpen,
          },
          {
            label: "অনুশীলন সময়",
            value: formatTime(analytics.totalTime),
            color: "text-indigo-600 dark:text-indigo-400",
            bg: "bg-indigo-50 dark:bg-[#141838]",
            border: "border-indigo-200 dark:border-indigo-900/40",
            icon: Clock,
          },
          {
            label: "নেগেটিভ লস",
            value: `-${BanglaNameHelper.toBanglaNumeral((analytics.totalNegativeDeduction || 0).toFixed(2))}`,
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-50 dark:bg-[#260C0E]",
            border: "border-red-200 dark:border-red-900/40",
            icon: XCircle,
          },
          {
            label: "সময় / প্রশ্ন",
            value: `${BanglaNameHelper.toBanglaNumeral(Math.round(analytics.avgTimePerQuestion || 45))} সে.`,
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-[#2B1B0A]",
            border: "border-amber-200 dark:border-amber-900/40",
            icon: Zap,
          },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={cn(
                "p-3 rounded-2xl border shadow-sm flex flex-col justify-between",
                kpi.bg,
                kpi.border
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  {kpi.label}
                </span>
                <Icon size={14} className={kpi.color} />
              </div>
              <p className={cn("text-lg sm:text-xl font-black tabular-nums", kpi.color)}>
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── 3. AI STUDY GUIDELINES & INSIGHTS ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Strength Insight */}
        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-[#0C2419] border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
            💪
          </div>
          <div>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              সবচেয়ে সবল বিষয়
            </span>
            <h4 className="text-sm font-black text-neutral-900 dark:text-white mt-0.5">
              {bestSubject ? BanglaNameHelper.formatSubject(bestSubject.name, bestSubject.name) : "নিয়মিত পরীক্ষা দাও"}
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mt-1">
              {bestSubject
                ? `সঠিকতা ${BanglaNameHelper.toBanglaNumeral(Math.round((bestSubject.correct / bestSubject.total) * 100))}%। এই বিষয়ে তোমার কনফিডেন্স দারুণ!`
                : "কমপক্ষে ৩টি পরীক্ষা দিলে শক্তিশালী বিষয় চিহ্নিত হবে।"}
            </p>
          </div>
        </div>

        {/* Weak Area Insight */}
        <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-[#260C0E] border border-red-200 dark:border-red-900/50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
            ⚠️
          </div>
          <div>
            <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
              মনোযোগের বিষয়
            </span>
            <h4 className="text-sm font-black text-neutral-900 dark:text-white mt-0.5">
              {worstSubject ? BanglaNameHelper.formatSubject(worstSubject.name, worstSubject.name) : "ভারসাম্যপূর্ণ প্রস্তুতি"}
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mt-1">
              {worstSubject
                ? `সঠিকতা ${BanglaNameHelper.toBanglaNumeral(Math.round((worstSubject.correct / worstSubject.total) * 100))}%। ভুল উত্তর ব্যাংক থেকে রিভিশন দাও।`
                : "সকল বিষয়ে তোমার পারফরম্যান্স সমান্তরাল।"}
            </p>
          </div>
        </div>

        {/* Speed Insight */}
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-[#0E1A2E] border border-blue-200 dark:border-blue-900/50 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0">
            ⚡
          </div>
          <div>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              গতি ও সময় সচেতনতা
            </span>
            <h4 className="text-sm font-black text-neutral-900 dark:text-white mt-0.5">
              গড় {BanglaNameHelper.toBanglaNumeral(Math.round(analytics.avgTimePerQuestion || 45))} সে. / প্রশ্ন
            </h4>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium mt-1">
              {(analytics.avgTimePerQuestion || 45) < 45
                ? "গতি চমৎকার! তবে প্রশ্ন ভালোমতো পড়ে কনফার্ম উত্তর দাও।"
                : "টাইমার বজায় রেখে নিয়মিত অনুশীলন করে গতি বাড়াও।"}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. PERFORMANCE TREND AREA CHART ─────────────────────────── */}
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-neutral-200/90 dark:border-[#27272A] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-[#004633] dark:text-emerald-400" />
            <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
              পারফরম্যান্স ট্রেন্ড ও স্কোর অগ্রগতি
            </h3>
          </div>

          {bestScore !== null && (
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
              সর্বোচ্চ: {BanglaNameHelper.toBanglaNumeral(bestScore)}%
            </span>
          )}
        </div>

        <div className="h-48 sm:h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={analytics.timelineData}
              margin={{ top: 5, right: 4, left: -28, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#004633" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#004633" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                opacity={0.3}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                dy={8}
                minTickGap={30}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "14px",
                  border: "none",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  fontSize: "12px",
                  padding: "8px 12px",
                  backgroundColor: "#18181B",
                  color: "#fff",
                }}
                formatter={(value: any) => [
                  `${BanglaNameHelper.toBanglaNumeral(value)}%`,
                  "স্কোর",
                ]}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#004633"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#gradGreen)"
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 5. SUBJECT PERFORMANCE BREAKDOWN & CHAPTER DRILLDOWN ──────── */}
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-neutral-200/90 dark:border-[#27272A] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#004633] dark:text-emerald-400" />
            <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
              বিষয়ভিত্তিক পারফরম্যান্স ও অধ্যায় রিপোর্ট
            </h3>
          </div>
          <span className="text-xs font-bold text-neutral-400">
            ক্লিক করে বিস্তারিত দেখুন
          </span>
        </div>

        <div className="space-y-3">
          {(analytics.subjectData || []).length === 0 ? (
            <p className="text-center text-xs text-neutral-400 py-6">
              এখনও কোনো পরীক্ষা দেওয়া হয়নি।
            </p>
          ) : (
            analytics.subjectData.map((subject, i) => {
              const pct =
                subject.total > 0
                  ? Math.round((subject.correct / subject.total) * 100)
                  : 0;

              const barColor =
                pct >= 75
                  ? "bg-[#004633]"
                  : pct >= 50
                  ? "bg-amber-500"
                  : "bg-red-500";

              return (
                <button
                  key={i}
                  onClick={() => onSubjectClick && onSubjectClick(subject.name)}
                  className="w-full text-left p-3 rounded-xl border border-neutral-100 dark:border-[#27272A] hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50/40 dark:bg-[#141417] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs sm:text-sm font-black text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {BanglaNameHelper.formatSubject(subject.name, subject.name)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-neutral-400">
                        {BanglaNameHelper.toBanglaNumeral(subject.total)} প্রশ্ন
                      </span>
                      <span className="text-xs sm:text-sm font-black tabular-nums text-neutral-900 dark:text-white">
                        {BanglaNameHelper.toBanglaNumeral(pct)}%
                      </span>
                      <ChevronRight
                        size={14}
                        className="text-neutral-400 group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>

                  <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", barColor)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── 6. ACHIEVEMENT SHELF ────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#18181B] rounded-2xl border border-neutral-200/90 dark:border-[#27272A] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Award size={16} className="text-amber-500" />
          <h3 className="text-sm sm:text-base font-black text-neutral-900 dark:text-white">
            মাইলফলক ও অর্জনসমূহ
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1",
                a.unlocked
                  ? "bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50 shadow-sm"
                  : "bg-neutral-50 dark:bg-[#141417] border-neutral-200 dark:border-[#27272A] opacity-40 grayscale"
              )}
            >
              <span className="text-2xl mb-0.5">{a.unlocked ? a.icon : "🔒"}</span>
              <p className="text-[11px] font-black text-neutral-800 dark:text-neutral-200 leading-tight">
                {a.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
