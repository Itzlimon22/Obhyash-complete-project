"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  GraduationCap,
  Building2,
  ArrowRight,
  Check,
} from "lucide-react";
import SubjectCategoryDetailView from "./SubjectCategoryDetailView";
import { UserProfile } from "@/lib/types";

export interface SubjectCardItem {
  id: string;
  name: string;
  paper: string;
  count: number;
  image: string;
  gradient: string;
  accentColor: string;
}

interface QuestionBankViewProps {
  user?: UserProfile | null;
  onNavigateToExam?: (config: any) => void;
  activeHeaderTab: "institution" | "subject";
  onHeaderTabChange: (tab: "institution" | "subject") => void;
  onSelectSubject?: (subject: SubjectCardItem) => void;
  onSelectInstitute?: (institute: InstituteCardItem) => void;
}

const SUBJECT_LIST: SubjectCardItem[] = [
  {
    id: "physics_1",
    name: "পদার্থবিজ্ঞান",
    paper: "১ম পত্র",
    count: 5,
    image: "/images/subjects/physics_1.jpg",
    gradient: "from-[#0A2540] via-[#0D3B66] to-[#14213D]",
    accentColor: "#3B82F6",
  },
  {
    id: "physics_2",
    name: "পদার্থবিজ্ঞান",
    paper: "২য় পত্র",
    count: 5,
    image: "/images/subjects/physics_2.jpg",
    gradient: "from-[#033E8C] via-[#00509D] to-[#00296B]",
    accentColor: "#2563EB",
  },
  {
    id: "chemistry_1",
    name: "রসায়ন",
    paper: "১ম পত্র",
    count: 5,
    image: "/images/subjects/chemistry_1.jpg",
    gradient: "from-[#380459] via-[#4A0E78] to-[#25023D]",
    accentColor: "#8B5CF6",
  },
  {
    id: "chemistry_2",
    name: "রসায়ন",
    paper: "২য় পত্র",
    count: 5,
    image: "/images/subjects/chemistry_2.jpg",
    gradient: "from-[#4C0254] via-[#63046D] to-[#2F0135]",
    accentColor: "#A855F7",
  },
  {
    id: "math_1",
    name: "উচ্চতর গণিত",
    paper: "১ম পত্র",
    count: 4,
    image: "/images/subjects/math_1.jpg",
    gradient: "from-[#7A3602] via-[#8C4303] to-[#542401]",
    accentColor: "#F59E0B",
  },
  {
    id: "math_2",
    name: "উচ্চতর গণিত",
    paper: "২য় পত্র",
    count: 4,
    image: "/images/subjects/math_2.jpg",
    gradient: "from-[#8B1E03] via-[#9E2A2B] to-[#540B0E]",
    accentColor: "#EF4444",
  },
  {
    id: "biology_1",
    name: "জীববিজ্ঞান",
    paper: "১ম পত্র (উদ্ভিদবিজ্ঞান)",
    count: 5,
    image: "/images/subjects/biology_1.jpg",
    gradient: "from-[#064E3B] via-[#047857] to-[#022C22]",
    accentColor: "#10B981",
  },
  {
    id: "biology_2",
    name: "জীববিজ্ঞান",
    paper: "২য় পত্র (প্রাণিবিজ্ঞান)",
    count: 5,
    image: "/images/subjects/biology_2.jpg",
    gradient: "from-[#065F46] via-[#0D9488] to-[#042F2E]",
    accentColor: "#14B8A6",
  },
  {
    id: "bangla_1",
    name: "বাংলা",
    paper: "১ম পত্র (সাহিত্য)",
    count: 5,
    image: "/images/subjects/bangla_1.jpg",
    gradient: "from-[#831843] via-[#9D174D] to-[#500724]",
    accentColor: "#F43F5E",
  },
  {
    id: "bangla_2",
    name: "বাংলা",
    paper: "২য় পত্র (ব্যাকরণ ও নির্মিতি)",
    count: 5,
    image: "/images/subjects/bangla_2.jpg",
    gradient: "from-[#701A75] via-[#86198F] to-[#4A044E]",
    accentColor: "#D946EF",
  },
  {
    id: "english_1",
    name: "ইংরেজি",
    paper: "১ম পত্র (English 1st)",
    count: 4,
    image: "/images/subjects/english_1.jpg",
    gradient: "from-[#1E3A8A] via-[#1D4ED8] to-[#172554]",
    accentColor: "#3B82F6",
  },
  {
    id: "english_2",
    name: "ইংরেজি",
    paper: "২য় পত্র (English 2nd)",
    count: 4,
    image: "/images/subjects/english_2.jpg",
    gradient: "from-[#0F766E] via-[#0D9488] to-[#134E4A]",
    accentColor: "#14B8A6",
  },
  {
    id: "statistics_1",
    name: "পরিসংখ্যান",
    paper: "১ম পত্র",
    count: 4,
    image: "/images/subjects/statistics_1.jpg",
    gradient: "from-[#7C2D12] via-[#C2410C] to-[#431407]",
    accentColor: "#EA580C",
  },
  {
    id: "statistics_2",
    name: "পরিসংখ্যান",
    paper: "২য় পত্র",
    count: 4,
    image: "/images/subjects/statistics_2.jpg",
    gradient: "from-[#312E81] via-[#4338CA] to-[#1E1B4B]",
    accentColor: "#6366F1",
  },
  {
    id: "ict",
    name: "আইসিটি",
    paper: "তথ্য ও যোগাযোগ প্রযুক্তি",
    count: 6,
    image: "/images/subjects/ict.jpg",
    gradient: "from-[#0E4766] via-[#0284C7] to-[#072F44]",
    accentColor: "#0EA5E9",
  },
];

// ── Official Admission Institutes Data matching user reference screenshot ──
export interface InstituteCardItem {
  id: string;
  name: string;
  fullName: string;
  count: number;
  logo: string;
  clusterLogos?: string[];
  bgColor: string; // Tailwind background style
  textColor: string; // Deep contrast text color
  bubbleColor: string;
}

const ADMISSION_INSTITUTES: InstituteCardItem[] = [
  {
    id: "buet",
    name: "বুয়েট",
    fullName: "বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয়",
    count: 38,
    logo: "/images/institutes/buet.png",
    bgColor: "bg-gradient-to-br from-[#FF4D82] via-[#F43F5E] to-[#E11D48]",
    textColor: "text-[#4C0519]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "ckruet",
    name: "গুচ্ছ ইঞ্জিঃ",
    fullName: "চুয়েট • কুয়েট • রুয়েট গুচ্ছ",
    count: 4,
    logo: "/images/institutes/ckruet.png",
    bgColor: "bg-gradient-to-br from-[#60A5FA] via-[#3B82F6] to-[#2563EB]",
    textColor: "text-[#1E3A8A]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "ruet",
    name: "রুয়েট",
    fullName: "রাজশাহী প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    count: 15,
    logo: "/images/institutes/ruet.png",
    bgColor: "bg-gradient-to-br from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9]",
    textColor: "text-[#2E1065]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "kuet",
    name: "কুয়েট",
    fullName: "খুলনা প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    count: 19,
    logo: "/images/institutes/kuet.png",
    bgColor: "bg-gradient-to-br from-[#FBBF24] via-[#F59E0B] to-[#D97706]",
    textColor: "text-[#78350F]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "cuet",
    name: "চুয়েট",
    fullName: "চট্টগ্রাম প্রকৌশল ও প্রযুক্তি বিশ্ববিদ্যালয়",
    count: 16,
    logo: "/images/institutes/cuet.png",
    bgColor: "bg-gradient-to-br from-[#34D399] via-[#10B981] to-[#059669]",
    textColor: "text-[#064E3B]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "iut",
    name: "IUT",
    fullName: "ইসলামিক ইউনিভার্সিটি অব টেকনোলজি",
    count: 14,
    logo: "/images/institutes/iut.png",
    bgColor: "bg-gradient-to-br from-[#22D3EE] via-[#06B6D4] to-[#0891B2]",
    textColor: "text-[#164E63]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "medical",
    name: "মেডিকেল",
    fullName: "জাতীয় মেডিকেল ও ডেন্টাল ভর্তি পরীক্ষা (DGME)",
    count: 25,
    logo: "/images/institutes/medical.png",
    bgColor: "bg-gradient-to-br from-[#FB7185] via-[#F43F5E] to-[#BE123C]",
    textColor: "text-[#4C0519]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "du",
    name: "ঢাবি",
    fullName: "ঢাকা বিশ্ববিদ্যালয় ('ক' ও 'খ' ইউনিট)",
    count: 22,
    logo: "/images/institutes/du.png",
    bgColor: "bg-gradient-to-br from-[#818CF8] via-[#6366F1] to-[#4F46E5]",
    textColor: "text-[#1E1B4B]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "ju",
    name: "জাবি",
    fullName: "জাহাঙ্গীরনগর বিশ্ববিদ্যালয়",
    count: 18,
    logo: "/images/institutes/ju.png",
    bgColor: "bg-gradient-to-br from-[#FB923C] via-[#F97316] to-[#C2410C]",
    textColor: "text-[#7C2D12]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "ru",
    name: "রাবি",
    fullName: "রাজশাহী বিশ্ববিদ্যালয়",
    count: 17,
    logo: "/images/institutes/ru.png",
    bgColor: "bg-gradient-to-br from-[#A78BFA] via-[#8B5CF6] to-[#7C3AED]",
    textColor: "text-[#3B0764]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "cu",
    name: "চবি",
    fullName: "চট্টগ্রাম বিশ্ববিদ্যালয়",
    count: 15,
    logo: "/images/institutes/cu.png",
    bgColor: "bg-gradient-to-br from-[#2DD4BF] via-[#14B8A6] to-[#0D9488]",
    textColor: "text-[#134E4A]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "sust",
    name: "শাবিপ্রবি",
    fullName: "শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়",
    count: 16,
    logo: "/images/institutes/sust.png",
    bgColor: "bg-gradient-to-br from-[#4ADE80] via-[#22C55E] to-[#15803D]",
    textColor: "text-[#14532D]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "butex",
    name: "বুটেক্স",
    fullName: "বাংলাদেশ টেক্সটাইল বিশ্ববিদ্যালয়",
    count: 12,
    logo: "/images/institutes/butex.png",
    bgColor: "bg-gradient-to-br from-[#93C5FD] via-[#60A5FA] to-[#3B82F6]",
    textColor: "text-[#1E3A8A]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "mist",
    name: "এমআইএসটি",
    fullName: "মিলিটারি ইনস্টিটিউট অব সায়েন্স অ্যান্ড টেকনোলজি",
    count: 10,
    logo: "/images/institutes/mist.png",
    bgColor: "bg-gradient-to-br from-[#38BDF8] via-[#0284C7] to-[#0369A1]",
    textColor: "text-[#082F49]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "bup",
    name: "বিইউপি",
    fullName: "বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস",
    count: 8,
    logo: "/images/institutes/bup.png",
    bgColor: "bg-gradient-to-br from-[#34D399] via-[#059669] to-[#047857]",
    textColor: "text-[#064E3B]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "gst",
    name: "জিএসটি গুচ্ছ",
    fullName: "সমন্বিত সাধারণ ও প্রযুক্তি বিশ্ববিদ্যালয় গুচ্ছ (SUST, JnU, KU...)",
    count: 5,
    logo: "/images/institutes/gst.png",
    bgColor: "bg-gradient-to-br from-[#FCD34D] via-[#F59E0B] to-[#B45309]",
    textColor: "text-[#451A03]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "agri",
    name: "কৃষি গুচ্ছ",
    fullName: "সমন্বিত কৃষি বিশ্ববিদ্যালয় গুচ্ছ (BAU, SAU...)",
    count: 6,
    logo: "/images/institutes/agri.png",
    bgColor: "bg-gradient-to-br from-[#A3E635] via-[#84CC16] to-[#4D7C0F]",
    textColor: "text-[#1A2E05]",
    bubbleColor: "bg-white/20",
  },
];

export const QuestionBankView: React.FC<QuestionBankViewProps> = ({
  user,
  onNavigateToExam,
  activeHeaderTab,
  onHeaderTabChange,
  onSelectSubject,
  onSelectInstitute,
}) => {
  const [selectedSubjectDetail, setSelectedSubjectDetail] = useState<SubjectCardItem | null>(null);
  const [selectedSubjectModal, setSelectedSubjectModal] = useState<SubjectCardItem | null>(null);
  const [selectedInstModal, setSelectedInstModal] = useState<InstituteCardItem | null>(null);

  const filteredSubjects = SUBJECT_LIST;
  const filteredInstitutes = ADMISSION_INSTITUTES;

  if (selectedSubjectDetail) {
    return (
      <SubjectCategoryDetailView
        subject={selectedSubjectDetail}
        onBack={() => setSelectedSubjectDetail(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-3 sm:py-6 font-['HindSiliguri',sans-serif] pb-24">
      {/* ── TAB 1: SUBJECT-WISE (বিষয় ভিত্তিক) ── */}
      {activeHeaderTab === "subject" && (
        <div>
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:gap-6">
            {filteredSubjects.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (onSelectSubject) {
                      onSelectSubject(item);
                    } else {
                      setSelectedSubjectDetail(item);
                    }
                  }}
                  className="group relative rounded-[26px] sm:rounded-[32px] overflow-hidden aspect-square cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/10 select-none flex flex-col justify-between p-3.5 sm:p-5"
                >
                  {/* Background Image with Fallback Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} z-0`}
                  />
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 50vw, 380px"
                      className="object-cover object-center blur-[0.8px] scale-102 group-hover:scale-108 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/35 pointer-events-none" />
                  </div>

                  {/* Top-Left: Bengali Subject Name & Paper */}
                  <div className="relative z-10 text-left">
                    <h2 className="font-['Anek_Bangla',sans-serif] font-bold text-lg sm:text-2xl md:text-[26px] text-white leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                      {item.name}
                    </h2>
                    <p className="font-['HindSiliguri',sans-serif] text-xs sm:text-sm md:text-base font-medium text-white/90 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                      {item.paper}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSubjects.length === 0 && (
            <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">কোনো বিষয় খুঁজে পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: INSTITUTION-WISE (প্রতিষ্ঠান ভিত্তিক) - 2 PER ROW WITH REAL LOGOS EXACTLY LIKE USER SCREENSHOT ── */}
      {activeHeaderTab === "institution" && (
        <div>
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:gap-6">
            {filteredInstitutes.map((inst) => {
              return (
                <div
                  key={inst.id}
                  onClick={() => {
                    if (onSelectInstitute) {
                      onSelectInstitute(inst);
                    } else {
                      setSelectedInstModal(inst);
                    }
                  }}
                  className={`group relative rounded-[28px] sm:rounded-[36px] overflow-hidden aspect-square cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20 select-none flex flex-col justify-between p-3.5 sm:p-5 ${inst.bgColor}`}
                >
                  {/* Decorative Corner Bubbles matching screenshot */}
                  <div
                    className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${inst.bubbleColor} blur-xs pointer-events-none`}
                  />
                  <div
                    className={`absolute -bottom-6 -left-6 w-20 h-20 rounded-full ${inst.bubbleColor} blur-xs pointer-events-none`}
                  />

                  {/* 1. Center Top: Official Logo in White Circular Emblem */}
                  <div className="relative z-10 w-full flex justify-center pt-1 sm:pt-2">
                    <div className="w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center p-2 sm:p-2.5 transition-transform group-hover:scale-105 duration-300">
                      <img
                        src={inst.logo}
                        alt={inst.name}
                        className="w-full h-full object-contain drop-shadow-xs"
                      />
                    </div>
                  </div>

                  {/* 2. Middle: Large Bold Bengali Institute Name */}
                  <div className="relative z-10 text-center my-auto">
                    <h2
                      className={`font-['Anek_Bangla',sans-serif] font-bold text-xl sm:text-2xl md:text-[28px] leading-tight tracking-tight drop-shadow-xs ${inst.textColor}`}
                    >
                      {inst.name}
                    </h2>
                  </div>

                  {/* Optional top-right check badge on IUT / selected as seen in screenshot */}
                  {inst.id === "iut" && (
                    <div className="relative z-10 flex justify-end">
                      <div className="w-7 h-7 rounded-full bg-white/90 text-[#0891B2] flex items-center justify-center shadow-xs">
                        <Check size={14} className="stroke-[3]" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredInstitutes.length === 0 && (
            <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
              <Building2 size={40} className="mx-auto mb-3 opacity-40" />
              <p className="text-base font-medium">কোনো প্রতিষ্ঠান খুঁজে পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      )}

      {/* ── Subject Modal / Detail Drawer ── */}
      {selectedSubjectModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedSubjectModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#151518] rounded-3xl p-6 border border-neutral-200 dark:border-[#27272A] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-36 rounded-2xl overflow-hidden mb-4 border border-white/10">
              <Image
                src={selectedSubjectModal.image}
                alt={selectedSubjectModal.name}
                fill
                className="object-cover blur-[0.8px] scale-102"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
                <h3 className="text-2xl font-bold text-white font-['Anek_Bangla']">
                  {selectedSubjectModal.name}
                </h3>
                <p className="text-sm text-white/90">{selectedSubjectModal.paper}</p>
              </div>
            </div>

            <div className="space-y-3 mb-5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#1E1E22] text-sm">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                  অধ্যায় সংখ্যা
                </span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {selectedSubjectModal.count * 2} টি অধ্যায়
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#1E1E22] text-sm">
                <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                  প্রশ্ন ব্যাংক সংখ্যা
                </span>
                <span className="font-bold text-[#059669] dark:text-emerald-400">
                  ১,৫০০+ বিগত বছরের প্রশ্ন
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedSubjectModal(null);
                  if (typeof window !== "undefined") {
                    window.location.href = "/practice";
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm sm:text-base text-center transition-all cursor-pointer shadow-md active:scale-98"
              >
                অধ্যায়ভিত্তিক অনুশীলন
              </button>
              <button
                type="button"
                onClick={() => setSelectedSubjectModal(null)}
                className="px-5 py-3 rounded-xl bg-neutral-100 dark:bg-[#25252A] hover:bg-neutral-200 dark:hover:bg-[#2C2C32] text-neutral-700 dark:text-neutral-200 font-semibold text-sm transition-all cursor-pointer"
              >
                বন্ধ করো
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Institution Modal ── */}
      {selectedInstModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedInstModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-[#151518] rounded-3xl p-6 border border-neutral-200 dark:border-[#27272A] shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 dark:bg-[#1E1E22] border border-neutral-200 dark:border-[#2E2E32] flex items-center justify-center p-2">
                <img
                  src={selectedInstModal.logo}
                  alt={selectedInstModal.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-['Anek_Bangla']">
                  {selectedInstModal.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {selectedInstModal.fullName}
                </p>
              </div>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-5 leading-relaxed">
              বিগত {selectedInstModal.count} সেট ভর্তি পরীক্ষার সকল বিষয়ের প্রশ্ন নির্ভুল সমাধান ও ব্যাখ্যাসহ সাজানো রয়েছে।
            </p>

            <div className="space-y-2.5 mb-6">
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#1E1E22] text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">প্রশ্ন সেট সংখ্যা</span>
                <span className="font-bold text-neutral-900 dark:text-white">
                  {selectedInstModal.count} টি বিগত বছরের সেট
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#1E1E22] text-sm">
                <span className="text-neutral-500 dark:text-neutral-400">মোট প্রশ্ন</span>
                <span className="font-bold text-[#059669] dark:text-emerald-400">
                  {selectedInstModal.count * 60}+ প্রশ্ন
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedInstModal(null);
                  if (typeof window !== "undefined") {
                    window.location.href = "/setup";
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm sm:text-base text-center transition-all cursor-pointer shadow-md active:scale-98"
              >
                মডেল টেস্ট শুরু করো
              </button>
              <button
                type="button"
                onClick={() => setSelectedInstModal(null)}
                className="px-5 py-3 rounded-xl bg-neutral-100 dark:bg-[#25252A] hover:bg-neutral-200 dark:hover:bg-[#2C2C32] text-neutral-700 dark:text-neutral-200 font-semibold text-sm transition-all cursor-pointer"
              >
                বন্ধ করো
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBankView;
