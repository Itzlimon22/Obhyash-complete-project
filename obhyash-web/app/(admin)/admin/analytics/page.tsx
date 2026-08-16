'use client';

import React, { useState, useEffect } from 'react';
import {
  Download,
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  FileQuestion,
  CheckCircle,
  Clock,
  RefreshCw,
  Award,
  BookOpen,
  Brain,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface ExamStats {
  totalExams: number;
  averageScore: number;
  completionRate: number;
  totalQuestions: number;
}

interface SubjectPerformance {
  subject: string;
  examsCount: number;
  averageScore: number;
  totalStudents: number;
}

interface UserGrowthData {
  date: string;
  users: number;
}

interface TopPerformer {
  id: string;
  name: string;
  score: number;
  examsCompleted: number;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [examStats, setExamStats] = useState<ExamStats>({
    totalExams: 0,
    averageScore: 0,
    completionRate: 0,
    totalQuestions: 0,
  });

  const [subjectPerformance, setSubjectPerformance] = useState<
    SubjectPerformance[]
  >([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // 1. Fetch from secure server-side admin analytics endpoint (bypasses RLS limits)
      const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const {
            examStats: stats,
            totalUsers: totalU,
            activeUsers: activeU,
            userGrowth: growth,
            subjectPerformance: subPerf,
            topPerformers: topP,
          } = json.data;

          setExamStats(stats || { totalExams: 0, averageScore: 0, completionRate: 0, totalQuestions: 0 });
          setTotalUsers(totalU || 0);
          setActiveUsers(activeU || 0);
          setUserGrowth(growth || []);
          setSubjectPerformance(subPerf || []);
          setTopPerformers(topP || []);

          if (showToast) {
            toast.success('Analytics refreshed successfully');
          }
          return;
        }
      }

      // 2. Client-side fallback if API is unreachable
      const supabase = createClient();
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const [examsRes, questionsRes, usersRes, topUsersRes] = await Promise.all([
        supabase
          .from('exam_results')
          .select('score, created_at, subject, user_id')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('questions')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('users')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('users')
          .select('id, name, exams_taken')
          .order('exams_taken', { ascending: false })
          .limit(5),
      ]);

      const exams = examsRes.data || [];
      const totalExams = exams.length;
      const averageScore =
        exams.length > 0
          ? exams.reduce((sum, e) => sum + (e.score || 0), 0) / exams.length
          : 0;

      const uniqueActiveUsers = new Set(
        exams.map((e) => e.user_id).filter(Boolean),
      );

      setExamStats({
        totalExams,
        averageScore,
        completionRate: totalExams > 0 ? 85 : 0,
        totalQuestions: questionsRes.count || 0,
      });

      setTotalUsers(usersRes.count || 0);
      setActiveUsers(uniqueActiveUsers.size);

      setTopPerformers(
        (topUsersRes.data || []).map((u) => ({
          id: u.id,
          name: u.name || 'Anonymous',
          score: 0,
          examsCompleted: u.exams_taken || 0,
        })),
      );

      if (showToast) {
        toast.success('Analytics refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    try {
      toast.info('Generating analytics export...');

      const rows: string[][] = [];
      rows.push(['Metric', 'Value']);
      rows.push(['Total Users', totalUsers.toString()]);
      rows.push(['Active Users (' + timeRange + ')', activeUsers.toString()]);
      rows.push(['Total Questions in Bank', examStats.totalQuestions.toString()]);
      rows.push(['Total Exams Completed', examStats.totalExams.toString()]);
      rows.push(['Average Score', `${examStats.averageScore.toFixed(2)}%`]);
      rows.push([]);

      rows.push(['Subject', 'Exams Count', 'Average Score (%)', 'Students']);
      subjectPerformance.forEach((s) => {
        rows.push([
          `"${s.subject.replace(/"/g, '""')}"`,
          s.examsCount.toString(),
          s.averageScore.toFixed(2),
          s.totalStudents.toString(),
        ]);
      });
      rows.push([]);

      rows.push(['Leaderboard Rank', 'Student Name', 'Exams Completed']);
      topPerformers.forEach((p, idx) => {
        rows.push([
          (idx + 1).toString(),
          `"${p.name.replace(/"/g, '""')}"`,
          p.examsCompleted.toString(),
        ]);
      });

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        rows.map((e) => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `obhyash_analytics_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Analytics exported to CSV successfully!');
    } catch (e) {
      console.error('Export error:', e);
      toast.error('Failed to export analytics');
    }
  };

  const maxUserGrowth = Math.max(...userGrowth.map((g) => g.users), 1);
  const minUserGrowth = Math.min(...userGrowth.map((g) => g.users), 0);

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 lg:p-8 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 animate-fade-in pb-20 md:pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <Sparkles className="text-emerald-600" size={24} />
              Analytics
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px] md:text-sm font-medium">
              Performance insights & platform metrics
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-1 shadow-sm">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`flex-1 sm:flex-none px-3 py-1.5 text-[10px] md:text-xs font-black rounded-lg transition-all uppercase tracking-tight ${
                    timeRange === range
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm border border-neutral-200 dark:border-neutral-700'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {range === '7d' ? '7D' : range === '30d' ? '30D' : '90D'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchAnalyticsData(true)}
                disabled={isRefreshing}
                className="p-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                title="Refresh Data"
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={handleExport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-black text-[11px] font-black rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-tight"
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            {
              label: 'Exams',
              value: examStats.totalExams,
              icon: CheckCircle,
              color: 'text-emerald-600',
              bgColor: 'bg-emerald-50/50 dark:bg-emerald-500/5',
              borderColor: 'border-emerald-100 dark:border-emerald-500/10',
              change: '+12%',
            },
            {
              label: 'Avg Score',
              value: `${examStats.averageScore.toFixed(1)}%`,
              icon: Target,
              color: 'text-emerald-600',
              bgColor: 'bg-emerald-50/50 dark:bg-emerald-500/5',
              borderColor: 'border-emerald-100 dark:border-emerald-500/10',
              change: '+5.2%',
            },
            {
              label: 'Active',
              value: activeUsers,
              icon: Users,
              color: 'text-emerald-600',
              bgColor: 'bg-emerald-50/50 dark:bg-emerald-500/5',
              borderColor: 'border-emerald-100 dark:border-emerald-500/10',
              change: `${totalUsers} Users`,
            },
            {
              label: 'Bank',
              value: examStats.totalQuestions.toLocaleString(),
              icon: FileQuestion,
              color: 'text-blue-600 dark:text-blue-400',
              bgColor: 'bg-blue-50/50 dark:bg-blue-500/5',
              borderColor: 'border-blue-100 dark:border-blue-500/10',
              change: 'MCQs',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`${stat.bgColor} p-3.5 md:p-5 rounded-2xl border ${stat.borderColor} shadow-sm transition-all active:scale-[0.98] group relative overflow-hidden`}
            >
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2.5 md:mb-4">
                  <div
                    className={`p-2 rounded-lg bg-white dark:bg-neutral-900 ${stat.color} shadow-sm border border-neutral-100 dark:border-neutral-800`}
                  >
                    <stat.icon size={18} strokeWidth={2.5} />
                  </div>
                  <span className="text-[9px] font-black text-neutral-400 bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded-md shadow-sm border border-neutral-100 dark:border-neutral-800 uppercase tracking-tight">
                    {stat.change}
                  </span>
                </div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-0.5 opacity-70">
                  {stat.label}
                </p>
                <p className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white leading-none tracking-tight">
                  {isLoading ? '...' : stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Main Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* User Growth Chart */}
          <div className="lg:col-span-2 bg-neutral-50 dark:bg-neutral-900 p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h3 className="text-xs md:text-sm font-black text-neutral-900 dark:text-white uppercase tracking-widest flex items-center gap-2 opacity-80">
                  <TrendingUp className="text-red-500" size={16} /> User Acquisition
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tight">
                  {totalUsers} Total Users
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="h-[240px] md:h-[300px] flex items-center justify-center bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800">
                <RefreshCw className="w-6 h-6 animate-spin text-neutral-400" />
              </div>
            ) : userGrowth.length === 0 ? (
              <div className="h-[240px] md:h-[300px] flex flex-col items-center justify-center bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800">
                <Brain className="w-12 h-12 text-neutral-200 dark:text-neutral-700 mb-2" />
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Insufficient Data
                </p>
              </div>
            ) : (
              <div className="h-[240px] md:h-[300px] bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800 p-4 flex flex-col justify-between overflow-hidden">
                <div className="flex-1 relative w-full h-[85%]">
                  <svg
                    viewBox="0 0 1000 250"
                    className="w-full h-full"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient
                        id="growthGrad"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid Lines */}
                    {[0, 1, 2, 3, 4].map((i) => (
                      <line
                        key={i}
                        x1="0"
                        y1={i * 62.5}
                        x2="1000"
                        y2={i * 62.5}
                        className="stroke-neutral-100 dark:stroke-neutral-900"
                        strokeWidth="1"
                        strokeDasharray="4,4"
                      />
                    ))}

                    {/* Area Fill */}
                    {userGrowth.length > 0 && (() => {
                      const count = userGrowth.length;
                      const getX = (i: number) =>
                        count <= 1 ? 500 : (i / (count - 1)) * 1000;
                      const getY = (val: number) =>
                        250 - (val / (maxUserGrowth || 1)) * 200 - 20;

                      const points = userGrowth.map((d, i) => `${getX(i)} ${getY(d.users)}`);
                      const pathData = `M 0 250 L 0 ${getY(userGrowth[0].users)} ${points
                        .map((p) => `L ${p}`)
                        .join(' ')} L 1000 250 Z`;

                      const lineData = points.join(' L ');

                      return (
                        <>
                          <path d={pathData} fill="url(#growthGrad)" />
                          <path
                            d={`M ${lineData}`}
                            fill="none"
                            stroke="#f43f5e"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {userGrowth.map((d, i) => (
                            <circle
                              key={i}
                              cx={getX(i)}
                              cy={getY(d.users)}
                              r="4.5"
                              fill="white"
                              stroke="#f43f5e"
                              strokeWidth="3"
                            />
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Date Labels below chart */}
                <div className="flex justify-between text-[10px] font-black text-neutral-400 uppercase tracking-widest pt-2 border-t border-neutral-100 dark:border-neutral-900 px-2">
                  <span>{userGrowth[0]?.date || 'Start'}</span>
                  {userGrowth.length > 2 && (
                    <span>{userGrowth[Math.floor(userGrowth.length / 2)]?.date}</span>
                  )}
                  <span>{userGrowth[userGrowth.length - 1]?.date || 'Today'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Top Performers Section */}
          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-xs md:text-sm font-black text-neutral-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-widest opacity-80">
              <Award className="text-red-500" size={16} /> Leaderboard
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800 animate-pulse"
                  ></div>
                ))
              ) : topPerformers.length === 0 ? (
                <div className="col-span-full py-10 flex flex-col items-center justify-center bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <Zap className="text-neutral-200 dark:text-neutral-700 mb-2" />
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                    No Activities
                  </p>
                </div>
              ) : (
                topPerformers.map((performer, index) => (
                  <div
                    key={performer.id}
                    className="flex items-center gap-3 p-2.5 bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm active:scale-[0.98] transition-all group"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-xs shadow-sm ${
                        index === 0
                          ? 'bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                          : index === 1
                            ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                            : index === 2
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                              : 'bg-neutral-50 text-neutral-400 dark:bg-neutral-900'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-neutral-900 dark:text-white truncate tracking-tight">
                        {performer.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                        <CheckCircle size={10} className="text-red-500" />
                        {performer.examsCompleted} EXAMS
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Subject Performance */}
        <div className="bg-neutral-50 dark:bg-neutral-900 p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <h3 className="text-xs md:text-sm font-black text-neutral-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-widest opacity-80">
            <BookOpen className="text-red-500" size={16} /> Subject Metrics
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800 animate-pulse"
                ></div>
              ))}
            </div>
          ) : subjectPerformance.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800">
              <Brain className="w-10 h-10 mx-auto mb-2 text-neutral-200 dark:text-neutral-700" />
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                No active subjects
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {subjectPerformance.map((subject, index) => (
                <div
                  key={index}
                  className="group p-3.5 bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-red-200 dark:hover:border-red-900 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-600 font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
                        {subject.subject.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-black text-neutral-900 dark:text-white truncate tracking-tight">
                          {subject.subject}
                        </p>
                        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                          {subject.examsCount} EXAMS
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-red-600 dark:text-red-400 tracking-tighter">
                        {subject.averageScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-50 dark:border-neutral-800">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(Math.max(subject.averageScore, 5), 100)}%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[9px] font-black text-neutral-400 uppercase tracking-tighter opacity-70">
                      <span className="flex items-center gap-1">
                        <Users size={10} /> {subject.totalStudents} STUDENTS
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
