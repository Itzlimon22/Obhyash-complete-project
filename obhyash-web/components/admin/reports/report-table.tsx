import React from 'react';
import { Flag, CheckCircle2, Loader2, Eye } from 'lucide-react';
import { Report } from '@/lib/types';
import { ReportStatusBadge } from './shared';

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
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('bn-BD', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="py-20 flex justify-center items-center flex-col gap-3 text-gray-500">
        <Loader2 className="animate-spin text-red-600" size={32} />
        <span className="text-xs font-black uppercase tracking-widest text-black/50 dark:text-white/50">
          রিপোর্ট লোড হচ্ছে...
        </span>
      </div>
    );
  }

  // 2. Empty State
  if (reports.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-black rounded-2xl border border-dashed border-black/10 dark:border-white/10">
        <div className="w-16 h-16 bg-black/5 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-black/30 dark:text-white/30">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-lg font-black text-black dark:text-white">
          সব ঠিকঠাক!
        </h3>
        <p className="text-black/50 dark:text-white/50 text-sm mt-1 font-bold">
          এই ফিল্টারে কোনো রিপোর্ট নেই।
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
            className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl p-4 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
            onClick={() => onReview(report)}
          >
            <div className="flex justify-between items-center mb-3">
              <ReportStatusBadge status={report.status} />
              <span className="text-[10px] font-black text-black/50 dark:text-white/50 uppercase tracking-widest">
                {formatDate(report.created_at)}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 p-1.5 bg-red-50 dark:bg-red-500/10 rounded-lg shrink-0">
                  <Flag size={14} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="text-[13px] font-black text-black dark:text-white leading-tight">
                    {report.reason}
                  </h4>
                  {report.description && (
                    <p className="text-[11px] text-black/60 dark:text-white/60 mt-0.5 line-clamp-1">
                      &quot;{report.description}&quot;
                    </p>
                  )}
                </div>
              </div>

              {report.question && (
                <div className="bg-black/5 dark:bg-white/5 rounded-xl p-2.5 border border-black/5 dark:border-white/5">
                  <p className="text-[9px] font-black text-black/40 dark:text-white/40 uppercase tracking-widest mb-1.5">
                    প্রশ্ন
                  </p>
                  <div className="text-xs text-black dark:text-white line-clamp-2 leading-snug font-medium">
                    {report.question.question}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center text-[10px] font-black uppercase">
                    {(report.reporter_name || 'G').charAt(0)}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-black dark:text-white leading-none">
                      {report.reporter_name || 'Guest'}
                    </p>
                    <p className="text-[9px] text-black/50 dark:text-white/50 mt-0.5 font-bold uppercase tracking-tighter">
                      Reporter
                    </p>
                  </div>
                </div>

                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-black uppercase tracking-widest hover:bg-red-600 dark:hover:bg-red-500 dark:hover:text-white transition-colors">
                  <Eye size={12} />
                  দেখুন
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout (>= md) */}
      <div className="hidden md:block bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10 text-xs uppercase tracking-widest text-black/50 dark:text-white/50 font-black">
                <th className="px-6 py-4">স্ট্যাটাস</th>
                <th className="px-6 py-4">সমস্যা</th>
                <th className="px-6 py-4">প্রশ্ন</th>
                <th className="px-6 py-4">রিপোর্টার</th>
                <th className="px-6 py-4 text-right">একশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
                >
                  {/* Status Column */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col items-start gap-2">
                      <ReportStatusBadge status={report.status} />
                      <span className="text-[10px] text-black/40 dark:text-white/40 font-black uppercase tracking-wider mt-1">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                  </td>

                  {/* Issue Column */}
                  <td className="px-6 py-4 align-top max-w-xs">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 min-w-[16px]">
                        <Flag
                          size={14}
                          className="text-red-600 dark:text-red-500"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-black text-red-600 dark:text-red-500">
                          {report.reason}
                        </p>
                        {report.description && (
                          <p className="text-xs text-black/60 dark:text-white/60 mt-1 line-clamp-2 leading-relaxed">
                            &quot;{report.description}&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Preview Column */}
                  <td className="px-6 py-4 align-top max-w-sm">
                    {report.question ? (
                      <>
                        <div className="text-sm text-black dark:text-white line-clamp-2 font-medium">
                          {report.question.question}
                        </div>
                        <div className="mt-2 flex gap-2">
                          {report.question.subject && (
                            <span className="text-[10px] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded text-black/50 dark:text-white/50 border border-black/5 dark:border-white/5 font-bold">
                              {report.question.subject}
                            </span>
                          )}
                          <span className="text-[10px] bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded text-black/50 dark:text-white/50 border border-black/5 dark:border-white/5 font-mono">
                            ID: {String(report.question_id).slice(0, 6)}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-black/30 dark:text-white/30 italic">
                        প্রশ্ন লোড হয়নি
                      </span>
                    )}
                  </td>

                  {/* Reporter Column */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-black uppercase">
                        {(report.reporter_name || 'G').charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-black dark:text-white">
                          {report.reporter_name || 'Guest'}
                        </p>
                        <p className="text-[10px] text-black/40 dark:text-white/40 font-bold uppercase tracking-wide">
                          Student
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Action Column */}
                  <td className="px-6 py-4 text-right align-top">
                    <button
                      onClick={() => onReview(report)}
                      className="px-3 py-1.5 text-sm font-black text-white bg-black dark:bg-white dark:text-black border border-transparent rounded-xl hover:bg-red-600 dark:hover:bg-red-500 dark:hover:text-white transition-all flex items-center gap-1.5 ml-auto uppercase tracking-widest"
                    >
                      <Eye size={14} />
                      <span>রিভিউ</span>
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
