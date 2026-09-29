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
  onSelectSection?: (section: AcademicItem) => void;
}

import AcademicSectionDetailView from "./AcademicSectionDetailView";

export default function AcademicCategoryDetailView({
  subject,
  onBack,
  showHeader = true,
  onSelectSection,
}: AcademicCategoryDetailViewProps) {
  const [selectedSection, setSelectedSection] = useState<AcademicItem | null>(null);

  if (selectedSection) {
    return (
      <AcademicSectionDetailView
        subject={subject}
        section={selectedSection}
        onBack={() => setSelectedSection(null)}
        showHeader={showHeader}
      />
    );
  }

  const subjectId = (subject.id || "").toLowerCase();
  const subjectName = subject.name || "বিষয়";
  const paperClean = (subject.paper || "").trim();
  const displayTitle = paperClean ? `${subjectName} ${paperClean}` : subjectName;

  const isEnglishFirstPaper =
    subjectId === "english_1" ||
    subjectId === "hsc_english_1" ||
    ((subjectId.includes("english") || subjectName.includes("ইংরেজি")) &&
      (paperClean.includes("১ম") || paperClean.includes("1st") || subjectId.includes("1")));

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-[#F8F9FA] dark:bg-[#000000] font-['HindSiliguri',sans-serif] select-none pb-20">
      {/* ── Top Header ── */}
      {showHeader && (
        <div className="sticky top-0 z-40 bg-[#F8F9FA]/95 dark:bg-[#000000]/95 backdrop-blur-md px-4 h-14 sm:h-[60px] flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#121212] border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="stroke-[2.2]" />
          </button>

          <h1 className="font-['Anek_Bangla',sans-serif] font-bold text-[16px] sm:text-[17.5px] text-neutral-900 dark:text-white tracking-tight text-center">
            {displayTitle} - একাডেমিক
          </h1>

          <div className="w-9" />
        </div>
      )}

      {/* ── Body: Coming soon for English 1st paper, otherwise 2-per-row grid ── */}
      {isEnglishFirstPaper ? (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="w-[110px] h-[110px] rounded-full bg-[#3B82F6]/12 flex items-center justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] shadow-[0_8px_18px_rgba(37,99,235,0.35)] flex items-center justify-center text-white">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <h2 className="font-['Anek_Bangla',sans-serif] font-extrabold text-2xl text-neutral-900 dark:text-white mb-2">
            শীঘ্রই আসছে!
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm leading-relaxed mb-6">
            ইংরেজি ১ম পত্রের জন্য পূর্ণাঙ্গ একাডেমিক প্রশ্নব্যাংক ও সমাধান প্রস্তুত করা হচ্ছে। খুব শীঘ্রই এটি যুক্ত হবে।
          </p>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-[#3B82F6] text-[#3B82F6] hover:bg-[#3B82F6]/10 text-sm font-bold transition-all cursor-pointer"
          >
            ফিরে যান
          </button>
        </div>
      ) : (
        <div className="px-3.5 sm:px-4 py-3 sm:py-4">
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
            {ACADEMIC_SECTIONS.map((sec) => (
              <div
                key={sec.id}
                onClick={() => {
                  if (onSelectSection) {
                    onSelectSection(sec);
                  } else {
                    setSelectedSection(sec);
                  }
                }}
                className={`group relative aspect-[1.25/1] rounded-[26px] overflow-hidden cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20 bg-gradient-to-br ${sec.gradient} p-3 sm:p-4 flex flex-col justify-between`}
              >
                {/* Ambient Glow */}
                <div className="absolute -right-5 -bottom-5 w-[100px] h-[100px] rounded-full bg-white/12 pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                {/* Top Left: Card Title */}
                <div className="relative z-10 text-left pt-2.5 sm:pt-3 pl-1 sm:pl-1.5">
                  <h2 className="font-['Anek_Bangla',sans-serif] font-bold text-[20px] sm:text-[22px] text-white leading-[1.15] tracking-tight drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.35)]">
                    {sec.title}
                  </h2>
                </div>

                {/* Bottom-Right: Rich SVG Illustration Art */}
                <div className="absolute right-[-4px] bottom-[-4px] z-0 w-24 h-24 flex items-center justify-center pointer-events-none">
                  <div className="relative w-full h-full group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300">
                    <Image
                      src={sec.svgIcon}
                      alt={sec.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
