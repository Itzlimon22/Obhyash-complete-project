'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AppFeatureRequest, FeatureRequestStatus } from '@/lib/types';
import { getFeatureRequests } from '@/services/feature-request-service';
import {
  Lightbulb,
  RefreshCw,
  Search,
  Loader2,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  Compass,
  RefreshCcw,
  XCircle,
  Layers,
  Download,
  ExternalLink,
} from 'lucide-react';
import { FeatureRequestModal } from '@/components/admin/feature-requests/feature-request-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

import { exportToCSV } from '@/lib/utils/export-csv';

export default function AdminFeatureRequestsPage() {
  const [featureRequests, setFeatureRequests] = useState<AppFeatureRequest[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    FeatureRequestStatus | 'All'
  >('All');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  const [selectedRequest, setSelectedRequest] =
    useState<AppFeatureRequest | null>(null);
  const [serverStats, setServerStats] = useState<{
    total: number;
    underReview: number;
    planned: number;
    inProgress: number;
    completed: number;
    declined: number;
  }>({
    total: 0,
    underReview: 0,
    planned: 0,
    inProgress: 0,
    completed: 0,
    declined: 0,
  });

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRequests();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, statusFilter, searchQuery]);

  const fetchRequests = async (showToast = false) => {
    try {
      const res = await getFeatureRequests(
        statusFilter,
        page,
        pageSize,
        searchQuery,
      );
      setFeatureRequests(res.featureRequests || []);
      setTotalCount(res.count || 0);
      if (res.stats) {
        setServerStats(res.stats);
      }
      if (showToast) toast.success('Feature requests list updated');
    } catch (error) {
      console.error('Failed to fetch feature requests:', error);
      toast.error('Failed to load feature requests');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!featureRequests || featureRequests.length === 0) {
      toast.error('এক্সপোর্ট করার মতো কোনো ফিচার প্রস্তাবনা নেই');
      return;
    }

    const success = exportToCSV({
      filename: `feature_requests_${new Date().toISOString().split('T')[0]}.csv`,
      headers: [
        'Request ID',
        'Student Name',
        'Email',
        'Category',
        'Feature Title',
        'Description',
        'Status',
        'Admin Feedback',
        'Submitted Date & Time (24h)',
      ],
      rows: featureRequests.map((r) => [
        r.id,
        r.user?.name || 'Student',
        r.user?.email || 'N/A',
        r.category,
        r.title || '',
        r.description || '',
        r.status,
        r.admin_feedback || '',
        `${new Date(r.created_at).toLocaleDateString('en-GB')} ${new Date(r.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`,
      ]),
    });

    if (success) {
      toast.success('ফিচার প্রস্তাবনা শিট সফলভাবে ডাউনলোড হয়েছে');
    }
  };

  const getStatusBadge = (status: FeatureRequestStatus) => {
    switch (status) {
      case 'Under Review':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800/40';
      case 'Planned':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/40';
      case 'In Progress':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40';
      case 'Declined':
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5">
            <Lightbulb className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            ব্যবহারকারীদের ফিচার প্রস্তাবনা
          </h1>
          <p className="text-xs md:text-sm text-neutral-500 mt-1">
            শিক্ষার্থীদের পাঠানো নতুন ফিচার আইডিয়া রিভিউ, রোডম্যাপে যুক্ত ও স্ট্যাটাস আপডেট করো
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCSV}
            className="rounded-xl border-neutral-200 dark:border-neutral-800 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRequests(true)}
            className="rounded-xl border-neutral-200 dark:border-neutral-800 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            রিফ্রেশ
          </Button>
        </div>
      </div>

      {/* ── Stats Summary Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500">মোট প্রস্তাব</span>
              <Layers className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-2xl font-black text-neutral-900 dark:text-white mt-1">
              {serverStats.total}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">বিবেচনাধীন</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {serverStats.underReview}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">পরিকল্পিত</span>
              <Compass className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
              {serverStats.planned}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">কাজ চলছে</span>
              <RefreshCcw className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {serverStats.inProgress}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-neutral-200 dark:border-neutral-800 shadow-sm bg-white dark:bg-neutral-900 col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">যুক্ত হয়েছে</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {serverStats.completed}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Search and Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="শিক্ষার্থীর নাম, ইমেইল, ফিচারের নাম বা বিবরণ খুঁজুন..."
            className="w-full pl-9 pr-4 py-2 text-xs md:text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              'All',
              'Under Review',
              'Planned',
              'In Progress',
              'Completed',
              'Declined',
            ] as const
          ).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                statusFilter === s
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-neutral-100 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              {s === 'All'
                ? 'সকল'
                : s === 'Under Review'
                ? 'বিবেচনাধীন'
                : s === 'Planned'
                ? 'পরিকল্পিত'
                : s === 'In Progress'
                ? 'কাজ চলছে'
                : s === 'Completed'
                ? 'যুক্ত হয়েছে'
                : 'বাতিল'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main List / Table ── */}
      {isLoading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <p className="text-xs text-neutral-500 font-medium">ফিচার প্রস্তাব লোড হচ্ছে...</p>
        </div>
      ) : featureRequests.length === 0 ? (
        <Card className="rounded-3xl border-neutral-200 dark:border-neutral-800 p-12 text-center bg-white dark:bg-neutral-900">
          <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-400 mb-3">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white">
            কোনো ফিচার প্রস্তাব পাওয়া যায়নি
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            ফিল্টার পরিবর্তন করুন বা নতুন প্রস্তাব আসার অপেক্ষা করুন।
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {featureRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="p-4 md:p-5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm hover:shadow-md group space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                    {req.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(
                      req.status,
                    )}`}
                  >
                    {req.status === 'Under Review'
                      ? 'বিবেচনাধীন'
                      : req.status === 'Planned'
                      ? 'পরিকল্পিত'
                      : req.status === 'In Progress'
                      ? 'কাজ চলছে'
                      : req.status === 'Completed'
                      ? 'যুক্ত হয়েছে'
                      : 'বাতিল'}
                  </span>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {new Date(req.created_at).toLocaleDateString('en-GB')}{' '}
                    {new Date(req.created_at).toLocaleTimeString('en-GB', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                    })}
                  </span>
                </div>

                <div className="text-xs text-neutral-500 font-medium">
                  শিক্ষার্থী:{' '}
                  {req.user_id ? (
                    <Link
                      href={`/admin/user-management/${req.user_id}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      className="text-neutral-800 dark:text-neutral-200 font-bold hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
                    >
                      <span>{req.user?.name || 'Student'}</span>
                      <ExternalLink size={10} />
                    </Link>
                  ) : (
                    <span className="text-neutral-800 dark:text-neutral-200 font-bold">{req.user?.name || 'Student'}</span>
                  )}{' '}
                  ({req.user?.email || 'N/A'})
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {req.title}
                </h3>
                <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-2 leading-relaxed">
                  {req.description}
                </p>
              </div>

              {req.admin_feedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 text-emerald-600 flex-shrink-0" />
                  <span>অ্যাডমিন মন্তব্য: {req.admin_feedback}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalCount > pageSize && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-neutral-800 text-xs">
          <span className="text-neutral-500">
            মোট {totalCount} টির মধ্যে {(page - 1) * pageSize + 1} -{' '}
            {Math.min(page * pageSize, totalCount)} টি দেখানো হচ্ছে
          </span>
          <div className="flex gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs rounded-xl"
            >
              পূর্ববর্তী
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * pageSize >= totalCount}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs rounded-xl"
            >
              পরবর্তী
            </Button>
          </div>
        </div>
      )}

      {/* ── Resolution Modal ── */}
      {selectedRequest && (
        <FeatureRequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onRefresh={() => fetchRequests()}
        />
      )}
    </div>
  );
}
