"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  ChevronRight,
  Trophy,
  ArrowRight,
  FileText,
  CalendarDays,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPublishedLiveExams } from "@/services/live-exam-student-service";
import { LiveExam } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import LiveExamDetailsView from "./LiveExamDetailsView";
import LiveExamRoutineModal from "./LiveExamRoutineModal";
import AppLayout from "@/components/student/ui/layout/AppLayout";
import { cn } from "@/lib/utils";

export interface LiveExamCategoryViewProps {
  category: string;
  commonLayoutProps: any;
  onBack: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  engineering: "ইঞ্জিনিয়ারিং",
  medical: "মেডিকেল",
  varsity: "ভার্সিটি ক-ইউনিট",
  hsc: "এইচএসসি স্পেশাল",
  ssc_board: "এসএসসি বোর্ড স্পেশাল",
  ssc_school: "শীর্ষ স্কুল ও ক্যাডেট",
  ssc_science: "বিজ্ঞান বিভাগ লাইভ টেস্ট",
  ssc_business: "বাণিজ্য লাইভ টেস্ট",
  ssc_humanities: "মানবিক লাইভ টেস্ট",
  ssc_compulsory: "আবশ্যিক বিষয় লাইভ টেস্ট",
};

export const LiveExamCategoryView: React.FC<LiveExamCategoryViewProps> = ({
  category,
  commonLayoutProps,
  onBack,
}) => {
  const { user } = useAuth();
  const [activeFilter, setActiveFilter] = useState<"All" | "Ongoing" | "Upcoming">("All");
  const [selectedExam, setSelectedExam] = useState<{
    id: string;
    title: string;
    status: "untaken" | "taken";
  } | null>(null);
  const [exams, setExams] = useState<(LiveExam & { userAttemptStatus?: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoutineOpen, setIsRoutineOpen] = useState(false);
  const [now, setNow] = useState<Date>(new Date());

  // 1-second interval for real-time countdown timer
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayCategoryTitle = CATEGORY_NAMES[category.toLowerCase()] || category;

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const data = await getPublishedLiveExams(category, user?.id);
      setExams(data);
    } catch (error) {
      console.warn("[LiveExamCategoryView] Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, [category, user?.id]);

  const filteredExams = exams.filter((exam) => {
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    const isOngoing = now >= start && now <= end;
    const isUpcoming = now < start;

    if (activeFilter === "Ongoing" && !isOngoing) return false;
    if (activeFilter === "Upcoming" && !isUpcoming) return false;
    return true;
  });

  if (selectedExam) {
    return (
      <LiveExamDetailsView
        examId={selectedExam.id}
        examTitle={selectedExam.title}
        status={selectedExam.status}
        commonLayoutProps={commonLayoutProps}
        onBack={() => {
          setSelectedExam(null);
          fetchExams();
        }}
      />
    );
  }

  return (
    <AppLayout
      activeTab="live_exam"
      {...commonLayoutProps}
      title={displayCategoryTitle}
      onBack={onBack}
    >
      <div className="w-full max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6 font-['HindSiliguri'] pb-24">
        {/* ── Top Header Bar ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#12544F] dark:bg-[#34D399]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#12544F] dark:text-[#34D399]">
                ক্যাটাগরি
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 dark:text-white leading-tight">
              {displayCategoryTitle} 🎯
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              সকল লাইভ ও আসন্ন মডেল টেস্টের তালিকা
            </p>
          </div>

          {/* Routine Sheet Modal Button */}
          <button
            type="button"
            onClick={() => setIsRoutineOpen(true)}
            className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] hover:border-[#12544F] text-neutral-800 dark:text-neutral-200 hover:text-[#12544F] dark:hover:text-[#34D399] text-xs sm:text-sm font-bold shadow-2xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
          >
            <CalendarDays size={16} className="text-[#12544F] dark:text-[#34D399]" />
            <span>সম্পূর্ণ রুটিন দেখুন</span>
          </button>
        </div>

        {/* ── Filter Pills Bar (All, Ongoing, Upcoming) matching Flutter ── */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] w-fit mb-6 shadow-2xs">
          {[
            { id: "All", label: "সবগুলো" },
            { id: "Ongoing", label: "⚡ চলমান" },
            { id: "Upcoming", label: "🕒 আসন্ন" },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setActiveFilter(f.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
                  isActive
                    ? "bg-[#12544F] text-white shadow-xs"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ── Exams List: Responsive 2-Column Desktop Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] animate-pulse"
              />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[#E6F0EC] dark:bg-[#12544F]/20 text-[#12544F] dark:text-[#34D399] mx-auto flex items-center justify-center mb-3">
              <Calendar size={28} />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-neutral-800 dark:text-neutral-200">
              কোনো পরীক্ষা পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              রুটিন দেখে পরবর্তী পরীক্ষার প্রস্তুতি নিন
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredExams.map((exam) => {
              const isTaken = exam.userAttemptStatus === "submitted";
              const start = new Date(exam.start_time);
              const end = new Date(exam.end_time);

              const isOngoing = now >= start && now <= end;
              const isPast = now > end;

              let statusText = "Upcoming";
              let StatusIcon = Clock;
              let statusBadgeClass =
                "bg-[#FEF2F2] dark:bg-[#740A03]/20 text-[#740A03] dark:text-[#F87171] border-[#740A03]/30";

              if (isTaken) {
                statusText = "অংশগ্রহণকৃত";
                StatusIcon = CheckCircle2;
                statusBadgeClass =
                  "bg-[#EFF6FF] dark:bg-[#1E293B] text-[#2563EB] dark:text-[#60A5FA] border-[#2563EB]/30";
              } else if (isOngoing) {
                statusText = "Ongoing Live";
                StatusIcon = Zap;
                statusBadgeClass =
                  "bg-[#E6F0EC] dark:bg-[#12544F]/25 text-[#12544F] dark:text-[#34D399] border-[#12544F]/30";
              } else if (isPast) {
                statusText = "সমাপ্ত";
                StatusIcon = CheckCircle2;
                statusBadgeClass =
                  "bg-neutral-100 dark:bg-[#27272A] text-neutral-500 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700";
              }

              // Countdown text
              let countdownText = "";
              if (isOngoing) {
                const diffSecs = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
                const mins = Math.floor(diffSecs / 60);
                const secs = diffSecs % 60;
                countdownText = `সময় বাকি: ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
              } else if (!isPast) {
                const diffMs = start.getTime() - now.getTime();
                const totalSecs = Math.floor(diffMs / 1000);
                const hours = Math.floor(totalSecs / 3600);
                const mins = Math.floor((totalSecs % 3600) / 60);
                const days = Math.floor(totalSecs / 86400);

                if (hours < 24) {
                  countdownText = `${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি. বাকি`;
                } else {
                  countdownText = `${BanglaNameHelper.toBanglaNumeral(days)} দিন বাকি`;
                }
              }

              return (
                <div
                  key={exam.id}
                  className="rounded-[22px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    {/* Top Row: Status Pill & Countdown */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-full border text-[11.5px] font-bold flex items-center gap-1",
                          statusBadgeClass
                        )}
                      >
                        <StatusIcon size={12} className={isOngoing ? "animate-pulse" : ""} />
                        <span>{statusText}</span>
                      </span>

                      {countdownText && (
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                          {countdownText}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white line-clamp-1 mb-2">
                      {exam.title}
                    </h3>

                    {/* Meta Info Chips */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#222226] font-semibold">
                        {BanglaNameHelper.toBanglaNumeral(exam.total_questions || 25)} টি প্রশ্ন
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#222226] font-semibold">
                        {BanglaNameHelper.toBanglaNumeral(exam.duration_minutes || 25)} মিনিট
                      </span>
                      <span className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#222226] font-semibold">
                        পূর্ণমান: {BanglaNameHelper.toBanglaNumeral(exam.total_marks || 25)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedExam({
                          id: exam.id,
                          title: exam.title,
                          status: isTaken ? "taken" : "untaken",
                        })
                      }
                      className={cn(
                        "w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-xs",
                        isTaken
                          ? "bg-[#601D49] hover:bg-[#4E173B] text-white"
                          : isOngoing
                          ? "bg-[#12544F] hover:bg-[#0D3E3A] text-white"
                          : isPast
                          ? "bg-neutral-800 hover:bg-neutral-900 text-white dark:bg-neutral-700 dark:hover:bg-neutral-600"
                          : "bg-neutral-100 dark:bg-[#27272A] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200"
                      )}
                    >
                      {isTaken ? (
                        <>
                          <Trophy size={14} />
                          <span>মেধা তালিকা ও ফলাফল</span>
                        </>
                      ) : isOngoing ? (
                        <>
                          <Zap size={14} />
                          <span>পরীক্ষায় অংশ নিন</span>
                        </>
                      ) : isPast ? (
                        <>
                          <FileText size={14} />
                          <span>অনুশীলন ও সমাধান</span>
                        </>
                      ) : (
                        <>
                          <Clock size={14} />
                          <span>পরীক্ষার বিস্তারিত</span>
                        </>
                      )}
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Routine Modal */}
      <LiveExamRoutineModal
        categoryTitle={displayCategoryTitle}
        isOpen={isRoutineOpen}
        onClose={() => setIsRoutineOpen(false)}
        onSelectExam={(examTitle) => {
          setIsRoutineOpen(false);
          const found = exams.find((e) => e.title === examTitle);
          if (found) {
            setSelectedExam({
              id: found.id,
              title: found.title,
              status: found.userAttemptStatus === "submitted" ? "taken" : "untaken",
            });
          }
        }}
      />
    </AppLayout>
  );
};

export default LiveExamCategoryView;
