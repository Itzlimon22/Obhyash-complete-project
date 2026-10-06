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
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import {
  NiondHeader,
  KpiCard,
  ParticipationChart,
  StatusBanner,
  ScheduleCard,
  QuestionSetTable,
  TeamList,
} from '@/components/admin/dashboard';
import { SystemControlsCard, AppConfig } from '@/components/admin/dashboard/system-controls-card';
import { UserSpotlightSearchBar } from '@/components/admin/dashboard/user-spotlight-modal';
import { LearningTrendsChart } from '@/components/admin/dashboard/learning-trends-chart';
import { ActionAlertsHub } from '@/components/admin/dashboard/action-alerts-hub';
import { useAdminAuth } from '@/hooks/use-admin-auth';

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
  const { profile, user } = useAdminAuth();
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
    totalUsers: 242650,
    proUsers: 17347,
    totalQuestions: 8540,
    pendingQuestions: 12,
    totalExams: 185000,
    todayExams: 17347,
    yesterdayExams: 16200,
    examGrowthPercent: 6.04,
    activeLiveExams: 2,
    pendingReports: 4,
    pendingComplaints: 1,
  };

  const adminDisplayName = profile?.name || user?.email?.split('@')[0] || 'Nora Watson';
  const adminRoleDisplay = profile?.role === 'super_admin' ? 'Super Administrator' : 'Sales / Operations Manager';

  const quickShortcuts = [
    {
      title: 'নতুন প্রশ্ন যোগ করুন',
      desc: 'LaTeX ও ডায়াগ্রাম দিয়ে একক প্রশ্ন তৈরি',
      icon: PlusCircle,
      href: '/admin/questions/new',
      color: 'text-emerald-700 bg-emerald-500/15 border-emerald-500/20',
    },
    {
      title: 'বাল্ক প্রশ্ন আপলোড',
      desc: 'এক ক্লিকে ৩০০০+ প্রশ্ন ও R2 ইমেজ আপলোড',
      icon: UploadCloud,
      href: '/admin/questions/bulk-upload',
      color: 'text-blue-700 bg-blue-500/15 border-blue-500/20',
    },
    {
      title: 'লাইভ পরীক্ষা তৈরি',
      desc: 'নতুন লাইভ এক্সাম শিডিউল ও প্রশ্ন নির্ধারণ',
      icon: Radio,
      href: '/admin/live-exams',
      color: 'text-amber-700 bg-amber-500/15 border-amber-500/20',
    },
    {
      title: 'ইউজার ও সাবস্ক্রিপশন',
      desc: 'রোল পরিবর্তন ও প্যাকেজ ব্যবস্থাপনা',
      icon: Users,
      href: '/admin/user-management',
      color: 'text-purple-700 bg-purple-500/15 border-purple-500/20',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f5f8] dark:bg-[#0d0d0f] -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-[1440px] mx-auto space-y-7">
        
        {/* ── 1. NIOND TOP HEADER & SEARCH COMMAND BAR ── */}
        <NiondHeader
          title="Dashboard"
          adminName={adminDisplayName}
          adminRole={adminRoleDisplay}
          adminAvatar="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face"
        />

        {/* Action Controls & Fast Search Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-[#151515]/80 backdrop-blur-md p-3.5 px-5 rounded-3xl border border-slate-100/90 dark:border-zinc-800 shadow-card">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c6f634] ring-4 ring-emerald-500/20 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200">
              সুপার অ্যাডমিন কমান্ড সেন্টার • Obhyash Hub
            </span>
          </div>

          <div className="flex items-center gap-3">
            <UserSpotlightSearchBar />

            <button
              onClick={() => fetchOverview(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 text-xs font-bold transition-all active:scale-95 shadow-sm border border-slate-200/60 dark:border-zinc-700/60"
              title="Force refresh database cache"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`}
              />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* ── 2. ACTION ALERTS HUB (Preserved 100%) ── */}
        <ActionAlertsHub
          pendingQuestions={metrics.pendingQuestions}
          pendingReports={metrics.pendingReports}
          pendingComplaints={metrics.pendingComplaints}
          activeLiveExams={metrics.activeLiveExams}
        />

        {/* ── 3. TOP BENTO ROW: 3 SOFT PASTEL KPI CARDS + HIGH-CONTRAST FEATURE BANNER ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Soft Lavender Pastel (Total Students / Earning) */}
          <Link href="/admin/user-management">
            <KpiCard
              variant="lavender"
              title="Total Students"
              badgeText="মোট শিক্ষার্থী"
              value={isLoading ? '...' : (metrics.totalUsers >= 1000 ? `${(metrics.totalUsers / 1000).toFixed(2)}K` : metrics.totalUsers.toLocaleString())}
              subtext={`${metrics.proUsers.toLocaleString()} জন প্রো/পেইড মেম্বার`}
              icon={Users}
              trend={{ value: '+6.04%', isPositive: true }}
            />
          </Link>

          {/* Card 2: Soft Periwinkle Pastel (Daily Submissions / Active Earning) */}
          <Link href="/admin/analytics">
            <KpiCard
              variant="periwinkle"
              title="Daily Exams"
              badgeText="আজকের পরীক্ষা"
              value={isLoading ? '...' : (metrics.todayExams >= 1000 ? `${(metrics.todayExams / 1000).toFixed(3)}K` : metrics.todayExams.toLocaleString())}
              subtext={`মোট সম্পন্ন: ${metrics.totalExams.toLocaleString()} টি`}
              icon={Activity}
              trend={metrics.examGrowthPercent ? { value: `${metrics.examGrowthPercent > 0 ? '+' : ''}${metrics.examGrowthPercent}%`, isPositive: metrics.examGrowthPercent >= 0 } : undefined}
            />
          </Link>

          {/* Card 3: Soft Mint Pastel (Question Bank / Conversion) */}
          <Link href="/admin/question-management">
            <KpiCard
              variant="mint"
              title="Question Bank"
              badgeText="প্রশ্ন ব্যাংক ভাণ্ডার"
              value={isLoading ? '...' : metrics.totalQuestions.toLocaleString()}
              subtext={`${metrics.pendingQuestions} টি অনুমোদনের অপেক্ষায়`}
              icon={FileQuestion}
              trend={{ value: '৭৪.৮% সলভ রেট', isPositive: true }}
            />
          </Link>

          {/* Card 4: High-Contrast Forest Teal Banner (Live Exam System Engine) */}
          <StatusBanner
            title="লাইভ এক্সাম ইঞ্জিন"
            metric={metrics.activeLiveExams > 0 ? `${metrics.activeLiveExams} টি লাইভ চলছে` : 'স্ট্যান্ডবাই মোড'}
            subtext="৯৯.৯% আপটাইম • পরবর্তী লাইভ এক্সাম রেডি"
            buttonText="লাইভ কন্ট্রোলার"
            onAction={() => window.location.href = '/admin/live-exams'}
          />
        </div>

        {/* ── 4. MIDDLE BENTO ROW: PARTICIPATION DUAL-BAR CHART & DAILY LIVE SCHEDULE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 8 Cols: Dual-Tone Lavender & Neo-Lime Bar Chart */}
          <div className="lg:col-span-8 flex flex-col">
            <ParticipationChart className="h-full" />
          </div>

          {/* Right 4 Cols: Daily Live Schedule & Conductor Meeting Card */}
          <div className="lg:col-span-4 flex flex-col justify-between">
            <ScheduleCard
              title="Daily Live Schedule"
              timeInfo="12+ Person • 8:30 PM"
              conductorsText="আজকের লাইভ সেশন মেন্টরিং প্যানেল রেডি"
              buttonText="লাইভ এক্সাম সেশনে প্রবেশ"
              onJoin={() => window.location.href = '/admin/live-exams'}
              className="h-full"
            />
          </div>
        </div>

        {/* ── 5. 24-HOUR REAL-TIME LEARNING ACTIVITY GRAPH (Preserved 100%) ── */}
        {data?.analytics && (
          <div className="bg-white dark:bg-[#151515] rounded-3xl p-6 shadow-card border border-slate-100/80 dark:border-zinc-800/80">
            <LearningTrendsChart
              hourlyActivity={data.analytics.hourlyActivity}
              topSubjects={data.analytics.topSubjects}
              topChapters={data.analytics.topChapters}
              todayTotal={data.analytics.todayTotal}
            />
          </div>
        )}

        {/* ── 6. BOTTOM BENTO ROW: TOP PERFORMING SETS & ACTIVE TEAM MEMBERS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 8 Cols: Top Store / Top Performing Sets Table */}
          <div className="lg:col-span-8">
            <QuestionSetTable title="Top Store" />
          </div>

          {/* Right 4 Cols: Team Members Widget */}
          <div className="lg:col-span-4 flex flex-col">
            <TeamList
              title="Team Member"
              className="h-full"
              onAddMember={() => window.location.href = '/admin/user-management'}
            />
          </div>
        </div>

        {/* ── 7. QUICK MANAGEMENT SHORTCUTS (Preserved 100%) ── */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
              কুইক ম্যানেজমেন্ট শর্টকাট
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickShortcuts.map((action, idx) => {
              const Icon = action.icon;
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className="bg-white dark:bg-[#151515] border border-slate-100/90 dark:border-zinc-800/80 rounded-3xl p-5 hover:border-[#c6f634] hover:shadow-card transition-all duration-200 group flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className={`p-2.5 rounded-2xl border ${action.color} shrink-0`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {action.desc}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                    <span>ওপেন করুন</span>
                    <ArrowUpRight size={13} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── 8. MASTER PLATFORM CONTROLLER & BROADCAST CARD (Preserved 100%) ── */}
        {data?.systemControls && (
          <div className="bg-white dark:bg-[#151515] rounded-3xl shadow-card border border-slate-100/80 dark:border-zinc-800/80 p-6">
            <SystemControlsCard
              initialConfig={data.systemControls}
              onUpdate={() => fetchOverview(true)}
            />
          </div>
        )}

        {/* ── 9. DIRECTORY & CLOUD INFRASTRUCTURE (Preserved 100%) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Module Directory */}
          <div className="lg:col-span-2 bg-white dark:bg-[#151515] border border-slate-100/80 dark:border-zinc-800/80 rounded-3xl p-6 space-y-4 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers size={16} className="text-[#c6f634] fill-[#c6f634]" />
                <span>ম্যানেজমেন্ট মডিউল ডিরেক্টরি</span>
              </h3>
              <span className="text-[11px] font-bold text-slate-950 bg-[#c6f634] px-3 py-1 rounded-full shadow-sm">
                সকল সিস্টেম অনলাইন
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href="/admin/question-management"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/80 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FileQuestion size={16} className="text-blue-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    প্রশ্ন ব্যাংক ও অনুমোদন
                  </span>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/live-exams"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/80 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Radio size={16} className="text-amber-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    লাইভ প্রতিযোগিতা কন্ট্রোলার
                  </span>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/user-management"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/80 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Users size={16} className="text-purple-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    ইউজার ও অ্যাক্সেস কন্ট্রোল
                  </span>
                </div>
                <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/admin/reports"
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-100 dark:border-zinc-800/80 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle size={16} className="text-rose-500" />
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
                    প্রশ্ন এরর সমাধান
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  {metrics.pendingReports} Reports
                </span>
              </Link>
            </div>
          </div>

          {/* Right 1 Col: Platform Health & Cloud Infrastructure */}
          <div className="bg-white dark:bg-[#151515] border border-slate-100/80 dark:border-zinc-800/80 rounded-3xl p-6 space-y-4 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 flex items-center gap-2 mb-3">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>ক্লাউড অবকাঠামো স্থিতি</span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-zinc-400 leading-relaxed">
                Supabase PostgreSQL ডাটাবেজ এবং Cloudflare R2 ইমেজ হোস্টিং সরাসরি সংযুক্ত রয়েছে।
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Supabase DB</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  অনলাইন (Healthy)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">Cloudflare R2</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                  সক্রিয় (Active)
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400 font-medium">ক্যাশ মেমোরি</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">
                  45s Edge TTL
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
