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
    (index) => {
      if (!user?.id) return null;
      return ['user_reports', user.id, index + 1, pageSize];
    },
    async ([, userId, page]) => {
      if (!userId) return [];
      return getUserReports(userId as string, page as number, pageSize);
    },
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/10 dark:text-red-500 dark:border-red-800/30">
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 dark:bg-red-900/10 dark:text-red-500 dark:border-red-800/30">
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
          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1.5">
              ব্যাখ্যা
            </h4>
            <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
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
    <div className="max-w-4xl mx-auto px-2 py-4 md:p-6 space-y-4 md:space-y-6 animate-fade-in pb-20">
      <div className="flex flex-col gap-1.5 md:gap-2 px-1 md:px-0">
        <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          <AlertTriangle className="text-red-500 w-5 h-5 md:w-6 md:h-6" />
          আমার রিপোর্টসমূহ
        </h1>
        <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">
          আপনার দাখিলকৃত প্রশ্নের রিপোর্ট ও অ্যাডমিন ফিডব্যাক
        </p>
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
        <div className="grid gap-3 md:gap-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-neutral-900/80 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700"
            >
              {/* Card Header Content */}
              <div
                className="p-3 md:p-5 flex flex-col md:flex-row gap-3 md:gap-5 justify-between items-start cursor-pointer active:bg-neutral-50/50 dark:active:bg-neutral-800/30 transition-colors"
                onClick={() => toggleExpand(report.id)}
              >
                <div className="flex items-start gap-3 md:gap-4 flex-1 w-full">
                  <div className="mt-0.5 md:mt-1 p-2 md:p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800/30 shadow-sm text-red-500 transition-colors shrink-0">
                    <AlertTriangle size={20} className="md:w-6 md:h-6" />
                  </div>
                  <div className="space-y-1 md:space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <span className="font-bold md:font-black text-sm md:text-base text-neutral-900 dark:text-white truncate max-w-[180px] xs:max-w-none">
                          {getSubjectDisplayName(
                            report.question?.subject ?? '',
                          )}
                        </span>
                        {getStatusBadge(report.status)}
                      </div>

                      {/* Mobile Expand chevron moved here for better mobile layout */}
                      <button className="md:hidden p-1 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors shrink-0">
                        {expandedReport === report.id ? (
                          <ChevronUp size={18} />
                        ) : (
                          <ChevronDown size={18} />
                        )}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 md:gap-x-4 gap-y-1 text-[11px] md:text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      <span className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                        <Clock size={12} className="opacity-70" />
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
                    <p className="text-[13px] md:text-sm font-semibold text-neutral-700 dark:text-neutral-300 mt-1.5 md:mt-2 line-clamp-2 leading-snug">
                      <span className="text-neutral-400 dark:text-neutral-500 font-normal">
                        রিপোর্টের কারণ:
                      </span>{' '}
                      {report.reason}
                    </p>
                  </div>
                </div>

                <div className="hidden md:flex items-center gap-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all active:scale-[0.98] shadow-sm"
                      >
                        <Eye size={14} /> প্রশ্ন দেখো
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl w-[95vw] md:w-full bg-white dark:bg-neutral-900 border-none shadow-2xl rounded-2xl p-4 md:p-6">
                      <DialogHeader>
                        <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-2 font-serif-exam">
                          <Eye className="text-red-500" /> প্রশ্ন বিস্তারিত
                        </DialogTitle>
                      </DialogHeader>
                      <div className="mt-2 text-left">
                        <QuestionViewer question={report.question} />
                      </div>
                    </DialogContent>
                  </Dialog>

                  <button className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700">
                    {expandedReport === report.id ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expandedReport === report.id ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
              >
                <div className="overflow-hidden">
                  <div className="p-3 md:px-6 md:pb-6 pt-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-black/20">
                    {/* Mobile Eye Button */}
                    <div className="md:hidden flex mb-4">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-sm font-bold rounded-xl border border-neutral-200 dark:border-neutral-700 transition-all active:scale-[0.98] shadow-sm"
                          >
                            <Eye size={16} /> সম্পূর্ণ প্রশ্ন দেখো
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl w-[95vw] bg-white dark:bg-neutral-900 border-none shadow-2xl rounded-2xl p-4">
                          <DialogHeader>
                            <DialogTitle className="text-lg font-bold flex items-center gap-2 font-serif-exam">
                              <Eye className="text-red-500" /> প্রশ্ন বিস্তারিত
                            </DialogTitle>
                          </DialogHeader>
                          <div className="mt-2 text-left">
                            <QuestionViewer question={report.question} />
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                      <div className="space-y-4">
                        <div className="bg-white dark:bg-neutral-900/80 p-3 md:p-4 rounded-xl border border-neutral-100 dark:border-neutral-700/50 shadow-sm relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400"></div>
                          <h4 className="text-[10px] uppercase tracking-widest font-black text-red-500 mb-2 flex items-center gap-1.5 ml-2">
                            আপনার মন্তব্য
                          </h4>
                          <p className="text-[13px] md:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium ml-2">
                            "{report.description || 'কোনো বিবরণ নেই'}"
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {report.image_url && (
                          <div>
                            <h4 className="text-[10px] uppercase tracking-widest font-black text-neutral-400 mb-2 flex items-center gap-1.5">
                              রেফারেন্স ছবি
                            </h4>
                            <a
                              href={report.image_url}
                              target="_blank"
                              rel="noreferrer"
                              className="block group relative rounded-xl md:rounded-2xl overflow-hidden border-2 border-dashed border-neutral-200 dark:border-neutral-700 p-1 hover:border-neutral-300 transition-colors"
                            >
                              <img
                                src={report.image_url}
                                alt="Reference"
                                className="w-full h-36 object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold border border-white/30 flex items-center gap-2">
                                  <ExternalLink size={14} /> দেখো
                                </span>
                              </div>
                            </a>
                          </div>
                        )}

                        {report.admin_comment ? (
                          <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 shadow-sm relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                            <h4 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 ml-1.5">
                              <CheckCircle size={12} /> অ্যাডমিন ফিডব্যাক
                            </h4>
                            <p className="text-[13px] md:text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed font-medium ml-1.5">
                              {report.admin_comment}
                            </p>
                          </div>
                        ) : (
                          <div className="bg-neutral-100/50 dark:bg-neutral-800/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-700 border-dashed text-center flex flex-col items-center justify-center">
                            <Clock
                              className="mb-1.5 text-neutral-400 dark:text-neutral-500"
                              size={18}
                            />
                            <p className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-wide">
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
                  'আরও দেখো'
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
