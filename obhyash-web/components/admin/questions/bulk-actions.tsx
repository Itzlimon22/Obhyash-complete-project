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
    <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-200">
      {/* Selection Info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <CheckCircle2
            size={20}
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
                className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline"
              >
                সব নির্বাচন করুন ({totalCount} টি)
              </button>
            )}
            <button
              onClick={onClearSelection}
              className="text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
            >
              নির্বাচন মুছুন
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Update Status */}
        <div className="flex items-center gap-1 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 p-1">
          <button
            onClick={() => onUpdateStatus('Approved')}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors flex items-center gap-1.5"
            title="Approve Selected"
          >
            <CheckCircle2 size={14} />
            Approve
          </button>
          <button
            onClick={() => onUpdateStatus('Rejected')}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1.5"
            title="Reject Selected"
          >
            <XCircle size={14} />
            Reject
          </button>
          <button
            onClick={() => onUpdateStatus('Draft')}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-neutral-700 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
            title="Mark as Draft"
          >
            <FileEdit size={14} />
            Draft
          </button>
        </div>

        {/* Delete */}
        <button
          onClick={handleDelete}
          className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium shadow-lg shadow-rose-500/20 transition-all active:scale-95 flex items-center gap-2"
        >
          <Trash2 size={16} />
          মুছে ফেলুন
        </button>
      </div>
    </div>
  );
};
