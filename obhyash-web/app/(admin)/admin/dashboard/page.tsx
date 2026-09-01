'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  FileQuestion,
  Activity,
  Radio,
  PlusCircle,
  UploadCloud,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  RefreshCw,
  Crown,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { SystemControlsCard, AppConfig } from '@/components/admin/dashboard/system-controls-card';
import { UserSpotlightSearchBar } from '@/components/admin/dashboard/user-spotlight-modal';
import { LearningTrendsChart } from '@/components/admin/dashboard/learning-trends-chart';
import { ActionAlertsHub } from '@/components/admin/dashboard/action-alerts-hub';

interface DashboardData {
  metrics: {
    totalUsers: number;
    proUsers: number;
    totalQuestions: number;
    pendingQuestions: number;
    totalExams: number;
    todayExams: number;
    yesterdayExams: number;
    examGrowthPercent: number;
    activeLiveExams: number;
    pendingReports: number;
    pendingComplaints: number;
  };
  analytics: {
    topSubjects: Array<{ name: string; count: number }>;
    topChapters: Array<{ name: string; count: number }>;
    hourlyActivity: number[];
    todayTotal: number;
  };
  systemControls: AppConfig;
  lastUpdated?: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchOverview = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    try {
      const res = await fetch(
        `/api/admin/dashboard-overview${forceRefresh ? '?refresh=true' : ''}`,
      );
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard overview:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const metrics = data?.metrics || {
    totalUsers: 0,
    proUsers: 0,
    totalQuestions: 0,
    pendingQuestions: 0,
    totalExams: 0,
    todayExams: 0,
    yesterdayExams: 0,
    examGrowthPercent: 0,
    activeLiveExams: 0,
    pendingReports: 0,
    pendingComplaints: 0,
  };

  const statCards = [
    {
      title: 'মোট নিবন্ধিত শিক্ষার্থী',
      value: metrics.totalUsers,
      subtext: `${metrics.proUsers} জন প্রো/পেইড মেম্বার`,
      icon: Users,
      color: 'emerald',
      href: '/admin/user-management',
      badge: 'Active Students',
    },
    {
      title: 'প্রশ্ন ব্যাংক ভাণ্ডার',
      value: metrics.totalQuestions,
      subtext: `${metrics.pendingQuestions} টি অনুমোদনের অপেক্ষায়`,
      icon: FileQuestion,
      color: 'blue',
      href: '/admin/question-management',
      badge: 'Verified MCQs',
    },
    {
      title: 'আজকের সম্পন্ন পরীক্ষা',
      value: metrics.todayExams,
      subtext: `মোট পরীক্ষা: ${metrics.totalExams.toLocaleString()}`,
      growth: metrics.examGrowthPercent,
      icon: Activity,
      color: 'purple',
      href: '/admin/analytics',
      badge: 'Daily Submissions',
    },
    {
      title: 'লাইভ প্রতিযোগিতা',
      value: metrics.activeLiveExams,
      subtext:
        metrics.activeLiveExams > 0
          ? 'লাইভ সেশন সক্রিয় রয়েছে'
          : 'বর্তমানে কোনো লাইভ নেই',
      icon: Radio,
      color: 'amber',
      href: '/admin/live-exams',
      badge: 'Live Exams',
    },
  ];

  const quickShortcuts = [
    {
      title: 'নতুন প্রশ্ন যোগ করুন',
      desc: 'LaTeX ও ডায়াগ্রাম দিয়ে একক প্রশ্ন তৈরি',
      icon: PlusCircle,
      href: '/admin/questions/new',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'বাল্ক প্রশ্ন আপলোড',
      desc: 'এক ক্লিকে ৩০০০+ প্রশ্ন ও R2 ইমেজ আপলোড',
      icon: UploadCloud,
      href: '/admin/questions/bulk-upload',
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
      {/* ── Top Master Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              সুপার অ্যাডমিন কমান্ড সেন্টার • Master Control
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            ড্যাশবোর্ড ওভারভিউ
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
            অভ্যাস প্ল্যাটফর্মের রিয়েল-টাইম পারফরম্যান্স, শিক্ষার্থী ট্র্যাকিং ও এমার্জেন্সি কন্ট্রোলার
          </p>
        </div>

        {/* Header Right: Instant User Search & Fast Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <UserSpotlightSearchBar />

          <button
            onClick={() => fetchOverview(true)}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-neutral-200 dark:border-zinc-700/60"
            title="Force refresh database cache"
          >
            <RefreshCw
              size={14}
              className={isRefreshing ? 'animate-spin text-emerald-500' : ''}
            />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* ── Action Required Alert Center ── */}
      <ActionAlertsHub
        pendingQuestions={metrics.pendingQuestions}
        pendingReports={metrics.pendingReports}
        pendingComplaints={metrics.pendingComplaints}
        activeLiveExams={metrics.activeLiveExams}
      />

      {/* ── Key Metrics Grid (4 Main Cards) ── */}
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
                <div className="text-3xl font-black text-neutral-900 dark:text-white font-mono flex items-baseline gap-2">
                  {isLoading ? (
                    <div className="h-8 w-20 bg-neutral-200 dark:bg-zinc-800 animate-pulse rounded-lg" />
                  ) : (
                    card.value.toLocaleString()
                  )}
                  {card.growth !== undefined && card.growth !== 0 && (
                    <span
                      className={`text-xs font-bold font-sans flex items-center ${
                        card.growth > 0 ? 'text-emerald-500' : 'text-rose-500'
                      }`}
                    >
                      <TrendingUp size={12} className="mr-0.5" />
                      {card.growth > 0 ? `+${card.growth}%` : `${card.growth}%`}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-neutral-400 dark:text-zinc-500 truncate pr-1">
                    {card.subtext}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 shrink-0">
                    {card.badge}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Master Platform Controller & Live Broadcast ── */}
      {data?.systemControls && (
        <SystemControlsCard
          initialConfig={data.systemControls}
          onUpdate={() => fetchOverview(true)}
        />
      )}

      {/* ── 24h Activity Graph & Top Learning Pulse ── */}
      {data?.analytics && (
        <LearningTrendsChart
          hourlyActivity={data.analytics.hourlyActivity}
          topSubjects={data.analytics.topSubjects}
          topChapters={data.analytics.topChapters}
          todayTotal={data.analytics.todayTotal}
        />
      )}

      {/* ── Quick Action Command Center ── */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
          <Zap size={16} className="text-amber-500" />
          <span>কুইক ম্যানেজমেন্ট শর্টকাট</span>
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
                  <div
                    className={`p-2.5 rounded-xl border ${action.color} shrink-0`}
                  >
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

      {/* ── Management Hub & Cloud Infrastructure Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Directory */}
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
                {metrics.pendingReports} Reports
              </span>
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Platform Health & Cloud Infrastructure */}
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-neutral-900 dark:text-zinc-100 flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>ক্লাউড অবকাঠামো স্থিতি (Infrastructure)</span>
            </h3>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 leading-relaxed">
              Supabase PostgreSQL ডাটাবেজ এবং Cloudflare R2 ইমেজ হোস্টিং সরাসরি সংযুক্ত রয়েছে।
            </p>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-neutral-100 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-zinc-400">
                Supabase DB
              </span>
              <span className="font-bold text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                অনলাইন (Healthy)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-zinc-400">
                Cloudflare R2 Storage
              </span>
              <span className="font-bold text-cyan-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                সক্রিয় (Active)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-zinc-400">
                ক্যাশ মেমোরি
              </span>
              <span className="font-bold text-neutral-800 dark:text-zinc-200">
                45s Edge TTL
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
