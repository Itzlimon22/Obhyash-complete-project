'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Trophy,
  Clock,
  Target,
  Download,
  Users,
  Award,
  TrendingUp,
  Search,
  RotateCcw,
  Eye,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  School,
  Globe,
  Send,
  Lock,
  Copy,
  Check,
  Filter,
  ArrowUpDown,
  Mail,
  Phone,
  Hash,
} from 'lucide-react';
import { toast } from 'sonner';
import { LiveExam } from '@/lib/types';
import {
  getLiveExam,
  getLiveExamLeaderboard,
  resetLiveExamAttempt,
  getLiveExamOngoingCount,
  updateLiveExam,
} from '@/services/live-exam-admin-service';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function LiveExamResults({ examId }: { examId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/teacher')
    ? '/teacher/live-exams'
    : '/admin/live-exams';

  const [exam, setExam] = useState<LiveExam | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [ongoingCount, setOngoingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInstitute, setSelectedInstitute] = useState('all');
  const [selectedScoreTier, setSelectedScoreTier] = useState('all');
  const [sortBy, setSortBy] = useState<
    'rank' | 'fastest' | 'correct' | 'least_wrong' | 'latest'
  >('rank');

  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [isUpdatingPublish, setIsUpdatingPublish] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchResults();

    // ⚡ Supabase Realtime Listener: updates leaderboard & active takers instantly as students submit!
    const supabase = createClient();
    const channel = supabase
      .channel(`live_exam_realtime_${examId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_exam_attempts',
          filter: `live_exam_id=eq.${examId}`,
        },
        async () => {
          if (isMounted) {
            const [freshLeaderboard, freshOngoing] = await Promise.all([
              getLiveExamLeaderboard(examId),
              getLiveExamOngoingCount(examId),
            ]);
            setLeaderboard(freshLeaderboard);
            setOngoingCount(freshOngoing);
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [examId]);

  const fetchResults = async () => {
    try {
      setIsLoading(true);
      const [examData, leaderboardData, ongoing] = await Promise.all([
        getLiveExam(examId),
        getLiveExamLeaderboard(examId),
        getLiveExamOngoingCount(examId),
      ]);
      if (!examData) {
        toast.error('Exam not found');
        router.push(basePath);
        return;
      }
      setExam(examData);
      setLeaderboard(leaderboardData);
      setOngoingCount(ongoing);
    } catch (error) {
      toast.error('Failed to load leaderboard: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetAttempt = async (attemptId: string, studentName: string) => {
    if (
      !window.confirm(
        `⚠️ আপনি কি নিশ্চিত যে ${studentName}-এর পরীক্ষা রিসেট করতে চান? শিক্ষার্থী পুনরায় পরীক্ষা দিতে পারবে।`,
      )
    )
      return;

    try {
      await resetLiveExamAttempt(attemptId);
      toast.success(`${studentName}-এর পরীক্ষা সফলভাবে রিসেট করা হয়েছে!`);
      setSelectedAttempt(null);
      fetchResults();
    } catch (error) {
      toast.error('Failed to reset attempt');
    }
  };

  const handleCopy = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success('ইউজার আইডি কপি করা হয়েছে!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleTogglePublishLeaderboard = async () => {
    if (!exam) return;
    const nextState = exam.is_leaderboard_published === false ? true : false;
    try {
      setIsUpdatingPublish(true);
      await updateLiveExam(exam.id, { is_leaderboard_published: nextState });
      setExam((prev) =>
        prev ? { ...prev, is_leaderboard_published: nextState } : null,
      );
      if (nextState) {
        toast.success(
          '🎉 মেধা তালিকা শিক্ষার্থীদের জন্য সফলভাবে উন্মুক্ত/প্রকাশ করা হয়েছে!',
        );
      } else {
        toast.info('🔒 মেধা তালিকা শিক্ষার্থীদের জন্য লুকানো হয়েছে।');
      }
    } catch (err) {
      toast.error('মেধা তালিকা স্ট্যাটাস পরিবর্তন করা যায়নি');
    } finally {
      setIsUpdatingPublish(false);
    }
  };

  // Unique Institutes for Filter Dropdown
  const uniqueInstitutes = useMemo(() => {
    const set = new Set<string>();
    leaderboard.forEach((entry) => {
      const student = entry.users || entry.user || {};
      const inst = (student.institute || '').trim();
      if (inst && inst !== 'প্রতিষ্ঠান অনুল্লেখিত') set.add(inst);
    });
    return Array.from(set).sort();
  }, [leaderboard]);

  // Processed, Filtered & Sorted Leaderboard
  const processedLeaderboard = useMemo(() => {
    let list = [...leaderboard];

    // 1. Search Query Filter (Name, Email, Phone, Institute, User ID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((entry) => {
        const student = entry.users || entry.user || {};
        const name = (student.name || '').toLowerCase();
        const email = (student.email || '').toLowerCase();
        const phone = (student.phone || '').toLowerCase();
        const institute = (student.institute || '').toLowerCase();
        const userId = (entry.user_id || student.id || '').toLowerCase();
        return (
          name.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          institute.includes(q) ||
          userId.includes(q)
        );
      });
    }

    // 2. Institute Filter
    if (selectedInstitute !== 'all') {
      list = list.filter((entry) => {
        const student = entry.users || entry.user || {};
        return (student.institute || '').trim() === selectedInstitute;
      });
    }

    // 3. Performance / Score Tier Filter
    const totalMarks = exam?.total_marks || 25;
    if (selectedScoreTier === 'top10') {
      list = list.slice(0, 10);
    } else if (selectedScoreTier === 'top50') {
      list = list.slice(0, 50);
    } else if (selectedScoreTier === 'pass80') {
      list = list.filter((e) => Number(e.score) >= totalMarks * 0.8);
    } else if (selectedScoreTier === 'avg50') {
      list = list.filter(
        (e) =>
          Number(e.score) >= totalMarks * 0.5 &&
          Number(e.score) < totalMarks * 0.8,
      );
    } else if (selectedScoreTier === 'fail') {
      list = list.filter((e) => Number(e.score) < totalMarks * 0.5);
    } else if (selectedScoreTier === 'perfect') {
      list = list.filter(
        (e) => Number(e.wrong_count) === 0 && Number(e.correct_count) > 0,
      );
    }

    // 4. Sorting
    if (sortBy === 'fastest') {
      list.sort((a, b) => {
        const timeA =
          new Date(a.submit_time).getTime() - new Date(a.start_time).getTime();
        const timeB =
          new Date(b.submit_time).getTime() - new Date(b.start_time).getTime();
        return timeA - timeB;
      });
    } else if (sortBy === 'correct') {
      list.sort((a, b) => (b.correct_count || 0) - (a.correct_count || 0));
    } else if (sortBy === 'least_wrong') {
      list.sort((a, b) => (a.wrong_count || 0) - (b.wrong_count || 0));
    } else if (sortBy === 'latest') {
      list.sort(
        (a, b) =>
          new Date(b.submit_time).getTime() - new Date(a.submit_time).getTime(),
      );
    } else {
      // Default rank: score DESC, wrong_count ASC, submit_time ASC
      list.sort((a, b) => {
        if (b.score !== a.score) return (b.score || 0) - (a.score || 0);
        if (a.wrong_count !== b.wrong_count)
          return (a.wrong_count || 0) - (b.wrong_count || 0);
        return (
          new Date(a.submit_time).getTime() - new Date(b.submit_time).getTime()
        );
      });
    }

    return list;
  }, [
    leaderboard,
    searchQuery,
    selectedInstitute,
    selectedScoreTier,
    sortBy,
    exam?.total_marks,
  ]);

  const handleExport = () => {
    const csv = [
      [
        'Rank',
        'User ID',
        'Student Name',
        'Email',
        'Phone',
        'Institute',
        'Score',
        'Correct Count',
        'Wrong Count',
        'Time Taken (Mins)',
        'Submit Time',
      ].join(','),
      ...processedLeaderboard.map((entry, index) => {
        const student = entry.users || entry.user || {};
        const timeTakenMs =
          new Date(entry.submit_time).getTime() -
          new Date(entry.start_time).getTime();
        const timeTakenMins = (timeTakenMs / 1000 / 60).toFixed(2);

        return [
          index + 1,
          `"${entry.user_id || student.id || 'N/A'}"`,
          `"${student.name || 'Student'}"`,
          `"${student.email || 'N/A'}"`,
          `"${student.phone || 'N/A'}"`,
          `"${student.institute || 'N/A'}"`,
          entry.score,
          entry.correct_count,
          entry.wrong_count,
          timeTakenMins,
          `"${new Date(entry.submit_time).toLocaleString()}"`,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `live-exam-leaderboard-${exam?.title.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('লিডারবোর্ড CSV সফলভাবে ডাউনলোড হয়েছে!');
  };

  // Calculations
  const totalSubmissions = leaderboard.length;
  const highestScore =
    leaderboard.length > 0
      ? Math.max(...leaderboard.map((e) => Number(e.score) || 0))
      : 0;
  const avgScore =
    leaderboard.length > 0
      ? (
          leaderboard.reduce((acc, e) => acc + (Number(e.score) || 0), 0) /
          totalSubmissions
        ).toFixed(1)
      : '0';

  const totalAnswered = leaderboard.reduce(
    (acc, e) => acc + (e.correct_count || 0) + (e.wrong_count || 0),
    0,
  );
  const totalCorrect = leaderboard.reduce(
    (acc, e) => acc + (e.correct_count || 0),
    0,
  );
  const avgAccuracy =
    totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  if (isLoading)
    return (
      <div className="p-8 text-center text-xs font-mono text-zinc-500">
        লিডারবোর্ড লোড হচ্ছে...
      </div>
    );
  if (!exam) return null;

  const now = Date.now();
  const start = new Date(exam.start_time).getTime();
  const end = new Date(exam.end_time).getTime();
  const isLiveNow = now >= start && now <= end;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* ── Live Running Banner ── */}
      {isLiveNow && (
        <div className="p-3.5 px-5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <div>
              <p className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wide">
                লাইভ প্রতিযোগিতা চলছে • Live Examination In Progress
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                শিক্ষার্থীরা উত্তর সাবমিট করার সাথে সাথে লিডারবোর্ড রিয়েল-টাইমে স্বয়ংক্রিয়ভাবে আপডেট হচ্ছে
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono font-bold text-xs shrink-0">
            <span className="animate-pulse">🔴</span>
            <span>{ongoingCount} জন বর্তমানে পরীক্ষা দিচ্ছেন</span>
          </div>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href={basePath}
            className="p-2 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded-xl transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/10 text-amber-500">
                <Trophy size={16} />
              </span>
              <h1 className="text-xl font-black text-neutral-900 dark:text-white">
                লিডারবোর্ড ও অংশগ্রহণ বিবরণী: {exam.title}
              </h1>
            </div>
            <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-0.5">
              ক্যাটাগরি: <span className="uppercase font-bold">{exam.category}</span> • মোট পূর্ণমান: {exam.total_marks} • নেগেটিভ মার্কিং: {exam.negative_marking}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Publish / Unpublish Leaderboard Action Button */}
          <button
            onClick={handleTogglePublishLeaderboard}
            disabled={isUpdatingPublish}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
              exam.is_leaderboard_published !== false
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-950/20'
                : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-amber-950/20 animate-pulse'
            }`}
            title="শিক্ষার্থীদের জন্য ফলাফল ও মেধা তালিকা উন্মুক্ত বা লুকান"
          >
            {exam.is_leaderboard_published !== false ? (
              <>
                <Globe size={14} />
                <span>মেধা তালিকা প্রকাশিত (সবার জন্য উন্মুক্ত)</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>📢 মেধা তালিকা প্রকাশ করুন (Publish Leaderboard)</span>
              </>
            )}
          </button>

          <button
            onClick={handleExport}
            disabled={leaderboard.length === 0}
            className="px-4 py-2 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-zinc-200 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
          >
            <Download size={15} />
            <span>CSV রিপোর্ট ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* ── 4 KPI Stats Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold">
            <span>মোট পরীক্ষার্থী</span>
            <Users size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-black text-neutral-900 dark:text-white font-mono">
            {totalSubmissions} <span className="text-xs font-normal text-zinc-500">জন</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold">
            <span>সর্বোচ্চ নম্বর</span>
            <Award size={16} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {highestScore} <span className="text-xs font-normal text-zinc-500">/ {exam.total_marks}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold">
            <span>গড় স্কোর</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {avgScore} <span className="text-xs font-normal text-zinc-500">/ {exam.total_marks}</span>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-neutral-500 dark:text-zinc-400 text-xs font-bold">
            <span>গড় নির্ভুলতা (Accuracy)</span>
            <Target size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {avgAccuracy}%
          </p>
        </div>
      </div>

      {/* ── Search & Multi-Filter Control Panel ── */}
      <div className="bg-white dark:bg-[#141417] p-4 rounded-2xl border border-neutral-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              placeholder="নাম, ফোন, ইমেইল বা আইডি দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-white"
            />
          </div>

          {/* Institute Filter */}
          <div className="relative">
            <School
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <select
              value={selectedInstitute}
              onChange={(e) => setSelectedInstitute(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-white cursor-pointer"
            >
              <option value="all">সকল প্রতিষ্ঠান ({uniqueInstitutes.length})</option>
              {uniqueInstitutes.map((inst) => (
                <option key={inst} value={inst}>
                  {inst}
                </option>
              ))}
            </select>
          </div>

          {/* Score Tier Filter */}
          <div className="relative">
            <Filter
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <select
              value={selectedScoreTier}
              onChange={(e) => setSelectedScoreTier(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-white cursor-pointer"
            >
              <option value="all">সকল স্কোর টায়ার</option>
              <option value="top10">🏆 শীর্ষ ১০ (Top 10)</option>
              <option value="top50">⭐ শীর্ষ ৫০ (Top 50)</option>
              <option value="pass80">🎯 ৮০%+ নম্বর (অসাধারণ)</option>
              <option value="avg50">📈 ৫০% - ৮০% নম্বর (গড়)</option>
              <option value="fail">⚠️ ৫০% এর নিচে</option>
              <option value="perfect">✨ ১০০% নির্ভুল (০ ভুল)</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="relative">
            <ArrowUpDown
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 text-neutral-900 dark:text-white cursor-pointer"
            >
              <option value="rank">🥇 মেধা ক্রম (সর্বোচ্চ নম্বর)</option>
              <option value="fastest">⚡ দ্রুততম জমা (Fastest)</option>
              <option value="correct">✓ সর্বাধিক সঠিক উত্তর</option>
              <option value="least_wrong">✓ কম ভুল উত্তর</option>
              <option value="latest">🕒 সর্বশেষ জমাকৃত</option>
            </select>
          </div>
        </div>

        {/* Results summary & active filter reset */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-zinc-800/80 text-xs">
          <p className="text-neutral-500 dark:text-zinc-400">
            প্রদর্শিত হচ্ছে: <span className="font-bold text-neutral-900 dark:text-white font-mono">{processedLeaderboard.length}</span> / {leaderboard.length} জন পরীক্ষার্থী
          </p>

          {(searchQuery || selectedInstitute !== 'all' || selectedScoreTier !== 'all' || sortBy !== 'rank') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedInstitute('all');
                setSelectedScoreTier('all');
                setSortBy('rank');
              }}
              className="text-rose-600 hover:text-rose-700 font-bold transition flex items-center gap-1 cursor-pointer text-xs"
            >
              <RotateCcw size={12} />
              <span>ফিল্টার রিসেট করুন</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Leaderboard Table ── */}
      <div className="bg-white dark:bg-[#121215] rounded-2xl border border-neutral-200 dark:border-zinc-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-zinc-900/60 border-b border-neutral-200 dark:border-zinc-800 text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
                <th className="p-4 w-16 text-center">র‍্যাংক</th>
                <th className="p-4">শিক্ষার্থী ও ইউজার আইডি</th>
                <th className="p-4 text-center">স্কোর</th>
                <th className="p-4 text-center">সঠিক / ভুল</th>
                <th className="p-4 text-center">সময়</th>
                <th className="p-4 text-right">জমা দেওয়ার সময়</th>
                <th className="p-4 text-right">কন্ট্রোল</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/60 text-xs">
              {processedLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-neutral-500">
                    কোনো পরীক্ষার্থী বা ফলাফল পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                processedLeaderboard.map((entry, index) => {
                  const student = entry.users || entry.user || {};
                  const userId = entry.user_id || student.id || '';
                  const avatarUrl =
                    student.avatar_url || student.avatarUrl || student.image;
                  const avatarColor =
                    student.avatar_color || student.avatarColor || '#059669';

                  const timeTakenMs =
                    new Date(entry.submit_time).getTime() -
                    new Date(entry.start_time).getTime();
                  const mins = Math.floor(timeTakenMs / 1000 / 60);
                  const secs = Math.floor((timeTakenMs / 1000) % 60);

                  const isTop3 = index < 3 && sortBy === 'rank';

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-neutral-50 dark:hover:bg-zinc-850/40 transition-colors ${
                        isTop3
                          ? 'bg-amber-50/20 dark:bg-amber-950/10 font-semibold'
                          : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black font-mono ${
                            isTop3 && index === 0
                              ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                              : isTop3 && index === 1
                              ? 'bg-slate-300 dark:bg-zinc-700 text-slate-900 dark:text-white'
                              : isTop3 && index === 2
                              ? 'bg-amber-700/80 text-white'
                              : 'text-neutral-500 font-normal'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>

                      {/* Student Info with Avatar Image and Copyable User ID */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {/* Profile Avatar / Image */}
                          <div className="relative w-10 h-10 rounded-xl shrink-0 overflow-hidden bg-neutral-100 dark:bg-zinc-800 border border-neutral-200/80 dark:border-zinc-700/60 flex items-center justify-center text-white font-black text-xs shadow-sm">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={student.name || 'User'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    'none';
                                }}
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ backgroundColor: avatarColor }}
                              >
                                {student.name?.charAt(0)?.toUpperCase() || 'S'}
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-neutral-900 dark:text-white text-xs">
                                {student.name || 'শিক্ষার্থী'}
                              </p>
                              {student.phone && (
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  • {student.phone}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-neutral-500 dark:text-zinc-400 flex items-center gap-1">
                              <School size={11} className="shrink-0" />
                              <span className="truncate max-w-[200px]">
                                {student.institute || 'প্রতিষ্ঠান অনুল্লেখিত'}
                              </span>
                            </p>

                            {/* User ID Badge with Copy */}
                            {userId && (
                              <div className="flex items-center gap-1 pt-0.5">
                                <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400 bg-neutral-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded border border-neutral-200/60 dark:border-zinc-700/60 select-all">
                                  ID: {userId.slice(0, 8)}...
                                </span>
                                <button
                                  onClick={(e) => handleCopy(userId, e)}
                                  className="p-1 text-zinc-400 hover:text-emerald-500 rounded hover:bg-neutral-100 dark:hover:bg-zinc-800 transition cursor-pointer"
                                  title="সম্পূর্ণ ইউজার আইডি কপি করুন"
                                >
                                  {copiedId === userId ? (
                                    <Check
                                      size={11}
                                      className="text-emerald-500"
                                    />
                                  ) : (
                                    <Copy size={11} />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="p-4 text-center">
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {entry.score}
                        </span>
                      </td>

                      {/* Correct / Wrong */}
                      <td className="p-4 text-center font-mono text-[11px]">
                        <span className="text-emerald-600 font-bold">
                          ✓ {entry.correct_count || 0}
                        </span>
                        <span className="text-neutral-400 mx-1">/</span>
                        <span className="text-rose-500 font-bold">
                          ✗ {entry.wrong_count || 0}
                        </span>
                      </td>

                      {/* Time Taken */}
                      <td className="p-4 text-center font-mono text-neutral-700 dark:text-zinc-300">
                        {mins}m {secs}s
                      </td>

                      {/* Submit Timestamp */}
                      <td className="p-4 text-right font-mono text-[11px] text-neutral-500 dark:text-zinc-400">
                        {new Date(entry.submit_time).toLocaleString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Submission */}
                          <button
                            onClick={() => setSelectedAttempt(entry)}
                            className="p-1.5 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 rounded-lg transition cursor-pointer"
                            title="উত্তরপত্র ও বিবরণ দেখুন"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Reset Attempt */}
                          <button
                            onClick={() =>
                              handleResetAttempt(
                                entry.id,
                                student.name || 'Student',
                              )
                            }
                            className="p-1.5 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 rounded-lg transition cursor-pointer"
                            title="পরীক্ষা রিসেট করুন (অনুমতি দিন পুনরায় দেওয়ার)"
                          >
                            <RotateCcw size={14} />
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

      {/* ── Student Submission Inspector Modal ── */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#141417] border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl p-6 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-2xl shrink-0 overflow-hidden bg-neutral-100 dark:bg-zinc-800 border border-neutral-200 dark:border-zinc-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                  {selectedAttempt.users?.avatar_url ||
                  selectedAttempt.users?.avatarUrl ||
                  selectedAttempt.user?.avatar_url ||
                  selectedAttempt.user?.avatarUrl ? (
                    <img
                      src={
                        selectedAttempt.users?.avatar_url ||
                        selectedAttempt.users?.avatarUrl ||
                        selectedAttempt.user?.avatar_url ||
                        selectedAttempt.user?.avatarUrl
                      }
                      alt={selectedAttempt.users?.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        backgroundColor:
                          selectedAttempt.users?.avatar_color ||
                          selectedAttempt.users?.avatarColor ||
                          selectedAttempt.user?.avatar_color ||
                          selectedAttempt.user?.avatarColor ||
                          '#059669',
                      }}
                    >
                      {selectedAttempt.users?.name?.charAt(0)?.toUpperCase() ||
                        'S'}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                    {selectedAttempt.users?.name || 'শিক্ষার্থী'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {selectedAttempt.users?.institute || 'প্রতিষ্ঠান অনুল্লেখিত'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedAttempt(null)}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X size={16} />
              </button>
            </div>

            {/* Student ID & Contact Pill */}
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-100 dark:border-zinc-800 space-y-1.5 text-xs text-neutral-600 dark:text-zinc-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Hash size={12} className="text-neutral-400" />
                  <span>ইউজার আইডি:</span>
                </span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-900 dark:text-white">
                  <span>
                    {selectedAttempt.user_id || selectedAttempt.users?.id}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        selectedAttempt.user_id || selectedAttempt.users?.id,
                      )
                    }
                    className="p-1 hover:bg-neutral-200 dark:hover:bg-zinc-700 rounded transition cursor-pointer"
                    title="কপি করুন"
                  >
                    {copiedId ===
                    (selectedAttempt.user_id || selectedAttempt.users?.id) ? (
                      <Check size={12} className="text-emerald-500" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>
              </div>

              {selectedAttempt.users?.phone && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-neutral-400" />
                    <span>মোবাইল নম্বর:</span>
                  </span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">
                    {selectedAttempt.users.phone}
                  </span>
                </div>
              )}

              {selectedAttempt.users?.email && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail size={12} className="text-neutral-400" />
                    <span>ইমেইল:</span>
                  </span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">
                    {selectedAttempt.users.email}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-neutral-50 dark:bg-zinc-900/60 text-center text-xs">
              <div>
                <p className="text-neutral-500 text-[10px]">অর্জিত নম্বর</p>
                <p className="text-base font-black text-emerald-600 font-mono">
                  {selectedAttempt.score}
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-[10px]">সঠিক উত্তর</p>
                <p className="text-base font-black text-emerald-500 font-mono">
                  {selectedAttempt.correct_count} টি
                </p>
              </div>
              <div>
                <p className="text-neutral-500 text-[10px]">ভুল উত্তর</p>
                <p className="text-base font-black text-rose-500 font-mono">
                  {selectedAttempt.wrong_count} টি
                </p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-neutral-600 dark:text-zinc-400 bg-neutral-50 dark:bg-zinc-900/60 p-3 rounded-2xl border border-neutral-100 dark:border-zinc-800">
              <p className="flex justify-between items-center">
                <span>পরীক্ষা শুরু:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">
                  {selectedAttempt.start_time
                    ? new Date(selectedAttempt.start_time).toLocaleTimeString(
                        'en-US',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        },
                      )
                    : 'নির্ধারিত নয়'}
                </span>
              </p>
              <p className="flex justify-between items-center">
                <span>জমা দেওয়ার সময়:</span>
                <span className="font-mono font-bold text-neutral-900 dark:text-white">
                  {selectedAttempt.submit_time
                    ? new Date(selectedAttempt.submit_time).toLocaleTimeString(
                        'en-US',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: true,
                        },
                      )
                    : 'নির্ধারিত নয়'}
                </span>
              </p>
              {selectedAttempt.start_time && selectedAttempt.submit_time && (
                <p className="flex justify-between items-center pt-1.5 border-t border-neutral-200/60 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>মোট সময় লেগেছে:</span>
                  <span className="font-mono">
                    {(() => {
                      const diffSec = Math.max(
                        0,
                        Math.round(
                          (new Date(selectedAttempt.submit_time).getTime() -
                            new Date(selectedAttempt.start_time).getTime()) /
                            1000,
                        ),
                      );
                      const m = Math.floor(diffSec / 60);
                      const s = diffSec % 60;
                      return `${m} মিনিট ${s} সেকেন্ড`;
                    })()}
                  </span>
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-zinc-800 flex justify-between gap-2">
              <button
                onClick={() =>
                  handleResetAttempt(
                    selectedAttempt.id,
                    selectedAttempt.users?.name || 'Student',
                  )
                }
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>অ্যাটেম্পট রিসেট করুন</span>
              </button>

              <button
                onClick={() => setSelectedAttempt(null)}
                className="px-5 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 text-xs font-bold hover:bg-neutral-100 dark:hover:bg-zinc-800 cursor-pointer"
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
