'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import {
  Users,
  Trash2,
  Search,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw,
  Smartphone,
  UserCheck,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Flame,
  MousePointerClick,
  CheckCircle2,
  ArrowUpRight,
  BarChart3,
  Layout,
  Menu,
  BookOpen,
  PanelBottom,
  Layers,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/admin/questions/pagination';
import { exportToCSV } from '@/lib/utils/export-csv';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Types ---
interface TopConvertingPost {
  slug: string;
  appDownloads: number;
  signups: number;
  total: number;
}

interface RecentConversion {
  id: string;
  event_type: string;
  source_slug: string;
  source_category?: string;
  button_location: string;
  created_at: string;
}

export interface ButtonBreakdownItem {
  location: string;
  nameBn: string;
  nameEn: string;
  totalClicks: number;
  appDownloads: number;
  signups: number;
  practiceClicks?: number;
  percentage: number;
}

interface BlogMetrics {
  subscribers: number;
  totalAppDownloads?: number;
  todayAppDownloads?: number;
  totalSignups?: number;
  todaySignups?: number;
  totalConversions?: number;
  topConvertingPosts?: TopConvertingPost[];
  recentConversions?: RecentConversion[];
  buttonBreakdown?: ButtonBreakdownItem[];
  tableExists?: boolean;
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscribed_at: string;
}

export default function BlogManagementClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // 24-hour timestamp formatter
  const formatTimestamp24h = (dateStr?: string | null) => {
    if (!dateStr) return { date: 'N/A', time: '', full: 'N/A' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: 'N/A', time: '', full: 'N/A' };

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds}`,
      full: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
    };
  };

  // Metric Cards with Auto-Refresh every 30s
  const {
    data: metrics,
    isLoading: metricsLoading,
    mutate: mutateMetrics,
  } = useSWR<BlogMetrics>('/api/admin/blog/metrics', fetcher, {
    refreshInterval: 30000,
  });

  // Content Table
  const {
    data: responseData,
    error,
    mutate,
    isLoading: dataLoading,
  } = useSWR<{ data: Subscriber[]; totalCount: number }>(
    `/api/admin/blog/data?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(debouncedSearch)}`,
    fetcher,
  );

  const listData = responseData?.data || [];
  const totalCount = responseData?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleDeleteSubscriber = async (id: string, email: string) => {
    if (
      !confirm(
        `আপনি কি নিশ্চিত যে ${email} সাবস্ক্রাইবার তালিকা থেকে মুছে ফেলতে চান?`,
      )
    )
      return;

    setDeletingId(id);

    try {
      const res = await fetch('/api/admin/blog/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Failed to remove subscriber');

      toast.success('সাবস্ক্রাইবার সফলভাবে মুছে ফেলা হয়েছে।');
      mutate();
      mutateMetrics();
    } catch (err: unknown) {
      toast.error('সাবস্ক্রাইবার মুছতে সমস্যা হয়েছে!');
    } finally {
      setDeletingId(null);
    }
  };

  const exportData = () => {
    if (!listData || listData.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো ডেটা নেই');
      return;
    }

    const success = exportToCSV({
      filename: `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`,
      headers: [
        'Subscriber ID',
        'Email Address',
        'Status',
        'Subscribed Date & Time (24h)',
      ],
      rows: listData.map((s) => [
        s.id,
        s.email,
        s.status,
        formatTimestamp24h(s.subscribed_at).full,
      ]),
    });
    if (success) toast.success('সাবস্ক্রাইবার তালিকা সফলভাবে ডাউনলোড হয়েছে');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── Table Not Migrated Warning Banner (if applicable) ── */}
      {metrics && metrics.tableExists === false && (
        <div className="p-4 sm:p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3.5 shadow-card">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              কনভার্শন ট্র্যাকিং টেবিল মাইগ্রেশন প্রয়োজন
            </h4>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed font-sans">
              ব্লগ ভিজিটরদের অ্যাপ ডাউনলোড ও রেজিস্ট্রেশন ক্লিক লাইভ ট্র্যাক করতে আপনার Supabase SQL Editor এ{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-200/50 dark:bg-amber-900/50 font-mono text-[11px]">
                sql/migrations/20261004_create_blog_conversions.sql
              </code>{' '}
              ফাইলটির কোড রান করুন।
            </p>
          </div>
        </div>
      )}

      {/* ── 1. NIOND SOFT-PASTEL BENTO KPI GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: App Downloads (Soft Mint Lime) */}
        <div className="bg-[#c2f2d0] dark:bg-[#1a3828] text-slate-900 dark:text-emerald-100 rounded-3xl p-6 shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/10 dark:bg-white/10 backdrop-blur-sm">
              <Smartphone className="w-3.5 h-3.5 opacity-80" />
              <span>অ্যাপ ডাউনলোড</span>
            </div>
            {metrics?.todayAppDownloads !== undefined && metrics.todayAppDownloads > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full text-emerald-900 bg-emerald-500/20 dark:text-emerald-200">
                +{metrics.todayAppDownloads} আজ
              </span>
            )}
          </div>
          <div className="my-2">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white font-sans select-all">
              {metricsLoading ? '...' : (metrics?.totalAppDownloads ?? 0).toLocaleString('bn-BD')}
            </h3>
          </div>
          <p className="text-xs font-medium text-slate-700/80 dark:text-emerald-200/70 truncate">
            Play Store ডাউনলোড বাটন
          </p>
        </div>

        {/* Metric 2: Signups / Dashboard (Soft Periwinkle Blue) */}
        <div className="bg-[#d0e2ff] dark:bg-[#1e2f4a] text-slate-900 dark:text-blue-100 rounded-3xl p-6 shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/10 dark:bg-white/10 backdrop-blur-sm">
              <UserCheck className="w-3.5 h-3.5 opacity-80" />
              <span>রেজিস্ট্রেশন ক্লিক</span>
            </div>
            {metrics?.todaySignups !== undefined && metrics.todaySignups > 0 && (
              <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full text-blue-900 bg-blue-500/20 dark:text-blue-200">
                +{metrics.todaySignups} আজ
              </span>
            )}
          </div>
          <div className="my-2">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white font-sans select-all">
              {metricsLoading ? '...' : (metrics?.totalSignups ?? 0).toLocaleString('bn-BD')}
            </h3>
          </div>
          <p className="text-xs font-medium text-slate-700/80 dark:text-blue-200/70 truncate">
            ফ্রি এক্সাম ও একাউন্ট তৈরি
          </p>
        </div>

        {/* Metric 3: Newsletter Subscribers (Soft Pastel Lavender) */}
        <div className="bg-[#e0d6ff] dark:bg-[#2b214a] text-slate-900 dark:text-purple-100 rounded-3xl p-6 shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-black/10 dark:bg-white/10 backdrop-blur-sm">
              <Mail className="w-3.5 h-3.5 opacity-80" />
              <span>নিউজলেটার</span>
            </div>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full text-purple-900 bg-purple-500/20 dark:text-purple-200">
              Active List
            </span>
          </div>
          <div className="my-2">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white font-sans select-all">
              {metricsLoading ? '...' : (metrics?.subscribers ?? 0).toLocaleString('bn-BD')}
            </h3>
          </div>
          <p className="text-xs font-medium text-slate-700/80 dark:text-purple-200/70 truncate">
            সক্রিয় ইমেইল সাবস্ক্রাইবার
          </p>
        </div>

        {/* Metric 4: Total Conversions (High-Contrast Forest Teal Banner) */}
        <div className="bg-[#0a666b] dark:bg-[#074f53] text-white rounded-3xl p-6 shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-sm text-teal-100">
              <MousePointerClick className="w-3.5 h-3.5 text-[#c6f634]" />
              <span>মোট কনভার্শন</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#c6f634] animate-pulse" />
          </div>
          <div className="my-2">
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans select-all">
              {metricsLoading ? '...' : (metrics?.totalConversions ?? 0).toLocaleString('bn-BD')}
            </h3>
          </div>
          <p className="text-xs font-medium text-teal-100/80 truncate">
            ব্লগ থেকে প্ল্যাটফর্মে রিডাইরেক্ট
          </p>
        </div>
      </div>

      {/* ── 2. REAL-TIME CONVERSION ATTRIBUTION SECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left (7 Cols): Top Converting Blog Posts */}
        <div className="lg:col-span-7 bg-white dark:bg-[#151515] rounded-3xl border border-slate-100/80 dark:border-zinc-800/80 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Flame className="w-5 h-5 fill-amber-500/20" />
                </div>
                <div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                    টপ কনভার্টিং আর্টিকেল
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
                    যেসব পোস্ট পড়ে শিক্ষার্থীরা সবচেয়ে বেশি অ্যাপ ও প্ল্যাটফর্মে গেছে
                  </p>
                </div>
              </div>
            </div>

            {/* Post List */}
            {metrics?.topConvertingPosts && metrics.topConvertingPosts.length > 0 ? (
              <div className="space-y-3">
                {metrics.topConvertingPosts.map((post, idx) => (
                  <div
                    key={post.slug}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-white dark:bg-zinc-800 text-slate-800 dark:text-slate-200 flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-xs border border-slate-200/60 dark:border-zinc-700/60">
                        {idx + 1}
                      </span>
                      <div className="truncate min-w-0">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate block"
                          title={post.slug}
                        >
                          {post.slug}
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto font-mono text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-[#c2f2d0] dark:bg-[#1a3828] text-slate-950 dark:text-emerald-200 font-bold text-[11px] shadow-xs">
                        📱 {post.appDownloads} অ্যাপ
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-[#d0e2ff] dark:bg-[#1e2f4a] text-slate-950 dark:text-blue-200 font-bold text-[11px] shadow-xs">
                        🎓 {post.signups} সাইনআপ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-14 text-center">
                <MousePointerClick className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 dark:text-zinc-400">
                  এখনও কোনো কনভার্শন রেকর্ড হয়নি। ব্লগে ক্লিক হওয়া মাত্র এখানে তালিকা দৃশ্যমান হবে।
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right (5 Cols): Live Activity Stream */}
        <div className="lg:col-span-5 bg-white dark:bg-[#151515] rounded-3xl border border-slate-100/80 dark:border-zinc-800/80 p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-zinc-800/80 mb-5">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#c6f634] ring-4 ring-emerald-500/20 animate-pulse" />
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  রিয়েলটাইম কনভার্শন ফিড
                </h3>
              </div>
              <button
                onClick={() => mutateMetrics()}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stream List */}
            {metrics?.recentConversions && metrics.recentConversions.length > 0 ? (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {metrics.recentConversions.map((conv) => {
                  const isApp = conv.event_type === 'app_download';
                  const ts = formatTimestamp24h(conv.created_at);
                  return (
                    <div
                      key={conv.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs hover:border-slate-200 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                            isApp
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                          }`}
                        >
                          {isApp ? (
                            <Smartphone className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {isApp ? 'Play Store ক্লিক' : 'রেজিস্ট্রেশন ক্লিক'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {conv.source_slug} ({conv.button_location})
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end text-right font-mono shrink-0">
                        <span className="text-[10px] font-bold text-slate-700 dark:text-zinc-300">
                          {ts.date}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {ts.time}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-14 text-center text-xs text-slate-400">
                নতুন কোনো ক্লিক অ্যাক্টিভিটি নেই
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. BUTTON & PLACEMENT CONVERSION ANALYTICS ── */}
      <div className="bg-white dark:bg-[#151515] rounded-3xl border border-slate-100/80 dark:border-zinc-800/80 shadow-card overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  বাটন ও প্লেসমেন্ট ট্র্যাকিং (Play Store vs Website)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/70 text-teal-800 dark:text-teal-300 font-mono">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
                কোন বাটন থেকে প্লে-স্টোর অ্যাপ ইনস্টল এবং কোনটি থেকে ওয়েবসাইট রেজিস্ট্রেশন হচ্ছে তা নিখুঁত মনিটরিং
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
            <button
              onClick={() => mutateMetrics()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${metricsLoading ? 'animate-spin' : ''}`} />
              <span>রিফ্রেশ</span>
            </button>
          </div>
        </div>

        {/* Legend / Clarification Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 sm:p-5 bg-slate-50/70 dark:bg-zinc-900/40 border-b border-slate-100 dark:border-zinc-800/80 text-xs font-sans">
          {/* Card 1: Play Store App */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-emerald-500/20 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-xs">
                Google Play Store অ্যাপ
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                Android অ্যাপ ইনস্টল/ডাউনলোড ক্লিক
              </p>
            </div>
          </div>

          {/* Card 2: Website Register */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-cyan-500/20 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-xs">
                Website রেজিস্ট্রেশন
              </p>
              <p className="text-[11px] text-cyan-700 dark:text-cyan-300/80">
                obhyash.com ব্রাউজারে সাইন-আপ ক্লিক
              </p>
            </div>
          </div>

          {/* Card 3: Website Free Practice */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-zinc-900 border border-amber-500/20 shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-xs">
                Website ফ্রি এক্সাম
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/80">
                ওয়েবসাইটে ডেমো বা ফ্রি টেস্ট ক্লিক
              </p>
            </div>
          </div>
        </div>

        {/* Content Table & Cards */}
        <div className="p-5 sm:p-6">
          {metrics?.buttonBreakdown && metrics.buttonBreakdown.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-semibold font-sans uppercase tracking-wider text-[11px]">
                    <th className="pb-3 pl-2">বাটনের নাম ও অবস্থান</th>
                    <th className="pb-3 text-center">মোট ক্লিক</th>
                    <th className="pb-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                        <Smartphone className="w-3.5 h-3.5" />
                        Play Store অ্যাপ
                      </span>
                    </th>
                    <th className="pb-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-cyan-700 dark:text-cyan-400 font-bold">
                        <Globe className="w-3.5 h-3.5" />
                        Website রেজিস্ট্রেশন
                      </span>
                    </th>
                    <th className="pb-3 text-center">
                      <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                        <Sparkles className="w-3.5 h-3.5" />
                        Web ফ্রি এক্সাম
                      </span>
                    </th>
                    <th className="pb-3 text-right pr-2">শেয়ার (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-sans">
                  {metrics.buttonBreakdown.map((item) => {
                    const getLocationIcon = (loc: string) => {
                      switch (loc) {
                        case 'mobile_sticky':
                        case 'quick_action':
                          return <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
                        case 'header':
                          return <Layout className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
                        case 'drawer':
                          return <Menu className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
                        case 'in_article':
                          return <BookOpen className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
                        case 'footer':
                          return <PanelBottom className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
                        case 'sidebar':
                          return <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
                        default:
                          return <MousePointerClick className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
                      }
                    };

                    const practiceCount = item.practiceClicks || 0;

                    return (
                      <tr
                        key={item.location}
                        className="hover:bg-slate-50/70 dark:hover:bg-zinc-900/50 transition-colors group"
                      >
                        {/* Button Name & Location */}
                        <td className="py-4 pl-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                              {getLocationIcon(item.location)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                                {item.nameBn}
                              </p>
                              <span className="font-mono text-[10px] text-slate-400">
                                {item.nameEn}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Total Clicks */}
                        <td className="py-4 text-center">
                          <span className="font-mono font-bold text-sm text-slate-900 dark:text-white px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50">
                            {item.totalClicks.toLocaleString('bn-BD')}
                          </span>
                        </td>

                        {/* Play Store App Downloads */}
                        <td className="py-4 text-center">
                          {item.appDownloads > 0 ? (
                            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs px-2.5 py-1 rounded-full bg-[#c2f2d0] dark:bg-[#1a3828] text-emerald-950 dark:text-emerald-200 border border-emerald-500/20 shadow-xs">
                              <Smartphone className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                              {item.appDownloads.toLocaleString('bn-BD')} টি Play Store
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 dark:text-zinc-600">০</span>
                          )}
                        </td>

                        {/* Website Signups */}
                        <td className="py-4 text-center">
                          {item.signups > 0 ? (
                            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs px-2.5 py-1 rounded-full bg-[#d0e2ff] dark:bg-[#1e2f4a] text-blue-950 dark:text-blue-200 border border-blue-500/20 shadow-xs">
                              <Globe className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                              {item.signups.toLocaleString('bn-BD')} টি Website
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 dark:text-zinc-600">০</span>
                          )}
                        </td>

                        {/* Website Free Practice Exam */}
                        <td className="py-4 text-center">
                          {practiceCount > 0 ? (
                            <span className="inline-flex items-center gap-1.5 font-mono font-bold text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border border-amber-500/20 shadow-xs">
                              <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              {practiceCount.toLocaleString('bn-BD')} টি Web Exam
                            </span>
                          ) : (
                            <span className="font-mono text-slate-400 dark:text-zinc-600">০</span>
                          )}
                        </td>

                        {/* Share (%) */}
                        <td className="py-4 text-right pr-2">
                          <div className="flex flex-col items-end gap-1">
                            <span className="font-mono font-bold text-xs text-slate-700 dark:text-zinc-300">
                              {item.percentage}%
                            </span>
                            <div className="w-24 sm:w-28 h-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, item.percentage)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              <MousePointerClick className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto mb-2" />
              এখনও কোনো বাটন ক্লিক ডাটা পাওয়া যায়নি।
            </div>
          )}
        </div>
      </div>

      {/* ── 4. NEWSLETTER SUBSCRIBERS TABLE (NIOND BENTO CARD) ── */}
      <div className="bg-white dark:bg-[#151515] rounded-3xl border border-slate-100/80 dark:border-zinc-800/80 shadow-card overflow-hidden">
        {/* Toolbar region */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-zinc-800/80 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#e0d6ff] dark:bg-[#2b214a] text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                নিউজলেটার সাবস্ক্রাইবার তালিকা
              </h2>
              <p className="text-xs text-slate-400 dark:text-zinc-400 mt-0.5">
                মোট {totalCount.toLocaleString('bn-BD')} জন সক্রিয় গ্রাহক
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ইমেইল দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#c6f634]/50 transition-all"
              />
            </div>

            {/* Export CSV button - Niond Neo-Lime Pill */}
            <button
              onClick={exportData}
              disabled={listData.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#c6f634] hover:bg-[#b8ea27] text-slate-950 text-xs font-bold rounded-full shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>CSV ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-zinc-400 font-sans border-collapse">
            <thead className="bg-slate-50/70 dark:bg-zinc-900/40 text-[11px] uppercase font-bold text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">ইমেইল এড্রেস</th>
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4">তারিখ ও সময় (২৪ ঘণ্টা)</th>
                <th className="px-6 py-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 dark:divide-zinc-800/60 text-xs">
              {dataLoading ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-[#0a666b] mx-auto mb-2" />
                    <span className="text-xs font-medium text-slate-400">লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : listData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-slate-400 font-medium">
                    কোনো সাবস্ক্রাইবার পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                listData.map((sub, idx) => {
                  const ts = formatTimestamp24h(sub.subscribed_at);
                  const isDeleting = deletingId === sub.id;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-zinc-100">
                        {sub.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#c2f2d0] dark:bg-[#1a3828] text-emerald-950 dark:text-emerald-200">
                          {sub.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-zinc-400">
                        {ts.date} <span className="opacity-70">{ts.time}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                          disabled={isDeleting}
                          className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors disabled:opacity-50"
                          title="মুছে ফেলুন"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="p-5 sm:p-6 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>
    </div>
  );
}
