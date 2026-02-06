'use client';

import React, { useState } from 'react';
import {
  Bell,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  History,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { broadcastNotification } from '@/services/database';
import { NotificationType, NotificationPriority } from '@/lib/types';

export default function NotificationManagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement' as NotificationType,
    priority: 'normal' as NotificationPriority,
    target: 'all' as 'all' | 'specific',
    specificUserId: '',
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const target =
        formData.target === 'all'
          ? 'all'
          : formData.specificUserId
            ? [formData.specificUserId]
            : [];

      if (Array.isArray(target) && target.length === 0) {
        toast.error('Please specify a user ID');
        setIsLoading(false);
        return;
      }

      const result = await broadcastNotification(
        target,
        formData.title,
        formData.message,
        formData.type,
        {
          priority: formData.priority,
        },
      );

      if (result.success > 0) {
        toast.success(`Notification sent to ${result.success} users`);
        setFormData((prev) => ({
          ...prev,
          title: '',
          message: '',
          specificUserId: '',
        }));
      } else {
        toast.error('Failed to send notification');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
            <Bell className="text-brand-600" />
            নোটিফিকেশন সেন্টার (Notification Center)
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-2">
            ব্যবহারকারীদের নোটিফিকেশন পাঠান এবং ম্যানেজ করুন।
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Send Notification Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
              <Send size={20} className="text-brand-600" />
              নতুন নোটিফিকেশন পাঠান
            </h2>

            <form onSubmit={handleSend} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    শিরোনাম (Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    placeholder="e.g., নতুন এক্সাম আপলোড করা হয়েছে"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    ধরন (Type)
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value as NotificationType,
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="system">System</option>
                    <option value="info">Info</option>
                    <option value="warning">Warning</option>
                    <option value="success">Success</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  মেসেজ (Message)
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none"
                  placeholder="বিস্তারিত লিখুন..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    অগ্রাধিকার (Priority)
                  </label>
                  <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-950 p-1 rounded-lg">
                    {(['low', 'normal', 'high'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, priority: p })
                        }
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                          formData.priority === p
                            ? 'bg-white dark:bg-neutral-800 text-brand-600 shadow-sm'
                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    কাকে পাঠাবেন (Target)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, target: 'all' })
                      }
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        formData.target === 'all'
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Users size={16} />
                      সবাইকে
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, target: 'specific' })
                      }
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                        formData.target === 'specific'
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300'
                          : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <UserIcon size={16} />
                      নির্দিষ্ট ইউজার
                    </button>
                  </div>
                  {formData.target === 'specific' && (
                    <input
                      type="text"
                      placeholder="User ID (UUID)"
                      value={formData.specificUserId}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specificUserId: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 outline-none transition-all"
                    />
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium shadow-lg shadow-brand-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />{' '}
                      প্রোসেসিং...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> নোটিফিকেশন পাঠান
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Instructions / Info Panel */}
        <div className="space-y-6">
          <div className="bg-brand-50 dark:bg-brand-900/10 rounded-xl p-6 border border-brand-100 dark:border-brand-900/30">
            <h3 className="font-bold text-brand-800 dark:text-brand-300 mb-4 flex items-center gap-2">
              <Info size={20} />
              ব্যবহারবিধি
            </h3>
            <ul className="space-y-3 text-sm text-brand-700 dark:text-brand-400">
              <li className="flex gap-2">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Announcement:</strong> সাধারণ নোটিশ বা ঘোষণার জন্য
                  ব্যবহার করুন। সব ইউজারের কাছে যাবে।
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>System:</strong> সিস্টেম মেইনটেনেন্স বা আপডেটের খবরের
                  জন্য।
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span>
                  <strong>Warning:</strong> গুরুত্বপূর্ণ সতর্কবার্তা বা
                  নির্দেশনার জন্য।
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <History size={20} />
              রিসেন্ট অ্যাক্টিভিটি
            </h3>
            <div className="text-center py-8 text-neutral-400 text-sm">
              এখনও কোন হিস্ট্রি নেই
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
