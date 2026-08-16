'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Send,
  Users,
  CheckCircle2,
  AlertTriangle,
  Info,
  History,
  Loader2,
  RefreshCw,
  Trash2,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { NotificationType, NotificationPriority } from '@/lib/types';

export default function NotificationManagementPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    unread: 0,
    announcements: 0,
    systemAlerts: 0,
  });
  const [userList, setUserList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'announcement' as NotificationType,
    priority: 'normal' as NotificationPriority,
    target: 'all' as 'all' | 'specific',
    specificUserId: '',
  });

  const loadData = async () => {
    setFetchingData(true);
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setHistory(json.data.history || []);
          setStats(json.data.stats || {
            totalSent: 0,
            unread: 0,
            announcements: 0,
            systemAlerts: 0,
          });
          setUserList(json.data.users || []);
        }
      }
    } catch (e) {
      console.error('Failed to load notifications data:', e);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error('অনুগ্রহ করে শিরোনাম ও মেসেজ লিখুন');
      return;
    }

    if (formData.target === 'specific' && !formData.specificUserId) {
      toast.error('নির্দিষ্ট ব্যবহারকারী নির্বাচন করুন');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast',
          title: formData.title,
          message: formData.message,
          type: formData.type,
          priority: formData.priority,
          target: formData.target,
          userIds: formData.target === 'specific' ? [formData.specificUserId] : [],
        }),
      });

      const json = await res.json();

      if (res.ok && json.success) {
        toast.success(`নোটিফিকেশন সফলভাবে পাঠানো হয়েছে (${json.count} জন প্রাপক)`);
        setFormData({
          title: '',
          message: '',
          type: 'announcement',
          priority: 'normal',
          target: 'all',
          specificUserId: '',
        });
        loadData();
      } else {
        toast.error(json.error || 'নোটিফিকেশন পাঠাতে সমস্যা হয়েছে');
      }
    } catch (error) {
      console.error(error);
      toast.error('একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async (item: any) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          title: item.title,
          createdAt: item.created_at,
        }),
      });
      if (res.ok) {
        toast.success('নোটিফিকেশন হিস্ট্রি মুছে ফেলা হয়েছে');
        loadData();
      }
    } catch (e) {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  const filteredUsers = userList.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'announcement':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'system':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'warning':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'success':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-7xl mx-auto p-4 lg:p-8 text-neutral-900 dark:text-neutral-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Bell className="text-red-600 shrink-0" size={28} />
            নোটিফিকেশন সেন্টার
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            সকল শিক্ষার্থীকে রিয়েল-টাইম বার্তা ও সিস্টেম নোটিশ পাঠান
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={fetchingData}
          className="p-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all self-start sm:self-auto flex items-center gap-2 text-xs font-bold"
        >
          <RefreshCw
            size={16}
            className={`text-neutral-500 ${fetchingData ? 'animate-spin' : ''}`}
          />
          রিফ্রেশ
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold mb-1">
            <span>মোট প্রেরিত</span>
            <Radio size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-neutral-900 dark:text-white">
            {stats.totalSent}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold mb-1">
            <span>ঘোষণা (Announcements)</span>
            <Sparkles size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {stats.announcements}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold mb-1">
            <span>সিস্টেম অ্যালার্ট</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {stats.systemAlerts}
          </p>
        </div>

        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-bold mb-1">
            <span>অপঠিত (Unread)</span>
            <Bell size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">
            {stats.unread}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Send Notification Form */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 sm:p-8">
            <h2 className="text-lg font-black text-neutral-900 dark:text-white mb-6 flex items-center gap-2">
              <Send size={20} className="text-red-600" />
              নতুন নোটিফিকেশন তৈরি করুন
            </h2>

            <form onSubmit={handleSend} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2 ml-1">
                    শিরোনাম (Title)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all text-xs sm:text-sm font-medium"
                    placeholder="যেমন: নতুন মডেল টেস্ট উন্মুক্ত হয়েছে!"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2 ml-1">
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
                    className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all text-xs sm:text-sm font-medium cursor-pointer"
                  >
                    <option value="announcement">Announcement (ঘোষণা)</option>
                    <option value="system">System (সিস্টেম)</option>
                    <option value="info">Info (তথ্য)</option>
                    <option value="warning">Warning (সতর্কতা)</option>
                    <option value="success">Success (সাফল্য)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2 ml-1">
                  মেসেজ (Message)
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none transition-all resize-none text-xs sm:text-sm font-medium leading-relaxed"
                  placeholder="বিস্তারিত বার্তাটি এখানে সুন্দরভাবে লিখুন..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2 ml-1">
                    অগ্রাধিকার (Priority)
                  </label>
                  <div className="flex gap-2 bg-neutral-100 dark:bg-neutral-950 p-1 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/50">
                    {(['low', 'normal', 'high'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, priority: p })
                        }
                        className={`flex-1 py-2 text-xs font-black rounded-xl capitalize transition-all active:scale-95 ${
                          formData.priority === p
                            ? 'bg-white dark:bg-neutral-800 text-red-600 shadow-sm border border-neutral-200 dark:border-neutral-700'
                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-2 ml-1">
                    প্রাপক (Target Audience)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, target: 'all', specificUserId: '' })
                      }
                      className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                        formData.target === 'all'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <Users size={14} />
                      সকল শিক্ষার্থী
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, target: 'specific' })
                      }
                      className={`flex-1 py-2.5 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
                        formData.target === 'specific'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 shadow-sm'
                          : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <UserIcon size={14} />
                      নির্দিষ্ট শিক্ষার্থী
                    </button>
                  </div>
                </div>
              </div>

              {formData.target === 'specific' && (
                <div className="p-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 space-y-3">
                  <label className="block text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-wider">
                    শিক্ষার্থী খুঁজুন ও নির্বাচন করুন
                  </label>
                  <input
                    type="text"
                    placeholder="নাম, ইমেইল বা ফোন নম্বর দিয়ে খুঁজুন..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
                  />
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {filteredUsers.slice(0, 10).map((u) => (
                      <div
                        key={u.id}
                        onClick={() =>
                          setFormData({ ...formData, specificUserId: u.id })
                        }
                        className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                          formData.specificUserId === u.id
                            ? 'bg-red-600 text-white shadow-sm'
                            : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                        <div>
                          <p className="font-black leading-tight">{u.name || 'Student'}</p>
                          <p className="text-[10px] opacity-75">{u.email || u.phone || u.id}</p>
                        </div>
                        {formData.specificUserId === u.id && (
                          <CheckCircle2 size={16} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />{' '}
                      পাঠানো হচ্ছে...
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

        {/* History / Recent Broadcasts Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col min-h-[480px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-neutral-900 dark:text-white flex items-center gap-2 text-base">
                <History size={18} className="text-red-600" />
                রিসেন্ট ব্রডকাস্ট হিস্ট্রি
              </h3>
              <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                {history.length} টি রেকর্ড
              </span>
            </div>

            {fetchingData ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <Loader2 className="animate-spin text-red-600 mb-2" size={24} />
                <p className="text-xs text-neutral-400 font-bold">লোড হচ্ছে...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center mb-3">
                  <History
                    size={28}
                    className="text-neutral-300 dark:text-neutral-700"
                  />
                </div>
                <p className="text-neutral-400 text-xs font-bold uppercase tracking-wider">
                  কোন হিস্ট্রি পাওয়া যায়নি
                </p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-950/40 hover:border-neutral-200 dark:hover:border-neutral-700 transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase border ${getTypeBadge(
                            item.type,
                          )}`}
                        >
                          {item.type}
                        </span>
                        <h4 className="font-black text-xs text-neutral-900 dark:text-white mt-1.5">
                          {item.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => handleDeleteHistory(item)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold pt-1 border-t border-neutral-100 dark:border-neutral-800">
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {item.recipientCount > 1
                          ? `${item.recipientCount} জন প্রাপক`
                          : 'নির্দিষ্ট প্রাপক'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString('bn-BD', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
