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
import { Portal } from '@/components/ui/portal';
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
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95 duration-300">
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-2xl">
                <AlertTriangle size={24} className="text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-neutral-900 dark:text-white">
                  Resolve Complaint
                </h3>
                <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                  {complaint.type} issue
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-1">
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  Reporter
                </span>
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                  <User size={14} className="text-rose-500" />
                  {complaint.user?.name || 'Loading...'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-1">
                <span className="text-[10px] font-black text-neutral-400 uppercase">
                  Reported At
                </span>
                <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-white">
                  <Calendar size={14} className="text-rose-500" />
                  {new Date(complaint.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-neutral-400 uppercase flex items-center gap-2">
                <MessageSquare size={14} /> Student's Complaint
              </h4>
              <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {complaint.description}
              </div>
            </div>

            {/* Admin Response */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-neutral-400 uppercase flex items-center gap-2">
                <Send size={14} /> Admin Feedback (Sent to User)
              </h4>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Ex: We have fixed the layout issue on mobile. Please refresh your app."
                className="min-h-[120px] rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 focus:ring-rose-500 focus:border-rose-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => handleAction('Dismissed')}
              className="w-full sm:w-auto text-neutral-500 hover:text-rose-600 font-bold"
            >
              <Trash2 size={16} className="mr-2" /> Dismiss
            </Button>

            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => handleAction('In Progress')}
                className="flex-1 sm:flex-none font-bold border-2"
              >
                <Clock size={16} className="mr-2" /> Mark In Progress
              </Button>
              <Button
                onClick={() => handleAction('Resolved')}
                disabled={isSaving}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-8 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={18} className="mr-2" /> Update & Resolve
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
