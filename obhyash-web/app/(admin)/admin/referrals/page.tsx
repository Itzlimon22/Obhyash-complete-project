'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  RefreshCw,
  Gift,
  ArrowRightLeft,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  ExternalLink,
  Edit3,
  Eye,
  Check,
  X,
  Copy,
  ShieldAlert,
  SlidersHorizontal,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToCSV } from '@/lib/utils/export-csv';

interface RefereeRecord {
  id: string;
  redeemed_at: string;
  admin_status: string;
  reward_given: boolean;
  student: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

interface UserReferralItem {
  id: string;
  code: string;
  created_at: string;
  expires_at?: string | null;
  isBlocked?: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role?: string;
  };
  totalUses: number;
  approvedUses: number;
  pendingUses: number;
  rejectedUses: number;
  hourlyUses?: number;
  hasAnomalyAlert?: boolean;
  referees: RefereeRecord[];
}

interface ReferralHistoryItem {
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
  const [activeTab, setActiveTab] = useState<'users' | 'history'>('users');
  const [userReferrals, setUserReferrals] = useState<UserReferralItem[]>([]);
  const [history, setHistory] = useState<ReferralHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalCodes: 0,
    totalRedemptions: 0,
    uniqueReferrers: 0,
    pendingApprovals: 0,
    approvedRewards: 0,
  });

  // Pagination for history
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Modal States
  const [drilldownUser, setDrilldownUser] = useState<UserReferralItem | null>(null);
  const [editCodeItem, setEditCodeItem] = useState<UserReferralItem | null>(null);
  const [newCodeValue, setNewCodeValue] = useState('');
  const [isSavingCode, setIsSavingCode] = useState(false);

  const formatTimestamp24h = (dateStr?: string | null) => {
    if (!dateStr) return { date: 'N/A', time: '', full: 'N/A' };
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { date: 'N/A', time: '', full: 'N/A' };
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds}`,
      full: `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`,
    };
  };

  const fetchData = useCallback(
    async (showToast = false) => {
      if (showToast) setIsRefreshing(true);
      else setIsLoading(true);

      try {
        const res = await fetch(
          `/api/admin/referrals?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(
            searchQuery,
          )}`,
        );
        const json = await res.json();
        if (res.ok && json.success !== false) {
          setUserReferrals(json.userReferrals || []);
          setHistory(json.history || []);
          setTotalCount(json.totalCount || 0);
          setStats(
            json.stats || {
              totalCodes: 0,
              totalRedemptions: 0,
              uniqueReferrers: 0,
              pendingApprovals: 0,
              approvedRewards: 0,
            },
          );

          // Update active drilldown if open
          if (drilldownUser) {
            const updated = (json.userReferrals || []).find(
              (u: UserReferralItem) => u.id === drilldownUser.id,
            );
            if (updated) setDrilldownUser(updated);
          }

          if (showToast) toast.success('রেফারেল ডেটা সফলভাবে রিফ্রেশ হয়েছে!');
        } else {
          toast.error(json.error || 'Failed to fetch referrals');
        }
      } catch (err) {
        console.error(err);
        toast.error('Network error loading referrals');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, pageSize, searchQuery, drilldownUser?.id],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`রেফারেল কোড "${code}" কপি হয়েছে!`);
  };

  // Open edit modal
  const handleOpenEditCode = (item: UserReferralItem) => {
    setEditCodeItem(item);
    setNewCodeValue(item.code);
  };

  // Toggle user referral block / unblock
  const handleToggleBlock = async (item: UserReferralItem) => {
    const actionLabel = item.isBlocked ? 'আনব্লক' : 'ব্লক';
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_block',
          referralId: item.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || `রেফারেল সুবিধা সফলভাবে ${actionLabel} করা হয়েছে!`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || `${actionLabel} করা সম্ভব হয়নি`);
    }
  };

  // Save updated referral code
  const handleSaveUpdatedCode = async () => {
    if (!editCodeItem || !newCodeValue.trim()) return;
    setIsSavingCode(true);
    try {
      const res = await fetch('/api/admin/referrals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_code',
          referralId: editCodeItem.id,
          newCode: newCodeValue.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'রেফারেল কোড সফলভাবে আপডেট হয়েছে!');
      setEditCodeItem(null);
      fetchData(true);
    } catch (err: any) {
      toast.error(err.message || 'কোড পরিবর্তন ব্যর্থ হয়েছে');
    } finally {
      setIsSavingCode(false);
    }
  };

  // Approve or Reject a referral redemption
  const handleApproveAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/referrals/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'স্ট্যাটাস আপডেট সফল হয়েছে!');
      fetchData(); // Refresh UI
    } catch (err: any) {
      toast.error(err.message || 'অ্যাকশন সম্পন্ন করা যায়নি');
    }
  };

  // Export CSV
  const exportCSV = () => {
    if (activeTab === 'users') {
      if (userReferrals.length === 0) return toast.error('কোনো ডেটা নেই');
      const headers = [
        'Owner Name',
        'Owner Email',
        'Referral Code',
        'Creation Date',
        'Total Used Count',
        'Approved Count',
        'Pending Count',
      ];
      const rows = userReferrals.map((u) => [
        u.owner.name,
        u.owner.email,
        u.code,
        formatTimestamp24h(u.created_at).full,
        u.totalUses,
        u.approvedUses,
        u.pendingUses,
      ]);
      const success = exportToCSV({
        filename: `user_referral_codes_${new Date().toISOString().split('T')[0]}.csv`,
        headers,
        rows,
      });
      if (success) toast.success('ইউজার রেফারেল শিট ডাউনলোড হয়েছে');
    } else {
      if (history.length === 0) return toast.error('কোনো ডেটা নেই');
      const headers = [
        'Redemption ID',
        'Redeemed Date & Time (24h)',
        'Referrer Name',
        'Referrer Email',
        'Referral Code',
        'Redeemed By Student',
        'Redeemed By Email',
        'Status',
      ];
      const rows = history.map((item) => [
        item.id,
        formatTimestamp24h(item.redeemed_at).full,
        item.referral?.owner?.name || 'Unknown',
        item.referral?.owner?.email || 'N/A',
        item.referral?.code || 'N/A',
        item.redeemed_by_user?.name || 'Unknown',
        item.redeemed_by_user?.email || 'N/A',
        item.admin_status,
      ]);
      const success = exportToCSV({
        filename: `referrals_history_${new Date().toISOString().split('T')[0]}.csv`,
        headers,
        rows,
      });
      if (success) toast.success('রেফারেল হিস্ট্রি শিট ডাউনলোড হয়েছে');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-7 animate-in fade-in duration-300">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              গ্রোথ ও রেফারেল কন্ট্রোল সেন্টার
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Gift className="text-emerald-500" size={28} />
            <span>রেফারেল ও রিওয়ার্ড ম্যানেজমেন্ট</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
            ইউজারদের রেফারেল কোড, কে কখন কতবার কোড ব্যবহার করেছে এবং রিওয়ার্ড অনুমোদন বা বাতিল পরিচালনা করুন
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-xl transition border border-neutral-200 dark:border-zinc-700/60 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-emerald-500' : ''} />
          </button>

          <button
            onClick={exportCSV}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Download size={15} />
            <span>CSV এক্সপোর্ট</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Codes */}
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              মোট রেফারেল কোড
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
              <Gift size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
            {stats.totalCodes} <span className="text-xs font-bold text-neutral-500">টি কোড</span>
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-zinc-500">সক্রিয় রেফারার: {stats.uniqueReferrers} জন</p>
        </div>

        {/* Total Redemptions */}
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              মোট কোড ব্যবহার (Redemptions)
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20">
              <ArrowRightLeft size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {stats.totalRedemptions} <span className="text-xs font-bold text-neutral-500">বার</span>
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-zinc-500">অনুমোদিত রিওয়ার্ড: {stats.approvedRewards} টি</p>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              অপেক্ষমাণ অ্যাপ্রুভাল (Pending)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {stats.pendingApprovals} <span className="text-xs font-bold text-neutral-500">টি রিকোয়েস্ট</span>
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-zinc-500">অ্যাডমিনের অনুমোদনের অপেক্ষায়</p>
        </div>

        {/* Approved Rewards */}
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              সফল অনুমোদন (Approved)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {stats.approvedRewards} <span className="text-xs font-bold text-neutral-500">টি সম্পন্ন</span>
          </div>
          <p className="text-[11px] text-neutral-400 dark:text-zinc-500">বোনাস ও প্রো সাবস্ক্রিপশন প্রদানকৃত</p>
        </div>
      </div>

      {/* ── Main Tab Switcher & Search Bar ── */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-zinc-850 p-1 rounded-xl text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === 'users'
                  ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400'
              }`}
            >
              <Users size={14} />
              <span>ইউজার রেফারেল কোড ও পারফরম্যান্স ({userReferrals.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 ${
                activeTab === 'history'
                  ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400'
              }`}
            >
              <ArrowRightLeft size={14} />
              <span>রেফারেল হিস্ট্রি ও অ্যাপ্রুভাল রিকোয়েস্ট ({totalCount})</span>
            </button>
          </div>

          {/* Live Search */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ইউজার, ইমেইল বা কোড দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-700/60 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* ── Content View ── */}
      {isLoading ? (
        <div className="text-center py-20 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-2xl">
          <RefreshCw className="animate-spin text-emerald-500 mx-auto mb-2" size={28} />
          <p className="text-xs text-neutral-400 dark:text-zinc-500">রেফারেল তথ্য লোড হচ্ছে...</p>
        </div>
      ) : activeTab === 'users' ? (
        /* ══════════════════════════════════════════════════════
           TAB 1: USER REFERRAL CODES & METRICS
        ══════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-zinc-900/60 border-b border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">রেফারার ইউজার</th>
                  <th className="py-3.5 px-4">রেফারেল কোড</th>
                  <th className="py-3.5 px-4">তৈরির তারিখ ও সময় (24h)</th>
                  <th className="py-3.5 px-4 text-center">মোট ব্যবহারকারী</th>
                  <th className="py-3.5 px-4 text-center">অনুমোদন স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">রেফারেল অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/80 font-medium">
                {userReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-neutral-400 dark:text-zinc-500">
                      কোনো রেফারেল কোড পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  userReferrals.map((item) => {
                    const timeObj = formatTimestamp24h(item.created_at);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-neutral-50/70 dark:hover:bg-zinc-800/30 transition group"
                      >
                        {/* User Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {item.owner.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/user-management/${item.owner.id}`}
                                className="font-bold text-neutral-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 truncate"
                              >
                                <span>{item.owner.name}</span>
                                <ExternalLink size={11} className="opacity-40" />
                              </Link>
                              <span className="text-[10px] text-neutral-400 dark:text-zinc-500 block truncate">
                                {item.owner.email || 'No email'} {item.owner.phone ? `• ${item.owner.phone}` : ''}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Referral Code */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-neutral-100 dark:bg-zinc-800 border border-neutral-200/80 dark:border-zinc-700/80 font-mono font-black text-xs text-neutral-900 dark:text-white">
                              <span>{item.code}</span>
                              <button
                                onClick={() => handleCopyCode(item.code)}
                                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200 transition"
                                title="কপি করুন"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                            {item.hasAnomalyAlert && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 text-[10px] font-black animate-pulse">
                                <ShieldAlert size={11} className="text-red-600" />
                                ১ ঘণ্টায় {item.hourlyUses || 10}+ (অ্যানোমালি)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created At (24h) */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-neutral-900 dark:text-zinc-200">
                            {timeObj.date}
                          </div>
                          <div className="font-mono text-[10px] text-neutral-400 dark:text-zinc-500">
                            {timeObj.time}
                          </div>
                        </td>

                        {/* Total Uses */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-mono font-black text-xs ${
                              item.totalUses > 0
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : 'bg-neutral-100 text-neutral-500 dark:bg-zinc-800 dark:text-zinc-500'
                            }`}
                          >
                            {item.totalUses} জন
                          </span>
                        </td>

                        {/* Status Breakdown */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold">
                            <span className="text-emerald-600 dark:text-emerald-400">
                              ✓ {item.approvedUses} অনুমোদিত
                            </span>
                            {item.pendingUses > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                                ⏳ {item.pendingUses} অপেক্ষমাণ
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Drilldown Referees Button */}
                            <button
                              onClick={() => setDrilldownUser(item)}
                              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-300 text-neutral-800 dark:text-zinc-200 text-xs font-bold transition border border-neutral-200/60 dark:border-zinc-700/60 flex items-center gap-1.5"
                              title="কে কে ব্যবহার করেছে দেখুন"
                            >
                              <Users size={13} />
                              <span>ব্যবহারকারী ({item.totalUses})</span>
                            </button>

                            {/* Edit Code Button */}
                            <button
                              onClick={() => handleOpenEditCode(item)}
                              className="p-1.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 transition border border-neutral-200/60 dark:border-zinc-700/60"
                              title="রেফারেল কোড পরিবর্তন করুন"
                            >
                              <Edit3 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════
           TAB 2: REDEMPTION LOGS & APPROVAL REQUESTS
        ══════════════════════════════════════════════════════ */
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-zinc-900/60 border-b border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">তারিখ ও সময় (24h)</th>
                  <th className="py-3.5 px-4">রেফারার (কোড মালিক)</th>
                  <th className="py-3.5 px-4">রেফারেল কোড</th>
                  <th className="py-3.5 px-4">ব্যবহারকারী শিক্ষার্থী</th>
                  <th className="py-3.5 px-4 text-center">স্ট্যাটাস</th>
                  <th className="py-3.5 px-4 text-right">অ্যাপ্রুভাল অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/80 font-medium">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-neutral-400 dark:text-zinc-500">
                      কোনো রেফারেল হিস্ট্রি পাওয়া যায়নি।
                    </td>
                  </tr>
                ) : (
                  history.map((item) => {
                    const timeObj = formatTimestamp24h(item.redeemed_at);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-neutral-50/70 dark:hover:bg-zinc-800/30 transition group"
                      >
                        {/* Time (24h) */}
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-xs text-neutral-900 dark:text-zinc-200">
                            {timeObj.date}
                          </div>
                          <div className="font-mono text-[10px] text-neutral-400 dark:text-zinc-500">
                            {timeObj.time}
                          </div>
                        </td>

                        {/* Referrer */}
                        <td className="py-3.5 px-4">
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 dark:text-white block truncate">
                              {item.referral?.owner?.name || 'অজানা'}
                            </span>
                            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 block truncate">
                              {item.referral?.owner?.email || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Referral Code */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-neutral-100 dark:bg-zinc-800 font-mono font-bold text-xs text-neutral-900 dark:text-white">
                            {item.referral?.code}
                          </span>
                        </td>

                        {/* Redeemed By Student */}
                        <td className="py-3.5 px-4">
                          <div className="min-w-0">
                            <span className="font-bold text-neutral-900 dark:text-white block truncate">
                              {item.redeemed_by_user?.name || 'অজানা'}
                            </span>
                            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 block truncate">
                              {item.redeemed_by_user?.email || 'N/A'}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 text-center">
                          {item.admin_status === 'Approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                              <CheckCircle size={11} /> অনুমোদিত
                            </span>
                          ) : item.admin_status === 'Rejected' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                              <XCircle size={11} /> বাতিল
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px] animate-pulse">
                              <Clock size={11} /> অপেক্ষমাণ
                            </span>
                          )}
                        </td>

                        {/* Approval Actions */}
                        <td className="py-3.5 px-4 text-right">
                          {item.admin_status === 'Pending' || !item.admin_status ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveAction(item.id, 'approve')}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-sm"
                              >
                                <Check size={13} />
                                <span>অনুমোদন</span>
                              </button>
                              <button
                                onClick={() => handleApproveAction(item.id, 'reject')}
                                className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 text-neutral-700 dark:text-zinc-300 font-bold text-xs transition border border-neutral-200/60 dark:border-zinc-700/60"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-neutral-400 dark:text-zinc-500">
                              কার্যক্রম সম্পন্ন
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* History Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-zinc-800 text-xs font-bold">
              <span className="text-neutral-500 dark:text-zinc-400">
                মোট {totalCount} টির মধ্যে পৃষ্ঠা {page} / {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-zinc-800 disabled:opacity-40 text-neutral-800 dark:text-zinc-200"
                >
                  আগের পৃষ্ঠা
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-zinc-800 disabled:opacity-40 text-neutral-800 dark:text-zinc-200"
                >
                  পরের পৃষ্ঠা
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         DRILLDOWN MODAL: "কে কে কোড ব্যবহার করেছে"
      ══════════════════════════════════════════════════════ */}
      {drilldownUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151518] border border-neutral-200 dark:border-zinc-800 rounded-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                    {drilldownUser.code}
                  </span>
                  <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                    {drilldownUser.owner.name} এর রেফারেল ব্যবহারকারীগণ
                  </h3>
                </div>
                <p className="text-[11px] text-neutral-400 dark:text-zinc-500 mt-0.5">
                  এই কোড ব্যবহার করে সর্বমোট {drilldownUser.totalUses} জন শিক্ষার্থী প্ল্যাটফর্মে যুক্ত হয়েছে
                </p>
              </div>

              <button
                onClick={() => setDrilldownUser(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* List of Referees */}
            {drilldownUser.referees.length === 0 ? (
              <div className="text-center py-12 text-neutral-400 dark:text-zinc-500 text-xs">
                এখনো কোনো শিক্ষার্থী এই কোডটি ব্যবহার করেনি।
              </div>
            ) : (
              <div className="space-y-2.5">
                {drilldownUser.referees.map((ref, idx) => {
                  const tObj = formatTimestamp24h(ref.redeemed_at);

                  return (
                    <div
                      key={ref.id}
                      className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-neutral-900 dark:text-white block">
                            {ref.student.name}
                          </span>
                          <span className="text-[11px] text-neutral-400 dark:text-zinc-500 block">
                            {ref.student.email}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 text-right">
                        <div>
                          <span className="font-mono text-neutral-800 dark:text-zinc-200 block text-[11px]">
                            {tObj.date} {tObj.time}
                          </span>
                          <span
                            className={`text-[10px] font-bold ${
                              ref.admin_status === 'Approved'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : ref.admin_status === 'Rejected'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {ref.admin_status === 'Approved'
                              ? '✓ অনুমোদিত'
                              : ref.admin_status === 'Rejected'
                              ? '✕ বাতিল'
                              : '⏳ অপেক্ষমাণ'}
                          </span>
                        </div>

                        {ref.admin_status === 'Pending' && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleApproveAction(ref.id, 'approve')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                            >
                              অনুমোদন
                            </button>
                            <button
                              onClick={() => handleApproveAction(ref.id, 'reject')}
                              className="px-2.5 py-1 rounded-lg bg-neutral-200 dark:bg-zinc-800 hover:bg-rose-100 hover:text-rose-700 text-neutral-700 dark:text-zinc-300 font-bold text-[11px]"
                            >
                              বাতিল
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-2 border-t border-neutral-100 dark:border-zinc-800">
              <button
                onClick={() => setDrilldownUser(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-xs font-bold text-neutral-800 dark:text-zinc-200"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
         EDIT REFERRAL CODE MODAL
      ══════════════════════════════════════════════════════ */}
      {editCodeItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151518] border border-neutral-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  রেফারেল কোড পরিবর্তন
                </span>
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  {editCodeItem.owner.name} এর রেফারেল কোড
                </h3>
              </div>
              <button
                onClick={() => setEditCodeItem(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300 block">
                নতুন রেফারেল কোড (Custom Code):
              </label>
              <input
                type="text"
                value={newCodeValue}
                onChange={(e) => setNewCodeValue(e.target.value.toUpperCase())}
                placeholder="যেমন: VIP2026, OBHYASH50..."
                className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-700/60 rounded-xl text-sm font-mono font-bold text-neutral-900 dark:text-white uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <span className="text-[10px] text-neutral-400 dark:text-zinc-500">
                ইংরেজি বড় হাতের অক্ষর ও সংখ্যা ব্যবহার করুন।
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-zinc-800">
              <button
                onClick={() => setEditCodeItem(null)}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-xs font-bold text-neutral-800 dark:text-zinc-200"
              >
                বাতিল
              </button>
              <button
                disabled={isSavingCode}
                onClick={handleSaveUpdatedCode}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
              >
                {isSavingCode ? 'সংরক্ষণ হচ্ছে...' : 'কোড পরিবর্তন করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
