'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
  RefreshCcw,
  AlertTriangle,
  Eye,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  School,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { ReportHealthBar } from '@/components/admin/reports/report-health-bar';
import { ReportInspectorDrawer } from '@/components/admin/reports/report-inspector-drawer';
import { ReportBulkActions } from '@/components/admin/reports/report-bulk-actions';
import { MathRenderer } from '@/components/common/MathRenderer';

const REASON_PILLS = [
  { id: 'All', label: 'সকল ধরণ' },
  { id: 'ভুল উত্তর', label: '❌ ভুল উত্তর (Wrong Answer)' },
  { id: 'টাইপো', label: '✏️ টাইপো ও বানান (Typo)' },
  { id: 'ছবি', label: '🖼️ ছবি / ডায়াগ্রাম সমস্যা' },
  { id: 'ব্যাখ্যা', label: '📖 ব্যাখ্যায় ত্রুটি' },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    'All' | 'Pending' | 'Resolved' | 'Ignored'
  >('Pending');
  const [filterReason, setFilterReason] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const pageSize = 20;

  // Selection & Inspector
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectingReport, setInspectingReport] = useState<any | null>(null);
  const [serverStats, setServerStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    ignored: 0,
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (filterStatus !== 'All') params.set('status', filterStatus);
      if (filterReason !== 'All') params.set('reason', filterReason);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setReports(json.data.reports || []);
        setTotalReports(json.data.count || 0);
        if (json.data.stats) {
          setServerStats(json.data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('রিপোর্ট লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterReason, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterStatus, filterReason, page, searchQuery]);

  // Selection helpers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === reports.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(reports.map((r) => r.id));
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalReports / pageSize));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
              কোয়ালিটি অডিট ও রিপোর্ট কমান্ড সেন্টার • Quality Assurance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            প্রশ্ন রিপোর্ট ও সমাধান ব্যবস্থাপনা
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
            শিক্ষার্থীদের পাঠানো প্রশ্নের ভুলত্রুটি রিভিউ, ১-ক্লিক ইনলাইন সমাধান ও প্রো রিওয়ার্ড প্রদান
          </p>
        </div>

        <button
          onClick={fetchReports}
          className="px-4 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} />
          <span>রিফ্রেশ</span>
        </button>
      </div>

      {/* ── Live Health Metrics Bar ── */}
      <ReportHealthBar
        stats={serverStats}
        activeFilter={filterStatus}
        onSelectFilter={(st) => setFilterStatus(st)}
      />

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-96">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম, কারণ বা প্রশ্ন খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-neutral-900 dark:text-white"
            />
          </div>

          {/* Reason Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {REASON_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterReason(pill.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                  filterReason === pill.id
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-600 dark:text-zinc-400 hover:border-neutral-400'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reports Table ── */}
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-neutral-200 dark:border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-zinc-900/60 border-b border-neutral-200 dark:border-zinc-800 text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      reports.length > 0 &&
                      selectedIds.length === reports.length
                    }
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">রিপোর্টকারী শিক্ষার্থী</th>
                <th className="p-4">প্রশ্নের সারাংশ</th>
                <th className="p-4">সমস্যার কারণ ও মন্তব্য</th>
                <th className="p-4">তারিখ</th>
                <th className="p-4">অবস্থা (Status)</th>
                <th className="p-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/60 text-xs">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-neutral-500 font-mono text-xs"
                  >
                    রিপোর্ট ডাটাবেজ লোড হচ্ছে...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-neutral-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <CheckCircle2
                        className="mx-auto text-emerald-500"
                        size={36}
                      />
                      <p className="font-bold text-neutral-800 dark:text-zinc-200 text-sm">
                        কোনো পেন্ডিং রিপোর্ট নেই!
                      </p>
                      <p className="text-xs text-neutral-400">
                        প্রশ্ন ব্যাংকের সকল রিপোর্ট সমাধান করা হয়েছে।
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((r) => {
                  const isSelected = selectedIds.includes(r.id);
                  const reporter = r.reporter || {};
                  const question = r.question;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-neutral-50 dark:hover:bg-zinc-850/40 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                          : ''
                      }`}
                      onClick={() => setInspectingReport(r)}
                    >
                      {/* Checkbox */}
                      <td
                        className="p-4 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(r.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(r.id)}
                          className="w-4 h-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* Reporter Info */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                            style={{
                              backgroundColor:
                                reporter.avatar_color || '#059669',
                            }}
                          >
                            {reporter.name?.charAt(0)?.toUpperCase() || 'S'}
                          </div>
                          <div>
                            <p className="font-bold text-neutral-900 dark:text-white">
                              {reporter.name || r.reporter_name || 'শিক্ষার্থী'}
                            </p>
                            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 truncate max-w-[140px]">
                              {reporter.institute || 'প্রতিষ্ঠান অনুল্লেখিত'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Question Snippet */}
                      <td className="p-4">
                        {question ? (
                          <div className="space-y-1 max-w-xs">
                            <div className="line-clamp-2 text-neutral-900 dark:text-zinc-200 font-medium text-xs">
                              <MathRenderer text={question.question || ''} />
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                              <span className="font-semibold text-emerald-600">
                                {question.subject}
                              </span>
                              {question.chapter && (
                                <span className="truncate max-w-[120px]">
                                  {question.chapter}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-xs italic">
                            প্রশ্নটি পাওয়া যায়নি
                          </span>
                        )}
                      </td>

                      {/* Problem Reason */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-black inline-block">
                            {r.reason}
                          </span>
                          {r.description && (
                            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 line-clamp-1">
                              {r.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="p-4 text-neutral-500 dark:text-zinc-400 text-[11px] font-mono whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span>
                            {new Date(r.created_at).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {new Date(r.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                              hour12: false,
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            r.status === 'Pending'
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-900/60'
                              : r.status === 'Resolved'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/60'
                              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          {r.status === 'Pending'
                            ? 'অপেক্ষমাণ'
                            : r.status === 'Resolved'
                            ? 'সমাধানকৃত'
                            : 'বাতিলকৃত'}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td
                        className="p-4 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => setInspectingReport(r)}
                          className="px-3 py-1.5 bg-[#004633] hover:bg-[#005a42] text-white rounded-xl text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer shadow-sm"
                          title="রিপোর্ট পরিদর্শন ও ইনলাইন ফিক্স"
                        >
                          <Eye size={13} />
                          <span>পরিদর্শন</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ── */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-neutral-100 dark:border-zinc-800/80 flex items-center justify-between text-xs text-neutral-500">
            <span>
              মোট {totalReports} টির মধ্যে {(page - 1) * pageSize + 1}-
              {Math.min(page * pageSize, totalReports)} টি প্রদর্শিত
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono font-bold text-neutral-800 dark:text-white px-2">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Side-by-Side Inspector & Quick Fix Drawer ── */}
      <ReportInspectorDrawer
        report={inspectingReport}
        isOpen={!!inspectingReport}
        onClose={() => setInspectingReport(null)}
        onUpdate={fetchReports}
      />

      {/* ── Sticky Mass Bulk Actions Toolbar ── */}
      <ReportBulkActions
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onRefresh={fetchReports}
      />
    </div>
  );
}
