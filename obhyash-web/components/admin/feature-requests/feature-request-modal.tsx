'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  X,
  User,
  Calendar,
  Lightbulb,
  Loader2,
  CheckCircle2,
  Clock,
  Compass,
  RefreshCcw,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { AppFeatureRequest, FeatureRequestStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import Portal from '@/components/ui/portal';
import { updateFeatureRequestStatus } from '@/services/feature-request-service';
import { createNotification } from '@/services/notification-service';
import { toast } from 'sonner';

interface FeatureRequestModalProps {
  request: AppFeatureRequest;
  onClose: () => void;
  onRefresh: () => void;
}

export function FeatureRequestModal({
  request,
  onClose,
  onRefresh,
}: FeatureRequestModalProps) {
  const [feedback, setFeedback] = useState(request.admin_feedback || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleAction = async (status: FeatureRequestStatus) => {
    setIsSaving(true);
    try {
      const result = await updateFeatureRequestStatus(
        request.id,
        status,
        feedback,
      );

      if (result.success) {
        // Send Notification to User
        try {
          const statusBanglaMap: Record<FeatureRequestStatus, string> = {
            'Under Review': 'বিবেচনাধীন রয়েছে',
            Planned: 'পরিকল্পিত হিসেবে গ্রহণ করা হয়েছে',
            'In Progress': 'কাজ শুরু হয়েছে',
            Completed: 'অ্যাপে যুক্ত করা হয়েছে! 🎉',
            Declined: 'বিবেচনা শেষে স্থগিত রাখা হয়েছে',
          };
          await createNotification(
            request.user_id,
            'ফিচার প্রস্তাব আপডেট 💡',
            `তোমার প্রস্তাবিত "${request.title}" ফিচারটি ${statusBanglaMap[status]}। ${
              feedback ? `অ্যাডমিন মন্তব্য: ${feedback}` : ''
            }`,
            status === 'Completed'
              ? 'success'
              : status === 'Planned'
              ? 'info'
              : 'system',
          );
        } catch (notifErr) {
          console.warn('Could not send notification:', notifErr);
        }

        toast.success(`Feature request marked as ${status}`);
        onRefresh();
        onClose();
      } else {
        toast.error(result.error || 'Failed to update feature request');
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
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="absolute inset-0 bg-neutral-900/80 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-2xl bg-white dark:bg-neutral-950 sm:rounded-3xl shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-5 duration-300 flex flex-col h-full sm:h-auto max-h-full sm:max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-white dark:bg-black sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl">
                <Lightbulb size={18} />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-black text-neutral-900 dark:text-white tracking-tight">
                  Feature Request Review
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-tight">
                  <span>#{request.id.slice(0, 8)}</span>
                  <span>•</span>
                  <span>{request.category}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
            {/* User Details Box */}
            <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-800 rounded-full flex items-center justify-center font-bold text-neutral-600 dark:text-neutral-300">
                  <User size={14} />
                </div>
                <div>
                  {request.user_id ? (
                    <Link
                      href={`/admin/user-management/${request.user_id}`}
                      target="_blank"
                      className="font-bold text-neutral-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1 group"
                    >
                      <span>{request.user?.name || 'Student'}</span>
                      <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  ) : (
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {request.user?.name || 'Student'}
                    </p>
                  )}
                  <p className="text-neutral-500 text-[11px]">
                    {request.user?.email || 'User ID: ' + request.user_id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500 font-bold font-mono">
                <Calendar size={13} />
                <span>
                  {new Date(request.created_at).toLocaleDateString('en-GB')}{' '}
                  {new Date(request.created_at).toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
              </div>
            </div>

            {/* Request Title & Description */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Feature Title & Details
              </div>
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 space-y-2">
                <h3 className="font-bold text-neutral-900 dark:text-white text-base">
                  {request.title}
                </h3>
                <p className="text-neutral-700 dark:text-neutral-300 text-sm whitespace-pre-wrap leading-relaxed">
                  {request.description}
                </p>
              </div>
            </div>

            {/* Admin Feedback Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Admin Response / Notes to User
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="যেমন: এই চমৎকার আইডিয়াটি আমাদের আপকামিং আপডেটে যোগ করা হবে..."
                rows={4}
                className="rounded-2xl border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm"
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('Declined')}
                disabled={isSaving}
                className="text-neutral-600 dark:text-neutral-400 text-xs rounded-xl"
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                বাতিল / Decline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('Under Review')}
                disabled={isSaving}
                className="text-amber-600 dark:text-amber-400 text-xs rounded-xl border-amber-200 dark:border-amber-900/50"
              >
                <Clock className="w-3.5 h-3.5 mr-1" />
                বিবেচনাধীন
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => handleAction('Planned')}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-xl"
              >
                <Compass className="w-3.5 h-3.5 mr-1" />
                পরিকল্পিত / Planned
              </Button>
              <Button
                size="sm"
                onClick={() => handleAction('In Progress')}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-xl"
              >
                <RefreshCcw className="w-3.5 h-3.5 mr-1" />
                কাজ চলছে
              </Button>
              <Button
                size="sm"
                onClick={() => handleAction('Completed')}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl"
              >
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                )}
                সম্পন্ন / Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
}
