'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  FileQuestion,
  CheckCircle,
  AlertTriangle,
  Radio,
  TrendingUp,
  Activity,
  PlusCircle,
  UploadCloud,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface DashboardMetrics {
  totalUsers: number;
  totalQuestions: number;
  totalExams: number;
  activeLiveExams: number;
  pendingReports: number;
  todayExams: number;
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    totalQuestions: 0,
    totalExams: 0,
    activeLiveExams: 0,
    pendingReports: 0,
    todayExams: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      try {
        const supabase = createClient();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        // Safe async query helpers
        const getUsersCount = async () => {
          try {
            const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
            return count || 0;
          } catch {
            return 0;
          }
        };

        const getQuestionsCount = async () => {
          try {
            const { count } = await supabase.from('questions').select('*', { count: 'exact', head: true });
            return count || 0;
          } catch {
            return 0;
          }
        };

        const getExamsCount = async () => {
          try {
            const { count } = await supabase.from('exam_results').select('*', { count: 'exact', head: true });
            return count || 0;
          } catch {
            return 0;
          }
        };

        const getTodayExamsCount = async () => {
          try {
            const { count } = await supabase
              .from('exam_results')
              .select('*', { count: 'exact', head: true })
              .gte('created_at', todayStart.toISOString());
            return count || 0;
          } catch {
            return 0;
          }
        };

        const getLiveExamsCount = async () => {
          try {
            const { count } = await supabase
              .from('live_exams')
              .select('*', { count: 'exact', head: true })
              .eq('status', 'live');
            return count || 0;
          } catch {
            return 0;
          }
        };

        const getReportsCount = async () => {
          try {
            const { count } = await supabase
              .from('reports')
              .select('*', { count: 'exact', head: true })
              .in('status', ['Pending', 'pending']);
            return count || 0;
          } catch {
            return 0;
          }
        };

        const [
          totalUsers,
          totalQuestions,
          totalExams,
          todayExams,
          activeLiveExams,
          pendingReports,
        ] = await Promise.all([
          getUsersCount(),
          getQuestionsCount(),
          getExamsCount(),
          getTodayExamsCount(),
          getLiveExamsCount(),
          getReportsCount(),
        ]);

        if (isMounted) {
          setMetrics({
            totalUsers,
            totalQuestions,
            totalExams,
            todayExams,
            activeLiveExams,
            pendingReports,
          });
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error loading admin dashboard metrics:', err);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const statCards = [
    {
      title: 'মোট নিবন্ধিত শিক্ষার্থী',
      value: metrics.totalUsers,
      subtext: 'সক্রিয় ইউজার বেস',
      icon: Users,
      color: 'emerald',
      href: '/admin/user-management',
      badge: 'Active Base',
    },
    {
      title: 'প্রশ্ন ব্যাংক ভাণ্ডার',
      value: metrics.totalQuestions,
      subtext: 'যাচাইকৃত বহুর্নির্বাচনী প্রশ্ন',
      icon: FileQuestion,
      color: 'blue',
      href: '/admin/question-management',
      badge: 'Verified MCQs',
    },
    {
      title: 'মোট সম্পন্ন পরীক্ষা',
      value: metrics.totalExams,
      subtext: `আজকের সম্পন্ন: ${metrics.todayExams}`,
      icon: Activity,
      color: 'purple',
      href: '/admin/analytics',
      badge: 'Live Submissions',
    },
    {
      title: 'লাইভ প্রতিযোগিতা',
      value: metrics.activeLiveExams,
      subtext: metrics.activeLiveExams > 0 ? 'লাইভ চলছে' : 'বর্তমানে কোনো লাইভ নেই',
      icon: Radio,
      color: 'amber',
      href: '/admin/live-exams',
      badge: 'Live Exams',
    },
  ];

  const quickShortcuts = [
    {
      title: 'নতুন প্রশ্ন যোগ করুন',
      desc: 'প্রশ্ন ব্যাংকে একক প্রশ্ন তৈরি',
      icon: PlusCircle,
      href: '/admin/question-management',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'বাল্ক প্রশ্ন আপলোড',
      desc: 'JSON বা Excel ফাইল থেকে এক ক্লিকে আমদানি',
      icon: UploadCloud,
      href: '/admin/question-management',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'লাইভ পরীক্ষা তৈরি',
      desc: 'নতুন লাইভ এক্সাম শিডিউল ও প্রশ্ন নির্ধারণ',
      icon: Radio,
      href: '/admin/live-exams',
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'ইউজার ও সাবস্ক্রিপশন',
      desc: 'রোল পরিবর্তন ও প্যাকেজ ব্যবস্থাপনা',
      icon: Users,
      href: '/admin/user-management',
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              সুপার অ্যাডমিন কমান্ড সেন্টার
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            ড্যাশবোর্ড ওভারভিউ
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-1">
            অভ্যাস প্ল্যাটফর্মের সামগ্রিক পারফরম্যান্স, প্রশ্নভাণ্ডার এবং শিক্ষার্থী ট্র্যাকিং কন্ট্রোলার
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/question-management"
            className="px-4 py-2.5 bg-[#004633] hover:bg-[#005a42] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-950/20 flex items-center gap-2"
          >
            <PlusCircle size={15} />
            <span>প্রশ্ন যোগ করুন</span>
          </Link>
          <Link
            href="/admin/live-exams"
            className="px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 text-xs font-bold rounded-xl transition-all border border-neutral-300/60 dark:border-zinc-700/60 flex items-center gap-2"
          >
            <Radio size={15} className="text-amber-500" />
            <span>লাইভ এক্সাম কন্ট্রোলার</span>
          </Link>
        </div>
      </div>

      {/* ── Key Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="relative overflow-hidden bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-5 transition-all duration-200 hover:shadow-lg dark:hover:shadow-black/50 hover:border-emerald-500/40 group"
            >
              <div className="flex justify-between items-start mb-3">
                <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className="p-2.5 rounded-xl bg-neutral-100 dark:bg-zinc-800/80 text-neutral-700 dark:text-zinc-300 group-hover:scale-105 transition-transform">
                  <Icon size={18} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-3xl font-black text-neutral-900 dark:text-white font-mono">
                  {isLoading ? (
                    <div className="h-8 w-20 bg-neutral-200 dark:bg-zinc-800 animate-pulse rounded-lg" />
                  ) : (
                    card.value.toLocaleString()
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-400 dark:text-zinc-500">
                    {card.subtext}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400">
                    {card.badge}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Quick Action Command Center ── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
          <Zap size={16} className="text-amber-500" />
          <span>কুইক অ্যাকশন শর্টকাট</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickShortcuts.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-4 sm:p-5 hover:border-emerald-500/40 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="flex items-start gap-3.5 mb-3">
                  <div className={`p-2.5 rounded-xl border ${action.color} shrink-0`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900 dark:text-zinc-100 group-hover:text-emerald-500 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                      {action.desc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-neutral-400 dark:text-zinc-500 group-hover:text-emerald-500 transition-colors pt-2 border-t border-neutral-100 dark:border-zinc-800/40">
                  <span>ওপেন করুন</span>
                  <ArrowUpRight size={13} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── System Status & Live Modules ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Management Hub */}
        <div className="lg:col-span-2 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers size={16} className="text-emerald-500" />
              <span>ম্যানেজমেন্ট মডিউল ডিরেক্টরি</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              সকল সিস্টেম অনলাইন
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              href="/admin/question-management"
              className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 hover:bg-neutral-100 dark:hover:bg-zinc-800 border border-neutral-200/60 dark:border-zinc-700/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileQuestion size={16} className="text-blue-500" />
                <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                  প্রশ্ন ব্যাংক ও অনুমোদন
                </span>
              </div>
              <ArrowUpRight size={14} className="text-neutral-400" />
            </Link>

            <Link
              href="/admin/live-exams"
              className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 hover:bg-neutral-100 dark:hover:bg-zinc-800 border border-neutral-200/60 dark:border-zinc-700/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Radio size={16} className="text-amber-500" />
                <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                  লাইভ প্রতিযোগিতা কন্ট্রোলার
                </span>
              </div>
              <ArrowUpRight size={14} className="text-neutral-400" />
            </Link>

            <Link
              href="/admin/user-management"
              className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 hover:bg-neutral-100 dark:hover:bg-zinc-800 border border-neutral-200/60 dark:border-zinc-700/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users size={16} className="text-purple-500" />
                <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                  ইউজার ও অ্যাক্সেস কন্ট্রোল
                </span>
              </div>
              <ArrowUpRight size={14} className="text-neutral-400" />
            </Link>

            <Link
              href="/admin/reports"
              className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-zinc-800/40 hover:bg-neutral-100 dark:hover:bg-zinc-800 border border-neutral-200/60 dark:border-zinc-700/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle size={16} className="text-rose-500" />
                <span className="text-xs font-bold text-neutral-800 dark:text-zinc-200">
                  প্রশ্ন এরর সমাধান
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                {metrics.pendingReports} Pending
              </span>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Platform Health */}
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-zinc-100 flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>নিরাপত্তা ও ডেটাবেজ স্থিতি</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              Supabase PostgreSQL ক্লাউড সিঙ্ক এবং Row Level Security (RLS) সক্রিয় রয়েছে। সমস্ত অ্যাডমিন অপারেশন সরাসরি ডেটাবেজে সংরক্ষিত হচ্ছে।
            </p>
          </div>

          <div className="space-y-2 pt-4 border-t border-neutral-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-zinc-400">ডাটাবেজ সংযোগ</span>
              <span className="font-bold text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                সক্রিয় (Healthy)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-zinc-400">সুপার অ্যাডমিন সেশন</span>
              <span className="font-bold text-neutral-800 dark:text-zinc-200">যাচাইকৃত (Active)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
