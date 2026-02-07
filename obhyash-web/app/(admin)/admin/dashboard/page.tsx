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
        recentUsersResult.data.forEach((user: any) => {
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
        recentExamsResult.data.forEach((exam: any) => {
          activities.push({
            id: exam.id,
            type: 'exam',
            message: `${exam.users?.name || 'A user'} completed an exam`,
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
      <div className="space-y-6 md:space-y-8 animate-fade-in pb-10">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-700 dark:from-white dark:via-neutral-100 dark:to-neutral-300 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Welcome back,{' '}
              <span className="font-semibold text-neutral-900 dark:text-white">
                Admin
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="group flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleExport}
              className="group flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all shadow-sm hover:shadow-md active:scale-95"
            >
              <Download
                size={16}
                className="group-hover:-translate-y-0.5 transition-transform"
              />
              <span>Export</span>
            </button>
            <button
              onClick={() => handleNavigate('question-management')}
              className="group flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-500/30 transition-all hover:shadow-xl hover:shadow-rose-500/40 active:scale-95"
            >
              <Upload
                size={16}
                className="group-hover:-translate-y-0.5 transition-transform"
              />
              <span>Bulk Upload</span>
            </button>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
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

            <div className="space-y-2">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 bg-neutral-100 dark:bg-neutral-700 rounded-xl animate-pulse"
                  ></div>
                ))
              ) : recentActivity.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No recent activity</p>
                </div>
              ) : (
                recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-all cursor-pointer group"
                  >
                    <div
                      className={`p-2.5 rounded-xl ${
                        activity.type === 'user'
                          ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                          : activity.type === 'exam'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-700 dark:group-hover:text-white transition-colors">
                        {activity.message}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {formatTimeAgo(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg">
                <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              Quick Actions
            </h3>

            <div className="space-y-3">
              <button
                onClick={() => handleNavigate('question-management')}
                className="w-full text-left px-4 py-4 rounded-xl bg-white dark:bg-neutral-700 hover:bg-rose-50 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600 hover:border-rose-300 dark:hover:border-rose-500 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                    Manage Questions
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Add, edit, or delete questions
                  </span>
                </div>
                <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                  <FileQuestion size={18} />
                </div>
              </button>

              <button
                onClick={() => handleNavigate('user-management')}
                className="w-full text-left px-4 py-4 rounded-xl bg-white dark:bg-neutral-800 hover:bg-rose-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 hover:border-rose-300 dark:hover:border-rose-500 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors">
                    Manage Users
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    View and manage user accounts
                  </span>
                </div>
                <div className="p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                  <Users size={18} />
                </div>
              </button>

              <button
                onClick={() => handleNavigate('reports')}
                className="w-full text-left px-4 py-4 rounded-xl bg-white dark:bg-neutral-700 hover:bg-amber-50 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600 hover:border-amber-300 dark:hover:border-amber-500 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                    Review Reports
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {dashboardStats?.pendingReports || 0} pending reports
                  </span>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Flag size={18} />
                </div>
              </button>

              <button
                onClick={() => handleNavigate('analytics')}
                className="w-full text-left px-4 py-4 rounded-xl bg-white dark:bg-neutral-700 hover:bg-violet-50 dark:hover:bg-neutral-600 border border-neutral-200 dark:border-neutral-600 hover:border-violet-300 dark:hover:border-violet-500 transition-all flex items-center justify-between group shadow-sm hover:shadow-md"
              >
                <div>
                  <span className="block text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                    View Analytics
                  </span>
                  <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Performance insights
                  </span>
                </div>
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                  <BarChart3 size={18} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
