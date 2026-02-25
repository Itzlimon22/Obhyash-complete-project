'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Gift,
  ArrowRightLeft,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReferralHistory {
  id: string;
  redeemed_at: string;
  reward_given: boolean;
  admin_status: string;
  redeemed_by_user?: {
    id: string;
    name: string;
    email: string;
  };
  referral?: {
    id: string;
    code: string;
    owner?: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export default function AdminReferralsPage() {
  const [history, setHistory] = useState<ReferralHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalRedemptions: 0,
    uniqueReferrers: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/referrals');
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch referrals');
      }

      setHistory(json.data || []);
      setStats(json.stats || { totalRedemptions: 0, uniqueReferrers: 0 });

      if (showToast) toast.success('ডেটা রিফ্রেশ করা হয়েছে');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error loading referral data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleAction = async (
    historyId: string,
    action: 'approve' | 'reject',
  ) => {
    try {
      const res = await fetch('/api/admin/referrals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ historyId, action }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || `Failed to ${action} referral`);

      toast.success(data.message);
      fetchData(); // Refresh UI
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const filteredHistory = history.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.referral?.code?.toLowerCase().includes(q) ||
      item.referral?.owner?.name?.toLowerCase().includes(q) ||
      item.referral?.owner?.email?.toLowerCase().includes(q) ||
      item.redeemed_by_user?.name?.toLowerCase().includes(q) ||
      item.redeemed_by_user?.email?.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-red-600 dark:text-red-400 mx-auto mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">
            রেফারেল ডেটা লোড হচ্ছে...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 border-b border-neutral-200 dark:border-neutral-800 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
              <Gift className="w-8 h-8 text-red-600" />
              রেফারেল ম্যানেজমেন্ট
            </h1>
            <p className="text-neutral-500 mt-2">
              সকল ব্যবহারকারীর রেফারেল হিস্ট্রি এবং স্ট্যাটাস দেখুন
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? 'animate-spin' : ''}
              />
              <span>{isRefreshing ? 'লোডিং...' : 'রিফ্রেশ'}</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              label: 'মোট রেফারেল',
              value: stats.totalRedemptions.toString(),
              icon: ArrowRightLeft,
              gradient: 'from-emerald-500 to-emerald-500',
              bg: 'bg-emerald-50 dark:bg-emerald-500/10',
            },
            {
              label: 'উনিক রেফারার',
              value: stats.uniqueReferrers.toString(),
              icon: Users,
              gradient: 'from-red-500 to-red-500',
              bg: 'bg-red-50 dark:bg-red-500/10',
            },
          ].map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-[1.5rem] border border-neutral-200/60 dark:border-neutral-800/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`p-3 rounded-xl ${stat.bg} text-white bg-gradient-to-br ${stat.gradient}`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Table View */}
        <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="text"
                placeholder="রিসার্চ করুন (নাম, ইমেইল, কোড)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">তারিখ</th>
                  <th className="px-6 py-4 font-bold">রেফারার (মালিক)</th>
                  <th className="px-6 py-4 font-bold">কোড</th>
                  <th className="px-6 py-4 font-bold">নতুন ইউজার</th>
                  <th className="px-6 py-4 font-bold">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400"
                    >
                      কোনো রেফারেল ডেটা পাওয়া যায়নি
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {new Date(item.redeemed_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">
                            {item.referral?.owner?.name || 'অজানা'}
                          </span>
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                            {item.referral?.owner?.email || 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono text-xs font-bold rounded-md border border-neutral-200 dark:border-neutral-700">
                          {item.referral?.code}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            {item.redeemed_by_user?.name || 'অজানা'}
                          </span>
                          <span className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">
                            {item.redeemed_by_user?.email || 'N/A'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {item.admin_status === 'Pending' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAction(item.id, 'approve')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg transition-colors"
                              title="Approve Bonus"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() => handleAction(item.id, 'reject')}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Reject Bonus"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : item.admin_status === 'Approved' ? (
                          <span className="inline-flex py-1 px-3 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold ring-1 ring-emerald-600/20 dark:ring-emerald-500/30">
                            অনুমোদিত
                          </span>
                        ) : (
                          <span className="inline-flex py-1 px-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold ring-1 ring-neutral-200 dark:ring-neutral-700">
                            বাতিল
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
