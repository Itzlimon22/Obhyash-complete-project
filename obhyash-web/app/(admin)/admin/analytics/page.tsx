'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  CheckCircle,
  Clock,
  RefreshCw,
  Award,
  BookOpen,
  Brain,
  Sparkles,
  Flame,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { AnalyticsKPIGrid, AnalyticsKPIs } from '@/components/admin/analytics/analytics-kpi-grid';
import { SubjectAccuracyMatrix, SubjectPerf } from '@/components/admin/analytics/subject-accuracy-matrix';
import { PeakStudyHeatmap } from '@/components/admin/analytics/peak-study-heatmap';

interface AnalyticsData {
  timeRange: string;
  kpis: AnalyticsKPIs;
  subjectPerformance: SubjectPerf[];
  userGrowth: Array<{ date: string; users: number; exams: number }>;
  hourlyActivity: number[];
  topPerformers: Array<{
    rank: number;
    id: string;
    name: string;
    email: string;
    xp: number;
    examsCompleted: number;
  }>;
  lastUpdated: string;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = useCallback(
    async (forceRefresh = false) => {
      if (forceRefresh) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await fetch(
          `/api/admin/analytics?timeRange=${timeRange}${
            forceRefresh ? '&refresh=true' : ''
          }`,
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setData(json.data);
            if (forceRefresh) {
              toast.success('অ্যানালিটিক্স ডাটা সফলভাবে রিফ্রেশ হয়েছে!');
            }
          }
        }
      } catch (e) {
        console.error('Error fetching analytics:', e);
        toast.error('অ্যানালিটিক্স ডাটা লোড ব্যর্থ হয়েছে');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [timeRange],
  );

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Export Analytics to CSV
  const handleExportCSV = () => {
    if (!data) return;

    const rows = [
      ['Metric', 'Value'],
      ['Time Range', data.timeRange],
      ['Total Exams', data.kpis.totalExams],
      ['Period Exams', data.kpis.rangeExamsCount],
      ['Average Score %', `${data.kpis.averageScore}%`],
      ['Total Users', data.kpis.totalUsers],
      ['Pro Users', data.kpis.proUsers],
      ['DAU (Daily Active)', data.kpis.dau],
      ['MAU (Monthly Active)', data.kpis.mau],
      ['Stickiness Ratio %', `${data.kpis.stickinessRatio}%`],
      [],
      ['Subject Performance', 'Exams Count', 'Average Score %', 'Students Count', 'Mastery Tier'],
      ...data.subjectPerformance.map((s) => [
        s.subject,
        s.examsCount,
        `${s.averageScore}%`,
        s.totalStudents,
        s.masteryTier,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `obhyash_analytics_${data.timeRange}_${new Date().toISOString().split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV রিপোর্ট ডাউনলোড সম্পন্ন হয়েছে!');
  };

  const defaultKpis: AnalyticsKPIs = {
    totalExams: 0,
    rangeExamsCount: 0,
    averageScore: 0,
    avgTimePerExam: 0,
    totalQuestions: 0,
    totalUsers: 0,
    proUsers: 0,
    dau: 0,
    mau: 0,
    stickinessRatio: 0,
    completionRate: 0,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 tracking-wider uppercase">
              লার্নিং ইন্টেলিজেন্স ও গ্রোথ অ্যানালিটিক্স
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            প্ল্যাটফর্ম পারফরম্যান্স অ্যানালিটিক্স
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
            শিক্ষার্থীদের পরীক্ষার নির্ভুলতা, অধ্যয়নের সময় এবং বিষয়ভিত্তিক পারফরম্যান্স মেট্রিক্স
          </p>
        </div>

        {/* Timeframe selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Pills */}
          <div className="bg-neutral-100 dark:bg-zinc-850 p-1 rounded-xl flex items-center gap-1 text-xs font-bold">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  timeRange === range
                    ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400'
                }`}
              >
                {range === '7d' ? '৭ দিন' : range === '30d' ? '৩০ দিন' : '৯০ দিন'}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-xl transition border border-neutral-200 dark:border-zinc-700/60"
            title="Force refresh database cache"
          >
            <RefreshCw
              size={15}
              className={isRefreshing ? 'animate-spin text-blue-500' : ''}
            />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Download size={15} />
            <span>CSV রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* ── SaaS KPI Metrics Grid ── */}
      <AnalyticsKPIGrid
        kpis={data?.kpis || defaultKpis}
        timeRange={timeRange === '7d' ? '৭ দিনের' : timeRange === '30d' ? '৩০ দিনের' : '৯০ দিনের'}
      />

      {/* ── Peak Study Density Heatmap ── */}
      <PeakStudyHeatmap hourlyActivity={data?.hourlyActivity || []} />

      {/* ── Subject Mastery & Accuracy Matrix ── */}
      <SubjectAccuracyMatrix subjects={data?.subjectPerformance || []} />

      {/* ── Exam Velocity & Growth Trend + Leaderboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Daily Exam Velocity Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                    দৈনিক পরীক্ষা দেওয়ার গতি (Daily Exam Velocity)
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400">
                    নির্বাচিত সময়সীমায় প্রতিদিন সম্পন্ন হওয়া পরীক্ষার সংখ্যা
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Velocity Trend Line Bars */}
          <div className="pt-4">
            <div className="h-36 flex items-end gap-1 sm:gap-2 pt-4 pb-1 border-b border-neutral-200 dark:border-zinc-800">
              {(data?.userGrowth || []).map((point, idx) => {
                const maxExams = Math.max(
                  1,
                  ...((data?.userGrowth || []).map((p) => p.exams) || [1]),
                );
                const heightPercent = Math.max(
                  6,
                  Math.round((point.exams / maxExams) * 100),
                );

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-7 hidden group-hover:flex px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-mono z-20 whitespace-nowrap shadow-lg">
                      {point.date}: {point.exams} exams
                    </div>

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t transition-all duration-300 ${
                        point.exams > 0
                          ? 'bg-blue-600 hover:bg-blue-500'
                          : 'bg-neutral-200 dark:bg-zinc-800/60'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] text-neutral-400 dark:text-zinc-500 pt-2 font-mono">
              <span>{data?.userGrowth?.[0]?.date || 'শুরু'}</span>
              <span>{data?.userGrowth?.[Math.floor((data?.userGrowth?.length || 1) / 2)]?.date || 'মাঝামাঝি'}</span>
              <span>{data?.userGrowth?.[(data?.userGrowth?.length || 1) - 1]?.date || 'আজ'}</span>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Top Performers Leaderboard */}
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Award size={16} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  শীর্ষ সক্রিয় শিক্ষার্থী (Top Active Learners)
                </h3>
                <p className="text-xs text-neutral-500 dark:text-zinc-400">
                  সর্বোচ্চ সংখ্যক পরীক্ষা সম্পন্নকারী শিক্ষার্থী
                </p>
              </div>
            </div>
          </div>

          {/* Student Leaderboard List */}
          <div className="space-y-2.5 pt-1">
            {(data?.topPerformers || []).slice(0, 5).map((performer, idx) => (
              <div
                key={performer.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 border border-neutral-100 dark:border-zinc-800/60"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : idx === 1
                          ? 'bg-slate-200 text-slate-700 dark:bg-zinc-700 dark:text-zinc-200'
                          : idx === 2
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="truncate">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white block truncate">
                      {performer.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 dark:text-zinc-500 block truncate">
                      {performer.email}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-extrabold text-neutral-900 dark:text-white font-mono block">
                    {performer.examsCompleted}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-zinc-500">
                    পরীক্ষা
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
