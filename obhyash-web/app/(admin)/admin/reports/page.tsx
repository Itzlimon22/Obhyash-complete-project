'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Report, Question, ReportStatus } from '@/lib/types';
import { ReportTable } from '@/components/admin/reports/report-table';
import { ReportStats } from '@/components/admin/reports/report-stats';
import { ResolutionModal } from '@/components/admin/reports/resolution-modal';
import { Flag, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    const supabase = createClient();

    try {
      // 1. Fetch Reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select(
          `
          *,
          reporter:users (
            name
          )
        `,
        )
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      if (!reportsData || reportsData.length === 0) {
        setReports([]);
        return;
      }

      // 2. Fetch Related Questions (Manual Join)
      const questionIds = Array.from(
        new Set(reportsData.map((r) => r.question_id)),
      );

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('id', questionIds);

      if (questionsError) throw questionsError;

      const questionsMap = new Map<string, Question>();
      questionsData?.forEach((q) => questionsMap.set(q.id, q as Question));

      // 3. Combine Data
      const formattedReports: Report[] = reportsData.map((r) => ({
        id: r.id,
        questionId: r.question_id,
        questionPreview: questionsMap.get(r.question_id) || ({} as Question),
        reporterName:
          (r.reporter as { name: string } | null)?.name || 'Unknown User',
        reason: r.reason,
        description: r.description,
        status: r.status,
        createdAt: new Date(r.created_at).toLocaleDateString(),
        severity: r.severity || 'Medium',
      }));

      setReports(formattedReports);
      if (showToast) toast.success('Reports refreshed');
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleResolve = async (
    action: 'fix' | 'ignore' | 'delete',
    updatedQuestion?: Partial<Question>,
  ) => {
    if (!selectedReport) return;
    const supabase = createClient();

    try {
      if (action === 'delete') {
        // Delete the REPORT, not the question? Or delete report
        // Usually admins checking report might want to delete report if it's spam
        // The modal typically implies "Resolving the REPORT"
        // If action is delete, it likely means deleting the report itself.
        const { error } = await supabase
          .from('reports')
          .delete()
          .eq('id', selectedReport.id);
        if (error) throw error;
        toast.success('Report deleted');
      } else {
        let newStatus: ReportStatus = 'Pending';

        if (action === 'fix') {
          // Update Question Content if provided
          if (updatedQuestion && Object.keys(updatedQuestion).length > 0) {
            const { error: qError } = await supabase
              .from('questions')
              .update(updatedQuestion)
              .eq('id', selectedReport.questionId);
            if (qError) throw qError;
          }
          newStatus = 'Resolved';
        } else if (action === 'ignore') {
          newStatus = 'Ignored';
        }

        // Update Report Status
        const { error } = await supabase
          .from('reports')
          .update({ status: newStatus })
          .eq('id', selectedReport.id);

        if (error) throw error;
        toast.success(`Report marked as ${newStatus}`);
      }

      // Close and Refresh
      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      console.error('Resolution failed:', error);
      toast.error('Failed to process report');
    }
  };

  const stats = {
    pending: reports.filter((r) => r.status === 'Pending').length,
    highSeverity: reports.filter(
      (r) => r.status === 'Pending' && r.severity === 'High',
    ).length,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl md:text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-2.5 tracking-tight">
              <Flag className="text-rose-600" size={24} />
              Reports
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-[11px] md:text-sm font-medium">
              Review and resolve user-submitted content issues
            </p>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto">
            <ReportStats {...stats} />
            <button
              onClick={() => fetchReports(true)}
              className="p-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-500 hover:text-rose-600 dark:hover:text-rose-400 transition-all shadow-sm shrink-0 active:scale-95"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
          <p className="text-[10px] md:text-xs font-bold text-neutral-400 uppercase tracking-widest">
            Showing{' '}
            <span className="text-neutral-900 dark:text-white">
              {reports.length}
            </span>{' '}
            active report(s)
          </p>
        </div>

        {/* Main Table */}
        <ReportTable
          reports={reports}
          isLoading={isLoading}
          onReview={setSelectedReport}
        />

        {/* Modal */}
        {selectedReport && (
          <ResolutionModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onResolve={handleResolve}
          />
        )}
      </div>
    </div>
  );
}
