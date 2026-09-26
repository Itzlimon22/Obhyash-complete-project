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
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/admin/questions/pagination';
import { exportToCSV } from '@/lib/utils/export-csv';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// --- Types ---
interface BlogMetrics {
  subscribers: number;
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

  // Aesthetic Metric Cards
  const { data: metrics, isLoading: metricsLoading, mutate: mutateMetrics } = useSWR<BlogMetrics>(
    '/api/admin/blog/metrics',
    fetcher,
  );

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
    <div className="space-y-8">
      {/* 1. Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="মোট নিউজলেটার সাবস্ক্রাইবার"
          value={metrics?.subscribers ?? 0}
          icon={Mail}
          loading={metricsLoading}
          color="blue"
        />
      </div>

      {/* 2. Main Container for Table */}
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
              <p className="font-semibold text-lg">কোনো সাবস্ক্রাইবার পাওয়া যায়নি</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-[#2b2b2b] text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-black/50">
                  <th className="px-6 py-4">ইমেইল এড্রেস</th>
                  <th className="px-6 py-4">সাবস্ক্রিপশন সময় (24h)</th>
                  <th className="px-6 py-4">স্ট্যাটাস</th>
                  <th className="px-6 py-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2b2b2b]">
                {listData.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-slate-50 dark:hover:bg-[#1a1a1a]/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {sub.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col text-xs text-slate-500 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {formatTimestamp24h(sub.subscribed_at).date}
                        </span>
                        <span className="flex items-center gap-1 pl-4 text-[11px] text-slate-400">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimestamp24h(sub.subscribed_at).time}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-inset ring-emerald-600/20">
                        {sub.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() =>
                          handleDeleteSubscriber(sub.id, sub.email)
                        }
                        disabled={deletingId === sub.id}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
                        title="মুছে ফেলুন (Delete)"
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
            </table>
          )}
        </div>

        {/* Pagination Section */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-[#2b2b2b] flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-xs text-slate-500">
              মোট {totalCount} টি সাবস্ক্রিপশনের মধ্যে {(page - 1) * pageSize + 1} -{' '}
              {Math.min(page * pageSize, totalCount)} টি দেখানো হচ্ছে
            </span>
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
  value: number;
  icon: any;
  loading?: boolean;
  color?: 'blue' | 'rose' | 'emerald';
}

function MetricCard({
  title,
  value,
  icon: Icon,
  loading = false,
  color = 'blue',
}: MetricCardProps) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  };

  return (
    <div className="bg-white dark:bg-[#121212] p-5 rounded-3xl border border-slate-200 dark:border-[#2b2b2b] shadow-sm flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {loading ? (
          <div className="h-7 w-16 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {value.toLocaleString('bn-BD')}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-2xl ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}
