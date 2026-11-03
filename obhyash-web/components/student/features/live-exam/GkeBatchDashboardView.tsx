"use client";

import React, { useState, useMemo, type ReactNode } from "react";
import {
  Calendar,
  Clock,
  ChevronRight,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Target,
  BarChart3,
  Layers,
  FileText,
  Trophy,
  RotateCcw,
  History,
  HelpCircle,
  Play,
  Search,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Shuffle,
  Book,
} from "lucide-react";
import { LiveExam } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";
import { GKE_DEFAULT_EXAMS } from "@/services/live-exam-student-service";

// ─────────────────────────────────────────────────────────────
// Menu items configured with Obhyash Brand Theme
// ─────────────────────────────────────────────────────────────
interface FeatureMenuItem {
  id: string;
  label: string;
  subtitle: string;
  badge?: string;
  icon: any;
  iconColor: string;
  iconBg: string;
  target: string;
}

const menuItems: FeatureMenuItem[] = [
  {
    id: "exam",
    label: "পরীক্ষা দিন",
    subtitle: "লাইভ বা প্র্যাকটিস শুরু",
    badge: "Live",
    icon: Zap,
    iconColor: "text-rose-600 dark:text-rose-400",
    iconBg: "bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40",
    target: "exam",
  },
  {
    id: "leaderboard",
    label: "Leaderboard",
    subtitle: "ব্যাচ মেধা তালিকা",
    badge: "Rank",
    icon: Trophy,
    iconColor: "text-amber-600 dark:text-amber-400",
    iconBg: "bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40",
    target: "leaderboard",
  },
  {
    id: "practice",
    label: "Practice",
    subtitle: "কাস্টম টেস্ট ও রিটেক",
    badge: "Unlimited",
    icon: RotateCcw,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40",
    target: "practice",
  },
  {
    id: "history",
    label: "পরীক্ষার ইতিহাস",
    subtitle: "পূর্বের রেজাল্ট ও এনালাইসিস",
    badge: "Records",
    icon: History,
    iconColor: "text-blue-600 dark:text-blue-400",
    iconBg: "bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40",
    target: "history",
  },
  {
    id: "mentor",
    label: "Mentor Support",
    subtitle: "প্রশ্ন ও ডাউট সমাধান",
    badge: "২৪/৭",
    icon: MessageSquare,
    iconColor: "text-purple-600 dark:text-purple-400",
    iconBg: "bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40",
    target: "mentor",
  },
  {
    id: "model_tests",
    label: "Model Tests",
    subtitle: "৭০টি পূর্ণাঙ্গ মডেল টেস্ট",
    badge: "৭০ Tests",
    icon: Layers,
    iconColor: "text-[#004633] dark:text-emerald-400",
    iconBg: "bg-teal-50 dark:bg-teal-950/40 border border-[#004633]/20 dark:border-teal-900/40",
    target: "model_tests",
  },
  {
    id: "random",
    label: "Random Test",
    subtitle: "তাৎক্ষণিক কুইজ টেস্ট",
    badge: "Quick",
    icon: Shuffle,
    iconColor: "text-indigo-600 dark:text-indigo-400",
    iconBg: "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40",
    target: "random",
  },
  {
    id: "materials",
    label: "Materials",
    subtitle: "সলভ ও লেকচার শিট",
    badge: "PDF",
    icon: BookOpen,
    iconColor: "text-slate-700 dark:text-zinc-300",
    iconBg: "bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700",
    target: "materials",
  },
];

const batchLeaderboard = [
  { name: "Ayesha Rahman", college: "Holy Cross College", score: 96, rank: 1 },
  { name: "Tanvir Hasan", college: "Notre Dame College", score: 93, rank: 2 },
  { name: "Nusrat Jahan", college: "Viqarunnisa Noon College", score: 91, rank: 3 },
  { name: "Rafiul Islam", college: "Dhaka College", score: 89, rank: 4 },
  { name: "Sadia Akter", college: "Rajuk Uttara Model College", score: 87, rank: 5 },
  { name: "Mehedi Hasan", college: "Dhaka City College", score: 85, rank: 6 },
  { name: "Farzana Yasmin", college: "Ideal School & College", score: 82, rank: 7 },
  { name: "You", college: "Your College", score: 78, rank: 18 },
];

const materialSheets = {
  solve: [
    { title: "MT-01 Solve Sheet", meta: "বাংলাদেশ, ইংরেজি • ১২ পৃষ্ঠা" },
    { title: "MT-02 Solve Sheet", meta: "আন্তর্জাতিক, ইংরেজি • ১০ পৃষ্ঠা" },
    { title: "Weekly Review Solve", meta: "সব বিষয় • ১৬ পৃষ্ঠা" },
  ],
  practice: [
    { title: "বাংলাদেশ Practice Sheet", meta: "৫০টি প্রশ্ন • ৮ পৃষ্ঠা" },
    { title: "International Practice Sheet", meta: "৪০টি প্রশ্ন • ৭ পৃষ্ঠা" },
    { title: "English Grammar Practice", meta: "৬০টি প্রশ্ন • ৯ পৃষ্ঠা" },
  ],
};

interface GkeBatchDashboardViewProps {
  exams: (LiveExam & { userAttemptStatus?: string })[];
  isLoading: boolean;
  now: Date;
  onSelectExam: (exam: { id: string; title: string; status: "untaken" | "taken" }) => void;
  onOpenRoutine: () => void;
  onOpenHistory?: () => void;
  onBack: () => void;
}

export const GkeBatchDashboardView: React.FC<GkeBatchDashboardViewProps> = ({
  exams,
  isLoading,
  now,
  onSelectExam,
  onOpenRoutine,
  onOpenHistory,
  onBack,
}) => {
  // Sub-view router inside GKE Dashboard
  const [currentView, setCurrentView] = useState<
    "dashboard" | "exams_list" | "leaderboard" | "practice" | "materials" | "mentor"
  >("dashboard");
  const [mentorDoubt, setMentorDoubt] = useState("");
  const [mentorSubmitted, setMentorSubmitted] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"All" | "Ongoing" | "Upcoming">("All");

  // Combined exam set (from DB or rich default GKE track)
  const allExams = useMemo(() => {
    if (exams && exams.length > 0) return exams;
    return GKE_DEFAULT_EXAMS;
  }, [exams]);

  // Dynamic Exam Resolution
  const { todayExam, tomorrowExam } = useMemo(() => {
    const todayDateStr = now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDateStr = tomorrow.toDateString();

    let t: (LiveExam & { userAttemptStatus?: string }) | null = null;
    let tm: (LiveExam & { userAttemptStatus?: string }) | null = null;

    allExams.forEach((exam) => {
      const sDate = new Date(exam.start_time).toDateString();
      if (sDate === todayDateStr && !t) t = exam;
      else if (sDate === tomorrowDateStr && !tm) tm = exam;
    });

    if (!t && allExams.length > 0) t = allExams[0];
    if (!tm && allExams.length > 1) tm = allExams[1];

    return { todayExam: t, tomorrowExam: tm };
  }, [allExams, now]);

  // Handle start today directly into real LiveExamDetailsView
  const handleStartToday = () => {
    const examToStart = todayExam || allExams[0];
    onSelectExam({
      id: examToStart.id,
      title: examToStart.title,
      status: examToStart.userAttemptStatus === "submitted" ? "taken" : "untaken",
    });
  };

  const extractExamCode = (exam?: LiveExam | null, fallback = "MT-01") => {
    if (!exam) return fallback;
    const match = exam.title.match(/(MT-?\s*\d+)/i);
    if (match) return match[1].toUpperCase().replace(/\s+/, "-");
    const match2 = exam.id.match(/gke_mt_(\d+)/i);
    if (match2) return `MT-${match2[1]}`;
    const numMatch = exam.title.match(/(\d+)/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10) || 1;
      return `MT-${n.toString().padStart(2, "0")}`;
    }
    return fallback;
  };

  const cleanSyllabusPreview = (raw?: string, fallback = "") => {
    if (!raw || !raw.trim()) return fallback;
    let text = raw;
    const match = text.match(/সিলেবাস:\s*([^\n]+)/);
    if (match) {
      text = match[1];
    }
    text = text.replace(/^(?:বিষয়|বিষয়):[^\n]+(?:\n|$)/gi, "");
    text = text.replace(/সাধারণ জ্ঞান:\s*/g, "").replace(/ইংরেজি:\s*/g, "");
    text = text.replace(/;/g, ", ").replace(/\n+/g, ", ");
    text = text.replace(/,\s*,/g, ", ").trim();
    if (text.startsWith(",")) text = text.slice(1).trim();
    return text || fallback;
  };

  // Helper formatting functions matching LiveExamCategoryView
  const formatDurationBn = (minutes: number) => {
    if (!minutes || minutes <= 0) return "৩০ মিনিট";
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
      const hours = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      return `${BanglaNameHelper.toBanglaNumeral(hours)} ঘ. ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে. বাকি`;
    }

    if (isPast) {
      return "ফলাফল প্রকাশিত";
    }

    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) return "এখনই শুরু হচ্ছে";
    const totalSecs = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSecs / 86400);
    const hours = Math.floor((totalSecs % 86400) / 3600);
    return days > 0
      ? `${BanglaNameHelper.toBanglaNumeral(days)} দিন ${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা বাকি`
      : `${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা বাকি`;
  };

  // Filtered exams for model tests list view
  const filteredExams = useMemo(() => {
    return allExams
      .filter((exam) => {
        const start = new Date(exam.start_time);
        const end = new Date(exam.end_time);
        const isOngoing = now >= start && now <= end;
        const isUpcoming = now < start;

        if (activeFilter === "Ongoing" && !isOngoing) return false;
        if (activeFilter === "Upcoming" && !isUpcoming) return false;
        return true;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [allExams, activeFilter, now]);

  // ─────────────────────────────────────────────────────────────
  // SUB-PAGE: ATTEND EXAM / ALL MODEL TESTS
  // EXACT SAME PAGE & FUNCTIONALITY AS OTHER MODEL TESTS (Medical, Engineering)
  // Clicking any exam opens LiveExamDetailsView with Start Exam, Timer, Results, Solutions & Leaderboard!
  // ─────────────────────────────────────────────────────────────
  if (currentView === "exams_list") {
    return (
      <div className="mx-auto min-h-screen w-full max-w-5xl bg-neutral-50/50 dark:bg-[#0B0F19] pb-24 font-['HindSiliguri',sans-serif]">
        {/* Header Bar */}
        <header className="flex items-center justify-between pb-4 pt-4 px-1">
          <div className="flex items-center gap-3">
            <button
              aria-label="পেছনে যান"
              className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] text-neutral-700 dark:text-neutral-300 shadow-xs transition hover:border-[#004633] hover:text-[#004633] cursor-pointer"
              onClick={() => setCurrentView("dashboard")}
              type="button"
            >
              <ChevronRight className="size-5 rotate-180" />
            </button>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#004633] dark:text-emerald-400">
                GKE ব্যাচ ০১
              </p>
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white">
                মডেল টেস্ট পরীক্ষা দিন
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenRoutine}
            className="px-3.5 py-1.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/25 border border-[#BFDBFE] dark:border-[#1E3A8A]/50 text-[#2563EB] dark:text-[#60A5FA] text-[13px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:opacity-90 active:scale-95"
          >
            <Calendar size={13} />
            <span>সম্পূর্ণ রুটিন</span>
          </button>
        </header>

        {/* Filter Chips Capsule (All, Ongoing, Upcoming) matching LiveExamCategoryView */}
        <div className="flex items-center justify-between gap-3 mb-4 mt-2">
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
                  {f === "All" ? "সবগুলো" : f === "Ongoing" ? "চলমান" : "আসন্ন"}
                </button>
              );
            })}
          </div>

          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            মোট {BanglaNameHelper.toBanglaNumeral(filteredExams.length)} টি পরীক্ষা
          </span>
        </div>

        {/* Exam Cards List identical to other model test categories */}
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
                  onSelectExam({
                    id: exam.id,
                    title: exam.title,
                    status: isTaken ? "taken" : "untaken",
                  })
                }
                className="rounded-[16px] bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] p-4 cursor-pointer shadow-xs hover:shadow-md hover:border-[#004633]/40 transition-all active:scale-[0.99] select-none"
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
                    <CheckCircle2 size={14} className="text-[#10B981]" />
                    <span>{questionsText}</span>
                  </div>
                </div>

                {/* Row 3: Status Indicator & Time Remaining */}
                <div className={cn("mt-3 flex items-center justify-between rounded-xl px-3 py-2", bottomStripBg)}>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[13px] font-bold flex items-center gap-1.5", statusColorClass)}>
                      <StatusIcon size={14} />
                      <span>{statusText}</span>
                    </span>
                  </div>
                  <span className="text-[12px] font-semibold text-[#64748B] dark:text-[#94A3B8]">
                    {timeRemainingText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUB-PAGE: LEADERBOARD
  // ─────────────────────────────────────────────────────────────
  if (currentView === "leaderboard") {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md bg-neutral-50/50 dark:bg-[#0B0F19] pb-10 sm:rounded-[28px] font-['HindSiliguri',sans-serif]">
        <header className="flex items-center gap-3.5 px-4 pb-4 pt-5">
          <button
            aria-label="পেছনে যান"
            className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] text-neutral-700 dark:text-neutral-300 shadow-xs transition hover:border-[#004633] hover:text-[#004633] cursor-pointer"
            onClick={() => setCurrentView("dashboard")}
            type="button"
          >
            <ChevronRight className="size-5 rotate-180" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#004633] dark:text-emerald-400">GKE ব্যাচ ০১</p>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">মেধা তালিকা (Leaderboard)</h1>
          </div>
        </header>

        <section className="space-y-4 px-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#004633] to-[#047857] px-4 pb-4 pt-5 text-white shadow-sm border border-[#004633]">
            <div className="mb-4 text-center">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider text-emerald-100">
                <Trophy size={12} className="text-amber-300" />
                শীর্ষ মেধাবী
              </span>
              <h2 className="mt-1 text-base font-extrabold">Top 3 Students</h2>
            </div>
            <div className="grid grid-cols-3 items-end gap-2">
              {[batchLeaderboard[1], batchLeaderboard[0], batchLeaderboard[2]].map((student) => {
                const isFirst = student.rank === 1;
                const medal = isFirst
                  ? "bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-950 ring-amber-300/60"
                  : student.rank === 2
                  ? "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 ring-white/40"
                  : "bg-gradient-to-br from-amber-500 to-orange-600 text-white ring-amber-500/40";
                return (
                  <div className="flex flex-col items-center text-center" key={student.name}>
                    <span
                      className={`grid place-items-center rounded-full font-extrabold ring-2 shadow-xs ${
                        isFirst ? "size-14 text-base" : "size-11 text-xs"
                      } ${medal}`}
                    >
                      {student.name.split(" ").map((part) => part[0]).join("")}
                    </span>
                    <p className="mt-2 line-clamp-1 text-[11px] font-bold text-white">{student.name}</p>
                    <p className="line-clamp-1 max-w-full text-[9px] font-medium text-white/70">{student.college}</p>
                    <p className="mt-0.5 text-[11px] font-extrabold text-amber-300">
                      {BanglaNameHelper.toBanglaNumeral(student.score)} গড়
                    </p>
                    <div
                      className={`mt-2 flex w-full items-start justify-center rounded-t-xl bg-white/15 pt-1.5 ring-1 ring-white/10 ${
                        isFirst ? "h-20" : student.rank === 2 ? "h-14" : "h-11"
                      }`}
                    >
                      <span className="text-xl font-black">{BanglaNameHelper.toBanglaNumeral(student.rank)}</span>
                      <span className="mt-0.5 text-[9px] font-bold opacity-80">{isFirst ? "ম" : "য়"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-2.5 text-sm font-bold text-neutral-900 dark:text-white">সকল শিক্ষার্থী</h2>
            <div className="overflow-hidden rounded-2xl bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] shadow-xs">
              <div className="flex items-center gap-3 border-b border-[#E2E8F0] dark:border-[#232738] bg-neutral-50 dark:bg-neutral-800/50 px-3.5 py-2 text-[10px] font-bold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                <span className="w-10">র‍্যাংক</span>
                <span className="flex-1">শিক্ষার্থী</span>
                <span>গড় নম্বর</span>
              </div>
              {batchLeaderboard.slice(3).map((student) => (
                <div
                  className={`flex items-center gap-3 border-b border-[#E2E8F0] dark:border-[#232738] px-3.5 py-2.5 last:border-b-0 ${
                    student.name === "You" ? "bg-emerald-50/60 dark:bg-emerald-950/30" : ""
                  }`}
                  key={student.name}
                >
                  <span className="grid size-7 place-items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-700 dark:text-neutral-300">
                    #{BanglaNameHelper.toBanglaNumeral(student.rank)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-neutral-900 dark:text-white">{student.name}</span>
                    <span className="block truncate text-[10px] text-neutral-500">{student.college}</span>
                  </span>
                  <span className="text-xs font-extrabold text-[#004633] dark:text-emerald-400">
                    {BanglaNameHelper.toBanglaNumeral(student.score)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUB-PAGE: PRACTICE
  // ─────────────────────────────────────────────────────────────
  if (currentView === "practice") {
    return (
      <PracticeSubPage onBack={() => setCurrentView("dashboard")} onStartCustomExam={handleStartToday} />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUB-PAGE: MATERIALS
  // ─────────────────────────────────────────────────────────────
  if (currentView === "materials") {
    return (
      <MaterialsSubPage onBack={() => setCurrentView("dashboard")} onOpenRoutine={onOpenRoutine} />
    );
  }

  // ─────────────────────────────────────────────────────────────
  // SUB-PAGE: MENTOR SUPPORT / DOUBTS
  // ─────────────────────────────────────────────────────────────
  if (currentView === "mentor") {
    return (
      <div className="mx-auto min-h-screen w-full max-w-md bg-neutral-50/50 dark:bg-[#0B0F19] pb-10 sm:rounded-[28px] font-['HindSiliguri',sans-serif]">
        <header className="flex items-center gap-3.5 px-4 pb-4 pt-5">
          <button
            aria-label="পেছনে যান"
            className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] text-neutral-700 dark:text-neutral-300 shadow-xs transition hover:border-[#004633] hover:text-[#004633] cursor-pointer"
            onClick={() => setCurrentView("dashboard")}
            type="button"
          >
            <ChevronRight className="size-5 rotate-180" />
          </button>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#004633] dark:text-emerald-400">GKE ব্যাচ ০১</p>
            <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Mentor Support</h1>
          </div>
        </header>

        <section className="px-4">
          {mentorSubmitted ? (
            <div className="py-10 text-center rounded-2xl bg-white dark:bg-[#13151F] p-6 shadow-xs border border-[#E2E8F0] dark:border-[#232738]">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#004633] dark:text-emerald-400 mx-auto flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">ডাউট সফলভাবে জমা হয়েছে!</h3>
              <p className="text-xs text-neutral-500 mt-1">আমাদের মেডিকেল মেন্টর টিম দ্রুত আপনার প্রশ্নের উত্তর ও সঠিক ব্যাখ্যা যুক্ত করে দেবে।</p>
              <button
                type="button"
                onClick={() => {
                  setMentorSubmitted(false);
                  setMentorDoubt("");
                  setCurrentView("dashboard");
                }}
                className="mt-5 px-5 py-2.5 rounded-xl bg-[#004633] hover:bg-[#003628] text-white font-bold text-xs shadow-xs cursor-pointer"
              >
                ড্যাশবোর্ডে ফিরুন
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#13151F] p-4.5 shadow-xs border border-[#E2E8F0] dark:border-[#232738] space-y-4">
              <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#004633] dark:text-teal-300 text-xs font-medium leading-relaxed border border-[#004633]/15">
                💡 সাধারণ জ্ঞান বা ইংরেজির যেকোনো প্রশ্নে কোনো বিভ্রান্তি বা ডাউট থাকলে লিখে সাবমিট করুন। আমাদের মেডিকেল মেন্টররা সরাসরি সমাধান দিবেন।
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-neutral-300 mb-1.5">আপনার প্রশ্ন বা ডাউট লিখুন:</label>
                <textarea
                  rows={4}
                  value={mentorDoubt}
                  onChange={(e) => setMentorDoubt(e.target.value)}
                  placeholder="যেমন: MT-01 এর ১২ নম্বর প্রশ্নে মুক্তিযুদ্ধ বিষয়ক তথ্যের ব্যাখ্যা..."
                  className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-[#181A24] border border-[#E2E8F0] dark:border-[#232738] text-xs text-neutral-900 dark:text-white outline-none focus:border-[#004633] dark:focus:border-emerald-500"
                />
              </div>
              <button
                type="button"
                disabled={!mentorDoubt.trim()}
                onClick={() => setMentorSubmitted(true)}
                className="w-full py-2.5 rounded-xl bg-[#004633] hover:bg-[#003628] text-white font-bold text-xs disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                ডাউট সাবমিট করুন
              </button>
            </div>
          )}
        </section>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN DASHBOARD (EXAM DASHBOARD)
  // Styled strictly with Obhyash App Design System
  // ─────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-neutral-50/50 dark:bg-[#0B0F19] pb-10 sm:min-h-0 sm:rounded-[28px] font-['HindSiliguri',sans-serif]">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: আসন্ন পরীক্ষা (TODAY & TOMORROW IN THE SAME ROW)
          Obhyash themed cards matching sketch
         ───────────────────────────────────────────────────────────── */}
      <section className="px-4 pt-3" aria-labelledby="upcoming-title">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#004633] dark:bg-emerald-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white" id="upcoming-title">
              আসন্ন পরীক্ষা (Model Test)
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenRoutine}
            className="text-xs font-semibold text-[#004633] dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <span>সম্পূর্ণ রুটিন</span>
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* ── CARD 1: TODAY ── */}
          <div className="rounded-2xl bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            {/* Red Curved Header Banner */}
            <div className="bg-[#BE123C] text-white py-2 px-2.5 flex items-center justify-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-xs font-extrabold tracking-wide uppercase">Today (আজ)</span>
            </div>

            {/* Card Content */}
            <div className="p-3 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="text-lg font-black text-center text-neutral-900 dark:text-white tracking-tight">
                  {extractExamCode(todayExam, "MT-01")}
                </h3>
                <p className="mt-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 text-center line-clamp-3 leading-snug">
                  {cleanSyllabusPreview(
                    todayExam?.description,
                    "প্রাচীন ও মধ্যযুগে বাংলার ইতিহাস, Noun, Determiners, Article, Number, Gender"
                  )}
                </p>

                {/* Details Pills */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg px-2 py-1">
                    <span>তারিখ:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      {todayExam
                        ? `${BanglaNameHelper.toBanglaNumeral(new Date(todayExam.start_time).getDate())} নভেম্বর`
                        : "৩ নভেম্বর"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg px-2 py-1">
                    <span>সময়:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">সন্ধ্যা ৬টা - ১২টা</strong>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg px-2 py-1">
                    <span>সময়সীমা:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      {BanglaNameHelper.toBanglaNumeral(todayExam?.duration_minutes || 30)} মিনিট
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Button: Directly opens real exam details & session */}
              <button
                type="button"
                onClick={handleStartToday}
                className="mt-3 w-full py-2 px-2.5 rounded-xl bg-[#004633] hover:bg-[#003628] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Zap size={13} className="text-amber-300" />
                <span>পরীক্ষা দিন</span>
              </button>
            </div>
          </div>

          {/* ── CARD 2: TOMORROW ── */}
          <div className="rounded-2xl bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            {/* Teal/Brand Curved Header Banner */}
            <div className="bg-[#0F766E] text-white py-2 px-2.5 flex items-center justify-center gap-1.5">
              <Calendar size={13} className="text-teal-200" />
              <span className="text-xs font-extrabold tracking-wide uppercase">Tomorrow (আগামীকাল)</span>
            </div>

            {/* Card Content */}
            <div className="p-3 flex flex-col flex-1 justify-between">
              <div>
                <h3 className="text-lg font-black text-center text-neutral-900 dark:text-white tracking-tight">
                  {extractExamCode(tomorrowExam, "MT-02")}
                </h3>
                <p className="mt-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 text-center line-clamp-3 leading-snug">
                  {cleanSyllabusPreview(
                    tomorrowExam?.description,
                    "ব্রিটিশ শাসন, ভাষা আন্দোলন, Pronoun & Classification, Uses of Pronoun"
                  )}
                </p>

                {/* Details Pills */}
                <div className="mt-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg px-2 py-1">
                    <span>তারিখ:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      {tomorrowExam
                        ? `${BanglaNameHelper.toBanglaNumeral(new Date(tomorrowExam.start_time).getDate())} নভেম্বর`
                        : "৪ নভেম্বর"}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg px-2 py-1">
                    <span>সময়:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">সন্ধ্যা ৬টা - ১২টা</strong>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-medium text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/60 rounded-lg px-2 py-1">
                    <span>সময়সীমা:</span>
                    <strong className="text-neutral-800 dark:text-neutral-200">
                      {BanglaNameHelper.toBanglaNumeral(tomorrowExam?.duration_minutes || 30)} মিনিট
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Button: Opens exam details & syllabus */}
              <button
                type="button"
                onClick={() => {
                  const examToOpen = tomorrowExam || allExams[1] || allExams[0];
                  onSelectExam({
                    id: examToOpen.id,
                    title: examToOpen.title,
                    status: examToOpen.userAttemptStatus === "submitted" ? "taken" : "untaken",
                  });
                }}
                className="mt-3 w-full py-2 px-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-neutral-200/80 dark:border-neutral-700 cursor-pointer active:scale-[0.98]"
              >
                <BookOpen size={13} className="text-neutral-500 dark:text-neutral-400" />
                <span>সিলেবাস দেখুন</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: সব সুবিধা (FEATURE GRID - 2 PER ROW)
          Clean Obhyash cards with semantic pastels
         ───────────────────────────────────────────────────────────── */}
      <section className="mt-6 px-4" aria-labelledby="explore-title">
        <div className="mb-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles size={15} className="text-[#004633] dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white" id="explore-title">
              GKE ব্যাচ সুবিধা ও কন্ট্রোল
            </h2>
          </div>
          <span className="text-[11px] font-medium text-neutral-400">৮টি ফিচার</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.target === "exam") {
                    // Attend Exam opens the identical model tests page with All/Ongoing/Upcoming tabs & test cards
                    setCurrentView("exams_list");
                  } else if (item.target === "model_tests") {
                    // Model Tests also opens the model test list page
                    setCurrentView("exams_list");
                  } else if (item.target === "leaderboard") {
                    setCurrentView("leaderboard");
                  } else if (item.target === "practice") {
                    setCurrentView("practice");
                  } else if (item.target === "history") {
                    if (onOpenHistory) onOpenHistory();
                    else handleStartToday();
                  } else if (item.target === "mentor") {
                    setCurrentView("mentor");
                  } else if (item.target === "random") {
                    setCurrentView("practice");
                  } else if (item.target === "materials") {
                    setCurrentView("materials");
                  }
                }}
                className="group relative flex flex-col justify-between rounded-2xl bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] p-3.5 text-left shadow-xs hover:border-[#004633]/40 dark:hover:border-emerald-500/40 hover:shadow-sm transition-all cursor-pointer active:scale-[0.98]"
              >
                {/* Top: Icon & Badge */}
                <div className="flex items-center justify-between">
                  <div className={cn("size-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105", item.iconBg)}>
                    <IconComponent className={cn("size-5", item.iconColor)} />
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Bottom: Label, Subtitle & Arrow */}
                <div className="mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-[#004633] dark:group-hover:text-emerald-400 transition-colors">
                      {item.label}
                    </span>
                    <ChevronRight size={14} className="text-neutral-400 group-hover:text-[#004633] dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="mt-0.5 text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-1">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
};

// ─────────────────────────────────────────────────────────────
// SUB-PAGE: CUSTOM PRACTICE
// ─────────────────────────────────────────────────────────────
function PracticeSubPage({ onBack, onStartCustomExam }: { onBack: () => void; onStartCustomExam: () => void }) {
  const [selectedSubjects, setSelectedSubjects] = useState(["বাংলাদেশ বিষয়াবলি", "আন্তর্জাতিক বিষয়াবলি", "ইংরেজি"]);
  const [questions, setQuestions] = useState("50");
  const [customQuestions, setCustomQuestions] = useState("");
  const [duration, setDuration] = useState("30");
  const [customDuration, setCustomDuration] = useState("");
  const [mode, setMode] = useState("Exam Mode");
  const [negativeMarking, setNegativeMarking] = useState(true);
  const [created, setCreated] = useState(false);

  const questionCount = questions === "custom" ? customQuestions : questions;
  const hasValidQuestions = Number(questionCount) >= 1 && Number(questionCount) <= 200;
  const durationMinutes = duration === "custom" ? customDuration : duration;
  const hasValidDuration = Number(durationMinutes) >= 1 && Number(durationMinutes) <= 300;

  const toggleSubject = (subject: string) => {
    setCreated(false);
    setSelectedSubjects((current) =>
      current.includes(subject) ? current.filter((item) => item !== subject) : [...current, subject]
    );
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-neutral-50/50 dark:bg-[#0B0F19] pb-10 sm:rounded-[28px] font-['HindSiliguri',sans-serif]">
      <header className="flex items-center gap-3.5 px-4 pb-4 pt-5">
        <button
          aria-label="পেছনে যান"
          className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] text-neutral-700 dark:text-neutral-300 shadow-xs transition hover:border-[#004633] hover:text-[#004633] cursor-pointer"
          onClick={onBack}
          type="button"
        >
          <ChevronRight className="size-5 rotate-180" />
        </button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#004633] dark:text-emerald-400">GKE ব্যাচ ০১</p>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Custom Practice</h1>
        </div>
      </header>

      <form
        className="px-4"
        onSubmit={(event) => {
          event.preventDefault();
          setCreated(true);
          onStartCustomExam();
        }}
      >
        <fieldset>
          <legend className="mb-2 text-xs font-bold text-neutral-900 dark:text-white">বিষয় নির্বাচন করুন</legend>
          <div className="flex flex-wrap gap-2">
            {["বাংলাদেশ বিষয়াবলি", "আন্তর্জাতিক বিষয়াবলি", "ইংরেজি"].map((subject) => {
              const active = selectedSubjects.includes(subject);
              return (
                <button
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    active
                      ? "border-[#004633] bg-[#004633] text-white shadow-xs"
                      : "border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] text-neutral-700 dark:text-neutral-300"
                  }`}
                  key={subject}
                  onClick={() => toggleSubject(subject)}
                  type="button"
                >
                  {subject}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-neutral-700 dark:text-neutral-300">প্রশ্ন সংখ্যা</span>
            <select
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-white outline-none focus:border-[#004633]"
              onChange={(e) => {
                setQuestions(e.target.value);
                setCreated(false);
              }}
              value={questions}
            >
              {["25", "50", "75", "100"].map((val) => (
                <option key={val} value={val}>
                  {BanglaNameHelper.toBanglaNumeral(val)} টি প্রশ্ন
                </option>
              ))}
              <option value="custom">কাস্টম সংখ্যা</option>
            </select>
            {questions === "custom" && (
              <input
                className="mt-2 w-full rounded-xl border border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-white"
                onChange={(e) => setCustomQuestions(e.target.value)}
                placeholder="সংখ্যা লিখুন"
                type="number"
                value={customQuestions}
              />
            )}
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-neutral-700 dark:text-neutral-300">সময়সীমা</span>
            <select
              className="w-full rounded-xl border border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] px-3 py-2 text-xs font-semibold text-neutral-800 dark:text-white outline-none focus:border-[#004633]"
              onChange={(e) => {
                setDuration(e.target.value);
                setCreated(false);
              }}
              value={duration}
            >
              {["15", "30", "45", "60"].map((val) => (
                <option key={val} value={val}>
                  {BanglaNameHelper.toBanglaNumeral(val)} মিনিট
                </option>
              ))}
              <option value="custom">কাস্টম মিনিট</option>
            </select>
            {duration === "custom" && (
              <input
                className="mt-2 w-full rounded-xl border border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] px-3 py-1.5 text-xs font-semibold text-neutral-800 dark:text-white"
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="মিনিট লিখুন"
                type="number"
                value={customDuration}
              />
            )}
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold text-neutral-900 dark:text-white">মোড নির্বাচন</legend>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "Exam Mode", label: "Exam Mode", desc: "টাইমার সহ রিয়েল টেস্ট" },
              { id: "Practice Mode", label: "Practice Mode", desc: "উত্তর সাথে সাথে দেখুন" },
            ].map((item) => (
              <button
                className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                  mode === item.id
                    ? "border-[#004633] bg-emerald-50/60 dark:bg-emerald-950/30 text-[#004633] dark:text-emerald-300"
                    : "border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] text-neutral-600 dark:text-neutral-400"
                }`}
                key={item.id}
                onClick={() => {
                  setMode(item.id);
                  setCreated(false);
                }}
                type="button"
              >
                <span className="block text-xs font-extrabold">{item.label}</span>
                <span className="mt-0.5 block text-[10px] font-medium opacity-75">{item.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <label className="mt-4 flex items-center justify-between rounded-xl bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] p-3 cursor-pointer">
          <span>
            <span className="block text-xs font-bold text-neutral-900 dark:text-white">নেগেটিভ মার্কিং</span>
            <span className="mt-0.5 block text-[10px] text-neutral-500">প্রতি ভুল উত্তরের জন্য ০.২৫ নম্বর কাটা যাবে</span>
          </span>
          <input
            checked={negativeMarking}
            className="size-4.5 accent-[#004633]"
            onChange={(e) => {
              setNegativeMarking(e.target.checked);
              setCreated(false);
            }}
            type="checkbox"
          />
        </label>

        <button
          className="mt-5 w-full rounded-xl bg-[#004633] hover:bg-[#003628] px-4 py-3 text-xs font-extrabold text-white shadow-xs transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          disabled={!selectedSubjects.length || !hasValidQuestions || !hasValidDuration}
          type="submit"
        >
          অনুশীলন পরীক্ষা শুরু করুন
        </button>
        {created && (
          <p className="mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-3 py-2 text-center text-xs font-bold text-emerald-800 dark:text-emerald-300">
            {BanglaNameHelper.toBanglaNumeral(questionCount)} টি প্রশ্ন • {BanglaNameHelper.toBanglaNumeral(durationMinutes)} মিনিট মক টেস্ট প্রস্তুত।
          </p>
        )}
      </form>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
// SUB-PAGE: MATERIALS
// ─────────────────────────────────────────────────────────────
function MaterialsSubPage({ onBack, onOpenRoutine }: { onBack: () => void; onOpenRoutine: () => void }) {
  const [activeTab, setActiveTab] = useState<"solve" | "practice">("solve");

  return (
    <main className="mx-auto min-h-screen w-full max-w-md bg-neutral-50/50 dark:bg-[#0B0F19] pb-10 sm:rounded-[28px] font-['HindSiliguri',sans-serif]">
      <header className="flex items-center gap-3.5 px-4 pb-4 pt-5">
        <button
          aria-label="পেছনে যান"
          className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] dark:border-[#232738] bg-white dark:bg-[#13151F] text-neutral-700 dark:text-neutral-300 shadow-xs transition hover:border-[#004633] hover:text-[#004633] cursor-pointer"
          onClick={onBack}
          type="button"
        >
          <ChevronRight className="size-5 rotate-180" />
        </button>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#004633] dark:text-emerald-400">GKE ব্যাচ ০১</p>
          <h1 className="text-lg font-bold text-neutral-900 dark:text-white">Materials ও শিট</h1>
        </div>
      </header>

      <section className="px-4">
        <div className="grid grid-cols-2 rounded-xl bg-neutral-200/70 dark:bg-[#181A24] p-1">
          {[
            ["solve", "Solve Sheets"],
            ["practice", "Practice Sheets"],
          ].map(([id, label]) => (
            <button
              aria-selected={activeTab === id}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition cursor-pointer ${
                activeTab === id
                  ? "bg-white dark:bg-[#13151F] text-[#004633] dark:text-emerald-400 shadow-xs"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
              }`}
              key={id}
              onClick={() => setActiveTab(id as "solve" | "practice")}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3.5 space-y-2.5">
          {materialSheets[activeTab].map((sheet) => (
            <button
              className="flex w-full items-center gap-3 rounded-2xl bg-white dark:bg-[#13151F] border border-[#E2E8F0] dark:border-[#232738] p-3 text-left shadow-xs hover:border-[#004633]/40 transition hover:-translate-y-0.5 cursor-pointer"
              key={sheet.title}
              onClick={onOpenRoutine}
              type="button"
            >
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                  activeTab === "solve"
                    ? "bg-teal-50 dark:bg-teal-950/50 text-[#004633] dark:text-teal-300"
                    : "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
                }`}
              >
                <BookOpen size={18} />
              </div>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-bold text-neutral-900 dark:text-white">{sheet.title}</span>
                <span className="mt-0.5 block truncate text-[11px] text-neutral-500">{sheet.meta}</span>
              </span>
              <ChevronRight className="size-4 text-neutral-400" />
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}

export default GkeBatchDashboardView;
