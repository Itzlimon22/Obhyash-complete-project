'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import {
  BarChart3,
  MessageSquare,
  Users,
  Trash2,
  Search,
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/admin/questions/pagination';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Types ---
interface BlogMetrics {
  subscribers: number;
  comments: number;
  likes: number;
}

interface Subscriber {
  id: string;
  email: string;
  status: string;
  subscribed_at: string;
}

interface Comment {
  id: string;
  user_id?: string;
  post_slug: string;
  content: string;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export default function BlogManagementClient() {
  const [activeTab, setActiveTab] = useState<'comments' | 'subscribers'>(
    'comments',
  );
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

  // Reset page when tab changes
  useEffect(() => {
    setPage(1);
    setSearchQuery('');
  }, [activeTab]);

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

  // Aesthetic Metric Cards
  const { data: metrics, isLoading: metricsLoading, mutate: mutateMetrics } = useSWR<BlogMetrics>(
    '/api/admin/blog/metrics',
    fetcher,
  );

  // Content Tables
  const {
    data: responseData,
    error,
    mutate,
    isLoading: dataLoading,
  } = useSWR<{ data: Comment[] | Subscriber[]; totalCount: number }>(
    `/api/admin/blog/data?type=${activeTab}&page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(debouncedSearch)}`,
    fetcher,
  );

  const listData = responseData?.data || [];
  const totalCount = responseData?.totalCount || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleDeleteComment = async (id: string) => {
    if (
      !confirm(
        'আপনি কি নিশ্চিত যে এই কমেন্টটি মুছে ফেলতে চান? এই কাজটি পরিবর্তনযোগ্য নয়।',
      )
    )
      return;

    setDeletingId(id);

    try {
      const res = await fetch('/api/admin/blog/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type: 'comment' }),
      });

      if (!res.ok) throw new Error('Failed to delete comment');

      toast.success('কমেন্টটি সফলভাবে মুছে ফেলা হয়েছে।');
      mutate();
      mutateMetrics();
    } catch (err: unknown) {
      toast.error('কমেন্ট মুছতে সমস্যা হয়েছে!');
    } finally {
      setDeletingId(null);
    }
  };

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
        body: JSON.stringify({ id, type: 'subscriber' }),
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

    const csvContent =
      activeTab === 'comments'
        ? [
            ['ID', 'User Name', 'Email', 'Post Slug', 'Comment Content', 'Date & Time (24h)'],
            ...(listData as Comment[]).map((c) => [
              c.id,
              c.user?.name || 'Unknown',
              c.user?.email || 'N/A',
              c.post_slug,
              `"${c.content.replace(/"/g, '""')}"`,
              formatTimestamp24h(c.created_at).full,
            ]),
          ]
            .map((e) => e.join(','))
            .join('\n')
        : [
            ['ID', 'Email', 'Status', 'Subscribed At (24h)'],
            ...(listData as Subscriber[]).map((s) => [
              s.id,
              s.email,
              s.status,
              formatTimestamp24h(s.subscribed_at).full,
            ]),
          ]
            .map((e) => e.join(','))
            .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `blog_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8">
      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="মোট সাবস্ক্রাইবার"
          value={metrics?.subscribers ?? 0}
          icon={Mail}
          loading={metricsLoading}
          color="blue"
        />
        <MetricCard
          title="মোট মন্তব্য"
          value={metrics?.comments ?? 0}
          icon={MessageSquare}
          loading={metricsLoading}
          color="rose"
        />
        <MetricCard
          title="মোট লাইক"
          value={metrics?.likes ?? 0}
          icon={BarChart3}
          loading={metricsLoading}
          color="emerald"
        />
      </div>

      {/* 2. Main Container for Table */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl border border-slate-200 dark:border-[#2b2b2b] shadow-sm overflow-hidden">
        {/* Toolbar region */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-[#2b2b2b] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex bg-slate-100 dark:bg-black p-1 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('comments');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'comments'
                  ? 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              কমেন্ট মডারেশন
            </button>
            <button
              onClick={() => {
                setActiveTab('subscribers');
              }}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'subscribers'
                  ? 'bg-white dark:bg-[#1a1a1a] text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              নিউজলেটার সাবস্ক্রাইবার
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={
                  activeTab === 'comments'
                    ? 'কমেন্ট বা আর্টিকেল দিয়ে খুঁজুন...'
                    : 'ইমেইল দিয়ে খুঁজুন...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-black border border-slate-200 dark:border-[#2b2b2b] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              />
            </div>

            <button
              onClick={() => {
                mutate();
                mutateMetrics();
              }}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-black dark:hover:bg-neutral-900 border border-slate-200 dark:border-[#2b2b2b] rounded-xl text-slate-700 dark:text-slate-300 transition-colors"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw size={16} />
            </button>

            <button
              onClick={exportData}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-black dark:hover:bg-neutral-900 border border-slate-200 dark:border-[#2b2b2b] rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
              title="CSV এক্সপোর্ট"
            >
              <Download size={15} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Table Content Area */}
        <div className="overflow-x-auto min-h-[360px]">
          {dataLoading ? (
            <div className="flex items-center justify-center p-20 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-20 text-red-500">
              <AlertTriangle className="w-10 h-10 mb-4 opacity-50" />
              <p className="font-semibold">ডেটা লোড করতে সমস্যা হয়েছে।</p>
            </div>
          ) : listData.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 text-slate-500">
              <Search className="w-10 h-10 mb-4 opacity-20" />
              <p className="font-semibold text-lg">কোনো ডেটা পাওয়া যায়নি</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              {activeTab === 'comments' ? (
                <>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#2b2b2b] text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-black/50">
                      <th className="px-6 py-4">ইউজার ও তারিখ (24h)</th>
                      <th className="px-6 py-4">আর্টিকেল (Slug)</th>
                      <th className="px-6 py-4">কমেন্ট</th>
                      <th className="px-6 py-4 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2b2b2b]">
                    {(listData as Comment[]).map((comment) => (
                      <tr
                        key={comment.id}
                        className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a]/50 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                              {comment.user?.avatar_url ? (
                                <img
                                  src={comment.user.avatar_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Users className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              {comment.user_id ? (
                                <Link
                                  href={`/admin/user-management/${comment.user_id}`}
                                  className="font-semibold text-slate-900 dark:text-slate-100 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-1"
                                >
                                  {comment.user?.name || 'User'}
                                  <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                              ) : (
                                <p className="font-semibold text-slate-900 dark:text-slate-100">
                                  {comment.user?.name || 'Unknown User'}
                                </p>
                              )}
                              <div className="flex flex-col text-xs text-slate-500 mt-0.5 font-mono">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {formatTimestamp24h(comment.created_at).date}
                                </span>
                                <span className="flex items-center gap-1 pl-4 text-[11px] text-slate-400">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatTimestamp24h(comment.created_at).time}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/blog/${comment.post_slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-500/20 transition-colors"
                          >
                            <span>{comment.post_slug}</span>
                            <ExternalLink size={11} />
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <p
                            className="text-sm text-slate-600 dark:text-slate-300 max-w-md line-clamp-3 leading-relaxed"
                            title={comment.content}
                          >
                            {comment.content}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={deletingId === comment.id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                            title="মুছে ফেলুন (Delete)"
                          >
                            {deletingId === comment.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              ) : (
                <>
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-[#2b2b2b] text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-black/50">
                      <th className="px-6 py-4">ইমেইল এড্রেস</th>
                      <th className="px-6 py-4">সাবস্ক্রিপশন সময় (24h)</th>
                      <th className="px-6 py-4">স্ট্যাটাস</th>
                      <th className="px-6 py-4 text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#2b2b2b]">
                    {(listData as Subscriber[]).map((sub) => (
                      <tr
                        key={sub.id}
                        className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a]/50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-sm">
                              {sub.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col text-xs text-slate-600 dark:text-slate-400 font-mono">
                            <span>{formatTimestamp24h(sub.subscribed_at).date}</span>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock size={11} />
                              {formatTimestamp24h(sub.subscribed_at).time}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                              sub.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full mr-1.5 ${sub.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}
                            ></span>
                            {sub.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                            disabled={deletingId === sub.id}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                            title="মুছে ফেলুন"
                          >
                            {deletingId === sub.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}
            </table>
          )}
        </div>

        {/* 3. Pagination */}
        {!dataLoading && !error && listData && listData.length > 0 && (
          <div className="border-t border-slate-200 dark:border-[#2b2b2b]">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Sub Component: Metric Card
function MetricCard({
  title,
  value,
  icon: Icon,
  loading,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  loading: boolean;
  color: 'blue' | 'rose' | 'emerald';
}) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-100 dark:border-blue-900/30',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-900/30',
    emerald:
      'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30',
  };

  return (
    <div className="bg-white dark:bg-[#121212] p-6 rounded-3xl border border-slate-200 dark:border-[#2b2b2b] shadow-sm flex items-center gap-5">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${colorStyles[color]}`}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
          {title}
        </p>
        <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin mt-1" />
          ) : (
            value.toLocaleString()
          )}
        </p>
      </div>
    </div>
  );
}
