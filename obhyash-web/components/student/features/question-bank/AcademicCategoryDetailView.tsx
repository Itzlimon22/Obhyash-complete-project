"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ArrowLeft, PenTool, X } from "lucide-react";

interface AcademicItem {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  svgIcon: string;
  count: number;
}

const ACADEMIC_SECTIONS: AcademicItem[] = [
  {
    id: "mcq",
    title: "MCQ",
    subtitle: "বহুনির্বাচনী প্রশ্ন",
    gradient: "from-[#F59E0B] via-[#EAB308] to-[#D97706]",
    svgIcon: "/images/question-bank/svg/academic_mcq.svg",
    count: 180,
  },
  {
    id: "cq",
    title: "CQ",
    subtitle: "সৃজনশীল প্রশ্ন",
    gradient: "from-[#EF4444] via-[#DC2626] to-[#B91C1C]",
    svgIcon: "/images/question-bank/svg/academic_cq.svg",
    count: 187,
  },
  {
    id: "ka_bhandar",
    title: "ক প্রশ্নাবলী",
    subtitle: "জ্ঞানমূলক প্রশ্ন ও উত্তর",
    gradient: "from-[#3B82F6] via-[#2563EB] to-[#1D4ED8]",
    svgIcon: "/images/question-bank/svg/academic_ka.svg",
    count: 116,
  },
  {
    id: "kha_bhandar",
    title: "খ প্রশ্নাবলী",
    subtitle: "অনুধাবনমূলক প্রশ্ন ও উত্তর",
    gradient: "from-[#10B981] via-[#059669] to-[#047857]",
    svgIcon: "/images/question-bank/svg/academic_kha.svg",
    count: 116,
  },
];

interface AcademicCategoryDetailViewProps {
  subject: {
    id: string;
    name: string;
    paper: string;
    count?: number;
  };
  onBack: () => void;
  showHeader?: boolean;
}

import AcademicSectionDetailView from "./AcademicSectionDetailView";

export default function AcademicCategoryDetailView({
  subject,
  onBack,
  showHeader = true,
}: AcademicCategoryDetailViewProps) {
  const [selectedSection, setSelectedSection] = useState<AcademicItem | null>(null);

  if (selectedSection) {
    return (
      <AcademicSectionDetailView
        subject={subject}
        section={selectedSection}
        onBack={() => setSelectedSection(null)}
      />
    );
  }

  const paperClean = subject.paper ? subject.paper.split(" ")[0] : "";
  const displayTitle = paperClean ? `${subject.name} ${paperClean}` : subject.name;

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-[#F8F9FA] dark:bg-[#101012] font-['HindSiliguri',sans-serif] select-none pb-20">
      {/* ── Top Header ── */}
      {showHeader && (
        <div className="sticky top-0 z-40 bg-[#F8F9FA]/90 dark:bg-[#101012]/90 backdrop-blur-md px-4 py-3 sm:py-4 flex items-center justify-between border-b border-neutral-200/60 dark:border-[#222226]">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-neutral-200/70 dark:hover:bg-neutral-800 transition-all cursor-pointer active:scale-95 shadow-xs"
            aria-label="Back"
          >
            <ArrowLeft size={22} className="stroke-[2.5]" />
          </button>

          <h1 className="font-['Anek_Bangla',sans-serif] font-bold text-xl sm:text-2xl text-neutral-900 dark:text-white tracking-tight text-center">
            {displayTitle} - একাডেমিক
          </h1>

          <div className="w-10" />
        </div>
      )}

      {/* ── 2 Per Row Academic Cards Grid ── */}
      <div className="px-3.5 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:gap-6">
          {ACADEMIC_SECTIONS.map((sec) => (
            <div
              key={sec.id}
              onClick={() => setSelectedSection(sec)}
              className={`group relative aspect-[1.25/1] rounded-[24px] sm:rounded-[28px] overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20 bg-gradient-to-br ${sec.gradient} p-3.5 sm:p-4.5 flex flex-col justify-between`}
            >
              {/* Ambient Glow */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-black/10 blur-lg pointer-events-none" />

              {/* Top Left: Card Title */}
              <div className="relative z-10 text-left pt-3 sm:pt-4 pl-1">
                <h2 className="font-['Anek_Bangla',sans-serif] font-bold text-xl sm:text-3xl text-white leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                  {sec.title}
                </h2>
              </div>

              {/* Center / Bottom-Right: Rich Generated SVG Vector Art (Bigger) */}
              <div className="absolute right-0 bottom-0 sm:right-1 sm:bottom-1 z-0 w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center pointer-events-none">
                <div className="relative w-full h-full group-hover:scale-108 group-hover:-translate-y-1 transition-all duration-300">
                  <Image
                    src={sec.svgIcon}
                    alt={sec.title}
                    fill
                    className="object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)]"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
