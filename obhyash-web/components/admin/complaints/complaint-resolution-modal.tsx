'use client';

import React, { useState } from 'react';
import {
  X,
  User,
  Calendar,
  Send,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { AppComplaint, ComplaintStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Portal from '@/components/ui/portal';
import { resolveComplaint } from '@/services/complaint-service';
import { createNotification } from '@/services/notification-service';
import { toast } from 'sonner';

interface ResolutionModalProps {
  complaint: AppComplaint;
  onClose: () => void;
  onRefresh: () => void;
}

export function ComplaintResolutionModal({
  complaint,
  onClose,
  onRefresh,
}: ResolutionModalProps) {
  const [feedback, setFeedback] = useState(complaint.admin_feedback || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleAction = async (status: ComplaintStatus) => {
    if (status === 'Resolved' && feedback.length < 5) {
      toast.error('Please provide some feedback before resolving');
      return;
    }

    setIsSaving(true);
    try {
      const result = await resolveComplaint(complaint.id, feedback, status);

      if (result.success) {
        // Send Notification to User
        if (status === 'Resolved' || status === 'Dismissed') {
          await createNotification(
            complaint.user_id,
            status === 'Resolved' ? 'Problem Resolved! ✅' : 'Complaint Update',
            status === 'Resolved'
              ? `Your report about "${complaint.type}" has been resolved. Feedback: ${feedback}`
              : `Your report about "${complaint.type}" was reviewed by our team.`,
            status === 'Resolved' ? 'success' : 'info',
          );
        }

        toast.success(`Complaint marked as ${status}`);
        onRefresh();
        onClose();
      } else {
        toast.error(result.error || 'Failed to update complaint');
      }
    } catch (error) {
      console.error('Action failed:', error);
      toast.error('An error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Portal>
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-0 sm:p-4">
        <div
          className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-950 sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-5 duration-300 flex flex-col h-full sm:h-auto max-h-full sm:max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-black sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg">
                <AlertTriangle size={18} />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black text-neutral-900 dark:text-white tracking-tight">
                  Resolution Console
                </h2>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">
                  <span>#{complaint.id.slice(0, 8)}</span>
                  <span>•</span>
                  <span>{complaint.type} issue</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-white dark:bg-black">
            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 space-y-0.5">
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-tight opacity-70">
                  Reporter
                </span>
                <div className="flex items-center gap-2 font-black text-xs text-neutral-900 dark:text-white truncate">
                  <div className="w-5 h-5 rounded-md bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center text-[10px] font-black uppercase">
                    {(complaint.user?.name || 'U').charAt(0)}
                  </div>
                  {complaint.user?.name || 'Unknown'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 space-y-0.5">
                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-tight opacity-70">
                  Created
                </span>
                <div className="flex items-center gap-2 font-black text-xs text-neutral-900 dark:text-white">
                  <Calendar size={12} className="text-red-500" />
                  {new Date(complaint.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Student Narrative */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2 opacity-70 ml-1">
                <MessageSquare size={12} /> Student Narration
              </h4>
              <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-neutral-800 dark:text-neutral-200 text-[13px] leading-relaxed italic">
                &ldquo;{complaint.description}&rdquo;
              </div>
            </div>

            {/* Admin Response Section */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2 opacity-70 ml-1">
                <Send size={12} /> Admin Resolution Feedback
              </h4>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ex: We resolved the issue. Please check again..."
                className="min-h-[140px] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none dark:text-white transition-all text-sm font-medium p-4 resize-none"
              />
              <p className="text-[9px] text-neutral-400 font-bold px-1 flex items-center gap-1">
                <Clock size={10} /> User will receive a push notification with
                this feedback.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row justify-between items-center gap-3 sticky bottom-0 z-10">
            <button
              onClick={() => handleAction('Dismissed')}
              className="w-full sm:w-auto px-4 py-2 text-[11px] text-red-500 bg-red-50/50 dark:bg-red-500/5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all flex items-center justify-center gap-1.5 font-black uppercase tracking-tight"
            >
              <Trash2 size={12} /> Dismiss Issue
            </button>

            <div className="flex gap-2.5 w-full sm:w-auto">
              <button
                onClick={() => handleAction('In Progress')}
                className="w-full flex-1 sm:flex-none px-5 py-2.5 text-xs font-black text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 transition-all active:scale-[0.98] uppercase tracking-tight shadow-sm"
              >
                Working
              </button>
              <button
                onClick={() => handleAction('Resolved')}
                disabled={isSaving}
                className="flex-[2] sm:flex-none px-8 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-tight"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Solve & Notify
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
