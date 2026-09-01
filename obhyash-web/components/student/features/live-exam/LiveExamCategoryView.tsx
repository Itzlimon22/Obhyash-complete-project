"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  HelpCircle,
  Zap,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getPublishedLiveExams } from "@/services/live-exam-student-service";
import { LiveExam } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import LiveExamDetailsView from "./LiveExamDetailsView";
import LiveExamRoutineModal from "./LiveExamRoutineModal";
import AppLayout from "@/components/student/ui/layout/AppLayout";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

  const displayCategoryTitle = CATEGORY_NAMES[category.toLowerCase()] || category;

  useEffect(() => {
    fetchExams();
  }, [category, user?.id]);

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

  const filteredExams = exams.filter((exam) => {
    const now = new Date();
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
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 font-['HindSiliguri'] pb-24">
        {/* Top Header / Routine Action */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white leading-tight">
              {displayCategoryTitle} 🎯
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              সকল লাইভ ও আসন্ন মডেল টেস্টের তালিকা
            </p>
          </div>

          {/* Routine Sheet Modal Button */}
          <button
            onClick={() => setIsRoutineOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-black flex items-center gap-1.5 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all shrink-0 cursor-pointer"
          >
            <Calendar size={14} />
            <span>রুটিন দেখুন</span>
          </button>
        </div>

        {/* Filter Chips (All, Ongoing, Upcoming) matching Flutter */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] w-fit mb-5 shadow-sm">
          {[
            { id: "All", label: "সবগুলো" },
            { id: "Ongoing", label: "⚡ চলমান" },
            { id: "Upcoming", label: "🕒 আসন্ন" },
          ].map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-xs font-black transition-all",
                  isActive
                    ? "bg-[#004633] text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Exams List */}
        {isLoading ? (
          <div className="flex flex-col gap-3.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] animate-pulse"
              />
            ))}
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] p-6">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mx-auto flex items-center justify-center mb-3">
              <Calendar size={24} />
            </div>
            <h3 className="text-base font-bold text-neutral-800 dark:text-neutral-200">
              কোনো পরীক্ষা পাওয়া যায়নি
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              রুটিন দেখে পরবর্তী পরীক্ষার প্রস্তুতি নাও
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {filteredExams.map((exam) => {
              const isTaken = exam.userAttemptStatus === "submitted";
              const now = new Date();
              const start = new Date(exam.start_time);
              const end = new Date(exam.end_time);

              const isOngoing = now >= start && now <= end;
              const isPast = now > end;

              let statusText = "Upcoming";
              let statusIcon = <Clock size={12} />;
              let statusBadgeClass =
                "bg-red-50 dark:bg-[#260C0E] text-red-600 dark:text-[#F87171] border-red-200 dark:border-red-900/50";

              if (isTaken) {
                statusText = "অংশগ্রহণকৃত";
                statusIcon = <CheckCircle2 size={12} />;
                statusBadgeClass =
                  "bg-blue-50 dark:bg-[#0E1A2E] text-blue-600 dark:text-[#60A5FA] border-blue-200 dark:border-blue-900/50";
              } else if (isOngoing) {
                statusText = "Ongoing";
                statusIcon = <Zap size={12} className="animate-pulse" />;
                statusBadgeClass =
                  "bg-emerald-50 dark:bg-[#0C2419] text-emerald-600 dark:text-[#4ADE80] border-emerald-200 dark:border-emerald-900/50";
              }

              // Format time remaining
              let timeRemainingText = "শীঘ্রই শুরু হবে";
              if (isOngoing) {
                const diffMs = end.getTime() - now.getTime();
                const diffMins = Math.floor(diffMs / (1000 * 60));
                const diffHours = Math.floor(diffMins / 60);
                if (diffHours > 0) {
                  timeRemainingText = `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(diffHours)} ঘণ্টা`;
                } else if (diffMins > 0) {
                  timeRemainingText = `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(diffMins)} মিনিট`;
                } else {
                  timeRemainingText = "শীঘ্রই শেষ হবে";
                }
              } else if (isPast) {
                timeRemainingText = "পরীক্ষা সম্পন্ন";
              } else {
                const diffMs = start.getTime() - now.getTime();
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
                if (diffDays > 0) {
                  timeRemainingText = `বাকি - ${BanglaNameHelper.toBanglaNumeral(diffDays)} দিন`;
                } else if (diffHours > 0) {
                  timeRemainingText = `বাকি - ${BanglaNameHelper.toBanglaNumeral(diffHours)} ঘণ্টা`;
                } else {
                  timeRemainingText = "আজ শুরু হবে";
                }
              }

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
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200/90 dark:border-[#27272A] hover:border-neutral-300 dark:hover:border-neutral-700 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full border text-[11px] font-black flex items-center gap-1",
                        statusBadgeClass
                      )}
                    >
                      {statusIcon}
                      <span>{statusText}</span>
                    </span>

                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                      {timeRemainingText}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-black text-neutral-900 dark:text-white leading-tight mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {exam.title}
                  </h3>

                  {/* Details metadata */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-3">
                    <span>
                      {BanglaNameHelper.toBanglaNumeral(exam.total_questions || 25)}টি প্রশ্ন
                    </span>
                    <span>•</span>
                    <span>
                      {BanglaNameHelper.toBanglaNumeral(exam.duration_minutes || 25)} মিনিট
                    </span>
                    <span>•</span>
                    <span>
                      পূর্ণমান: {BanglaNameHelper.toBanglaNumeral(exam.total_marks || 25)}
                    </span>
                    {exam.negative_marking > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-rose-500">
                          নেগেটিভ: -{BanglaNameHelper.toBanglaNumeral(exam.negative_marking)}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Bottom Action Strip */}
                  <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                      {isTaken ? "ফলাফল ও সল্যুশন দেখুন" : isOngoing ? "এখনই অংশগ্রহণ করো" : "পরীক্ষার নিয়মাবলী দেখুন"}
                    </span>

                    <div className="flex items-center gap-1 text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                      <span>{isTaken ? "ফলাফল" : isOngoing ? "শুরু করুন" : "বিস্তারিত"}</span>
                      <ChevronRight size={16} />
                    </div>
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
        />
      </div>
    </AppLayout>
  );
};

export default LiveExamCategoryView;
