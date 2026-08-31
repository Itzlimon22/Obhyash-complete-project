"use client";

import React, { useState, useEffect } from "react";
import { Zap, Clock, CheckCircle2, ChevronRight, Radio } from "lucide-react";
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

  useEffect(() => {
    const fetchLiveExams = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const now = new Date().toISOString();

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
          // If user logged in, check user attempt status
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
            durationMinutes: e.duration_minutes || 25,
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
  const now = new Date();
  const startTime = new Date(currentExam.startTime);
  const endTime = new Date(currentExam.endTime);

  const isOngoing = now >= startTime && now <= endTime;
  const isPast = now > endTime;
  const isTaken = currentExam.userAttemptStatus === "submitted";

  let statusText = "Upcoming";
  let statusIcon = <Clock size={13} />;
  let statusBadgeClass =
    "bg-red-50 dark:bg-[#260C0E] text-red-600 dark:text-[#F87171] border-red-200 dark:border-red-900/50";

  if (isTaken) {
    statusText = "অংশগ্রহণকৃত";
    statusIcon = <CheckCircle2 size={13} />;
    statusBadgeClass =
      "bg-blue-50 dark:bg-[#0E1A2E] text-blue-600 dark:text-[#60A5FA] border-blue-200 dark:border-blue-900/50";
  } else if (isOngoing) {
    statusText = "Ongoing";
    statusIcon = <Zap size={13} className="animate-pulse" />;
    statusBadgeClass =
      "bg-emerald-50 dark:bg-[#0C2419] text-emerald-600 dark:text-[#4ADE80] border-emerald-200 dark:border-emerald-900/50";
  }

  // Format time remaining
  let timeRemainingText = "শীঘ্রই শুরু হবে";
  if (isOngoing) {
    const diffMs = endTime.getTime() - now.getTime();
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
    const diffMs = startTime.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    if (diffDays > 0) {
      timeRemainingText = `শুরু হতে বাকি - ${BanglaNameHelper.toBanglaNumeral(diffDays)} দিন`;
    } else if (diffHours > 0) {
      timeRemainingText = `শুরু হতে বাকি - ${BanglaNameHelper.toBanglaNumeral(diffHours)} ঘণ্টা`;
    } else {
      timeRemainingText = "আজ শুরু হবে";
    }
  }

  return (
    <div className="w-full my-2 font-['HindSiliguri']">
      <div
        onClick={() => onExamClick && onExamClick(currentExam.id, currentExam.category)}
        className="w-full rounded-2xl bg-white dark:bg-[#13151F] border border-neutral-200/90 dark:border-[#232738] p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer group select-none relative overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Left Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full border text-[11px] font-black flex items-center gap-1",
                  statusBadgeClass
                )}
              >
                {statusIcon}
                <span>{statusText}</span>
              </span>

              <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 truncate">
                {timeRemainingText}
              </span>
            </div>

            <h3 className="text-base font-black text-neutral-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {currentExam.title}
            </h3>

            <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              <span>{BanglaNameHelper.toBanglaNumeral(currentExam.totalQuestions)}টি প্রশ্ন</span>
              <span>•</span>
              <span>{BanglaNameHelper.toBanglaNumeral(currentExam.durationMinutes)} মিনিট</span>
            </div>
          </div>

          {/* Right Action Arrow */}
          <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-[#1C202F] border border-neutral-200 dark:border-[#2C3249] flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-[#004633] group-hover:text-white group-hover:border-[#004633] transition-all shrink-0">
            <ChevronRight size={18} />
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
                    ? "w-5 bg-emerald-600 dark:bg-emerald-400"
                    : "w-1.5 bg-neutral-300 dark:bg-neutral-700"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveExamSlider;
