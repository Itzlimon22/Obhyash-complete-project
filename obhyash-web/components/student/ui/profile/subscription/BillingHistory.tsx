'use client';

import React from 'react';
import { Invoice } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Download, Receipt, FileText } from 'lucide-react';

interface BillingHistoryProps {
  invoices: Invoice[];
  onDownload: (invoice: Invoice) => void;
}

const BillingHistory: React.FC<BillingHistoryProps> = ({
  invoices,
  onDownload,
}) => {
  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      paid: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      valid:
        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      pending:
        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      checking:
        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    };

    const labels = {
      paid: 'পরিশোধিত',
      valid: 'Valid',
      pending: 'অপেক্ষমাণ',
      checking: 'Checking',
      failed: 'ব্যর্থ',
      rejected: 'Rejected',
    };

    return (
      <span
        className={cn(
          'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
          styles[status],
        )}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-neutral-400" />
          <h3 className="text-base font-bold text-neutral-800 dark:text-white">
            বিলিং ইতিহাস
          </h3>
        </div>
      </div>

      {/* Content */}
      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center">
            <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
          </div>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
            কোনো বিল নেই
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-[200px]">
            আপনার পেমেন্ট ইতিহাস এখানে দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors"
            >
              {/* Left: Plan & Date */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-sm text-neutral-900 dark:text-white truncate">
                    {inv.planName}
                  </p>
                  {getStatusBadge(inv.status)}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {inv.date}
                </p>
              </div>

              {/* Right: Amount & Download */}
              <div className="flex items-center gap-4">
                <span className="font-bold text-sm text-neutral-900 dark:text-white">
                  {inv.currency}
                  {inv.amount}
                </span>
                {(inv.status === 'paid' || inv.status === 'valid') && (
                  <button
                    onClick={() => onDownload(inv)}
                    className="p-2 text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                    title="ডাউনলোড"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BillingHistory;
