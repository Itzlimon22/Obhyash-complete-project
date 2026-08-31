"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  FileQuestion,
  CheckCircle2,
  Clock,
  BarChart2,
  AlertTriangle,
  Award,
  BookOpen,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ExamResult } from "@/lib/types";
import { getSubjectAnalysis, SubjectAnalysis } from "@/services/database";
import { printSubjectReport } from "@/services/print-service";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import LatexText from "@/components/student/ui/common/LatexText";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

interface SubjectReportViewProps {
  subject: string;
  history: ExamResult[];
  onBack: () => void;
}

export const SubjectReportView: React.FC<SubjectReportViewProps> = ({
  subject,
  history,
  onBack,
}) => {
  const { user, loading: authLoading } = useAuth();
  const [timeFilter, setTimeFilter] = useState<"all" | "month" | "week">("all");

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SubjectAnalysis | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (authLoading || !user?.id) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const analysis = await getSubjectAnalysis(user.id, subject, timeFilter);
        if (isMounted) setStats(analysis);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [subject, timeFilter, user?.id, authLoading]);

  const pieData = stats
    ? [
        { name: "সঠিক", value: stats.correct, color: "#10b981" },
        { name: "ভুল", value: stats.wrong, color: "#f43f5e" },
        { name: "স্কিপড", value: stats.skipped, color: "#f59e0b" },
      ]
    : [];

  const chartData =
    (stats?.totalQuestions || 0) === 0
      ? [{ name: "Empty", value: 1, color: "#f1f5f9" }]
      : pieData;

  const weakChapters = useMemo(() => {
    if (!stats) return [];
    return stats.chapterPerformance
      .filter((c) => c.wrong > 0)
      .sort((a, b) => b.wrong - a.wrong);
  }, [stats]);

  const handleDownload = () => {
    if (stats) {
      printSubjectReport(subject, stats);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8 flex items-center justify-center font-['HindSiliguri']">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-neutral-500 font-bold text-sm">
            বিষয়ভিত্তিক রিপোর্ট তৈরি হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  const subjectTitle = BanglaNameHelper.formatSubject(subject, subject);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-2 py-4 md:p-8 animate-fade-in transition-colors font-['HindSiliguri'] pb-24">
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#27272A] transition-all shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white leading-tight">
              {subjectTitle} 📚
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-bold">
              অধ্যায়ভিত্তিক বিস্তারিত পারফরম্যান্স রিপোর্ট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={timeFilter}
            onChange={(e) =>
              setTimeFilter(e.target.value as "all" | "month" | "week")
            }
            className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-xl px-3.5 py-2 outline-none shadow-sm cursor-pointer"
          >
            <option value="all">সব সময়</option>
            <option value="month">এই মাস</option>
            <option value="week">এই সপ্তাহ</option>
          </select>

          <button
            onClick={handleDownload}
            disabled={stats.totalQuestions === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#004633] hover:bg-[#003627] text-white text-xs font-black rounded-xl shadow-md shadow-emerald-950/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            <Download size={14} />
            <span>ডাউনলোড রিপোর্ট</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        {/* KPI CARDS ROW */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <div className="bg-white dark:bg-[#18181B] p-4 rounded-2xl shadow-sm border border-neutral-200/90 dark:border-[#27272A] flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <FileQuestion size={20} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase">
                মোট প্রশ্ন
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
                {BanglaNameHelper.toBanglaNumeral(stats.totalQuestions)}টি
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-[#18181B] p-4 rounded-2xl shadow-sm border border-neutral-200/90 dark:border-[#27272A] flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase">
                সঠিকতার হার
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                {BanglaNameHelper.toBanglaNumeral(Math.round(stats.accuracy))}%
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-[#18181B] p-4 rounded-2xl shadow-sm border border-neutral-200/90 dark:border-[#27272A] flex flex-col sm:flex-row items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs font-bold text-neutral-500 uppercase">
                গড় সময়
              </p>
              <h3 className="text-lg sm:text-2xl font-black text-neutral-900 dark:text-white tabular-nums">
                {BanglaNameHelper.toBanglaNumeral(Math.round(stats.averageTime))} সে.
              </h3>
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Accuracy Pie Chart */}
          <div className="bg-white dark:bg-[#18181B] p-5 rounded-2xl shadow-sm border border-neutral-200/90 dark:border-[#27272A]">
            <h3 className="font-black text-sm text-neutral-900 dark:text-white mb-3">
              ফলাফল বিশ্লেষণ
            </h3>

            {stats.totalQuestions === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-neutral-400 text-xs">
                <BarChart2 size={24} className="mb-2 opacity-50" />
                <p>পর্যাপ্ত ডাটা নেই</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-52 w-full">
                <div className="relative w-40 h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={50}
                        outerRadius={68}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-black text-neutral-900 dark:text-white">
                      {BanglaNameHelper.toBanglaNumeral(Math.round(stats.accuracy))}%
                    </span>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      Accuracy
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  {pieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-neutral-600 dark:text-neutral-300">
                        {item.name}: {BanglaNameHelper.toBanglaNumeral(item.value)}টি
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Weak Chapters Spotlight */}
          <div className="bg-white dark:bg-[#18181B] p-5 rounded-2xl shadow-sm border border-neutral-200/90 dark:border-[#27272A]">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-red-500" />
              <h3 className="font-black text-sm text-neutral-900 dark:text-white">
                মনোযোগের অধ্যায়সমূহ
              </h3>
            </div>

            {weakChapters.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 size={32} className="text-emerald-500 mb-2" />
                <p className="text-xs font-black text-neutral-800 dark:text-neutral-200">
                  কোনো বড় ধরনের দুর্বলতা পাওয়া যায়নি!
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  এই বিষয়ের প্রস্তুতি চমৎকার চলছে।
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-52 overflow-y-auto">
                {weakChapters.slice(0, 4).map((ch, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-red-50/50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                      {BanglaNameHelper.formatChapter((ch as any).chapter || ch.name)}
                    </span>
                    <span className="font-black text-red-600 dark:text-red-400 shrink-0">
                      {BanglaNameHelper.toBanglaNumeral(ch.wrong)}টি ভুল
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ALL CHAPTERS BREAKDOWN */}
        <div className="bg-white dark:bg-[#18181B] p-5 rounded-2xl shadow-sm border border-neutral-200/90 dark:border-[#27272A]">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen size={16} className="text-[#004633] dark:text-emerald-400" />
            <h3 className="font-black text-sm sm:text-base text-neutral-900 dark:text-white">
              সকল অধ্যায়ের ফলাফল
            </h3>
          </div>

          <div className="space-y-3">
            {stats.chapterPerformance.map((ch, idx) => {
              const total = ch.total || ch.correct + ch.wrong + (ch.skipped || 0);
              const acc = total > 0 ? Math.round((ch.correct / total) * 100) : 0;
              const barColor =
                acc >= 75
                  ? "bg-[#004633]"
                  : acc >= 50
                  ? "bg-amber-500"
                  : "bg-red-500";

              return (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-neutral-100 dark:border-[#27272A] bg-neutral-50/40 dark:bg-[#141417]"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                      {BanglaNameHelper.formatChapter((ch as any).chapter || ch.name)}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-neutral-400">
                        {BanglaNameHelper.toBanglaNumeral(total)} প্রশ্ন
                      </span>
                      <span className="font-black text-neutral-900 dark:text-white">
                        {BanglaNameHelper.toBanglaNumeral(acc)}%
                      </span>
                    </div>
                  </div>

                  <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", barColor)}
                      style={{ width: `${acc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectReportView;
