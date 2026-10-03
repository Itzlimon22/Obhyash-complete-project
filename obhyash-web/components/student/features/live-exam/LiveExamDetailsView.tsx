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
  ChevronDown,
  Download,
  Loader2,
} from "lucide-react";
import { getLiveExamSolutions } from "@/services/live-exam-student-service";
import { downloadLiveExamResult } from "@/services/download-service";
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


interface SyllabusGroup {
  title: string;
  iconEmoji: string;
  questionCountText: string;
  topics: string[];
}

function toEnglishDigits(str: string): string {
  const bn = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replaceAll(bn[i], i.toString());
  }
  return result;
}

function splitRespectingParens(str: string, delimiter = ","): string[] {
  const result: string[] = [];
  let current = "";
  let parenDepth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === "(" || char === "（") parenDepth++;
    else if (char === ")" || char === "）") parenDepth = Math.max(0, parenDepth - 1);

    if (char === delimiter && parenDepth === 0) {
      if (current.trim()) result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function normalizeSubjectHeader(raw: string): { name: string; icon: string } {
  const clean = raw.trim();
  const lower = clean.toLowerCase();

  if (lower.includes("পদার্থ") || lower.includes("পদ")) {
    if (clean.includes("২") || clean.includes("2") || lower.includes("২য়") || lower.includes("২য়")) {
      return { name: "পদার্থবিজ্ঞান ২য় পত্র", icon: "🧲" };
    }
    if (clean.includes("১") || clean.includes("1") || lower.includes("১ম")) {
      return { name: "পদার্থবিজ্ঞান ১ম পত্র", icon: "🧲" };
    }
    return { name: "পদার্থবিজ্ঞান", icon: "🧲" };
  }

  if (lower.includes("রসায়ন") || lower.includes("রসায়ন") || lower.includes("রস") || lower.includes("chem")) {
    if (clean.includes("২") || clean.includes("2") || lower.includes("২য়") || lower.includes("২য়")) {
      return { name: "রসায়ন ২য় পত্র", icon: "🧪" };
    }
    if (clean.includes("১") || clean.includes("1") || lower.includes("১ম")) {
      return { name: "রসায়ন ১ম পত্র", icon: "🧪" };
    }
    return { name: "রসায়ন", icon: "🧪" };
  }

  if (lower.includes("গণিত") || lower.includes("ম্যাথ") || lower.includes("math")) {
    if (clean.includes("২") || clean.includes("2") || lower.includes("২য়") || lower.includes("২য়")) {
      return { name: "উচ্চতর গণিত ২য় পত্র", icon: "📐" };
    }
    if (clean.includes("১") || clean.includes("1") || lower.includes("১ম")) {
      return { name: "উচ্চতর গণিত ১ম পত্র", icon: "📐" };
    }
    return { name: "উচ্চতর গণিত", icon: "📐" };
  }

  if (lower.includes("উদ্ভিদ") || lower.includes("বোটানি")) {
    return { name: "উদ্ভিদবিজ্ঞান", icon: "🌿" };
  }

  if (lower.includes("প্রাণি") || lower.includes("প্রাণী") || lower.includes("জুলো")) {
    return { name: "প্রাণিবিজ্ঞান", icon: "🧬" };
  }

  if (lower.includes("জীব") || lower.includes("bio")) {
    return { name: "জীববিজ্ঞান", icon: "🧬" };
  }

  if (lower.includes("gk") || lower.includes("সাধারণ জ্ঞান") || lower.includes("সাধারণজ্ঞান")) {
    return { name: "সাধারণ জ্ঞান (GK)", icon: "🌍" };
  }

  if (lower.includes("english") || lower.includes("ইংরেজি") || lower.includes("ইংলিশ") || lower.includes("ইং")) {
    return { name: "ইংরেজি (English)", icon: "🔤" };
  }

  return { name: clean, icon: "📖" };
}

function parseSyllabusGroups(description?: string, totalMarks = 50, totalQuestions = 0): SyllabusGroup[] {
  if (!description || !description.trim()) {
    return [{
      title: "পূর্ণাঙ্গ সিলেবাস",
      iconEmoji: "📚",
      questionCountText: `${BanglaNameHelper.toBanglaNumeral(totalQuestions || totalMarks || 50)} টি প্রশ্ন`,
      topics: ["বোর্ড পাঠ্যবইয়ের সংশ্লিষ্ট সম্পূর্ণ অধ্যায়সমূহ"]
    }];
  }

  let rawSyllabus = description;
  let subjectLine = "";

  const lines = description.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (/^(?:বিষয়|বিষয়):/i.test(line)) {
      subjectLine = line.replace(/^(?:বিষয়|বিষয়):\s*/i, "").trim();
    } else if (/^(?:সিলেবাস):/i.test(line)) {
      rawSyllabus = line.replace(/^(?:সিলেবাস):\s*/i, "").trim();
    }
  }

  rawSyllabus = rawSyllabus.replace(/^(?:বিষয়|বিষয়):[^\n]+(?:\n|$)/gi, "").trim();
  rawSyllabus = rawSyllabus.replace(/^(?:সিলেবাস):\s*/gi, "").trim();

  // Check for marks distribution in parens, e.g. (জীব ৩০ + রস ২৫ + পদ ২০ + ইং ১৫ + জিকে ১০)
  const distributionMatch = rawSyllabus.match(/\(([^)]*(?:\+|\b(?:মার্ক|নম্বর|টি))\b[^)]*)\)/);
  const subjectMarksMap: Record<string, number> = {};
  if (distributionMatch) {
    const distStr = distributionMatch[1];
    const parts = distStr.split("+").map(p => p.trim());
    for (const p of parts) {
      const m = p.match(/([^\d]+)\s*(\d+|[০-৯]+)/);
      if (m) {
        const sub = m[1].trim();
        const cnt = parseInt(toEnglishDigits(m[2]), 10);
        if (sub && cnt > 0) {
          subjectMarksMap[sub] = cnt;
        }
      }
    }
  }

  const blocks = rawSyllabus.split(/[;\n]+/).map(b => b.trim()).filter(Boolean);
  const result: { title: string; iconEmoji: string; rawHeader: string; topics: string[] }[] = [];

  for (const block of blocks) {
    if (block.includes(":")) {
      const idx = block.indexOf(":");
      const rawHeader = block.substring(0, idx).trim();
      const rawTopics = block.substring(idx + 1).trim();

      const headerInfo = normalizeSubjectHeader(rawHeader);
      const topics = splitRespectingParens(rawTopics, ",")
        .map(t => t.replace(/^[•\s\d.-]+/, "").trim())
        .filter(Boolean);

      result.push({
        title: headerInfo.name,
        iconEmoji: headerInfo.icon,
        rawHeader,
        topics: topics.length > 0 ? topics : [rawTopics]
      });
    }
  }

  if (result.length === 0) {
    const headerInfo = normalizeSubjectHeader(subjectLine || "সিলেবাস");
    const topics = splitRespectingParens(rawSyllabus, ",")
      .map(t => t.replace(/^[•\s\d.-]+/, "").trim())
      .filter(Boolean);

    result.push({
      title: headerInfo.name,
      iconEmoji: headerInfo.icon,
      rawHeader: subjectLine,
      topics: topics.length > 0 ? topics : [rawSyllabus]
    });
  }

  const effectiveTotal = totalQuestions > 0 ? totalQuestions : (totalMarks > 0 ? totalMarks : 50);
  const countPerSubject = Math.round(effectiveTotal / Math.max(1, result.length));

  return result.map(group => {
    let qCount = countPerSubject;
    for (const [k, v] of Object.entries(subjectMarksMap)) {
      if (group.title.includes(k) || group.rawHeader.includes(k)) {
        qCount = v;
        break;
      }
    }
    const bnCount = BanglaNameHelper.toBanglaNumeral(qCount);
    return {
      title: group.title,
      iconEmoji: group.iconEmoji,
      questionCountText: `${bnCount} টি প্রশ্ন`,
      topics: group.topics
    };
  });
}

function formatDateShortEng(dt: Date): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const day = String(dt.getDate()).padStart(2, "0");
  const month = months[dt.getMonth()];
  const year = dt.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatRemainingTime(startTime: Date): string {
  const now = new Date();
  if (startTime <= now) return "শীঘ্রই";
  const diffMs = startTime.getTime() - now.getTime();
  const totalMinutes = Math.floor(diffMs / 60000);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;

  if (days > 0) {
    const bnDays = BanglaNameHelper.toBanglaNumeral(days);
    if (hours > 0) {
      const bnHours = BanglaNameHelper.toBanglaNumeral(hours);
      return `${bnDays} দিন ${bnHours} ঘণ্টা`;
    }
    return `${bnDays} দিন`;
  }
  if (hours > 0) {
    const bnHours = BanglaNameHelper.toBanglaNumeral(hours);
    if (minutes > 0) {
      const bnMinutes = BanglaNameHelper.toBanglaNumeral(minutes);
      return `${bnHours} ঘণ্টা ${bnMinutes} মিনিট`;
    }
    return `${bnHours} ঘণ্টা`;
  }
  if (minutes > 0) {
    const bnMinutes = BanglaNameHelper.toBanglaNumeral(minutes);
    return `${bnMinutes} মিনিট`;
  }
  return "কিছুক্ষণ";
}

function formatBanglaDate(dt: Date): string {
  const months = [
    "", "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"
  ];
  const day = BanglaNameHelper.toBanglaNumeral(dt.getDate());
  const month = months[dt.getMonth() + 1];
  const year = BanglaNameHelper.toBanglaNumeral(dt.getFullYear());
  return `${day} ${month} ${year}`;
}

function formatBanglaTime(dt: Date): string {
  const hour = dt.getHours();
  const minute = dt.getMinutes();
  const period = hour >= 12 ? (hour >= 16 ? (hour >= 20 ? "রাত" : "সন্ধ্যা") : (hour >= 12 && hour < 16 ? "দুপুর" : "রাত")) : (hour < 4 ? "রাত" : (hour < 6 ? "ভোর" : "সকাল"));
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const bnHour = BanglaNameHelper.toBanglaNumeral(displayHour);
  const bnMin = minute > 0 ? BanglaNameHelper.toBanglaNumeral(minute.toString().padStart(2, "0")) : "০০";
  return `${period} ${bnHour}:${bnMin} টা`;
}

function formatTime12Hour(dt: Date): string {
  let hours = dt.getHours();
  const minutes = dt.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = String(minutes).padStart(2, "0");
  return `${hours}:${minutesStr} ${ampm}`;
}

function formatDurationBangla(minutes: number): string {
  if (minutes === 60) return "১ ঘণ্টা";
  if (minutes === 120) return "২ ঘণ্টা";
  if (minutes < 60) return `${BanglaNameHelper.toBanglaNumeral(minutes)} মিনিট`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${BanglaNameHelper.toBanglaNumeral(h)} ঘণ্টা`;
  return `${BanglaNameHelper.toBanglaNumeral(h)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(m)} মিনিট`;
}

const SyllabusAccordionCard: React.FC<{
  group: SyllabusGroup;
  defaultExpanded?: boolean;
}> = ({ group, defaultExpanded = true }) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  return (
    <div className="border-b border-[#F1F5F9] dark:border-[#27272A] last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-3.5 px-4 flex items-center justify-between text-left hover:bg-[#F8FAFC]/80 dark:hover:bg-[#27272A]/40 transition-colors select-none cursor-pointer"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[19px] leading-none shrink-0">{group.iconEmoji}</span>
          <span className="text-[15px] font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
            {group.title}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 ml-3">
          {group.questionCountText && (
            <span className="text-[12.5px] font-semibold text-[#475569] dark:text-[#94A3B8] bg-[#F1F5F9] dark:bg-[#27272A] px-2.5 py-0.5 rounded-full">
              {group.questionCountText}
            </span>
          )}
          <ChevronDown
            size={18}
            className={cn(
              "text-[#64748B] dark:text-[#94A3B8] transition-transform duration-200",
              isOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {isOpen && (
        <div className="pb-3.5 pt-1 pl-11 pr-4 space-y-1.5 animate-in fade-in-50 duration-150">
          {group.topics.map((topic, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="text-[14px] leading-tight font-black text-[#64748B] dark:text-[#94A3B8] shrink-0">
                •
              </span>
              <span className="text-[13.5px] leading-snug font-medium text-[#1E293B] dark:text-[#E2E8F0]">
                {topic}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const LiveExamDetailsView: React.FC<LiveExamDetailsViewProps> = ({
  examId,
  examTitle,
  status,
  commonLayoutProps,
  onBack,
}) => {
  const { user, profile } = useAuth();
  const [exam, setExam] = useState<LiveExam | null>(null);
  const [attempt, setAttempt] = useState<LiveExamAttempt | null>(null);
  const [practiceHistory, setPracticeHistory] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [isViewingSolutions, setIsViewingSolutions] = useState(false);
  const [isViewingLeaderboard, setIsViewingLeaderboard] = useState(false);

  // Sync subview from URL on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("solution") === "true" || params.get("subview") === "solutions") {
      setIsViewingSolutions(true);
    } else if (params.get("subview") === "leaderboard") {
      setIsViewingLeaderboard(true);
    }
  }, []);

  const handleOpenLeaderboard = () => {
    setIsViewingLeaderboard(true);
    setIsViewingSolutions(false);
    if (typeof window !== "undefined") {
      const nextIdx = ((window.history.state?.idx as number) ?? 0) + 1;
      const url = new URL(window.location.href);
      url.searchParams.set("subview", "leaderboard");
      window.history.pushState(
        { tab: "live_exam", liveView: "details", liveSubView: "leaderboard", examId, idx: nextIdx },
        "",
        url.toString()
      );
    }
  };

  const handleOpenSolutions = () => {
    setIsViewingSolutions(true);
    setIsViewingLeaderboard(false);
    if (typeof window !== "undefined") {
      const nextIdx = ((window.history.state?.idx as number) ?? 0) + 1;
      const url = new URL(window.location.href);
      url.searchParams.set("subview", "solutions");
      window.history.pushState(
        { tab: "live_exam", liveView: "details", liveSubView: "solutions", examId, idx: nextIdx },
        "",
        url.toString()
      );
    }
  };

  const handleLeaderboardBack = () => {
    if (typeof window !== "undefined" && window.history.state?.liveSubView === "leaderboard") {
      window.history.back();
    } else {
      setIsViewingLeaderboard(false);
    }
  };

  const handleSolutionsBack = () => {
    if (typeof window !== "undefined" && window.history.state?.liveSubView === "solutions") {
      window.history.back();
    } else {
      setIsViewingSolutions(false);
    }
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!exam) return;
    setIsDownloadingPdf(true);
    try {
      const solutionData = await getLiveExamSolutions(exam.id, user?.id);
      if (!solutionData.questions || solutionData.questions.length === 0) {
        toast.error("পরীক্ষার প্রশ্ন লোড করা যায়নি");
        return;
      }
      downloadLiveExamResult(
        exam,
        solutionData.questions,
        solutionData.userAnswers || attempt?.user_answers || {},
        attempt,
        profile?.name || (user?.user_metadata as any)?.name || (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0] || "শিক্ষার্থী"
      );
      toast.success("পিডিএফ সমাধান শিট প্রস্তুত হয়েছে!");
    } catch (err: any) {
      console.error("Failed to download PDF:", err);
      toast.error("পিডিএফ তৈরি করতে সমস্যা হয়েছে");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Popstate listener for sub-views
  useEffect(() => {
    const handlePop = (e: PopStateEvent) => {
      const sub = e.state?.liveSubView;
      if (!sub) {
        setIsViewingLeaderboard(false);
        setIsViewingSolutions(false);
      } else if (sub === "leaderboard") {
        setIsViewingLeaderboard(true);
        setIsViewingSolutions(false);
      } else if (sub === "solutions") {
        setIsViewingSolutions(true);
        setIsViewingLeaderboard(false);
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

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
      const isResultPub = detailsData.exam.id.startsWith("mock-") || (isPast && detailsData.exam.is_leaderboard_published !== false);

      if (
        detailsData.attempt?.status === "submitted" &&
        isResultPub
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

  // Leaderboard publication: Exactly 15 minutes after exam ends, or if explicitly enabled by admin
  const lbPubTime = new Date(new Date(exam.end_time).getTime() + 15 * 60 * 1000);
  const isLeaderboardPublished =
    exam.id.startsWith("mock-") ||
    exam.is_leaderboard_published === true ||
    (now >= lbPubTime && exam.is_leaderboard_published !== false);

  // Result & Solution: Available immediately when live exam ends (or if admin explicitly set is_answer_published === true)
  const isResultAndSolutionAvailable =
    exam.id.startsWith("mock-") ||
    isPast ||
    exam.is_answer_published === true;

  // Practice: Available immediately when live exam ends
  const isPracticeAvailable =
    exam.id.startsWith("mock-") ||
    isPast ||
    exam.is_practice_enabled !== false;

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

  const syllabusGroups = parseSyllabusGroups(exam.description, exam.total_marks, exam.total_questions);

  // Leaderboard View Screen
  if (isViewingLeaderboard) {
    return (
      <AppLayout
        activeTab="live_exam"
        {...commonLayoutProps}
        title={`${exam.title} - মেধা তালিকা`}
        centerTitle={true}
        onBack={handleLeaderboardBack}
      >
        <LiveExamLeaderboardView
          exam={exam}
          onBack={handleLeaderboardBack}
          onViewSolutions={() => {
            handleOpenSolutions();
          }}
        />
      </AppLayout>
    );
  }

  // Solution View Screen
  if (isViewingSolutions) {
    if (!isResultAndSolutionAvailable) {
      handleSolutionsBack();
      toast.info("পরীক্ষা শেষ হওয়ার সাথে সাথে সম্পূর্ণ সমাধান উন্মুক্ত করা হবে।");
      return null;
    }
    return (
      <LiveExamSolutionView
        examId={exam.id}
        examTitle={exam.title}
        categoryTitle={exam.category}
        negativeMarking={exam.negative_marking || 0.25}
        commonLayoutProps={commonLayoutProps}
        onBack={handleSolutionsBack}
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
      title={exam.title}
      centerTitle={true}
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

          {/* 2. Schedule Section - Matching Reference Image Exactly */}
          <div className="mt-4 rounded-[18px] bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] p-4 sm:p-5 font-['HindSiliguri',sans-serif]">
            {/* Centered Header */}
            <div className="flex items-center justify-center gap-2 mb-3.5">
              <span className="text-[18px] leading-none">🗓️</span>
              <h3 className="font-['HindSiliguri',sans-serif] text-[16.5px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                সময়সূচী
              </h3>
            </div>

            {/* 2-Column Schedule with Dash */}
            <div className="flex items-center justify-between px-2 sm:px-8">
              {/* Left: Start Date & Time */}
              <div className="flex flex-col items-start text-left">
                <span className="font-['HindSiliguri',sans-serif] text-[16.5px] sm:text-[18px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {formatDateShortEng(start)}
                </span>
                <span className="font-['HindSiliguri',sans-serif] text-[13.5px] sm:text-[14px] font-semibold text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  {formatTime12Hour(start)}
                </span>
              </div>

              {/* Center Dash */}
              <div className="w-8 sm:w-12 h-[2px] bg-[#CBD5E1] dark:bg-[#3F3F46] rounded-full mx-2 sm:mx-6 shrink-0" />

              {/* Right: End Date & Time */}
              <div className="flex flex-col items-end text-right">
                <span className="font-['HindSiliguri',sans-serif] text-[16.5px] sm:text-[18px] font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {formatDateShortEng(end)}
                </span>
                <span className="font-['HindSiliguri',sans-serif] text-[13.5px] sm:text-[14px] font-semibold text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                  {formatTime12Hour(end)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Meta Stats Pill Row Matching Reference Image */}
          <div className="mt-3.5 rounded-[18px] bg-[#F8FAFC] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] py-3.5 px-4 flex items-center justify-center gap-3 sm:gap-6 flex-wrap font-['HindSiliguri',sans-serif]">
            {/* Duration */}
            <div className="flex items-center gap-2">
              <span className="text-[17px]">⏱️</span>
              <span className="font-['HindSiliguri',sans-serif] text-[15px] sm:text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {formatDurationBangla(exam.duration_minutes || 30)}
              </span>
            </div>

            <div className="w-px h-5 bg-[#E2E8F0] dark:bg-[#2E2E32]" />

            {/* Total Questions */}
            <div className="flex items-center gap-2">
              <span className="text-[17px]">📝</span>
              <span className="font-['HindSiliguri',sans-serif] text-[15px] sm:text-[16px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                {BanglaNameHelper.toBanglaNumeral(exam.total_questions || exam.total_marks || 50)}টি প্রশ্ন
              </span>
            </div>

            {(exam.negative_marking || 0.25) > 0 && (
              <>
                <div className="w-px h-5 bg-[#E2E8F0] dark:bg-[#2E2E32]" />
                <div className="flex items-center gap-2">
                  <span className="text-[16px]">🎯</span>
                  <span className="font-['HindSiliguri',sans-serif] text-[15px] sm:text-[16px] font-semibold text-[#EF4444]">
                    -{BanglaNameHelper.toBanglaNumeral(exam.negative_marking || 0.25)} মার্ক
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 4. Syllabus Section */}
          <div className="mt-3.5 rounded-[16px] bg-white dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] overflow-hidden divide-y divide-[#F1F5F9] dark:divide-[#27272A] shadow-xs">
            {syllabusGroups.map((group, idx) => (
              <SyllabusAccordionCard key={idx} group={group} defaultExpanded={idx < 2} />
            ))}
          </div>
        </div>

        {/* Main Action Buttons */}
        <div className="mt-5 space-y-3">
          {!isTaken ? (
            isOngoing ? (
              <button
                type="button"
                onClick={() => setIsTakingExam(true)}
                className="w-full h-[52px] rounded-2xl bg-[#004633] hover:bg-[#003828] text-white font-bold text-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-99"
              >
                <span>পরীক্ষা শুরু করুন</span>
              </button>
            ) : isUpcoming ? (
              <button
                type="button"
                disabled
                className="w-full h-[52px] rounded-2xl bg-[#E2E8F0] dark:bg-[#27272A] text-[#94A3B8] dark:text-[#71717A] font-bold text-[14.5px] cursor-not-allowed flex items-center justify-center px-4"
              >
                <span>পরীক্ষা এখনও শুরু হয়নি (⏱️ আর {formatRemainingTime(start)} বাকি)</span>
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setIsTakingExam(true)}
                  className="w-full h-[52px] rounded-2xl bg-[#004633] hover:bg-[#003828] text-white font-bold text-[16px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-99"
                >
                  <RotateCcw size={18} />
                  <span>অনুশীলন পরীক্ষা শুরু করুন</span>
                </button>

                {isResultAndSolutionAvailable && (
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="w-full h-[50px] rounded-2xl bg-white dark:bg-[#141417] border border-[#CBD5E1] dark:border-[#27272A] text-[#0F172A] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1C20] font-bold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99 disabled:opacity-60"
                  >
                    {isDownloadingPdf ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    <span>
                      {isDownloadingPdf
                        ? "পিডিএফ সমাধান শিট তৈরি হচ্ছে..."
                        : "প্রশ্ন ও সমাধান ডাউনলোড (PDF)"}
                    </span>
                  </button>
                )}
              </div>
            )
          ) : (
            isPast || isResultAndSolutionAvailable || exam.id.startsWith("mock-") ? (
              <div className="space-y-3">
                {/* Solutions Button - Available immediately on exam end */}
                {isResultAndSolutionAvailable && (
                  <button
                    type="button"
                    onClick={handleOpenSolutions}
                    className="w-full h-[52px] rounded-2xl bg-[#004633] hover:bg-[#003828] text-white font-bold text-[15.5px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-99"
                  >
                    <BookOpen size={18} />
                    <span>সমাধান ও ব্যাখ্যা দেখুন</span>
                  </button>
                )}

                {/* Download PDF Button */}
                {isResultAndSolutionAvailable && (
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="w-full h-[50px] rounded-2xl bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-bold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-99 disabled:opacity-60"
                  >
                    {isDownloadingPdf ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    <span>
                      {isDownloadingPdf
                        ? "পিডিএফ সমাধান শিট তৈরি হচ্ছে..."
                        : "ফলাফল ও সমাধান ডাউনলোড (PDF)"}
                    </span>
                  </button>
                )}

                {/* Retake as Practice Button - Available immediately on exam end */}
                {isPracticeAvailable && (
                  <button
                    type="button"
                    onClick={() => setIsTakingExam(true)}
                    className="w-full h-[50px] rounded-2xl bg-white dark:bg-[#141417] border border-[#CBD5E1] dark:border-[#27272A] text-[#0F172A] dark:text-[#E2E8F0] hover:bg-[#F8FAFC] dark:hover:bg-[#1C1C20] font-bold text-[15px] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-99"
                  >
                    <RotateCcw size={18} />
                    <span>অনুশীলন পরীক্ষা দিন (Practice)</span>
                  </button>
                )}
              </div>
            ) : null
          )}
        </div>

        {/* Score Overview Card (When taken) */}
        {isTaken && attempt && (
          <div className="mt-5 rounded-[22px] bg-white dark:bg-[#141417] border border-[#E2E8F0] dark:border-[#27272A] p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-[15.5px] font-extrabold text-[#0F172A] dark:text-[#F8FAFC]">
                তোমার ফলাফলের সারসংক্ষেপ (অফিসিয়াল)
              </h3>
              {isResultAndSolutionAvailable && (
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[12px] font-bold flex items-center gap-1.5 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer disabled:opacity-50"
                  title="ফলাফল ও সমাধান শিট PDF ডাউনলোড"
                >
                  {isDownloadingPdf ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                  <span>PDF শিট</span>
                </button>
              )}
            </div>

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
                  {(() => {
                    const calc = Number((((attempt.correct_count || 0) - ((attempt.wrong_count || 0) * (exam.negative_marking || 0.25)))).toFixed(4));
                    const eff = (attempt.score === 0 && calc < 0) ? calc : (attempt.score ?? 0);
                    return BanglaNameHelper.toBanglaNumeral(eff);
                  })()}
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

        {/* Anti-Leakage Banner: Shown only when student submitted early and live exam is still ongoing */}
        {isTaken && !isResultAndSolutionAvailable && !exam.id.startsWith("mock-") && (
          <div className="mt-5 rounded-[20px] bg-[#F59E0B]/12 border border-[#F59E0B]/30 p-4 flex items-start gap-3">
            <AlertCircle size={20} className="text-[#D97706] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[14px] font-bold text-[#D97706]">
                উত্তরপত্র সফলভাবে জমা নেওয়া হয়েছে!
              </h4>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#78350F] dark:text-white/70">
                পরীক্ষার গোপনীয়তা ও সমতা বজায় রাখতে, লাইভ পরীক্ষা শেষ হওয়ার সাথে সাথেই ({formatTime12Hour(end)}) আপনার সম্পূর্ণ সমাধান উন্মুক্ত করা হবে এবং পরীক্ষা সমাপ্তির ১৫ মিনিট পর মেধা তালিকা প্রকাশ পাবে।
              </p>
            </div>
          </div>
        )}

        {/* Leaderboard Countdown Notice: Shown when exam has ended, solutions are visible, but leaderboard is within the 15-minute delay */}
        {isTaken && isPast && !isLeaderboardPublished && !exam.id.startsWith("mock-") && exam.is_leaderboard_published !== false && (
          <div className="mt-5 rounded-[20px] bg-blue-500/10 border border-blue-500/25 p-4 flex items-start gap-3">
            <Clock size={20} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-[14px] font-bold text-blue-600 dark:text-blue-400">
                অফিসিয়াল মেধা তালিকা প্রস্তুত হচ্ছে
              </h4>
              <p className="mt-1 text-[12.5px] leading-relaxed text-blue-900/80 dark:text-blue-200/80">
                পরীক্ষা শেষ হওয়ার ১৫ মিনিট পর ({formatTime12Hour(lbPubTime)}) সম্পূর্ণ মেধা তালিকা ও র‍্যাংকিং স্বয়ংক্রিয়ভাবে প্রকাশিত হবে। আপনি উপরের বাটন থেকে আপনার সমাধান ও ব্যাখ্যা দেখে নিতে পারেন।
              </p>
            </div>
          </div>
        )}

        {/* Admin Hidden Leaderboard Banner */}
        {isTaken && (isPast || exam.id.startsWith("mock-")) && exam.is_leaderboard_published === false && (
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

        {/* Leaderboard Section (Top 5 Rankers) - shown only when isLeaderboardPublished is true */}
        {isTaken && isLeaderboardPublished && (
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
              onClick={handleOpenLeaderboard}
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
