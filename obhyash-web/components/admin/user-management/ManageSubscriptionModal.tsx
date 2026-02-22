import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { User } from '@/lib/types';

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: () => void;
}

export default function ManageSubscriptionModal({
  isOpen,
  onClose,
  user,
  onUpdate,
}: ManageSubscriptionModalProps) {
  const [status, setStatus] = useState<string>('Active');
  const [extensionDays, setExtensionDays] = useState<number>(0);
  const [newExpiry, setNewExpiry] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && user.subscription) {
      setStatus(user.subscription.status || 'Active');
      setNewExpiry(user.subscription.expiry || new Date().toISOString());
      setExtensionDays(0);
      setReason('');
    }
  }, [user, isOpen]);

  // Auto-calculate new date when days change
  useEffect(() => {
    if (user?.subscription?.expiry && extensionDays !== 0) {
      const current = new Date(user.subscription.expiry);
      // Valid date check
      if (!isNaN(current.getTime())) {
        current.setDate(current.getDate() + extensionDays);
        setNewExpiry(current.toISOString());
      }
    }
  }, [extensionDays, user]);

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);
    const supabase = createClient();

    try {
      // 1. Update User Subscription JSON
      const updatedSubscription = {
        ...user.subscription,
        status: status,
        expiry: newExpiry,
      };

      const { error: updateError } = await supabase
        .from('users')
        .update({ subscription: updatedSubscription })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Log Activity
      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        activity_type: 'subscription_update',
        description: `Admin updated subscription: Status=${status}, Expiry=${new Date(newExpiry).toLocaleDateString()}`,
        metadata: {
          previous_status: user.subscription?.status,
          new_status: status,
          admin_reason: reason,
        },
      });

      toast.success('Subscription updated successfully');
      onUpdate();
      onClose();
    } catch (error: unknown) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-2xl w-full max-w-md border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Manage Subscription
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              for {user.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Current Info */}
          <div className="flex gap-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
            <div className="flex-1">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                Current Plan
              </p>
              <p className="font-bold text-emerald-900 dark:text-emerald-100">
                {user.subscription?.plan || 'Free'}
              </p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                Expiry
              </p>
              <p className="font-mono text-sm text-emerald-900 dark:text-emerald-100">
                {user.subscription?.expiry
                  ? new Date(user.subscription.expiry).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
          </div>

          {/* Status Change */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Subscription Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Canceled">Canceled</option>
              <option value="Past Due">Past Due</option>
            </select>
          </div>

          {/* Extension */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5 flex justify-between">
              <span>Extend Duration (Days)</span>
              <span className="text-xs text-neutral-500 font-normal">
                Adds to current expiry
              </span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setExtensionDays((d) => d + 7)}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
              >
                +7 Days
              </button>
              <button
                onClick={() => setExtensionDays((d) => d + 30)}
                className="px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
              >
                +30 Days
              </button>
              <input
                type="number"
                value={extensionDays}
                onChange={(e) =>
                  setExtensionDays(parseInt(e.target.value) || 0)
                }
                className="w-full flex-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-t-2xl sm:rounded-md rounded-b-none sm:rounded-b-md animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 text-sm outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* New Expiry Preview */}
          {extensionDays !== 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
              <Clock size={16} />
              <span>
                New Expiry:{' '}
                <strong>{new Date(newExpiry).toLocaleDateString()}</strong>
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Admin Reason / Note
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you changing this?"
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none h-20 resize-none"
            />
          </div>
        </div>

        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
