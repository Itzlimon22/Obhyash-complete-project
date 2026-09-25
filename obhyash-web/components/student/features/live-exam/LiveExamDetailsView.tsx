"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  getStudentLiveExamDetails,
  getPublicLeaderboard,
  getStudentLiveExamPracticeHistory,
} from "@/services/live-exam-student-service";
import { LiveExam, LiveExamAttempt } from "@/lib/types";
import { toast } from "sonner";
import {
  Trophy,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  History,
  EyeOff,
} from "lucide-react";
import { LiveExamSession } from "./LiveExamSession";
import LiveExamSolutionView from "./LiveExamSolutionView";
import LiveExamLeaderboardView from "./LiveExamLeaderboardView";
import AppLayout from "@/components/student/ui/layout/AppLayout";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";

export interface LiveExamDetailsViewProps {
  examId: string;
  examTitle: string;
  status: "untaken" | "taken";
  commonLayoutProps: any;
  onBack: () => void;
}

export const LiveExamDetailsView: React.FC<LiveExamDetailsViewProps> = ({
  examId,
  examTitle,
  status,
  commonLayoutProps,
  onBack,
}) => {
  const { user } = useAuth();
  const [exam, setExam] = useState<LiveExam | null>(null);
  const [attempt, setAttempt] = useState<LiveExamAttempt | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [isViewingSolutions, setIsViewingSolutions] = useState(false);
  const [isViewingLeaderboard, setIsViewingLeaderboard] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchDetails();
    }
  }, [examId, user?.id]);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      const [detailsData, historyData] = await Promise.all([
        getStudentLiveExamDetails(examId, user!.id),
        getStudentLiveExamPracticeHistory(examId, user!.id),
      ]);
      setExam(detailsData.exam);
      setAttempt(detailsData.attempt);
      setPracticeHistory(historyData);

      const now = new Date();
      const end = new Date(detailsData.exam.end_time);
      const isPast = now > end;

      if (
        detailsData.attempt?.status === "submitted" &&
        (isPast || detailsData.exam.id.startsWith("mock-"))
      ) {
        const lb = await getPublicLeaderboard(examId, 5);
        setLeaderboard(lb);
      }
    } catch (error) {
      toast.error("পরীক্ষার বিবরণ লোড করতে সমস্যা হয়েছে");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center py-20 text-neutral-500 font-medium animate-pulse">
        পরীক্ষার বিবরণ লোড হচ্ছে...
      </div>
    );
  }

  if (!exam) return null;

  const now = new Date();
  const start = new Date(exam.start_time);
  const end = new Date(exam.end_time);

  const isOngoing = now >= start && now <= end;
  const isUpcoming = now < start;
  const isPast = now > end;
  const isTaken = attempt?.status === "submitted";

  let statusBadgeText = "Upcoming";
  let statusBadgeColor = "#3B82F6";
  let statusBadgeBg = "bg-[#3B82F6]/10 dark:bg-[#3B82F6]/15 border-[#3B82F6]/25 dark:border-[#3B82F6]/30 text-[#3B82F6]";

  if (isTaken) {
    statusBadgeText = "অংশগ্রহণ সম্পন্ন";
    statusBadgeColor = "#0B6B42";
    statusBadgeBg = "bg-[#0B6B42]/10 dark:bg-[#0B6B42]/15 border-[#0B6B42]/25 dark:border-[#0B6B42]/30 text-[#0B6B42] dark:text-[#34D399]";
  } else if (isOngoing) {
    statusBadgeText = "Ongoing Live";
    statusBadgeColor = "#0B6B42";
    statusBadgeBg = "bg-[#0B6B42]/10 dark:bg-[#0B6B42]/15 border-[#0B6B42]/25 dark:border-[#0B6B42]/30 text-[#0B6B42] dark:text-[#34D399]";
  } else if (isPast) {
    statusBadgeText = "পরীক্ষা শেষ";
    statusBadgeColor = "#6B7280";
    statusBadgeBg = "bg-[#6B7280]/10 dark:bg-[#6B7280]/15 border-[#6B7280]/25 dark:border-[#6B7280]/30 text-[#6B7280] dark:text-[#9CA3AF]";
  } else {
    statusBadgeText = "আসন্ন পরীক্ষা";
    statusBadgeColor = "#3B82F6";
    statusBadgeBg = "bg-[#3B82F6]/10 dark:bg-[#3B82F6]/15 border-[#3B82F6]/25 dark:border-[#3B82F6]/30 text-[#3B82F6]";
  }

  const syllabusList = exam.description?.trim()
    ? exam.description
        .split(/[\n\r,;•|]+/)
        .map((s: string) => s.trim())
        .filter(Boolean)
    : [];

  // Leaderboard View Screen
  if (isViewingLeaderboard) {
    return (
      <AppLayout
        activeTab="live_exam"
        {...commonLayoutProps}
        title={`${exam.title} - মেধা তালিকা`}
        onBack={() => setIsViewingLeaderboard(false)}
      >
        <LiveExamLeaderboardView
          exam={exam}
          onBack={() => setIsViewingLeaderboard(false)}
          onViewSolutions={() => {
            setIsViewingLeaderboard(false);
            setIsViewingSolutions(true);
          }}
        />
      </AppLayout>
    );
  }

  // Solution View Screen
  if (isViewingSolutions) {
    return (
      <LiveExamSolutionView
        examId={exam.id}
        examTitle={exam.title}
        categoryTitle={exam.category}
        negativeMarking={exam.negative_marking || 0.25}
        commonLayoutProps={commonLayoutProps}
        onBack={() => setIsViewingSolutions(false)}
      />
    );
  }

  // Exam Taking Screen
  if (isTakingExam) {
    return (
      <LiveExamSession
        exam={exam}
        onExit={() => {
          setIsTakingExam(false);
          fetchDetails();
        }}
        onViewLeaderboard={() => {
          setIsTakingExam(false);
          setIsViewingLeaderboard(true);
          fetchDetails();
        }}
        onViewSolutions={() => {
          setIsTakingExam(false);
          setIsViewingSolutions(true);
          fetchDetails();
        }}
        isDarkMode={commonLayoutProps.isDarkMode}
        toggleTheme={commonLayoutProps.toggleTheme}
        commonLayoutProps={commonLayoutProps}
      />
    );
  }

  const padZero = (n: number) => String(n).padStart(2, "0");

  return (
    <AppLayout
      activeTab="live_exam"
      {...commonLayoutProps}
      title="পরীক্ষার বিবরণ"
      onBack={onBack}
    >
      <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6 font-['HindSiliguri'] pb-24">
        {/* Unified Big Exam Information Card matching Flutter live_exam_details_view */}
        <div className="rounded-[22px] bg-white dark:bg-[#141417] border border-[#E2E8F0] dark:border-[#27272A] p-5 sm:p-6 shadow-xs">
          {/* 1. Category Tag & Status Badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="px-2.5 py-1 rounded-[8px] bg-[#F1F5F9] dark:bg-[#27272A] border border-[#E2E8F0] dark:border-[#3F3F46] text-[#475569] dark:text-[#CBD5E1] text-[11px] font-bold tracking-wider uppercase">
              {exam.category}
            </span>

            <span
              className={cn(
                "px-2.5 py-1 rounded-[10px] border text-[12px] font-bold",
                statusBadgeBg
              )}
            >
              {statusBadgeText}
            </span>
          </div>

          {/* Exam Title */}
          <h1 className="mt-4 text-[20px] sm:text-[22px] font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-[-0.3px] leading-tight">
            {exam.title}
          </h1>

          <div className="my-4 h-px bg-[#F1F5F9] dark:bg-[#27272A]" />

          {/* 2. Schedule Section */}
          <div className="flex items-center gap-2 text-[14.5px] font-bold text-[#334155] dark:text-[#E2E8F0]">
            <Calendar size={16} className="text-[#64748B] dark:text-[#94A3B8]" />
            <span>পরীক্ষার সময়সূচী</span>
          </div>

          <div className="mt-3.5 flex items-center justify-between">
            {/* Start info */}
            <div>
              <span className="text-[11.5px] font-medium text-[#64748B] dark:text-[#A1A1AA]">
                শুরু
              </span>
              <p className="text-[14px] font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
                {BanglaNameHelper.toBanglaNumeral(start.getDate())}/
                {BanglaNameHelper.toBanglaNumeral(start.getMonth() + 1)}/
                {BanglaNameHelper.toBanglaNumeral(start.getFullYear())}
              </p>
              <p className="text-[12.5px] font-semibold text-[#475569] dark:text-[#CBD5E1]">
                {BanglaNameHelper.toBanglaNumeral(padZero(start.getHours()))}:
                {BanglaNameHelper.toBanglaNumeral(padZero(start.getMinutes()))}
              </p>
            </div>

            <ArrowRight size={18} className="text-[#CBD5E1] dark:text-[#52525B]" />

            {/* End info */}
            <div className="text-right">
              <span className="text-[11.5px] font-medium text-[#64748B] dark:text-[#A1A1AA]">
                সমাপ্তি
              </span>
              <p className="text-[14px] font-extrabold text-[#0F172A] dark:text-[#F8FAFC] mt-0.5">
                {BanglaNameHelper.toBanglaNumeral(end.getDate())}/
                {BanglaNameHelper.toBanglaNumeral(end.getMonth() + 1)}/
                {BanglaNameHelper.toBanglaNumeral(end.getFullYear())}
              </p>
              <p className="text-[12.5px] font-semibold text-[#EF4444]">
                {BanglaNameHelper.toBanglaNumeral(padZero(end.getHours()))}:
                {BanglaNameHelper.toBanglaNumeral(padZero(end.getMinutes()))}
              </p>
            </div>
          </div>

          {/* 3. Meta 3-Column Stats */}
          <div className="mt-5 rounded-[16px] bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] py-3.5 px-3 flex items-center justify-around text-center">
            <div>
              <p className="text-[17px] font-black text-[#0F172A] dark:text-[#F8FAFC]">
                {BanglaNameHelper.toBanglaNumeral(exam.duration_minutes || 25)} মি.
              </p>
              <p className="text-[11.5px] font-medium text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                সময়
              </p>
            </div>

            <div className="w-px h-7 bg-[#E2E8F0] dark:bg-[#2E2E32]" />

            <div>
              <p className="text-[17px] font-black text-[#0F172A] dark:text-[#F8FAFC]">
                {BanglaNameHelper.toBanglaNumeral(exam.total_questions || 25)} টি
              </p>
              <p className="text-[11.5px] font-medium text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                মোট প্রশ্ন
              </p>
            </div>

            <div className="w-px h-7 bg-[#E2E8F0] dark:bg-[#2E2E32]" />

            <div>
              <p className="text-[17px] font-black text-[#EF4444]">
                -{BanglaNameHelper.toBanglaNumeral(exam.negative_marking || 0.25)}
              </p>
              <p className="text-[11.5px] font-medium text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                নেগেটিভ মার্ক
              </p>
            </div>
          </div>

          <div className="my-4 h-px bg-[#F1F5F9] dark:bg-[#27272A]" />

          {/* 4. Syllabus Section */}
          <div className="flex items-center gap-2 text-[14.5px] font-bold text-[#334155] dark:text-[#E2E8F0]">
            <BookOpen size={16} className="text-[#64748B] dark:text-[#94A3B8]" />
            <span>সিলেবাস ও অধ্যায়সমূহ</span>
          </div>

          <div className="mt-3 rounded-[14px] bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] p-3.5">
            {syllabusList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {syllabusList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 min-w-0">
                    <span className="text-[13px] font-bold text-[#64748B] dark:text-[#94A3B8] shrink-0">
                      {BanglaNameHelper.toBanglaNumeral(padZero(idx + 1))}.
                    </span>
                    <span className="text-[13px] font-medium text-[#1E293B] dark:text-[#E2E8F0] line-clamp-2 leading-[1.35]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13.5px] leading-relaxed text-[#475569] dark:text-[#CBD5E1]">
                {exam.description?.trim() ||
                  "এই পরীক্ষার সিলেবাসে বোর্ড পাঠ্যবইয়ের সংশ্লিষ্ট অধ্যায়সমূহ অন্তর্ভুক্ত রয়েছে।"}
              </p>
            )}
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="mt-5 space-y-3">
          {!isTaken ? (
            isOngoing ? (
              <button
                type="button"
                onClick={() => setIsTakingExam(true)}
                className="w-full h-[52px] rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-99"
              >
                <span>পরীক্ষা শুরু করুন</span>
              </button>
            ) : isUpcoming ? (
              <button
                type="button"
                disabled
                className="w-full h-[52px] rounded-2xl bg-[#E2E8F0] dark:bg-[#27272A] text-[#94A3B8] dark:text-[#71717A] font-bold text-[16px] cursor-not-allowed flex items-center justify-center"
              >
                <span>পরীক্ষা এখনও শুরু হয়নি</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsTakingExam(true)}
                className="w-full h-[52px] rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-99"
              >
                <RotateCcw size={18} />
                <span>অনুশীলন পরীক্ষা শুরু করুন</span>
              </button>
            )
          ) : (
            isPast || exam.id.startsWith("mock-") ? (
              <div className="space-y-3">
                {/* Solutions Button */}
                <button
                  type="button"
                  onClick={() => setIsViewingSolutions(true)}
                  className="w-full h-[52px] rounded-2xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-[15.5px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-99"
                >
                  <BookOpen size={18} />
                  <span>সমাধান ও ব্যাখ্যা দেখুন</span>
                </button>

                {/* Retake as Practice Button */}
                <button
                  type="button"
                  onClick={() => setIsTakingExam(true)}
                  className="w-full h-[50px] rounded-2xl bg-white dark:bg-[#141417] border border-[#CBD5E1] dark:border-[#27272A] text-[#0F172A] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1C20] font-bold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99"
                >
                  <RotateCcw size={18} />
                  <span>অনুশীলন পরীক্ষা দিন (Practice)</span>
                </button>
              </div>
            ) : null
          )}
        </div>

        {/* Score Overview Card (When taken) */}
        {isTaken && attempt && (
          <div className="mt-5 rounded-[22px] bg-white dark:bg-[#141417] border border-[#E2E8F0] dark:border-[#27272A] p-5 shadow-xs">
            <h3 className="text-[15.5px] font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
              আপনার ফলাফলের সারসংক্ষেপ (অফিসিয়াল)
            </h3>

            <div className="mt-4 flex items-center justify-around text-center">
              <div>
                <p className="text-[19px] font-black text-[#10B981]">
                  {BanglaNameHelper.toBanglaNumeral(attempt.correct_count || 0)}
                </p>
                <p className="text-[12px] font-medium text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                  সঠিক
                </p>
              </div>

              <div className="w-px h-7 bg-[#E2E8F0] dark:bg-[#2E2E32]" />

              <div>
                <p className="text-[19px] font-black text-[#EF4444]">
                  {BanglaNameHelper.toBanglaNumeral(attempt.wrong_count || 0)}
                </p>
                <p className="text-[12px] font-medium text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                  ভুল
                </p>
              </div>

              <div className="w-px h-7 bg-[#E2E8F0] dark:bg-[#2E2E32]" />

              <div>
                <p className="text-[19px] font-black text-[#0F172A] dark:text-[#F8FAFC]">
                  {BanglaNameHelper.toBanglaNumeral(attempt.score ?? 0)}
                </p>
                <p className="text-[12px] font-medium text-[#64748B] dark:text-[#A1A1AA] mt-0.5">
                  মোট স্কোর
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Practice Attempts History Section */}
        {practiceHistory.length > 0 && (
          <div className="mt-5 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-[#F4F4F5] dark:border-[#27272A] p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <div className="flex items-center gap-2">
                <History size={18} className="text-[#3B82F6]" />
                <h3 className="text-[15px] font-bold text-[#0F172A] dark:text-white">
                  অনুশীলন পরীক্ষার ইতিহাস
                </h3>
              </div>
              <span className="text-[12px] text-neutral-500 dark:text-neutral-400 font-medium">
                {BanglaNameHelper.toBanglaNumeral(practiceHistory.length)} বার সম্পন্ন
              </span>
            </div>

            <div className="space-y-2">
              {practiceHistory.map((ph, idx) => {
                const attemptNum = practiceHistory.length - idx;
                const d = new Date(ph.submit_time || ph.created_at);
                const mins = Math.floor((ph.time_taken_seconds || 0) / 60);

                return (
                  <div
                    key={ph.id || idx}
                    className="p-3 rounded-[14px] bg-[#F9FAFB] dark:bg-[#141416] border border-[#E5E7EB] dark:border-[#27272A] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-1 rounded-[8px] bg-[#3B82F6]/12 text-[#3B82F6] text-[11px] font-bold shrink-0">
                        অনুশীলন #{BanglaNameHelper.toBanglaNumeral(attemptNum)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#1E293B] dark:text-white/70">
                          {BanglaNameHelper.toBanglaNumeral(d.getDate())}/
                          {BanglaNameHelper.toBanglaNumeral(d.getMonth() + 1)}/
                          {BanglaNameHelper.toBanglaNumeral(d.getFullYear())}{" "}
                          {BanglaNameHelper.toBanglaNumeral(padZero(d.getHours()))}:
                          {BanglaNameHelper.toBanglaNumeral(padZero(d.getMinutes()))}
                        </p>
                        <p className="text-[11px] text-[#64748B] dark:text-white/40 mt-0.5">
                          সঠিক: {BanglaNameHelper.toBanglaNumeral(ph.correct_count || 0)} • ভুল:{" "}
                          {BanglaNameHelper.toBanglaNumeral(ph.wrong_count || 0)}
                          {mins > 0 &&
                            ` • সময়: ${BanglaNameHelper.toBanglaNumeral(mins)} মি.`}
                        </p>
                      </div>
                    </div>

                    <span className="text-[16px] font-bold text-[#0B6B42] dark:text-[#34D399] shrink-0">
                      {BanglaNameHelper.toBanglaNumeral(ph.score ?? 0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Anti-Leakage / Pending Results Banner (When ongoing) */}
        {isTaken && isOngoing && !exam.id.startsWith("mock-") && (
          <div className="mt-5 rounded-[20px] bg-[#F59E0B]/12 border border-[#F59E0B]/30 p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[14px] font-bold text-[#D97706]">
                উত্তরপত্র সফলভাবে জমা নেওয়া হয়েছে!
              </h4>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#78350F] dark:text-white/70">
                পরীক্ষার গোপনীয়তা ও সমতা বজায় রাখতে, লাইভ পরীক্ষার সময়সীমা (
                {BanglaNameHelper.toBanglaNumeral(padZero(end.getHours()))}:
                {BanglaNameHelper.toBanglaNumeral(padZero(end.getMinutes()))}
                ) শেষ হওয়ার পর সম্পূর্ণ সমাধান ও মেধা তালিকা উন্মুক্ত করা হবে।
              </p>
            </div>
          </div>
        )}

        {/* Admin Hidden Leaderboard Banner */}
        {isTaken && (isPast || exam.id.startsWith("mock-")) && !exam.is_leaderboard_published && (
          <div className="mt-5 rounded-[20px] bg-[#F4F4F5] dark:bg-[#27272A] border border-[#E5E7EB] dark:border-[#3F3F46] p-4 flex items-start gap-3">
            <EyeOff size={20} className="text-[#4B5563] dark:text-white/70 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[14px] font-bold text-[#1F2937] dark:text-white">
                মেধা তালিকা প্রকাশ স্থগিত
              </h4>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#4B5563] dark:text-white/70">
                কর্তৃপক্ষ কর্তৃক এই পরীক্ষার মেধা তালিকা সাময়িকভাবে অপ্রকাশিত রাখা হয়েছে।
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard Section (Top 5 Rankers) */}
        {isTaken && (isPast || exam.id.startsWith("mock-")) && exam.is_leaderboard_published && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-[#F59E0B]" />
                <h3 className="text-[16px] font-bold text-[#0F172A] dark:text-white">
                  শীর্ষ মেধা তালিকা (Top Rankers)
                </h3>
              </div>
              <span className="text-[12px] text-neutral-500 dark:text-white/50 font-medium">
                শীর্ষ ৫ জন
              </span>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-5 rounded-[20px] bg-white dark:bg-[#1C1C1E] border border-[#E2E8F0] dark:border-[#27272A] text-center text-sm text-neutral-500">
                মেধা তালিকার তথ্য এখনও নেই
              </div>
            ) : (
              <div className="space-y-2.5">
                {leaderboard.slice(0, 5).map((lb, idx) => {
                  const totalAttempted = (lb.correct_count || 0) + (lb.wrong_count || 0);
                  const accuracy =
                    totalAttempted > 0
                      ? Math.round(((lb.correct_count || 0) / totalAttempted) * 100)
                      : lb.score > 0
                      ? 100
                      : 0;

                  return (
                    <div
                      key={lb.id || idx}
                      className={cn(
                        "p-3 sm:px-3.5 sm:py-3 rounded-[18px] bg-white dark:bg-[#141417] border flex items-center justify-between gap-3 shadow-2xs",
                        idx === 0
                          ? "border-[#F59E0B]/50"
                          : "border-[#E2E8F0] dark:border-[#27272A]"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank Badge */}
                        <div
                          className={cn(
                            "w-[30px] h-[30px] rounded-[9px] flex items-center justify-center font-extrabold text-[12px] shrink-0",
                            idx === 0
                              ? "bg-[#F59E0B] text-white"
                              : idx === 1
                              ? "bg-[#94A3B8] text-white"
                              : idx === 2
                              ? "bg-[#B45309] text-white"
                              : "bg-[#F1F5F9] dark:bg-[#27272A] text-[#475569] dark:text-[#CBD5E1]"
                          )}
                        >
                          #{BanglaNameHelper.toBanglaNumeral(idx + 1)}
                        </div>

                        {/* Name & Institute */}
                        <div className="min-w-0">
                          <p className="text-[14px] font-extrabold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                            {lb.users?.name || "পরীক্ষার্থী"}
                          </p>
                          <p className="text-[11.5px] text-[#64748B] dark:text-[#A1A1AA] truncate mt-0.5">
                            {lb.users?.institute || "প্রতিষ্ঠান নেই"}
                          </p>
                        </div>
                      </div>

                      {/* Accuracy & Score */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span
                          className={cn(
                            "text-[11px] font-bold hidden sm:inline-block",
                            accuracy >= 80
                              ? "text-[#10B981]"
                              : accuracy >= 50
                              ? "text-[#F59E0B]"
                              : "text-[#EF4444]"
                          )}
                        >
                          {BanglaNameHelper.toBanglaNumeral(accuracy)}% নির্ভুলতা
                        </span>

                        <div className="px-2.5 py-1 rounded-[8px] bg-[#F1F5F9] dark:bg-[#1F2937] border border-[#E2E8F0] dark:border-[#374151]">
                          <span className="text-[12px] font-black text-[#0F172A] dark:text-[#F8FAFC]">
                            {BanglaNameHelper.toBanglaNumeral(lb.score)} মার্কস
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View Full Leaderboard Outlined Button */}
            <button
              type="button"
              onClick={() => setIsViewingLeaderboard(true)}
              className="w-full mt-3 h-[48px] rounded-[14px] bg-white dark:bg-[#141417] border border-[#CBD5E1] dark:border-[#27272A] text-[#0F172A] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1C20] font-bold text-[14px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-99"
            >
              <Trophy size={18} />
              <span>সম্পূর্ণ মেধা তালিকা দেখুন</span>
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default LiveExamDetailsView;
