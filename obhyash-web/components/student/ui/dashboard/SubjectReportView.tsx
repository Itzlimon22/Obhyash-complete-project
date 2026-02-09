import React, { useState, useEffect, useMemo } from 'react';
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
} from 'recharts';
import { ExamResult } from '@/lib/types';
import { getSubjectAnalysis, SubjectAnalysis } from '@/services/database';
import { printSubjectReport } from '@/services/print-service';
import { supabase } from '@/services/core';

interface SubjectReportViewProps {
  subject: string;
  history: ExamResult[];
  onBack: () => void;
}

const SubjectReportView: React.FC<SubjectReportViewProps> = ({
  subject,
  history,
  onBack,
}) => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

  // Async Data State (Simulating Supabase Fetch)
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SubjectAnalysis | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && isMounted) {
          const analysis = await getSubjectAnalysis(
            user.id,
            subject,
            timeFilter,
          );
          if (isMounted) setStats(analysis);
        }
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
  }, [subject, timeFilter]);

  // Chart Data Preparation
  const pieData = stats
    ? [
        { name: 'সঠিক', value: stats.correct, color: '#10b981' }, // Emerald
        { name: 'ভুল', value: stats.wrong, color: '#f43f5e' }, // Rose (Theme consistent)
        { name: 'স্কিপড', value: stats.skipped, color: '#f59e0b' }, // Amber
      ]
    : [];

  const chartData =
    (stats?.totalQuestions || 0) === 0
      ? [{ name: 'Empty', value: 1, color: '#f1f5f9' }]
      : pieData;

  // Derive Weak Chapters / Topics for Tendency Analysis
  const weakChapters = useMemo(() => {
    if (!stats) return [];
    return stats.chapterPerformance
      .map((c) => ({
        name: c.name,
        total: c.total,
        wrong: c.total - c.correct,
        accuracy: c.accuracy,
      }))
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
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
          <p className="text-neutral-500 font-bold text-sm">
            রিপোর্ট তৈরি হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8 animate-fade-in transition-colors font-sans pb-24">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 transition-all shadow-sm group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5 group-hover:-tranneutral-x-0.5 transition-transform"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
              {subject}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
              বিস্তারিত পারফরম্যান্স রিপোর্ট
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Filter */}
          <select
            value={timeFilter}
            onChange={(e) =>
              setTimeFilter(e.target.value as 'all' | 'month' | 'week')
            }
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 shadow-sm cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <option value="all">সব সময় (All Time)</option>
            <option value="month">এই মাস (This Month)</option>
            <option value="week">এই সপ্তাহ (This Week)</option>
          </select>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            disabled={stats.totalQuestions === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
            <span className="hidden sm:inline">ডাউনলোড</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* KPI CARDS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-5 transition-all hover:border-rose-200 dark:hover:border-rose-900 group">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm group-hover:scale-105 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                মোট প্রশ্ন উত্তর
              </p>
              <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
                {stats.totalQuestions}
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-5 transition-all hover:border-emerald-200 dark:hover:border-emerald-900 group">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                সঠিকতার হার
              </p>
              <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
                {stats.accuracy}%
              </h3>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex items-center gap-5 transition-all hover:border-amber-200 dark:hover:border-amber-900 group">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-sm group-hover:scale-105 transition-transform">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-7 h-7"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                গড় সময় (প্রশ্ন প্রতি)
              </p>
              <h3 className="text-3xl font-extrabold text-neutral-900 dark:text-white mt-1">
                {stats.averageTime}s
              </h3>
            </div>
          </div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accuracy Pie Chart */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="w-full flex justify-between items-center mb-2 z-10">
              <h3 className="font-bold text-lg text-neutral-800 dark:text-white">
                ফলাফল বিশ্লেষণ
              </h3>
            </div>

            {stats.totalQuestions === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10 mb-2 opacity-50"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
                  />
                </svg>
                <p className="text-sm font-medium">পর্যাপ্ত ডাটা নেই</p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 h-64 w-full z-10">
                <div className="relative w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={80}
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
                    <span className="text-3xl font-extrabold text-neutral-900 dark:text-white">
                      {stats.accuracy}%
                    </span>
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                      Accuracy
                    </span>
                  </div>
                </div>

                <div className="space-y-4 w-full sm:w-auto min-w-[140px]">
                  {pieData.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 w-full"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chapter Performance Bar Chart */}
          <div className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-bold text-lg text-neutral-800 dark:text-white mb-6">
              অধ্যায়ভিত্তিক দক্ষতা
            </h3>

            {stats.chapterPerformance.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-10 h-10 mb-2 opacity-50"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
                <p className="text-sm font-medium">অধ্যায় ডাটা পাওয়া যায়নি</p>
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.chapterPerformance}
                    layout="vertical"
                    margin={{ left: 0, right: 20 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#e2e8f0"
                      opacity={0.5}
                    />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-neutral-800 p-3 rounded-lg shadow-xl border border-neutral-100 dark:border-neutral-700">
                              <p className="font-bold text-neutral-800 dark:text-white text-sm mb-1">
                                {data.name}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Accuracy:{' '}
                                <span className="font-bold text-indigo-500">
                                  {data.accuracy}%
                                </span>
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                Questions: {data.total}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="accuracy"
                      radius={4}
                      barSize={20}
                      background={{ fill: '#f1f5f9' }}
                    >
                      {stats.chapterPerformance.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.accuracy >= 80
                              ? '#10b981'
                              : entry.accuracy >= 50
                                ? '#f59e0b'
                                : '#f43f5e'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* WEAKNESS & TENDENCY SECTION */}
        <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-neutral-50/50 dark:bg-neutral-800/30">
            <h3 className="font-bold text-lg text-neutral-800 dark:text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0-1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              দুর্বলতা ও ভুলের ধরণ (Weakness Analysis)
            </h3>
          </div>

          <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
            {weakChapters.length > 0 ? (
              <div className="space-y-6">
                {/* Tendency Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                    <h4 className="font-bold text-orange-800 dark:text-orange-200 text-sm mb-1 uppercase tracking-wide">
                      সর্বাধিক ভুল (Top Mistake Area)
                    </h4>
                    <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                      {weakChapters[0]?.name || 'N/A'}
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-300 mt-1 font-medium">
                      {weakChapters[0]?.wrong}টি ভুল উত্তর
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
                    <h4 className="font-bold text-indigo-800 dark:text-indigo-200 text-sm mb-1 uppercase tracking-wide">
                      পরামর্শ (Recommendation)
                    </h4>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      আপনার{' '}
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {weakChapters[0]?.name}
                      </span>{' '}
                      অধ্যায়ে দুর্বলতা রয়েছে। মূল বইয়ের কনসেপ্টগুলো আবার ঝালিয়ে
                      নিন এবং বেশি করে প্র্যাকটিস করুন।
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <h4 className="font-bold text-neutral-600 dark:text-neutral-400 text-xs uppercase tracking-wider mb-3">
                    বিষয়ভিত্তিক ভুলের তালিকা (Mistake Tendency by Topic)
                  </h4>

                  <div className="grid grid-cols-1 gap-3">
                    {weakChapters.map((chapter, idx) => (
                      <div
                        key={idx}
                        className="group bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-800 transition-colors shadow-sm flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-neutral-900 dark:text-white text-sm md:text-base truncate">
                              {chapter.name}
                            </h5>
                            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md shrink-0">
                              {chapter.wrong} Mistakes
                            </span>
                          </div>

                          <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-rose-500 to-orange-500 rounded-full"
                              style={{
                                width: `${Math.min(100, (chapter.wrong / Math.max(chapter.total, 1)) * 100)}%`,
                              }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center mt-1.5">
                            <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-wide">
                              Error Rate
                            </p>
                            <p className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">
                              {Math.round(
                                (chapter.wrong / chapter.total) * 100,
                              )}
                              %
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-neutral-50/50 dark:bg-neutral-800/20 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-700">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 ring-8 ring-emerald-50/50 dark:ring-emerald-900/10">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-8 h-8 text-emerald-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <h4 className="font-bold text-neutral-900 dark:text-white text-lg mb-1">
                  চমৎকার পারফরম্যান্স!
                </h4>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs mx-auto">
                  নির্বাচিত ফিল্টারে আপনার কোনো ভুল উত্তর পাওয়া যায়নি। অনুশীলন
                  চালিয়ে যান।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectReportView;
