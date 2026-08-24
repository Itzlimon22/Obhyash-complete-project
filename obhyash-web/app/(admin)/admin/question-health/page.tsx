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
  ArrowRight,
  Flame,
  ShieldAlert,
  HelpCircle,
  BarChart3,
  SlidersHorizontal,
  Table as TableIcon,
  LayoutGrid,
  Clock,
  Lock,
  Unlock,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  FileText,
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
  // Health & Telemetry Metrics (Phase D & E)
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
    totalQuestions: 0,
    quarantinedCount: 0,
    reportedCount: 0,
    highErrorCount: 0,
    slowCount: 0,
    healthyCount: 0,
    avgPlatformAccuracy: 75,
    platformHealthScore: 100,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewStyle, setViewStyle] = useState<'table' | 'cards'>('cards');

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState<string>('all');
  const [stream, setStream] = useState<string>('all');
  const [subject, setSubject] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFiltered, setTotalFiltered] = useState(0);

  // Subject list extracted dynamically
  const [subjectList, setSubjectList] = useState<string[]>([]);

  // Modals state
  const [previewQuestion, setPreviewQuestion] = useState<QuestionHealthItem | null>(null);
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
        pageSize: '25',
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

        // Dynamically extract unique subjects
        const subjects = Array.from(
          new Set((json.data.questions || []).map((q: QuestionHealthItem) => q.subject).filter(Boolean))
        ) as string[];
        if (subjects.length > 0) {
          setSubjectList((prev) => Array.from(new Set([...prev, ...subjects])));
        }
      } else {
        toast.error(json.error || 'Failed to fetch question health data');
      }
    } catch (err: any) {
      console.error('Error loading question health data:', err);
      toast.error('Network error loading question health data');
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
    setEditAnswerIndices(q.correct_answer_indices && q.correct_answer_indices.length > 0 ? [...q.correct_answer_indices] : [0]);
    setEditExplanation(q.explanation || '');
  };

  // Submit 1-Click Fix & Re-activate
  const handleSaveAndResolve = async (action: 'APPROVE_FIXED' | 'DISMISS_FALSE_ALARM' | 'DELETE_QUESTION') => {
    if (!editQuestion) return;
    setIsSaving(true);

    try {
      const payload: any = {
        questionId: editQuestion.id,
        action,
      };

      if (action === 'APPROVE_FIXED') {
        payload.updatedQuestion = editQuestionText;
        payload.updatedOptions = editOptions;
        payload.updatedAnswerIndices = editAnswerIndices;
        payload.updatedExplanation = editExplanation;
        payload.adminComment = 'Fixed & Verified by Content QA Team (+25 XP awarded to reporters)';
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
            ? '✅ প্রশ্ন সংশোধন করে পুনরায় লাইভ এক্সামে যুক্ত করা হয়েছে!'
            : action === 'DISMISS_FALSE_ALARM'
            ? '🛡️ রিপোর্ট ডিসমিস করে প্রশ্ন সচল রাখা হয়েছে।'
            : '🗑️ প্রশ্নটি সফলভাবে ডিঅ্যাক্টিভেট করা হয়েছে।'
        );
        setEditQuestion(null);
        fetchHealthData(true);
      } else {
        toast.error(json.error || 'Action failed');
      }
    } catch (err: any) {
      toast.error('Network error executing resolution');
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
      toast.error('Failed to dismiss report');
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
          nextLocked ? '🔒 Difficulty locked from auto IRT tuning' : '🔓 Difficulty unlocked for auto IRT tuning'
        );
        setQuestions((prev) =>
          prev.map((item) => (item.id === q.id ? { ...item, is_difficulty_locked: nextLocked } : item))
        );
      }
    } catch {
      toast.error('Failed to toggle difficulty lock');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (questions.length === 0) {
      toast.error('No question data to export');
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
    toast.success('CSV report exported successfully');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-inner">
                <HeartPulse className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  Question Health & Telemetry Engine
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  Chorcha-grade IRT Auto-Tuning, Real-time Error Telemetry & Auto-Quarantine Pipeline
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchHealthData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-rose-400' : ''}`} />
              Refresh
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Top KPI Cards (Phase D & E Analytics) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {/* Health Score */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Health Index</span>
              <HeartPulse className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-emerald-400">{kpis.platformHealthScore}%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Platform accuracy score</p>
          </div>

          {/* Quarantined */}
          <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-900/40 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">Quarantined</span>
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-bounce" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-rose-400">{kpis.quarantinedCount}</span>
              <span className="text-xs text-rose-400/70">hidded</span>
            </div>
            <p className="text-[11px] text-rose-400/60 mt-1">Hidded from live tests</p>
          </div>

          {/* Reported */}
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/40 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Community Flags</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-amber-400">{kpis.reportedCount}</span>
              <span className="text-xs text-amber-400/70">pending</span>
            </div>
            <p className="text-[11px] text-amber-400/60 mt-1">Student reported questions</p>
          </div>

          {/* High Error */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Error Rate</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-orange-400">{kpis.highErrorCount}</span>
              <span className="text-xs text-slate-500">&lt;35% acc</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Possible answer key flaw</p>
          </div>

          {/* Slow / Ambiguous */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Slow Questions</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-cyan-400">{kpis.slowCount}</span>
              <span className="text-xs text-slate-500">&gt;75s</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Unusually high time taken</p>
          </div>

          {/* Avg Accuracy */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Accuracy</span>
              <BarChart3 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl md:text-3xl font-black text-purple-400">{kpis.avgPlatformAccuracy}%</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across all student tests</p>
          </div>
        </div>

        {/* Filter Bar & Tabs */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          {/* Health Tier Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
            {[
              { id: 'all', label: 'All Questions', count: kpis.totalQuestions },
              { id: 'quarantined', label: '🛡️ Quarantined', count: kpis.quarantinedCount, badgeClass: 'bg-rose-500 text-white' },
              { id: 'reported', label: '🚩 Reported', count: kpis.reportedCount, badgeClass: 'bg-amber-500 text-slate-950 font-bold' },
              { id: 'high_error', label: '⚠️ High Error Rate (<35%)', count: kpis.highErrorCount },
              { id: 'slow', label: '⏱️ Slow / Ambiguous (>75s)', count: kpis.slowCount },
              { id: 'healthy', label: '✅ Healthy', count: kpis.healthyCount },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setTier(tab.id);
                  setPage(1);
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  tier === tab.id
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      tab.badgeClass || (tier === tab.id ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300')
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search & Subject Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search question, explanation, topic..."
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500/50"
              >
                <option value="all">All Streams (HSC, SSC, Admission)</option>
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
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-rose-500/50"
              >
                <option value="all">All Subjects</option>
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
            <p className="text-sm text-slate-400 font-medium">Scanning question telemetry & health indexes...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="py-20 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">No Problematic Questions Found!</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              All questions in this category are operating within healthy error margins and zero pending community flags.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cards View */}
            <div className="grid grid-cols-1 gap-4">
              {questions.map((q) => {
                const isQuarantined = q.isQuarantined || q.status === 'Quarantined';
                const accuracy = q.accuracyRate !== null ? q.accuracyRate : 100;
                const hasReports = q.reportCount > 0;

                return (
                  <div
                    key={q.id}
                    className={`rounded-xl p-5 border transition-all ${
                      isQuarantined
                        ? 'bg-rose-950/20 border-rose-800/50 shadow-md shadow-rose-950/20'
                        : hasReports
                        ? 'bg-amber-950/15 border-amber-800/40'
                        : accuracy < 35 && q.timesAttempted >= 2
                        ? 'bg-orange-950/15 border-orange-800/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      {/* Left: Question Content & Tags */}
                      <div className="space-y-3 flex-1">
                        {/* Header Badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {isQuarantined && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500 text-white animate-pulse">
                              <ShieldAlert className="w-3.5 h-3.5" />
                              AUTO-QUARANTINED
                            </span>
                          )}

                          {hasReports && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                              {q.reportCount} Community Reports
                            </span>
                          )}

                          <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700/50">
                            {q.subject} {q.chapter ? `• ${q.chapter}` : ''}
                          </span>

                          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-800/80 text-purple-300 border border-purple-800/30 flex items-center gap-1">
                            <span>{q.difficulty}</span>
                            <span className="text-[10px] text-slate-400">({q.difficulty_rating} Elo)</span>
                            {q.is_difficulty_locked && <Lock className="w-3 h-3 text-amber-400 ml-0.5" />}
                          </span>
                        </div>

                        {/* Stimulus / Passage (if present) */}
                        {q.passage && (
                          <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
                            <span className="font-semibold text-slate-400 block mb-1">📖 উদ্দীপক:</span>
                            <MathRenderer text={q.passage} />
                          </div>
                        )}

                        {/* Question Text */}
                        <div className="text-sm md:text-base font-medium text-slate-100 leading-relaxed">
                          <MathRenderer text={q.question} />
                        </div>

                        {/* Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correct_answer_indices.includes(optIdx);
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-start gap-2 p-2.5 rounded-lg text-xs font-medium ${
                                  isCorrect
                                    ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                                    : 'bg-slate-950/40 border border-slate-800/60 text-slate-400'
                                }`}
                              >
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                    isCorrect ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <div className="flex-1">
                                  <MathRenderer text={opt} />
                                </div>
                                {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation snippet if available */}
                        {q.explanation && (
                          <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400">
                            <span className="font-semibold text-slate-300 block mb-0.5">💡 ব্যাখ্যা:</span>
                            <MathRenderer text={q.explanation} />
                          </div>
                        )}

                        {/* Student Report Details / Feedback */}
                        {q.reportReasons && q.reportReasons.length > 0 && (
                          <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-900/40 text-xs text-rose-300 space-y-1">
                            <span className="font-semibold text-rose-200 block">
                              🚨 শিক্ষার্থীদের রিপোর্টের কারণ: {q.reportReasons.join(', ')}
                            </span>
                            {q.reportDescriptions && q.reportDescriptions.length > 0 && (
                              <p className="text-rose-300/80 italic">&quot;{q.reportDescriptions[0]}&quot;</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Telemetry KPI Pill & 1-Click Actions */}
                      <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                        {/* Telemetry Stats */}
                        <div className="flex lg:flex-col items-center lg:items-end gap-3 text-right">
                          <div>
                            <span className="text-[11px] text-slate-500 uppercase block">Accuracy</span>
                            <span
                              className={`text-base font-bold ${
                                accuracy >= 75
                                  ? 'text-emerald-400'
                                  : accuracy >= 40
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {q.accuracyRate !== null ? `${q.accuracyRate}%` : 'N/A'}
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-500 uppercase block">Attempts</span>
                            <span className="text-xs font-semibold text-slate-300">
                              {q.timesAttempted} tests ({q.timesWrong} wrong)
                            </span>
                          </div>

                          <div>
                            <span className="text-[11px] text-slate-500 uppercase block">Avg Time</span>
                            <span className="text-xs font-semibold text-cyan-400">
                              {q.avgTimeSpentSeconds > 0 ? `${q.avgTimeSpentSeconds}s` : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* 1-Click Action Buttons */}
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => openEditModal(q)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Fix & Live
                          </button>

                          {hasReports && (
                            <button
                              onClick={() => handleQuickDismiss(q.id)}
                              title="Dismiss report as false alarm"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                            >
                              Dismiss
                            </button>
                          )}

                          <button
                            onClick={() => handleToggleLock(q)}
                            title={q.is_difficulty_locked ? 'Unlock Difficulty Auto-IRT' : 'Lock Difficulty Rating'}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                          >
                            {q.is_difficulty_locked ? (
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
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
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
              <span>
                Showing {questions.length} of {totalFiltered} questions
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit & 1-Click Resolution Modal */}
      {editQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white">1-Click Content QA & Live Re-Activation</h3>
              </div>
              <button
                onClick={() => setEditQuestion(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stimulus / Passage (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Stimulus / Passage (উদ্দীপক - Optional)</label>
              <textarea
                value={editPassageText}
                onChange={(e) => setEditPassageText(e.target.value)}
                rows={2}
                placeholder="উদ্দীপক থাকলে এখানে লিখুন..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            {/* Question Text */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Question Text (Supports LaTeX $...$)</label>
              <textarea
                value={editQuestionText}
                onChange={(e) => setEditQuestionText(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rose-500/50"
              />
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
                <span className="text-[10px] text-slate-500 block mb-0.5">Live LaTeX Preview:</span>
                <MathRenderer text={editQuestionText} />
              </div>
            </div>

            {/* Options & Correct Answer Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                Options & Correct Answer (Click Radio to Set Correct)
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {editOptions.map((opt, idx) => {
                  const isSelected = editAnswerIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => setEditAnswerIndices([idx])}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="correct_answer"
                        checked={isSelected}
                        onChange={() => setEditAnswerIndices([idx])}
                        className="text-emerald-500 focus:ring-0"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const next = [...editOptions];
                          next[idx] = e.target.value;
                          setEditOptions(next);
                        }}
                        className="w-full bg-transparent border-none text-xs text-slate-100 focus:outline-none"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Detailed Explanation (ব্যাখ্যা)</label>
              <textarea
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                rows={2}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-rose-500/50"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>+25 Bug Hunter XP will be awarded to student reporters</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSaveAndResolve('DELETE_QUESTION')}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 text-xs font-semibold transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5 inline mr-1" />
                  Deactivate
                </button>

                <button
                  onClick={() => handleSaveAndResolve('DISMISS_FALSE_ALARM')}
                  disabled={isSaving}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all"
                >
                  Dismiss as False Alarm
                </button>

                <button
                  onClick={() => handleSaveAndResolve('APPROVE_FIXED')}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/25 transition-all"
                >
                  {isSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Save, Re-Activate & Reward
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
