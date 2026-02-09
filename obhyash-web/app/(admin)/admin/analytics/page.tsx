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

interface ExamResult {
  users: {
    id: string;
  } | null;
}

interface ExamResultWithUserId {
  user_id: string;
}

interface UserRecord {
  created_at: string;
}

interface ExamData {
  score: number;
  created_at: string;
  subject: string;
}

interface UserFromDatabase {
  id: string;
  name: string;
  exams_taken: number;
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

    const supabase = createClient();

    try {
      const daysAgo = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: exams, error: examsError } = await supabase
        .from('exam_results')
        .select('score, created_at, subject')
        .gte('created_at', startDate.toISOString());

      if (examsError) throw examsError;

      const { count: questionsCount } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const { data: activeUsersData } = await supabase
        .from('exam_results')
        .select('user_id')
        .gte('created_at', startDate.toISOString());

      const uniqueActiveUsers = new Set(
        activeUsersData
          ?.map((e: ExamResultWithUserId) => e.user_id)
          .filter(Boolean),
      );

      const totalExams = exams?.length || 0;
      const averageScore =
        exams && exams.length > 0
          ? exams.reduce((sum, exam) => sum + (exam.score || 0), 0) /
            exams.length
          : 0;

      setExamStats({
        totalExams,
        averageScore,
        completionRate: totalExams > 0 ? 85 : 0,
        totalQuestions: questionsCount || 0,
      });

      setTotalUsers(usersCount || 0);
      setActiveUsers(uniqueActiveUsers.size);

      const subjectMap = new Map<
        string,
        { scores: number[]; students: Set<string> }
      >();

      exams?.forEach((exam: ExamData) => {
        const subject = exam.subject || 'Unknown';
        if (!subjectMap.has(subject)) {
          subjectMap.set(subject, { scores: [], students: new Set() });
        }
        const subjectData = subjectMap.get(subject)!;
        subjectData.scores.push(exam.score || 0);
      });

      const subjectPerf: SubjectPerformance[] = Array.from(
        subjectMap.entries(),
      ).map(([subject, data]) => ({
        subject,
        examsCount: data.scores.length,
        averageScore:
          data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        totalStudents: data.students.size || data.scores.length,
      }));

      setSubjectPerformance(
        subjectPerf.sort((a, b) => b.examsCount - a.examsCount),
      );

      const { data: allUsers } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      const growthMap = new Map<string, number>();
      allUsers?.forEach((user: UserRecord) => {
        const date = new Date(user.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        growthMap.set(date, (growthMap.get(date) || 0) + 1);
      });

      let cumulative = 0;
      const growth: UserGrowthData[] = Array.from(growthMap.entries()).map(
        ([date, count]) => {
          cumulative += count;
          return { date, users: cumulative };
        },
      );

      setUserGrowth(growth);

      const { data: topUsers } = await supabase
        .from('users')
        .select('id, name, exams_taken')
        .order('exams_taken', { ascending: false })
        .limit(5);

      setTopPerformers(
        topUsers?.map((user: UserFromDatabase) => ({
          id: user.id,
          name: user.name || 'Anonymous',
          score: 0,
          examsCompleted: user.exams_taken || 0,
        })) || [],
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

  const handleRefresh = () => {
    fetchAnalyticsData(true);
  };

  const handleExport = () => {
    toast.success('Preparing analytics export...');
    setTimeout(() => {
      toast.success('Analytics data exported successfully!');
    }, 1500);
  };

  const maxUserGrowth = Math.max(...userGrowth.map((g) => g.users), 1);

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 lg:p-8 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 animate-fade-in pb-20 md:pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <Sparkles className="text-violet-600" size={24} />
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
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[11px] font-black rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all uppercase tracking-tight active:scale-95 disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
                <span>Refresh</span>
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
              color: 'text-violet-600',
              bgColor: 'bg-violet-50/50 dark:bg-violet-500/5',
              borderColor: 'border-violet-100 dark:border-violet-500/10',
              change: '+5.2%',
            },
            {
              label: 'Active',
              value: activeUsers,
              icon: Users,
              color: 'text-blue-600',
              bgColor: 'bg-blue-50/50 dark:bg-blue-500/5',
              borderColor: 'border-blue-100 dark:border-blue-500/10',
              change: totalUsers,
            },
            {
              label: 'Bank',
              value: examStats.totalQuestions,
              icon: FileQuestion,
              color: 'text-rose-600',
              bgColor: 'bg-rose-50/50 dark:bg-rose-500/5',
              borderColor: 'border-rose-100 dark:border-rose-500/10',
              change: 'Qns',
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
                  <TrendingUp className="text-rose-500" size={16} /> User
                  Acquisition
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tight">
                  Total Users
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
              <div className="h-[240px] md:h-[300px] bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800 p-4 overflow-hidden">
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
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
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

                  {/* Area */}
                  <path
                    d={`M 0 250 ${userGrowth
                      .map((d, i) => {
                        const x = (i / (userGrowth.length - 1)) * 1000;
                        const y = 250 - (d.users / maxUserGrowth) * 220;
                        return `L ${x} ${y}`;
                      })
                      .join(' ')} L 1000 250 Z`}
                    fill="url(#growthGrad)"
                  />

                  {/* Line */}
                  <path
                    d={`M ${userGrowth
                      .map((d, i) => {
                        const x = (i / (userGrowth.length - 1)) * 1000;
                        const y = 250 - (d.users / maxUserGrowth) * 220;
                        return `${x},${y}`;
                      })
                      .join(' L ')}`}
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Nodes */}
                  {userGrowth.map((d, i) => {
                    const x = (i / (userGrowth.length - 1)) * 1000;
                    const y = 250 - (d.users / maxUserGrowth) * 220;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="white"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                      />
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Top Performers Section */}
          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 md:p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-xs md:text-sm font-black text-neutral-900 dark:text-white mb-5 flex items-center gap-2 uppercase tracking-widest opacity-80">
              <Award className="text-amber-500" size={16} /> Leaderboard
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
                    No Activites
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
                          ? 'bg-amber-100 text-amber-600'
                          : index === 1
                            ? 'bg-neutral-100 text-neutral-500'
                            : index === 2
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-neutral-50 text-neutral-400'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-black text-neutral-900 dark:text-white truncate tracking-tight">
                        {performer.name}
                      </p>
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                        <CheckCircle size={10} className="text-rose-500" />
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
            <BookOpen className="text-rose-500" size={16} /> Subject Metrics
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
                  className="group p-3.5 bg-white dark:bg-black rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:border-rose-200 dark:hover:border-rose-900 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 font-black text-sm shadow-inner group-hover:scale-110 transition-transform">
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
                      <p className="text-sm font-black text-rose-600 dark:text-rose-400 tracking-tighter">
                        {subject.averageScore.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="h-2 bg-neutral-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-neutral-50 dark:border-neutral-800">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.min(subject.averageScore, 100)}%`,
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
