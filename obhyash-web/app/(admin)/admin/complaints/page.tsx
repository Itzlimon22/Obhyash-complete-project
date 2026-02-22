'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { AppComplaint, ComplaintStatus } from '@/lib/types';
import { getComplaints } from '@/services/complaint-service';
import {
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { ComplaintResolutionModal } from '@/components/admin/complaints/complaint-resolution-modal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<AppComplaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'All'>(
    'All',
  );

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalComplaints, setTotalComplaints] = useState(0);
  const pageSize = 20;

  const [selectedComplaint, setSelectedComplaint] =
    useState<AppComplaint | null>(null);

  useEffect(() => {
    // Reset page to 1 when search or filter changes
    setPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchComplaints();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, statusFilter, searchQuery]);

  const fetchComplaints = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    const supabase = createClient();

    try {
      let query = supabase
        .from('app_complaints')
        .select('*, user:users!inner(name, email)', { count: 'exact' });

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      if (searchQuery) {
        query = query.ilike('description', `%${searchQuery}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const {
        data: complaintsData,
        error: complaintsError,
        count,
      } = await query.order('created_at', { ascending: false }).range(from, to);

      if (complaintsError) throw complaintsError;

      // 3. Combine complaints with user info
      const mappedComplaints = (complaintsData || []).map((c: any) => ({
        ...c,
        user:
          c.user && !Array.isArray(c.user)
            ? c.user
            : { name: 'Unknown', email: '' },
      }));

      setComplaints(mappedComplaints);
      if (count !== null) setTotalComplaints(count);

      if (showToast) toast.success('Complaints list updated');
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'In Progress':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Dismissed':
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
      default:
        return 'bg-neutral-100 text-neutral-600';
    }
  };

  const getStatusIcon = (status: ComplaintStatus) => {
    switch (status) {
      case 'Pending':
        return AlertCircle;
      case 'In Progress':
        return Clock;
      case 'Resolved':
        return CheckCircle2;
      case 'Dismissed':
        return AlertTriangle;
      default:
        return AlertCircle;
    }
  };

  // Stats (total across all pages, pending/resolved only for current page for purely visual cues, or omit if inaccurate)

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 lg:p-8 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <AlertTriangle className="text-rose-600" size={24} />
              Complaints
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px] md:text-sm font-medium">
              Manage technical issues and feedback from students
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <div className="flex items-center gap-2.5 mr-1">
              <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 rounded-xl flex items-center gap-2">
                <div className="p-1 px-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
                  <AlertCircle size={12} />
                </div>
                <div>
                  <p className="text-[8px] text-amber-600/70 font-black uppercase tracking-tight">
                    Pending
                  </p>
                  <p className="text-[8px] text-emerald-600/70 font-black uppercase tracking-tight">
                    Page
                  </p>
                  <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {page}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchComplaints(true)}
              className="w-10 h-10 rounded-xl border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 shadow-sm"
              disabled={isRefreshing}
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative col-span-1 md:col-span-2">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search by student or problem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all text-xs md:text-sm font-bold"
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={16}
            />
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as ComplaintStatus | 'All')
              }
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none appearance-none transition-all text-xs md:text-sm font-bold cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-[10px] md:text-xs font-black text-neutral-400 uppercase tracking-widest">
            Showing{' '}
            <span className="text-neutral-900 dark:text-white">
              {complaints.length > 0 ? (page - 1) * pageSize + 1 : 0}-
              {Math.min(page * pageSize, totalComplaints)}
            </span>{' '}
            of {totalComplaints} complaints
          </p>
        </div>

        {/* Complaints Listing */}
        {isLoading ? (
          <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-neutral-500">
            <Loader2 size={40} className="animate-spin text-rose-600" />
            <p className="font-bold">Loading complaints...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="h-[400px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl flex flex-col items-center justify-center text-center p-8 space-y-4 shadow-sm">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
              <AlertCircle size={40} className="text-neutral-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                No complaints found
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400">
                Everything seems to be running smoothly! 🎉
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden lg:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-neutral-950/50 border-b border-neutral-200 dark:border-neutral-800">
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      Student
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      Category
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      Problem
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {complaints.map((c) => {
                    const SIcon = getStatusIcon(c.status);
                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors group"
                      >
                        <td className="px-6 py-5">
                          <div>
                            <p className="font-bold text-neutral-900 dark:text-white capitalize">
                              {c.user?.name || 'Unknown'}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-medium">
                              {c.user?.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                            {c.type}
                          </span>
                        </td>
                        <td className="px-6 py-5 max-w-xs">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 font-medium">
                            {c.description}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <div
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${getStatusColor(c.status)}`}
                          >
                            <SIcon size={12} />
                            {c.status}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-neutral-500 font-medium">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedComplaint(c)}
                            className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl font-bold"
                          >
                            Review <ChevronRight size={14} className="ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (2 Column Grid) */}
            <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 pb-6">
              {complaints.map((c) => {
                const SIcon = getStatusIcon(c.status);
                return (
                  <Card
                    key={c.id}
                    className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-sm active:scale-[0.99] transition-all"
                    onClick={() => setSelectedComplaint(c)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-neutral-900 dark:text-white text-sm capitalize truncate">
                            {c.user?.name || 'Unknown'}
                          </p>
                          <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider mt-0.5 truncate">
                            {c.type}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center gap-1 shrink-0 ${getStatusColor(c.status)}`}
                        >
                          <SIcon size={10} />
                          {c.status}
                        </div>
                      </div>
                      <div className="bg-neutral-50 dark:bg-neutral-950/50 p-2.5 rounded-xl border border-neutral-100 dark:border-neutral-800/50 min-h-[60px]">
                        <p className="text-neutral-600 dark:text-neutral-400 text-[11px] font-medium line-clamp-2 leading-relaxed">
                          {c.description}
                        </p>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-neutral-100 dark:border-neutral-800">
                        <span className="text-[9px] text-neutral-400 font-black uppercase tracking-tighter">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-tight cursor-pointer">
                          <span>Review</span>
                          <ChevronRight size={12} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-200 dark:border-neutral-800 mt-6 lg:mt-8 pb-10">
              <p className="text-[10px] md:text-sm text-neutral-600 dark:text-neutral-400">
                Showing{' '}
                <span className="font-bold text-neutral-900 dark:text-white">
                  {complaints.length > 0 ? (page - 1) * pageSize + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-bold text-neutral-900 dark:text-white">
                  {Math.min(page * pageSize, totalComplaints)}
                </span>{' '}
                of{' '}
                <span className="font-bold text-neutral-900 dark:text-white">
                  {totalComplaints}
                </span>{' '}
                complaints
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="px-3 py-1.5 text-xs md:text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Previous
                </button>
                <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 font-medium px-2 py-1.5 hidden sm:inline-block">
                  Page {page} of{' '}
                  {Math.max(1, Math.ceil(totalComplaints / pageSize))}
                </span>
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(Math.ceil(totalComplaints / pageSize), p + 1),
                    )
                  }
                  disabled={
                    page >= Math.ceil(totalComplaints / pageSize) || isLoading
                  }
                  className="px-3 py-1.5 text-xs md:text-sm font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg disabled:opacity-50 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal */}
        {selectedComplaint && (
          <ComplaintResolutionModal
            complaint={selectedComplaint}
            onClose={() => setSelectedComplaint(null)}
            onRefresh={fetchComplaints}
          />
        )}
      </div>
    </div>
  );
}
