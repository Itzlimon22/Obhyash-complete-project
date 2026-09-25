"use client";

import React, { useState, useEffect } from "react";
import {
  Cpu,
  HeartPulse,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ChevronRight,
  School,
  Wallet,
  History as HistoryIcon,
} from "lucide-react";
import { supabase } from "@/services/core";
import LiveExamCategoryView from "./LiveExamCategoryView";
import LiveExamRoutineModal from "./LiveExamRoutineModal";
import { useAuth } from "@/components/auth/AuthProvider";
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
  primaryColor: string;
  shadowColor: string;
  hasLive: boolean;
}

export const LiveExamView: React.FC<LiveExamViewProps> = ({ commonLayoutProps }) => {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [liveExamsMap, setLiveExamsMap] = useState<Record<string, boolean>>({});
  const [isRoutineOpen, setIsRoutineOpen] = useState<boolean>(false);

  // Fetch ongoing live exams to flag active categories with "LIVE NOW"
  const fetchLiveStatus = React.useCallback(async () => {
    try {
      const currentTime = new Date().toISOString();
      const { data, error } = await supabase
        .from("live_exams")
        .select("id, title, category, start_time, end_time")
        .lte("start_time", currentTime)
        .gte("end_time", currentTime);

      if (error) {
        console.warn("[LiveExamView] Error fetching live status:", error);
        return;
      }

      const map: Record<string, boolean> = {};

      if (data && data.length > 0) {
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
            map.ssc_business = true;
            map.ssc_humanities = true;
            map.ssc_compulsory = true;
          }
        });
      }

      setLiveExamsMap(map);
    } catch (err) {
      console.warn("[LiveExamView] Error:", err);
    }
  }, []);

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
        key: "ssc_board",
        tag: "বোর্ড স্পেশাল",
        title: "বোর্ড মডেল লাইভ টেস্ট",
        subtitle: "এসএসসি পূর্ণাঙ্গ মডেল",
        description: "সকল শিক্ষা বোর্ডের স্ট্যান্ডার্ড প্যাটার্নে মেগা লাইভ পরীক্ষা",
        icon: BookOpen,
        gradientDark: "from-[#064E3B] via-[#022C22] to-[#011812]",
        gradientLight: "from-[#059669] via-[#047857] to-[#065F46]",
        primaryColor: "#059669",
        shadowColor: "rgba(5, 150, 105, 0.3)",
        hasLive: !!liveExamsMap.ssc_board,
      },
      {
        key: "ssc_school",
        tag: "শীর্ষ স্কুল",
        title: "শীর্ষ স্কুল ও ক্যাডেট",
        subtitle: "টেস্ট পরীক্ষা স্পেশাল",
        description: "আইডিয়াল • ভিকারুননিসা • রাজউক • ক্যাডেট টেস্ট পরীক্ষা",
        icon: School,
        gradientDark: "from-[#1E3A8A] via-[#172554] to-[#0F172A]",
        gradientLight: "from-[#2563EB] via-[#1D4ED8] to-[#1E40AF]",
        primaryColor: "#2563EB",
        shadowColor: "rgba(37, 99, 235, 0.3)",
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
              icon: Wallet,
              gradientDark: "from-[#78350F] via-[#451A03] to-[#290F02]",
              gradientLight: "from-[#D97706] via-[#B45309] to-[#92400E]",
              primaryColor: "#D97706",
              shadowColor: "rgba(217, 119, 6, 0.3)",
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
              icon: HistoryIcon,
              gradientDark: "from-[#581C87] via-[#3B0764] to-[#240342]",
              gradientLight: "from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]",
              primaryColor: "#7C3AED",
              shadowColor: "rgba(124, 58, 237, 0.3)",
              hasLive: !!liveExamsMap.ssc_humanities,
            },
          ]
        : isSci
        ? [
            {
              key: "ssc_science",
              tag: "বিজ্ঞান বিভাগ",
              title: "বিজ্ঞান লাইভ টেস্ট",
              subtitle: "পদার্থ • রসায়ন • গণিত • জীব",
              description: "বিজ্ঞান বিভাগের শিক্ষার্থীদের স্পেশাল লাইভ পরীক্ষা",
              icon: Cpu,
              gradientDark: "from-[#0E7490] via-[#155E75] to-[#083344]",
              gradientLight: "from-[#0891B2] via-[#0E7490] to-[#155E75]",
              primaryColor: "#0891B2",
              shadowColor: "rgba(8, 145, 178, 0.3)",
              hasLive: !!liveExamsMap.ssc_science,
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
              primaryColor: "#0891B2",
              shadowColor: "rgba(8, 145, 178, 0.3)",
              hasLive: !!liveExamsMap.ssc_science,
            },
            {
              key: "ssc_business",
              tag: "বাণিজ্য ও মানবিক",
              title: "বাণিজ্য ও মানবিক লাইভ",
              subtitle: "হিসাববিজ্ঞান • ইতিহাস • পৌরনীতি",
              description: "ব্যবসায় শিক্ষা ও মানবিক বিভাগের স্পেশাল লাইভ পরীক্ষা",
              icon: BookOpen,
              gradientDark: "from-[#78350F] via-[#451A03] to-[#290F02]",
              gradientLight: "from-[#D97706] via-[#B45309] to-[#92400E]",
              primaryColor: "#D97706",
              shadowColor: "rgba(217, 119, 6, 0.3)",
              hasLive: !!liveExamsMap.ssc_business || !!liveExamsMap.ssc_humanities,
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
        primaryColor: "#E11D48",
        shadowColor: "rgba(225, 29, 72, 0.3)",
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
        primaryColor: "#2563EB",
        shadowColor: "rgba(37, 99, 235, 0.3)",
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
        primaryColor: "#E11D48",
        shadowColor: "rgba(225, 29, 72, 0.3)",
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
        primaryColor: "#7C3AED",
        shadowColor: "rgba(124, 58, 237, 0.3)",
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
        primaryColor: "#059669",
        shadowColor: "rgba(5, 150, 105, 0.3)",
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
      <div className="w-full max-w-4xl mx-auto px-2.5 sm:px-4 py-4 sm:py-6 font-['HindSiliguri'] pb-24">
        {/* Top Header Row with Routine Action Button matching Flutter style */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] dark:bg-[#34D399] animate-pulse" />
            <h1 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
              লাইভ মডেল টেস্ট
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setIsRoutineOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#EFF6FF] dark:bg-[#1E3A8A]/25 border border-[#BFDBFE] dark:border-[#1E3A8A]/50 text-[#2563EB] dark:text-[#60A5FA] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:opacity-90 active:scale-95"
          >
            <CalendarDays size={13} />
            <span>রুটিন</span>
          </button>
        </div>

        {/* Categories List matching Flutter _buildPremiumSingleCard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {categories.map((cat) => {
            const IconComp = cat.icon;

            return (
              <div
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "group relative rounded-[24px] cursor-pointer select-none transition-all duration-200 overflow-hidden",
                  "bg-gradient-to-br",
                  "border border-white/25 dark:border-white/15 hover:border-white/40",
                  "hover:-translate-y-0.5 active:scale-[0.99]",
                  "dark:" + cat.gradientDark,
                  cat.gradientLight
                )}
                style={{
                  boxShadow: `0 8px 18px -2px ${cat.shadowColor}`,
                }}
              >
                {/* Ambient Decorative Light Sphere (Top-Right) */}
                <div
                  className="absolute -right-[25px] -top-[25px] w-[130px] h-[130px] rounded-full pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%)",
                  }}
                />

                {/* Main Card Content */}
                <div className="relative p-[18px]">
                  {/* Top Header Row: Icon Emblem + Tag + Live Badge + Chevron */}
                  <div className="flex items-center">
                    {/* Glass Icon Emblem */}
                    <div className="w-[44px] h-[44px] rounded-[14px] bg-white/18 border border-white/25 flex items-center justify-center shrink-0 text-white shadow-2xs">
                      <IconComp size={24} />
                    </div>

                    {/* Tag Pill */}
                    <div className="ml-3 px-2.5 py-1 rounded-full bg-white/18 border border-white/15 text-[11.5px] font-bold text-white tracking-wide shrink-0">
                      {cat.tag}
                    </div>

                    <div className="flex-1" />

                    {/* Live Status Badge */}
                    {cat.hasLive && (
                      <div className="px-2.5 py-1 rounded-full bg-white shadow-md flex items-center gap-1.5 shrink-0 mr-2 animate-pulse">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: cat.primaryColor }}
                        />
                        <span
                          className="text-[10px] font-bold tracking-[0.6px]"
                          style={{ color: cat.primaryColor }}
                        >
                          LIVE NOW
                        </span>
                      </div>
                    )}

                    {/* Chevron Circle Arrow Indicator */}
                    <div className="w-7 h-7 rounded-full bg-white/14 border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <ChevronRight size={13} />
                    </div>
                  </div>

                  {/* Title and Subtitle Row */}
                  <div className="mt-3.5 flex items-baseline gap-2 flex-wrap">
                    <h3 className="text-[16px] font-semibold text-white tracking-[-0.3px]">
                      {cat.title}
                    </h3>
                    <span className="text-[12px] font-normal text-white/85">
                      • {cat.subtitle}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-1 text-[12px] text-white/78 leading-[1.35] line-clamp-2">
                    {cat.description}
                  </p>
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
