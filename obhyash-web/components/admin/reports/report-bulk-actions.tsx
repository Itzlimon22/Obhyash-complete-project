'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Trash2,
  Layers,
  X,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportBulkActionsProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function ReportBulkActions({
  selectedIds,
  onClearSelection,
  onRefresh,
}: ReportBulkActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedIds.length === 0) return null;

  const handleBulkAction = async (resolution: 'Accept' | 'Reject') => {
    const actionLabel =
      resolution === 'Accept' ? 'সমাধান (Accept)' : 'বাতিল (Dismiss)';
    if (
      !window.confirm(
        `⚠️ আপনি কি নিশ্চিত যে নির্বাচিত ${selectedIds.length}টি রিপোর্ট একসাথে ${actionLabel} করতে চান?`,
      )
    )
      return;

    try {
      setIsProcessing(true);
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_update',
          reportIds: selectedIds,
          resolution,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          `${selectedIds.length}টি রিপোর্ট সফলভাবে ${
            resolution === 'Accept' ? 'সমাধান' : 'বাতিল'
          } করা হয়েছে!`,
        );
        onClearSelection();
        onRefresh();
      } else {
        toast.error(json.error || 'Failed to perform bulk action');
      }
    } catch (e: any) {
      toast.error('Bulk action failed: ' + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#121215] text-white px-5 py-3.5 rounded-2xl border border-zinc-700/80 shadow-2xl flex flex-wrap items-center gap-3 animate-in slide-in-from-bottom-6 duration-300">
      <div className="flex items-center gap-2 pr-3 border-r border-zinc-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-xs font-black text-white font-mono">
          {selectedIds.length} টি রিপোর্ট নির্বাচিত
        </span>
      </div>

      {/* Mass Resolve */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => handleBulkAction('Accept')}
        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <CheckCircle2 size={14} />
        <span>সব সমাধান (Mass Resolve)</span>
      </button>

      {/* Mass Dismiss */}
      <button
        type="button"
        disabled={isProcessing}
        onClick={() => handleBulkAction('Reject')}
        className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
      >
        <XCircle size={14} />
        <span>সব বাতিল (Mass Dismiss)</span>
      </button>

      {/* Clear Selection */}
      <button
        type="button"
        onClick={onClearSelection}
        className="p-1 text-zinc-400 hover:text-white rounded-lg transition ml-1"
        title="সিলেকশন বাতিল করুন"
      >
        <X size={16} />
      </button>
    </div>
  );
}
