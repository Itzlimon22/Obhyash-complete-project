import React, { useState } from 'react';
import {
  X,
  Ban,
  AlertTriangle,
  Clock,
  ShieldAlert,
  FileText,
  CheckCircle,
} from 'lucide-react';
import { User } from '@/lib/types';
import { toast } from 'sonner';

interface SuspendUserModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = [
  'Account Sharing & Multi-Device Abuse',
  'Terms of Service & Code of Conduct Violation',
  'Suspicious Activity / Spam Exam Attempts',
  'Payment Dispute / Chargeback Issue',
  'Academic Integrity Breach (Question bank leak)',
  'Other Policy Violation',
];

const DURATIONS = [
  { label: '24 Hours (Warning)', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days (1 Week)', days: 7 },
  { label: '30 Days (1 Month)', days: 30 },
  { label: 'Permanent Ban', days: 0 },
];

export default function SuspendUserModal({
  user,
  isOpen,
  onClose,
  onSuccess,
}: SuspendUserModalProps) {
  const [selectedReason, setSelectedReason] = useState(REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [selectedDays, setSelectedDays] = useState(7);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSuspend = async () => {
    const finalReason = selectedReason === 'Other Policy Violation' && customReason.trim()
      ? customReason.trim()
      : selectedReason;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/users/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'suspend_user',
          userId: user.id,
          userEmail: user.email,
          reason: finalReason,
          durationDays: selectedDays,
          adminNotes: adminNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to suspend user');

      toast.success(`${user.name || 'User'} has been suspended`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to suspend user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Ban className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Suspend / Ban User Account
              </h2>
              <p className="text-xs text-red-100 mt-0.5">
                {user.name} ({user.student_id || user.email || 'User'})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
            <ShieldAlert size={16} className="text-red-600 shrink-0 mt-0.5" />
            <span>
              Suspending this user will immediately revoke all active sessions, block app login, and record this event in the compliance audit log.
            </span>
          </div>

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
              Reason for Suspension
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {selectedReason === 'Other Policy Violation' && (
            <div>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Specify suspension reason..."
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {/* Duration Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
              <Clock size={13} />
              Suspension Duration
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DURATIONS.map((d) => (
                <button
                  type="button"
                  key={d.days}
                  onClick={() => setSelectedDays(d.days)}
                  className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                    selectedDays === d.days
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Internal Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5 flex items-center gap-1">
              <FileText size={13} />
              Internal Support Note / Evidence
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Reported by proctor during live exam; IP match with another account..."
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSuspend}
            disabled={isSubmitting}
            className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-500/20 active:scale-[0.98] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Ban size={14} />
            )}
            Confirm Suspension
          </button>
        </div>
      </div>
    </div>
  );
}
