'use client';

import React, { useState, useMemo } from 'react';
import useSWRInfinite from 'swr/infinite';
import {
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  FileSearch,
  User,
  ShieldCheck,
  Bot,
  CalendarDays,
  Image as ImageIcon,
  AlertCircle,
  RefreshCw,
  Inbox,
  X,
  HelpCircle,
} from 'lucide-react';
import { UserProfile, Report, Question } from '@/lib/types';
import { getUserReports } from '@/services/report-service';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';

interface ReportsPanelProps {
  user: UserProfile;
}

type StatusFilter = '' | 'pending' | 'Resolved' | 'Ignored';

const PAGE_SIZE = 10;

const SUBJECT_NAMES: Record<string, string> = {
  physics: 'পদার্থবিজ্ঞান',
  chemistry: 'রসায়ন',
  biology: 'জীববিজ্ঞান',
  math: 'গণিত',
  higher_math: 'উচ্চতর গণিত',
  bangla: 'বাংলা',
  english: 'ইংরেজি',
  ict: 'আইসিটি',
  general_knowledge: 'সাধারণ জ্ঞান',
  gk: 'সাধারণ জ্ঞান',
  general: 'সাধারণ',
};

const REASON_LABELS: Record<string, string> = {
  wrong_answer: 'ভুল উত্তর',
  wrong_explanation: 'ভুল ব্যাখ্যা',
  typo: 'বানান ভুল',
  unclear_question: 'অস্পষ্ট প্রশ্ন',
  image_missing: 'ছবি নেই',
  duplicate: 'ডুপ্লিকেট',
  other: 'অন্যান্য',
};

function formatSubject(key?: string) {
  if (!key) return 'Unknown Subject';
  return SUBJECT_NAMES[key.toLowerCase()] || key;
}

export default function ReportsPanel({ user }: ReportsPanelProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewQuestionReport, setViewQuestionReport] = useState<Report | null>(null);

  const { data, size, setSize, isLoading, isValidating, mutate, error } =
    useSWRInfinite(
      (pageIndex) =>
        user?.id ? ['user-reports', user.id, pageIndex + 1] : null,
      ([, userId, page]) =>
        getUserReports(userId as string, page as number, PAGE_SIZE),
      { revalidateFirstPage: false }
    );

  const allReports: Report[] = useMemo(() => {
    return data ? (data.flat() as Report[]) : [];
  }, [data]);

  const hasMore = data
    ? (data[data.length - 1]?.length ?? 0) >= PAGE_SIZE
    : false;

  const pendingCount = useMemo(
    () =>
      allReports.filter(
        (r) => r.status !== 'Resolved' && r.status !== 'Ignored'
      ).length,
    [allReports]
  );
  const resolvedCount = useMemo(
    () => allReports.filter((r) => r.status === 'Resolved').length,
    [allReports]
  );
  const ignoredCount = useMemo(
    () => allReports.filter((r) => r.status === 'Ignored').length,
    [allReports]
  );

  const filteredReports = useMemo(() => {
    if (!statusFilter) return allReports;
    if (statusFilter === 'pending') {
      return allReports.filter(
        (r) => r.status !== 'Resolved' && r.status !== 'Ignored'
      );
    }
    return allReports.filter((r) => r.status === statusFilter);
  }, [allReports, statusFilter]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-4 font-['HindSiliguri',sans-serif] pb-12">
      {/* ── Top 3 Compact Centered Stat Boxes (1:1 with Flutter _StatBox) ── */}
      {allReports.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Pending */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-1.5">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tabular-nums leading-none">
              {pendingCount}
            </span>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-1">
              অপেক্ষমান
            </span>
          </div>

          {/* Resolved */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-1.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tabular-nums leading-none">
              {resolvedCount}
            </span>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-1">
              গৃহীত
            </span>
          </div>

          {/* Ignored */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] shadow-xs flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-1.5">
              <XCircle className="w-4 h-4" />
            </div>
            <span className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tabular-nums leading-none">
              {ignoredCount}
            </span>
            <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 mt-1">
              বাতিল
            </span>
          </div>
        </div>
      )}

      {/* ── Status Filter Pills ── */}
      {allReports.length > 0 && (
        <div className="p-1 rounded-2xl bg-neutral-100 dark:bg-[#000000] border border-neutral-200 dark:border-[#1C1C1E] grid grid-cols-4 gap-1 shadow-xs">
          {[
            { id: '' as StatusFilter, label: 'সব' },
            { id: 'pending' as StatusFilter, label: 'অপেক্ষমান' },
            { id: 'Resolved' as StatusFilter, label: 'গৃহীত' },
            { id: 'Ignored' as StatusFilter, label: 'বাতিল' },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`
                  py-2 px-1 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer truncate
                  ${
                    isSelected
                      ? 'bg-white dark:bg-[#27272A] text-neutral-900 dark:text-white shadow-xs font-black'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }
                `}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Content Body ── */}
      {isLoading && allReports.length === 0 ? (
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] animate-pulse space-y-3"
            >
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/4" />
              <div className="h-5 bg-neutral-200 dark:bg-neutral-800 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-10 text-center flex flex-col items-center justify-center bg-white dark:bg-[#18181B] rounded-3xl border border-neutral-200 dark:border-[#27272A]">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center mb-3">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            ডেটা লোড করতে সমস্যা হয়েছে
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 mb-4">
            ইন্টারনেট সংযোগ পরীক্ষা করো এবং আবার চেষ্টা করো।
          </p>
          <button
            onClick={() => mutate()}
            className="px-5 py-2.5 rounded-xl bg-[#B91C1C] text-white font-bold text-sm flex items-center gap-2 hover:bg-rose-700 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>আবার চেষ্টা করো</span>
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-12 text-center flex flex-col items-center justify-center bg-white dark:bg-[#18181B] rounded-3xl border border-neutral-200 dark:border-[#27272A] shadow-xs">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-[#1C1C1E] flex items-center justify-center text-neutral-400 mb-4 shadow-inner">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-neutral-900 dark:text-white">
            কোনো রিপোর্ট পাওয়া যায়নি
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm leading-relaxed">
            {allReports.length === 0
              ? 'তুমি এখন পর্যন্ত কোনো প্রশ্ন রিপোর্ট করোনি। প্রশ্নে কোনো ভুল পেলে রিপোর্ট করতে পারো।'
              : 'এই ফিল্টারে কোনো রিপোর্ট পাওয়া যায়নি।'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => {
            const isExpanded = expandedId === report.id;
            const statusConfig =
              report.status === 'Resolved'
                ? {
                    color: '#059669',
                    label: 'গৃহীত',
                    Icon: CheckCircle2,
                    bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                    barColor: 'bg-emerald-600',
                  }
                : report.status === 'Ignored'
                ? {
                    color: '#EF4444',
                    label: 'বাতিল',
                    Icon: XCircle,
                    bg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-500/20',
                    barColor: 'bg-neutral-600',
                  }
                : {
                    color: '#2563EB',
                    label: 'অপেক্ষমান',
                    Icon: Clock,
                    bg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-500/20',
                    barColor: 'bg-blue-600',
                  };

            const StatusIcon = statusConfig.Icon;

            return (
              <div
                key={report.id}
                className="relative bg-white dark:bg-[#18181B] rounded-[20px] border border-neutral-200 dark:border-[#27272A] shadow-xs overflow-hidden transition-all"
              >
                {/* Left status color bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${statusConfig.barColor}`}
                />

                <div className="pl-2">
                  {/* Header Row */}
                  <div
                    onClick={() =>
                      setExpandedId((prev) =>
                        prev === report.id ? null : report.id
                      )
                    }
                    className="p-4 sm:p-5 flex items-start gap-3 sm:gap-4 cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-[#202024]/50 transition-colors"
                  >
                    {/* Status Icon */}
                    <div
                      className="p-2.5 sm:p-3 rounded-2xl shrink-0"
                      style={{
                        backgroundColor: `${statusConfig.color}15`,
                        color: statusConfig.color,
                      }}
                    >
                      <StatusIcon className="w-5 h-5" />
                    </div>

                    {/* Report Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white truncate">
                          {formatSubject(report.question?.subject)}
                        </h4>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${statusConfig.bg}`}
                        >
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-bold mb-2">
                        <CalendarDays className="w-3.5 h-3.5" />
                        <span>{formatDate(report.created_at)}</span>
                      </div>

                      <div className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                        <span className="text-neutral-400 font-medium mr-1">
                          কারণ:
                        </span>
                        <span className="font-bold text-neutral-800 dark:text-neutral-200">
                          {REASON_LABELS[report.reason] || report.reason}
                        </span>
                      </div>
                    </div>

                    {/* Chevron */}
                    <div
                      className={`p-1.5 rounded-full bg-neutral-100 dark:bg-[#27272A] text-neutral-500 transition-transform duration-200 shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>

                  {/* ── Expanded Content (1:1 with Flutter _ReportCard Expanded) ── */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 pt-0 border-t border-neutral-100 dark:border-[#27272A] mt-1 space-y-3 bg-neutral-50/50 dark:bg-[#121214]/50">
                      {/* View Question Button */}
                      {report.question && (
                        <button
                          type="button"
                          onClick={() => setViewQuestionReport(report)}
                          className="w-full py-3 px-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-sky-100/60 dark:hover:bg-sky-950/60 transition-colors cursor-pointer"
                        >
                          <FileSearch className="w-4 h-4" />
                          <span>সম্পূর্ণ প্রশ্ন ও অপশন দেখো</span>
                        </button>
                      )}

                      {/* User Comment Bubble */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 px-1">
                          <User className="w-3 h-3" />
                          <span>তুমি</span>
                        </div>
                        <div className="p-3.5 rounded-2xl rounded-tr-xs bg-neutral-100 dark:bg-[#27272A] border border-neutral-200/60 dark:border-[#3F3F46] text-neutral-800 dark:text-neutral-200 text-xs sm:text-sm leading-relaxed">
                          {report.description && report.description.trim()
                            ? report.description
                            : 'কোনো বিবরণ নেই'}
                        </div>
                      </div>

                      {/* Reference Image */}
                      {report.image_url && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 px-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>রেফারেন্স ছবি</span>
                          </div>
                          <div className="w-48 h-32 rounded-xl overflow-hidden border border-neutral-200 dark:border-[#3F3F46]">
                            <img
                              src={report.image_url}
                              alt="Report reference"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      {/* Admin Feedback Bubble */}
                      {report.admin_comment && report.admin_comment.trim() ? (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>অ্যাডমিন</span>
                          </div>
                          <div className="p-3.5 rounded-2xl rounded-tl-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm leading-relaxed font-medium">
                            {report.admin_comment}
                          </div>
                        </div>
                      ) : report.status !== 'Resolved' &&
                        report.status !== 'Ignored' ? (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 px-1">
                            <Bot className="w-3.5 h-3.5" />
                            <span>সিস্টেম</span>
                          </div>
                          <div className="p-3.5 rounded-2xl rounded-tl-xs bg-neutral-100/70 dark:bg-[#1C1C1E] border border-neutral-200 dark:border-[#27272A] text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm italic leading-relaxed">
                            তোমার রিপোর্টটি টিমের কাছে পাঠানো হয়েছে। খুব
                            শীঘ্রই রিভিউ করা হবে।
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && !statusFilter && (
            <div className="pt-2 text-center">
              <button
                onClick={() => setSize(size + 1)}
                disabled={isLoading || isValidating}
                className="w-full py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#27272A] dark:hover:bg-[#3F3F46] text-neutral-800 dark:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading || isValidating ? (
                  <span>লোড হচ্ছে...</span>
                ) : (
                  <span>আরো দেখো</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Question Viewer Modal Sheet (1:1 with Flutter _showQuestion) ── */}
      {viewQuestionReport && viewQuestionReport.question && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-['HindSiliguri',sans-serif]"
          onClick={() => setViewQuestionReport(null)}
        >
          <div
            className="w-full max-w-xl bg-white dark:bg-[#141210] rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-6 shadow-2xl border border-neutral-200 dark:border-[#27272A] max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="w-10 h-1 bg-black/10 dark:bg-white/20 rounded-full mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 dark:border-[#27272A]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  সম্পূর্ণ প্রশ্ন
                </h3>
              </div>
              <button
                onClick={() => setViewQuestionReport(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1C1C1E]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Question Card */}
            <div className="flex-1 overflow-y-auto pr-1">
              <QuestionCard
                question={{
                  id: String(viewQuestionReport.question_id || viewQuestionReport.id),
                  subject: viewQuestionReport.question.subject || '',
                  chapter: '',
                  question: viewQuestionReport.question.question || '',
                  options: viewQuestionReport.question.options || [],
                  correctAnswer:
                    viewQuestionReport.question.options?.[
                      (viewQuestionReport.question as any).correct_answer_index ?? 0
                    ] || '',
                  correctAnswerIndex:
                    (viewQuestionReport.question as any).correct_answer_index ??
                    (viewQuestionReport.question as any).correctAnswerIndex ??
                    0,
                  correctAnswerIndices:
                    (viewQuestionReport.question as any).correct_answer_indices ??
                    (viewQuestionReport.question as any).correctAnswerIndices ?? [
                      (viewQuestionReport.question as any).correct_answer_index ?? 0,
                    ],
                  explanation: viewQuestionReport.question.explanation || '',
                  type: 'MCQ',
                  difficulty: 'Medium',
                  points: 1,
                  status: 'Approved',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                } as unknown as Question}
                serialNumber={1}
                readOnly={true}
                showAnswer={true}
                showFeedback={true}
                initiallyExpanded={true}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
