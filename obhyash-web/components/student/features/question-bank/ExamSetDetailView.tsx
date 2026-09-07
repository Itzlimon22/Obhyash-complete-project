"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  FileQuestion,
  Award,
  Layers,
  Timer,
  AlertCircle,
  Calculator,
  Eye,
  Play,
  Atom,
  FlaskConical,
  Dna,
  BookOpen,
  Languages,
  Globe,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Question } from "@/lib/types";
import {
  InstituteCardItem,
  InstituteExamSet,
  formatDurationMinutes,
} from "./InstituteDetailView";
import QuestionViewerPage from "./QuestionViewerPage";
import { fetchInstituteExamSetQuestions } from "@/services/question-bank-service";

interface ExamSetDetailViewProps {
  institute: InstituteCardItem;
  examSet: InstituteExamSet;
  onBack: () => void;
  onTakeExam?: (examSet: InstituteExamSet, questions: Question[]) => void;
}

interface SubjectDistribution {
  subject: string;
  questions: string;
  marks: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
}

function getSubjectDistributions(
  instituteId: string,
  examSet: InstituteExamSet
): SubjectDistribution[] {
  const id = instituteId.toLowerCase();
  const isWritten = examSet.type === "written";

  if (id === "buet") {
    if (isWritten) {
      return [
        {
          subject: "পদার্থবিজ্ঞান",
          questions: "১৩-১৪টি প্রশ্ন",
          marks: "১৩৫ নম্বর",
          icon: Atom,
          iconColor: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-500/10",
        },
        {
          subject: "রসায়ন",
          questions: "১৩-১৪টি প্রশ্ন",
          marks: "১৩৫ নম্বর",
          icon: FlaskConical,
          iconColor: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-500/10",
        },
        {
          subject: "উচ্চতর গণিত",
          questions: "১৩-১৪টি প্রশ্ন",
          marks: "১৩০ নম্বর",
          icon: Calculator,
          iconColor: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-500/10",
        },
      ];
    } else {
      return [
        {
          subject: "পদার্থবিজ্ঞান",
          questions: "৩৪টি প্রশ্ন",
          marks: "৩৪ নম্বর",
          icon: Atom,
          iconColor: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-500/10",
        },
        {
          subject: "রসায়ন",
          questions: "৩৩টি প্রশ্ন",
          marks: "৩৩ নম্বর",
          icon: FlaskConical,
          iconColor: "text-purple-600 dark:text-purple-400",
          bgColor: "bg-purple-500/10",
        },
        {
          subject: "উচ্চতর গণিত",
          questions: "৩৩টি প্রশ্ন",
          marks: "৩৩ নম্বর",
          icon: Calculator,
          iconColor: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-500/10",
        },
      ];
    }
  }

  if (id === "ckruet" || id === "ruet" || id === "kuet" || id === "cuet") {
    return [
      {
        subject: "পদার্থবিজ্ঞান",
        questions: "২৫টি প্রশ্ন",
        marks: "১২৫ নম্বর",
        icon: Atom,
        iconColor: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
      },
      {
        subject: "রসায়ন",
        questions: "২৫টি প্রশ্ন",
        marks: "১২৫ নম্বর",
        icon: FlaskConical,
        iconColor: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-500/10",
      },
      {
        subject: "উচ্চতর গণিত",
        questions: "২৫টি প্রশ্ন",
        marks: "১২৫ নম্বর",
        icon: Calculator,
        iconColor: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
      },
      {
        subject: "ইংরেজি",
        questions: "২৫টি প্রশ্ন",
        marks: "১২৫ নম্বর",
        icon: BookOpen,
        iconColor: "text-teal-600 dark:text-teal-400",
        bgColor: "bg-teal-500/10",
      },
    ];
  }

  if (id === "medical") {
    return [
      {
        subject: "জীববিজ্ঞান",
        questions: "৩০টি প্রশ্ন",
        marks: "৩০ নম্বর",
        icon: Dna,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
      },
      {
        subject: "রসায়ন",
        questions: "২৫টি প্রশ্ন",
        marks: "২৫ নম্বর",
        icon: FlaskConical,
        iconColor: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-500/10",
      },
      {
        subject: "পদার্থবিজ্ঞান",
        questions: "২০টি প্রশ্ন",
        marks: "২০ নম্বর",
        icon: Atom,
        iconColor: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
      },
      {
        subject: "ইংরেজি",
        questions: "১৫টি প্রশ্ন",
        marks: "১৫ নম্বর",
        icon: Languages,
        iconColor: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
      },
      {
        subject: "সাধারণ জ্ঞান",
        questions: "১০টি প্রশ্ন",
        marks: "১০ নম্বর",
        icon: Globe,
        iconColor: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-500/10",
      },
    ];
  }

  if (id.includes("du")) {
    return [
      {
        subject: "পদার্থবিজ্ঞান",
        questions: "১৫টি MCQ + লিখিত",
        marks: "২৫ নম্বর",
        icon: Atom,
        iconColor: "text-blue-600 dark:text-blue-400",
        bgColor: "bg-blue-500/10",
      },
      {
        subject: "রসায়ন",
        questions: "১৫টি MCQ + লিখিত",
        marks: "২৫ নম্বর",
        icon: FlaskConical,
        iconColor: "text-purple-600 dark:text-purple-400",
        bgColor: "bg-purple-500/10",
      },
      {
        subject: "উচ্চতর গণিত",
        questions: "১৫টি MCQ + লিখিত",
        marks: "২৫ নম্বর",
        icon: Calculator,
        iconColor: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10",
      },
      {
        subject: "জীববিজ্ঞান / আইসিটি",
        questions: "১৫টি MCQ + লিখিত",
        marks: "২৫ নম্বর",
        icon: Dna,
        iconColor: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10",
      },
    ];
  }

  // Default distribution
  return [
    {
      subject: "পদার্থবিজ্ঞান",
      questions: "২৫টি প্রশ্ন",
      marks: "২৫ নম্বর",
      icon: Atom,
      iconColor: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      subject: "রসায়ন",
      questions: "২৫টি প্রশ্ন",
      marks: "২৫ নম্বর",
      icon: FlaskConical,
      iconColor: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-500/10",
    },
    {
      subject: "উচ্চতর গণিত",
      questions: "২৫টি প্রশ্ন",
      marks: "২৫ নম্বর",
      icon: Calculator,
      iconColor: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
    {
      subject: "জীববিজ্ঞান / অন্যান্য",
      questions: "২৫টি প্রশ্ন",
      marks: "২৫ নম্বর",
      icon: Dna,
      iconColor: "text-teal-600 dark:text-teal-400",
      bgColor: "bg-teal-500/10",
    },
  ];
}

export const ExamSetDetailView: React.FC<ExamSetDetailViewProps> = ({
  institute,
  examSet,
  onBack,
  onTakeExam,
}) => {
  const [viewMode, setViewMode] = useState<"details" | "read">("details");
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [fetchedQuestions, setFetchedQuestions] = useState<Question[]>([]);

  const instId = institute.id.toLowerCase();
  const isWritten = examSet.type === "written";
  const isBuet = instId === "buet";

  const formatText = isWritten
    ? "লিখিত"
    : examSet.type === "combined"
    ? "MCQ + লিখিত"
    : isBuet
    ? "প্রিলি (MCQ)"
    : "MCQ";

  const totalMarks = isWritten
    ? 400
    : instId === "ckruet"
    ? 500
    : instId === "mist"
    ? 200
    : 100;

  const negativeMarkText = !isWritten ? "০.২৫ নম্বর / ভুল" : "নেই";
  const calculatorAllowed =
    instId === "medical" ? "অনুমোদিত নয়" : "অনুমোদিত (Non-prog)";

  const distributions = getSubjectDistributions(institute.id, examSet);

  // Helper to ensure questions are loaded
  const loadQuestions = async (): Promise<Question[]> => {
    if (fetchedQuestions.length > 0) return fetchedQuestions;
    setIsLoadingQuestions(true);
    try {
      const qs = await fetchInstituteExamSetQuestions(institute.id, examSet);
      setFetchedQuestions(qs);
      return qs;
    } catch (err) {
      console.error("Error loading questions:", err);
      return [];
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Handler for 'প্রশ্ন দেখো' (Read/Study Mode)
  const handleViewQuestions = async () => {
    const qs = await loadQuestions();
    if (qs.length > 0) {
      setViewMode("read");
    }
  };

  // Handler for 'পরীক্ষা দাও' (Mock Exam Mode)
  const handleStartExam = async () => {
    const qs = await loadQuestions();
    if (onTakeExam) {
      onTakeExam(examSet, qs);
    } else if (typeof window !== "undefined") {
      window.location.href = `/setup?institute=${institute.id}&set=${examSet.id}`;
    }
  };

  // If in Read/Practice mode, show the full QuestionViewerPage
  if (viewMode === "read") {
    return (
      <QuestionViewerPage
        institute={institute}
        examSet={examSet}
        questions={fetchedQuestions}
        onBack={() => setViewMode("details")}
        onTakeExam={handleStartExam}
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-5 animate-in fade-in duration-200 relative">
      {/* Loading Overlay */}
      {isLoadingQuestions && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col items-center gap-3 max-w-xs text-center animate-in zoom-in-95">
            <Loader2 size={36} className="text-emerald-600 animate-spin" />
            <span className="font-bold text-sm text-neutral-900 dark:text-white font-['HindSiliguri',sans-serif]">
              প্রশ্নমালা প্রস্তুত করা হচ্ছে...
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
              {institute.name} ({examSet.year}) সেশনের প্রশ্ন লোড হচ্ছে
            </span>
          </div>
        </div>
      )}
      {/* ── Top Bar with Back Button & Centered Title ── */}
      <div className="relative flex items-center justify-center min-h-[44px]">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-0 w-10 h-10 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors shadow-2xs cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={18} strokeWidth={2.2} />
        </button>
        <h1 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] leading-tight text-center truncate max-w-[70%]">
          {examSet.title}
        </h1>
      </div>

      {/* ── Header Badge Card ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-sm flex items-center gap-4">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 p-2 shadow-xs flex items-center justify-center shrink-0">
          <img
            src={institute.logo}
            alt={institute.name}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg sm:text-xl font-extrabold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] truncate">
              {examSet.title}
            </h2>
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold shrink-0 ${
                examSet.type === "written"
                  ? "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                  : examSet.type === "combined"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                  : "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
              }`}
            >
              {formatText}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
            {institute.name} ভর্তি পরীক্ষা • সেশন: {examSet.year}
          </p>
        </div>
      </div>

      {/* ── Section: পরীক্ষার তথ্যাবলি (Single Box with 2 Columns) ── */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 font-['Anek_Bangla',sans-serif]">
          পরীক্ষার তথ্যাবলি
        </h3>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 divide-x divide-neutral-100 dark:divide-neutral-800">
            {/* Column 1 */}
            <div className="space-y-3 sm:space-y-3.5 pr-2">
              {/* মোট প্রশ্ন */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <FileQuestion size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                    মোট প্রশ্ন
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white font-['HindSiliguri',sans-serif] truncate block">
                    {examSet.questionLabel}
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

              {/* পূর্ণমান */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Award size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                    পূর্ণমান
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white font-['HindSiliguri',sans-serif] truncate block">
                    {totalMarks} নম্বর
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

              {/* পদ্ধতি */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Layers size={18} className="text-purple-600 dark:text-purple-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                    পদ্ধতি
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white font-['HindSiliguri',sans-serif] truncate block">
                    {formatText}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3 sm:space-y-3.5 pl-4 sm:pl-6">
              {/* নির্ধারিত সময় */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Timer size={18} className="text-rose-500 dark:text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                    নির্ধারিত সময়
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white font-['HindSiliguri',sans-serif] truncate block">
                    {formatDurationMinutes(examSet.durationMinutes)}
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

              {/* নেগেটিভ মার্ক */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <AlertCircle size={18} className="text-red-500 dark:text-red-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                    নেগেটিভ মার্ক
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white font-['HindSiliguri',sans-serif] truncate block">
                    {negativeMarkText}
                  </span>
                </div>
              </div>

              <div className="border-t border-neutral-100 dark:border-neutral-800/80" />

              {/* ক্যালকুলেটর */}
              <div className="flex items-center gap-2.5 sm:gap-3">
                <Calculator size={18} className="text-sky-500 dark:text-sky-400 shrink-0" />
                <div className="min-w-0">
                  <span className="block text-[11px] text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
                    ক্যালকুলেটর
                  </span>
                  <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white font-['HindSiliguri',sans-serif] truncate block">
                    {calculatorAllowed}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: বিষয়ভিত্তিক নম্বর বণ্টন (Single Box with 2 Columns) ── */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-base sm:text-lg text-neutral-900 dark:text-neutral-100 font-['Anek_Bangla',sans-serif]">
          বিষয়ভিত্তিক নম্বর বণ্টন
        </h3>

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 p-4 sm:p-5 shadow-xs">
          <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-3.5 sm:gap-y-4">
            {distributions.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg ${item.bgColor} flex items-center justify-center shrink-0`}
                  >
                    <IconComp size={16} className={item.iconColor} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white font-['HindSiliguri',sans-serif] truncate block">
                      {item.subject}
                    </span>
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif] truncate block">
                      {item.questions} • {item.marks}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom Fixed Action Bar: ২ টি বাটন (প্রশ্ন দেখো, পরীক্ষা দাও) ── */}
      <div className="pt-4 pb-2 sticky bottom-0 z-20 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-t border-neutral-200/80 dark:border-neutral-800 -mx-4 px-4 sm:-mx-6 sm:px-6">
        <div className="flex gap-3 max-w-4xl mx-auto">
          {/* Button 1: প্রশ্ন দেখো (View Questions) */}
          <button
            type="button"
            onClick={handleViewQuestions}
            disabled={isLoadingQuestions}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-neutral-300 dark:border-neutral-700 hover:border-neutral-400 dark:hover:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 font-bold text-sm sm:text-base transition-all cursor-pointer shadow-xs active:scale-98 flex items-center justify-center gap-2 font-['HindSiliguri',sans-serif] disabled:opacity-50"
          >
            <Eye size={18} className="text-neutral-600 dark:text-neutral-300" />
            <span>প্রশ্ন দেখো</span>
          </button>

          {/* Button 2: পরীক্ষা দাও (Start Exam) */}
          <button
            type="button"
            onClick={handleStartExam}
            disabled={isLoadingQuestions}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-98 flex items-center justify-center gap-2 font-['HindSiliguri',sans-serif] disabled:opacity-50"
          >
            <Play size={18} className="fill-white" />
            <span>পরীক্ষা দাও</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSetDetailView;
