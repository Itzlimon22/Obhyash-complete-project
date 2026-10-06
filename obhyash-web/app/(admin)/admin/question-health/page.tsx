'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse,
  AlertTriangle,
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
  Flame,
  ShieldAlert,
  HelpCircle,
  Clock,
  Lock,
  Unlock,
  Award,
  Zap,
  ChevronLeft,
  ChevronRight,
  Trash2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { MathRenderer } from '@/components/common/MathRenderer';
import { exportToCSV } from '@/lib/utils/export-csv';

interface QuestionHealthItem {
  id: string;
  question: string;
  passage?: string;
  options: string[];
  correct_answer_indices: number[];
  explanation: string;
  subject: string;
  subject_id?: string;
  chapter: string;
  chapter_id?: string;
  topic?: string;
  stream?: string;
  difficulty: string;
  difficulty_rating: number;
  is_difficulty_locked: boolean;
  status: string;
  author: string;
  updated_at: string;
  reportCount: number;
  pendingReportsCount: number;
  reportReasons: string[];
  reportDescriptions?: string[];
  isQuarantined: boolean;
  quarantineReason?: string;
  timesAttempted: number;
  timesCorrect: number;
  timesWrong: number;
  avgTimeSpentSeconds: number;
  accuracyRate: number | null;
  healthTier: 'quarantined' | 'reported' | 'high_error' | 'slow' | 'healthy';
}

interface QuestionHealthKPIs {
  totalQuestions: number;
  issuesCount: number;
  quarantinedCount: number;
  reportedCount: number;
  highErrorCount: number;
  slowCount: number;
  healthyCount: number;
  avgPlatformAccuracy: number;
  platformHealthScore: number;
}

export default function QuestionHealthPage() {
  const [questions, setQuestions] = useState<QuestionHealthItem[]>([]);
  const [kpis, setKpis] = useState<QuestionHealthKPIs>({
    totalQuestions: 76493,
    issuesCount: 52,
    quarantinedCount: 26,
    reportedCount: 26,
    highErrorCount: 0,
    slowCount: 0,
    healthyCount: 76441,
    avgPlatformAccuracy: 75,
    platformHealthScore: 99.9,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<string>('all');
  const [stream, setStream] = useState<string>('all');
  const [subject, setSubject] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Subject list extracted dynamically from database
  const [subjectList, setSubjectList] = useState<string[]>([]);

  // Modals state
  const [editQuestion, setEditQuestion] = useState<QuestionHealthItem | null>(null);
  const [editQuestionText, setEditQuestionText] = useState<string>('');
  const [editPassageText, setEditPassageText] = useState<string>('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editAnswerIndices, setEditAnswerIndices] = useState<number[]>([0]);
  const [editExplanation, setEditExplanation] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchHealthData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        search: search.trim(),
        stream: stream !== 'all' ? stream : '',
        subject: subject !== 'all' ? subject : '',
        tier: tier !== 'all' ? tier : '',
      });

      const res = await fetch(`/api/admin/question-health?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        setQuestions(json.data.questions || []);
        if (json.data.kpis) {
          setKpis(json.data.kpis);
        }
        if (json.data.pagination) {
          setTotalPages(json.data.pagination.totalPages || 1);
          setTotalFiltered(json.data.pagination.totalQuestions || 0);
        }
        if (json.data.subjects && Array.isArray(json.data.subjects)) {
          setSubjectList(json.data.subjects);
        }
      } else {
        toast.error(json.error || 'প্রশ্ন সংক্রান্ত ডাটা লোড করা যায়নি');
      }
    } catch (err: any) {
      console.error('Error loading question health data:', err);
      toast.error('নেটওয়ার্ক সমস্যার কারণে ডাটা লোড করা যায়নি');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, search, stream, subject, tier]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Open Edit Modal
  const openEditModal = (q: QuestionHealthItem) => {
    setEditQuestion(q);
    setEditQuestionText(q.question || '');
    setEditPassageText(q.passage || '');
    setEditOptions(q.options && q.options.length > 0 ? [...q.options] : ['', '', '', '']);
    setEditAnswerIndices(
      q.correct_answer_indices && q.correct_answer_indices.length > 0
        ? [...q.correct_answer_indices]
        : [0],
    );
    setEditExplanation(q.explanation || '');
  };

  // Submit 1-Click Fix & Re-activate
  const handleSaveAndResolve = async (
    action: 'APPROVE_FIXED' | 'DISMISS_FALSE_ALARM' | 'DELETE_QUESTION',
  ) => {
    if (!editQuestion) return;
    setIsSaving(true);

    try {
      const payload: any = {
        questionId: editQuestion.id,
        action,
      };

      if (action === 'APPROVE_FIXED') {
        payload.updatedQuestion = editQuestionText;
        payload.updatedPassage = editPassageText;
        payload.updatedOptions = editOptions;
        payload.updatedAnswerIndices = editAnswerIndices;
        payload.updatedExplanation = editExplanation;
        payload.adminComment = 'Fixed & Verified by Content QA Team';
      } else if (action === 'DISMISS_FALSE_ALARM') {
        payload.adminComment = 'Verified accurate. Student report dismissed as false alarm.';
      }

      const res = await fetch('/api/admin/question-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(
          action === 'APPROVE_FIXED'
            ? '✅ প্রশ্ন সংশোধন করে পুনরায় লাইভ এক্সামে সচল করা হয়েছে!'
            : action === 'DISMISS_FALSE_ALARM'
            ? '🛡️ রিপোর্ট নাকচ করে প্রশ্ন সচল রাখা হয়েছে।'
            : '🗑️ প্রশ্নটি সফলভাবে ডিঅ্যাক্টিভেট করা হয়েছে।',
        );
        setEditQuestion(null);
        fetchHealthData(true);
      } else {
        toast.error(json.error || 'অ্যাকশন সম্পন্ন করা যায়নি');
      }
    } catch {
      toast.error('নেটওয়ার্ক সমস্যার কারণে অ্যাকশন ব্যর্থ হয়েছে');
    } finally {
      setIsSaving(false);
    }
  };

  // 1-Click Dismiss Directly from Card
  const handleQuickDismiss = async (qId: string) => {
    try {
      const res = await fetch('/api/admin/question-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: qId, action: 'DISMISS_FALSE_ALARM' }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('🛡️ রিপোর্ট বাতিল করে প্রশ্ন সচল রাখা হয়েছে');
        fetchHealthData(true);
      }
    } catch {
      toast.error('রিপোর্ট বাতিল করা যায়নি');
    }
  };

  // Toggle Quarantine Directly from Card
  const handleToggleQuarantine = async (q: QuestionHealthItem) => {
    const nextQuarantined = !q.isQuarantined;
    try {
      const res = await fetch('/api/admin/question-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: q.id,
          action: nextQuarantined ? 'QUARANTINE_QUESTION' : 'DISMISS_FALSE_ALARM',
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          nextQuarantined
            ? '🛡️ প্রশ্নটি সাময়িকভাবে পরীক্ষা থেকে কোয়ারেন্টাইন করা হয়েছে'
            : '✅ প্রশ্নটি সফলভাবে কোয়ারেন্টাইন মুক্ত করা হয়েছে',
        );
        fetchHealthData(true);
      }
    } catch {
      toast.error('কোয়ারেন্টাইন স্ট্যাটাস পরিবর্তন করা যায়নি');
    }
  };

  // Toggle Difficulty Lock
  const handleToggleLock = async (q: QuestionHealthItem) => {
    const nextLocked = !q.is_difficulty_locked;
    try {
      const res = await fetch('/api/admin/question-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: q.id,
          action: 'TOGGLE_DIFFICULTY_LOCK',
          isLocked: nextLocked,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(
          nextLocked
            ? '🔒 প্রশ্নের কাঠিন্যতা রেটিং লক করা হয়েছে'
            : '🔓 প্রশ্নের কাঠিন্যতা রেটিং আনলক করা হয়েছে',
        );
        setQuestions((prev) =>
          prev.map((item) =>
            item.id === q.id ? { ...item, is_difficulty_locked: nextLocked } : item,
          ),
        );
      }
    } catch {
      toast.error('লক স্ট্যাটাস আপডেট করা যায়নি');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (questions.length === 0) {
      toast.error('ডাউনলোড করার মতো কোনো তথ্য নেই');
      return;
    }
    const headers = [
      'ID',
      'Question',
      'Subject',
      'Chapter',
      'Difficulty',
      'Elo_Rating',
      'Attempts',
      'Accuracy_Rate',
      'Avg_Time_Sec',
      'Reports_Count',
      'Is_Quarantined',
      'Health_Tier',
    ];
    const rows = questions.map((q) => [
      q.id,
      q.question,
      q.subject,
      q.chapter,
      q.difficulty,
      q.difficulty_rating,
      q.timesAttempted,
      q.accuracyRate !== null ? `${q.accuracyRate}%` : 'N/A',
      q.avgTimeSpentSeconds,
      q.reportCount,
      q.isQuarantined ? 'YES' : 'NO',
      q.healthTier,
    ]);
    exportToCSV({
      filename: `question-health-report-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows,
    });
    toast.success('সিএসভি রিপোর্ট সফলভাবে ডাউনলোড হয়েছে');
  };

  return (
    <div className="space-y-6 pb-12 transition-colors">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200/80 dark:border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
            <HeartPulse className="w-4 h-4 animate-pulse" />
          </div>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
            প্রশ্ন কোয়ালিটি ও হেলথ অডিট
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => fetchHealthData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-rose-500' : ''}`}
            />
            <span>রিফ্রেশ</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 text-neutral-700 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-zinc-800 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>রিপোর্ট ডাউনলোড</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* 1. Health Score */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-zinc-800/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              প্ল্যাটফর্ম হেলথ
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <HeartPulse className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {kpis.platformHealthScore}%
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 truncate">
            সচল ও নির্ভুল প্রশ্নের হার
          </p>
        </div>

        {/* 2. Quarantined */}
        <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              কোয়ারেন্টাইনড
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              {kpis.quarantinedCount}
            </span>
            <span className="text-xs font-semibold text-rose-600/80 dark:text-rose-300/70">টি</span>
          </div>
          <p className="text-[11px] text-rose-600/75 dark:text-rose-300/60 mt-1 truncate">
            পরীক্ষা থেকে স্থগিত
          </p>
        </div>

        {/* 3. Reported */}
        <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">
              পেন্ডিং রিপোর্ট
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {kpis.reportedCount}
            </span>
            <span className="text-xs font-semibold text-amber-600/80 dark:text-amber-300/70">টি</span>
          </div>
          <p className="text-[11px] text-amber-600/75 dark:text-amber-300/60 mt-1 truncate">
            শিক্ষার্থীদের ফ্ল্যাগ করা
          </p>
        </div>

        {/* 4. High Error */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-zinc-800/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              উচ্চ ভুল হার
            </span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400 tracking-tight">
              {kpis.highErrorCount}
            </span>
            <span className="text-xs font-semibold text-neutral-500">&lt;৩৫%</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 truncate">
            উত্তর কি যাচাই প্রয়োজন
          </p>
        </div>

        {/* 5. Slow Questions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-zinc-800/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              অস্বাভাবিক সময়
            </span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
              {kpis.slowCount}
            </span>
            <span className="text-xs font-semibold text-neutral-500">&gt;৭৫ সে.</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 truncate">
            ব্যাখ্যা জটিল বা অস্পষ্ট
          </p>
        </div>

        {/* 6. Total Questions */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-zinc-800/90 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-500 dark:text-zinc-400 uppercase tracking-wider">
              মোট প্রশ্ন
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
              {kpis.totalQuestions.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-neutral-500">টি</span>
          </div>
          <p className="text-[11px] text-neutral-500 dark:text-zinc-400 mt-1 truncate">
            ডাটাবেজে সংরক্ষিত
          </p>
        </div>
      </div>

      {/* Filter Bar & Tabs */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-zinc-800/90 shadow-xs space-y-4">
        {/* Tier Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 dark:border-zinc-800/80 pb-3.5">
          {[
            {
              id: 'all',
              label: '🚨 সমস্যাযুক্ত প্রশ্ন (Issues)',
              count: kpis.issuesCount,
              badgeClass: 'bg-rose-500 text-white',
            },
            {
              id: 'quarantined',
              label: '🛡️ কোয়ারেন্টাইনড',
              count: kpis.quarantinedCount,
              badgeClass: 'bg-rose-600 text-white',
            },
            {
              id: 'reported',
              label: '🚩 শিক্ষার্থী রিপোর্ট',
              count: kpis.reportedCount,
              badgeClass: 'bg-amber-500 text-neutral-900 font-bold',
            },
            {
              id: 'high_error',
              label: '⚠️ উচ্চ ভুল হার (<৩৫%)',
              count: kpis.highErrorCount,
            },
            {
              id: 'slow',
              label: '⏱️ ধীরগতির প্রশ্ন (>৭৫ সে.)',
              count: kpis.slowCount,
            },
            {
              id: 'catalog',
              label: '📚 সম্পূর্ণ প্রশ্নভাণ্ডার',
              count: kpis.totalQuestions,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setTier(tab.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                tier === tab.id
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black shadow-xs'
                  : 'bg-neutral-100 dark:bg-zinc-800/70 text-neutral-600 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/70 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                    tab.badgeClass ||
                    (tier === tab.id
                      ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                      : 'bg-neutral-200 dark:bg-zinc-700 text-neutral-700 dark:text-zinc-300')
                  }`}
                >
                  {tab.count.toLocaleString()}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search & Subject Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="প্রশ্ন, উদ্দীপক বা ব্যাখ্যা দিয়ে খুঁজুন..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 dark:bg-zinc-900/80 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-zinc-100 placeholder-neutral-400 dark:placeholder-zinc-500 focus:outline-none focus:border-rose-500 dark:focus:border-rose-500/70 transition-colors"
            />
          </div>

          {/* Stream Filter */}
          <div>
            <select
              value={stream}
              onChange={(e) => {
                setStream(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-zinc-900/80 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500 dark:focus:border-rose-500/70 transition-colors"
            >
              <option value="all">সকল স্ট্রিম (HSC, SSC, Admission)</option>
              <option value="HSC">HSC</option>
              <option value="SSC">SSC</option>
              <option value="ADMISSION">Admission</option>
              <option value="BCS">BCS / Job</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setPage(1);
              }}
              className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-zinc-900/80 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-neutral-900 dark:text-zinc-100 focus:outline-none focus:border-rose-500 dark:focus:border-rose-500/70 transition-colors"
            >
              <option value="all">সকল বিষয় (All Subjects)</option>
              {subjectList.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
          <p className="text-sm text-neutral-500 dark:text-zinc-400 font-medium">
            ডাটাবেজ থেকে প্রশ্নের হেলথ ও রিপোর্ট মেট্রিক্স লোড হচ্ছে...
          </p>
        </div>
      ) : questions.length === 0 ? (
        <div className="py-20 rounded-2xl bg-white dark:bg-[#121215] border border-neutral-200/90 dark:border-zinc-800/90 text-center space-y-3 p-6 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            কোনো সমস্যাযুক্ত প্রশ্ন পাওয়া যায়নি!
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-zinc-400 max-w-md mx-auto">
            নির্বাচিত ফিল্টারের সকল প্রশ্ন স্বাভাবিক রেটিংয়ে পরিচালিত হচ্ছে এবং কোনো অমীমাংসিত রিপোর্ট নেই।
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Question Cards List */}
          <div className="grid grid-cols-1 gap-4">
            {questions.map((q) => {
              const isQuarantined = q.isQuarantined || q.status === 'Quarantined';
              const accuracy = q.accuracyRate !== null ? q.accuracyRate : 100;
              const hasReports = q.reportCount > 0;

              return (
                <div
                  key={q.id}
                  className={`rounded-2xl p-5 sm:p-6 border transition-all bg-white dark:bg-[#121215] shadow-xs ${
                    isQuarantined
                      ? 'border-rose-300 dark:border-rose-900/60 ring-1 ring-rose-500/20'
                      : hasReports
                      ? 'border-amber-300 dark:border-amber-900/50'
                      : accuracy < 35 && q.timesAttempted >= 2
                      ? 'border-orange-300 dark:border-orange-900/50'
                      : 'border-neutral-200 dark:border-zinc-800/80 hover:border-neutral-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
                    {/* Left: Question Content & Options */}
                    <div className="space-y-3.5 flex-1 min-w-0">
                      {/* Status Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isQuarantined && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-xs">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            কোয়ারেন্টাইনড (পরীক্ষা থেকে স্থগিত)
                          </span>
                        )}

                        {hasReports && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                            {q.reportCount}টি শিক্ষার্থী রিপোর্ট
                          </span>
                        )}

                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 border border-neutral-200 dark:border-zinc-700/60">
                          {q.subject || 'সাধারণ'} {q.chapter ? `• ${q.chapter}` : ''}
                        </span>

                        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-zinc-800/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/30 flex items-center gap-1">
                          <span>{q.difficulty}</span>
                          <span className="text-[10px] text-neutral-400 dark:text-zinc-500">
                            ({q.difficulty_rating} Elo)
                          </span>
                          {q.is_difficulty_locked && (
                            <Lock className="w-3 h-3 text-amber-500 ml-0.5" />
                          )}
                        </span>
                      </div>

                      {/* Stimulus / Passage (if present) */}
                      {q.passage && (
                        <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-zinc-900/90 border border-neutral-200/80 dark:border-zinc-800 text-xs text-neutral-700 dark:text-zinc-300">
                          <span className="font-bold text-neutral-900 dark:text-white block mb-1">
                            📖 উদ্দীপক:
                          </span>
                          <MathRenderer text={q.passage} />
                        </div>
                      )}

                      {/* Question Text */}
                      <div className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white leading-relaxed">
                        <MathRenderer text={q.question} />
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correct_answer_indices.includes(optIdx);
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-start gap-2.5 p-3 rounded-xl text-xs font-medium transition-colors ${
                                isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-semibold'
                                  : 'bg-neutral-50 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-800/80 text-neutral-700 dark:text-zinc-300'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-neutral-200 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300'
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <MathRenderer text={opt} />
                              </div>
                              {isCorrect && (
                                <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation Snippet */}
                      {q.explanation && (
                        <div className="p-3 rounded-xl bg-amber-50/40 dark:bg-zinc-900/70 border border-amber-200/60 dark:border-zinc-800 text-xs text-neutral-700 dark:text-zinc-300">
                          <span className="font-bold text-amber-800 dark:text-amber-400 block mb-1">
                            💡 ব্যাখ্যা:
                          </span>
                          <MathRenderer text={q.explanation} />
                        </div>
                      )}

                      {/* Student Report Details / Feedback */}
                      {q.reportReasons && q.reportReasons.length > 0 && (
                        <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                          <span className="font-bold text-rose-900 dark:text-rose-200 block">
                            🚨 শিক্ষার্থীদের রিপোর্টের কারণ: {q.reportReasons.join(', ')}
                          </span>
                          {q.reportDescriptions && q.reportDescriptions.length > 0 && (
                            <p className="text-rose-700 dark:text-rose-300/90 italic">
                              &quot;{q.reportDescriptions[0]}&quot;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Metrics & Actions */}
                    <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-4 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-neutral-200 dark:border-zinc-800">
                      {/* Telemetry Stats */}
                      <div className="flex lg:flex-col items-center lg:items-end gap-3 text-right">
                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase block">
                            সঠিকতার হার
                          </span>
                          <span
                            className={`text-base font-black ${
                              accuracy >= 75
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : accuracy >= 40
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {q.accuracyRate !== null ? `${q.accuracyRate}%` : 'N/A'}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase block">
                            অংশগ্রহণ
                          </span>
                          <span className="text-xs font-semibold text-neutral-700 dark:text-zinc-300">
                            {q.timesAttempted} বার ({q.timesWrong} ভুল)
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 uppercase block">
                            গড় সময়
                          </span>
                          <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                            {q.avgTimeSpentSeconds > 0 ? `${q.avgTimeSpentSeconds}s` : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* 1-Click Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(q)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>সংশোধন ও অনুমোদন</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleQuarantine(q)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                            isQuarantined
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200'
                              : 'bg-neutral-100 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                          }`}
                        >
                          {isQuarantined ? 'কোয়ারেন্টাইন মুক্ত করুন' : 'কোয়ারেন্টাইন করুন'}
                        </button>

                        {hasReports && (
                          <button
                            type="button"
                            onClick={() => handleQuickDismiss(q.id)}
                            title="রিপোর্ট ভুল হলে নাকচ করুন"
                            className="px-2.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-700 dark:text-zinc-300 text-xs font-medium transition-all cursor-pointer"
                          >
                            রিপোর্ট নাকচ
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleLock(q)}
                          title={
                            q.is_difficulty_locked
                              ? 'রেটিং আনলক করুন'
                              : 'রেটিং লক করুন'
                          }
                          className="p-1.5 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-500 dark:text-zinc-400 hover:text-neutral-900 dark:hover:text-white transition-all cursor-pointer"
                        >
                          {q.is_difficulty_locked ? (
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-zinc-800 text-xs font-semibold text-neutral-500 dark:text-zinc-400">
            <span>
              মোট {totalFiltered.toLocaleString()}টির মধ্যে {questions.length}টি প্রশ্ন প্রদর্শিত
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                পৃষ্ঠা {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl bg-white dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-zinc-800 cursor-pointer disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit & 1-Click Resolution Modal */}
      {editQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-[#121215] border border-neutral-200 dark:border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 space-y-5 shadow-2xl text-neutral-900 dark:text-zinc-100">
            <div className="flex items-center justify-between border-b border-neutral-200 dark:border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    প্রশ্ন সংশোধন ও লাইভ অনুমোদন
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-zinc-400">
                    সঠিক উত্তর চিহ্নিত করুন এবং প্রয়োজন অনুযায়ী অপশন ও ব্যাখ্যা আপডেট করুন
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditQuestion(null)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stimulus / Passage (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
                উদ্দীপক / অনুচ্ছেদ (Passage - ঐচ্ছিক)
              </label>
              <textarea
                value={editPassageText}
                onChange={(e) => setEditPassageText(e.target.value)}
                rows={2}
                placeholder="উদ্দীপক থাকলে এখানে লিখুন..."
                className="w-full p-3 bg-neutral-50 dark:bg-zinc-900/80 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            {/* Question Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
                প্রশ্নের বিবরণ (LaTeX $...$ সমর্থিত)
              </label>
              <textarea
                value={editQuestionText}
                onChange={(e) => setEditQuestionText(e.target.value)}
                rows={3}
                className="w-full p-3 bg-neutral-50 dark:bg-zinc-900/80 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors"
              />
              <div className="p-3 rounded-xl bg-neutral-100 dark:bg-zinc-900/60 border border-neutral-200 dark:border-zinc-800 text-xs">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-zinc-500 block mb-1">
                  লাইভ প্রিভিউ (LaTeX Preview):
                </span>
                <MathRenderer text={editQuestionText} />
              </div>
            </div>

            {/* Options & Correct Answer Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
                বিকল্পসমূহ ও সঠিক উত্তর নির্ধারণ (সঠিক উত্তরের রেডিও বাটনে ক্লিক করুন)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {editOptions.map((opt, idx) => {
                  const isSelected = editAnswerIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => setEditAnswerIndices([idx])}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/20'
                          : 'bg-neutral-50 dark:bg-zinc-900/80 border-neutral-200 dark:border-zinc-800 hover:border-neutral-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={isSelected}
                        onChange={() => setEditAnswerIndices([idx])}
                        className="text-emerald-600 focus:ring-0 cursor-pointer"
                      />
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-neutral-200 dark:bg-zinc-800 text-neutral-700 dark:text-zinc-300 shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...editOptions];
                          next[idx] = e.target.value;
                          setEditOptions(next);
                        }}
                        className="w-full bg-transparent border-none text-xs text-neutral-900 dark:text-zinc-100 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-zinc-300">
                বিস্তারিত সমাধান ও ব্যাখ্যা (Explanation)
              </label>
              <textarea
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                rows={2}
                placeholder="প্রশ্নের সমাধান ব্যাখ্যা লিখুন..."
                className="w-full p-3 bg-neutral-50 dark:bg-zinc-900/80 border border-neutral-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => handleSaveAndResolve('DELETE_QUESTION')}
                disabled={isSaving}
                className="px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-neutral-600 dark:text-zinc-400 text-xs font-semibold transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                ডিঅ্যাক্টিভেট
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditQuestion(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-zinc-800 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-neutral-700 dark:text-zinc-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  বাতিল
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndResolve('DISMISS_FALSE_ALARM')}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-700 text-neutral-800 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer"
                >
                  রিপোর্ট নাকচ
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveAndResolve('APPROVE_FIXED')}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  <span>সংশোধন ও লাইভ অনুমোদন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
