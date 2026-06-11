import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp, hoverScale, tapScale } from '@/lib/animations';
import { ArrowLeft, Download, FileQuestion, CheckCircle2, Clock, BarChart2, AlertTriangle, Award } from 'lucide-react';
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
import LatexText from '@/components/student/ui/common/LatexText';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';

import { useAuth } from '@/components/auth/AuthProvider';

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
  const { user, loading: authLoading } = useAuth();
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');

  // Async Data State (Simulating Supabase Fetch)
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
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin"></div>
          <p className="text-neutral-500 font-bold text-sm">
            রিপোর্ট তৈরি হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 px-2 py-4 md:p-8 animate-fade-in transition-colors font-sans pb-24">
      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={hoverScale}
            whileTap={tapScale}
            onClick={onBack}
            className="p-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-900 transition-all shadow-sm group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </motion.button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
              {getSubjectDisplayName(subject)}
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5 font-medium">
              বিস্তারিত পারফরম্যাও্স রিপোর্ট
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
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-500/20 shadow-sm cursor-pointer hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <option value="all">সব সময় (All Time)</option>
            <option value="month">এই মাস (This Month)</option>
            <option value="week">এই সপ্তাহ (This Week)</option>
          </select>

          <motion.button
            whileHover={hoverScale}
            whileTap={tapScale}
            onClick={handleDownload}
            disabled={stats.totalQuestions === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ডাউনলোড</span>
          </motion.button>
        </div>
      </div>

      <motion.div variants={staggerContainer} initial="hidden" animate="show" className="max-w-7xl mx-auto space-y-6">
        {/* KPI CARDS ROW */}
        <div className="grid grid-cols-3 gap-2 md:grid-cols-3 md:gap-6">
          <motion.div variants={fadeInUp} className="bg-white dark:bg-neutral-900 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-center md:items-center gap-2 md:gap-5 transition-all hover:border-red-200 dark:hover:border-red-900 group">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <FileQuestion className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div className="text-center md:text-left min-w-0 w-full">
              <p className="text-[9px] md:text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-tight md:tracking-wide truncate">
                মোট প্রশ্ন
              </p>
              <h3 className="text-base md:text-3xl font-extrabold text-neutral-900 dark:text-white mt-0.5 md:mt-1 truncate">
                {stats.totalQuestions}
              </h3>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-white dark:bg-neutral-900 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-center md:items-center gap-2 md:gap-5 transition-all hover:border-emerald-200 dark:hover:border-emerald-900 group">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <CheckCircle2 className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div className="text-center md:text-left min-w-0 w-full">
              <p className="text-[9px] md:text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-tight md:tracking-wide truncate">
                সঠিকতার হার
              </p>
              <h3 className="text-base md:text-3xl font-extrabold text-neutral-900 dark:text-white mt-0.5 md:mt-1 truncate">
                {stats.accuracy}%
              </h3>
            </div>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-white dark:bg-neutral-900 p-3 md:p-6 rounded-xl md:rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-center md:items-center gap-2 md:gap-5 transition-all hover:border-red-200 dark:hover:border-red-900 group">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm group-hover:scale-110 transition-transform shrink-0">
              <Clock className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <div className="text-center md:text-left min-w-0 w-full">
              <p className="text-[9px] md:text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-tight md:tracking-wide truncate">
                গড় সময় (প্রতি প্রশ্ন)
              </p>
              <h3 className="text-base md:text-3xl font-extrabold text-neutral-900 dark:text-white mt-0.5 md:mt-1 truncate">
                {stats.averageTime}s
              </h3>
            </div>
          </motion.div>
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Accuracy Pie Chart */}
          <motion.div variants={fadeInUp} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="w-full flex justify-between items-center mb-2 z-10">
              <h3 className="font-bold text-lg text-neutral-800 dark:text-white">
                ফলাফল বিশ্লেষণ
              </h3>
            </div>

            {stats.totalQuestions === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-400">
                <BarChart2 className="w-10 h-10 mb-2 opacity-50" />
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
          </motion.div>

          {/* Chapter Performance Bar Chart */}
          <motion.div variants={fadeInUp} className="bg-white dark:bg-neutral-900 p-6 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-bold text-lg text-neutral-800 dark:text-white mb-6">
              অধ্যায়ভিত্তিক দক্ষতা
            </h3>

            {stats.chapterPerformance.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-neutral-400">
                <BarChart2 className="w-10 h-10 mb-2 opacity-50" />
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
                                <span className="font-bold text-emerald-500">
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
                      background={{ fill: '#f1f5f9', radius: 4 }}
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
          </motion.div>
        </div>

        {/* WEAKNESS & TENDENCY SECTION */}
        <motion.div variants={fadeInUp} className="bg-white dark:bg-neutral-900 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-neutral-50/50 dark:bg-neutral-800/30">
            <h3 className="font-bold text-lg text-neutral-800 dark:text-white flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
              </span>
              দুর্বলতা ও ভুলের ধরণ (Weakness Analysis)
            </h3>
          </div>

          <div className="p-6 max-h-[600px] overflow-y-auto custom-scrollbar">
            {weakChapters.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                    <h4 className="font-bold text-red-800 dark:text-red-200 text-sm mb-1 uppercase tracking-wide">
                      সর্বাধিক ভুল (Top Mistake Area)
                    </h4>
                    <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                      {weakChapters[0]?.name &&
                      weakChapters[0]?.name !== 'General'
                        ? weakChapters[0]?.name
                        : 'অজানা টপিক / All'}
                    </p>
                    <p className="text-xs text-red-600 dark:text-red-300 mt-1 font-medium">
                      {weakChapters[0]?.wrong}টি ভুল উত্তর
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20">
                    <h4 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm mb-1 uppercase tracking-wide">
                      পরামর্শ (Recommendation)
                    </h4>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 leading-relaxed">
                      আপনার{' '}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {weakChapters[0]?.name &&
                        weakChapters[0]?.name !== 'General'
                          ? weakChapters[0]?.name
                          : 'এই'}
                      </span>{' '}
                      অধ্যায়ে দুর্বলতা রয়েছে। মূল বইয়ের কনসেপ্টগুলো আবার ঝালিয়ে
                      নাও এবং বেশি করে প্র্যাকটিস করো।
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
                        className="group bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-red-300 dark:hover:border-red-800 transition-colors shadow-sm flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-bold text-neutral-900 dark:text-white text-sm md:text-base truncate">
                              {chapter.name && chapter.name !== 'General'
                                ? chapter.name
                                : 'অজানা টপিক / All'}
                            </h5>
                            <span className="text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md shrink-0">
                              {chapter.wrong} Mistakes
                            </span>
                          </div>

                          <div className="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 to-red-500 rounded-full"
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
                  <Award className="w-8 h-8 text-emerald-500" />
                </div>
                <h4 className="font-bold text-neutral-900 dark:text-white text-lg mb-1">
                  চমৎকার পারফরম্যাও্স!
                </h4>
                <p className="text-neutral-500 dark:text-neutral-400 text-sm max-w-xs mx-auto">
                  নির্বাচিত ফিল্টারে তোমার কোনো ভুল উত্তর পাওয়া যায়নি। অনুশীলন
                  চালিয়ে যাও।
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SubjectReportView;
