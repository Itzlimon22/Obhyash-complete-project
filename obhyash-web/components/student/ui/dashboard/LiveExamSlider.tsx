"use client";

import React, { useState, useEffect } from "react";
import { Zap, Clock, CheckCircle2, CheckCircle, ChevronRight } from "lucide-react";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { supabase } from "@/services/core";
import { cn } from "@/lib/utils";

interface LiveExamItem {
  id: string;
  title: string;
  category: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  userAttemptStatus?: "submitted" | "started" | null;
}

interface LiveExamSliderProps {
  onExamClick?: (examId: string, category: string) => void;
}

export const LiveExamSlider: React.FC<LiveExamSliderProps> = ({ onExamClick }) => {
  const [exams, setExams] = useState<LiveExamItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const fetchLiveExams = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        // Fetch ongoing and upcoming live exams (within past 24 hours to next 7 days)
        const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const future7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from("live_exams")
          .select("*")
          .gte("end_time", past24h)
          .lte("start_time", future7d)
          .order("start_time", { ascending: true })
          .limit(5);

        if (error) {
          console.warn("[LiveExamSlider] fetch error:", error);
          setIsLoading(false);
          return;
        }

        if (data && data.length > 0) {
          let userAttemptsMap: Record<string, string> = {};
          if (userData?.user) {
            const examIds = data.map((e: any) => e.id);
            const { data: attempts } = await supabase
              .from("live_exam_attempts")
              .select("live_exam_id, status")
              .eq("user_id", userData.user.id)
              .in("live_exam_id", examIds);

            if (attempts) {
              attempts.forEach((a: any) => {
                userAttemptsMap[a.live_exam_id] = a.status;
              });
            }
          }

          const parsedExams: LiveExamItem[] = data.map((e: any) => ({
            id: e.id,
            title: e.title || "লাইভ মডেল টেস্ট",
            category: e.category || "hsc",
            startTime: e.start_time,
            endTime: e.end_time,
            durationMinutes: e.duration_minutes || 20,
            totalQuestions: e.total_questions || 25,
            totalMarks: e.total_marks || 25,
            userAttemptStatus: (userAttemptsMap[e.id] as any) || null,
          }));

          setExams(parsedExams);
        }
      } catch (e) {
        console.warn("[LiveExamSlider] Exception:", e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveExams();
  }, []);

  // 1-second interval to update live countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto rotate carousel if multiple exams
  useEffect(() => {
    if (exams.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % exams.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [exams.length]);

  if (isLoading || exams.length === 0) return null;

  const currentExam = exams[currentIndex] || exams[0];
  const startTime = new Date(currentExam.startTime);
  const endTime = new Date(currentExam.endTime);

  const isOngoing = now >= startTime && now <= endTime;
  const isPast = now > endTime;
  const isTaken = currentExam.userAttemptStatus === "submitted";

  let statusText = "Upcoming";
  let StatusIcon = Clock;
  let statusColor = "text-[#740A03] dark:text-[#F87171]";
  let bottomStripBg = "bg-[#FEF2F2] dark:bg-[#740A03]/20";

  if (isTaken) {
    statusText = "অংশগ্রহণকৃত";
    StatusIcon = CheckCircle2;
    statusColor = "text-[#2563EB] dark:text-[#60A5FA]";
    bottomStripBg = "bg-[#EFF6FF] dark:bg-[#27272A]";
  } else if (isOngoing) {
    statusText = "Ongoing";
    StatusIcon = Zap;
    statusColor = "text-[#12544F] dark:text-[#34D399]";
    bottomStripBg = "bg-[#E6F0EC] dark:bg-[#12544F]/25";
  } else if (isPast) {
    statusText = "সমাপ্ত";
    StatusIcon = CheckCircle;
    statusColor = "text-[#64748B] dark:text-[#94A3B8]";
    bottomStripBg = "bg-[#F1F5F9] dark:bg-[#27272A]";
  }

  // Format time remaining (exact match with Flutter _formatTimeRemaining)
  let timeRemainingText = "পরীক্ষা সম্পন্ন";
  if (isOngoing) {
    const diffMs = endTime.getTime() - now.getTime();
    if (diffMs > 0) {
      const totalSecs = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      if (days > 0) {
        timeRemainingText = hours > 0
          ? `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(days)} দিন ${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা`
          : `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(days)} দিন`;
      } else if (hours > 0) {
        timeRemainingText = hours < 3
          ? `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`
          : `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি.`;
      } else {
        timeRemainingText = `সময় বাকি - ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
      }
    }
  } else if (!isPast) {
    const diffMs = startTime.getTime() - now.getTime();
    if (diffMs <= 0) {
      timeRemainingText = "এখনই শুরু হচ্ছে";
    } else {
      const totalSecs = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      const days = Math.floor(totalSecs / 86400);

      if (hours < 24) {
        timeRemainingText = hours > 0
          ? `${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`
          : `${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
      } else {
        const remHours = hours % 24;
        timeRemainingText = remHours > 0
          ? `${BanglaNameHelper.toBanglaNumeral(days)} দিন ${BanglaNameHelper.toBanglaNumeral(remHours)} ঘণ্টা বাকি`
          : `${BanglaNameHelper.toBanglaNumeral(days)} দিন বাকি`;
      }
    }
  }

  const durationText = `${BanglaNameHelper.toBanglaNumeral(currentExam.durationMinutes || 20)} মিনিট`;
  const questionsText = `${BanglaNameHelper.toBanglaNumeral(currentExam.totalQuestions || 25)} টি প্রশ্ন`;

  return (
    <div className="w-full my-1 sm:my-2 font-['HindSiliguri']">
      <div
        onClick={() => onExamClick && onExamClick(currentExam.id, currentExam.category)}
        className="w-full rounded-2xl bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none relative"
      >
        {/* Row 1: Title & Arrow */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <h3 className="text-sm sm:text-[15px] font-semibold text-[#0F172A] dark:text-white truncate group-hover:text-[#12544F] dark:group-hover:text-[#34D399] transition-colors">
            {currentExam.title}
          </h3>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 group-hover:text-[#12544F] dark:group-hover:text-emerald-400 transition-colors shrink-0">
            <ChevronRight size={17} />
          </div>
        </div>

        {/* Row 2: Bottom Strip (Matches Flutter LiveExamSlider bottom banner) */}
        <div
          className={cn(
            "rounded-xl px-2.5 sm:px-3 py-1.5 flex items-center justify-between gap-2 text-xs transition-colors",
            bottomStripBg
          )}
        >
          {/* Status & Countdown */}
          <div className="flex items-center gap-2 min-w-0">
            <div className={cn("flex items-center gap-1 font-bold shrink-0", statusColor)}>
              <StatusIcon size={13} className={isOngoing ? "animate-pulse" : ""} />
              <span>{statusText}</span>
            </div>
            <span className="text-neutral-400 dark:text-neutral-600 font-bold">•</span>
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 truncate text-[11.5px] sm:text-xs">
              {timeRemainingText}
            </span>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5 shrink-0 text-[11px] sm:text-xs font-semibold text-neutral-600 dark:text-neutral-400">
            <span>{questionsText}</span>
            <span>•</span>
            <span>{durationText}</span>
          </div>
        </div>

        {/* Carousel Indicators (if multiple) */}
        {exams.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-2.5">
            {exams.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  idx === currentIndex
                    ? "w-5 bg-[#12544F] dark:bg-[#34D399]"
                    : "w-1.5 bg-neutral-300 dark:bg-neutral-700"
                )}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveExamSlider;
