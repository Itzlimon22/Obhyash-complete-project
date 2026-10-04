'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Bell,
  Search,
  RefreshCw,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  CheckCircle2,
  Circle,
  Eye,
  X,
  Filter,
  Send,
  History as HistoryIcon,
  Radio,
  Zap,
  Flame,
  Award,
  AlertTriangle,
  Info,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  body: string;
  message: string;
  type: string;
  priority: string;
  is_read: boolean;
  data: any;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar_url: string | null;
    institute: string;
  } | null;
}

function NotificationHistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [page, setPage] = useState<number>(() => {
    const p = searchParams.get('page');
    return p ? parseInt(p, 10) : 1;
  });
  const [limit, setLimit] = useState<number>(25);
  const [search, setSearch] = useState<string>(() => searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState<string>(() => searchParams.get('type') || 'all');
  const [readFilter, setReadFilter] = useState<string>(() => searchParams.get('read') || 'all');
  const [selectedUserId, setSelectedUserId] = useState<string>(() => searchParams.get('userId') || '');
  const [selectedUserName, setSelectedUserName] = useState<string>('');

  // Details Modal
  const [selectedItem, setSelectedItem] = useState<NotificationItem | null>(null);

  // Sync state to URL
  const updateUrl = useCallback(
    (p: number, q: string, t: string, r: string, u: string) => {
      const url = new URL(window.location.href);
      if (p > 1) url.searchParams.set('page', String(p));
      else url.searchParams.delete('page');

      if (q.trim()) url.searchParams.set('search', q.trim());
      else url.searchParams.delete('search');

      if (t !== 'all') url.searchParams.set('type', t);
      else url.searchParams.delete('type');

      if (r !== 'all') url.searchParams.set('read', r);
      else url.searchParams.delete('read');

      if (u) url.searchParams.set('userId', u);
      else url.searchParams.delete('userId');

      window.history.replaceState(null, '', url.pathname + (url.search ? url.search : ''));
    },
    [],
  );

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (search.trim()) params.set('search', search.trim());
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (readFilter !== 'all') params.set('readStatus', readFilter);
      if (selectedUserId) params.set('userId', selectedUserId);

      const res = await fetch(`/api/admin/notifications/history?${params.toString()}`);
      if (!res.ok) throw new Error('ডাটা ফেচ করতে সমস্যা হয়েছে');

      const json = await res.json();
      if (json.success && json.data) {
        setItems(json.data.items || []);
        setTotalCount(json.data.pagination.total || 0);
        setTotalPages(json.data.pagination.totalPages || 1);
      }
    } catch (err: any) {
      toast.error('হিস্ট্রি লোড করতে ব্যর্থ: ' + (err.message || 'Error'));
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, typeFilter, readFilter, selectedUserId]);

  useEffect(() => {
    fetchHistory();
    updateUrl(page, search, typeFilter, readFilter, selectedUserId);
  }, [fetchHistory, page, search, typeFilter, readFilter, selectedUserId, updateUrl]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই নোটিফিকেশন রেকর্ডটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/admin/notifications/history?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('নোটিফিকেশন সফলভাবে মুছে ফেলা হয়েছে');
        fetchHistory();
      } else {
        toast.error(json.error || 'মুছে ফেলতে ব্যর্থ হয়েছে');
      }
    } catch (e) {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে');
    }
  };

  const handleFilterByUser = (user: { id: string; name: string }) => {
    setSelectedUserId(user.id);
    setSelectedUserName(user.name);
    setPage(1);
    toast.info(`"${user.name}"-এর নোটিফিকেশন ফিল্টার করা হয়েছে`);
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setReadFilter('all');
    setSelectedUserId('');
    setSelectedUserName('');
    setPage(1);
  };

  const isFilterActive =
    search.trim() !== '' ||
    typeFilter !== 'all' ||
    readFilter !== 'all' ||
    Boolean(selectedUserId);

  const getTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('live_exam')) {
      return {
        label: 'লাইভ পরীক্ষা',
        badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        icon: Radio,
      };
    }
    if (t.includes('streak')) {
      return {
        label: 'স্ট্রিক অ্যালার্ট',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: Flame,
      };
    }
    if (t.includes('leaderboard') || t.includes('result')) {
      return {
        label: 'ফলাফল / মেধা',
        badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: Award,
      };
    }
    if (t.includes('announcement')) {
      return {
        label: 'ঘোষণা',
        badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: Zap,
      };
    }
    if (t.includes('warning')) {
      return {
        label: 'সতর্কবার্তা',
        badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        icon: AlertTriangle,
      };
    }
    return {
      label: type,
      badge: 'bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-300 border-neutral-200 dark:border-zinc-700',
      icon: Info,
    };
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 max-w-7xl mx-auto p-4 lg:p-8 text-neutral-900 dark:text-neutral-100">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
            <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400 tracking-wider uppercase">
              নোটিফিকেশন অডিট ও ডেলিভারি লগ
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <HistoryIcon className="text-red-600 shrink-0" size={28} />
            নোটিফিকেশন হিস্ট্রি
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
            কোন শিক্ষার্থীকে কখন কোন নোটিফিকেশন পাঠানো হয়েছে এবং তারা পড়েছে কি না তা বিস্তারিত দেখুন
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchHistory}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer"
          >
            <RefreshCw
              size={15}
              className={`text-neutral-500 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span>রিফ্রেশ</span>
          </button>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-neutral-200/80 dark:border-zinc-800 pb-3">
        <Link
          href="/admin/notifications"
          className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800/60 transition flex items-center gap-2"
        >
          <Send size={15} />
          <span>নতুন নোটিফিকেশন পাঠান</span>
        </Link>

        <div className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 text-white shadow-sm flex items-center gap-2">
          <HistoryIcon size={15} />
          <span>সম্পূর্ণ হিস্ট্রি ও লগ ({totalCount})</span>
        </div>
      </div>

      {/* ── Active User Filter Badge (if any) ── */}
      {selectedUserId && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <User size={16} className="text-red-600 dark:text-red-400" />
          <span className="text-xs font-bold text-red-700 dark:text-red-300">
            ফিল্টার: শুধুমাত্র <strong>{selectedUserName || selectedUserId}</strong>-এর নোটিফিকেশন দেখানো হচ্ছে
          </span>
          <button
            onClick={() => {
              setSelectedUserId('');
              setSelectedUserName('');
              setPage(1);
            }}
            className="ml-auto text-xs font-bold px-2 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            ফিল্টার মুছুন
          </button>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="শিক্ষার্থীর নাম, ইমেইল, ফোন অথবা নোটিফিকেশনের শিরোনাম খুঁজুন..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-9 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs focus:ring-2 focus:ring-red-500 outline-none text-neutral-900 dark:text-white"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <div className="lg:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold outline-none text-neutral-900 dark:text-white cursor-pointer"
            >
              <option value="all">সকল নোটিফিকেশন ধরন</option>
              <option value="announcement">ঘোষণা (Announcement)</option>
              <option value="prefix:live_exam">লাইভ পরীক্ষা (Live Exams)</option>
              <option value="prefix:streak">স্ট্রিক অ্যালার্ট (Streak)</option>
              <option value="system">সিস্টেম নোটিশ (System)</option>
              <option value="prefix:leaderboard">মেধা তালিকা ও রেজাল্ট</option>
              <option value="warning">সতর্কবার্তা (Warning)</option>
              <option value="info">তথ্যমূলক (Info)</option>
            </select>
          </div>

          {/* Read Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={readFilter}
              onChange={(e) => {
                setReadFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold outline-none text-neutral-900 dark:text-white cursor-pointer"
            >
              <option value="all">পড়ার অবস্থা (সব)</option>
              <option value="read">🟢 পঠিত (Read)</option>
              <option value="unread">⚪ অপঠিত (Unread)</option>
            </select>
          </div>

          {/* Per Page Limit & Reset */}
          <div className="lg:col-span-2 flex items-center gap-2 justify-end">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold outline-none text-neutral-900 dark:text-white cursor-pointer"
            >
              <option value={25}>২৫টি / পেজ</option>
              <option value={50}>৫০টি / পেজ</option>
              <option value={100}>১০০টি / পেজ</option>
            </select>

            {isFilterActive && (
              <button
                onClick={handleResetFilters}
                title="সকল ফিল্টার রিসেট করুন"
                className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
              >
                <X size={13} />
                <span>রিসেট</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table Section ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-950/60 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                <th className="p-4">প্রাপক শিক্ষার্থী (Recipient)</th>
                <th className="p-4">নোটিফিকেশন বিষয়বস্তু</th>
                <th className="p-4">ধরন (Type)</th>
                <th className="p-4">অবস্থা (Read Status)</th>
                <th className="p-4">পাঠানোর সময় (Sent At)</th>
                <th className="p-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-neutral-400 font-mono text-xs">
                    <RefreshCw className="animate-spin inline-block mr-2 text-red-600" size={16} />
                    নোটিফিকেশন লগ লোড হচ্ছে...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-neutral-500">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                      <Bell size={22} className="text-neutral-400" />
                    </div>
                    <p className="font-semibold text-sm text-neutral-700 dark:text-zinc-300">
                      কোনো নোটিফিকেশন পাওয়া যায়নি
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {isFilterActive
                        ? 'আপনার ফিল্টারের সাথে মিলে এমন কোনো রেকর্ড পাওয়া যায়নি।'
                        : 'এখনও কোনো নোটিফিকেশন পাঠানো হয়নি।'}
                    </p>
                    {isFilterActive && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1.5 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-200 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        সকল ফিল্টার ক্লিয়ার করুন
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const badge = getTypeBadge(item.type);
                  const Icon = badge.icon;
                  const dateStr = item.created_at ? new Date(item.created_at) : null;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
                    >
                      {/* Recipient User */}
                      <td className="p-4">
                        {item.user ? (
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-neutral-200 to-neutral-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center font-bold text-neutral-700 dark:text-zinc-200 text-xs shrink-0 overflow-hidden border border-neutral-200 dark:border-zinc-700">
                              {item.user.avatar_url ? (
                                <img
                                  src={item.user.avatar_url}
                                  alt={item.user.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (item.user.name || 'S').charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/user-management/${item.user.id}`}
                                className="font-bold text-neutral-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors text-xs flex items-center gap-1 group"
                                title="শিক্ষার্থীর প্রোফাইল দেখুন"
                              >
                                <span className="truncate">{item.user.name}</span>
                                <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </Link>
                              <p className="text-[11px] text-neutral-500 dark:text-zinc-400 truncate">
                                {item.user.email || item.user.phone || 'কোনো ইমেইল/ফোন নেই'}
                              </p>
                              <button
                                onClick={() => handleFilterByUser(item.user!)}
                                className="text-[10px] text-red-600 dark:text-red-400 font-bold hover:underline cursor-pointer inline-block mt-0.5"
                                title="এই ইউজারের সব নোটিফিকেশন ফিল্টার করুন"
                              >
                                সব লগ দেখুন
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="font-mono text-[11px] text-neutral-400">
                              User ID: {item.user_id ? item.user_id.substring(0, 8) + '...' : 'Unknown'}
                            </p>
                            <span className="text-[10px] text-neutral-400">(ইউজার প্রোফাইল পাওয়া যায়নি)</span>
                          </div>
                        )}
                      </td>

                      {/* Content */}
                      <td className="p-4 max-w-sm">
                        <p className="font-bold text-neutral-900 dark:text-white text-xs leading-snug line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.body || item.message || 'কোনো মেসেজ নেই'}
                        </p>
                        {item.data?.route && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-blue-600 dark:text-blue-400 mt-1 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/40">
                            🔗 {item.data.route}
                          </span>
                        )}
                      </td>

                      {/* Type Badge */}
                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.badge}`}
                        >
                          <Icon size={12} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Read Status */}
                      <td className="p-4 whitespace-nowrap">
                        {item.is_read ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> পঠিত (Read)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-zinc-800 text-neutral-500 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-700">
                            <Circle size={10} /> অপঠিত (Unread)
                          </span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-mono text-[11px] text-neutral-700 dark:text-zinc-300">
                          {dateStr
                            ? dateStr.toLocaleDateString('bn-BD', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </div>
                        <div className="font-mono text-[10px] text-neutral-400">
                          {dateStr
                            ? dateStr.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true,
                              })
                            : ''}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-2 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition cursor-pointer"
                            title="বিস্তারিত দেখুন"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={15} />
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

        {/* ── Pagination Footer ── */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-neutral-500 dark:text-neutral-400">
            সর্বমোট <strong>{totalCount}</strong> টির মধ্যে{' '}
            <strong>{Math.min(totalCount, (page - 1) * limit + 1)}</strong> -{' '}
            <strong>{Math.min(totalCount, page * limit)}</strong> টি দেখানো হচ্ছে
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 py-1 font-bold text-neutral-700 dark:text-zinc-300">
              পেজ {page} / {totalPages || 1}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Details Modal ── */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="font-black text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-red-600" />
                নোটিফিকেশন বিস্তারিত
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Recipient info */}
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider mb-1">
                  প্রাপক শিক্ষার্থী
                </p>
                {selectedItem.user ? (
                  <div>
                    <p className="font-bold text-sm text-neutral-900 dark:text-white">
                      {selectedItem.user.name}
                    </p>
                    <p className="text-neutral-500">
                      {selectedItem.user.email || selectedItem.user.phone || 'কোনো ইমেইল নেই'}
                    </p>
                    {selectedItem.user.institute && (
                      <p className="text-neutral-400 text-[11px] mt-0.5">
                        প্রতিষ্ঠান: {selectedItem.user.institute}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Link
                        href={`/admin/user-management/${selectedItem.user.id}`}
                        className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                      >
                        প্রোফাইল ওপেন করুন <ExternalLink size={11} />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <p className="font-mono text-neutral-400">User ID: {selectedItem.user_id}</p>
                )}
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                  শিরোনাম ও মেসেজ
                </p>
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white">
                  {selectedItem.title}
                </h4>
                <div className="p-3 bg-neutral-50 dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800 text-neutral-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.body || selectedItem.message}
                </div>
              </div>

              {/* Metadata details */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400 block text-[10px] font-bold uppercase">ধরন</span>
                  <span className="font-mono font-bold text-neutral-800 dark:text-zinc-200">
                    {selectedItem.type}
                  </span>
                </div>
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800">
                  <span className="text-neutral-400 block text-[10px] font-bold uppercase">পড়ার অবস্থা</span>
                  <span className={`font-bold ${selectedItem.is_read ? 'text-emerald-600' : 'text-amber-500'}`}>
                    {selectedItem.is_read ? '🟢 পঠিত (Read)' : '⚪ অপঠিত (Unread)'}
                  </span>
                </div>
                <div className="p-2.5 bg-neutral-50 dark:bg-neutral-950 rounded-xl border border-neutral-100 dark:border-neutral-800 col-span-2">
                  <span className="text-neutral-400 block text-[10px] font-bold uppercase">পাঠানোর সময়</span>
                  <span className="font-mono text-neutral-700 dark:text-zinc-300">
                    {selectedItem.created_at
                      ? new Date(selectedItem.created_at).toLocaleString('bn-BD')
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Raw JSON Data Payload */}
              {selectedItem.data && Object.keys(selectedItem.data).length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">
                    পেলোড ডাটা (Data Payload)
                  </p>
                  <pre className="p-2.5 rounded-xl bg-neutral-950 text-neutral-300 font-mono text-[10px] overflow-x-auto max-h-28">
                    {JSON.stringify(selectedItem.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NotificationHistoryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-500 font-mono text-xs">হিস্ট্রি ডাটা লোড হচ্ছে...</div>}>
      <NotificationHistoryContent />
    </Suspense>
  );
}
