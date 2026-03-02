import React, { useState, useMemo, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ExamResult } from '@/lib/types';
import SubjectStat from './SubjectStat';
import {
  getOverallAnalytics,
  OverallAnalytics,
} from '@/services/stats-service';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import { supabase } from '@/services/core';
import useSWR from 'swr';
import { useAuth } from '@/components/auth/AuthProvider';

import { AnalysisSkeleton } from '@/components/student/ui/common/Skeletons';

interface AnalysisViewProps {
  history: ExamResult[];
  onSubjectClick?: (subject: string) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({
  history,
  onSubjectClick,
}) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

  const { user, loading: authLoading } = useAuth();

  const {
    data: analytics,
    error,
    isLoading,
  } = useSWR(
    !authLoading && (history?.length > 0 || user?.id)
      ? ['overall_analytics', history?.[0]?.user_id || user?.id, timeFilter]
      : null,
    async () => {
      let userId = history?.[0]?.user_id || user?.id;
      if (!userId) return null;
      return getOverallAnalytics(userId, timeFilter);
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    },
  );

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  // Transform subject names to Bengali
  const localizedSubjectData = useMemo(() => {
    if (!analytics?.subjectData) return [];
    return analytics.subjectData.map((s) => ({
      ...s,
      id: s.name,
      name: getSubjectDisplayName(s.name),
    }));
  }, [analytics && analytics.subjectData]);

  // Check if we have no data
  if (isLoading) {
    return <AnalysisSkeleton />;
  }

  if (!analytics || analytics.totalExams === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 animate-fade-in">
        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-10 h-10 text-neutral-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
          কোনো ডাটা পাওয়া যায়নি
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">
          বিশ্লেষণ দেখতে অন্তত একটি পরীক্ষা সম্পন্ন করুন অথবা সময়সীমা পরিবর্তন
          করো।
        </p>

        <div className="mt-6">
          <select
            value={timeFilter}
            onChange={(e) =>
              setTimeFilter(e.target.value as 'all' | 'month' | 'week')
            }
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-bold rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm cursor-pointer"
          >
            <option value="all">সব সময় (All Time)</option>
            <option value="month">এই মাস (This Month)</option>
            <option value="week">এই সপ্তাহ (This Week)</option>
          </select>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-2">
        {/* Header Removed */}

        <select
          value={timeFilter}
          onChange={(e) =>
            setTimeFilter(e.target.value as 'all' | 'month' | 'week')
          }
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors w-full sm:w-auto"
        >
          <option value="all">সব সময় (All Time)</option>
          <option value="month">এই মাস (This Month)</option>
          <option value="week">এই সপ্তাহ (This Week)</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            মোট পরীক্ষা
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-neutral-800 dark:text-white">
            {analytics.totalExams}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            গড় স্কোর
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {analytics.avgScore}%
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            সঠিকতা
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {analytics.avgAccuracy}%
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            মোট সময়
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-red-600 dark:text-red-400">
            {formatTime(analytics.totalTime)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-neutral-800 dark:text-white">
              ফলাফলের গ্রাফ
            </h3>
            <div className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded">
              Score %
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analytics.timelineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                  opacity={0.5}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  minTickGap={30}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor:
                      'var(--tw-bg-opacity, 1) rgb(255 255 255 / var(--tw-bg-opacity))',
                  }}
                  labelStyle={{
                    color: '#64748b',
                    marginBottom: '0.25rem',
                    fontSize: '12px',
                  }}
                  itemStyle={{
                    color: '#059669',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                  formatter={(value: number | undefined) =>
                    value !== undefined
                      ? [`${value}%`, 'Score']
                      : ['-', 'Score']
                  }
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#059669"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorScore)"
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Breakdown */}
        <div className="">
          <SubjectStat
            data={localizedSubjectData}
            onSubjectClick={(subject) =>
              onSubjectClick && onSubjectClick(subject)
            }
          />
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
