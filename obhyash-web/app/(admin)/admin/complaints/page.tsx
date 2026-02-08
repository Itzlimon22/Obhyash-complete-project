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
  const [selectedComplaint, setSelectedComplaint] =
    useState<AppComplaint | null>(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    const supabase = createClient();

    try {
      // 1. Fetch Complaints from DB
      const { data, error } = await supabase
        .from('app_complaints')
        .select(
          `
          *,
          user:users (
            name,
            email
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComplaints(data || []);
      if (showToast) toast.success('Complaints list updated');
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredComplaints = complaints.filter((c) => {
    const matchesSearch =
      (c.user?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  // Stats
  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === 'Pending').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
              <AlertTriangle className="text-rose-600" size={32} />
              Platform Complaints
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 font-medium">
              Manage technical issues and UX feedback from students
            </p>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <div className="hidden sm:flex items-center gap-6 mr-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Pending
                </p>
                <p className="text-xl font-black text-amber-500">
                  {stats.pending}
                </p>
              </div>
              <div className="text-right border-l border-neutral-200 dark:border-neutral-800 pl-6">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Solved
                </p>
                <p className="text-xl font-black text-emerald-500">
                  {stats.resolved}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => fetchComplaints(true)}
              className="rounded-xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm"
              disabled={isRefreshing}
            >
              <RefreshCw
                size={20}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative col-span-1 md:col-span-2">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by student name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all font-medium"
            />
          </div>
          <div className="relative">
            <Filter
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
              size={18}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none appearance-none transition-all font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>
        </div>

        {/* Complaints Listing */}
        {isLoading ? (
          <div className="h-[400px] flex flex-col items-center justify-center gap-4 text-neutral-500">
            <Loader2 size={40} className="animate-spin text-rose-600" />
            <p className="font-bold">Loading complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
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
                  {filteredComplaints.map((c) => {
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

            {/* Mobile Card View (Hidden on desktop) */}
            <div className="lg:hidden space-y-4">
              {filteredComplaints.map((c) => {
                const SIcon = getStatusIcon(c.status);
                return (
                  <Card
                    key={c.id}
                    className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 rounded-3xl overflow-hidden shadow-sm"
                  >
                    <CardContent className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-black text-neutral-900 dark:text-white text-lg capitalize">
                            {c.user?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest mt-1">
                            {c.type}
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight flex items-center gap-1.5 ${getStatusColor(c.status)}`}
                        >
                          <SIcon size={12} />
                          {c.status}
                        </div>
                      </div>
                      <p className="text-neutral-600 dark:text-neutral-400 text-sm font-medium line-clamp-3 bg-neutral-50 dark:bg-neutral-950/50 p-4 rounded-2xl">
                        {c.description}
                      </p>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-neutral-400 font-bold uppercase">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                        <Button
                          onClick={() => setSelectedComplaint(c)}
                          className="bg-neutral-900 dark:bg-white text-white dark:text-black font-black rounded-xl text-xs px-6 py-2"
                        >
                          Review Issue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
