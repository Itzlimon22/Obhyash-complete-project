import React, { useState, useMemo, useEffect } from 'react';
import { usePersistedState } from '@/hooks/use-persisted-state';
import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp } from '@/lib/animations';
import { Database } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ExamResult } from '@/lib/types';
import SubjectStat from './SubjectStat';
import {
  getOverallAnalytics,
  OverallAnalytics,
} from '@/services/stats-service';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import { supabase } from '@/services/core';
import useSWR from 'swr';
import { useAuth } from '@/components/auth/AuthProvider';
import { AnalysisSkeleton } from '@/components/student/ui/common/Skeletons';

interface AnalysisViewProps {
  history: ExamResult[];
  onSubjectClick?: (subject: string) => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ history, onSubjectClick }) => {
  const [timeFilter, setTimeFilter] = usePersistedState<'all' | 'month' | 'week'>('analysis_time_filter', 'all');

  const { user, loading: authLoading } = useAuth();

  const { data: analytics, error, isLoading } = useSWR(
    !authLoading && (history?.length > 0 || user?.id)
      ? ['overall_analytics', history?.[0]?.user_id || user?.id, timeFilter]
      : null,
    async () => {
      const userId = history?.[0]?.user_id || user?.id;
      if (!userId) return null;
      return getOverallAnalytics(userId, timeFilter);
    },
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const formatTime = (seconds: number) => {
    const hrs  = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs  > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const localizedSubjectData = useMemo(() => {
    if (!analytics?.subjectData) return [];
    return analytics.subjectData.map((s) => ({
      ...s,
      id: s.name,
      name: getSubjectDisplayName(s.name),
    }));
  }, [analytics && analytics.subjectData]);

  const totalQuestions = analytics?.totalQuestions || 0;
  const totalCorrect   = analytics?.totalCorrect   || 0;
  const totalWrong     = analytics?.totalWrong     || 0;

  const bestSubject = useMemo(() => {
    const filtered = (analytics?.subjectData || []).filter((s) => s.total >= 5);
    if (!filtered.length) return null;
    return filtered.reduce((best, s) =>
      s.correct / s.total > best.correct / best.total ? s : best,
    );
  }, [analytics]);

  const worstSubject = useMemo(() => {
    const filtered = (analytics?.subjectData || []).filter((s) => s.total >= 5);
    if (filtered.length < 2) return null;
    const worst = filtered.reduce((w, s) =>
      s.correct / s.total < w.correct / w.total ? s : w,
    );
    return worst?.name === bestSubject?.name ? null : worst;
  }, [analytics, bestSubject]);

  const bestScore = useMemo(
    () => analytics?.timelineData?.length
      ? Math.max(...analytics.timelineData.map((t) => t.score))
      : null,
    [analytics],
  );

  // Achievements — all derived from existing analytics, no extra API calls
  const achievements = useMemo(() => [
    { id: 'first',   label: 'প্রথম পরীক্ষা', icon: '🎯', unlocked: (analytics?.totalExams || 0) >= 1   },
    { id: 'ten',     label: '১০ পরীক্ষা',     icon: '📚', unlocked: (analytics?.totalExams || 0) >= 10  },
    { id: 'fifty',   label: '৫০ পরীক্ষা',     icon: '🏆', unlocked: (analytics?.totalExams || 0) >= 50  },
    { id: 'score80', label: '৮০%+ স্কোর',      icon: '⭐', unlocked: (analytics?.avgScore   || 0) >= 80  },
    { id: 'score90', label: '৯০%+ স্কোর',      icon: '💎', unlocked: (analytics?.avgScore   || 0) >= 90  },
    { id: 'perfect', label: 'পারফেক্ট স্কোর',  icon: '🌟', unlocked: bestScore === 100                   },
  ], [analytics, bestScore]);

  if (isLoading) return <AnalysisSkeleton />;

  if (!analytics || analytics.totalExams === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 animate-fade-in">
        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
          <Database className="w-10 h-10 text-neutral-400" />
        </div>
        <h2 className="text-xl font-bold text-neutral-800 dark:text-white">
          কোনো ডাটা পাওয়া যায়নি
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm">
          বিশ্লেষণ দেখতে অন্তত একটি পরীক্ষা সম্পন্ন করো অথবা সময়সীমা পরিবর্তন করো।
        </p>
        <div className="mt-6 flex gap-2">
          {(['week', 'month', 'all'] as const).map((f) => (
            <button key={f} onClick={() => setTimeFilter(f)}
              className={`text-xs font-black px-4 py-2 rounded-full border transition-all ${
                timeFilter === f
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
              }`}>
              {f === 'week' ? 'সপ্তাহ' : f === 'month' ? 'মাস' : 'সব'}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const avgScore = analytics.avgScore;
  const accuracy = analytics.avgAccuracy;

  return (
    <div className="max-w-6xl mx-auto space-y-3 pb-12 animate-fade-in">

      {/* ── 1. HERO BANNER ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 p-4 text-white shadow-lg">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-blue-400 rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-6  w-36 h-36 bg-emerald-400 rounded-full opacity-10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-3">
          <div>
            <p className="text-blue-200 text-[10px] font-black uppercase tracking-widest mb-0.5">
              পারফরম্যান্স রিপোর্ট
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tabular-nums">{avgScore}%</span>
              <span className="text-blue-200 text-xs font-bold">গড় স্কোর</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-emerald-300 text-[11px] font-bold">
                {accuracy}% সঠিকতা · {analytics.totalExams} পরীক্ষা
              </span>
            </div>
          </div>

          {/* Time filter pills */}
          <div className="flex flex-col gap-1.5 shrink-0">
            {(['week', 'month', 'all'] as const).map((f) => (
              <button key={f} onClick={() => setTimeFilter(f)}
                className={`text-[10px] font-black px-3 py-1 rounded-full transition-all ${
                  timeFilter === f
                    ? 'bg-white text-blue-900'
                    : 'bg-blue-800/60 text-blue-200 hover:bg-blue-700/60'
                }`}>
                {f === 'week' ? 'সপ্তাহ' : f === 'month' ? 'মাস' : 'সব'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. KPI RING CARDS (2×2 mobile / 4-col md+) ────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">

        {/* Avg Score ring */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .05 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3 flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="relative flex items-center justify-center">
            <svg width="52" height="52" className="-rotate-90" aria-hidden="true">
              <circle cx="26" cy="26" r="22" fill="none" strokeWidth="5" className="stroke-neutral-100 dark:stroke-neutral-800" />
              <circle cx="26" cy="26" r="22" fill="none" stroke="#059669" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - Math.min(avgScore, 100) / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <span className="absolute text-[11px] font-black text-emerald-600 dark:text-emerald-400">{avgScore}%</span>
          </div>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider text-center">গড় স্কোর</p>
        </motion.div>

        {/* Accuracy ring */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .10 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3 flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="relative flex items-center justify-center">
            <svg width="52" height="52" className="-rotate-90" aria-hidden="true">
              <circle cx="26" cy="26" r="22" fill="none" strokeWidth="5" className="stroke-neutral-100 dark:stroke-neutral-800" />
              <circle cx="26" cy="26" r="22" fill="none" stroke="#1d4ed8" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 22}`}
                strokeDashoffset={`${2 * Math.PI * 22 * (1 - Math.min(accuracy, 100) / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <span className="absolute text-[11px] font-black text-blue-700 dark:text-blue-400">{accuracy}%</span>
          </div>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider text-center">সঠিকতা</p>
        </motion.div>

        {/* Total Exams */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .15 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3 flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-0.5">
            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <p className="text-xl font-black text-red-600 dark:text-red-400 tabular-nums leading-none">{analytics.totalExams}</p>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider text-center">মোট পরীক্ষা</p>
        </motion.div>

        {/* Total Time */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .20 }}
          className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-3 flex flex-col items-center justify-center gap-1 shadow-sm">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-0.5">
            <svg className="w-4 h-4 text-blue-700 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-base font-black text-blue-700 dark:text-blue-400 leading-none tabular-nums">{formatTime(analytics.totalTime)}</p>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider text-center">মোট সময়</p>
        </motion.div>
      </div>

      {/* ── 3. SECONDARY STATS (always 3-col) ─────────────────────────── */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-2.5 text-center">
          <p className="text-base font-black text-neutral-800 dark:text-white tabular-nums">{totalQuestions.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">মোট প্রশ্ন</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-900/30 p-2.5 text-center">
          <p className="text-base font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{totalCorrect.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wider">সঠিক</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-900/30 p-2.5 text-center">
          <p className="text-base font-black text-red-600 dark:text-red-400 tabular-nums">{totalWrong.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-red-600/70 uppercase tracking-wider">ভুল</p>
        </div>
      </div>

      {/* ── 4. INSIGHT STRIP (horizontal scroll + snap on mobile) ─────── */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>

        {bestSubject && (
          <div className="snap-start shrink-0 w-[72vw] sm:w-auto sm:flex-1 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-neutral-900 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base leading-none">💪</span>
              <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">শক্তি</p>
            </div>
            <p className="font-black text-sm text-neutral-800 dark:text-white leading-tight">{getSubjectDisplayName(bestSubject.name)}</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {Math.round((bestSubject.correct / bestSubject.total) * 100)}% সঠিকতা
            </p>
          </div>
        )}

        {worstSubject && (
          <div className="snap-start shrink-0 w-[72vw] sm:w-auto sm:flex-1 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-neutral-900 border border-red-100 dark:border-red-900/20 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-base leading-none">⚠️</span>
              <p className="text-[9px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">মনোযোগ দাও</p>
            </div>
            <p className="font-black text-sm text-neutral-800 dark:text-white leading-tight">{getSubjectDisplayName(worstSubject.name)}</p>
            <p className="text-xs font-bold text-red-600 dark:text-red-400 mt-0.5">
              {Math.round((worstSubject.correct / worstSubject.total) * 100)}% সঠিকতা
            </p>
          </div>
        )}

        <div className="snap-start shrink-0 w-[72vw] sm:w-auto sm:flex-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-neutral-900 border border-blue-100 dark:border-blue-900/20 rounded-2xl p-3.5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base leading-none">🎯</span>
            <p className="text-[9px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">আজকের লক্ষ্য</p>
          </div>
          <p className="font-black text-sm text-neutral-800 dark:text-white leading-tight">৩০টি MCQ অনুশীলন</p>
          <p className="text-xs font-bold text-blue-700 dark:text-blue-400 mt-0.5">
            গড় {formatTime(analytics.avgTimePerQuestion)}/প্রশ্ন
          </p>
        </div>
      </div>

      {/* ── 5. PERFORMANCE CHART ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-1.5">
            <svg className="w-4 h-4 text-blue-700 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            পারফরম্যান্স ট্রেন্ড
          </h3>
          {bestScore !== null && (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-700 animate-pulse" />
              <span className="text-[10px] font-bold text-neutral-400">
                সর্বোচ্চ: <span className="text-blue-700 dark:text-blue-400">{bestScore}%</span>
              </span>
            </div>
          )}
        </div>

        <div className="h-44 sm:h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analytics.timelineData} margin={{ top: 5, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1d4ed8" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.4} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} dy={8} minTickGap={30} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.10)', fontSize: '12px', padding: '8px 12px' }}
                labelStyle={{ color: '#64748b', marginBottom: '2px', fontSize: '11px' }}
                itemStyle={{ color: '#1d4ed8', fontWeight: 'bold' }}
                formatter={(value: any) => [`${value}%`, 'স্কোর']}
              />
              <Area type="monotone" dataKey="score" stroke="#1d4ed8" strokeWidth={2.5}
                fillOpacity={1} fill="url(#gradBlue)" dot={false} animationDuration={900} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 6. SUBJECT HORIZONTAL ANIMATED BARS ─────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 shadow-sm">
        <h3 className="font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-1.5 mb-3">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
          </svg>
          বিষয়ভিত্তিক পারফরম্যান্স
        </h3>

        <div className="space-y-3">
          {localizedSubjectData.length === 0 ? (
            <p className="text-center text-sm text-neutral-400 py-6">এখনও কোনো পরীক্ষা দেওয়া হয়নি।</p>
          ) : (
            localizedSubjectData.map((subject, i) => {
              const pct = subject.total > 0 ? Math.round((subject.correct / subject.total) * 100) : 0;
              const barClass   = pct >= 70 ? 'bg-emerald-600' : pct >= 50 ? 'bg-amber-500' : 'bg-red-600';
              const scoreColor = pct >= 70
                ? 'text-emerald-600 dark:text-emerald-400'
                : pct >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400';
              return (
                <button key={i}
                  onClick={() => onSubjectClick && onSubjectClick(subject.id || subject.name)}
                  className="w-full text-left group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                      {subject.name}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold text-neutral-400">{subject.total} প্রশ্ন</span>
                      <span className={`text-xs font-black tabular-nums ${scoreColor}`}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                      className={`h-full rounded-full ${barClass}`}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── 7. ACHIEVEMENT SHELF ────────────────────────────────────── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 shadow-sm">
        <h3 className="font-bold text-sm text-neutral-800 dark:text-white flex items-center gap-1.5 mb-3">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
          </svg>
          তোমার অর্জন
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {achievements.map((a) => (
            <div key={a.id}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                a.unlocked
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30'
                  : 'bg-neutral-50 dark:bg-neutral-800/40 border-neutral-100 dark:border-neutral-800 opacity-45'
              }`}>
              <span className={`text-xl leading-none ${!a.unlocked ? 'grayscale' : ''}`}>
                {a.unlocked ? a.icon : '🔒'}
              </span>
              <p className="text-[9px] font-bold text-neutral-600 dark:text-neutral-400 leading-tight">{a.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AnalysisView;
