"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ChevronRight,
  Award,
  Zap,
  Clock,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Play,
} from "lucide-react";
import { supabase } from "@/services/core";
import LiveExamCategoryView from "./LiveExamCategoryView";
import LiveExamHistoryPageView from "./LiveExamHistoryPageView";
import LiveExamDetailsView from "./LiveExamDetailsView";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/student/ui/layout/AppLayout";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { LiveExam } from "@/lib/types";

export interface LiveExamViewProps {
  commonLayoutProps: any;
}

interface CategoryInfo {
  key: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  svgAsset: string;
  solidBg: string;
  accentColor: string;
  hasLive: boolean;
  countText?: string;
}

export const LiveExamView: React.FC<LiveExamViewProps> = ({ commonLayoutProps }) => {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExam, setSelectedExam] = useState<{
    id: string;
    title: string;
    status: "untaken" | "taken";
  } | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [liveExamsMap, setLiveExamsMap] = useState<Record<string, boolean>>({});
  const [ongoingExams, setOngoingExams] = useState<(LiveExam & { userAttemptStatus?: string })[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<(LiveExam & { userAttemptStatus?: string })[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [now, setNow] = useState<Date>(new Date());

  // Real-time countdown timer tick every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch ongoing live exams, upcoming exams, and active category flags
  const fetchLiveStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const currentTime = new Date().toISOString();

      // 1. Fetch Ongoing Exams
      const { data: ongoingData, error: ongoingErr } = await supabase
        .from("live_exams")
        .select(`*, total_questions:live_exam_questions(count)`)
        .eq("status", "published")
        .lte("start_time", currentTime)
        .gte("end_time", currentTime)
        .order("start_time", { ascending: true });

      if (ongoingErr) {
        console.warn("[LiveExamView] Error fetching ongoing exams:", ongoingErr);
      }

      // 2. Fetch Upcoming Exams
      const { data: upcomingData, error: upcomingErr } = await supabase
        .from("live_exams")
        .select(`*, total_questions:live_exam_questions(count)`)
        .eq("status", "published")
        .gt("start_time", currentTime)
        .order("start_time", { ascending: true })
        .limit(6);

      if (upcomingErr) {
        console.warn("[LiveExamView] Error fetching upcoming exams:", upcomingErr);
      }

      // 3. User attempts mapping for these exams
      const allFetched = [...(ongoingData || []), ...(upcomingData || [])];
      const attemptsMap: Record<string, string> = {};

      if (profile?.id && allFetched.length > 0) {
        const examIds = allFetched.map((e) => e.id);
        const { data: attempts } = await supabase
          .from("live_exam_attempts")
          .select("live_exam_id, status")
          .eq("user_id", profile.id)
          .in("live_exam_id", examIds);

        if (attempts) {
          attempts.forEach((a: any) => {
            attemptsMap[a.live_exam_id] = a.status;
          });
        }
      }

      const map: Record<string, boolean> = {};

      const parsedOngoing = (ongoingData || []).map((e: any) => {
        const cat = (e.category || "").toLowerCase();
        map[cat] = true;
        if (cat === "varsity_a" || cat === "all") map.varsity = true;
        if (cat === "all") {
          map.engineering = true;
          map.medical = true;
          map.hsc = true;
          map.ssc_board = true;
          map.ssc_school = true;
          map.ssc_science = true;
          map.ssc_business = true;
          map.ssc_humanities = true;
          map.ssc_compulsory = true;
        }
        return {
          ...e,
          total_questions: e.total_questions?.[0]?.count || e.total_questions || 50,
          userAttemptStatus: attemptsMap[e.id],
        };
      });

      const parsedUpcoming = (upcomingData || []).map((e: any) => ({
        ...e,
        total_questions: e.total_questions?.[0]?.count || e.total_questions || 50,
        userAttemptStatus: attemptsMap[e.id],
      }));

      setLiveExamsMap(map);
      setOngoingExams(parsedOngoing);
      setUpcomingExams(parsedUpcoming);
    } catch (err) {
      console.warn("[LiveExamView] Exception in fetchLiveStatus:", err);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    fetchLiveStatus();
  }, [fetchLiveStatus]);

  // Global Pull-to-Refresh listener
  useEffect(() => {
    const handleRefresh = () => {
      fetchLiveStatus();
    };
    window.addEventListener("app:refresh", handleRefresh);
    return () => window.removeEventListener("app:refresh", handleRefresh);
  }, [fetchLiveStatus]);

  // Stream & Level detection matching Flutter LiveExamMainView
  const isSSC =
    (profile?.stream?.toLowerCase().includes("ssc") ||
      profile?.level?.toLowerCase().includes("ssc")) ??
    false;
  const division = (profile?.division || "").toLowerCase().trim();

  const isBiz =
    division.includes("business") ||
    division.includes("commerce") ||
    division.includes("বাণিজ্য") ||
    division.includes("ব্যবসায়");
  const isHum =
    division.includes("humanities") ||
    division.includes("arts") ||
    division.includes("মানবিক");
  const isSci =
    division.includes("science") || division.includes("বিজ্ঞান");

  // Dynamic Category Cards matching Flutter LiveExamMainView
  let categories: CategoryInfo[] = [];

  if (isSSC) {
    categories = [
      {
        key: "medical",
        tag: "লাইভ চলছে",
        title: "মেডিকেল লাইভ টেস্ট",
        subtitle: "মেগা লাইভ মডেল টেস্ট",
        description: "সরকারি মেডিকেল ও ডেন্টাল স্ট্যান্ডার্ড পূর্ণাঙ্গ পরীক্ষা",
        svgAsset: "/images/subjects/medical.svg",
        solidBg: "bg-[#BE123C]", // Deep Red
        accentColor: "#FFE4E6",
        hasLive: !!liveExamsMap.medical,
        countText: "৩০টি টেস্ট",
      },
      {
        key: "engineering",
        tag: "ইঞ্জিনিয়ারিং",
        title: "ইঞ্জিনিয়ারিং টেস্ট",
        subtitle: "বুয়েট • কুয়েট • রুয়েট",
        description: "ইঞ্জিনিয়ারিং স্ট্যান্ডার্ড জাতীয় লাইভ পরীক্ষা",
        svgAsset: "/images/subjects/engineering.svg",
        solidBg: "bg-[#0E7490]", // Deep Cyan
        accentColor: "#CFFAFE",
        hasLive: !!liveExamsMap.engineering,
        countText: "৩২টি টেস্ট",
      },
      {
        key: "varsity",
        tag: "ভার্সিটি",
        title: "ভার্সিটি ক-ইউনিট",
        subtitle: "ঢাকা বিশ্ববিদ্যালয় • গুচ্ছ",
        description: "সকল বিশ্ববিদ্যালয় ভর্তি প্রস্তুতি লাইভ পরীক্ষা",
        svgAsset: "/images/subjects/varsity_ka.svg",
        solidBg: "bg-[#6D28D9]", // Deep Purple
        accentColor: "#EDE9FE",
        hasLive: !!liveExamsMap.varsity,
        countText: "৩০টি টেস্ট",
      },
      {
        key: "all",
        tag: "সবগুলো",
        title: "সকল লাইভ পরীক্ষা",
        subtitle: "৯২টি মেগা মডেল টেস্ট",
        description: "চলমান ও নির্ধারিত সকল লাইভ পরীক্ষার পূর্ণাঙ্গ তালিকা",
        svgAsset: "/images/subjects/academic.svg",
        solidBg: "bg-[#0F766E]", // Deep Teal
        accentColor: "#CCFBF1",
        hasLive: ongoingExams.length > 0,
        countText: "৯২টি পরীক্ষা",
      },
      {
        key: "ssc_board",
        tag: "বোর্ড স্পেশাল",
        title: "বোর্ড মডেল টেস্ট",
        subtitle: "এসএসসি পূর্ণাঙ্গ মডেল",
        description: "সকল শিক্ষা বোর্ডের স্ট্যান্ডার্ড মেগা লাইভ টেস্ট",
        svgAsset: "/dashboard-icons/exam_pencil.svg",
        solidBg: "bg-[#1D4ED8]",
        accentColor: "#DBEAFE",
        hasLive: !!liveExamsMap.ssc_board,
      },
      {
        key: "ssc_school",
        tag: "শীর্ষ স্কুল",
        title: "শীর্ষ স্কুল ও ক্যাডেট",
        subtitle: "টেস্ট পরীক্ষা স্পেশাল",
        description: "আইডিয়াল • ভিকারুননিসা • রাজউক • ক্যাডেট টেস্ট",
        svgAsset: "/images/subjects/varsity_ka.svg",
        solidBg: "bg-[#047857]",
        accentColor: "#D1FAE5",
        hasLive: !!liveExamsMap.ssc_school,
      },
      ...(isBiz
        ? [
            {
              key: "ssc_business",
              tag: "ব্যবসায় শিক্ষা",
              title: "বাণিজ্য লাইভ টেস্ট",
              subtitle: "হিসাববিজ্ঞান • ফিন্যান্স",
              description: "ব্যবসায় শিক্ষা বিভাগের মেগা লাইভ পরীক্ষা",
              svgAsset: "/dashboard-icons/account_card.svg",
              solidBg: "bg-[#C2410C]",
              accentColor: "#FFEDD5",
              hasLive: !!liveExamsMap.ssc_business,
            },
          ]
        : isHum
        ? [
            {
              key: "ssc_humanities",
              tag: "মানবিক বিভাগ",
              title: "মানবিক লাইভ টেস্ট",
              subtitle: "ইতিহাস • ভূগোল • পৌরনীতি",
              description: "মানবিক বিভাগের স্পেশাল লাইভ পরীক্ষা",
              svgAsset: "/images/subjects/textbook.svg",
              solidBg: "bg-[#701A75]",
              accentColor: "#FCE7F3",
              hasLive: !!liveExamsMap.ssc_humanities,
            },
          ]
        : [
            {
              key: "ssc_science",
              tag: "বিজ্ঞান বিভাগ",
              title: "বিজ্ঞান লাইভ টেস্ট",
              subtitle: "পদার্থ • রসায়ন • গণিত • জীব",
              description: "বিজ্ঞান বিভাগের শিক্ষার্থীদের অধ্যায়ভিত্তিক পরীক্ষা",
              svgAsset: "/images/subjects/engineering.svg",
              solidBg: "bg-[#047857]",
              accentColor: "#D1FAE5",
              hasLive: !!liveExamsMap.ssc_science,
            },
          ]),
      {
        key: "ssc_compulsory",
        tag: "আবশ্যিক বিষয়",
        title: "আবশ্যিক লাইভ টেস্ট",
        subtitle: "বাংলা • ইংরেজি • গণিত • আইসিটি",
        description: "সকল বিভাগের শিক্ষার্থীদের জন্য আবশ্যকীয় মেগা টেস্ট",
        svgAsset: "/images/subjects/academic.svg",
        solidBg: "bg-[#991B1B]",
        accentColor: "#FEE2E2",
        hasLive: !!liveExamsMap.ssc_compulsory,
      },
    ];
  } else {
    // HSC / Admission Categories
    categories = [
      {
        key: "medical",
        tag: "লাইভ চলছে",
        title: "মেডিকেল",
        subtitle: "মডেল টেস্ট",
        description: "মেডিকেল ও ডেন্টাল সরকারি ভর্তি প্রস্তুতি",
        svgAsset: "/images/subjects/medical.svg",
        solidBg: "bg-[#BE123C]", // Deep Red
        accentColor: "#FFE4E6",
        hasLive: !!liveExamsMap.medical,
        countText: "৩০টি টেস্ট",
      },
      {
        key: "engineering",
        tag: "ইঞ্জিনিয়ারিং",
        title: "ইঞ্জিনিয়ারিং",
        subtitle: "মডেল টেস্ট",
        description: "বুয়েট • কুয়েট • রুয়েট • চুয়েট • আইইউটি",
        svgAsset: "/images/subjects/engineering.svg",
        solidBg: "bg-[#0E7490]", // Deep Cyan
        accentColor: "#CFFAFE",
        hasLive: !!liveExamsMap.engineering,
        countText: "৩২টি টেস্ট",
      },
      {
        key: "varsity",
        tag: "ভার্সিটি",
        title: "ভার্সিটি ক-ইউনিট",
        subtitle: "মডেল টেস্ট",
        description: "ঢাকা বিশ্ববিদ্যালয় • জিএসটি গুচ্ছ • জাবি",
        svgAsset: "/images/subjects/varsity_ka.svg",
        solidBg: "bg-[#6D28D9]", // Deep Purple
        accentColor: "#EDE9FE",
        hasLive: !!liveExamsMap.varsity,
        countText: "৩০টি টেস্ট",
      },
      {
        key: "all",
        tag: "সবগুলো",
        title: "সকল লাইভ পরীক্ষা",
        subtitle: "পূর্ণাঙ্গ তালিকা",
        description: "সকল চলমান, আসন্ন ও পূর্বের মেগা লাইভ টেস্ট",
        svgAsset: "/images/subjects/academic.svg",
        solidBg: "bg-[#0F766E]", // Deep Teal
        accentColor: "#CCFBF1",
        hasLive: ongoingExams.length > 0,
        countText: "৯২টি পরীক্ষা",
      },
      {
        key: "hsc",
        tag: "এইচএসসি",
        title: "এইচএসসি স্পেশাল",
        subtitle: "অধ্যায়ভিত্তিক টেস্ট",
        description: "বিজ্ঞান বিভাগ বোর্ড প্রশ্ন ও পূর্ণাঙ্গ প্রস্তুতি",
        svgAsset: "/images/subjects/academic.svg",
        solidBg: "bg-[#047857]", // Deep Green
        accentColor: "#D1FAE5",
        hasLive: !!liveExamsMap.hsc,
      },
    ];
  }

  const hasAnyLive = ongoingExams.length > 0 || categories.some((c) => c.hasLive);
  const activeOngoingExam = ongoingExams[0];

  // Helper for live countdown formatting
  const formatCountdown = (endTimeStr: string) => {
    const end = new Date(endTimeStr);
    const diffMs = end.getTime() - now.getTime();
    if (diffMs <= 0) return "পরীক্ষা শেষ";

    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;

    if (hours > 0) {
      return `সময় বাকি: ${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
    }
    return `সময় বাকি: ${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
  };

  const formatUpcomingTime = (startTimeStr: string) => {
    const start = new Date(startTimeStr);
    const diffMs = start.getTime() - now.getTime();
    if (diffMs <= 0) return "এখনই শুরু হচ্ছে";

    const totalSecs = Math.floor(diffMs / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${BanglaNameHelper.toBanglaNumeral(days)} দিন বাকি`;
    }
    if (hours > 0) {
      return `${BanglaNameHelper.toBanglaNumeral(hours)} ঘণ্টা ${BanglaNameHelper.toBanglaNumeral(mins)} মি. বাকি`;
    }
    return `${BanglaNameHelper.toBanglaNumeral(mins)} মিনিট বাকি`;
  };

  // If user selected a specific exam directly (e.g. from Hero Banner)
  if (selectedExam) {
    return (
      <LiveExamDetailsView
        examId={selectedExam.id}
        examTitle={selectedExam.title}
        status={selectedExam.status}
        commonLayoutProps={commonLayoutProps}
        onBack={() => {
          setSelectedExam(null);
          fetchLiveStatus();
        }}
      />
    );
  }

  // If user opened my history/performance view
  if (showHistory) {
    return (
      <AppLayout
        activeTab="live_exam"
        {...commonLayoutProps}
        title="আমার লাইভ পরীক্ষার ফলাফল"
        onBack={() => setShowHistory(false)}
      >
        <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-6 pb-28 font-['HindSiliguri']">
          <LiveExamHistoryPageView onBack={() => setShowHistory(false)} />
        </div>
      </AppLayout>
    );
  }

  // If a category is selected, render the Category Listing View
  if (selectedCategory) {
    return (
      <LiveExamCategoryView
        category={selectedCategory}
        commonLayoutProps={commonLayoutProps}
        onBack={() => {
          setSelectedCategory(null);
          fetchLiveStatus();
        }}
      />
    );
  }

  return (
    <AppLayout
      activeTab="live_exam"
      {...commonLayoutProps}
      title="লাইভ মডেল টেস্ট"
      onBack={() => {
        if (commonLayoutProps?.onTabChange) {
          commonLayoutProps.onTabChange("dashboard");
        }
      }}
    >
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-28 font-['HindSiliguri']">
        {/* Top Header Bar with Live Indicator & 'আমার ফলাফল' Button */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            {hasAnyLive && (
              <div className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                <span className="text-[11px] font-bold text-rose-500">
                  লাইভ পরীক্ষা চলছে
                </span>
              </div>
            )}
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 hidden sm:inline">
              মোট ৯২টি মেগা লাইভ টেস্ট
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#14151B] border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-xs font-semibold text-neutral-900 dark:text-white transition-all shadow-xs cursor-pointer ml-auto"
            title="আমার লাইভ পরীক্ষার ফলাফল ও মেধা তালিকা দেখুন"
          >
            <Award className="w-4 h-4 text-amber-500" />
            <span>আমার ফলাফল</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 1. ONGOING LIVE EXAM HERO CARD (Prominently displayed whenever exam is live) */}
        {/* ========================================================================= */}
        {activeOngoingExam ? (
          <div className="mb-6 rounded-[22px] bg-gradient-to-br from-[#7F1D1D] via-[#450A0A] to-[#1C0505] text-white p-5 sm:p-6 border-2 border-rose-500/50 shadow-[0_10px_35px_rgba(225,29,72,0.3)] relative overflow-hidden transition-all">
            {/* Ambient background glow */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-rose-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-36 h-36 rounded-full bg-rose-600/15 blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Badge row */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-rose-500 text-white flex items-center gap-1.5 shadow-sm text-xs font-bold tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>চলমান লাইভ পরীক্ষা</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[11px] font-semibold text-white/95">
                    {activeOngoingExam.category === "medical"
                      ? "মেডিকেল স্পেশাল"
                      : activeOngoingExam.category === "engineering"
                      ? "ইঞ্জিনিয়ারিং"
                      : activeOngoingExam.category === "varsity"
                      ? "ভার্সিটি ক-ইউনিট"
                      : "মেগা লাইভ টেস্ট"}
                  </span>
                </div>

                {/* Real-time countdown */}
                <div className="px-3 py-1 rounded-full bg-black/40 border border-white/20 text-xs font-mono font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-300" />
                  <span>{formatCountdown(activeOngoingExam.end_time)}</span>
                </div>
              </div>

              {/* Title & Description */}
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1.5">
                {activeOngoingExam.title}
              </h2>
              <p className="text-xs sm:text-[13px] text-white/80 max-w-xl leading-relaxed mb-4">
                {activeOngoingExam.description ||
                  "জাতীয় পর্যায়ের সকল শিক্ষার্থীদের সাথে একসাথে রিয়েল-টাইম লাইভ পরীক্ষায় অংশগ্রহণ করে নিজের প্রস্তুতি যাচাই করুন।"}
              </p>

              {/* Exam Info Chips */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-5 text-xs text-white/90">
                <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 flex items-center gap-1.5">
                  <Clock size={13} />
                  <span>{BanglaNameHelper.toBanglaNumeral(activeOngoingExam.duration_minutes || 20)} মিনিট</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 flex items-center gap-1.5">
                  <Zap size={13} />
                  <span>{BanglaNameHelper.toBanglaNumeral(activeOngoingExam.total_questions || 50)} টি প্রশ্ন</span>
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 flex items-center gap-1.5">
                  <Award size={13} />
                  <span>{BanglaNameHelper.toBanglaNumeral(activeOngoingExam.total_marks || 50)} নম্বর</span>
                </div>
                {activeOngoingExam.negative_marking > 0 && (
                  <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 flex items-center gap-1.5 text-rose-200">
                    <span>-{BanglaNameHelper.toBanglaNumeral(activeOngoingExam.negative_marking)} নেগেটিভ</span>
                  </div>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="flex items-center gap-3">
                {activeOngoingExam.userAttemptStatus === "submitted" ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedExam({
                        id: activeOngoingExam.id,
                        title: activeOngoingExam.title,
                        status: "taken",
                      })
                    }
                    className="px-5 py-2.5 rounded-xl bg-white text-rose-800 hover:bg-neutral-100 font-bold text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>অংশগ্রহণ সম্পন্ন (ফলাফল দেখুন)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedExam({
                        id: activeOngoingExam.id,
                        title: activeOngoingExam.title,
                        status: "untaken",
                      })
                    }
                    className="px-6 py-2.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-black text-sm sm:text-base flex items-center gap-2 transition-all shadow-lg hover:shadow-xl cursor-pointer active:scale-95 group"
                  >
                    <Play size={16} className="fill-current text-rose-700 group-hover:scale-110 transition-transform" />
                    <span>এখনই পরীক্ষায় অংশ নিন</span>
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedCategory(activeOngoingExam.category)}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs sm:text-sm transition-all cursor-pointer"
                >
                  ক্যাটাগরি রুটিন
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Section Title */}
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
            ক্যাটাগরি অনুযায়ী পরীক্ষা
          </h2>
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className="text-xs font-semibold text-[#004633] dark:text-[#2DD4BF] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>সবগুলো দেখুন (৯২)</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 2. CATEGORY CARDS GRID */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-8">
          {categories.map((cat) => {
            return (
              <div
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "group relative rounded-[20px] cursor-pointer select-none transition-all duration-200 overflow-hidden flex flex-col justify-between",
                  "p-3.5 sm:p-4.5 min-h-[175px] sm:min-h-[195px]",
                  cat.solidBg,
                  "border",
                  cat.hasLive
                    ? "border-rose-400 shadow-[0_4px_22px_-2px_rgba(244,63,94,0.35)]"
                    : "border-white/20 hover:border-white/35 shadow-md hover:shadow-xl",
                  "hover:-translate-y-0.5 active:scale-[0.985]"
                )}
              >
                {/* Top-Right Ambient Glow */}
                <div
                  className="absolute -right-6 -top-6 w-24 h-24 rounded-full pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)`,
                  }}
                />

                <div>
                  {/* Top Row: Custom SVG Emblem + Tag / Live Badge */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Custom Icon Container */}
                    <div className="w-[42px] h-[42px] rounded-[13px] border border-white/30 bg-white/20 p-2 flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
                      <img
                        src={cat.svgAsset}
                        alt={cat.title}
                        className="w-full h-full object-contain brightness-0 invert"
                        loading="lazy"
                      />
                    </div>

                    {/* Status Badge */}
                    {cat.hasLive ? (
                      <div className="px-2.5 py-1 rounded-full bg-white text-rose-600 flex items-center gap-1.5 shrink-0 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse shadow-[0_0_6px_#f43f5e]" />
                        <span className="text-[10px] sm:text-[11px] font-bold text-rose-600 tracking-wider">
                          LIVE
                        </span>
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-md bg-white/20 border border-white/30 text-[10px] sm:text-[11px] font-semibold text-white shrink-0">
                        {cat.tag}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] sm:text-[16.5px] font-bold text-white tracking-tight line-clamp-1 mt-2.5 sm:mt-3">
                    {cat.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-[11.5px] sm:text-[12.5px] font-semibold text-white/90 line-clamp-1 mt-0.5">
                    {cat.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-[10.5px] sm:text-[11.5px] text-white/80 line-clamp-2 leading-[1.35] mt-1">
                    {cat.description}
                  </p>
                </div>

                {/* Bottom Action Row */}
                <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between">
                  <span className="text-[11px] sm:text-[12px] font-semibold text-white">
                    {cat.countText || (cat.hasLive ? "পরীক্ষায় যাও" : "পরীক্ষা শুরু")}
                  </span>

                  <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                    <ChevronRight size={13} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ========================================================================= */}
        {/* 3. UPCOMING LIVE EXAMS SECTION */}
        {/* ========================================================================= */}
        {upcomingExams.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#004633] dark:text-[#2DD4BF]" />
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white">
                  আসন্ন মেগা লাইভ টেস্ট
                </h2>
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                সিডিউল অনুযায়ী শুরু হবে
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {upcomingExams.slice(0, 4).map((exam) => {
                const startDate = new Date(exam.start_time);
                const isTaken = exam.userAttemptStatus === "submitted";

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
                    className="p-4 rounded-2xl bg-white dark:bg-[#14151B] border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
                          {exam.category === "medical"
                            ? "মেডিকেল"
                            : exam.category === "engineering"
                            ? "ইঞ্জিনিয়ারিং"
                            : exam.category === "varsity"
                            ? "ভার্সিটি ক-ইউনিট"
                            : "লাইভ টেস্ট"}
                        </span>

                        <span className="text-[11px] font-mono font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Clock size={11} />
                          {formatUpcomingTime(exam.start_time)}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-[15px] font-bold text-neutral-900 dark:text-white line-clamp-1 group-hover:text-[#004633] dark:group-hover:text-[#2DD4BF] transition-colors">
                        {exam.title}
                      </h4>

                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
                        <span>{BanglaNameHelper.toBanglaNumeral(exam.duration_minutes || 20)} মিনিট</span>
                        <span>•</span>
                        <span>{BanglaNameHelper.toBanglaNumeral(exam.total_marks || 50)} নম্বর</span>
                        <span>•</span>
                        <span>{BanglaNameHelper.toBanglaNumeral(exam.total_questions || 50)} টি প্রশ্ন</span>
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      <span>সিলেবাস ও নিয়মাবলী দেখুন</span>
                      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default LiveExamView;
