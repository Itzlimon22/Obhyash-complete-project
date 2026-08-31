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
} from "lucide-react";
import { supabase } from "@/services/core";
import LiveExamCategoryView from "./LiveExamCategoryView";
import AppLayout from "@/components/student/ui/layout/AppLayout";
import { cn } from "@/lib/utils";

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

export const LiveExamView: React.FC<LiveExamViewProps> = ({ commonLayoutProps }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [liveExamsMap, setLiveExamsMap] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch ongoing live exams from Supabase to activate "LIVE" indicator
  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        const now = new Date().toISOString();
        const { data } = await supabase
          .from("live_exams")
          .select("category, start_time, end_time")
          .lte("start_time", now)
          .gte("end_time", now);

        const map: Record<string, boolean> = {
          engineering: false,
          medical: false,
          varsity: false,
          hsc: false,
        };

        if (data) {
          data.forEach((e: any) => {
            const cat = (e.category || "").toLowerCase();
            if (map[cat] !== undefined) map[cat] = true;
            if (cat === "varsity_a" || cat === "all") map.varsity = true;
            if (cat === "all") {
              map.engineering = true;
              map.medical = true;
              map.hsc = true;
            }
          });
        }

        setLiveExamsMap(map);
      } catch (err) {
        console.warn("[LiveExamView] Error fetching live status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveStatus();
  }, []);

  const categories: CategoryInfo[] = [
    {
      key: "engineering",
      tag: "ইঞ্জিনিয়ারিং",
      title: "ইঞ্জিনিয়ারিং",
      subtitle: "উইকলি মডেল টেস্ট",
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
      subtitle: "উইকলি মডেল টেস্ট",
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
      subtitle: "উইকলি মডেল টেস্ট",
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
    >
      <div className="w-full max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6 font-['HindSiliguri'] pb-24">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
              লাইভ মডেল টেস্ট সেন্টার 🔴
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
              জাতীয় পর্যায়ের পরীক্ষার্থীদের সাথে লাইভ প্রতিযোগিতায় অংশ নাও
            </p>
          </div>
        </div>

        {/* 4 Premium Category Cards */}
        <div className="flex flex-col gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  boxShadow: `0 8px 24px -6px ${cat.shadowColor}`,
                }}
                className={cn(
                  "relative overflow-hidden rounded-[24px] p-5 sm:p-6 cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 group select-none text-white border border-white/10",
                  "bg-gradient-to-br",
                  cat.gradientLight,
                  `dark:${cat.gradientDark}`
                )}
              >
                {/* Background Glow Ring */}
                <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                {/* Top Row: Tag, Live Badge, and Icon */}
                <div className="flex items-center justify-between gap-2 mb-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-black tracking-wide uppercase border border-white/25 text-white shadow-sm">
                      {cat.tag}
                    </span>

                    {cat.hasLive && (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-black flex items-center gap-1 shadow-md animate-pulse border border-red-400/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span>LIVE NOW</span>
                      </span>
                    )}
                  </div>

                  <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 group-hover:rotate-6 transition-transform">
                    <Icon size={22} />
                  </div>
                </div>

                {/* Main Titles */}
                <div className="relative z-10 mb-3">
                  <h3 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                    {cat.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-white/90 mt-0.5">
                    {cat.subtitle}
                  </p>
                </div>

                {/* Bottom Row: Description & Arrow */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/15 relative z-10">
                  <p className="text-[11px] sm:text-xs font-medium text-white/80 truncate">
                    {cat.description}
                  </p>

                  <div className="flex items-center gap-1 text-xs font-bold text-white group-hover:translate-x-1 transition-transform shrink-0">
                    <span>পরীক্ষা দেখুন</span>
                    <ArrowRight size={14} />
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
