'use client';

import React, { useEffect, useState } from 'react';
import { getReports } from '@/services/report-service';
import ReportDetailsModal from '@/components/admin/reports/ReportDetailsModal';
import {
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
  RefreshCcw,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    'All' | 'Pending' | 'Resolved' | 'Ignored'
  >('Pending');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 20;

  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const status = filterStatus === 'All' ? undefined : filterStatus;
      const { reports: data, count } = await getReports(
        status,
        page,
        pageSize,
        searchQuery,
      );
      setReports(data || []);
      setTotalReports(count || 0);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('রিপোর্ট লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 300);
    return () => clearTimeout(timer);
  }, [filterStatus, page, searchQuery]);

  const handleViewDetails = (report: any) => {
    setSelectedReport(report);
    setIsDetailsModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Resolved':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Ignored':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Current Page Stats
  const stats = {
    total:
      filterStatus === 'All' && !searchQuery ? totalReports : reports.length,
    pending: reports.filter((r) => r.status === 'Pending').length,
    resolved: reports.filter((r) => r.status === 'Resolved').length,
    ignored: reports.filter((r) => r.status === 'Ignored').length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            রিপোর্ট ম্যানেজমেন্ট
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            শিক্ষার্থীদের পাঠানো অভিযোগ পর্যালোচনা ও সমাধান করুন
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="Refresh"
        >
          <RefreshCcw
            size={20}
            className={`text-neutral-500 ${loading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-neutral-500 text-sm font-bold">
              মোট রিপোর্ট
            </span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Filter size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white">
            {stats.total}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-neutral-500 text-sm font-bold">
              অপেক্ষমান
            </span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {stats.pending}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-neutral-500 text-sm font-bold">গৃহীত</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {stats.resolved}
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-neutral-500 text-sm font-bold">বাতিল</span>
            <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <XCircle size={16} />
            </div>
          </div>
          <div className="text-2xl font-bold text-red-600">{stats.ignored}</div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          {['Pending', 'Resolved', 'Ignored', 'All'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                filterStatus === status
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-md'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              {status === 'Pending' && 'অপেক্ষমান'}
              {status === 'Resolved' && 'গৃহীত'}
              {status === 'Ignored' && 'বাতিল'}
              {status === 'All' && 'সবগুলো'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
            size={16}
          />
          <input
            type="text"
            placeholder="আইডি, কারণ বা নাম দিয়ে খুঁজুন..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          />
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="w-8 h-8 border-4 border-neutral-200 border-t-neutral-800 rounded-full animate-spin"></div>
            <p className="text-neutral-500 text-sm">রিপোর্ট লোড হচ্ছে...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-neutral-400">
            <div className="bg-neutral-100 dark:bg-neutral-800 p-6 rounded-full">
              <AlertTriangle size={32} />
            </div>
            <p>কোনো রিপোর্ট পাওয়া যায়নি</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 uppercase tracking-wider font-bold">
                <tr>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Reporter</th>
                  <th className="px-6 py-4">Question ID</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/20 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-md text-xs font-bold border ${getStatusColor(report.status)}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-neutral-900 dark:text-white">
                        {report.reporter_name || 'Anonymous'}
                      </div>
                      <div className="text-xs text-neutral-500 font-mono">
                        {report.reporter_id?.slice(0, 6)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-neutral-600 dark:text-neutral-300">
                      #{report.question_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {report.reason}
                      </span>
                      {report.image_url && (
                        <span className="ml-2 inline-flex items-center text-[10px] bg-emerald-50 text-emerald-600 px-1.5 rounded border border-emerald-100">
                          IMG
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-500 whitespace-nowrap">
                      {new Date(report.created_at).toLocaleDateString('bn-BD')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(report)}
                        className="px-3 py-1.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-lg text-xs font-bold hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
                      >
                        বিস্তারিত
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalReports > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                <p className="text-sm font-medium text-neutral-500">
                  Showing{' '}
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {reports.length > 0 ? (page - 1) * pageSize + 1 : 0}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {Math.min(page * pageSize, totalReports)}
                  </span>{' '}
                  of{' '}
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {totalReports}
                  </span>{' '}
                  reports
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-600 disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 font-bold px-2 py-1.5 hidden sm:inline-block">
                    Page {page} of{' '}
                    {Math.max(1, Math.ceil(totalReports / pageSize))}
                  </span>
                  <button
                    onClick={() =>
                      setPage((p) =>
                        Math.min(Math.ceil(totalReports / pageSize), p + 1),
                      )
                    }
                    disabled={
                      page >= Math.ceil(totalReports / pageSize) || loading
                    }
                    className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg border border-neutral-200 dark:border-neutral-600 disabled:opacity-50 hover:bg-neutral-50 dark:hover:bg-neutral-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ReportDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        report={selectedReport}
        onUpdate={fetchReports}
      />
    </div>
  );
}
