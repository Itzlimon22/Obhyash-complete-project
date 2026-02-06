import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ReportStatus } from '@/lib/types';

export const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const styles: Record<string, string> = {
    Low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    Medium:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    High: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  };
  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[severity] || styles.Low}`}
    >
      {severity}
    </span>
  );
};

export const ReportStatusBadge: React.FC<{ status: ReportStatus }> = ({
  status,
}) => {
  const styles: Record<ReportStatus, string> = {
    Pending:
      'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
    Resolved:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
    Ignored:
      'bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400 border-gray-200 dark:border-gray-500/20',
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}
    >
      {status === 'Pending' && <AlertTriangle size={12} className="mr-1.5" />}
      {status === 'Resolved' && <CheckCircle2 size={12} className="mr-1.5" />}
      {status === 'Ignored' && <XCircle size={12} className="mr-1.5" />}
      {status}
    </span>
  );
};
