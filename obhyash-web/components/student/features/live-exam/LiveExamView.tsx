"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  HeartPulse,
  GraduationCap,
  BookOpen,
  Calendar,
  Zap,
  ArrowRight,
  Clock,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/services/core";
import LiveExamCategoryView from "./LiveExamCategoryView";
import LiveExamRoutineModal from "./LiveExamRoutineModal";
import { useAuth } from "@/components/auth/AuthProvider";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/student/ui/layout/AppLayout";

export interface LiveExamViewProps {
  commonLayoutProps: any;
}

interface CategoryInfo {
  key: string;
  tag: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  gradientDark: string;
  gradientLight: string;
  accentColor: string;
  shadowColor: string;
  hasLive: boolean;
}

interface OngoingExamSnippet {
  id: string;
  title: string;
  category: string;
  endTime: string;
  durationMinutes: number;
  totalQuestions: number;
}

export const LiveExamView: React.FC<LiveExamViewProps> = ({ commonLayoutProps }) => {
  const { user, profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [liveExamsMap, setLiveExamsMap] = useState<Record<string, boolean>>({});
  const [ongoingExam, setOngoingExam] = useState<OngoingExamSnippet | null>(null);
  const [isRoutineOpen, setIsRoutineOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [now, setNow] = useState<Date>(new Date());

  // 1-second interval for countdown timer
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch ongoing live exams and active category status
  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        const currentTime = new Date().toISOString();
        const { data, error } = await supabase
          .from("live_exams")
          .select("id, title, category, start_time, end_time, duration_minutes, total_questions")
          .lte("start_time", currentTime)
          .gte("end_time", currentTime)
          .order("end_time", { ascending: true });

        if (error) {
          console.warn("[LiveExamView] Error fetching live status:", error);
          return;
        }

        const map: Record<string, boolean> = {};

        if (data && data.length > 0) {
          // Set first ongoing live exam for the top featured hero banner
          const first = data[0];
          setOngoingExam({
            id: first.id,
            title: first.title,
            category: first.category,
            endTime: first.end_time,
            durationMinutes: first.duration_minutes || 25,
            totalQuestions: first.total_questions || 25,
          });

          data.forEach((e: any) => {
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
            }
          });
        } else {
          setOngoingExam(null);
        }

        setLiveExamsMap(map);
      } catch (err) {
        console.warn("[LiveExamView] Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveStatus();
  }, []);

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

  // Dynamic Category Cards
  let categories: CategoryInfo[] = [];

  if (isSSC) {
    categories = [
      {
        key: "ssc_board",
        tag: "বোর্ড স্পেশাল",
        title: "বোর্ড মডেল লাইভ টেস্ট",
        subtitle: "এসএসসি পূর্ণাঙ্গ মডেল",
        description: "সকল শিক্ষা বোর্ডের স্ট্যান্ডার্ড প্যাটার্নে মেগা লাইভ পরীক্ষা",
        icon: BookOpen,
        gradientDark: "from-[#064E3B] via-[#022C22] to-[#011812]",
        gradientLight: "from-[#059669] via-[#047857] to-[#065F46]",
        accentColor: "#34D399",
        shadowColor: "rgba(5, 150, 105, 0.25)",
        hasLive: !!liveExamsMap.ssc_board,
      },
      {
        key: "ssc_school",
        tag: "শীর্ষ স্কুল",
        title: "শীর্ষ স্কুল ও ক্যাডেট",
        subtitle: "টেস্ট পরীক্ষা স্পেশাল",
        description: "আইডিয়াল • ভিকারুননিসা • রাজউক • ক্যাডেট টেস্ট পরীক্ষা",
        icon: GraduationCap,
        gradientDark: "from-[#1E3A8A] via-[#172554] to-[#0F172A]",
        gradientLight: "from-[#2563EB] via-[#1D4ED8] to-[#1E40AF]",
        accentColor: "#60A5FA",
        shadowColor: "rgba(37, 99, 235, 0.25)",
        hasLive: !!liveExamsMap.ssc_school,
      },
      ...(isBiz
        ? [
            {
              key: "ssc_business",
              tag: "ব্যবসায় শিক্ষা",
              title: "বাণিজ্য লাইভ টেস্ট",
              subtitle: "হিসাববিজ্ঞান • উদ্যোগ • ফিন্যান্স",
              description: "ব্যবসায় শিক্ষা বিভাগের শিক্ষার্থীদের স্পেশাল লাইভ পরীক্ষা",
              icon: BookOpen,
              gradientDark: "from-[#78350F] via-[#451A03] to-[#290F02]",
              gradientLight: "from-[#D97706] via-[#B45309] to-[#92400E]",
              accentColor: "#FBBF24",
              shadowColor: "rgba(217, 119, 6, 0.25)",
              hasLive: !!liveExamsMap.ssc_business,
            },
          ]
        : isHum
        ? [
            {
              key: "ssc_humanities",
              tag: "মানবিক বিভাগ",
              title: "মানবিক লাইভ টেস্ট",
              subtitle: "ইতিহাস • ভূগোল • পৌরনীতি • অর্থনীতি",
              description: "মানবিক বিভাগের শিক্ষার্থীদের স্পেশাল লাইভ পরীক্ষা",
              icon: BookOpen,
              gradientDark: "from-[#581C87] via-[#3B0764] to-[#240342]",
              gradientLight: "from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]",
              accentColor: "#A78BFA",
              shadowColor: "rgba(124, 58, 237, 0.25)",
              hasLive: !!liveExamsMap.ssc_humanities,
            },
          ]
        : [
            {
              key: "ssc_science",
              tag: "বিজ্ঞান বিভাগ",
              title: "বিজ্ঞান লাইভ টেস্ট",
              subtitle: "পদার্থ • রসায়ন • গণিত • জীব",
              description: "বিজ্ঞান বিভাগের শিক্ষার্থীদের স্পেশাল লাইভ পরীক্ষা",
              icon: Cpu,
              gradientDark: "from-[#0E7490] via-[#155E75] to-[#083344]",
              gradientLight: "from-[#0891B2] via-[#0E7490] to-[#155E75]",
              accentColor: "#22D3EE",
              shadowColor: "rgba(8, 145, 178, 0.25)",
              hasLive: !!liveExamsMap.ssc_science,
            },
          ]),
      {
        key: "ssc_compulsory",
        tag: "আবশ্যিক বিষয়",
        title: "আবশ্যিক লাইভ টেস্ট",
        subtitle: "বাংলা • ইংরেজি • গণিত • আইসিটি",
        description: "সকল বিভাগের শিক্ষার্থীদের জন্য আবশ্যকীয় বিষয়ের মেগা টেস্ট",
        icon: BookOpen,
        gradientDark: "from-[#881337] via-[#4C0519] to-[#2E020D]",
        gradientLight: "from-[#E11D48] via-[#BE123C] to-[#9F1239]",
        accentColor: "#FB7185",
        shadowColor: "rgba(225, 29, 72, 0.25)",
        hasLive: !!liveExamsMap.ssc_compulsory,
      },
    ];
  } else {
    // HSC / Admission Categories
    categories = [
      {
        key: "engineering",
        tag: "ইঞ্জিনিয়ারিং",
        title: "ইঞ্জিনিয়ারিং",
        subtitle: "মডেল টেস্ট",
        description: "বুয়েট • কুয়েট • রুয়েট • চুয়েট • আইইউটি",
        icon: Cpu,
        gradientDark: "from-[#1E3A8A] via-[#172554] to-[#0F172A]",
        gradientLight: "from-[#2563EB] via-[#1D4ED8] to-[#1E40AF]",
        accentColor: "#60A5FA",
        shadowColor: "rgba(37, 99, 235, 0.25)",
        hasLive: !!liveExamsMap.engineering,
      },
      {
        key: "medical",
        tag: "মেডিকেল",
        title: "মেডিকেল",
        subtitle: "মডেল টেস্ট",
        description: "মেডিকেল ও ডেন্টাল সরকারি ভর্তি পরীক্ষা",
        icon: HeartPulse,
        gradientDark: "from-[#881337] via-[#4C0519] to-[#2E020D]",
        gradientLight: "from-[#E11D48] via-[#BE123C] to-[#9F1239]",
        accentColor: "#FB7185",
        shadowColor: "rgba(225, 29, 72, 0.25)",
        hasLive: !!liveExamsMap.medical,
      },
      {
        key: "varsity",
        tag: "ভার্সিটি",
        title: "ভার্সিটি ক-ইউনিট",
        subtitle: "মডেল টেস্ট",
        description: "ঢাকা বিশ্ববিদ্যালয় • সমন্বিত গুচ্ছ • জাহাঙ্গীরনগর",
        icon: GraduationCap,
        gradientDark: "from-[#581C87] via-[#3B0764] to-[#240342]",
        gradientLight: "from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]",
        accentColor: "#A78BFA",
        shadowColor: "rgba(124, 58, 237, 0.25)",
        hasLive: !!liveExamsMap.varsity,
      },
      {
        key: "hsc",
        tag: "এইচএসসি",
        title: "এইচএসসি স্পেশাল",
        subtitle: "অধ্যায়ভিত্তিক পরীক্ষা",
        description: "বিজ্ঞান বিভাগ বোর্ড প্রশ্ন ও পূর্ণাঙ্গ প্রস্তুতি",
        icon: BookOpen,
        gradientDark: "from-[#064E3B] via-[#022C22] to-[#011812]",
        gradientLight: "from-[#059669] via-[#047857] to-[#065F46]",
        accentColor: "#34D399",
        shadowColor: "rgba(5, 150, 105, 0.25)",
        hasLive: !!liveExamsMap.hsc,
      },
    ];
  }

  // If a category is selected, render the Category Listing View
  if (selectedCategory) {
    return (
      <LiveExamCategoryView
        category={selectedCategory}
        commonLayoutProps={commonLayoutProps}
        onBack={() => setSelectedCategory(null)}
      />
    );
  }

  // Calculate remaining time for the ongoing exam hero banner
  let remainingHeroText = "";
  if (ongoingExam) {
    const end = new Date(ongoingExam.endTime);
    const diffSecs = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    remainingHeroText = `${BanglaNameHelper.toBanglaNumeral(mins)} মি. ${BanglaNameHelper.toBanglaNumeral(secs)} সে.`;
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
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-6 font-['HindSiliguri'] pb-24">
      {/* ── Top Header Bar with Routine Modal Trigger ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-7">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#12544F] dark:bg-[#34D399] animate-ping" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#12544F] dark:text-[#34D399]">
              সারা দেশভিত্তিক লাইভ প্রতিযোগিতা
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-neutral-900 dark:text-white">
            লাইভ মডেল টেস্ট
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
            নির্দিষ্ট সময়ে দেশসেরা পরীক্ষার্থীদের সাথে অংশগ্রহণ করুন এবং মেধা তালিকা দেখুন
          </p>
        </div>

        {/* Routine Trigger Button */}
        <button
          type="button"
          onClick={() => setIsRoutineOpen(true)}
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] hover:border-[#12544F] dark:hover:border-[#12544F] text-neutral-800 dark:text-neutral-200 hover:text-[#12544F] dark:hover:text-[#34D399] text-xs sm:text-sm font-bold shadow-2xs hover:shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <CalendarDays size={16} className="text-[#12544F] dark:text-[#34D399]" />
          <span>সম্পূর্ণ রুটিন দেখো</span>
        </button>
      </div>

      {/* ── Featured Ongoing Hero Banner (If any exam is currently active) ── */}
      {ongoingExam && (
        <div className="mb-6 rounded-3xl bg-gradient-to-r from-[#12544F] via-[#0E423E] to-[#092328] p-4 sm:p-6 text-white shadow-xl shadow-[#12544F]/20 relative overflow-hidden border border-white/20">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/90 text-white text-xs font-black tracking-wider uppercase shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  LIVE NOW
                </span>
                <span className="text-xs font-semibold text-emerald-200 flex items-center gap-1">
                  <Clock size={13} />
                  সময় বাকি: {remainingHeroText}
                </span>
              </div>

              <h2 className="text-lg sm:text-2xl font-black text-white leading-tight">
                {ongoingExam.title}
              </h2>

              <div className="flex items-center gap-3 text-xs text-emerald-100/90 font-medium">
                <span>{BanglaNameHelper.toBanglaNumeral(ongoingExam.totalQuestions)} টি প্রশ্ন</span>
                <span>•</span>
                <span>{BanglaNameHelper.toBanglaNumeral(ongoingExam.durationMinutes)} মিনিট</span>
                <span>•</span>
                <span className="capitalize">{ongoingExam.category}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCategory(ongoingExam.category)}
              className="px-6 py-3 rounded-2xl bg-white text-[#12544F] font-extrabold text-sm shadow-md hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <span>পরীক্ষায় অংশগ্রহণ করো</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Background Ambient Blur Glow */}
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        </div>
      )}

      {/* ── Category Cards: Responsive 2-Column Desktop Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {categories.map((cat) => {
          const IconComp = cat.icon;

          return (
            <div
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                "group relative rounded-[24px] p-5 sm:p-6 cursor-pointer select-none transition-all duration-300 overflow-hidden",
                "bg-gradient-to-br border border-white/20 dark:border-white/10 hover:border-white/40",
                "hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]",
                "dark:" + cat.gradientDark,
                cat.gradientLight
              )}
              style={{
                boxShadow: `0 10px 30px -5px ${cat.shadowColor}`,
              }}
            >
              {/* Card Header Tag & Live Pulse */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                  {cat.tag}
                </span>

                {cat.hasLive && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black shadow-md shadow-red-900/40 uppercase tracking-wider animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>LIVE</span>
                  </div>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1 mb-3">
                <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                  {cat.title}
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-white/90">
                  {cat.subtitle}
                </p>
              </div>

              {/* Description */}
              <p className="text-xs sm:text-[13px] text-white/75 line-clamp-2 mb-5 font-medium leading-relaxed">
                {cat.description}
              </p>

              {/* Card Footer: Explore Arrow */}
              <div className="flex items-center justify-between pt-3 border-t border-white/15">
                <span className="text-xs font-bold text-white/90 group-hover:text-white flex items-center gap-1 transition-colors">
                  মডেল টেস্ট তালিকা দেখুন
                </span>

                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white group-hover:bg-white group-hover:text-neutral-900 group-hover:translate-x-1 transition-all">
                  <ArrowRight size={15} />
                </div>
              </div>

              {/* Background Ambient Decorative Icon */}
              <div className="absolute right-4 bottom-8 text-white/[0.07] group-hover:text-white/[0.12] transition-colors pointer-events-none">
                <IconComp size={100} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Routine Modal */}
      <LiveExamRoutineModal
        categoryTitle={isSSC ? "এসএসসি স্পেশাল" : "এইচএসসি ও ভর্তি স্পেশাল"}
        isOpen={isRoutineOpen}
        onClose={() => setIsRoutineOpen(false)}
      />
    </div>
  </AppLayout>
  );
};

export default LiveExamView;
