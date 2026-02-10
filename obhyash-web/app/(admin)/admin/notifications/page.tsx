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
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-2">
            <Bell className="text-rose-600 shrink-0" size={24} />
            নোটিফিকেশন সেন্টার
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8">
        {/* Send Notification Form */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 md:p-8">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 md:mb-6 flex items-center gap-2">
              <Send size={20} className="text-rose-600" />
              নতুন নোটিফিকেশন পাঠান
            </h2>

            <form onSubmit={handleSend} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 ml-1">
                    শিরোনাম (Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm"
                    placeholder="নোটিফিকেশনের শিরোনাম দিন"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 ml-1">
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
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all text-sm cursor-pointer"
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
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 ml-1">
                  মেসেজ (Message)
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all resize-none text-sm leading-relaxed"
                  placeholder="বিস্তারিত বার্তাটি এখানে লিখুন..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 ml-1">
                    অগ্রাধিকার (Priority)
                  </label>
                  <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-950 p-1.5 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50">
                    {(['low', 'normal', 'high'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, priority: p })
                        }
                        className={`flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all active:scale-95 ${
                          formData.priority === p
                            ? 'bg-white dark:bg-neutral-800 text-rose-600 shadow-sm border border-neutral-200 dark:border-neutral-700'
                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 ml-1">
                    কাকে পাঠাবেন (Target)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, target: 'all' })
                      }
                      className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        formData.target === 'all'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
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
                      className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                        formData.target === 'specific'
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <UserIcon size={16} />
                      নির্দিষ্ট
                    </button>
                  </div>
                  {formData.target === 'specific' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input
                        type="text"
                        placeholder="User ID লিখুন (UUID)"
                        value={formData.specificUserId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specificUserId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white text-xs focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />{' '}
                      প্রোসেসিং...
                    </>
                  ) : (
                    <>
                      <Send size={20} /> পাঠান
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Instructions / Info Panel */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          <div className="bg-rose-50 dark:bg-rose-900/10 rounded-2xl md:rounded-[2rem] p-5 md:p-6 border border-rose-100 dark:border-rose-900/30">
            <h3 className="font-bold text-rose-800 dark:text-rose-300 mb-4 flex items-center gap-2">
              <Info size={20} />
              টিপস
            </h3>
            <ul className="space-y-4 text-xs sm:text-sm text-rose-700 dark:text-rose-400 font-medium">
              <li className="flex gap-3">
                <div className="shrink-0 w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-800 flex items-center justify-center text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                  1
                </div>
                <span>
                  <strong>Announcement:</strong> সাধারণ নোটিশ বা সবার জন্য
                  ঘোষণার জন্য এটি ব্যবহার করুন।
                </span>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-800 flex items-center justify-center text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                  2
                </div>
                <span>
                  <strong>System:</strong> অ্যাপ আপডেট বা গুরুত্বপূর্ণ সিস্টেম
                  মেসেজের জন্য ব্যবহার করুন।
                </span>
              </li>
              <li className="flex gap-3">
                <div className="shrink-0 w-5 h-5 rounded-full bg-rose-200 dark:bg-rose-800 flex items-center justify-center text-[10px] text-rose-700 dark:text-rose-300 font-bold">
                  3
                </div>
                <span>
                  <strong>Warning:</strong> অত্যন্ত গুরুত্বপূর্ণ নির্দেশনার জন্য
                  Priority High দিয়ে পাঠান।
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl md:rounded-[2rem] p-5 md:p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between min-h-[180px] md:min-h-[200px]">
            <h3 className="font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <History size={20} />
              রিসেন্ট অ্যাক্টিভিটি
            </h3>
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <div className="w-16 h-16 rounded-full bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center mb-3">
                <History
                  size={32}
                  className="text-neutral-300 dark:text-neutral-700"
                />
              </div>
              <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                এখনও কোন হিস্ট্রি নেই
              </p>
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
