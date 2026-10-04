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

interface BlogMetrics {
  subscribers: number;
  totalAppDownloads?: number;
  todayAppDownloads?: number;
  totalSignups?: number;
  todaySignups?: number;
  totalConversions?: number;
  topConvertingPosts?: TopConvertingPost[];
  recentConversions?: RecentConversion[];
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

  // Aesthetic Metric Cards with Auto-Refresh every 30s
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Table Not Migrated Warning Banner (if applicable) ── */}
      {metrics && metrics.tableExists === false && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex items-start gap-3.5">
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

      {/* ── 1. Conversion & Traffic KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: App Downloads */}
        <MetricCard
          title="অ্যাপ ডাউনলোড ক্লিক"
          subtitle="Play Store ডাউনলোড বাটন"
          value={metrics?.totalAppDownloads ?? 0}
          badge={
            metrics?.todayAppDownloads !== undefined && metrics.todayAppDownloads > 0
              ? `+${metrics.todayAppDownloads} আজ`
              : undefined
          }
          icon={Smartphone}
          loading={metricsLoading}
          color="emerald"
        />

        {/* Metric 2: Signups / Dashboard */}
        <MetricCard
          title="রেজিস্ট্রেশন ও ড্যাশবোর্ড ক্লিক"
          subtitle="ফ্রি এক্সাম ও একাউন্ট তৈরি"
          value={metrics?.totalSignups ?? 0}
          badge={
            metrics?.todaySignups !== undefined && metrics.todaySignups > 0
              ? `+${metrics.todaySignups} আজ`
              : undefined
          }
          icon={UserCheck}
          loading={metricsLoading}
          color="blue"
        />

        {/* Metric 3: Newsletter Subscribers */}
        <MetricCard
          title="নিউজলেটার সাবস্ক্রাইবার"
          subtitle="সক্রিয় ইমেইল রিডার"
          value={metrics?.subscribers ?? 0}
          icon={Mail}
          loading={metricsLoading}
          color="rose"
        />

        {/* Metric 4: Total Conversion Actions */}
        <MetricCard
          title="মোট কনভার্শন অ্যাকশন"
          subtitle="ব্লগ থেকে প্ল্যাটফর্মে রিডাইরেক্ট"
          value={metrics?.totalConversions ?? 0}
          icon={MousePointerClick}
          loading={metricsLoading}
          color="indigo"
        />
      </div>

      {/* ── 2. Real-time Conversion Attribution Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 Cols): Top Converting Blog Posts */}
        <div className="lg:col-span-7 bg-white dark:bg-[#121212] rounded-3xl border border-slate-200 dark:border-[#2b2b2b] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    টপ কনভার্টিং ব্লগ আর্টিকেল (Top Converting Posts)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
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
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                        {idx + 1}
                      </span>
                      <div className="truncate min-w-0">
                        <Link
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-rose-600 dark:hover:text-rose-400 transition-colors truncate block"
                          title={post.slug}
                        >
                          {post.slug}
                        </Link>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto font-mono text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                        📱 {post.appDownloads} অ্যাপ
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/40">
                        🎓 {post.signups} সাইনআপ
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <MousePointerClick className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  এখনও কোনো কনভার্শন রেকর্ড হয়নি। ব্লগে ক্লিক হওয়া মাত্র এখানে তালিকা দৃশ্যমান হবে।
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right (5 Cols): Live Activity Stream */}
        <div className="lg:col-span-5 bg-white dark:bg-[#121212] rounded-3xl border border-slate-200 dark:border-[#2b2b2b] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  রিয়েলটাইম কনভার্শন ফিড (Live Stream)
                </h3>
              </div>
              <button
                onClick={() => mutateMetrics()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title="রিফ্রেশ করুন"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stream List */}
            {metrics?.recentConversions && metrics.recentConversions.length > 0 ? (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                {metrics.recentConversions.map((conv) => {
                  const isApp = conv.event_type === 'app_download';
                  return (
                    <div
                      key={conv.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isApp
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {isApp ? (
                            <Smartphone className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </span>
                        <div className="truncate">
                          <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                            {isApp ? 'Play Store ক্লিক' : 'রেজিস্ট্রেশন ক্লিক'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {conv.source_slug} ({conv.button_location})
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatTimestamp24h(conv.created_at).time}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                নতুন কোনো ক্লিক অ্যাক্টিভিটি নেই
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Newsletter Subscribers Table ── */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl border border-slate-200 dark:border-[#2b2b2b] shadow-sm overflow-hidden">
        {/* Toolbar region */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#2b2b2b] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-rose-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              নিউজলেটার সাবস্ক্রাইবার তালিকা ({totalCount})
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ইমেইল দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#2b2b2b] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>

            {/* Export CSV button */}
            <button
              onClick={exportData}
              disabled={listData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV ডাউনলোড</span>
            </button>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400 font-sans">
            <thead className="bg-slate-50 dark:bg-black/40 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#2b2b2b]">
              <tr>
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">ইমেইল এড্রেস</th>
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4">তারিখ ও সময় (২৪ ঘণ্টা)</th>
                <th className="px-6 py-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#242424]">
              {dataLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-500 mx-auto mb-2" />
                    <span className="text-xs">লোড হচ্ছে...</span>
                  </td>
                </tr>
              ) : listData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
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
                      className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {sub.email}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40">
                          {sub.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {ts.date} {ts.time}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                          disabled={isDeleting}
                          className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
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
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-[#2b2b2b] flex items-center justify-between">
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

// ----------------------------------------------------
// Auxiliary Components
// ----------------------------------------------------

interface MetricCardProps {
  title: string;
  subtitle?: string;
  value: number;
  badge?: string;
  icon: any;
  loading?: boolean;
  color?: 'blue' | 'rose' | 'emerald' | 'indigo' | 'amber';
}

function MetricCard({
  title,
  subtitle,
  value,
  badge,
  icon: Icon,
  loading = false,
  color = 'blue',
}: MetricCardProps) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="bg-white dark:bg-[#121212] p-5 rounded-3xl border border-slate-200 dark:border-[#2b2b2b] shadow-sm flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          ) : (
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {value.toLocaleString('bn-BD')}
            </p>
          )}

          {badge && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-sans">
            {subtitle}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-2xl ${colorMap[color]} shrink-0 ml-2`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
