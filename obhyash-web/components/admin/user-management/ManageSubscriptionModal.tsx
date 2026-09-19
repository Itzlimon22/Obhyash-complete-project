import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/lib/types';

interface ManageSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdate: () => void;
}

const PLAN_OPTIONS = [
  { id: 'Free', label: 'Free Plan', days: 0 },
  { id: '1 Month', label: '১ মাস (1 Month - ৳১৪৯)', days: 30 },
  { id: '3 Months', label: '৩ মাস (3 Months - ৳৩৪৯)', days: 90 },
  { id: '6 Months', label: '৬ মাস (6 Months - ৳৫৯৯)', days: 180 },
  { id: '1 Year', label: '১ বছর (1 Year - ৳৯৯৯)', days: 365 },
  { id: 'Lifetime', label: 'লাইফটাইম (Lifetime Access)', days: 3650 },
];

export default function ManageSubscriptionModal({
  isOpen,
  onClose,
  user,
  onUpdate,
}: ManageSubscriptionModalProps) {
  const [plan, setPlan] = useState<string>('Free');
  const [status, setStatus] = useState<string>('Active');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      const currentPlan = user.subscription?.plan || 'Free';
      const currentStatus = user.subscription?.status || (currentPlan === 'Free' ? 'Inactive' : 'Active');
      setPlan(currentPlan);
      setStatus(currentStatus);
      setReason('');

      if (user.subscription?.expiry) {
        const d = new Date(user.subscription.expiry);
        if (!isNaN(d.getTime())) {
          setExpiryDate(d.toISOString().split('T')[0]);
        } else {
          setExpiryDate('');
        }
      } else {
        setExpiryDate('');
      }
    }
  }, [user, isOpen]);

  const handlePlanChange = (newPlan: string) => {
    setPlan(newPlan);
    if (newPlan === 'Free') {
      setStatus('Inactive');
      setExpiryDate('');
    } else {
      setStatus('Active');
      const opt = PLAN_OPTIONS.find((p) => p.id === newPlan);
      const days = opt ? opt.days : 30;
      const target = new Date();
      target.setDate(target.getDate() + days);
      setExpiryDate(target.toISOString().split('T')[0]);
    }
  };

  const handleAddDays = (days: number) => {
    const base = expiryDate ? new Date(expiryDate) : new Date();
    const current = isNaN(base.getTime()) ? new Date() : base;
    current.setDate(current.getDate() + days);
    setExpiryDate(current.toISOString().split('T')[0]);
    if (plan === 'Free') {
      setPlan('1 Month');
      setStatus('Active');
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsLoading(true);

    try {
      const isFree = plan === 'Free';
      let expiryIso: string | null = null;
      if (!isFree && expiryDate) {
        const d = new Date(expiryDate);
        d.setHours(23, 59, 59, 999);
        expiryIso = d.toISOString();
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update_subscription',
          userId: user.id,
          plan,
          status: isFree ? 'Inactive' : status,
          expiry: expiryIso,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update subscription');
      }

      toast.success(data.message || 'Subscription updated successfully');
      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating subscription:', error);
      toast.error(error.message || 'Failed to update subscription');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const isFree = plan === 'Free';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-2xl w-full max-w-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Manage Subscription
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              for <span className="font-semibold text-neutral-800 dark:text-neutral-200">{user.name}</span> ({user.email || user.phone || 'No contact'})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Current Info Banner */}
          <div className="flex gap-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
            <div className="flex-1">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                Current Plan
              </p>
              <p className="font-bold text-sm sm:text-base text-emerald-950 dark:text-emerald-100">
                {user.subscription?.plan || 'Free'}
              </p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
                Current Expiry
              </p>
              <p className="font-mono text-xs sm:text-sm text-emerald-950 dark:text-emerald-100 font-medium">
                {user.subscription?.expiry
                  ? new Date(user.subscription.expiry).toLocaleDateString('bn-BD', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'N/A (Free)'}
              </p>
            </div>
          </div>

          {/* Select Subscription Plan */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Select Package / Plan
            </label>
            <select
              value={plan}
              onChange={(e) => handlePlanChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {PLAN_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Change (Only if not Free) */}
          {!isFree && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                Subscription Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Active">Active (সক্রিয়)</option>
                <option value="Paused">Paused (স্থগিত)</option>
                <option value="Canceled">Canceled (বাতিল)</option>
                <option value="Past Due">Past Due (মেয়াদোত্তীর্ণ)</option>
              </select>
            </div>
          )}

          {/* Expiry Date & Extension (Only if not Free) */}
          {!isFree && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex justify-between items-center">
                <span>Expiration Date</span>
                <span className="text-xs text-neutral-500 font-normal">মেয়াদ শেষ হওয়ার তারিখ</span>
              </label>

              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 mb-2"
              />

              {/* Quick Extend Buttons */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleAddDays(7)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
                >
                  +৭ দিন
                </button>
                <button
                  type="button"
                  onClick={() => handleAddDays(30)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
                >
                  +১ মাস (+৩০ দিন)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddDays(90)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
                >
                  +৩ মাস (+৯০ দিন)
                </button>
                <button
                  type="button"
                  onClick={() => handleAddDays(180)}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 rounded-lg transition-colors border border-neutral-200 dark:border-neutral-700"
                >
                  +৬ মাস (+১৮০ দিন)
                </button>
              </div>
            </div>
          )}

          {/* Reason Note */}
          <div>
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
              Admin Note / Reason <span className="text-xs font-normal text-neutral-500">(ঐচ্ছিক)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="সাবস্ক্রিপশন পরিবর্তন বা প্রদানের কারণ (যেমন: বিকাশ পেমেন্ট ভেরিফাইড / গিফট)"
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none h-18 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
