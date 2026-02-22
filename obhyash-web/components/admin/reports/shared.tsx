import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { ReportStatus } from '@/lib/types';

export const SeverityBadge: React.FC<{ severity: string }> = ({ severity }) => {
  const styles: Record<string, string> = {
    Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    Medium:
      'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
    High: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
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
      'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20',
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
