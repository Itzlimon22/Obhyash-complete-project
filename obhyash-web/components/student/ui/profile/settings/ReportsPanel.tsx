'use client';

import { useState } from 'react';
import useSWRInfinite from 'swr/infinite';
import { AlertTriangle, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserProfile, Report, ReportStatus } from '@/lib/types';
import { getUserReports } from '@/services/report-service';

interface ReportsPanelProps {
  user: UserProfile;
}

type TabFilter = 'all' | 'Pending' | 'Resolved' | 'Ignored';

const PAGE_SIZE = 10;

const TAB_LABELS: { id: TabFilter; label: string }[] = [
  { id: 'all', label: 'সব' },
  { id: 'Pending', label: 'অপেক্ষমান' },
  { id: 'Resolved', label: 'গৃহীত' },
  { id: 'Ignored', label: 'বাতিল' },
];

const REASON_LABELS: Record<string, string> = {
  wrong_answer: 'ভুল উত্তর',
  wrong_explanation: 'ভুল ব্যাখ্যা',
  typo: 'বানান ভুল',
  unclear_question: 'অস্পষ্ট প্রশ্ন',
  image_missing: 'ছবি নেই',
  duplicate: 'ডুপ্লিকেট',
  other: 'অন্যান্য',
};

function StatusBadge({ status }: { status: ReportStatus }) {
  if (status === 'Resolved') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-800 text-white">
        গৃহীত
      </span>
    );
  }
  if (status === 'Ignored') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-600 text-white">
        বাতিল
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-600 text-white">
      অপেক্ষমান
    </span>
  );
}

function QuestionViewerDialog({
  report,
  open,
  onClose,
}: {
  report: Report;
  open: boolean;
  onClose: () => void;
}) {
  const q = report.question;
  if (!q) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            প্রশ্ন দেখুন
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="font-medium text-neutral-800 dark:text-neutral-200 leading-relaxed">
            {q.question}
          </p>
          {q.options && q.options.length > 0 && (
            <ul className="space-y-1.5">
              {q.options.map((opt, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  <span className="font-bold shrink-0 text-green-800 dark:text-green-400">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                </li>
              ))}
            </ul>
          )}
          {q.explanation && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border-l-4 border-green-800">
              <p className="text-xs font-semibold text-green-800 dark:text-green-400 mb-1">
                ব্যাখ্যা
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {q.explanation}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportCard({ report }: { report: Report }) {
  const [expanded, setExpanded] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const accentColor =
    report.status === 'Resolved' ? 'bg-green-800' : 'bg-red-600';

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Left accent strip + main content */}
        <div className="flex">
          <div className={`w-1 shrink-0 ${accentColor}`} />
          <div className="flex-1 p-4">
            {/* Top row: reason + status + date */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-md">
                  {REASON_LABELS[report.reason] ?? report.reason}
                </span>
                <StatusBadge status={report.status} />
              </div>
              <time className="text-xs text-neutral-400 shrink-0">
                {new Date(report.created_at).toLocaleDateString('bn-BD')}
              </time>
            </div>

            {/* Question preview */}
            {report.question?.question && (
              <p className="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2 mb-2 leading-snug">
                {report.question.question}
              </p>
            )}

            {/* Subject chip */}
            {report.question?.subject && (
              <span className="text-xs text-green-800 dark:text-green-400 font-medium">
                {report.question.subject}
              </span>
            )}

            {/* Actions row */}
            <div className="flex items-center gap-2 mt-3">
              {report.question && (
                <button
                  onClick={() => setViewerOpen(true)}
                  className="flex items-center gap-1 text-xs text-green-800 dark:text-green-400 hover:underline"
                >
                  <Eye size={13} />
                  প্রশ্ন দেখুন
                </button>
              )}
              <button
                onClick={() => setExpanded((p) => !p)}
                className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 ml-auto"
              >
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                {expanded ? 'কম দেখুন' : 'বিস্তারিত'}
              </button>
            </div>

            {/* Expanded details */}
            {expanded && (
              <div className="mt-3 space-y-2 border-t border-neutral-100 dark:border-neutral-800 pt-3">
                {report.description && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-0.5">
                      আপনার বিবরণ
                    </p>
                    <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border-l-4 border-red-500">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {report.description}
                      </p>
                    </div>
                  </div>
                )}

                {report.admin_comment && (
                  <div>
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 mb-0.5">
                      অ্যাডমিন ফিডব্যাক
                    </p>
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border-l-4 border-green-800">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
                        {report.admin_comment}
                      </p>
                    </div>
                  </div>
                )}

                {report.resolved_at && (
                  <p className="text-xs text-neutral-400">
                    সমাধান:{' '}
                    {new Date(report.resolved_at).toLocaleDateString('bn-BD')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {report.question && (
        <QuestionViewerDialog
          report={report}
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}

export default function ReportsPanel({ user }: ReportsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');

  const { data, size, setSize, isLoading } = useSWRInfinite(
    (pageIndex) => (user.id ? ['user-reports', user.id, pageIndex + 1] : null),
    ([, userId, page]) =>
      getUserReports(userId as string, page as number, PAGE_SIZE),
    { revalidateFirstPage: false },
  );

  const allReports: Report[] = data ? (data.flat() as Report[]) : [];
  const hasMore = data
    ? (data[data.length - 1]?.length ?? 0) >= PAGE_SIZE
    : false;

  const counts: Record<TabFilter, number> = {
    all: allReports.length,
    Pending: allReports.filter((r) => r.status === 'Pending').length,
    Resolved: allReports.filter((r) => r.status === 'Resolved').length,
    Ignored: allReports.filter((r) => r.status === 'Ignored').length,
  };

  const filtered =
    activeTab === 'all'
      ? allReports
      : allReports.filter((r) => r.status === activeTab);

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="bg-green-800 px-6 py-4 flex items-center gap-3">
        <AlertTriangle size={20} className="text-red-300 shrink-0" />
        <div>
          <h2 className="text-lg font-bold text-white">আমার রিপোর্ট</h2>
          <p className="text-xs text-green-200">
            রিপোর্ট করা প্রশ্ন ও অ্যাডমিন ফিডব্যাক
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-x-auto">
        {TAB_LABELS.map(({ id, label }) => {
          const isActive = activeTab === id;
          const isDanger = id === 'Pending' || id === 'Ignored';
          const activeTabClass = isDanger
            ? 'border-red-600 text-red-600'
            : 'border-green-800 text-green-800 dark:text-green-400 dark:border-green-600';
          const badgeClass = isDanger
            ? 'bg-red-600 text-white'
            : 'bg-green-800 text-white';

          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                isActive
                  ? activeTabClass
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              }`}
            >
              {label}
              {counts[id] > 0 && (
                <span
                  className={`inline-flex items-center justify-center rounded-full text-xs min-w-[18px] h-[18px] px-1 font-bold ${
                    isActive
                      ? badgeClass
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}
                >
                  {counts[id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-3 bg-neutral-50 dark:bg-neutral-950 overflow-y-auto">
        {isLoading && allReports.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-neutral-400">
            <svg
              className="animate-spin h-6 w-6 mr-2"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            লোড হচ্ছে...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-3">
            <AlertTriangle
              size={36}
              className="text-neutral-300 dark:text-neutral-700"
            />
            <p className="text-sm">কোনো রিপোর্ট নেই</p>
          </div>
        ) : (
          <>
            {filtered.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}

            {hasMore && (
              <button
                onClick={() => setSize(size + 1)}
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-green-800 dark:text-green-400 border border-green-800 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'লোড হচ্ছে...' : 'আরো দেখুন'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
