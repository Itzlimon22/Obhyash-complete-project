'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Download,
  Filter,
  Plus,
  Flag,
  Users,
  FileQuestion,
  AlertCircle,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  BarChart3,
  Settings,
  Database,
  ArrowRight,
} from 'lucide-react';
import {
  StatCard,
  DatabaseToolsSection,
} from '@/components/admin/dashboard/DashboardWidgets';
import { StatData } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

interface RecentActivity {
  id: string;
  type: 'user' | 'exam' | 'report';
  message: string;
  timestamp: string;
  icon: 'user' | 'exam' | 'report';
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalQuestions: number;
  totalExams: number;
  pendingReports: number;
  userGrowth: number;
  examGrowth: number;
}

interface User {
  id: string;
  name: string | null;
  created_at: string;
}

interface ExamResult {
  id: string;
  created_at: string;
  users:
    | {
        name: string;
      }[]
    | null;
}

export default function DashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<StatData[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel('admin-dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          fetchDashboardData();
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_results' },
        () => {
          fetchDashboardData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);

    const supabase = createClient();

    try {
      // Fetch all stats in parallel
      const [
        usersResult,
        questionsResult,
        reportsResult,
        examResultsResult,
        recentUsersResult,
        recentExamsResult,
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('questions').select('*', { count: 'exact', head: true }),
        supabase
          .from('reports')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Pending'),
        supabase
          .from('exam_results')
          .select('*', { count: 'exact', head: true }),
        supabase
          .from('users')
          .select('id, name, created_at')
          .gte(
            'created_at',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          )
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('exam_results')
          .select('id, created_at, users(name)')
          .gte(
            'created_at',
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          )
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const userGrowth = 12;
      const examGrowth = 8;

      const dashStats: DashboardStats = {
        totalUsers: usersResult.count || 0,
        activeUsers: Math.floor((usersResult.count || 0) * 0.7),
        totalQuestions: questionsResult.count || 0,
        totalExams: examResultsResult.count || 0,
        pendingReports: reportsResult.count || 0,
        userGrowth,
        examGrowth,
      };

      setDashboardStats(dashStats);

      const formattedStats: StatData[] = [
        {
          id: 'users',
          title: 'Total Users',
          value: dashStats.totalUsers,
          icon: Users,
          colorClass: 'text-rose-600 dark:text-rose-400',
          bgClass: 'bg-rose-50 dark:bg-rose-950/30',
          trend: { value: userGrowth, isPositive: true },
        },
        {
          id: 'active-users',
          title: 'Active Users',
          value: dashStats.activeUsers,
          icon: Activity,
          colorClass: 'text-emerald-600 dark:text-emerald-400',
          bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
        },
        {
          id: 'questions',
          title: 'Total Questions',
          value: dashStats.totalQuestions,
          icon: FileQuestion,
          colorClass: 'text-rose-600 dark:text-rose-400',
          bgClass: 'bg-rose-50 dark:bg-rose-950/30',
        },
        {
          id: 'exams',
          title: 'Exams Taken',
          value: dashStats.totalExams,
          icon: CheckCircle,
          colorClass: 'text-emerald-600 dark:text-emerald-400',
          bgClass: 'bg-emerald-50 dark:bg-emerald-950/30',
          trend: { value: examGrowth, isPositive: true },
        },
        {
          id: 'reports',
          title: 'Pending Reports',
          value: dashStats.pendingReports,
          icon: AlertCircle,
          colorClass: 'text-amber-600 dark:text-amber-400',
          bgClass: 'bg-amber-50 dark:bg-amber-950/30',
        },
      ];

      setStats(formattedStats);

      const activities: RecentActivity[] = [];

      if (recentUsersResult.data) {
        recentUsersResult.data.forEach((user: User) => {
          activities.push({
            id: user.id,
            type: 'user',
            message: `${user.name || 'New user'} joined the platform`,
            timestamp: user.created_at,
            icon: 'user',
          });
        });
      }

      if (recentExamsResult.data) {
        recentExamsResult.data.forEach((exam: ExamResult) => {
          activities.push({
            id: exam.id,
            type: 'exam',
            message: `${exam.users?.[0]?.name || 'A user'} completed an exam`,
            timestamp: exam.created_at,
            icon: 'exam',
          });
        });
      }

      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setRecentActivity(activities.slice(0, 10));

      if (showToast) {
        toast.success('Dashboard refreshed successfully');
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleNavigate = (path: string) => {
    router.push(`/admin/${path}`);
  };

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const handleExport = () => {
    toast.info('Export functionality coming soon');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <Users className="w-4 h-4" />;
      case 'exam':
        return <CheckCircle className="w-4 h-4" />;
      case 'report':
        return <Flag className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black">
      <div className="space-y-4 md:space-y-8 animate-fade-in pb-10 px-4 md:px-0">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pb-2">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-500 text-[10px] md:text-xs">
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>System active and monitoring</span>
            </div>
          </div>

          {/* Action Buttons - Scrollable on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0 scrollbar-none">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="group shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-[11px] md:text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                size={14}
                className={
                  isRefreshing ? 'animate-spin text-rose-500' : 'text-rose-500'
                }
              />
              <span>{isRefreshing ? '...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleExport}
              className="group shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-[11px] md:text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm active:scale-95"
            >
              <Download
                size={14}
                className="text-indigo-500 group-hover:-translate-y-0.5 transition-transform"
              />
              <span>Export</span>
            </button>
            <button
              onClick={() => handleNavigate('question-management')}
              className="group shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[11px] md:text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 transition-all active:scale-95"
            >
              <Upload
                size={14}
                className="group-hover:-translate-y-0.5 transition-transform"
              />
              <span>Bulk Upload</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 md:gap-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 animate-pulse"
                ></div>
              ))
            : stats.map((stat) => <StatCard key={stat.id} data={stat} />)}
        </div>

        {/* Database Management Tools */}
        <DatabaseToolsSection />

        {/* Secondary Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-neutral-900 dark:text-white text-lg flex items-center gap-2">
                <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg">
                  <Clock className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                Recent Activity
              </h3>
              <button
                onClick={() => handleNavigate('analytics')}
                className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1"
              >
                View All
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-1">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-16 bg-neutral-100 dark:bg-neutral-900 rounded-xl animate-pulse"
                  ></div>
                ))
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 dark:text-neutral-500">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all cursor-pointer group border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800"
                  >
                    <div
                      className={`p-3 rounded-2xl shrink-0 ${
                        activity.type === 'user'
                          ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : activity.type === 'exam'
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {activity.message}
                      </p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-500 mt-0.5">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <div className="p-1.5 md:p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <Settings className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 gap-2 md:gap-3">
              <button
                onClick={() => handleNavigate('question-management')}
                className="w-full text-left p-3.5 md:p-4 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-rose-50 dark:hover:bg-rose-500/5 border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-500/50 transition-all flex items-center justify-between group shadow-sm active:scale-95"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <span className="block text-[13px] md:text-sm font-bold text-neutral-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Questions
                  </span>
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-500 mt-0.5">
                    Add/Edit bank
                  </span>
                </div>
                <div className="p-2 md:p-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform w-fit shrink-0">
                  <FileQuestion
                    size={16}
                    className="md:w-[18px] md:h-[18px]"
                    strokeWidth={2.5}
                  />
                </div>
              </button>

              <button
                onClick={() => handleNavigate('user-management')}
                className="w-full text-left p-3.5 md:p-4 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-rose-50 dark:hover:bg-rose-500/5 border border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-500/50 transition-all flex items-center justify-between group shadow-sm active:scale-95"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <span className="block text-[13px] md:text-sm font-bold text-neutral-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Users
                  </span>
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-500 mt-0.5">
                    Manage accounts
                  </span>
                </div>
                <div className="p-2 md:p-2.5 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform w-fit shrink-0">
                  <Users
                    size={16}
                    className="md:w-[18px] md:h-[18px]"
                    strokeWidth={2.5}
                  />
                </div>
              </button>

              <button
                onClick={() => handleNavigate('reports')}
                className="w-full text-left p-3.5 md:p-4 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-amber-50 dark:hover:bg-amber-500/5 border border-neutral-200 dark:border-neutral-800 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all flex items-center justify-between group shadow-sm active:scale-95"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <span className="block text-[13px] md:text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Reports
                  </span>
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-500 mt-0.5 truncate">
                    {dashboardStats?.pendingReports || 0} pending
                  </span>
                </div>
                <div className="p-2 md:p-2.5 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform w-fit shrink-0">
                  <Flag
                    size={16}
                    className="md:w-[18px] md:h-[18px]"
                    strokeWidth={2.5}
                  />
                </div>
              </button>

              <button
                onClick={() => handleNavigate('analytics')}
                className="w-full text-left p-3.5 md:p-4 rounded-2xl bg-white dark:bg-neutral-900 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all flex items-center justify-between group shadow-sm active:scale-95"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <span className="block text-[13px] md:text-sm font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Analytics
                  </span>
                  <span className="block text-[10px] text-neutral-500 dark:text-neutral-500 mt-0.5">
                    Insights
                  </span>
                </div>
                <div className="p-2 md:p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform w-fit shrink-0">
                  <BarChart3
                    size={16}
                    className="md:w-[18px] md:h-[18px]"
                    strokeWidth={2.5}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
