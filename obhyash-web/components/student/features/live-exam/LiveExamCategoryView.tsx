"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Zap,
  CheckCircle2,
  FileText,
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

  const formatDurationBn = (minutes: number) => {
    if (!minutes || minutes <= 0) return "২০ মিনিট";
    return `${BanglaNameHelper.toBanglaNumeral(minutes)} মিনিট`;
  };

  const formatTimeRemaining = (exam: LiveExam) => {
    const start = new Date(exam.start_time);
    const end = new Date(exam.end_time);
    const isOngoing = now >= start && now <= end;
    const isPast = now > end;

    if (isOngoing) {
      const diffMs = end.getTime() - now.getTime();
      if (diffMs <= 0) return "পরীক্ষা সম্পন্ন";

      const totalSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      if (days > 0) {
        return hours > 0
          ? `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(days)} দিন ${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা`
          : `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(days)} দিন`;
      } else if (hours > 0) {
        if (hours < 3) {
          return `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
        } else {
          return `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি.`;
        }
      } else {
        return `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
      }
    } else if (isPast) {
      return "পরীক্ষা সম্পন্ন";
    } else {
      const diffMs = start.getTime() - now.getTime();
      if (diffMs <= 0) return "এখনই শুরু হচ্ছে";

      const totalSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      if (hours < 24) {
        if (hours > 0) {
          return `${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
        } else {
          return `${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
        }
      } else {
        const remHours = hours % 24;
        return remHours > 0
          ? `${BanglaNameHelper.toBanglaNumeral(days)} দিন ${BanglaNameHelper.toBanglaNumeral(remHours)} ঘণ্টা বাকি`
          : `${BanglaNameHelper.toBanglaNumeral(days)} দিন বাকি`;
      }
    }
  };

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
      <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6 font-['HindSiliguri'] pb-24">
        {/* Filters & Routine Action Bar matching Flutter live_exam_category_view */}
        <div className="flex items-center justify-between gap-3 mb-4">
          {/* Filter Chips Capsule (All, Ongoing, Upcoming) */}
          <div className="p-0.5 rounded-full bg-white dark:bg-[#181A24] border border-[#E2E8F0] dark:border-[#272A38] flex items-center shadow-2xs">
            {(["All", "Ongoing", "Upcoming"] as const).map((f) => {
              const isActive = activeFilter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-[13px] font-bold transition-all cursor-pointer",
                    isActive
                      ? "bg-[#004633] text-white shadow-xs"
                      : "text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white"
                  )}
                >
                  {f}
                </button>
              );
            })}
          </div>

          {/* Routine Action Button */}
          <button
            type="button"
            onClick={() => setIsRoutineOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/25 border border-[#BFDBFE] dark:border-[#1E3A8A]/50 text-[#2563EB] dark:text-[#60A5FA] text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:opacity-90 active:scale-95"
          >
            <Calendar size={13} />
            <span>রুটিন</span>
          </button>
        </div>

        {/* Exams List matching Flutter _LiveExamCard */}
        {isLoading ? (
          <div className="space-y-3.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] animate-pulse"
              />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="py-16 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            এই ক্যাটাগরিতে বর্তমানে কোনো লাইভ পরীক্ষা নেই।
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredExams.map((exam) => {
              const start = new Date(exam.start_time);
              const end = new Date(exam.end_time);
              const isOngoing = now >= start && now <= end;
              const isPast = now > end;
              const isTaken = exam.userAttemptStatus === "submitted";

              let statusText = "Upcoming";
              let StatusIcon = Clock;
              let statusColorClass = "text-[#B91C1C] dark:text-[#F87171]";
              let bottomStripBg = "bg-[#FEF2F2] dark:bg-[#260C0E]";

              if (isTaken) {
                statusText = "অংশগ্রহণকৃত";
                StatusIcon = CheckCircle2;
                statusColorClass = "text-[#2563EB] dark:text-[#60A5FA]";
                bottomStripBg = "bg-[#EFF6FF] dark:bg-[#0E1A2E]";
              } else if (isOngoing) {
                statusText = "Ongoing";
                StatusIcon = Zap;
                statusColorClass = "text-[#15803D] dark:text-[#4ADE80]";
                bottomStripBg = "bg-[#F0FDF4] dark:bg-[#0C2419]";
              } else if (isPast) {
                statusText = "সমাপ্ত";
                StatusIcon = CheckCircle2;
                statusColorClass = "text-[#64748B] dark:text-[#94A3B8]";
                bottomStripBg = "bg-[#F1F5F9] dark:bg-[#1E293B]/60";
              }

              const totalQ = exam.total_questions ?? 0;
              const totalM = exam.total_marks ?? 0;
              const count = totalQ > 0 ? totalQ : totalM > 0 ? Math.round(totalM) : 25;
              const durationText = formatDurationBn(exam.duration_minutes);
              const questionsText = `${BanglaNameHelper.toBanglaNumeral(count)} টি প্রশ্ন`;
              const timeRemainingText = formatTimeRemaining(exam);

              return (
                <div
                  key={exam.id}
                  onClick={() =>
                    setSelectedExam({
                      id: exam.id,
                      title: exam.title,
                      status: isTaken ? "taken" : "untaken",
                    })
                  }
                  className="rounded-[16px] bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] p-4 cursor-pointer shadow-xs hover:shadow-md transition-all active:scale-[0.99] select-none"
                >
                  {/* Row 1: Exam Title */}
                  <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white line-clamp-2 leading-snug">
                    {exam.title}
                  </h3>

                  {/* Row 2: Metadata (Duration on left, Questions on right) */}
                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#334155] dark:text-[#E2E8F0]">
                      <Clock size={14} className="text-[#EF4444]" />
                      <span>{durationText}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#334155] dark:text-[#E2E8F0]">
                      <FileText size={14} className="text-[#10B981]" />
                      <span>{questionsText}</span>
                    </div>
                  </div>

                  {/* Row 3: Full Bottom Status Strip */}
                  <div
                    className={cn(
                      "mt-3.5 px-3.5 py-2.5 rounded-[12px] flex items-center justify-between transition-colors",
                      bottomStripBg
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1.5 text-[14px] font-semibold",
                        statusColorClass
                      )}
                    >
                      <StatusIcon size={16} />
                      <span>{statusText}</span>
                    </div>

                    <span className="text-[14px] font-semibold text-[#0F172A] dark:text-white">
                      {timeRemainingText}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

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
      </div>
    </AppLayout>
  );
};

export default LiveExamCategoryView;
