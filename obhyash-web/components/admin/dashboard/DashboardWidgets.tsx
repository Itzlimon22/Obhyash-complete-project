'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  FileQuestion,
  CheckCircle,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  BookOpen,
  Calendar,
  Radio,
  Clock,
  Sparkles,
  Zap,
  TrendingUp,
  Layers,
  ShieldAlert,
  BarChart2,
  PlusCircle,
  UploadCloud,
  FileSearch,
  Activity,
} from 'lucide-react';

export interface AdminKPIData {
  id: string;
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  accentColor: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose';
  href?: string;
}

export interface SubjectHealthItem {
  id: string;
  name: string;
  banglaName: string;
  count: number;
  target: number;
  percentage: number;
}

export interface ActiveLiveExamSummary {
  id: string;
  title: string;
  subject: string;
  totalQuestions: number;
  durationMinutes: number;
  status: 'live' | 'upcoming' | 'ended';
  startTime?: string;
  participantsCount: number;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. INTELLIGENT KPI STAT CARD
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const IntelligentStatCard: React.FC<{ data: AdminKPIData }> = ({ data }) => {
  const Icon = data.icon;

  const colorStyles = {
    emerald: {
      border: 'hover:border-emerald-500/40 dark:hover:border-emerald-500/30',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      glow: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
      bar: 'bg-emerald-500',
    },
    blue: {
      border: 'hover:border-blue-500/40 dark:hover:border-blue-500/30',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      glow: 'from-blue-500/15 via-blue-500/5 to-transparent',
      bar: 'bg-blue-500',
    },
    amber: {
      border: 'hover:border-amber-500/40 dark:hover:border-amber-500/30',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      glow: 'from-amber-500/15 via-amber-500/5 to-transparent',
      bar: 'bg-amber-500',
    },
    purple: {
      border: 'hover:border-purple-500/40 dark:hover:border-purple-500/30',
      iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      glow: 'from-purple-500/15 via-purple-500/5 to-transparent',
      bar: 'bg-purple-500',
    },
    rose: {
      border: 'hover:border-rose-500/40 dark:hover:border-rose-500/30',
      iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      glow: 'from-rose-500/15 via-rose-500/5 to-transparent',
      bar: 'bg-rose-500',
    },
  }[data.accentColor];

  const content = (
    <div
      className={`relative overflow-hidden bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-zinc-800/80 rounded-2xl p-4 md:p-5 transition-all duration-300 group shadow-sm hover:shadow-lg dark:hover:shadow-black/50 ${colorStyles.border}`}
    >
      {/* Subtle Corner Gradient Glow */}
      <div
        className={`absolute -top-16 -right-16 w-36 h-36 rounded-full bg-gradient-to-br ${colorStyles.glow} blur-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
      />

      <div className="flex justify-between items-start relative z-10 mb-3">
        <div className="space-y-1 min-w-0 pr-2">
          <span className="text-neutral-500 dark:text-zinc-400 text-[11px] font-semibold tracking-wider uppercase truncate block">
            {data.title}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-zinc-100 tracking-tight font-mono">
              {typeof data.value === 'number' ? data.value.toLocaleString() : data.value}
            </span>
          </div>
        </div>

        <div
          className={`p-2.5 rounded-xl border ${colorStyles.iconBg} flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-300`}
        >
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
      </div>

      <div className="flex items-center justify-between relative z-10 text-[11px]">
        {data.trend ? (
          <div
            className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md ${
              data.trend.isPositive
                ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
                : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10'
            }`}
          >
            {data.trend.isPositive ? (
              <ArrowUpRight size={13} strokeWidth={2.8} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.8} />
            )}
            <span>{data.trend.value}%</span>
            {data.trend.label && (
              <span className="font-normal opacity-80 text-[10px] ml-0.5">{data.trend.label}</span>
            )}
          </div>
        ) : (
          <span className="text-neutral-400 dark:text-zinc-500 text-[11px]">
            {data.subtitle || 'Realtime sync'}
          </span>
        )}

        {data.href && (
          <span className="text-neutral-400 dark:text-zinc-500 group-hover:text-neutral-900 dark:group-hover:text-zinc-200 transition-colors flex items-center gap-0.5 text-[11px] font-medium">
            Manage <ChevronRight size={12} />
          </span>
        )}
      </div>

      {/* Bottom Accent Highlight Line */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-100 dark:bg-zinc-800/80 overflow-hidden">
        <div
          className={`h-full ${colorStyles.bar} opacity-40 group-hover:opacity-100 transition-opacity duration-300`}
        />
      </div>
    </div>
  );

  if (data.href) {
    return <Link href={data.href}>{content}</Link>;
  }
  return content;
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. SUBJECT QUESTION HEALTH & DISTRIBUTION MATRIX
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const SubjectHealthMatrix: React.FC<{
  subjects: SubjectHealthItem[];
  totalQuestions: number;
}> = ({ subjects, totalQuestions }) => {
  return (
    <div className="bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-zinc-100">
              Question Bank Distribution
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-zinc-400 mt-1">
            Subject-wise question depth and coverage targets across HSC & SSC
          </p>
        </div>

        <Link
          href="/admin/question-management"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1 self-start sm:self-auto"
        >
          View Bank <ChevronRight size={14} />
        </Link>
      </div>

      <div className="space-y-3.5">
        {subjects.map((sub) => {
          const isHealthy = sub.count >= 200;
          const isModerate = sub.count >= 80 && sub.count < 200;

          return (
            <div key={sub.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-800 dark:text-zinc-200">
                    {sub.banglaName}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-zinc-500 font-mono">
                    ({sub.name})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-neutral-900 dark:text-zinc-100">
                    {sub.count.toLocaleString()}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      isHealthy
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : isModerate
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {isHealthy ? 'Optimal' : isModerate ? 'Good' : 'Needs Content'}
                  </span>
                </div>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2 bg-neutral-100 dark:bg-zinc-800/80 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isHealthy
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-400'
                      : isModerate
                        ? 'bg-gradient-to-r from-blue-600 to-blue-400'
                        : 'bg-gradient-to-r from-amber-600 to-amber-400'
                  }`}
                  style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. LIVE & UPCOMING EXAMS RADAR
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const LiveExamRadar: React.FC<{
  exams: ActiveLiveExamSummary[];
}> = ({ exams }) => {
  return (
    <div className="bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-zinc-100 flex items-center gap-2">
              Live Exams Radar
              {exams.some((e) => e.status === 'live') && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </h3>
          </div>
        </div>

        <Link
          href="/admin/live-exams"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
        >
          Manage All <ChevronRight size={14} />
        </Link>
      </div>

      {exams.length === 0 ? (
        <div className="text-center py-8 px-4 rounded-xl border border-dashed border-neutral-200 dark:border-zinc-800">
          <Calendar className="w-8 h-8 text-neutral-300 dark:text-zinc-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-neutral-600 dark:text-zinc-400">
            No live or scheduled exams at the moment
          </p>
          <Link
            href="/admin/live-exams"
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-[#004633] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#005a41] transition-all"
          >
            <PlusCircle size={13} />
            Schedule New Exam
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="p-3.5 rounded-xl border border-neutral-100 dark:border-zinc-800/80 bg-neutral-50/50 dark:bg-zinc-900/40 hover:border-emerald-500/30 transition-all flex items-center justify-between gap-3"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide ${
                      exam.status === 'live'
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 animate-pulse'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {exam.status === 'live' ? '● LIVE NOW' : 'UPCOMING'}
                  </span>
                  <span className="text-[11px] text-neutral-400 dark:text-zinc-500 font-medium">
                    {exam.subject}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-neutral-900 dark:text-zinc-100 truncate">
                  {exam.title}
                </h4>

                <div className="flex items-center gap-3 text-[10px] text-neutral-500 dark:text-zinc-400">
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {exam.durationMinutes} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <FileQuestion size={11} /> {exam.totalQuestions} questions
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="block text-sm font-extrabold text-neutral-900 dark:text-zinc-100 font-mono">
                  {exam.participantsCount}
                </span>
                <span className="block text-[9px] text-neutral-400 dark:text-zinc-500 font-medium">
                  Participants
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 4. SMART COMMAND / QUICK ACTION TILES
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const SmartQuickActions: React.FC = () => {
  const actions = [
    {
      title: 'Bulk Upload Questions',
      desc: 'Import Word, JSON or Excel',
      icon: UploadCloud,
      href: '/admin/question-management',
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Create Live Exam',
      desc: 'Schedule competitive contest',
      icon: Radio,
      href: '/admin/live-exams',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    },
    {
      title: 'Question Bank Search',
      desc: 'LaTeX inspect & edit questions',
      icon: FileSearch,
      href: '/admin/questions',
      color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Review Question Reports',
      desc: 'Triage student feedback',
      icon: ShieldAlert,
      href: '/admin/reports',
      color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#121215] border border-neutral-200/80 dark:border-zinc-800/80 rounded-2xl p-5 md:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 rounded-lg bg-[#004633]/10 text-[#004633] dark:text-emerald-400 border border-emerald-500/20">
          <Zap className="w-4 h-4" />
        </div>
        <h3 className="text-base font-bold text-neutral-900 dark:text-zinc-100">
          Quick Command Actions
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              href={act.href}
              className="p-3.5 rounded-xl border border-neutral-200/70 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-900/30 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:bg-white dark:hover:bg-zinc-900/80 transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="space-y-0.5 min-w-0 mr-2">
                <h4 className="text-xs font-bold text-neutral-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {act.title}
                </h4>
                <p className="text-[10.5px] text-neutral-500 dark:text-zinc-400 truncate">
                  {act.desc}
                </p>
              </div>

              <div
                className={`p-2 rounded-lg border ${act.color} group-hover:scale-110 transition-transform shrink-0`}
              >
                <Icon size={16} strokeWidth={2.2} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

// Backward-compatible exports for any existing components referencing legacy names
export const StatCard: React.FC<{ data: any }> = ({ data }) => {
  const accent = data.id === 'users' ? 'blue' : data.id === 'questions' ? 'emerald' : data.id === 'reports' ? 'amber' : 'purple';
  return (
    <IntelligentStatCard
      data={{
        id: data.id || 'stat',
        title: data.title || 'Metric',
        value: data.value ?? 0,
        icon: data.icon || Activity,
        accentColor: accent,
        trend: data.trend,
      }}
    />
  );
};

export const DatabaseToolsSection: React.FC = () => {
  return <SmartQuickActions />;
};
