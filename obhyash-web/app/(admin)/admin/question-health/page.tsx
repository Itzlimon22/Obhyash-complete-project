'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Download,
  Edit,
  Eye,
  Check,
  X,
  BookOpen,
  ArrowRight,
  Flame,
  ShieldAlert,
  HelpCircle,
  BarChart3,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { MathRenderer } from '@/components/common/MathRenderer';
import { exportToCSV } from '@/lib/utils/export-csv';

interface QuestionHealthItem {
  id: string;
  question: string;
  options: string[];
  correct_answer_indices: number[];
  explanation: string;
  subject: string;
  chapter: string;
  topic: string;
  difficulty: string;
  status: string;
  author: string;
  updated_at: string;
  bookmarksCount: number;
  reportsCount: number;
  pendingReportsCount: number;
  reportReasons: string[];
  totalAttempts: number;
  wrongAttempts: number;
  errorRate: number;
  accuracyRate: number;
  healthTier: 'critical' | 'high_error' | 'top_bookmarked' | 'healthy';
}

interface QuestionHealthKPIs {
  totalQuestions: number;
  criticalCount: number;
  highErrorCount: number;
  bookmarkedCount: number;
  healthyCount: number;
  platformHealthScore: number;
}

export default function QuestionHealthPage() {
  const [questions, setQuestions] = useState<QuestionHealthItem[]>([]);
  const [kpis, setKpis] = useState<QuestionHealthKPIs>({
    totalQuestions: 0,
    criticalCount: 0,
    highErrorCount: 0,
    bookmarkedCount: 0,
    healthyCount: 0,
    platformHealthScore: 100,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewStyle, setViewStyle] = useState<'table' | 'cards'>('table');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<string>('all');
  const [subject, setSubject] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Subject list extracted dynamically
  const [subjectList, setSubjectList] = useState<string[]>([]);

  // Modals state
  const [previewQuestion, setPreviewQuestion] = useState<QuestionHealthItem | null>(null);
  const [editQuestion, setEditQuestion] = useState<QuestionHealthItem | null>(null);
  const [editAnswerIndex, setEditAnswerIndex] = useState<number>(0);
  const [editExplanation, setEditExplanation] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchHealthData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        tier,
        subject,
        search,
      });

      const res = await fetch(`/api/admin/question-health?${queryParams.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setQuestions(json.data.questions || []);
          setKpis(json.data.kpis);
          setTotalPages(json.data.pagination.totalPages);
          setTotalFiltered(json.data.pagination.totalQuestions);

          // Extract unique subjects
          const allSubs = new Set<string>();
          (json.data.questions || []).forEach((q: QuestionHealthItem) => {
            if (q.subject) allSubs.add(q.subject);
          });
          if (allSubs.size > 0 && subjectList.length === 0) {
            setSubjectList(Array.from(allSubs));
          }

          if (isManualRefresh) {
            toast.success('প্রশ্ন হেলথ ডাটা রিফ্রেশ সম্পন্ন হয়েছে!');
          }
        }
      }
    } catch (e) {
      console.error('Error fetching question health:', e);
      toast.error('ডাটা লোড করতে সমস্যা হয়েছে');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, tier, subject, search, subjectList.length]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Quick edit modal opener
  const handleOpenEdit = (q: QuestionHealthItem) => {
    setEditQuestion(q);
    setEditAnswerIndex(q.correct_answer_indices?.[0] || 0);
    setEditExplanation(q.explanation || '');
  };

  // Save quick fix
  const handleSaveFix = async (resolveReports = false) => {
    if (!editQuestion) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/question-health', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: editQuestion.id,
          correctAnswerIndices: [editAnswerIndex],
          explanation: editExplanation,
          resolveReports,
        }),
      });

      if (res.ok) {
        toast.success(resolveReports ? 'সংশোধন ও রিপোর্ট সমাধান সম্পন্ন!' : 'সফলভাবে আপডেট হয়েছে!');
        setEditQuestion(null);
        fetchHealthData(true);
      } else {
        toast.error('আপডেট ব্যর্থ হয়েছে');
      }
    } catch (e) {
      toast.error('সার্ভারে সমস্যা হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (questions.length === 0) return;
    const headers = [
      'Question ID',
      'Subject',
      'Chapter',
      'Question Text',
      'Correct Answer',
      'Health Tier',
      'Error Rate %',
      'Total Attempts',
      'Bookmarks',
      'Reports',
    ];

    const rows = questions.map((q) => [
      q.id,
      q.subject,
      q.chapter,
      q.question.replace(/\n/g, ' '),
      q.options?.[q.correct_answer_indices?.[0]] || '',
      q.healthTier,
      `${q.errorRate}%`,
      q.totalAttempts,
      q.bookmarksCount,
      q.reportsCount,
    ]);

    const success = exportToCSV({
      filename: `question_health_report_${new Date().toISOString().split('T')[0]}.csv`,
      headers,
      rows,
    });

    if (success) toast.success('CSV রিপোর্ট ডাউনলোড সম্পন্ন হয়েছে!');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-7 animate-in fade-in duration-300">
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
              কোয়ালিটি কন্ট্রোল ও প্রশ্ন ইন্টেলিজেন্স
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <HeartPulse className="text-rose-500" size={28} />
            <span>প্রশ্ন হেলথ ও কোয়ালিটি ড্যাশবোর্ড</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 mt-0.5">
            শিক্ষার্থীদের ভুল করার হার (Error Rate), বুকমার্ক ফ্রিকোয়েন্সি ও রিপোর্ট বিশ্লেষণ করে প্রশ্ন ব্যাংকের মান নিয়ন্ত্রণ
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchHealthData(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 rounded-xl transition border border-neutral-200 dark:border-zinc-700/60 shadow-sm"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin text-rose-500' : ''} />
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <Download size={15} />
            <span>CSV ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Critical / Reports */}
        <div
          onClick={() => { setTier('critical'); setPage(1); }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm group ${
            tier === 'critical'
              ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-400 dark:border-rose-800 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-[#121215] border-neutral-200 dark:border-zinc-800/80 hover:border-rose-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              জরুরি সংশোধন (Critical)
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 group-hover:scale-105 transition-transform">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
              {kpis.criticalCount} <span className="text-xs font-bold">টি প্রশ্ন</span>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-zinc-500 mt-0.5 truncate">
              রিপোর্ট পাওয়া বা সম্ভাব্য উত্তর অসঙ্গতি
            </p>
          </div>
        </div>

        {/* High Error Rate (Traps) */}
        <div
          onClick={() => { setTier('high_error'); setPage(1); }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm group ${
            tier === 'high_error'
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-400 dark:border-amber-800 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-[#121215] border-neutral-200 dark:border-zinc-800/80 hover:border-amber-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              উচ্চ ভুল করার হার (High Traps)
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {kpis.highErrorCount} <span className="text-xs font-bold">টি প্রশ্ন</span>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-zinc-500 mt-0.5 truncate">
              ভুল করার হার ≥ ৬০% (কনফিউজিং প্রশ্ন)
            </p>
          </div>
        </div>

        {/* Top Bookmarked */}
        <div
          onClick={() => { setTier('top_bookmarked'); setPage(1); }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm group ${
            tier === 'top_bookmarked'
              ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-400 dark:border-purple-800 ring-2 ring-purple-500/20'
              : 'bg-white dark:bg-[#121215] border-neutral-200 dark:border-zinc-800/80 hover:border-purple-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              টপ বুকমার্ক ও রিভিশন
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 group-hover:scale-105 transition-transform">
              <Bookmark size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
              {kpis.bookmarkedCount} <span className="text-xs font-bold">টি প্রশ্ন</span>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-zinc-500 mt-0.5 truncate">
              শিক্ষার্থীদের সর্বাধিক সেভ করা গুরুত্বপূর্ণ প্রশ্ন
            </p>
          </div>
        </div>

        {/* Overall Platform Health Score */}
        <div
          onClick={() => { setTier('all'); setPage(1); }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer shadow-sm group ${
            tier === 'all'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-[#121215] border-neutral-200 dark:border-zinc-800/80 hover:border-emerald-400/60'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              প্ল্যাটফর্ম হেলথ ইনডেক্স
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {kpis.platformHealthScore}% <span className="text-xs font-bold">স্কোর</span>
            </div>
            <p className="text-[11px] text-neutral-400 dark:text-zinc-500 mt-0.5 truncate">
              মোট প্রশ্ন: {kpis.totalQuestions} টি (সুস্থ: {kpis.healthyCount})
            </p>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Controls ── */}
      <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Tier Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 dark:bg-zinc-850 p-1 rounded-xl text-xs font-bold">
            {[
              { id: 'all', label: `সকল প্রশ্ন (${kpis.totalQuestions})` },
              { id: 'critical', label: `🚨 জরুরি সংশোধন (${kpis.criticalCount})` },
              { id: 'high_error', label: `⚠️ উচ্চ ভুল (${kpis.highErrorCount})` },
              { id: 'top_bookmarked', label: `🔖 টপ বুকমার্ক (${kpis.bookmarkedCount})` },
              { id: 'healthy', label: `🟢 ভেরিফায়েড (${kpis.healthyCount})` },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => { setTier(t.id); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  tier === t.id
                    ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900 dark:text-zinc-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-neutral-100 dark:bg-zinc-850 p-1 rounded-xl">
            <button
              onClick={() => setViewStyle('table')}
              className={`p-1.5 rounded-lg transition ${
                viewStyle === 'table'
                  ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200'
              }`}
              title="Table View"
            >
              <TableIcon size={16} />
            </button>
            <button
              onClick={() => setViewStyle('cards')}
              className={`p-1.5 rounded-lg transition ${
                viewStyle === 'cards'
                  ? 'bg-white dark:bg-zinc-800 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200'
              }`}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {/* Search & Subject Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-neutral-100 dark:border-zinc-800/80">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="প্রশ্নের বিষয়বস্তু, সূত্র বা শব্দ দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-700/60 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          {/* Subject Filter */}
          <select
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setPage(1); }}
            className="w-full sm:w-56 px-3 py-2 bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-700/60 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-white focus:outline-none"
          >
            <option value="all">সকল বিষয় (All Subjects)</option>
            {subjectList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Questions List / Table ── */}
      {isLoading ? (
        <div className="text-center py-20 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-2xl">
          <RefreshCw className="animate-spin text-rose-500 mx-auto mb-2" size={28} />
          <p className="text-xs text-neutral-400 dark:text-zinc-500">প্রশ্ন হেলথ ডাটা লোড হচ্ছে...</p>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-2xl space-y-2">
          <CheckCircle2 size={36} className="text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">কোনো সমস্যাযুক্ত প্রশ্ন পাওয়া যায়নি!</h3>
          <p className="text-xs text-neutral-400 dark:text-zinc-500">এই ফিল্টারে সকল প্রশ্ন সম্পূর্ণ স্বাস্থ্যকর ও নির্ভুল।</p>
        </div>
      ) : viewStyle === 'table' ? (
        /* ── Table View ── */
        <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 dark:bg-zinc-900/60 border-b border-neutral-200 dark:border-zinc-800 text-neutral-500 dark:text-zinc-400 uppercase font-bold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">প্রশ্ন ও বিষয়</th>
                  <th className="py-3 px-4">সঠিক উত্তর</th>
                  <th className="py-3 px-4 text-center">ভুল করার হার (Error Rate)</th>
                  <th className="py-3 px-4 text-center">বুকমার্ক</th>
                  <th className="py-3 px-4 text-center">রিপোর্ট</th>
                  <th className="py-3 px-4 text-center">হেলথ স্ট্যাটাস</th>
                  <th className="py-3 px-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-zinc-800/80 font-medium">
                {questions.map((q) => {
                  const correctIdx = q.correct_answer_indices?.[0] || 0;
                  const correctText = q.options?.[correctIdx] || `Option ${String.fromCharCode(65 + correctIdx)}`;

                  return (
                    <tr
                      key={q.id}
                      className="hover:bg-neutral-50/70 dark:hover:bg-zinc-800/30 transition group"
                    >
                      {/* Question & Subject */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 dark:text-zinc-500 mb-1">
                          <span className="font-bold text-neutral-700 dark:text-zinc-300">{q.subject || 'সাধারণ'}</span>
                          {q.chapter && <span>• {q.chapter}</span>}
                        </div>
                        <div className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-2">
                          <MathRenderer text={q.question} />
                        </div>
                      </td>

                      {/* Correct Answer */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] truncate">
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] shrink-0 font-mono">
                            {String.fromCharCode(65 + correctIdx)}
                          </span>
                          <span className="truncate">{correctText}</span>
                        </span>
                      </td>

                      {/* Error Rate */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`font-mono font-bold text-xs ${
                              q.errorRate >= 60
                                ? 'text-rose-600 dark:text-rose-400'
                                : q.errorRate >= 40
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {q.errorRate}%
                          </span>
                          <span className="text-[9px] text-neutral-400 dark:text-zinc-500">
                            {q.wrongAttempts}/{q.totalAttempts} ভুল
                          </span>
                        </div>
                      </td>

                      {/* Bookmarks */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-mono font-bold text-[11px]">
                          <Bookmark size={11} /> {q.bookmarksCount}
                        </span>
                      </td>

                      {/* Reports */}
                      <td className="py-3.5 px-4 text-center">
                        {q.reportsCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 font-bold text-[11px] border border-rose-200 dark:border-rose-800 animate-pulse">
                            <ShieldAlert size={12} /> {q.reportsCount} টি
                          </span>
                        ) : (
                          <span className="text-neutral-400 dark:text-zinc-600 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Health Status */}
                      <td className="py-3.5 px-4 text-center">
                        {q.healthTier === 'critical' ? (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px]">
                            🚨 জরুরি রিভিউ
                          </span>
                        ) : q.healthTier === 'high_error' ? (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold text-[10px]">
                            ⚠️ উচ্চ ভুল
                          </span>
                        ) : q.healthTier === 'top_bookmarked' ? (
                          <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-bold text-[10px]">
                            🔖 টপ বুকমার্ক
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-[10px]">
                            🟢 ভেরিফায়েড
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewQuestion(q)}
                            className="p-1.5 rounded-lg bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-200 transition"
                            title="বিস্তারিত প্রিভিউ"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(q)}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1"
                            title="সঠিক উত্তর ও সমাধান সংশোধন"
                          >
                            <Edit size={12} />
                            <span>সংশোধন</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── Cards View ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {questions.map((q) => {
            const correctIdx = q.correct_answer_indices?.[0] || 0;
            return (
              <div
                key={q.id}
                className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-5 space-y-3.5 shadow-sm hover:border-rose-500/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400">
                      {q.subject} {q.chapter ? `• ${q.chapter}` : ''}
                    </span>
                    {q.healthTier === 'critical' && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[10px] shrink-0">
                        🚨 রিপোর্ট আছে ({q.reportsCount})
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-3">
                    <MathRenderer text={q.question} />
                  </h4>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-zinc-800/60">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                    <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-lg border border-emerald-200/50">
                      উত্তর: {String.fromCharCode(65 + correctIdx)} ({q.options?.[correctIdx] || ''})
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-rose-600 dark:text-rose-400">
                        ভুল: {q.errorRate}%
                      </span>
                      <span className="font-mono text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
                        <Bookmark size={12} /> {q.bookmarksCount}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      onClick={() => setPreviewQuestion(q)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-neutral-800 dark:text-zinc-200 text-xs font-bold"
                    >
                      প্রিভিউ
                    </button>
                    <button
                      onClick={() => handleOpenEdit(q)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Edit size={12} />
                      <span>সংশোধন</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-zinc-800 text-xs font-bold">
          <span className="text-neutral-500 dark:text-zinc-400">
            মোট {totalFiltered} টি প্রশ্নের মধ্যে পৃষ্ঠা {page} / {totalPages}
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

      {/* ── Full Preview Modal ── */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151518] border border-neutral-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                  প্রশ্ন প্রিভিউ ও সমাধান
                </span>
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  {previewQuestion.subject} • {previewQuestion.chapter}
                </h3>
              </div>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Question Body */}
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200/80 dark:border-zinc-800 text-sm font-bold text-neutral-900 dark:text-white leading-relaxed">
              <MathRenderer text={previewQuestion.question} />
            </div>

            {/* Options List */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-neutral-500 dark:text-zinc-400">অপশনসমূহ:</span>
              {previewQuestion.options?.map((opt, idx) => {
                const isCorrect = previewQuestion.correct_answer_indices?.includes(idx);
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-xs font-bold transition ${
                      isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-400'
                        : 'bg-neutral-50/50 dark:bg-zinc-900/40 text-neutral-700 dark:text-zinc-300 border-neutral-200 dark:border-zinc-800'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                        isCorrect ? 'bg-emerald-600 text-white' : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-600 dark:text-zinc-400'
                      }`}
                    >
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">
                      <MathRenderer text={opt} />
                    </span>
                    {isCorrect && (
                      <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full shrink-0">
                        সঠিক উত্তর
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            {previewQuestion.explanation && (
              <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/60 space-y-1">
                <span className="text-[11px] font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <HelpCircle size={14} /> সমাধান ও ব্যাখ্যা:
                </span>
                <div className="text-xs text-neutral-800 dark:text-zinc-200 leading-relaxed pt-1">
                  <MathRenderer text={previewQuestion.explanation} />
                </div>
              </div>
            )}

            {/* Report Reasons (if any) */}
            {previewQuestion.reportReasons?.length > 0 && (
              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400 block mb-1">
                  শিক্ষার্থীদের রিপোর্টের কারণ:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {previewQuestion.reportReasons.map((r, i) => (
                    <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200">
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-zinc-800">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-xs font-bold text-neutral-800 dark:text-zinc-200"
              >
                বন্ধ করুন
              </button>
              <button
                onClick={() => {
                  const q = previewQuestion;
                  setPreviewQuestion(null);
                  handleOpenEdit(q);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Edit size={14} />
                <span>সংশোধন করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Fix / Edit Modal ── */}
      {editQuestion && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#151518] border border-neutral-200 dark:border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase">
                  সরাসরি উত্তর ও ব্যাখ্যা সংশোধন
                </span>
                <h3 className="text-sm font-extrabold text-neutral-900 dark:text-white">
                  সঠিক উত্তর পরিবর্তন করুন
                </h3>
              </div>
              <button
                onClick={() => setEditQuestion(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-zinc-200"
              >
                <X size={18} />
              </button>
            </div>

            {/* Question Text */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-800 text-xs font-bold text-neutral-900 dark:text-white">
              <MathRenderer text={editQuestion.question} />
            </div>

            {/* Correct Option Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300 block">
                সঠিক উত্তর নির্বাচন করুন:
              </label>
              <div className="space-y-1.5">
                {editQuestion.options?.map((opt, idx) => (
                  <label
                    key={idx}
                    onClick={() => setEditAnswerIndex(idx)}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer text-xs font-bold transition ${
                      editAnswerIndex === idx
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'bg-neutral-50/50 dark:bg-zinc-900/40 border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={editAnswerIndex === idx}
                      onChange={() => setEditAnswerIndex(idx)}
                      className="text-emerald-600"
                    />
                    <span className="font-mono font-bold w-5">({String.fromCharCode(65 + idx)})</span>
                    <span className="flex-1"><MathRenderer text={opt} /></span>
                  </label>
                ))}
              </div>
            </div>

            {/* Explanation Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300 block">
                ব্যাখ্যা ও সমাধান (LaTeX / টেক্সট):
              </label>
              <textarea
                rows={3}
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                placeholder="প্রশ্নের সমাধান বা সঠিক ব্যাখ্যার বিবরণ..."
                className="w-full p-3 bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-700/60 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none"
              />
            </div>

            {/* Save Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-zinc-800">
              {editQuestion.reportsCount > 0 ? (
                <button
                  disabled={isSaving}
                  onClick={() => handleSaveFix(true)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Check size={14} />
                  <span>সংরক্ষণ ও রিপোর্ট সমাধান করুন</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setEditQuestion(null)}
                  className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 text-xs font-bold text-neutral-800 dark:text-zinc-200"
                >
                  বাতিল
                </button>
                <button
                  disabled={isSaving}
                  onClick={() => handleSaveFix(false)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm"
                >
                  {isSaving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
