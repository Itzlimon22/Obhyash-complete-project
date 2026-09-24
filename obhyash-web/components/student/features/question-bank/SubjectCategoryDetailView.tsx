"use client";

import React, { useState, useEffect } from "react";
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

  // 1. Math: Academic, Engineering, Varsity Ka
  if (id.includes("math") || name.includes("গণিত")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.engineering,
      ALL_CATEGORIES.varsity_ka,
    ];
  }

  // 2. Biology: Academic, Medical, Varsity Ka
  if (id.includes("biology") || name.includes("জীব")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.medical,
      ALL_CATEGORIES.varsity_ka,
    ];
  }

  // 3. Bangla: Academic, Varsity Kha, Varsity Ka
  if (id.includes("bangla") || name.includes("বাংলা")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.varsity_kha,
      ALL_CATEGORIES.varsity_ka,
    ];
  }

  // 4. English: Academic, Engineering, Medical, Varsity Ka, IBA/BUP
  if (id.includes("english") || name.includes("ইংরেজি")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.engineering,
      ALL_CATEGORIES.medical,
      ALL_CATEGORIES.varsity_ka,
      ALL_CATEGORIES.iba_bup,
    ];
  }

  // 5. Statistics: Academic, Varsity Ka
  if (id.includes("stat") || name.includes("পরিসংখ্যান")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.varsity_ka,
    ];
  }

  // 6. ICT: Academic, Engineering, Varsity Ka
  if (id.includes("ict") || name.includes("তথ্য") || name.includes("আইসিটি")) {
    return [
      ALL_CATEGORIES.academic,
      ALL_CATEGORIES.engineering,
      ALL_CATEGORIES.varsity_ka,
    ];
  }

  // 7. Physics & Chemistry (Default Science): Academic, Engineering, Medical, Varsity Ka
  return [
    ALL_CATEGORIES.academic,
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

  useEffect(() => {
    const handlePop = () => {
      if (selectedSection) {
        setSelectedSection(null);
      }
      if (showAcademicView) {
        setShowAcademicView(false);
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [selectedSection, showAcademicView]);

  const handleOpenSection = (cat: CategoryItem) => {
    if (typeof window !== "undefined") {
      window.history.pushState(
        { tab: "question_bank", qbSubView: "section", sectionId: cat.id },
        "",
        window.location.pathname + `?subject=${encodeURIComponent(subject.id)}&section=${encodeURIComponent(cat.id)}`
      );
    }
    setSelectedSection(cat);
  };

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
        onBack={() => {
          setSelectedSection(null);
          if (typeof window !== "undefined" && window.history.state?.qbSubView === "section") {
            window.history.back();
          }
        }}
        showHeader={showHeader}
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

  const subjectId = (subject.id || "").toLowerCase();
  const subjectName = (subject.name || "").toLowerCase();
  const paper = (subject.paper || "").toLowerCase();
  const isEnglishFirstPaper =
    subjectId === "english_1" ||
    subjectId === "hsc_english_1" ||
    ((subjectId.includes("english") || subjectName.includes("ইংরেজি")) &&
      (paper.includes("১ম") || paper.includes("1st") || subjectId.includes("1")));

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-[#FAF9F6] dark:bg-[#000000] font-['HindSiliguri',sans-serif] select-none pb-20">
      {/* ── Top Header ── */}
      {showHeader && (
        <div className="sticky top-0 z-40 bg-[#FAF9F6]/90 dark:bg-[#000000]/90 backdrop-blur-md px-4 h-14 sm:h-[60px] flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#121212] border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer active:scale-95 shadow-2xs"
            aria-label="Back"
          >
            <ArrowLeft size={18} className="stroke-[2.2]" />
          </button>

          <h1 className="font-['Anek_Bangla',sans-serif] font-bold text-[15px] sm:text-base md:text-[17px] text-neutral-900 dark:text-white tracking-tight text-center">
            {displayTitle}
          </h1>

          <div className="w-9" />
        </div>
      )}

      {/* ── 2 Per Row Category Cards Grid ── */}
      <div className="px-3.5 sm:px-4 py-3 sm:py-4">
        <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
          {categories.map((cat) => {
            const isEnglishAcademic = cat.id === "academic" && isEnglishFirstPaper;

            return (
              <div
                key={cat.id}
                onClick={() => {
                  if (isEnglishAcademic) {
                    alert("ইংরেজি ১ম পত্রের কন্টেন্ট শীঘ্রই যুক্ত হচ্ছে।");
                    return;
                  }
                  if (cat.id === "academic") {
                    if (onSelectCategory) {
                      onSelectCategory(cat);
                    } else {
                      setShowAcademicView(true);
                    }
                  } else {
                    handleOpenSection(cat);
                  }
                }}
                className={`group relative aspect-[1.25/1] rounded-[26px] overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20 bg-gradient-to-br ${cat.gradient} p-3 sm:p-4 flex flex-col justify-between`}
              >
                {/* Ambient Glow */}
                <div className="absolute -right-5 -bottom-5 w-[100px] h-[100px] rounded-full bg-white/12 pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                {/* Coming Soon Badge for English 1st paper academic */}
                {isEnglishAcademic && (
                  <div className="absolute top-2.5 right-3 px-2 py-0.5 bg-white/22 rounded-xl border border-white/35 text-[10.5px] font-bold text-white shadow-xs z-10">
                    শীঘ্রই আসছে
                  </div>
                )}

                {/* Top Left: Card Title */}
                <div className="relative z-10 text-left pt-2.5 sm:pt-3 pl-1 sm:pl-1.5">
                  <h2 className="font-['Anek_Bangla',sans-serif] font-bold text-[19px] sm:text-[21px] text-white leading-tight tracking-tight drop-shadow-[0_1.5px_4px_rgba(0,0,0,0.35)]">
                    {cat.title}
                  </h2>
                </div>

                {/* Bottom-Right: SVG Vector Art */}
                <div className="absolute right-[-4px] bottom-[-4px] z-0 w-24 h-24 flex items-center justify-center pointer-events-none">
                  <div className="relative w-full h-full group-hover:scale-105 group-hover:-translate-y-0.5 transition-all duration-300">
                    <Image
                      src={cat.svgIcon}
                      alt={cat.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
