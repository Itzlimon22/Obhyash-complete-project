import React from 'react';
import { Flag, CheckCircle2, Loader2, Eye } from 'lucide-react';
import { Report } from '@/lib/types';
import { SeverityBadge, ReportStatusBadge } from './shared';
import { MathText } from '@/components/admin/questions/shared';

interface ReportTableProps {
  reports: Report[];
  isLoading: boolean;
  onReview: (report: Report) => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  isLoading,
  onReview,
}) => {
  // 1. Loading State
  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center flex-col gap-3 text-gray-500">
        <Loader2 className="animate-spin text-rose-600" size={32} />
        <span className="text-xs font-medium uppercase tracking-wider">
          Loading Reports...
        </span>
      </div>
    );
  }

  // 2. Empty State
  if (reports.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800">
        <div className="w-16 h-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4 text-neutral-400">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white">
          All Caught Up!
        </h3>
        <p className="text-gray-500 text-sm mt-1">
          No reports found matching your criteria.
        </p>
      </div>
    );
  }

  // 3. Responsive Data Rendering
  return (
    <div className="space-y-4">
      {/* Mobile Card Layout (< md) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {reports.map((report) => (
          <div
            key={report.id}
            className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all"
            onClick={() => onReview(report)}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <ReportStatusBadge status={report.status} />
                <SeverityBadge severity={report.severity} />
              </div>
              <span className="text-[9px] font-bold text-neutral-400 bg-neutral-50 dark:bg-neutral-800 px-2 py-0.5 rounded-lg border border-neutral-100 dark:border-neutral-700">
                {report.createdAt.split(' ')[0]}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 p-1.5 bg-rose-50 dark:bg-rose-500/10 rounded-lg shrink-0">
                  <Flag
                    size={14}
                    className="text-rose-600 dark:text-rose-400"
                  />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-neutral-900 dark:text-white leading-tight">
                    {report.reason}
                  </h4>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 italic line-clamp-1">
                    &quot;{report.description}&quot;
                  </p>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-950 rounded-xl p-2.5 border border-neutral-100 dark:border-neutral-800/50">
                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 opacity-70">
                  Question Preview
                </p>
                <div className="text-xs text-neutral-800 dark:text-neutral-200 line-clamp-2 leading-snug">
                  <MathText
                    text={report.questionPreview?.question || 'Content Deleted'}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-[10px] font-black shadow-inner uppercase">
                    {report.reporterName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-neutral-900 dark:text-white leading-none">
                      {report.reporterName}
                    </p>
                    <p className="text-[9px] text-neutral-500 mt-0.5 font-medium uppercase tracking-tighter">
                      Reporter
                    </p>
                  </div>
                </div>

                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-black shadow-md shadow-rose-500/10 active:scale-95 transition-all">
                  <Eye size={12} />
                  Review
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout (>= md) */}
      <div className="hidden md:block bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800 text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">
                <th className="px-6 py-4">Status & Severity</th>
                <th className="px-6 py-4">Reported Issue</th>
                <th className="px-6 py-4">Question Preview</th>
                <th className="px-6 py-4">Reporter</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-neutral-50 dark:hover:bg-neutral-950/50 transition-colors group"
                >
                  {/* Status Column */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col items-start gap-2">
                      <ReportStatusBadge status={report.status} />
                      <SeverityBadge severity={report.severity} />
                      <span className="text-[10px] text-gray-400 font-mono mt-1">
                        {report.createdAt.split(' ')[0]}
                      </span>
                    </div>
                  </td>

                  {/* Issue Column */}
                  <td className="px-6 py-4 align-top max-w-xs">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 min-w-[16px]">
                        <Flag size={14} className="text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
                          {report.reason}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 italic leading-relaxed">
                          &quot;{report.description}&quot;
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Preview Column */}
                  <td className="px-6 py-4 align-top max-w-sm">
                    <div className="text-sm text-neutral-900 dark:text-gray-200 line-clamp-2 min-h-[1.25rem]">
                      <MathText
                        text={
                          report.questionPreview?.question || 'Content Deleted'
                        }
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                        {report.questionPreview?.subject || 'N/A'}
                      </span>
                      <span className="text-[10px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500 border border-neutral-200 dark:border-neutral-700 font-mono">
                        ID: {report.questionId.slice(0, 6)}...
                      </span>
                    </div>
                  </td>

                  {/* Reporter Column */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xs font-bold uppercase">
                        {report.reporterName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {report.reporterName}
                        </p>
                        <p className="text-[10px] text-gray-500">Student</p>
                      </div>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-6 py-4 text-right align-top">
                    <button
                      onClick={() => onReview(report)}
                      className="px-3 py-1.5 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-all flex items-center gap-1.5 ml-auto shadow-sm"
                    >
                      <Eye size={14} />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
