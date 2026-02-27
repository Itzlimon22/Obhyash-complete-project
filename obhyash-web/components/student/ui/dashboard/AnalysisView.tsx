import React, { useState, useEffect } from 'react';
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
import { getOverallAnalytics, OverallAnalytics } from '@/services/database';
import { supabase } from '@/services/core';

interface AnalysisViewProps {
  history: ExamResult[];
  onSubjectClick?: (subject: string) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({
  history,
  onSubjectClick,
}) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
  const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Analytics (Simulating Database Call)
  // Fetch Analytics (Real Database Call)
  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && isMounted) {
          // Now calling RPC-based service
          // Note: history prop is no longer needed for calculation,
          // but we might keep it in props if parent passes it for other reasons.
          // Using 'user.id' is the key change.
          const data = await getOverallAnalytics(user.id, timeFilter);
          if (isMounted) setAnalytics(data);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [timeFilter]); // history dependency removed as we fetch fresh from DB

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-10 h-10 border-4 border-neutral-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">
          এনালাইসিস তৈরি হচ্ছে...
        </p>
      </div>
    );
  }

  if (!analytics || analytics.totalExams === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-fade-in">
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
          কোনো ডাটা পাওয়া যায়নি
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">
          বিশ্লেষণ দেখতে অন্তত একটি পরীক্ষা সম্পন্ন করুন অথবা সময়সীমা পরিবর্তন
          করুন।
        </p>

        <div className="mt-6">
          <select
            value={timeFilter}
            onChange={(e) =>
              setTimeFilter(e.target.value as 'all' | 'month' | 'week')
            }
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-bold rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm cursor-pointer"
          >
            <option value="all">সব সময় (All Time)</option>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            পারফরম্যান্স এনালাইসিস
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            আপনার অগ্রগতির সামগ্রিক চিত্র
          </p>
        </div>

        <select
          value={timeFilter}
          onChange={(e) =>
            setTimeFilter(e.target.value as 'all' | 'month' | 'week')
          }
          className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-sm cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors w-full sm:w-auto"
        >
          <option value="all">সব সময় (All Time)</option>
          <option value="month">এই মাস (This Month)</option>
          <option value="week">এই সপ্তাহ (This Week)</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            মোট পরীক্ষা
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-neutral-800 dark:text-white">
            {analytics.totalExams}
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            গড় স্কোর
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {analytics.avgScore}%
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            সঠিকতা
          </p>
          <p className="text-2xl md:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {analytics.avgAccuracy}%
          </p>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col items-center justify-center text-center">
          <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-wider mb-1">
            মোট সময়
          </p>
          <p className="text-xl md:text-2xl font-extrabold text-red-600 dark:text-red-400">
            {formatTime(analytics.totalTime)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
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
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
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
                    color: '#6366f1',
                    fontWeight: 'bold',
                    fontSize: '14px',
                  }}
                  formatter={(value?: number) => [`${value ?? 0}%`, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
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
        <div className="lg:col-span-1">
          <SubjectStat
            data={analytics.subjectData}
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
