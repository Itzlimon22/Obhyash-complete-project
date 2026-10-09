'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import {
  Smartphone,
  UserCheck,
  Mail,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
  Loader2,
  Trash2,
  Flame,
  Layout,
  Menu,
  BookOpen,
  PanelBottom,
  Layers,
  GraduationCap,
  Sparkles,
  ExternalLink,
  Activity,
  MousePointerClick,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Calendar,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/admin/questions/pagination';
import { exportToCSV } from '@/lib/utils/export-csv';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Types ---
export interface ButtonBreakdownItem {
  location: string;
  nameBn: string;
  nameEn: string;
  category: string;
  totalClicks: number;
  todayClicks: number;
  appDownloads: number;
  signups: number;
  sscExams: number;
  hscExams: number;
  practiceClicks: number;
  percentage: number;
  lastClickedAt: string | null;
}

export interface TopConvertingPost {
  slug: string;
  segment: 'SSC' | 'HSC' | 'General';
  appDownloads: number;
  signups: number;
  demoExams: number;
  total: number;
  today: number;
  lastActivity: string;
}

export interface RecentConversionEvent {
  id: string;
  event_type: string;
  source_slug: string;
  source_category?: string;
  button_location: string;
  created_at: string;
  segment: 'SSC' | 'HSC' | 'General';
  buttonNameBn: string;
}

export interface CohortStats {
  total: number;
  today: number;
  appDownloads: number;
  signups: number;
  demoExams: number;
  todayDemoExams: number;
}

export interface BlogMetrics {
  subscribers: number;
  totalConversions: number;
  todayConversions: number;
  totalAppDownloads: number;
  todayAppDownloads: number;
  totalSignups: number;
  todaySignups: number;
  totalPracticeClicks: number;
  todayPracticeClicks: number;
  sscStats?: CohortStats;
  hscStats?: CohortStats;
  generalStats?: CohortStats;
  topConvertingPosts?: TopConvertingPost[];
  buttonBreakdown?: ButtonBreakdownItem[];
  recentConversions?: RecentConversionEvent[];
  tableExists?: boolean;
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscribed_at: string;
}

// 24-hour timestamp formatter & relative time
function formatTimestamp(dateStr?: string | null) {
  if (!dateStr) return { date: 'N/A', time: '', full: 'N/A', relative: 'N/A' };
  const d = new Date(dateStr);
  if (isNaN(d.getTime()))
    return { date: 'N/A', time: '', full: 'N/A', relative: 'N/A' };

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  // Relative calculation
  const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
  let relative = 'এখনই';
  if (diffSec < 60) relative = `${Math.max(1, diffSec)} সে. আগে`;
  else if (diffSec < 3600) relative = `${Math.floor(diffSec / 60)} মি. আগে`;
  else if (diffSec < 86400) relative = `${Math.floor(diffSec / 3600)} ঘণ্টা আগে`;
  else relative = `${Math.floor(diffSec / 86400)} দিন আগে`;

  return {
    date: `${day}/${month}/${year}`,
    time: `${hours}:${minutes}:${seconds}`,
    full: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
    relative,
  };
}

export default function BlogManagementClient() {
  // Navigation Tabs: 'live-feed' | 'buttons' | 'cohorts' | 'top-posts' | 'subscribers'
  const [activeTab, setActiveTab] = useState<
    'live-feed' | 'buttons' | 'cohorts' | 'top-posts' | 'subscribers'
  >('live-feed');

  // Auto-refresh interval (in ms): 10000, 30000, or 0 (off)
  const [refreshInterval, setRefreshInterval] = useState<number>(15000);

  // Live feed filter chips
  const [feedFilter, setFeedFilter] = useState<
    'all' | 'app' | 'signup' | 'ssc' | 'hsc' | 'practice'
  >('all');
  const [feedSearch, setFeedSearch] = useState('');

  // Newsletter Subscribers Pagination State
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subDebouncedSearch, setSubDebouncedSearch] = useState('');
  const [subPage, setSubPage] = useState(1);
  const [subPageSize, setSubPageSize] = useState(15);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounce newsletter search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSubDebouncedSearch(subSearchQuery);
      setSubPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [subSearchQuery]);

  // Main Metrics Query
  const {
    data: metrics,
    isLoading: metricsLoading,
    isValidating: metricsValidating,
    mutate: mutateMetrics,
  } = useSWR<BlogMetrics>('/api/admin/blog/metrics', fetcher, {
    refreshInterval: refreshInterval > 0 ? refreshInterval : 0,
    revalidateOnFocus: true,
  });

  // Newsletter Table Query
  const {
    data: responseData,
    mutate: mutateSubs,
    isLoading: subsLoading,
  } = useSWR<{ data: Subscriber[]; totalCount: number }>(
    `/api/admin/blog/data?page=${subPage}&pageSize=${subPageSize}&search=${encodeURIComponent(subDebouncedSearch)}`,
    fetcher,
  );

  const subscriberList = responseData?.data || [];
  const subscriberCount = responseData?.totalCount || 0;
  const subscriberTotalPages = Math.max(
    1,
    Math.ceil(subscriberCount / subPageSize),
  );

  // Filtered live feed items
  const filteredEvents = useMemo(() => {
    const list = metrics?.recentConversions || [];
    return list.filter((item) => {
      // 1. Chip filter
      if (feedFilter === 'app' && item.event_type !== 'app_download')
        return false;
      if (feedFilter === 'signup' && item.event_type !== 'signup_click')
        return false;
      if (feedFilter === 'ssc' && item.segment !== 'SSC') return false;
      if (feedFilter === 'hsc' && item.segment !== 'HSC') return false;
      if (
        feedFilter === 'practice' &&
        item.event_type !== 'practice_click' &&
        item.event_type !== 'demo_exam_start' &&
        item.event_type !== 'demo_exam_complete'
      )
        return false;

      // 2. Search query filter
      if (feedSearch.trim()) {
        const query = feedSearch.toLowerCase();
        const matchesSlug = (item.source_slug || '').toLowerCase().includes(query);
        const matchesBtn = (item.buttonNameBn || '').toLowerCase().includes(query) ||
          (item.button_location || '').toLowerCase().includes(query);
        const matchesCategory = (item.source_category || '').toLowerCase().includes(query);
        const matchesId = item.id.toLowerCase().includes(query);
        return matchesSlug || matchesBtn || matchesCategory || matchesId;
      }
      return true;
    });
  }, [metrics?.recentConversions, feedFilter, feedSearch]);

  // Export Events Log to CSV
  const exportEventsCSV = () => {
    const events = metrics?.recentConversions || [];
    if (events.length === 0) {
      toast.error('এক্সপোর্ট করার জন্য কোনো লাইভ ইভেন্ট ডাটা নেই');
      return;
    }

    const success = exportToCSV({
      filename: `conversion_events_log_${new Date().toISOString().split('T')[0]}.csv`,
      headers: [
        'Event ID',
        'Event Type',
        'Segment (SSC/HSC)',
        'Button Location',
        'Button Name (Bengali)',
        'Source Post / Page',
        'Category',
        'Timestamp (24h)',
      ],
      rows: events.map((ev) => [
        ev.id,
        ev.event_type,
        ev.segment,
        ev.button_location,
        ev.buttonNameBn,
        ev.source_slug,
        ev.source_category || 'N/A',
        formatTimestamp(ev.created_at).full,
      ]),
    });
    if (success) toast.success('ইভেন্ট লগ CSV সফলভাবে ডাউনলোড হয়েছে');
  };

  // Export Subscribers to CSV
  const exportSubscribersCSV = () => {
    if (subscriberList.length === 0) {
      toast.error('এক্সপোর্ট করার জন্য কোনো সাবস্ক্রাইবার নেই');
      return;
    }

    const success = exportToCSV({
      filename: `subscribers_${new Date().toISOString().split('T')[0]}.csv`,
      headers: ['Subscriber ID', 'Email', 'Status', 'Date & Time (24h)'],
      rows: subscriberList.map((s) => [
        s.id,
        s.email,
        s.status,
        formatTimestamp(s.subscribed_at).full,
      ]),
    });
    if (success) toast.success('সাবস্ক্রাইবার তালিকা ডাউনলোড হয়েছে');
  };

  // Delete subscriber action
  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`${email} মুছে ফেলতে চান?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch('/api/admin/blog/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('সাবস্ক্রাইবার মুছে ফেলা হয়েছে');
      mutateSubs();
      mutateMetrics();
    } catch {
      toast.error('মুছতে সমস্যা হয়েছে');
    } finally {
      setDeletingId(null);
    }
  };

  // Safe metrics values
  const totalConv = metrics?.totalConversions ?? 0;
  const todayConv = metrics?.todayConversions ?? 0;
  const totalApps = metrics?.totalAppDownloads ?? 0;
  const todayApps = metrics?.todayAppDownloads ?? 0;
  const totalSignups = metrics?.totalSignups ?? 0;
  const todaySignups = metrics?.todaySignups ?? 0;
  const totalPractice = metrics?.totalPracticeClicks ?? 0;
  const todayPractice = metrics?.todayPracticeClicks ?? 0;

  const sscTotal = metrics?.sscStats?.total ?? 0;
  const sscToday = metrics?.sscStats?.today ?? 0;
  const hscTotal = metrics?.hscStats?.total ?? 0;
  const hscToday = metrics?.hscStats?.today ?? 0;
  const genTotal = metrics?.generalStats?.total ?? 0;

  // Cohort percentages
  const cohortSum = Math.max(1, sscTotal + hscTotal + genTotal);
  const sscPct = Math.round((sscTotal / cohortSum) * 100);
  const hscPct = Math.round((hscTotal / cohortSum) * 100);
  const genPct = Math.max(0, 100 - sscPct - hscPct);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
      {/* ── Table Not Migrated Warning Banner (if applicable) ── */}
      {metrics && metrics.tableExists === false && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>কনভার্শন টেবিল মাইগ্রেশন প্রয়োজন:</strong> Supabase এ{' '}
              <code className="font-mono bg-amber-500/20 px-1 py-0.5 rounded">
                sql/migrations/20261004_create_blog_conversions.sql
              </code>{' '}
              রান করুন।
            </span>
          </div>
        </div>
      )}

      {/* ── 1. COMPACT MONITOR HUB HEADER BAR ── */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#141416] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        {/* Title & Live Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                কনভার্শন মনিটর হাব
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                লাইভ ফিড
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400">
              অ্যাপ ডাউনলোড, রেজিস্ট্রেশন ও এসএসসি/এইচএসসি এক্সাম অ্যাক্টিভিটি ট্র্যাকার
            </p>
          </div>
        </div>

        {/* Toolbar: Refresh, Auto-refresh toggles, Export */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/60 dark:border-white/5">
            <span className="text-[10px] text-slate-400 px-2 font-medium">
              অটো:
            </span>
            <button
              onClick={() => setRefreshInterval(0)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                refreshInterval === 0
                  ? 'bg-white dark:bg-zinc-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              বন্ধ
            </button>
            <button
              onClick={() => setRefreshInterval(10000)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                refreshInterval === 10000
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ১০ সে.
            </button>
            <button
              onClick={() => setRefreshInterval(30000)}
              className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                refreshInterval === 30000
                  ? 'bg-teal-500 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ৩০ সে.
            </button>
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={() => {
              mutateMetrics();
              mutateSubs();
              toast.success('ডেটা রিফ্রেশ করা হয়েছে');
            }}
            disabled={metricsValidating}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-zinc-200 font-medium transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${metricsValidating ? 'animate-spin text-teal-500' : ''}`}
            />
            <span>রিফ্রেশ</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={exportEventsCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ইভেন্ট CSV</span>
          </button>
        </div>
      </header>

      {/* ── 2. HIGH-DENSITY 6-KPI BENTO STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {/* Metric 1: Total Conversions */}
        <div className="bg-white dark:bg-[#141416] rounded-2xl p-3.5 border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold">মোট অ্যাকশন</span>
            <MousePointerClick className="w-4 h-4 text-teal-500" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
              {metricsLoading ? '...' : totalConv.toLocaleString('bn-BD')}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400">আজকের অ্যাকশন:</span>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400">
              +{todayConv.toLocaleString('bn-BD')}
            </span>
          </div>
        </div>

        {/* Metric 2: Play Store App Downloads */}
        <div className="bg-emerald-50/60 dark:bg-[#12281d] rounded-2xl p-3.5 border border-emerald-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300">
            <span className="text-[11px] font-semibold">Play Store অ্যাপ</span>
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black tracking-tight text-emerald-950 dark:text-emerald-100 font-mono">
              {metricsLoading ? '...' : totalApps.toLocaleString('bn-BD')}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-emerald-800/70 dark:text-emerald-300/70">
              আজকের ইনস্টল:
            </span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
              +{todayApps.toLocaleString('bn-BD')}
            </span>
          </div>
        </div>

        {/* Metric 3: Website Signups */}
        <div className="bg-blue-50/60 dark:bg-[#14233a] rounded-2xl p-3.5 border border-blue-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-800 dark:text-blue-300">
            <span className="text-[11px] font-semibold">রেজিস্ট্রেশন</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black tracking-tight text-blue-950 dark:text-blue-100 font-mono">
              {metricsLoading ? '...' : totalSignups.toLocaleString('bn-BD')}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-blue-800/70 dark:text-blue-300/70">
              আজকের সাইনআপ:
            </span>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
              +{todaySignups.toLocaleString('bn-BD')}
            </span>
          </div>
        </div>

        {/* Metric 4: SSC Demo Exams */}
        <div className="bg-amber-50/60 dark:bg-[#2b1f14] rounded-2xl p-3.5 border border-amber-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 dark:text-amber-300">
            <span className="text-[11px] font-semibold">এসএসসি ডেমো</span>
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black tracking-tight text-amber-950 dark:text-amber-100 font-mono">
              {metricsLoading ? '...' : sscTotal.toLocaleString('bn-BD')}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-amber-800/70 dark:text-amber-300/70">
              আজকের এসএসসি:
            </span>
            <span className="font-mono font-bold text-amber-700 dark:text-amber-300">
              +{sscToday.toLocaleString('bn-BD')}
            </span>
          </div>
        </div>

        {/* Metric 5: HSC Demo Exams */}
        <div className="bg-indigo-50/60 dark:bg-[#1f1a35] rounded-2xl p-3.5 border border-indigo-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-800 dark:text-indigo-300">
            <span className="text-[11px] font-semibold">এইচএসসি ডেমো</span>
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black tracking-tight text-indigo-950 dark:text-indigo-100 font-mono">
              {metricsLoading ? '...' : hscTotal.toLocaleString('bn-BD')}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-indigo-800/70 dark:text-indigo-300/70">
              আজকের এইচএসসি:
            </span>
            <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
              +{hscToday.toLocaleString('bn-BD')}
            </span>
          </div>
        </div>

        {/* Metric 6: Direct Exam / Subscribers */}
        <div className="bg-cyan-50/60 dark:bg-[#122b31] rounded-2xl p-3.5 border border-cyan-500/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-800 dark:text-cyan-300">
            <span className="text-[11px] font-semibold">ফ্রি এক্সাম ও অন্যান্য</span>
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="my-1.5">
            <div className="text-2xl font-black tracking-tight text-cyan-950 dark:text-cyan-100 font-mono">
              {metricsLoading ? '...' : totalPractice.toLocaleString('bn-BD')}
            </div>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-cyan-800/70 dark:text-cyan-300/70">
              নিউজলেটার:
            </span>
            <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300">
              {(metrics?.subscribers ?? 0).toLocaleString('bn-BD')}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3. COHORT RATIO BAR (SSC vs HSC vs GENERAL) ── */}
      <div className="bg-white dark:bg-[#141416] p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-zinc-200">
              সেগমেন্ট অনুপাত (Cohort Distribution)
            </span>
            <span className="text-[10px] text-slate-400">
              কারা বেশি অ্যাক্টিভ?
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              এসএসসি: {sscTotal} ({sscPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              এইচএসসি: {hscTotal} ({hscPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              অন্যান্য: {genTotal} ({genPct}%)
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden flex">
          <div
            className="h-full bg-amber-500 transition-all duration-500"
            style={{ width: `${sscPct}%` }}
            title={`SSC: ${sscPct}%`}
          />
          <div
            className="h-full bg-indigo-500 transition-all duration-500"
            style={{ width: `${hscPct}%` }}
            title={`HSC: ${hscPct}%`}
          />
          <div
            className="h-full bg-slate-400 dark:bg-zinc-600 transition-all duration-500"
            style={{ width: `${genPct}%` }}
            title={`General: ${genPct}%`}
          />
        </div>
      </div>

      {/* ── 4. NAVIGATION TABS (DENSE CONTROL SWITCHER) ── */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-1">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('live-feed')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'live-feed'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>লাইভ অ্যাক্টিভিটি ফিড</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono">
              {metrics?.recentConversions?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('buttons')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'buttons'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>বাটন পারফরম্যান্স</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/10 font-mono">
              {metrics?.buttonBreakdown?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cohorts')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'cohorts'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>এসএসসি বনাম এইচএসসি</span>
          </button>

          <button
            onClick={() => setActiveTab('top-posts')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'top-posts'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>টপ আর্টিকেল</span>
          </button>

          <button
            onClick={() => setActiveTab('subscribers')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'subscribers'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>নিউজলেটার গ্রাহক</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-white/10 font-mono">
              {subscriberCount}
            </span>
          </button>
        </div>
      </div>

      {/* ── 5. TAB CONTENT ── */}

      {/* ──────── TAB 1: LIVE ACTIVITY FEED (KE KOKHON KON BUTTON) ──────── */}
      {activeTab === 'live-feed' && (
        <div className="bg-white dark:bg-[#141416] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          {/* Feed Filter & Search Toolbar */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> ফিল্টার:
              </span>
              {[
                { id: 'all', label: 'সব অ্যাকশন' },
                { id: 'app', label: '📱 Play Store' },
                { id: 'signup', label: '👤 সাইনআপ' },
                { id: 'ssc', label: '📘 SSC টেস্ট' },
                { id: 'hsc', label: '📕 HSC টেস্ট' },
                { id: 'practice', label: '⚡ ডিরেক্ট এক্সাম' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFeedFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    feedFilter === tab.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-300 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="পোস্ট, বাটন বা আইডি খুঁজুন..."
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Table of Events */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300 border-collapse">
              <thead className="bg-slate-50/70 dark:bg-white/5 text-[11px] uppercase font-bold text-slate-400 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="py-2.5 px-4 font-mono">সময় (২৪ ঘণ্টা)</th>
                  <th className="py-2.5 px-4">ইভেন্ট টাইপ</th>
                  <th className="py-2.5 px-4">কোন বাটন / অবস্থান</th>
                  <th className="py-2.5 px-4">সোর্স পেজ / আর্টিকেল</th>
                  <th className="py-2.5 px-4 text-center">সেগমেন্ট</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-sans">
                {metricsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-500" />
                      লাইভ ইভেন্ট লোড হচ্ছে...
                    </td>
                  </tr>
                ) : filteredEvents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      ফিল্টারের সাথে মিলে এমন কোনো অ্যাকশন পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredEvents.map((ev) => {
                    const ts = formatTimestamp(ev.created_at);
                    const isApp = ev.event_type === 'app_download';
                    const isSignup = ev.event_type === 'signup_click';
                    const isDemoStart = ev.event_type === 'demo_exam_start';
                    const isDemoComplete = ev.event_type === 'demo_exam_complete';
                    const isPractice = ev.event_type === 'practice_click';

                    return (
                      <tr
                        key={ev.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors group"
                      >
                        {/* Time: 24h & relative */}
                        <td className="py-2.5 px-4 font-mono text-[11px] whitespace-nowrap">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {ts.time}
                          </div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span>{ts.date}</span>
                            <span>•</span>
                            <span className="text-teal-600 dark:text-teal-400 font-semibold">
                              {ts.relative}
                            </span>
                          </div>
                        </td>

                        {/* Event Type Badge */}
                        <td className="py-2.5 px-4 whitespace-nowrap">
                          {isApp && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
                              <Smartphone className="w-3 h-3 text-emerald-600" />
                              Play Store ইনস্টল
                            </span>
                          )}
                          {isSignup && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/20">
                              <UserCheck className="w-3 h-3 text-blue-600" />
                              রেজিস্ট্রেশন ক্লিক
                            </span>
                          )}
                          {isDemoStart && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20">
                              <GraduationCap className="w-3 h-3 text-amber-600" />
                              ডেমো টেস্ট শুরু
                            </span>
                          )}
                          {isDemoComplete && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-800 dark:text-purple-300 border border-purple-500/20">
                              <CheckCircle2 className="w-3 h-3 text-purple-600" />
                              ডেমো টেস্ট সম্পন্ন
                            </span>
                          )}
                          {isPractice && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-800 dark:text-cyan-300 border border-cyan-500/20">
                              <Sparkles className="w-3 h-3 text-cyan-600" />
                              ফ্রি এক্সাম ক্লিক
                            </span>
                          )}
                        </td>

                        {/* Button Location & Bengali Name */}
                        <td className="py-2.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">
                            {ev.buttonNameBn}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {ev.button_location}
                          </span>
                        </td>

                        {/* Source Slug / Page */}
                        <td className="py-2.5 px-4">
                          {ev.source_slug.startsWith('demo') ? (
                            <Link
                              href="/demo"
                              target="_blank"
                              className="text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:text-teal-600 flex items-center gap-1 max-w-xs truncate"
                            >
                              <span>{ev.source_slug}</span>
                              <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                            </Link>
                          ) : (
                            <Link
                              href={`/blog/${ev.source_slug}`}
                              target="_blank"
                              className="text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:text-teal-600 flex items-center gap-1 max-w-xs truncate"
                              title={ev.source_slug}
                            >
                              <span className="truncate">{ev.source_slug}</span>
                              <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
                            </Link>
                          )}
                        </td>

                        {/* Segment Badge */}
                        <td className="py-2.5 px-4 text-center whitespace-nowrap">
                          {ev.segment === 'SSC' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                              SSC
                            </span>
                          )}
                          {ev.segment === 'HSC' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
                              HSC
                            </span>
                          )}
                          {ev.segment === 'General' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400">
                              General
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count indicator */}
          <div className="p-3 bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>
              মোট <strong>{filteredEvents.length}</strong> টি অ্যাকশন প্রদর্শিত
            </span>
            <span className="font-mono">
              সর্বশেষ ২০০টি লাইভ ইভেন্ট অটো-সিঙ্কড
            </span>
          </div>
        </div>
      )}

      {/* ──────── TAB 2: BUTTON PERFORMANCE MATRIX ──────── */}
      {activeTab === 'buttons' && (
        <div className="bg-white dark:bg-[#141416] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                বাটন ও সিটিএ প্লেসমেন্ট পারফরম্যান্স
              </h3>
              <p className="text-[11px] text-slate-400">
                কোন বাটন থেকে কতজন স্টুডেন্ট অ্যাপ ডাউনলোড বা রেজিস্ট্রেশন করেছে
              </p>
            </div>
            <span className="text-[11px] font-mono font-bold text-teal-600 dark:text-teal-400">
              {metrics?.buttonBreakdown?.length || 0} টি বাটন ট্র্যাকড
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300 border-collapse">
              <thead className="bg-slate-50/70 dark:bg-white/5 text-[11px] uppercase font-bold text-slate-400 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="py-2.5 px-4">বাটনের নাম ও অবস্থান</th>
                  <th className="py-2.5 px-3 text-center">ক্যাটাগরি</th>
                  <th className="py-2.5 px-3 text-center">মোট ক্লিক</th>
                  <th className="py-2.5 px-3 text-center">আজ</th>
                  <th className="py-2.5 px-3 text-center">Play Store</th>
                  <th className="py-2.5 px-3 text-center">রেজিস্ট্রেশন</th>
                  <th className="py-2.5 px-3 text-center">এসএসসি/এইচএসসি টেস্ট</th>
                  <th className="py-2.5 px-4 text-right">শেয়ার (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-sans">
                {metrics?.buttonBreakdown && metrics.buttonBreakdown.length > 0 ? (
                  metrics.buttonBreakdown.map((btn) => {
                    const testClicks = (btn.sscExams || 0) + (btn.hscExams || 0) + (btn.practiceClicks || 0);
                    return (
                      <tr
                        key={btn.location}
                        className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors"
                      >
                        {/* Name & Location key */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {btn.nameBn}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">
                            {btn.location} • {btn.nameEn}
                          </span>
                        </td>

                        {/* Category Tag */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-zinc-400">
                            {btn.category}
                          </span>
                        </td>

                        {/* Total Clicks */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {btn.totalClicks.toLocaleString('bn-BD')}
                        </td>

                        {/* Today clicks */}
                        <td className="py-3 px-3 text-center font-mono text-xs">
                          {btn.todayClicks > 0 ? (
                            <span className="text-teal-600 dark:text-teal-400 font-bold">
                              +{btn.todayClicks}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-zinc-600">০</span>
                          )}
                        </td>

                        {/* App downloads */}
                        <td className="py-3 px-3 text-center font-mono text-xs">
                          {btn.appDownloads > 0 ? (
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              {btn.appDownloads}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-zinc-600">০</span>
                          )}
                        </td>

                        {/* Signups */}
                        <td className="py-3 px-3 text-center font-mono text-xs">
                          {btn.signups > 0 ? (
                            <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                              {btn.signups}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-zinc-600">০</span>
                          )}
                        </td>

                        {/* Exam clicks */}
                        <td className="py-3 px-3 text-center font-mono text-xs">
                          {testClicks > 0 ? (
                            <span className="font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                              {testClicks}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-zinc-600">০</span>
                          )}
                        </td>

                        {/* Share Progress Bar */}
                        <td className="py-3 px-4 text-right font-mono">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              {btn.percentage}%
                            </span>
                            <div className="w-20 h-1.5 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                              <div
                                className="h-full bg-teal-500 rounded-full"
                                style={{ width: `${Math.min(100, btn.percentage)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      কোনো বাটন ডাটা পাওয়া যায়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────── TAB 3: SSC vs HSC COHORT COMPARISON ──────── */}
      {activeTab === 'cohorts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: SSC Cohort Card */}
          <div className="bg-white dark:bg-[#141416] rounded-2xl border border-amber-500/30 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  SSC
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    এসএসসি পরীক্ষার্থী সেগমেন্ট
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    এসএসসি ব্লগ ও ডেমো টেস্ট অ্যাক্টিভিটি
                  </p>
                </div>
              </div>
              <span className="text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                {sscTotal}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/10">
                <div className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                  Play Store অ্যাপ
                </div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {metrics?.sscStats?.appDownloads ?? 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/10">
                <div className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                  রেজিস্ট্রেশন
                </div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {metrics?.sscStats?.signups ?? 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-500/10">
                <div className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                  ডেমো টেস্ট শুরু
                </div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {metrics?.sscStats?.demoExams ?? 0}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-xs text-slate-600 dark:text-zinc-300 space-y-1">
              <div className="font-semibold text-slate-800 dark:text-white text-[11px]">
                জনপ্রিয় এসএসসি কনভার্সন সোর্স:
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                • এসএসসি বৃত্তি রেজাল্ট ও মেধা তালিকা সংক্রান্ত আর্টিকেল<br />
                • সাধারণ গণিত ও বিজ্ঞান ডেমো মডেল টেস্ট
              </p>
            </div>
          </div>

          {/* Right: HSC Cohort Card */}
          <div className="bg-white dark:bg-[#141416] rounded-2xl border border-indigo-500/30 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
                  HSC
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    এইচএসসি পরীক্ষার্থী সেগমেন্ট
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    এইচএসসি ও অ্যাডমিশন রিলেটেড অ্যাক্টিভিটি
                  </p>
                </div>
              </div>
              <span className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {hscTotal}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/10">
                <div className="text-[10px] text-indigo-800 dark:text-indigo-300 font-medium">
                  Play Store অ্যাপ
                </div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {metrics?.hscStats?.appDownloads ?? 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/10">
                <div className="text-[10px] text-indigo-800 dark:text-indigo-300 font-medium">
                  রেজিস্ট্রেশন
                </div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {metrics?.hscStats?.signups ?? 0}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-500/10">
                <div className="text-[10px] text-indigo-800 dark:text-indigo-300 font-medium">
                  ডেমো টেস্ট শুরু
                </div>
                <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-1">
                  {metrics?.hscStats?.demoExams ?? 0}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 text-xs text-slate-600 dark:text-zinc-300 space-y-1">
              <div className="font-semibold text-slate-800 dark:text-white text-[11px]">
                জনপ্রিয় এইচএসসি কনভার্সন সোর্স:
              </div>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                • এইচএসসি সিলেবাস ও বোর্ড নোটিশ সংক্রান্ত আর্টিকেল<br />
                • পদার্থবিজ্ঞান, উচ্চতর গণিত ও বায়োলজি চ্যাপ্টার টেস্ট
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ──────── TAB 4: TOP CONVERTING ARTICLES ──────── */}
      {activeTab === 'top-posts' && (
        <div className="bg-white dark:bg-[#141416] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                টপ কনভার্টিং আর্টিকেল লিডারবোর্ড
              </h3>
              <p className="text-[11px] text-slate-400">
                যেসব পোস্ট পড়ে শিক্ষার্থীরা সবচেয়ে বেশি প্ল্যাটফর্মে যুক্ত হচ্ছে
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300 border-collapse">
              <thead className="bg-slate-50/70 dark:bg-white/5 text-[11px] uppercase font-bold text-slate-400 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">পোস্টের স্লাগ / টাইটেল</th>
                  <th className="py-2.5 px-3 text-center">সেগমেন্ট</th>
                  <th className="py-2.5 px-3 text-center">Play Store</th>
                  <th className="py-2.5 px-3 text-center">রেজিস্ট্রেশন</th>
                  <th className="py-2.5 px-3 text-center">এক্সাম টেস্ট</th>
                  <th className="py-2.5 px-4 text-right">মোট কনভার্শন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-sans">
                {metrics?.topConvertingPosts && metrics.topConvertingPosts.length > 0 ? (
                  metrics.topConvertingPosts.map((post, idx) => (
                    <tr
                      key={post.slug}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors group"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-4">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="font-bold text-slate-900 dark:text-white group-hover:text-teal-600 transition-colors flex items-center gap-1.5"
                        >
                          <span className="truncate max-w-md">{post.slug}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-50 shrink-0" />
                        </Link>
                      </td>

                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            post.segment === 'SSC'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                              : post.segment === 'HSC'
                              ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                              : 'bg-slate-100 dark:bg-white/5 text-slate-500'
                          }`}
                        >
                          {post.segment}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {post.appDownloads}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700 dark:text-blue-400">
                        {post.signups}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-cyan-700 dark:text-cyan-400">
                        {post.demoExams}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {post.total}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      কোনো আর্টিকেল কনভার্শন ডাটা নেই
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────── TAB 5: NEWSLETTER SUBSCRIBERS ──────── */}
      {activeTab === 'subscribers' && (
        <div className="bg-white dark:bg-[#141416] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                নিউজলেটার গ্রাহক ডাটাবেজ
              </h3>
              <p className="text-[11px] text-slate-400">
                মোট {subscriberCount.toLocaleString('bn-BD')} জন অ্যাক্টিভ ইমেইল গ্রাহক
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ইমেইল সার্চ করুন..."
                  value={subSearchQuery}
                  onChange={(e) => setSubSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <button
                onClick={exportSubscribersCSV}
                className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-xs font-bold transition-all shrink-0 inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-zinc-300 border-collapse">
              <thead className="bg-slate-50/70 dark:bg-white/5 text-[11px] uppercase font-bold text-slate-400 dark:text-zinc-400 border-b border-slate-100 dark:border-white/5">
                <tr>
                  <th className="py-2.5 px-4">#</th>
                  <th className="py-2.5 px-4">ইমেইল এড্রেস</th>
                  <th className="py-2.5 px-4">স্ট্যাটাস</th>
                  <th className="py-2.5 px-4">সাবস্ক্রাইব তারিখ (২৪ ঘণ্টা)</th>
                  <th className="py-2.5 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs font-sans">
                {subsLoading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-500" />
                      লোড হচ্ছে...
                    </td>
                  </tr>
                ) : subscriberList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      কোনো সাবস্ক্রাইবার পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  subscriberList.map((sub, idx) => {
                    const ts = formatTimestamp(sub.subscribed_at);
                    return (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors"
                      >
                        <td className="py-2.5 px-4 font-mono text-slate-400">
                          {(subPage - 1) * subPageSize + idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                          {sub.email}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            {sub.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                          {ts.full}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() =>
                              handleDeleteSubscriber(sub.id, sub.email)
                            }
                            disabled={deletingId === sub.id}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {subscriberTotalPages > 1 && (
            <div className="p-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">
                পৃষ্ঠা {subPage} / {subscriberTotalPages}
              </span>
              <Pagination
                currentPage={subPage}
                totalPages={subscriberTotalPages}
                pageSize={subPageSize}
                totalCount={subscriberCount}
                onPageChange={(p) => setSubPage(p)}
                onPageSizeChange={(s) => {
                  setSubPageSize(s);
                  setSubPage(1);
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
