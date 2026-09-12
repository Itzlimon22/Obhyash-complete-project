"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Timer,
  FileQuestion,
  Sparkles,
  ChevronRight,
  BookOpen,
  Landmark,
  School,
} from "lucide-react";
import ExamSetDetailView from "./ExamSetDetailView";

export interface InstituteExamSet {
  id: string;
  title: string;
  year: string;
  questionCount: number;
  questionLabel: string;
  durationMinutes: number;
  durationLabel: string;
  type: "mcq" | "written" | "combined";
}

export function formatDurationMinutes(minutes: number): string {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  const bnStr = minutes
    .toString()
    .split("")
    .map((c) => {
      const idx = parseInt(c, 10);
      return !isNaN(idx) ? bnDigits[idx] : c;
    })
    .join("");
  return `${bnStr} মিনিট`;
}

export interface InstituteCardItem {
  id: string;
  name: string;
  fullName: string;
  count: number;
  logo: string;
  bgColor: string;
  textColor: string;
  bubbleColor: string;
  isBoard?: boolean;
}

import { Question } from "@/lib/types";

interface InstituteDetailViewProps {
  institute: InstituteCardItem;
  onBack: () => void;
  showHeader?: boolean;
  onStartExam?: (examSet: InstituteExamSet, questions: Question[]) => void;
}

/**
 * Intelligent historical exam set generator for Bangladesh admission institutes
 */
export function getInstituteExamSets(instituteId: string): InstituteExamSet[] {
  const sets: InstituteExamSet[] = [];
  const id = instituteId.toLowerCase();

  if (id.startsWith("board_")) {
    for (let yr = 2024; yr >= 2015; yr--) {
      sets.push({
        id: `${id}_${yr}_mcq`,
        title: `এসএসসি ${yr} বহুনির্বাচনী`,
        year: `${yr}`,
        questionCount: 30,
        questionLabel: "৩০টি প্রশ্ন",
        durationMinutes: 30,
        durationLabel: "৩০ মিনিট",
        type: "mcq",
      });
      sets.push({
        id: `${id}_${yr}_cq`,
        title: `এসএসসি ${yr} সৃজনশীল`,
        year: `${yr}`,
        questionCount: 11,
        questionLabel: "১১টি প্রশ্ন",
        durationMinutes: 150,
        durationLabel: "২ ঘণ্টা ৩০ মিনিট",
        type: "written",
      });
    }
    return sets;
  }

  if (id.startsWith("school_")) {
    for (const yr of [2024, 2023, 2022]) {
      sets.push({
        id: `${id}_${yr}_test_mcq`,
        title: `টেস্ট পরীক্ষা ${yr} (MCQ)`,
        year: `${yr}`,
        questionCount: 30,
        questionLabel: "৩০টি প্রশ্ন",
        durationMinutes: 30,
        durationLabel: "৩০ মিনিট",
        type: "mcq",
      });
      sets.push({
        id: `${id}_${yr}_model_mcq`,
        title: `মডেল টেস্ট ${yr} (MCQ)`,
        year: `${yr}`,
        questionCount: 30,
        questionLabel: "৩০টি প্রশ্ন",
        durationMinutes: 30,
        durationLabel: "৩০ মিনিট",
        type: "mcq",
      });
      sets.push({
        id: `${id}_${yr}_cq`,
        title: `টেস্ট পরীক্ষা ${yr} (সৃজনশীল)`,
        year: `${yr}`,
        questionCount: 11,
        questionLabel: "১১টি প্রশ্ন",
        durationMinutes: 150,
        durationLabel: "২ ঘণ্টা ৩০ মিনিট",
        type: "written",
      });
    }
    return sets;
  }

  switch (id) {
    case "buet":
      // 2025-26 (Upcoming / Latest Model)
      sets.push({
        id: "buet-25-26-written",
        title: "BUET 25-26 written",
        year: "2025-26",
        questionCount: 45,
        questionLabel: "৪৫টি প্রশ্ন",
        durationMinutes: 180,
        durationLabel: "৩ ঘণ্টা",
        type: "written",
      });
      // 2021-22 to 2024-25: Preli MCQ (100 Q, 1 hr) and Final Written (40 Q, 2 hr)
      const buetDualYears = [
        { session: "24-25", preliQ: 100, writtenQ: 40, writtenDur: "২ ঘণ্টা", writtenMins: 120 },
        { session: "23-24", preliQ: 100, writtenQ: 40, writtenDur: "২ ঘণ্টা", writtenMins: 120 },
        { session: "22-23", preliQ: 100, writtenQ: 40, writtenDur: "২ ঘণ্টা", writtenMins: 120 },
        { session: "21-22", preliQ: 100, writtenQ: 40, writtenDur: "২ ঘণ্টা", writtenMins: 120 },
      ];
      for (const y of buetDualYears) {
        sets.push({
          id: `buet-preli-${y.session}`,
          title: `BUET Preli ${y.session} MCQ`,
          year: y.session,
          questionCount: y.preliQ,
          questionLabel: `${y.preliQ}টি প্রশ্ন`,
          durationMinutes: 60,
          durationLabel: "১ ঘণ্টা",
          type: "mcq",
        });
        sets.push({
          id: `buet-written-${y.session}`,
          title: `BUET ${y.session} Written`,
          year: y.session,
          questionCount: y.writtenQ,
          questionLabel: `${y.writtenQ}টি প্রশ্ন`,
          durationMinutes: y.writtenMins,
          durationLabel: y.writtenDur,
          type: "written",
        });
      }
      // 2020-21: Written only (COVID session)
      sets.push({
        id: "buet-written-20-21",
        title: "BUET 20-21 WRITTEN",
        year: "20-21",
        questionCount: 40,
        questionLabel: "৪০টি প্রশ্ন",
        durationMinutes: 120,
        durationLabel: "২ ঘণ্টা",
        type: "written",
      });
      // 2019-20 down to 2001-02: Traditional 60-question written exam (3 hrs)
      const buetSingleYears = [
        "19-20", "18-19", "17-18", "16-17", "15-16", "14-15",
        "13-14", "12-13", "11-12", "10-11", "09-10", "08-09",
        "07-08", "06-07", "05-06", "04-05", "03-04", "02-03", "01-02",
      ];
      for (const yr of buetSingleYears) {
        sets.push({
          id: `buet-written-${yr}`,
          title: `BUET ${yr} WRITTEN`,
          year: yr,
          questionCount: 60,
          questionLabel: "৬০টি প্রশ্ন",
          durationMinutes: 180,
          durationLabel: "৩ ঘণ্টা",
          type: "written",
        });
      }
      break;

    case "ckruet":
      // CKRUET combined engineering cluster (2020-21 to 2023-24)
      const ckruetYears = ["2023-24", "2022-23", "2021-22", "2020-21"];
      for (const yr of ckruetYears) {
        sets.push({
          id: `ckruet-${yr}`,
          title: `গুচ্ছ ইঞ্জিঃ (CKRUET) ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন (৫০০ নম্বর)",
          durationMinutes: 150,
          durationLabel: "২ ঘণ্টা ৩০ মিনিট",
          type: "mcq",
        });
      }
      break;

    case "medical":
      // National Medical (MBBS & BDS) Admission Test: 100 MCQs, 1 hour
      const medYears = [
        "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
        "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
        "2014-15", "2013-14", "2012-13", "2011-12", "2010-11",
        "2009-10", "2008-09", "2007-08", "2006-07", "2005-06",
      ];
      for (const yr of medYears) {
        sets.push({
          id: `medical-${yr}`,
          title: `মেডিকেল ভর্তি পরীক্ষা ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন",
          durationMinutes: 60,
          durationLabel: "১ ঘণ্টা",
          type: "mcq",
        });
      }
      break;

    case "du":
      // Dhaka University 'KA' Unit
      const duRecent = ["2024-25", "2023-24", "2022-23", "2021-22", "2020-21", "2019-20"];
      for (const yr of duRecent) {
        sets.push({
          id: `du-${yr}`,
          title: `ঢাবি 'ক' ইউনিট ${yr}`,
          year: yr,
          questionCount: 60,
          questionLabel: "৬০টি MCQ + লিখিত",
          durationMinutes: 90,
          durationLabel: "১ ঘণ্টা ৩০ মিনিট",
          type: "combined",
        });
      }
      const duOlder = [
        "2018-19", "2017-18", "2016-17", "2015-16", "2014-15",
        "2013-14", "2012-13", "2011-12", "2010-11",
      ];
      for (const yr of duOlder) {
        sets.push({
          id: `du-${yr}`,
          title: `ঢাবি 'ক' ইউনিট ${yr}`,
          year: yr,
          questionCount: 120,
          questionLabel: "১২০টি প্রশ্ন",
          durationMinutes: 90,
          durationLabel: "১ ঘণ্টা ৩০ মিনিট",
          type: "mcq",
        });
      }
      break;

    case "ju":
      // Jahangirnagar University: 80 questions, 55 minutes
      const juYears = [
        "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
        "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
      ];
      for (const yr of juYears) {
        sets.push({
          id: `ju-${yr}`,
          title: `জাবি 'A' ইউনিট ${yr}`,
          year: yr,
          questionCount: 80,
          questionLabel: "৮০টি প্রশ্ন",
          durationMinutes: 55,
          durationLabel: "৫৫ মিনিট",
          type: "mcq",
        });
      }
      break;

    case "ru":
      // Rajshahi University 'C' Unit: 80 questions, 1 hour
      const ruYears = [
        "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
        "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
      ];
      for (const yr of ruYears) {
        sets.push({
          id: `ru-${yr}`,
          title: `রাবি 'C' ইউনিট ${yr}`,
          year: yr,
          questionCount: 80,
          questionLabel: "৮০টি প্রশ্ন",
          durationMinutes: 60,
          durationLabel: "১ ঘণ্টা",
          type: "mcq",
        });
      }
      break;

    case "cu":
      // Chittagong University 'A' Unit: 100 questions, 1 hour
      const cuYears = [
        "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
        "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
      ];
      for (const yr of cuYears) {
        sets.push({
          id: `cu-${yr}`,
          title: `চবি 'A' ইউনিট ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন",
          durationMinutes: 60,
          durationLabel: "১ ঘণ্টা",
          type: "mcq",
        });
      }
      break;

    case "sust":
      // SUST (Individual before GST cluster): 70 questions, 1.5 hrs
      const sustYears = [
        "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
        "2014-15", "2013-14", "2012-13", "2011-12", "2010-11",
      ];
      for (const yr of sustYears) {
        sets.push({
          id: `sust-${yr}`,
          title: `শাবিপ্রবি 'A' ইউনিট ${yr}`,
          year: yr,
          questionCount: 70,
          questionLabel: "৭০টি প্রশ্ন",
          durationMinutes: 90,
          durationLabel: "১ ঘণ্টা ৩০ মিনিট",
          type: "mcq",
        });
      }
      break;

    case "butex":
      // BUTEX: 100 questions (200 marks), 2 hours
      const butexYears = [
        "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
        "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
      ];
      for (const yr of butexYears) {
        sets.push({
          id: `butex-${yr}`,
          title: `বুটেক্স ভর্তি পরীক্ষা ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন (২০০ নম্বর)",
          durationMinutes: 120,
          durationLabel: "২ ঘণ্টা",
          type: "mcq",
        });
      }
      break;

    case "mist":
      // MIST: 100 questions, 3 hours
      const mistYears = [
        "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
        "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
      ];
      for (const yr of mistYears) {
        sets.push({
          id: `mist-${yr}`,
          title: `এমআইএসটি (MIST) ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন",
          durationMinutes: 180,
          durationLabel: "৩ ঘণ্টা",
          type: "combined",
        });
      }
      break;

    case "iut":
      // IUT: 100 questions (English version), 2 hours
      const iutYears = [
        "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
        "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
      ];
      for (const yr of iutYears) {
        sets.push({
          id: `iut-${yr}`,
          title: `IUT Admission Test ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন",
          durationMinutes: 120,
          durationLabel: "২ ঘণ্টা",
          type: "mcq",
        });
      }
      break;

    case "bup":
      // BUP: 100 questions, 1 hour
      const bupYears = [
        "2024-25", "2023-24", "2022-23", "2021-22", "2020-21",
        "2019-20", "2018-19", "2017-18", "2016-17",
      ];
      for (const yr of bupYears) {
        sets.push({
          id: `bup-${yr}`,
          title: `বিইউপি (BUP FST) ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন",
          durationMinutes: 60,
          durationLabel: "১ ঘণ্টা",
          type: "mcq",
        });
      }
      break;

    case "gst":
      // GST General Science & Technology Cluster
      const gstYears = ["2023-24", "2022-23", "2021-22", "2020-21"];
      for (const yr of gstYears) {
        sets.push({
          id: `gst-${yr}`,
          title: `জিএসটি গুচ্ছ (GST 'A') ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন",
          durationMinutes: 60,
          durationLabel: "১ ঘণ্টা",
          type: "mcq",
        });
      }
      break;

    case "agri":
      // Agriculture Cluster (BAU, SAU...)
      const agriYears = ["2023-24", "2022-23", "2021-22", "2020-21", "2019-20"];
      for (const yr of agriYears) {
        sets.push({
          id: `agri-${yr}`,
          title: `কৃষি গুচ্ছ ভর্তি পরীক্ষা ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন",
          durationMinutes: 60,
          durationLabel: "১ ঘণ্টা",
          type: "mcq",
        });
      }
      break;

    // Individual Engineering Universities (RUET, KUET, CUET before cluster)
    case "ruet":
    case "kuet":
    case "cuet":
      const engName =
        instituteId === "ruet" ? "রুয়েট" : instituteId === "kuet" ? "কুয়েট" : "চুয়েট";
      const engYears = [
        "2019-20", "2018-19", "2017-18", "2016-17", "2015-16",
        "2014-15", "2013-14", "2012-13", "2011-12", "2010-11",
      ];
      for (const yr of engYears) {
        sets.push({
          id: `${instituteId}-${yr}`,
          title: `${engName} ভর্তি পরীক্ষা ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন",
          durationMinutes: 90,
          durationLabel: "১ ঘণ্টা ৩০ মিনিট",
          type: "mcq",
        });
      }
      break;

    default:
      // Fallback 10 recent sets
      const genericYears = ["2024-25", "2023-24", "2022-23", "2021-22", "2020-21", "2019-20"];
      for (const yr of genericYears) {
        sets.push({
          id: `${instituteId}-${yr}`,
          title: `${instituteId.toUpperCase()} ভর্তি পরীক্ষা ${yr}`,
          year: yr,
          questionCount: 100,
          questionLabel: "১০০টি প্রশ্ন",
          durationMinutes: 60,
          durationLabel: "১ ঘণ্টা",
          type: "mcq",
        });
      }
      break;
  }

  return sets;
}

export const InstituteDetailView: React.FC<InstituteDetailViewProps> = ({
  institute,
  onBack,
  showHeader = true,
  onStartExam,
}) => {
  const [selectedExamSet, setSelectedExamSet] = useState<InstituteExamSet | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "mcq" | "written">("all");

  useEffect(() => {
    const handlePop = () => {
      if (selectedExamSet) {
        setSelectedExamSet(null);
      }
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [selectedExamSet]);

  const handleOpenExamSet = (set: InstituteExamSet) => {
    if (typeof window !== "undefined") {
      window.history.pushState(
        { tab: "question_bank", qbSubView: "exam_set", setId: set.id },
        "",
        window.location.pathname + `?institute=${encodeURIComponent(institute.id)}&set=${encodeURIComponent(set.id)}`
      );
    }
    setSelectedExamSet(set);
  };

  const allSets = useMemo(() => {
    const rawSets = getInstituteExamSets(institute.id);
    if (typeFilter === "all") return rawSets;
    if (typeFilter === "mcq") {
      return rawSets.filter((s) => s.type === "mcq" || s.type === "combined");
    }
    return rawSets.filter((s) => s.type === "written");
  }, [institute.id, typeFilter]);

  if (selectedExamSet) {
    return (
      <ExamSetDetailView
        institute={institute}
        examSet={selectedExamSet}
        onBack={() => {
          setSelectedExamSet(null);
          if (typeof window !== "undefined" && window.history.state?.qbSubView === "exam_set") {
            window.history.back();
          }
        }}
        onTakeExam={onStartExam}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200">
      {/* ── Optional Custom Header ── */}
      {showHeader && (
        <div className="relative flex items-center justify-center min-h-[44px]">
          <button
            type="button"
            onClick={onBack}
            className="absolute left-0 w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white shadow-xs p-1 flex items-center justify-center shrink-0">
              {institute.logo ? (
                <img
                  src={institute.logo}
                  alt={institute.name}
                  className="w-full h-full object-contain"
                />
              ) : institute.isBoard ? (
                <Landmark size={20} className="text-[#1E3A8A]" />
              ) : (
                <School size={20} className="text-[#065F46]" />
              )}
            </div>
            <h1 className="text-[15px] sm:text-base md:text-[17px] font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] leading-tight">
              {institute.name} প্রশ্নব্যাংক
            </h1>
          </div>
        </div>
      )}

      {/* ── Institute Hero Summary Card ── */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 text-white shadow-lg ${institute.bgColor}`}
      >
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/15 blur-md pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 rounded-full bg-white/15 blur-md pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2.5 shadow-md flex items-center justify-center shrink-0">
              {institute.logo ? (
                <img
                  src={institute.logo}
                  alt={institute.name}
                  className="w-full h-full object-contain"
                />
              ) : institute.isBoard ? (
                <Landmark size={36} className="text-[#1E3A8A]" />
              ) : (
                <School size={36} className="text-[#065F46]" />
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-bold tracking-wide uppercase mb-1.5">
                <Sparkles size={12} />
                <span>প্রশ্নব্যাংক সংগ্রহ</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-['Anek_Bangla',sans-serif] drop-shadow-xs">
                {institute.name}
              </h2>
              <p className="text-xs sm:text-sm text-white/85 line-clamp-1 max-w-md">
                {institute.fullName}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right shrink-0">
            <span className="text-3xl font-black">{allSets.length}টি</span>
            <span className="text-xs text-white/80 font-medium">প্রশ্ন সেট</span>
          </div>
        </div>
      </div>

      {/* ── Set Type Filter Buttons ── */}
      <div className="flex items-center gap-2 pt-1">
        {[
          { id: "all", label: "সকল সেট" },
          { id: "mcq", label: "MCQ প্রশ্ন" },
          { id: "written", label: "লিখিত / সৃজনশীল" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTypeFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none ${
              typeFilter === tab.id
                ? "bg-[#12544F] text-white shadow-xs"
                : "bg-neutral-100 dark:bg-[#18181B] text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-[#27272A] hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Serial-wise Exam Cards (Matching User Reference with Swapped Sides & Distinct Icons) ── */}
      <div className="space-y-3 sm:space-y-3.5">
        {allSets.map((set) => {
          return (
            <div
              key={set.id}
              onClick={() => handleOpenExamSet(set)}
              className="group relative bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-emerald-600/30 dark:hover:border-emerald-500/30 transition-all duration-200 cursor-pointer select-none flex flex-col gap-2.5 active:scale-[0.99]"
            >
              {/* Top: Bold Title + Type Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 font-['Anek_Bangla',sans-serif] tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                    {set.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                      set.type === "written"
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                        : set.type === "combined"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                    }`}
                  >
                    {set.type === "written"
                      ? "লিখিত"
                      : set.type === "combined"
                      ? "MCQ + লিখিত"
                      : institute.id.toLowerCase() === "buet"
                      ? "প্রিলি (MCQ)"
                      : "MCQ"}
                  </span>
                </div>
                <ChevronRight
                  size={18}
                  className="text-neutral-300 dark:text-neutral-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0"
                />
              </div>

              {/* Bottom: Swapped Sides (Question on Left, Duration on Right with Distinct Icons) */}
              <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold pt-0.5 text-neutral-700 dark:text-neutral-300">
                {/* 1. Left: Question Count with color ONLY on icon */}
                <div className="flex items-center gap-1.5">
                  <FileQuestion size={15} strokeWidth={2.3} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{set.questionLabel}</span>
                </div>

                {/* Vertical Divider */}
                <span className="text-neutral-300 dark:text-neutral-700 font-light select-none">
                  |
                </span>

                {/* 2. Right: Duration in Minutes with color ONLY on icon */}
                <div className="flex items-center gap-1.5">
                  <Timer size={15} strokeWidth={2.3} className="text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>{formatDurationMinutes(set.durationMinutes)}</span>
                </div>
              </div>
            </div>
          );
        })}

        {allSets.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
            <BookOpen size={36} className="mx-auto text-neutral-400 mb-2 opacity-60" />
            <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              কোনো প্রশ্ন সেট পাওয়া যায়নি
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstituteDetailView;
