import React, { useEffect, useState } from 'react';
import { getUserReports } from '@/services/report-service';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import { Eye, ChevronRight, RefreshCw } from 'lucide-react';
import { ReportSkeleton } from '@/components/student/ui/common/Skeletons';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface StudentReportViewProps {
  user: UserProfile;
}

const StudentReportView: React.FC<StudentReportViewProps> = ({ user }) => {
  const [expandedReport, setExpandedReport] = useState<string | null>(null);
  const [pageSize] = useState(5);

  const {
    data: reportsPages,
    error,
    size,
    setSize,
    isValidating,
    isLoading,
  } = useSWRInfinite(
    (index) =>
      user?.id ? ['user_reports', user.id, index + 1, pageSize] : null,
    ([, userId, page]) => getUserReports(userId, page, pageSize),
    {
      revalidateOnFocus: false,
      persistSize: true,
    },
  );

  const reports = reportsPages ? reportsPages.flat() : [];
  const isEmpty = reportsPages?.[0]?.length === 0;
  const isReachingEnd =
    isEmpty ||
    (reportsPages && reportsPages[reportsPages.length - 1]?.length < pageSize);

  const toggleExpand = (id: string) => {
    setExpandedReport(expandedReport === id ? null : id);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-900/10 dark:text-amber-500 dark:border-amber-800/30">
            <Clock size={12} /> অপেক্ষমান
          </span>
        );
      case 'Resolved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-500 dark:border-emerald-800/30">
            <CheckCircle size={12} /> গৃহীত
          </span>
        );
      case 'Ignored':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-900/10 dark:text-rose-500 dark:border-rose-800/30">
            <XCircle size={12} /> বাতিল
          </span>
        );
      default:
        return null;
    }
  };

  const QuestionViewer = ({ question }: { question: any }) => {
    if (!question) return null;
    return (
      <div className="space-y-4">
        <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-100 dark:border-neutral-700">
          <p className="font-bold text-neutral-900 dark:text-white mb-3">
            {question.question}
          </p>
          <div className="space-y-2">
            {question.options?.map((opt: string, idx: number) => {
              const alphabet = ['ক', 'খ', 'গ', 'ঘ'];
              const isCorrect =
                Array.isArray(question.correct_answer_indices) &&
                question.correct_answer_indices.includes(idx);
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-2.5 rounded-lg border text-sm ${isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'bg-white border-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400'}`}
                >
                  <span className="font-bold">{alphabet[idx]}৷</span>
                  <span>{opt}</span>
                </div>
              );
            })}
          </div>
        </div>
        {question.explanation && (
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
            <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1.5">
              ব্যাখ্যা
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
              {question.explanation}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading && !reportsPages) {
    return <ReportSkeleton />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white font-serif-exam">
          আমার রিপোর্টসমূহ
        </h1>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-12 text-center border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-6 text-neutral-400">
            <AlertTriangle size={36} />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
            কোনো রিপোর্ট পাওয়া যায়নি
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400">
            আপনি এখন পর্যন্ত কোনো প্রশ্ন রিপোর্ট করেননি।
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              {/* Card Header Content */}
              <div
                className="p-5 flex flex-col md:flex-row gap-5 justify-between items-start cursor-pointer"
                onClick={() => toggleExpand(report.id)}
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-xl border border-neutral-100 dark:border-neutral-700 shadow-sm text-neutral-500 group-hover:text-rose-500 transition-colors">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-black text-neutral-900 dark:text-white">
                        {getSubjectDisplayName(report.question?.subject ?? '')}
                      </span>
                      {getStatusBadge(report.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-neutral-300" />
                        {new Date(report.created_at).toLocaleDateString(
                          'bn-BD',
                          {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          },
                        )}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 mt-2">
                      রিপোর্টের কারণ: {report.reason}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto mt-2 md:mt-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all active:scale-[0.98]"
                      >
                        <Eye size={14} /> প্রশ্ন দেখুন
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-white dark:bg-neutral-900 border-none shadow-2xl rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2 font-serif-exam">
                          <Eye className="text-rose-500" /> প্রশ্ন বিস্তারিত
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-2">
                        <QuestionViewer question={report.question} />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <button className="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                    {expandedReport === report.id ? (
                      <ChevronUp size={20} />
                    ) : (
                      <ChevronDown size={20} />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expandedReport === report.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <div className="p-5 md:px-8 md:pb-8 pt-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-800/20">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-5">
                        <div className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-100 dark:border-neutral-700 shadow-sm">
                          <h4 className="text-[10px] uppercase tracking-widest font-black text-rose-500 mb-3 flex items-center gap-2">
                            আপনার মন্তব্য
                          </h4>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
                            "{report.description || 'কোনো বিবরণ নেই'}"
                          </p>
                        </div>
                      </div>

                      <div className="space-y-5">
                        {report.image_url && (
                          <div>
                            <h4 className="text-[10px] uppercase tracking-widest font-black text-neutral-400 mb-2">
                              রেফারেন্স ছবি
                            </h4>
                            <a
                              href={report.image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block group relative rounded-2xl overflow-hidden border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-1 hover:border-neutral-300 transition-colors"
                            >
                              <img
                                src={report.image_url}
                                alt="Reference"
                                className="w-full h-36 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30 flex items-center gap-2">
                                  <ExternalLink size={14} /> দেখুন
                                </span>
                              </div>
                            </a>
                          </div>
                        )}

                        {report.admin_comment ? (
                          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-800 shadow-sm">
                            <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                              <CheckCircle size={14} /> অ্যাডমিন ফিডব্যাক
                            </h4>
                            <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                              {report.admin_comment}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-neutral-100/50 dark:bg-neutral-800/50 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 border-dashed text-center">
                            <Clock
                              className="mx-auto mb-2 text-neutral-400"
                              size={20}
                            />
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wide">
                              অ্যাডমিন এখনো কোনো ফিডব্যাক দেয়নি
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {!isReachingEnd && (
            <div className="flex justify-center pt-4">
              <button
                onClick={() => setSize(size + 1)}
                disabled={isValidating}
                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 text-sm font-bold rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all active:scale-95 shadow-sm disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" /> লোড
                    হচ্ছে...
                  </>
                ) : (
                  'আরো দেখুন'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentReportView;
