"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, CheckCircle2, FileText, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface GkeCourseBannerProps {
  onBannerClick?: () => void;
  className?: string;
}

export const GkeCourseBanner: React.FC<GkeCourseBannerProps> = ({
  onBannerClick,
  className,
}) => {
  return (
    <div
      onClick={onBannerClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onBannerClick?.();
        }
      }}
      className={cn(
        "group relative w-full overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer select-none",
        // Light mode: Clean white with crisp borders and subtle emerald ambient wash
        "bg-white border-[#E5E7EB] hover:border-[#12544F] shadow-xs hover:shadow-md",
        // Dark mode: Deep surface with subtle emerald border hover
        "dark:bg-[#18181B] dark:border-[#27272A] dark:hover:border-[#12544F]/70",
        className
      )}
    >
      {/* Decorative Obhyash Brand Corner Mesh Accent (No AI colors, strictly Viridian/Forest Green #004633) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#12544F]/10 dark:bg-[#12544F]/15 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[#004633]/5 dark:bg-[#34D399]/5 blur-xl"
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 md:p-5 gap-3.5 sm:gap-4">
        {/* Left Side: Badge, Title, Subtitle & Feature Highlights */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5 sm:gap-2">
          {/* Top Row: Brand Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Batch Pill */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight bg-[#E6F0EC] dark:bg-[#12544F]/25 text-[#004633] dark:text-[#34D399] border border-[#12544F]/15 dark:border-[#12544F]/40">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#12544F] dark:bg-[#34D399] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#004633] dark:bg-[#34D399]" />
              </span>
              মেডিকেল ব্যাচ ০১
            </span>

            {/* Admission Open Pill */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
              ভর্তি চলছে
            </span>

            {/* Starting Date Pill */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              পরীক্ষা শুরু ১০ নভেম্বর
            </span>
          </div>

          {/* Heading */}
          <h2 className="text-base sm:text-lg md:text-[19px] font-bold text-neutral-900 dark:text-white tracking-tight leading-snug">
            মেডিকেল GKE স্পেশাল ব্যাচ (জিকে ও ইংলিশ)
          </h2>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-neutral-600 dark:text-neutral-400 font-medium leading-relaxed">
            মেডিকেল ভর্তি পরীক্ষার ২৫ নম্বরের পূর্ণাঙ্গ প্রস্তুতি • মডেল টেস্ট শুরু আগামী ১০ নভেম্বর
          </p>

          {/* Feature Highlights Pills */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap mt-0.5 pt-1">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              <CheckCircle2 size={13} className="text-[#004633] dark:text-[#34D399] shrink-0" />
              <span>২৫টি লাইভ মডেল টেস্ট</span>
            </div>

            <div className="hidden xs:inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              <FileText size={13} className="text-[#004633] dark:text-[#34D399] shrink-0" />
              <span>অধ্যায়ভিত্তিক সলভ শিট</span>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 dark:text-neutral-300">
              <Target size={13} className="text-[#004633] dark:text-[#34D399] shrink-0" />
              <span>নেগেটিভ মার্কিং এনালাইসিস</span>
            </div>
          </div>
        </div>

        {/* Right Side: Obhyash 3D Tile Graphic & CTA Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800">
          {/* Obhyash Custom 3D Medical GKE Tile Icon */}
          <div className="relative size-12 sm:size-14 md:size-16 shrink-0 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/dashboard-icons/course_medical_gke.svg"
              alt="Medical GKE Course"
              width={64}
              height={64}
              className="w-full h-full drop-shadow-sm select-none"
              priority
            />
          </div>

          {/* CTA Button */}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#004633] hover:bg-[#003628] dark:bg-[#12544F] dark:hover:bg-[#15605b] shadow-xs transition-all duration-150 group-hover:shadow group-hover:translate-x-0.5 active:scale-95 cursor-pointer"
          >
            <span>কোর্সটি দেখুন</span>
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GkeCourseBanner;

