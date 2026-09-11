"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  PenTool,
  X,
} from "lucide-react";

export interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  svgIcon: string;
  hasBadge: boolean;
  count?: number;
}

const ALL_CATEGORIES: Record<string, CategoryItem> = {
  academic: {
    id: "academic",
    title: "একাডেমিক",
    subtitle: "বোর্ড প্রশ্ন ও সমাধান",
    gradient: "from-[#3B82F6] via-[#2563EB] to-[#1D4ED8]",
    svgIcon: "/images/question-bank/svg/academic.svg",
    hasBadge: false,
  },
  textbook: {
    id: "textbook",
    title: "মূলবই",
    subtitle: "অনুশীলনী ও রেফারেন্স",
    gradient: "from-[#10B981] via-[#059669] to-[#047857]",
    svgIcon: "/images/question-bank/svg/textbook.svg",
    hasBadge: false,
  },
  engineering: {
    id: "engineering",
    title: "ইঞ্জিনিয়ারিং",
    subtitle: "বুয়েট • চুয়েট • কুয়েট • রুয়েট",
    gradient: "from-[#F97316] via-[#EA580C] to-[#C2410C]",
    svgIcon: "/images/question-bank/svg/engineering.svg",
    hasBadge: true,
    count: 1,
  },
  medical: {
    id: "medical",
    title: "মেডিকেল",
    subtitle: "এমবিবিএস ও বিডিএস",
    gradient: "from-[#06B6D4] via-[#0891B2] to-[#0E7490]",
    svgIcon: "/images/question-bank/svg/medical.svg",
    hasBadge: true,
    count: 1,
  },
  varsity_ka: {
    id: "varsity_ka",
    title: "ভার্সিটি 'ক'",
    subtitle: "ঢাবি • জাবি • রাবি • চবি",
    gradient: "from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]",
    svgIcon: "/images/question-bank/svg/varsity_ka.svg",
    hasBadge: true,
    count: 1,
  },
  varsity_kha: {
    id: "varsity_kha",
    title: "ভার্সিটি 'খ'",
    subtitle: "কলা, আইন ও সামাজিক বিজ্ঞান",
    gradient: "from-[#EC4899] via-[#DB2777] to-[#BE185D]",
    svgIcon: "/images/question-bank/svg/varsity_kha.svg",
    hasBadge: true,
    count: 1,
  },
  gst: {
    id: "gst",
    title: "গুচ্ছ সমন্বিত",
    subtitle: "জিএসটি ২৪ বিশ্ববিদ্যালয়",
    gradient: "from-[#6366F1] via-[#4F46E5] to-[#3730A3]",
    svgIcon: "/images/question-bank/svg/gst.svg",
    hasBadge: true,
    count: 1,
  },
  iba_bup: {
    id: "iba_bup",
    title: "আইবিএ ও বিইউপি",
    subtitle: "আইবিএ • বিইউপি • অন্যান্য",
    gradient: "from-[#F43F5E] via-[#E11D48] to-[#9F1239]",
    svgIcon: "/images/question-bank/svg/iba_bup.svg",
    hasBadge: true,
    count: 1,
  },
};

export function getCategoriesForSubject(subjectId: string, subjectName: string = ""): CategoryItem[] {
  const id = (subjectId || "").toLowerCase();
  const name = (subjectName || "").toLowerCase();

  // 1. Math: Engineering YES, Varsity Ka YES, Medical NO
  if (id.includes("math") || name.includes("গণিত")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.textbook,
      ALL_CATEGORIES.engineering,
      ALL_CATEGORIES.varsity_ka,
      ALL_CATEGORIES.gst,
    ];
  }

  // 2. Biology: Medical YES, Varsity Ka YES, Engineering NO
  if (id.includes("biology") || name.includes("জীব")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.textbook,
      ALL_CATEGORIES.medical,
      ALL_CATEGORIES.varsity_ka,
      ALL_CATEGORIES.gst,
    ];
  }

  // 3. Bangla: Neither Medical nor Engineering
  if (id.includes("bangla") || name.includes("বাংলা")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.textbook,
      ALL_CATEGORIES.varsity_kha,
      ALL_CATEGORIES.varsity_ka,
      ALL_CATEGORIES.gst,
    ];
  }

  // 4. English: Medical YES, Engineering NO, IBA/BUP YES
  if (id.includes("english") || name.includes("ইংরেজি")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.textbook,
      ALL_CATEGORIES.medical,
      ALL_CATEGORIES.varsity_ka,
      ALL_CATEGORIES.iba_bup,
    ];
  }

  // 5. Statistics: Academic, Textbook, Varsity Ka, GST
  if (id.includes("stat") || name.includes("পরিসংখ্যান")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.textbook,
      ALL_CATEGORIES.varsity_ka,
      ALL_CATEGORIES.gst,
    ];
  }

  // 6. ICT: Engineering YES, Medical NO
  if (id.includes("ict") || name.includes("তথ্য") || name.includes("আইসিটি")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.textbook,
      ALL_CATEGORIES.engineering,
      ALL_CATEGORIES.varsity_ka,
      ALL_CATEGORIES.gst,
    ];
  }

  // 7. Physics & Chemistry (Default Science): Academic, Textbook, Engineering, Medical, Varsity Ka
  return [
    ALL_CATEGORIES.academic,
    ALL_CATEGORIES.textbook,
    ALL_CATEGORIES.engineering,
    ALL_CATEGORIES.medical,
    ALL_CATEGORIES.varsity_ka,
  ];
}

interface SubjectCategoryDetailViewProps {
  subject: {
    id: string;
    name: string;
    paper: string;
    count?: number;
  };
  onBack: () => void;
  showHeader?: boolean;
  onSelectCategory?: (category: CategoryItem) => void;
}

import AcademicCategoryDetailView from "./AcademicCategoryDetailView";
import AcademicSectionDetailView from "./AcademicSectionDetailView";

export default function SubjectCategoryDetailView({
  subject,
  onBack,
  showHeader = true,
  onSelectCategory,
}: SubjectCategoryDetailViewProps) {
  const [selectedSection, setSelectedSection] = useState<CategoryItem | null>(null);
  const [showAcademicView, setShowAcademicView] = useState(false);

  const paperClean = subject.paper ? subject.paper.split(" ")[0] : "";
  const displayTitle = paperClean ? `${subject.name} ${paperClean}` : subject.name;

  if (selectedSection) {
    return (
      <AcademicSectionDetailView
        subject={subject}
        section={{
          ...selectedSection,
          count: selectedSection.count || 50,
        }}
        onBack={() => setSelectedSection(null)}
      />
    );
  }

  if (showAcademicView) {
    return (
      <AcademicCategoryDetailView
        subject={subject}
        onBack={() => setShowAcademicView(false)}
        showHeader={showHeader}
      />
    );
  }

  // Intelligently retrieve relevant categories for this specific subject
  const categories = getCategoriesForSubject(subject.id, subject.name);

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
            {displayTitle}
          </h1>

          <div className="w-10" />
        </div>
      )}

      {/* ── 2 Per Row Category Cards Grid ── */}
      <div className="px-3.5 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => {
                if (cat.id === "academic") {
                  if (onSelectCategory) {
                    onSelectCategory(cat);
                  } else {
                    setShowAcademicView(true);
                  }
                } else {
                  setSelectedSection(cat);
                }
              }}
              className={`group relative aspect-[1.25/1] rounded-[24px] sm:rounded-[28px] overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20 bg-gradient-to-br ${cat.gradient} p-3.5 sm:p-4.5 flex flex-col justify-between`}
            >
              {/* Ambient Glow */}
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute -left-6 -top-6 w-20 h-20 rounded-full bg-black/10 blur-lg pointer-events-none" />

              {/* Top Left: Card Title */}
              <div className="relative z-10 text-left pt-3 sm:pt-4 pl-1">
                <h2 className="font-['Anek_Bangla',sans-serif] font-bold text-xl sm:text-2xl text-white leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
                  {cat.title}
                </h2>
              </div>

              {/* Center / Bottom-Right: Rich Generated SVG Vector Art (Bigger) */}
              <div className="absolute right-0 bottom-0 sm:right-1 sm:bottom-1 z-0 w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center pointer-events-none">
                <div className="relative w-full h-full group-hover:scale-108 group-hover:-translate-y-1 transition-all duration-300">
                  <Image
                    src={cat.svgIcon}
                    alt={cat.title}
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
