"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ChevronRight, Award, ArrowRight } from "lucide-react";
import { supabase } from "@/services/core";
import LiveExamCategoryView from "./LiveExamCategoryView";
import LiveExamHistoryPageView from "./LiveExamHistoryPageView";
import LiveExamDetailsView from "./LiveExamDetailsView";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";
import AppLayout from "@/components/student/ui/layout/AppLayout";
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

  // Fetch ongoing live exams matching Flutter `_hasLive`
  const fetchLiveStatus = useCallback(async () => {
    try {
      const currentTime = new Date().toISOString();

      const { data, error } = await supabase
        .from("live_exams")
        .select("id, title, category, start_time, end_time")
        .eq("status", "published")
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

  // Stream & Level detection matching Flutter LiveExamMainView exactly
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

  // Dynamic Category Cards matching Flutter LiveExamMainView exactly
  let categories: CategoryInfo[] = [];

  if (isSSC) {
    categories = [
      {
        key: "ssc_board",
        tag: "বোর্ড স্পেশাল",
        title: "বোর্ড মডেল টেস্ট",
        subtitle: "এসএসসি পূর্ণাঙ্গ মডেল",
        description: "সকল শিক্ষা বোর্ডের স্ট্যান্ডার্ড মেগা লাইভ টেস্ট",
        svgAsset: "/dashboard-icons/exam_pencil.svg",
        solidBg: "bg-[#1D4ED8]", // Deep Blue
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
        solidBg: "bg-[#0F766E]", // Deep Teal
        accentColor: "#CCFBF1",
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
              solidBg: "bg-[#C2410C]", // Deep Amber Orange
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
              solidBg: "bg-[#701A75]", // Deep Plum
              accentColor: "#FCE7F3",
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
              description: "বিজ্ঞান বিভাগের শিক্ষার্থীদের অধ্যায়ভিত্তিক পরীক্ষা",
              svgAsset: "/images/subjects/engineering.svg",
              solidBg: "bg-[#047857]", // Deep Green
              accentColor: "#D1FAE5",
              hasLive: !!liveExamsMap.ssc_science,
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
              solidBg: "bg-[#047857]", // Deep Green
              accentColor: "#D1FAE5",
              hasLive: !!liveExamsMap.ssc_science,
            },
            {
              key: "ssc_business",
              tag: "বাণিজ্য ও মানবিক",
              title: "বাণিজ্য ও মানবিক লাইভ",
              subtitle: "হিসাববিজ্ঞান • ইতিহাস • পৌরনীতি",
              description: "ব্যবসায় শিক্ষা ও মানবিক বিভাগের লাইভ পরীক্ষা",
              svgAsset: "/images/subjects/textbook.svg",
              solidBg: "bg-[#C2410C]", // Deep Amber Orange
              accentColor: "#FFEDD5",
              hasLive: !!liveExamsMap.ssc_business || !!liveExamsMap.ssc_humanities,
            },
          ]),
      {
        key: "ssc_compulsory",
        tag: "আবশ্যিক বিষয়",
        title: "আবশ্যিক লাইভ টেস্ট",
        subtitle: "বাংলা • ইংরেজি • গণিত • আইসিটি",
        description: "সকল বিভাগের শিক্ষার্থীদের জন্য আবশ্যকীয় মেগা টেস্ট",
        svgAsset: "/images/subjects/academic.svg",
        solidBg: "bg-[#991B1B]", // Deep Red
        accentColor: "#FEE2E2",
        hasLive: !!liveExamsMap.ssc_compulsory,
      },
    ];
  } else {
    // HSC / Admission Categories matching Flutter LiveExamMainView exactly
    categories = [
      {
        key: "engineering",
        tag: "ইঞ্জিনিয়ারিং",
        title: "ইঞ্জিনিয়ারিং",
        subtitle: "মডেল টেস্ট",
        description: "বুয়েট • কুয়েট • রুয়েট • চুয়েট • আইইউটি",
        svgAsset: "/images/subjects/engineering.svg",
        solidBg: "bg-[#0E7490]", // Deep Cyan (cyan-700)
        accentColor: "#CFFAFE",
        hasLive: !!liveExamsMap.engineering,
      },
      {
        key: "medical",
        tag: "মেডিকেল",
        title: "মেডিকেল",
        subtitle: "মডেল টেস্ট",
        description: "মেডিকেল ও ডেন্টাল সরকারি ভর্তি প্রস্তুতি",
        svgAsset: "/images/subjects/medical.svg",
        solidBg: "bg-[#BE123C]", // Deep Red (rose-700)
        accentColor: "#FFE4E6",
        hasLive: !!liveExamsMap.medical,
      },
      {
        key: "varsity",
        tag: "ভার্সিটি",
        title: "ভার্সিটি ক-ইউনিট",
        subtitle: "মডেল টেস্ট",
        description: "ঢাকা বিশ্ববিদ্যালয় • জিএসটি গুচ্ছ • জাবি",
        svgAsset: "/images/subjects/varsity_ka.svg",
        solidBg: "bg-[#6D28D9]", // Deep Purple (purple-700)
        accentColor: "#EDE9FE",
        hasLive: !!liveExamsMap.varsity,
      },
      {
        key: "hsc",
        tag: "এইচএসসি",
        title: "এইচএসসি স্পেশাল",
        subtitle: "অধ্যায়ভিত্তিক টেস্ট",
        description: "বিজ্ঞান বিভাগ বোর্ড প্রশ্ন ও পূর্ণাঙ্গ প্রস্তুতি",
        svgAsset: "/images/subjects/academic.svg",
        solidBg: "bg-[#047857]", // Deep Green (emerald-700)
        accentColor: "#D1FAE5",
        hasLive: !!liveExamsMap.hsc,
      },
    ];
  }

  const hasAnyLive = categories.some((c) => c.hasLive);

  // If user selected a specific exam directly
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
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pt-4 sm:pt-6 pb-28 font-['HindSiliguri'] select-none">
        {/* Top Header Bar with Live Indicator & 'আমার ফলাফল' Button matching Flutter */}
        <div className="flex items-center justify-between mb-3 px-1">
          {hasAnyLive ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-[10px] bg-[#EF4444]/15 border border-[#EF4444]/40 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse shadow-[0_0_6px_#ef4444]" />
              <span className="text-[10.5px] font-bold text-[#EF4444]">
                লাইভ চলছে
              </span>
            </div>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-[#14151B] border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-xs font-normal text-black dark:text-white transition-all shadow-xs cursor-pointer ml-auto"
            title="আমার লাইভ পরীক্ষার ফলাফল ও মেধা তালিকা দেখুন"
          >
            <Award className="w-4 h-4 text-black dark:text-white" />
            <span>আমার ফলাফল</span>
          </button>
        </div>

        {/* 2-Columns Per Row Grid with childAspectRatio: 0.85 matching Flutter _PremiumGridCard exactly */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5">
          {categories.map((cat) => {
            return (
              <div
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  "group relative rounded-[20px] cursor-pointer select-none transition-transform duration-120 overflow-hidden flex flex-col justify-between",
                  "p-3.5 aspect-[0.85] sm:min-h-[195px]",
                  cat.solidBg,
                  cat.hasLive
                    ? "border-[1.8px] border-[#FF4D4D] shadow-[0_4px_16px_rgba(255,77,77,0.35)]"
                    : "border border-white/[0.18] shadow-md",
                  "active:scale-[0.965]"
                )}
              >
                {/* Top-Right Ambient Radial Glow (Subtle depth matching Flutter) */}
                <div
                  className="absolute -right-5 -top-5 w-[90px] h-[90px] rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, rgba(255, 255, 255, 0.12) 0%, transparent 70%)`,
                  }}
                />

                <div className="flex-1 flex flex-col">
                  {/* Top Row: Custom SVG Emblem + Tag / Live Badge */}
                  <div className="flex items-start justify-between gap-1.5">
                    {/* Custom Icon Container (42x42 matching Flutter) */}
                    <div className="w-[42px] h-[42px] rounded-[13px] border border-white/[0.28] bg-white/[0.18] p-2 flex items-center justify-center shrink-0">
                      <img
                        src={cat.svgAsset}
                        alt={cat.title}
                        className="w-full h-full object-contain brightness-0 invert"
                        loading="lazy"
                      />
                    </div>

                    {/* Status Badge (Matching Flutter _LivePulseBadge vs cat.tag) */}
                    {cat.hasLive ? (
                      <div className="px-2 py-[3px] rounded-full bg-[#EF4444]/20 border border-[#EF4444]/60 flex items-center gap-1.5 shrink-0 shadow-xs animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF4D4D] shadow-[0_0_6px_#ff4d4d]" />
                        <span className="text-[10px] font-bold text-white tracking-wider">
                          LIVE
                        </span>
                      </div>
                    ) : (
                      <div className="px-2 py-[3.5px] rounded-[8px] bg-white/[0.20] border border-white/[0.32] text-[10px] font-semibold text-white shrink-0">
                        {cat.tag}
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-[15.5px] font-bold text-white tracking-[-0.3px] line-clamp-1 mt-2.5 leading-tight">
                    {cat.title}
                  </h3>

                  {/* Subtitle */}
                  <p className="text-[11.5px] font-semibold text-white/90 line-clamp-1 mt-0.5">
                    {cat.subtitle}
                  </p>

                  {/* Description (absorbs remaining space cleanly) */}
                  <p className="text-[10.5px] text-white/80 line-clamp-2 leading-[1.3] mt-1 flex-1">
                    {cat.description}
                  </p>
                </div>

                {/* Bottom Action Row matching Flutter */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-white">
                    {cat.hasLive ? "পরীক্ষায় যাও" : "পরীক্ষা শুরু"}
                  </span>

                  <div className="w-6 h-6 rounded-full bg-white/[0.22] text-white flex items-center justify-center">
                    <ArrowRight size={13} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};

export default LiveExamView;
