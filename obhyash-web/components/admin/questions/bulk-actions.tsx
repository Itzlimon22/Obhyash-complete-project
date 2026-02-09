import React from 'react';
import { Trash2, CheckCircle2, XCircle, FileEdit } from 'lucide-react';
import { QuestionStatus } from '@/lib/types';

interface BulkActionsProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onUpdateStatus: (status: QuestionStatus) => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onDeleteSelected,
  onUpdateStatus,
}) => {
  if (selectedCount === 0) return null;

  const handleDelete = () => {
    if (
      confirm(
        `আপনি কি ${selectedCount} টি প্রশ্ন মুছে ফেলতে চান? এটি পূর্বাবস্থায় ফেরানো যাবে না।`,
      )
    ) {
      onDeleteSelected();
    }
  };

  return (
    <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in duration-200">
      {/* Selection Info */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
          <CheckCircle2
            size={18}
            className="text-rose-600 dark:text-rose-400"
          />
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900 dark:text-white">
            {selectedCount} টি প্রশ্ন নির্বাচিত
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {selectedCount < totalCount && (
              <button
                onClick={onSelectAll}
                className="text-[10px] sm:text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
              >
                সব নির্বাচন করুন ({totalCount})
              </button>
            )}
            <button
              onClick={onClearSelection}
              className="text-[10px] sm:text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              নির্বাচন মুছুন
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        {/* Update Status */}
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-1 flex-1 sm:flex-none justify-center">
          <button
            onClick={() => onUpdateStatus('Approved')}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center justify-center gap-1.5"
            title="Approve Selected"
          >
            <CheckCircle2 size={14} className="sm:inline" />
            <span className="hidden xs:inline">Approve</span>
          </button>
          <button
            onClick={() => onUpdateStatus('Rejected')}
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center justify-center gap-1.5"
            title="Reject Selected"
          >
            <XCircle size={14} className="sm:inline" />
            <span className="hidden xs:inline">Reject</span>
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-medium shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center gap-2 shrink-0"
        >
          <Trash2 size={16} />
          <span className="hidden xs:inline">মুছে ফেলুন</span>
        </button>
      </div>
    </div>
  );
};
