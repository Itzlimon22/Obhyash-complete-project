"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  BookOpen,
  GraduationCap,
  Building2,
  ArrowRight,
  Check,
  Search,
  X,
  Landmark,
  School,
  Sparkles,
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
  accentColor?: string;
  division?: "Science" | "Business Studies" | "Humanities" | "General" | "Non-Science";
}

export interface InstituteCardItem {
  id: string;
  name: string;
  fullName: string;
  count: number;
  logo: string;
  bgColor: string; // Tailwind background gradient
  textColor: string; // Contrast text color
  bubbleColor: string;
  isBoard?: boolean;
}

interface QuestionBankViewProps {
  user?: UserProfile | null;
  onNavigateToExam?: (config: any) => void;
  activeHeaderTab: "institution" | "subject";
  onHeaderTabChange: (tab: "institution" | "subject") => void;
  onSelectSubject?: (subject: SubjectCardItem) => void;
  onSelectInstitute?: (institute: InstituteCardItem) => void;
}

// ── HSC Subject List (15 items) ──
const HSC_SUBJECTS: SubjectCardItem[] = [
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
    paper: "১ম পত্র",
    count: 5,
    image: "/images/subjects/biology_1.jpg",
    gradient: "from-[#064E3B] via-[#047857] to-[#022C22]",
    accentColor: "#10B981",
  },
  {
    id: "biology_2",
    name: "জীববিজ্ঞান",
    paper: "২য় পত্র",
    count: 5,
    image: "/images/subjects/biology_2.jpg",
    gradient: "from-[#065F46] via-[#0D9488] to-[#042F2E]",
    accentColor: "#14B8A6",
  },
  {
    id: "bangla_1",
    name: "বাংলা",
    paper: "১ম পত্র",
    count: 5,
    image: "/images/subjects/bangla_1.jpg",
    gradient: "from-[#831843] via-[#9D174D] to-[#500724]",
    accentColor: "#F43F5E",
  },
  {
    id: "bangla_2",
    name: "বাংলা",
    paper: "২য় পত্র",
    count: 5,
    image: "/images/subjects/bangla_2.jpg",
    gradient: "from-[#701A75] via-[#86198F] to-[#4A044E]",
    accentColor: "#D946EF",
  },
  {
    id: "english_1",
    name: "ইংরেজি",
    paper: "১ম পত্র",
    count: 4,
    image: "/images/subjects/english_1.jpg",
    gradient: "from-[#1E3A8A] via-[#1D4ED8] to-[#172554]",
    accentColor: "#3B82F6",
  },
  {
    id: "english_2",
    name: "ইংরেজি",
    paper: "২য় পত্র",
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
    name: "তথ্য ও যোগাযোগ",
    paper: "আইসিটি",
    count: 6,
    image: "/images/subjects/ict.jpg",
    gradient: "from-[#0E4766] via-[#0284C7] to-[#072F44]",
    accentColor: "#0EA5E9",
  },
];

// ── SSC Subject List ──
const SSC_SUBJECTS: SubjectCardItem[] = [
  // Science Core
  {
    id: "ssc_physics",
    name: "পদার্থবিজ্ঞান",
    paper: "এসএসসি",
    division: "Science",
    count: 14,
    image: "/images/subjects/physics_1.jpg",
    gradient: "from-[#0A2540] via-[#0D3B66] to-[#14213D]",
  },
  {
    id: "ssc_chemistry",
    name: "রসায়ন",
    paper: "এসএসসি",
    division: "Science",
    count: 12,
    image: "/images/subjects/chemistry_1.jpg",
    gradient: "from-[#380459] via-[#4A0E78] to-[#25023D]",
  },
  {
    id: "ssc_higher_math",
    name: "উচ্চতর গণিত",
    paper: "এসএসসি",
    division: "Science",
    count: 14,
    image: "/images/subjects/math_2.jpg",
    gradient: "from-[#8B1E03] via-[#9E2A2B] to-[#540B0E]",
  },
  {
    id: "ssc_biology",
    name: "জীববিজ্ঞান",
    paper: "এসএসসি",
    division: "Science",
    count: 14,
    image: "/images/subjects/biology_1.jpg",
    gradient: "from-[#064E3B] via-[#047857] to-[#022C22]",
  },
  // Business Studies
  {
    id: "ssc_accounting",
    name: "হিসাববিজ্ঞান",
    paper: "এসএসসি",
    division: "Business Studies",
    count: 12,
    image: "/images/subjects/language.jpg",
    gradient: "from-[#1E3A8A] via-[#1D4ED8] to-[#172554]",
  },
  {
    id: "ssc_business_ent",
    name: "ব্যবসায় উদ্যোগ",
    paper: "এসএসসি",
    division: "Business Studies",
    count: 12,
    image: "/images/subjects/language.jpg",
    gradient: "from-[#7A3602] via-[#8C4303] to-[#542401]",
  },
  {
    id: "ssc_finance_banking",
    name: "ফিন্যান্স ও ব্যাংকিং",
    paper: "এসএসসি",
    division: "Business Studies",
    count: 11,
    image: "/images/subjects/language.jpg",
    gradient: "from-[#065F46] via-[#047857] to-[#022C22]",
  },
  // Humanities
  {
    id: "ssc_history_bd",
    name: "ইতিহাস ও বিশ্ব সভ্যতা",
    paper: "এসএসসি",
    division: "Humanities",
    count: 15,
    image: "/images/subjects/language.jpg",
    gradient: "from-[#701A75] via-[#86198F] to-[#4A044E]",
  },
  {
    id: "ssc_geography",
    name: "ভূগোল ও পরিবেশ",
    paper: "এসএসসি",
    division: "Humanities",
    count: 14,
    image: "/images/subjects/language.jpg",
    gradient: "from-[#0F766E] via-[#0D9488] to-[#134E4A]",
  },
  {
    id: "ssc_civics",
    name: "পৌরনীতি ও নাগরিকতা",
    paper: "এসএসসি",
    division: "Humanities",
    count: 12,
    image: "/images/subjects/language.jpg",
    gradient: "from-[#164E63] via-[#0891B2] to-[#155E75]",
  },
  {
    id: "ssc_economics",
    name: "অর্থনীতি",
    paper: "এসএসসি",
    division: "Humanities",
    count: 10,
    image: "/images/subjects/math_1.jpg",
    gradient: "from-[#831843] via-[#9D174D] to-[#500724]",
  },
  // Elective / General Science
  {
    id: "ssc_general_science",
    name: "সাধারণ বিজ্ঞান",
    paper: "এসএসসি",
    division: "Non-Science",
    count: 14,
    image: "/images/subjects/chemistry_1.jpg",
    gradient: "from-[#0A2540] via-[#0D3B66] to-[#14213D]",
  },
  // General Compulsory
  {
    id: "ssc_math",
    name: "সাধারণ গণিত",
    paper: "এসএসসি",
    division: "General",
    count: 17,
    image: "/images/subjects/math_1.jpg",
    gradient: "from-[#7A3602] via-[#8C4303] to-[#542401]",
  },
  {
    id: "ssc_bangla_1",
    name: "বাংলা",
    paper: "১ম পত্র",
    division: "General",
    count: 2,
    image: "/images/subjects/bangla_1.jpg",
    gradient: "from-[#831843] via-[#9D174D] to-[#500724]",
  },
  {
    id: "ssc_bangla_2",
    name: "বাংলা",
    paper: "২য় পত্র",
    division: "General",
    count: 17,
    image: "/images/subjects/bangla_2.jpg",
    gradient: "from-[#701A75] via-[#86198F] to-[#4A044E]",
  },
  {
    id: "ssc_english_1",
    name: "ইংরেজি",
    paper: "১ম পত্র",
    division: "General",
    count: 14,
    image: "/images/subjects/english_1.jpg",
    gradient: "from-[#1E3A8A] via-[#1D4ED8] to-[#172554]",
  },
  {
    id: "ssc_english_2",
    name: "ইংরেজি",
    paper: "২য় পত্র",
    division: "General",
    count: 15,
    image: "/images/subjects/english_2.jpg",
    gradient: "from-[#0F766E] via-[#0D9488] to-[#134E4A]",
  },
  {
    id: "ssc_ict",
    name: "তথ্য ও যোগাযোগ",
    paper: "আইসিটি",
    division: "General",
    count: 6,
    image: "/images/subjects/ict.jpg",
    gradient: "from-[#0E4766] via-[#0284C7] to-[#072F44]",
  },
  {
    id: "ssc_bgs",
    name: "বাংলাদেশ ও বিশ্ব",
    paper: "বিজিএস",
    division: "General",
    count: 16,
    image: "/images/subjects/language.jpg",
    gradient: "from-[#164E63] via-[#0891B2] to-[#155E75]",
  },
  {
    id: "ssc_religion",
    name: "ধর্ম ও নৈতিক শিক্ষা",
    paper: "এসএসসি",
    division: "General",
    count: 4,
    image: "/images/subjects/bangla_1.jpg",
    gradient: "from-[#065F46] via-[#059669] to-[#047857]",
  },
];

// ── Admission Institutes (17 items) ──
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
    fullName: "সমন্বিত সাধারণ ও প্রযুক্তি বিশ্ববিদ্যালয় গুচ্ছ",
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

// ── SSC Education Boards & Top Schools (14 items) ──
const SSC_INSTITUTES: InstituteCardItem[] = [
  {
    id: "board_dhaka",
    name: "ঢাকা বোর্ড",
    fullName: "মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড, ঢাকা",
    count: 28,
    logo: "",
    isBoard: true,
    bgColor: "bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6]",
    textColor: "text-[#1E3A8A]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "board_chittagong",
    name: "চট্টগ্রাম বোর্ড",
    fullName: "মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড, চট্টগ্রাম",
    count: 26,
    logo: "",
    isBoard: true,
    bgColor: "bg-gradient-to-br from-[#065F46] via-[#059669] to-[#10B981]",
    textColor: "text-[#064E3B]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "board_rajshahi",
    name: "রাজশাহী বোর্ড",
    fullName: "মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড, রাজশাহী",
    count: 26,
    logo: "",
    isBoard: true,
    bgColor: "bg-gradient-to-br from-[#831843] via-[#9D174D] to-[#F43F5E]",
    textColor: "text-[#4C0519]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "board_comilla",
    name: "কুমিল্লা বোর্ড",
    fullName: "মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড, কুমিল্লা",
    count: 24,
    logo: "",
    isBoard: true,
    bgColor: "bg-gradient-to-br from-[#4C0254] via-[#701A75] to-[#A855F7]",
    textColor: "text-[#3B0764]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "board_jessore",
    name: "যশোর বোর্ড",
    fullName: "মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড, যশোর",
    count: 24,
    logo: "",
    isBoard: true,
    bgColor: "bg-gradient-to-br from-[#7A3602] via-[#B45309] to-[#F59E0B]",
    textColor: "text-[#78350F]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "board_sylhet",
    name: "সিলেট বোর্ড",
    fullName: "মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড, সিলেট",
    count: 22,
    logo: "",
    isBoard: true,
    bgColor: "bg-gradient-to-br from-[#0E4766] via-[#0284C7] to-[#38BDF8]",
    textColor: "text-[#082F49]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "board_dinajpur",
    name: "দিনাজপুর বোর্ড",
    fullName: "মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড, দিনাজপুর",
    count: 22,
    logo: "",
    isBoard: true,
    bgColor: "bg-gradient-to-br from-[#312E81] via-[#4338CA] to-[#6366F1]",
    textColor: "text-[#1E1B4B]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "board_barisal",
    name: "বরিশাল বোর্ড",
    fullName: "মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড, বরিশাল",
    count: 20,
    logo: "",
    isBoard: true,
    bgColor: "bg-gradient-to-br from-[#134E4A] via-[#0D9488] to-[#2DD4BF]",
    textColor: "text-[#134E4A]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "board_mymensingh",
    name: "ময়মনসিংহ বোর্ড",
    fullName: "মাধ্যমিক ও উচ্চমাধ্যমিক শিক্ষা বোর্ড, ময়মনসিংহ",
    count: 18,
    logo: "",
    isBoard: true,
    bgColor: "bg-gradient-to-br from-[#701A75] via-[#9333EA] to-[#C084FC]",
    textColor: "text-[#3B0764]",
    bubbleColor: "bg-white/20",
  },
  // Top Schools
  {
    id: "school_rajuk",
    name: "রাজউক উত্তরা",
    fullName: "রাজউক উত্তরা মডেল কলেজ",
    count: 15,
    logo: "",
    isBoard: false,
    bgColor: "bg-gradient-to-br from-[#1E3A8A] via-[#3B82F6] to-[#60A5FA]",
    textColor: "text-[#1E3A8A]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "school_ideal",
    name: "আইডিয়াল স্কুল",
    fullName: "আইডিয়াল স্কুল অ্যান্ড কলেজ, মতিঝিল",
    count: 15,
    logo: "",
    isBoard: false,
    bgColor: "bg-gradient-to-br from-[#065F46] via-[#10B981] to-[#34D399]",
    textColor: "text-[#064E3B]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "school_viqarunnisa",
    name: "ভিকারুননিসা",
    fullName: "ভিকারুননিসা নূন স্কুল অ্যান্ড কলেজ",
    count: 14,
    logo: "",
    isBoard: false,
    bgColor: "bg-gradient-to-br from-[#831843] via-[#F43F5E] to-[#FB7185]",
    textColor: "text-[#4C0519]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "school_cadet",
    name: "ক্যাডেট কলেজ",
    fullName: "সকল ক্যাডেট কলেজ সমন্বিত টেস্ট",
    count: 16,
    logo: "",
    isBoard: false,
    bgColor: "bg-gradient-to-br from-[#7A3602] via-[#F59E0B] to-[#FBBF24]",
    textColor: "text-[#78350F]",
    bubbleColor: "bg-white/20",
  },
  {
    id: "school_st_joseph",
    name: "সেন্ট জোসেফ",
    fullName: "সেন্ট জোসেফ উচ্চ মাধ্যমিক বিদ্যালয়",
    count: 12,
    logo: "",
    isBoard: false,
    bgColor: "bg-gradient-to-br from-[#4C0254] via-[#9333EA] to-[#A855F7]",
    textColor: "text-[#3B0764]",
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
  const isSSC = Boolean(
    user?.stream?.toLowerCase().includes("ssc") ||
    user?.level?.toLowerCase().includes("ssc")
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<string>("all");

  const optionalSubject = (user?.optional_subject || "").trim().toLowerCase();
  const userDivision = (user?.division || "").toLowerCase().trim();

  // Filtered Subjects based strictly on user stream
  const filteredSubjects = useMemo(() => {
    const sourceList = isSSC ? SSC_SUBJECTS : HSC_SUBJECTS;
    const query = searchQuery.trim().toLowerCase();

    return sourceList.filter((subject) => {
      // Search query filter
      if (query) {
        const matchesName = subject.name.toLowerCase().includes(query);
        const matchesPaper = subject.paper.toLowerCase().includes(query);
        if (!matchesName && !matchesPaper) return false;
      }

      // SSC division filter
      if (isSSC) {
        if (selectedDivision !== "all") {
          const subDiv = subject.division || "General";
          if (subDiv !== "General" && subDiv !== selectedDivision) {
            return false;
          }
        } else if (userDivision && userDivision !== "general") {
          const subDiv = subject.division || "General";
          if (subDiv !== "General") {
            const isBizUser =
              userDivision.includes("business") ||
              userDivision.includes("commerce") ||
              userDivision.includes("বাণিজ্য") ||
              userDivision.includes("ব্যবসায়");
            const isHumUser =
              userDivision.includes("humanities") ||
              userDivision.includes("arts") ||
              userDivision.includes("মানবিক");
            const isSciUser =
              userDivision.includes("science") ||
              userDivision.includes("বিজ্ঞান");

            if (isBizUser && subDiv !== "Business Studies" && subDiv !== "Non-Science") return false;
            if (isHumUser && subDiv !== "Humanities" && subDiv !== "Non-Science") return false;
            if (isSciUser && subDiv !== "Science") return false;
          }
        }
      }

      // Optional subject filter (Statistics vs Biology for HSC)
      if (!isSSC && optionalSubject) {
        const id = subject.id.toLowerCase();
        const name = subject.name.toLowerCase();
        const isBiology = id.includes("biology") || name.includes("জীববিজ্ঞান");
        const isStatistics = id.includes("statistics") || name.includes("পরিসংখ্যান");

        if (optionalSubject.includes("stat")) {
          if (isBiology) return false;
        } else if (optionalSubject.includes("bio")) {
          if (isStatistics) return false;
        }
      }

      return true;
    });
  }, [isSSC, searchQuery, selectedDivision, userDivision, optionalSubject]);

  // Filtered Institutes based strictly on user stream
  const filteredInstitutes = useMemo(() => {
    const sourceList = isSSC ? SSC_INSTITUTES : ADMISSION_INSTITUTES;
    const query = searchQuery.trim().toLowerCase();

    if (!query) return sourceList;

    return sourceList.filter((inst) => {
      const matchesName = inst.name.toLowerCase().includes(query);
      const matchesFull = inst.fullName.toLowerCase().includes(query);
      const matchesId = inst.id.toLowerCase().includes(query);
      return matchesName || matchesFull || matchesId;
    });
  }, [isSSC, searchQuery]);

  return (
    <div className="w-full flex flex-col font-sans pb-16">
      {/* ── Top Bar: Search Filter ── */}
      <div className="mb-5 sm:mb-6 flex items-center justify-between gap-4">
        {/* Real-time Search Input */}
        <div className="relative w-full max-w-md">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeHeaderTab === "subject"
                ? "বিষয় বা পত্র খুঁজুন..."
                : isSSC
                ? "শিক্ষা বোর্ড বা স্কুল খুঁজুন..."
                : "বিশ্ববিদ্যালয় বা ইনস্টিটিউট খুঁজুন..."
            }
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-[#27272A] text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-[#12544F]/50 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ── Sub-Filter for SSC Divisions (only visible for SSC students) ── */}
      {isSSC && activeHeaderTab === "subject" && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {[
            { id: "all", label: "সকল বিষয়" },
            { id: "Science", label: "বিজ্ঞান বিভাগ" },
            { id: "Business Studies", label: "ব্যবসায় শিক্ষা" },
            { id: "Humanities", label: "মানবিক বিভাগ" },
          ].map((div) => (
            <button
              key={div.id}
              type="button"
              onClick={() => setSelectedDivision(div.id)}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedDivision === div.id
                  ? "bg-[#12544F]/15 text-[#12544F] dark:bg-[#12544F]/30 dark:text-emerald-400 border border-[#12544F]/30"
                  : "bg-neutral-100 dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border border-neutral-200/60 dark:border-[#27272A]"
              }`}
            >
              {div.label}
            </button>
          ))}
        </div>
      )}

      {/* ── TAB 1: SUBJECT-WISE (বিষয় ভিত্তিক) ── */}
      {activeHeaderTab === "subject" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6">
            {filteredSubjects.map((item) => {
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectSubject && onSelectSubject(item)}
                  className="group relative rounded-[26px] overflow-hidden aspect-square cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/10 select-none flex flex-col justify-between p-4 sm:p-5"
                >
                  {/* Background Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} z-0`}
                  />
                  {/* Subject Photo with Smooth Zoom */}
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover object-center blur-[0.8px] scale-102 group-hover:scale-108 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/20 to-black/45 pointer-events-none" />
                  </div>

                  {/* Top-Left: Bengali Subject Name & Paper */}
                  <div className="relative z-10 text-left">
                    <h2 className="font-['Anek_Bangla',sans-serif] font-bold text-lg sm:text-2xl text-white leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                      {item.name}
                    </h2>
                    <p className="font-['HindSiliguri',sans-serif] text-xs sm:text-sm font-medium text-white/90 mt-0.5 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
                      {item.paper}
                    </p>
                  </div>

                  {/* Bottom: Action Indicator */}
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white/75 bg-black/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full">
                      অধ্যায়ভিত্তিক
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight size={14} />
                    </div>
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

      {/* ── TAB 2: INSTITUTION-WISE (প্রতিষ্ঠান ভিত্তিক) ── */}
      {activeHeaderTab === "institution" && (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3.5 sm:gap-5 md:gap-6">
            {filteredInstitutes.map((inst) => {
              return (
                <div
                  key={inst.id}
                  onClick={() => onSelectInstitute && onSelectInstitute(inst)}
                  className={`group relative rounded-[26px] overflow-hidden aspect-[1.18/1] cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] border border-white/20 select-none flex flex-col justify-between p-3.5 sm:p-5 ${inst.bgColor}`}
                >
                  {/* Decorative Corner Bubbles matching mobile app */}
                  <div
                    className={`absolute -top-6 -right-6 w-24 h-24 rounded-full ${inst.bubbleColor} blur-xs pointer-events-none`}
                  />
                  <div
                    className={`absolute -bottom-6 -left-6 w-20 h-20 rounded-full ${inst.bubbleColor} blur-xs pointer-events-none`}
                  />

                  {/* 1. Center Top: Official Logo or Board Landmark in White Circular Emblem */}
                  <div className="relative z-10 w-full flex justify-center pt-1 sm:pt-2">
                    <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.12)] flex items-center justify-center p-2.5 transition-transform group-hover:scale-105 duration-300">
                      {inst.logo ? (
                        <img
                          src={inst.logo}
                          alt={inst.name}
                          className="w-full h-full object-contain drop-shadow-xs"
                        />
                      ) : (
                        <div className="text-neutral-800 flex items-center justify-center">
                          {inst.isBoard ? (
                            <Landmark size={28} className="text-[#1E3A8A]" />
                          ) : (
                            <School size={28} className="text-[#065F46]" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Middle: Large Bold Bengali Institute Name */}
                  <div className="relative z-10 text-center my-auto">
                    <h2
                      className={`font-['Anek_Bangla',sans-serif] font-extrabold text-xl sm:text-2xl md:text-[26px] leading-tight tracking-tight drop-shadow-xs ${inst.textColor}`}
                    >
                      {inst.name}
                    </h2>
                  </div>

                  {/* Optional top-right check badge on IUT */}
                  {inst.id === "iut" && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="w-6 h-6 rounded-full bg-white/90 text-[#0891B2] flex items-center justify-center shadow-xs">
                        <Check size={13} className="stroke-[3]" />
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
    </div>
  );
};

export default QuestionBankView;
