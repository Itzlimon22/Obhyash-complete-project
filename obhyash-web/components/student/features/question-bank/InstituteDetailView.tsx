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
  marks?: number;
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
        showHeader={showHeader}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto min-h-screen bg-[#F8FAFC] dark:bg-[#000000] font-['HindSiliguri',sans-serif] select-none pb-24">
      {/* ── Top Header Bar (Matching Flutter AppBar) ── */}
      {showHeader && (
        <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md px-4 h-14 sm:h-[60px] flex items-center justify-between border-b border-neutral-200/80 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-white dark:bg-[#121212] border border-neutral-200/80 dark:border-white/[0.08] flex items-center justify-center text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08)] p-[3.5px] flex items-center justify-center shrink-0">
              {institute.logo ? (
                <img
                  src={institute.logo}
                  alt={institute.name}
                  className="w-full h-full object-contain rounded-full"
                />
              ) : institute.isBoard ? (
                <Landmark size={18} className="text-[#2563EB]" />
              ) : (
                <School size={18} className="text-[#2563EB]" />
              )}
            </div>
            <h1 className="text-[17px] sm:text-lg font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] leading-tight">
              {institute.name} প্রশ্নব্যাংক
            </h1>
          </div>

          <div className="w-9" />
        </div>
      )}

      {/* ── Serial-wise Exam Sets List (Matching Flutter 1:1) ── */}
      <div className="px-4 py-3.5 sm:py-5 space-y-3">
        {allSets.map((set) => {
          const isWritten = set.type === "written";
          const isCombined = set.type === "combined";
          const isBuet = institute.id.toLowerCase() === "buet";

          let badgeText = "MCQ";
          let badgeColorClass = "bg-sky-500/12 text-sky-600 dark:text-sky-400";
          if (isWritten) {
            badgeText = "লিখিত";
            badgeColorClass = "bg-purple-500/12 text-purple-600 dark:text-purple-400";
          } else if (isCombined) {
            badgeText = "MCQ + লিখিত";
            badgeColorClass = "bg-orange-500/12 text-orange-600 dark:text-orange-400";
          } else if (isBuet) {
            badgeText = "প্রিলি (MCQ)";
            badgeColorClass = "bg-sky-500/12 text-sky-600 dark:text-sky-400";
          }

          return (
            <div
              key={set.id}
              onClick={() => handleOpenExamSet(set)}
              className="group relative bg-white dark:bg-[#18181B] rounded-[20px] p-4 border border-[#F1F5F9] dark:border-[#27272A] shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-200 cursor-pointer select-none flex flex-col gap-2.5 active:scale-[0.98]"
            >
              {/* Top Row: Title + Type Badge */}
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-[15.5px] sm:text-base text-[#0F172A] dark:text-white font-['Anek_Bangla',sans-serif] tracking-tight truncate flex-1">
                  {set.title}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold shrink-0 ${badgeColorClass}`}
                >
                  {badgeText}
                </span>
              </div>

              {/* Bottom Row: Question Count (Left) | Time (Right) */}
              <div className="flex items-center text-[12.5px] font-semibold text-[#334155] dark:text-[#CBD5E1] pt-0.5">
                {/* Left: Question count with emerald icon */}
                <div className="flex items-center gap-1.5">
                  <FileQuestion size={15} strokeWidth={2.4} className="text-[#10B981] shrink-0" />
                  <span>{set.questionLabel}</span>
                </div>

                {/* Vertical Divider */}
                <span className="text-[#CBD5E1] dark:text-[#475569] font-light mx-2.5 select-none">
                  |
                </span>

                {/* Right: Duration in Minutes with rose icon */}
                <div className="flex items-center gap-1.5">
                  <Timer size={15} strokeWidth={2.4} className="text-[#F43F5E] shrink-0" />
                  <span>{formatDurationMinutes(set.durationMinutes)}</span>
                </div>

                <div className="flex-1" />

                {/* Chevron Right */}
                <ChevronRight
                  size={18}
                  className="text-[#94A3B8] dark:text-[#64748B] group-hover:translate-x-0.5 transition-transform shrink-0"
                />
              </div>
            </div>
          );
        })}

        {allSets.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-[#18181B] rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-800">
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
