'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Plus,
  Edit2,
  List,
  Trash2,
  Trophy,
  Radio,
  Clock,
  Award,
  Users,
  Search,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  Zap,
  BookOpen,
  X,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { LiveExam } from '@/lib/types';
import {
  getLiveExams,
  deleteLiveExam,
  createLiveExam,
  updateLiveExam,
  extendLiveExamDuration,
  triggerLiveExamLifecycleAutomation,
} from '@/services/live-exam-admin-service';
import LiveExamFormModal from './LiveExamFormModal';
import { useAuth } from '@/components/auth/AuthProvider';

export default function LiveExamDashboard() {
  const { user } = useAuth();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/teacher')
    ? '/teacher/live-exams'
    : '/admin/live-exams';

  const [exams, setExams] = useState<LiveExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<LiveExam | null>(null);
  const [isAutomating, setIsAutomating] = useState(false);

  // Filters state with URL & sessionStorage persistence
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all' | 'live' | 'upcoming' | 'ended'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hasLoadedFromStorage, setHasLoadedFromStorage] = useState(false);

  // 1. Initial load from URL search params or sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCat = urlParams.get('category');
      const urlStatus = urlParams.get('status');
      const urlQ = urlParams.get('q');

      let savedFilter: any = null;
      try {
        const raw = sessionStorage.getItem('obhyash_admin_live_exams_filter');
        if (raw) savedFilter = JSON.parse(raw);
      } catch (_) {}

      if (urlCat) {
        setCategoryFilter(urlCat);
      } else if (savedFilter?.category) {
        setCategoryFilter(savedFilter.category);
      }

      if (urlStatus) {
        setStatusFilter(urlStatus);
      } else if (savedFilter?.status) {
        setStatusFilter(savedFilter.status);
      }

      if (urlQ) {
        setSearchQuery(urlQ);
      } else if (savedFilter?.search) {
        setSearchQuery(savedFilter.search);
      }
    } finally {
      setHasLoadedFromStorage(true);
    }
  }, []);

  // 2. Sync to URL & sessionStorage when filters change (after initial mount)
  useEffect(() => {
    if (!hasLoadedFromStorage || typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(
        'obhyash_admin_live_exams_filter',
        JSON.stringify({
          category: categoryFilter,
          status: statusFilter,
          search: searchQuery,
        })
      );
    } catch (_) {}

    const url = new URL(window.location.href);
    if (categoryFilter && categoryFilter !== 'all') {
      url.searchParams.set('category', categoryFilter);
    } else {
      url.searchParams.delete('category');
    }

    if (statusFilter && statusFilter !== 'all') {
      url.searchParams.set('status', statusFilter);
    } else {
      url.searchParams.delete('status');
    }

    if (searchQuery.trim()) {
      url.searchParams.set('q', searchQuery.trim());
    } else {
      url.searchParams.delete('q');
    }

    const newUrl = url.pathname + (url.search ? url.search : '');
    window.history.replaceState(null, '', newUrl);
  }, [categoryFilter, statusFilter, searchQuery, hasLoadedFromStorage]);

  const handleResetFilters = () => {
    setCategoryFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    try {
      sessionStorage.removeItem('obhyash_admin_live_exams_filter');
    } catch (_) {}
    const url = new URL(window.location.href);
    url.searchParams.delete('category');
    url.searchParams.delete('status');
    url.searchParams.delete('q');
    window.history.replaceState(null, '', url.pathname);
  };

  const isFilterActive =
    categoryFilter !== 'all' || statusFilter !== 'all' || searchQuery.trim() !== '';

  const handleRunLifecycleAutomation = async () => {
    try {
      setIsAutomating(true);
      const res = await triggerLiveExamLifecycleAutomation();
      if (res.leaderboardsPublished > 0 || res.notificationsSent > 0) {
        toast.success(
          `অটোমেশন সম্পন্ন! ${res.leaderboardsPublished}টি লিডারবোর্ড প্রকাশিত ও ${res.notificationsSent}টি নোটিফিকেশন পাঠানো হয়েছে।`
        );
      } else if (res.examsEndedPracticeEnabled > 0 || res.staleAttemptsFinalized > 0) {
        toast.success(
          `অটোমেশন সম্পন্ন! ${res.examsEndedPracticeEnabled}টি পরীক্ষার সমাধান উন্মুক্ত ও ${res.staleAttemptsFinalized}টি সাবমিশন সম্পন্ন হয়েছে।`
        );
      } else {
        toast.info('সকল লাইভ পরীক্ষার স্ট্যাটাস, সমাধান ও লিডারবোর্ড সম্পূর্ণ হালনাগাদ রয়েছে।');
      }
      fetchExams();
    } catch (err: any) {
      toast.error('অটোমেশন ব্যর্থ: ' + (err.message || 'ত্রুটি'));
    } finally {
      setIsAutomating(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [user?.id]);

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const data = await getLiveExams();
      setExams(data);
    } catch (error) {
      toast.error('Failed to fetch live exams: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveExam = async (examData: Partial<LiveExam>) => {
    try {
      if (editingExam) {
        await updateLiveExam(editingExam.id, examData);
        toast.success('লাইভ পরীক্ষা সফলভাবে আপডেট করা হয়েছে!');
      } else {
        await createLiveExam(examData);
        toast.success('নতুন লাইভ পরীক্ষা তৈরি করা হয়েছে!');
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (error) {
      toast.error('Failed to save exam');
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        '⚠️ আপনি কি নিশ্চিত যে এই লাইভ পরীক্ষা মুছে ফেলতে চান? এতে সকল ফলাফল মুছে যাবে।',
      )
    )
      return;
    try {
      await deleteLiveExam(id);
      toast.success('লাইভ পরীক্ষা মুছে ফেলা হয়েছে');
      fetchExams();
    } catch (error) {
      toast.error('Failed to delete exam');
    }
  };

  const handleExtend = async (id: string, mins: number) => {
    try {
      await extendLiveExamDuration(id, mins);
      toast.success(`পরীক্ষার সময় +${mins} মিনিট বৃদ্ধি করা হয়েছে!`);
      fetchExams();
    } catch (error) {
      toast.error('Failed to extend duration');
    }
  };

  const handleToggleLeaderboard = async (exam: LiveExam) => {
    const next = exam.is_leaderboard_published === true ? false : true;
    try {
      await updateLiveExam(exam.id, { is_leaderboard_published: next });
      toast.success(
        next ? 'মেধা তালিকা উন্মুক্ত করা হয়েছে' : 'মেধা তালিকা লুকানো হয়েছে',
      );
      fetchExams();
    } catch {
      toast.error('মেধা তালিকা আপডেট করা যায়নি');
    }
  };

  const handleToggleAnswers = async (exam: LiveExam) => {
    const next = exam.is_answer_published === true ? false : true;
    try {
      await updateLiveExam(exam.id, { is_answer_published: next });
      toast.success(
        next ? 'উত্তর ও সমাধান সবার জন্য উন্মুক্ত করা হয়েছে' : 'সমাধান পরীক্ষা শেষেই দেখা যাবে',
      );
      fetchExams();
    } catch {
      toast.error('সমাধান আপডেট করা যায়নি');
    }
  };

  // Status Tab Counts
  const counts = React.useMemo(() => {
    const now = Date.now();
    let live = 0;
    let upcoming = 0;
    let ended = 0;

    exams.forEach((exam) => {
      if (categoryFilter !== 'all' && exam.category !== categoryFilter) return;

      const start = exam.start_time ? new Date(exam.start_time).getTime() : 0;
      const end = exam.end_time ? new Date(exam.end_time).getTime() : 0;

      if (start > 0 && end > 0 && now >= start && now <= end) {
        live++;
      } else if (start > 0 && now < start) {
        upcoming++;
      } else if (end > 0 && now > end) {
        ended++;
      }
    });

    return {
      all: categoryFilter === 'all' ? exams.length : live + upcoming + ended,
      live,
      upcoming,
      ended,
    };
  }, [exams, categoryFilter]);

  // Smart Priority Sorting & Filtering
  const sortedAndFilteredExams = React.useMemo(() => {
    const now = Date.now();

    // 1. Filter
    const filtered = exams.filter((e) => {
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.description &&
          e.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        categoryFilter === 'all' || e.category === categoryFilter;

      const start = e.start_time ? new Date(e.start_time).getTime() : 0;
      const end = e.end_time ? new Date(e.end_time).getTime() : 0;
      const isLiveNow = start > 0 && end > 0 && now >= start && now <= end;
      const isUpcoming = start > 0 && now < start;
      const isEnded = end > 0 && now > end;

      let matchesStatus = true;
      if (statusFilter === 'live') matchesStatus = isLiveNow;
      else if (statusFilter === 'upcoming') matchesStatus = isUpcoming;
      else if (statusFilter === 'ended') matchesStatus = isEnded;

      return matchesSearch && matchesCat && matchesStatus;
    });

    // 2. Smart Priority Sorting:
    // Priority 1: LIVE NOW exams ALWAYS at the very top (ending soonest first)
    // Priority 2: UPCOMING exams (starting soonest first: start_time ASC)
    // Priority 3: ENDED exams (most recently ended first: end_time DESC)
    return filtered.sort((a, b) => {
      const aStart = a.start_time ? new Date(a.start_time).getTime() : 0;
      const aEnd = a.end_time ? new Date(a.end_time).getTime() : 0;
      const aIsLive = aStart > 0 && aEnd > 0 && now >= aStart && now <= aEnd;
      const aIsUpcoming = aStart > 0 && now < aStart;

      const bStart = b.start_time ? new Date(b.start_time).getTime() : 0;
      const bEnd = b.end_time ? new Date(b.end_time).getTime() : 0;
      const bIsLive = bStart > 0 && bEnd > 0 && now >= bStart && now <= bEnd;
      const bIsUpcoming = bStart > 0 && now < bStart;

      const getTier = (isLive: boolean, isUpcoming: boolean) => {
        if (isLive) return 1;
        if (isUpcoming) return 2;
        return 3;
      };

      const aTier = getTier(aIsLive, aIsUpcoming);
      const bTier = getTier(bIsLive, bIsUpcoming);

      if (aTier !== bTier) {
        return aTier - bTier;
      }

      if (aIsLive && bIsLive) {
        return aEnd - bEnd; // Ending soonest first
      }

      if (aIsUpcoming && bIsUpcoming) {
        return aStart - bStart; // Starting soonest first
      }

      return bEnd - aEnd; // Ended most recently first
    });
  }, [exams, searchQuery, categoryFilter, statusFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              লাইভ পরীক্ষা অটোমেশন সক্রিয় • 15m Leaderboard & Lifecycle Auto
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            লাইভ পরীক্ষা ব্যবস্থাপনা
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
            শিডিউলড লাইভ প্রতিযোগিতা তৈরি, প্রশ্ন নির্ধারণ, সময় বর্ধিতকরণ ও স্বয়ংক্রিয় লিডারবোর্ড ট্র্যাকিং
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleRunLifecycleAutomation}
            disabled={isAutomating}
            title="লাইফসাইকেল অটোমেশন চালান (অটো-এন্ড, সমাধান উন্মুক্ত, ১৫ মিনিট পর লিডারবোর্ড ও নোটিফিকেশন)"
            className="px-4 py-2.5 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-[14px] text-xs font-bold transition-all flex items-center gap-2 border border-neutral-300/80 dark:border-zinc-700 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isAutomating ? 'animate-spin text-emerald-500' : 'text-emerald-600 dark:text-emerald-400'} />
            <span>{isAutomating ? 'সিঙ্ক হচ্ছে...' : 'লাইফসাইকেল সিঙ্ক'}</span>
          </button>

          <button
            onClick={() => {
              setEditingExam(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-[#12544F] hover:brightness-105 text-white rounded-[14px] text-xs font-bold transition-all shadow-[0_3px_0_#092328] active:shadow-[0_1px_0_#092328] active:translate-y-[2px] flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>নতুন লাইভ এক্সাম তৈরি</span>
          </button>
        </div>
      </div>

      {/* ── Status Tabs & Search/Filter Controls ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-zinc-900/80 border border-neutral-200/80 dark:border-zinc-800 rounded-2xl overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>সবগুলো</span>
            <span className="px-1.5 py-0.2 rounded-md bg-neutral-200 dark:bg-zinc-700/60 text-[10px] font-mono">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('live')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusFilter === 'live'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-600 dark:text-zinc-400 hover:text-rose-500'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusFilter === 'live' ? 'bg-white' : 'bg-rose-500'} ${counts.live > 0 ? 'animate-pulse' : ''}`} />
            <span>লাইভ চলছে</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'live' ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'}`}>
              {counts.live}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('upcoming')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusFilter === 'upcoming'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-neutral-600 dark:text-zinc-400 hover:text-blue-500'
            }`}
          >
            <span>আসন্ন</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'upcoming' ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-zinc-700/60 text-neutral-700 dark:text-zinc-300'}`}>
              {counts.upcoming}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('ended')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              statusFilter === 'ended'
                ? 'bg-neutral-800 dark:bg-zinc-700 text-white shadow-sm'
                : 'text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <span>সমাপ্ত</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${statusFilter === 'ended' ? 'bg-white/20 text-white' : 'bg-neutral-200 dark:bg-zinc-700/60 text-neutral-700 dark:text-zinc-300'}`}>
              {counts.ended}
            </span>
          </button>
        </div>

        {/* Search, Category & Refresh */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="পরীক্ষার নাম খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-7 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-neutral-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs font-semibold outline-none text-neutral-900 dark:text-white cursor-pointer shrink-0"
          >
            <option value="all">সকল ক্যাটাগরি</option>
            <option value="hsc">HSC Science</option>
            <option value="medical">Medical</option>
            <option value="engineering">Engineering</option>
            <option value="varsity_a">Varsity A</option>
            <option value="ssc">SSC</option>
          </select>

          {isFilterActive && (
            <button
              onClick={handleResetFilters}
              title="সকল ফিল্টার রিসেট করুন"
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0"
            >
              <X size={13} />
              <span>রিসেট</span>
            </button>
          )}

          <button
            onClick={fetchExams}
            className="p-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-xl text-neutral-600 dark:text-zinc-400 transition cursor-pointer shrink-0"
            title="Refresh list"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── Live Exams Table ── */}
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-neutral-200 dark:border-zinc-800/80 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-zinc-900/60 border-b border-neutral-200 dark:border-zinc-800 text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="p-4">পরীক্ষার বিবরণ</th>
                <th className="p-4">ক্যাটাগরি</th>
                <th className="p-4">সময়সূচি (Schedule)</th>
                <th className="p-4">প্রশ্ন ও নম্বর</th>
                <th className="p-4">অবস্থা (Status)</th>
                <th className="p-4 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/60 text-xs">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-8 text-center text-neutral-500 font-mono text-xs"
                  >
                    লাইভ এক্সাম ডাটা লোড হচ্ছে...
                  </td>
                </tr>
              ) : sortedAndFilteredExams.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500">
                    <p className="font-semibold text-sm text-neutral-700 dark:text-zinc-300">
                      কোনো লাইভ পরীক্ষা পাওয়া যায়নি
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {isFilterActive
                        ? 'আপনার ফিল্টারের সাথে মিলে এমন কোনো পরীক্ষা নেই।'
                        : '"নতুন লাইভ এক্সাম তৈরি" বাটনে ক্লিক করে প্রথম এক্সাম শিডিউল করুন।'}
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
                sortedAndFilteredExams.map((exam) => {
                  const now = new Date().getTime();
                  const start = exam.start_time ? new Date(exam.start_time).getTime() : 0;
                  const end = exam.end_time ? new Date(exam.end_time).getTime() : 0;
                  const isLiveNow = start > 0 && end > 0 && now >= start && now <= end;
                  const isUpcoming = start > 0 && now < start;
                  const isEnded = end > 0 && now > end;

                  return (
                    <tr
                      key={exam.id}
                      className={`transition-colors ${
                        isLiveNow
                          ? 'bg-rose-500/[0.04] dark:bg-rose-500/[0.07] hover:bg-rose-500/[0.08] dark:hover:bg-rose-500/[0.11]'
                          : 'hover:bg-neutral-50 dark:hover:bg-zinc-850/40'
                      }`}
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {isLiveNow && (
                            <span className="flex h-2.5 w-2.5 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                            </span>
                          )}
                          <p className="font-bold text-neutral-900 dark:text-white text-sm">
                            {exam.title}
                          </p>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-0.5 line-clamp-1">
                          {exam.description || 'কোনো বিবরণ নেই'}
                        </p>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 rounded-lg text-[11px] font-semibold uppercase border border-neutral-200/60 dark:border-zinc-700/60">
                          {exam.category}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <p className="text-neutral-700 dark:text-zinc-300">
                            <span className="text-neutral-400">শুরু:</span>{' '}
                            {exam.start_time
                              ? new Date(exam.start_time).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })
                              : 'নির্ধারিত নয়'}
                          </p>
                          <p className="text-neutral-500 dark:text-zinc-400">
                            <span className="text-neutral-400">শেষ:</span>{' '}
                            {exam.end_time
                              ? new Date(exam.end_time).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })
                              : 'নির্ধারিত নয়'}
                          </p>
                        </div>
                      </td>

                      <td className="p-4 text-xs text-neutral-600 dark:text-zinc-400">
                        <p className="font-semibold">
                          {exam.duration_minutes} মিনিট • {exam.total_marks}{' '}
                          নম্বর
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                          {exam.total_questions || 0} টি প্রশ্ন যুক্ত রয়েছে
                        </p>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          {isLiveNow ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                              LIVE NOW
                            </span>
                          ) : isUpcoming ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Upcoming
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400 border border-neutral-200 dark:border-zinc-700">
                              Ended
                            </span>
                          )}

                          {/* Leaderboard publication status */}
                          {exam.is_leaderboard_published === true ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Trophy size={10} /> মেধা তালিকা উন্মুক্ত
                            </span>
                          ) : (
                            <span className="text-[10px] text-neutral-400 dark:text-zinc-500 flex items-center gap-1">
                              <Clock size={10} /> মেধা: ১৫মি অটো
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Time Extension Button (Active only during live) */}
                          {isLiveNow && (
                            <button
                              onClick={() => handleExtend(exam.id, 5)}
                              className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-lg text-[10px] font-bold border border-amber-500/30 transition flex items-center gap-1"
                              title="Extend exam by +5 minutes"
                            >
                              <Zap size={11} /> +5m
                            </button>
                          )}

                          {/* Leaderboard Quick Toggle */}
                          <button
                            onClick={() => handleToggleLeaderboard(exam)}
                            className={`p-2 rounded-xl transition-colors border cursor-pointer ${
                              exam.is_leaderboard_published === true
                                ? 'text-amber-500 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
                                : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-500/10 border-transparent'
                            }`}
                            title={
                              exam.is_leaderboard_published === true
                                ? 'মেধা তালিকা: উন্মুক্ত (ক্লিক করে বন্ধ করুন)'
                                : 'মেধা তালিকা এখনই উন্মুক্ত করতে ক্লিক করুন (ডিফল্ট: পরীক্ষা শেষের ১৫ মিনিট পর)'
                            }
                          >
                            <Trophy size={16} />
                          </button>

                          {/* Solutions Quick Toggle */}
                          <button
                            onClick={() => handleToggleAnswers(exam)}
                            className={`p-2 rounded-xl transition-colors border cursor-pointer ${
                              exam.is_answer_published === true
                                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                                : 'text-zinc-400 hover:text-emerald-500 hover:bg-emerald-500/10 border-transparent'
                            }`}
                            title={
                              exam.is_answer_published === true
                                ? 'সমাধান: এখনই উন্মুক্ত (ক্লিক করে অটো মোডে নিন)'
                                : 'সমাধান এখনই উন্মুক্ত করতে ক্লিক করুন (ডিফল্ট: পরীক্ষা শেষ হওয়ামাত্র)'
                            }
                          >
                            <BookOpen size={16} />
                          </button>

                          {/* Builder */}
                          <Link
                            href={`${basePath}/${exam.id}/builder`}
                            className="p-2 text-zinc-600 dark:text-zinc-300 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors border border-transparent hover:border-emerald-500/20"
                            title="প্রশ্ন নির্ধারণ (Question Builder)"
                          >
                            <List size={16} />
                          </Link>

                          {/* Results & Full Controls */}
                          <Link
                            href={`${basePath}/${exam.id}/results`}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors border border-transparent hover:border-blue-500/20"
                            title="ফলাফল ও পূর্ণ কন্ট্রোল সেন্টার"
                          >
                            <Users size={16} />
                          </Link>

                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditingExam(exam);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-xl transition-colors border border-transparent hover:border-amber-500/20 cursor-pointer"
                            title="পরীক্ষা সম্পাদনা"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(exam.id)}
                            className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 size={16} />
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

      {isModalOpen && (
        <LiveExamFormModal
          exam={editingExam}
          onSave={handleSaveExam}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}
