"use client";

import React, { useState, useEffect } from "react";
import { ChevronRight, Award } from "lucide-react";
import { supabase } from "@/services/core";
import LiveExamCategoryView from "./LiveExamCategoryView";
import LiveExamHistoryPageView from "./LiveExamHistoryPageView";
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
  svgAsset: string;
  solidBg: string;
  accentColor: string;
  hasLive: boolean;
}

export const LiveExamView: React.FC<LiveExamViewProps> = ({ commonLayoutProps }) => {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [liveExamsMap, setLiveExamsMap] = useState<Record<string, boolean>>({});

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
        solidBg: "bg-[#0F766E]",
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
        : isSci
        ? [
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
            {
              key: "ssc_business",
              tag: "বাণিজ্য ও মানবিক",
              title: "বাণিজ্য ও মানবিক লাইভ",
              subtitle: "হিসাববিজ্ঞান • ইতিহাস • পৌরনীতি",
              description: "ব্যবসায় শিক্ষা ও মানবিক বিভাগের লাইভ পরীক্ষা",
              svgAsset: "/images/subjects/textbook.svg",
              solidBg: "bg-[#C2410C]",
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
        solidBg: "bg-[#991B1B]",
        accentColor: "#FEE2E2",
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
        svgAsset: "/images/subjects/engineering.svg",
        solidBg: "bg-[#0E7490]", // Deep Cyan
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
        solidBg: "bg-[#BE123C]", // Deep Red
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
        solidBg: "bg-[#6D28D9]", // Deep Purple
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
        solidBg: "bg-[#047857]", // Deep Green
        accentColor: "#D1FAE5",
        hasLive: !!liveExamsMap.hsc,
      },
    ];
  }

  const hasAnyLive = categories.some((c) => c.hasLive);

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
      <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pt-7 sm:pt-9 pb-28 font-['HindSiliguri']">
        {/* Top Header Bar with Live Indicator & 'আমার ফলাফল' Button */}
        <div className="flex items-center justify-between mb-4 gap-3">
          {hasAnyLive ? (
            <div className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />
              <span className="text-[11px] font-bold text-rose-500">
                লাইভ পরীক্ষা চলছে
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

        {/* 2-Columns Per Row Grid with Deep Red, Deep Green, Deep Blue Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                    {cat.hasLive ? "পরীক্ষায় যাও" : "পরীক্ষা শুরু"}
                  </span>

                  <div className="w-6 h-6 rounded-full bg-white/20 text-white flex items-center justify-center transition-transform duration-200 group-hover:translate-x-0.5">
                    <ChevronRight size={13} strokeWidth={2.5} />
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
