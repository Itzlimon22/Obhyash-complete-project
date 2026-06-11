"use client";

import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  BookOpen,
  Layout,
  Settings2,
  Share2,
  Sparkles,
  Zap,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/error-utils";

import { ExamConfig, Difficulty, ExamDetails } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ExamTypeSelection,
  DifficultySelection,
  QuestionCountSelection,
  TimeSelection,
  NegativeMarkingSelection,
} from "@/components/student/features/exam/setup/ExamSettings";
import { TopicSelector } from "@/components/student/features/exam/setup/TopicSelector";
import { SubjectSelector } from "@/components/student/features/exam/setup/SubjectSelector";

import { EXAM_TYPE_OPTIONS } from "@/lib/constants";
import { getAvailableQuestionCount } from "@/services/exam-service";
import { getSubjects, getChapters, getTopics } from "@/services/database";

interface ExamSetupFormProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
  // Passed from StudentRoot (already fetched server-side) — avoids a redundant
  // getUserProfile() call on every setup page open
  userDivision?: string;
  userStream?: string;
  userOptionalSubject?: string;
}

interface Subject {
  id: string;
  label?: string;
  icon?: string | React.ReactNode;
  name: string;
  rawName?: string; // Added rawName
  serial?: number; // Serial number for consistent ordering
}

interface Item {
  id: string;
  name: string;
  serial?: number; // Serial number for consistent ordering
}

const STATIC_SUBJECT_ICONS: Record<string, string> = {
  Physics: "⚛️",
  Chemistry: "🧪",
  Math: "📐",
  Biology: "🧬",
  Bangla: "📚",
  English: "📝",
  GK: "🌍",
  ICT: "💻",
  default: "📖",
};

const ExamSetupForm: React.FC<ExamSetupFormProps> = ({
  onStartExam,
  isLoading,
  userDivision,
  userStream,
  userOptionalSubject,
}) => {
  // --- Data State ---
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [availableChapters, setAvailableChapters] = useState<Item[]>([]);
  interface TopicItem extends Item {
    chapter_id?: string;
  }
  const [availableTopics, setAvailableTopics] = useState<TopicItem[]>([]);
  // isFetchingData is provided by the useSWR hook below

  // --- Form State ---
  const [subject, setSubject] = useState("");
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>(["Academic"]);
  const [difficulties, setDifficulties] = useState<string[]>(["Medium"]);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [duration, setDuration] = useState<number>(25);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);
  const [isFormHydrated, setIsFormHydrated] = useState(false);

  // Available question count preview
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(false);

  // --- Hydrate Form State from SessionStorage ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("obhyash_setup_form_state");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.subject) setSubject(parsed.subject);
          if (parsed.selectedChapters)
            setSelectedChapters(parsed.selectedChapters);
          if (parsed.selectedTopics) setSelectedTopics(parsed.selectedTopics);
          if (parsed.examTypes) setExamTypes(parsed.examTypes);
          if (parsed.difficulties) setDifficulties(parsed.difficulties);
          if (parsed.questionCount) setQuestionCount(parsed.questionCount);
          if (parsed.duration) setDuration(parsed.duration);
          if (parsed.negativeMarking !== undefined)
            setNegativeMarking(parsed.negativeMarking);
        } catch (e) {
          console.error("Failed to parse setup form state", e);
        }
      }
      setIsFormHydrated(true);
    }
  }, []);

  // --- Save Form State to SessionStorage ---
  useEffect(() => {
    if (isFormHydrated && typeof window !== "undefined") {
      const stateToSave = {
        subject,
        selectedChapters,
        selectedTopics,
        examTypes,
        difficulties,
        questionCount,
        duration,
        negativeMarking,
      };
      sessionStorage.setItem(
        "obhyash_setup_form_state",
        JSON.stringify(stateToSave),
      );
    }
  }, [
    isFormHydrated,
    subject,
    selectedChapters,
    selectedTopics,
    examTypes,
    difficulties,
    questionCount,
    duration,
    negativeMarking,
  ]);

  // --- Modals State ---

  // Fetch available question count when subject/chapters/difficulty change
  useEffect(() => {
    if (!subject) {
      setAvailableCount(null);
      return;
    }
    const timer = setTimeout(async () => {
      setIsCountLoading(true);
      const subjectObj = availableSubjects.find((s) => s.id === subject);
      const subjectLabel = subjectObj?.name || subjectObj?.rawName || subject;
      const chapterNames =
        selectedChapters.length > 0
          ? availableChapters
              .filter((c) => selectedChapters.includes(c.id))
              .map((c) => c.name)
          : null;
      const difficultyValue =
        difficulties.length >= 3 ? null : difficulties.join("+");
      const count = await getAvailableQuestionCount(
        subject,
        subjectLabel,
        chapterNames,
        difficultyValue,
      );
      setAvailableCount(count);
      setIsCountLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [
    subject,
    selectedChapters,
    difficulties,
    availableSubjects,
    availableChapters,
  ]);

  // --- Subject Fetching via SWR (cached in localStorage) ---
  // Key includes user's group/stream so different students get different caches
  const subjectCacheKey = `subjects:${userDivision ?? "none"}:${userStream ?? "none"}:${userOptionalSubject ?? "none"}`;

  const { data: rawSubjects, isLoading: isFetchingData } = useSWR(
    subjectCacheKey,
    async () => {
      return getSubjects(userDivision, userStream, userOptionalSubject);
    },
    { revalidateOnFocus: false, dedupingInterval: 300_000 }, // cache 5 min
  );

  useEffect(() => {
    if (!rawSubjects) return;
    interface RawSubject extends Subject {
      name_bn?: string;
      name_en?: string;
      icon?: string;
    }
    const formattedSubjects = (rawSubjects as RawSubject[]).map(
      (sub: RawSubject, idx: number) => {
        const nameBn = sub.name_bn || sub.name;
        const nameEn = sub.name || sub.name_en;
        const label =
          nameEn && nameEn !== nameBn && !nameBn.includes(nameEn)
            ? `${nameBn} (${nameEn})`
            : nameBn;

        return {
          id: sub.id,
          label: label,
          icon:
            sub.icon ||
            STATIC_SUBJECT_ICONS[sub.name_en ?? ""] ||
            STATIC_SUBJECT_ICONS[sub.id] ||
            STATIC_SUBJECT_ICONS.default,
          name: label,
          rawName: nameBn,
          serial: idx + 1,
        };
      },
    );
    setAvailableSubjects(formattedSubjects);
  }, [rawSubjects]);

  useEffect(() => {
    if (!subject) {
      setAvailableChapters([]);
      setAvailableTopics([]);
      setSelectedChapters([]);
      setSelectedTopics([]);
      return;
    }

    const fetchChapters = async () => {
      try {
        const chaptersData = await getChapters(subject);
        const formattedChapters = chaptersData.map(
          (chapter: Item, idx: number) => ({
            ...chapter,
            serial: idx + 1, // Serial number based on array position
          }),
        );
        setAvailableChapters(formattedChapters);
        setSelectedChapters([]);
        setAvailableTopics([]);
        setSelectedTopics([]);
      } catch (error) {
        console.error("Error loading chapters:", error);
        toast.error(getErrorMessage(error));
      }
    };

    fetchChapters();
  }, [subject]);

  useEffect(() => {
    if (selectedChapters.length === 0) {
      setAvailableTopics([]);
      setSelectedTopics([]);
      return;
    }

    const fetchTopics = async () => {
      try {
        const topicsData = await getTopics(selectedChapters);
        const formattedTopics = topicsData.map(
          (topic: TopicItem, idx: number) => ({
            ...topic,
            serial: idx + 1, // Serial number based on array position
          }),
        );
        setAvailableTopics(formattedTopics);
        setSelectedTopics([]);
      } catch (error) {
        console.error("Failed to fetch topics:", error);
      }
    };

    fetchTopics();
  }, [selectedChapters]);

  // Sync duration with question limit
  useEffect(() => {
    setDuration(questionCount);
  }, [questionCount]);

  // --- Handlers ---

  const handleTopicSelectionChange = (
    type: "chapters" | "topics",
    names: string[],
  ) => {
    if (type === "chapters") {
      const ids = availableChapters
        .filter((c) => names.includes(c.name))
        .map((c) => c.id);
      setSelectedChapters(ids);
    } else {
      const ids = availableTopics
        .filter((t) => names.includes(t.name))
        .map((t) => t.id);
      setSelectedTopics(ids);
    }
  };

  const handleStartExam = async () => {
    if (!subject) {
      toast.error("অনুগ্রহ করে একটি বিষয় নির্বাচন করো");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // CHANGED: Use rawName
    const subjectObj = availableSubjects.find((s) => s.id === subject);
    const subjectLabel = subjectObj?.rawName || subjectObj?.label || subject;

    // Resolve IDs to Names — the questions table stores names, not IDs
    const chapterNames =
      selectedChapters.length > 0
        ? availableChapters
            .filter((c) => selectedChapters.includes(c.id))
            .map((c) => c.name)
        : [];
    const topicNames =
      selectedTopics.length > 0
        ? availableTopics
            .filter((t) => selectedTopics.includes(t.id))
            .map((t) => t.name)
        : [];

    try {
      await onStartExam({
        subject,
        subjectLabel,
        examType: examTypes.join(" + "),
        chapters: chapterNames.length > 0 ? chapterNames.join(",") : "All",
        topics: topicNames.length > 0 ? topicNames.join(",") : "General",
        difficulty: difficulties.join(" + "),
        questionCount,
        durationMinutes: duration,
        negativeMarking,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const getThemeVars = (subjectId: string) => {
    if (!subjectId)
      return {
        button: "bg-emerald-700 hover:bg-emerald-800 shadow-emerald-500/25",
        badge:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      };
    const s = subjectId.toLowerCase();
    if (s.includes("physics"))
      return {
        button: "bg-blue-700 hover:bg-blue-800 shadow-blue-500/25",
        badge:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      };
    if (s.includes("chemistry"))
      return {
        button: "bg-orange-700 hover:bg-orange-800 shadow-orange-500/25",
        badge:
          "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
      };
    if (s.includes("biology"))
      return {
        button: "bg-teal-700 hover:bg-teal-800 shadow-teal-500/25",
        badge:
          "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
      };
    if (s.includes("math"))
      return {
        button: "bg-purple-700 hover:bg-purple-800 shadow-purple-500/25",
        badge:
          "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
      };
    return {
      button: "bg-emerald-700 hover:bg-emerald-800 shadow-emerald-500/25",
      badge:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
    };
  };
  const theme = getThemeVars(subject);

  const StartExamButton = ({
    className,
    compact = false,
  }: {
    className?: string;
    compact?: boolean;
  }) => (
    <div className={cn(!compact && "pt-4", className)}>
      <button
        onClick={handleStartExam}
        disabled={isLoading || !subject}
        className={cn(
          "w-full group relative overflow-hidden text-white font-extrabold rounded-3xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none duration-500",
          compact ? "py-4" : "py-5",
          subject
            ? theme.button
            : "bg-neutral-300 dark:bg-neutral-800 text-neutral-500 shadow-none",
        )}
      >
        <div className="relative z-10 flex items-center justify-center gap-3">
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Cooking...</span>
            </>
          ) : (
            <>
              <span className="text-xl">শুরু করো</span>
              <Sparkles
                size={22}
                className="group-hover:rotate-12 transition-transform"
              />
            </>
          )}
        </div>
      </button>
      {!compact && (
        <p className="text-center text-[11px] text-neutral-400 mt-4 font-bold uppercase tracking-widest">
          পরবর্তী ধাপে নির্দেশাবলী দেখানো হবে
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto pb-32 px-4 md:px-6 lg:px-8 font-sans animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-6">
        <div className="w-full flex justify-center md:justify-start">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest transition-colors duration-500",
                theme.badge,
              )}
            >
              Exam Configuration
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Selection (Subject & Topics) */}
        <div className="xl:col-span-8 space-y-8">
          {/* 1. Subject Selection Card */}
          <section className="bg-white dark:bg-neutral-900 rounded-2xl p-8 md:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-8 flex items-center gap-3">
              বিষয় নির্বাচন
            </h3>
            <SubjectSelector
              subjects={availableSubjects.map((s) => ({
                id: s.id,
                name: s.name,
                icon: s.icon,
              }))}
              selectedSubject={subject}
              onSelect={setSubject}
              isLoading={isFetchingData}
            />
          </section>
          {/* 2. Topics Selection Card */}
          <section
            className={cn(
              "bg-white dark:bg-neutral-900 rounded-2xl p-8 md:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-500",
              !subject ? "opacity-50 pointer-events-none" : "opacity-100",
            )}
          >
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-8 flex items-center gap-3">
              অধ্যায় ও টপিক
              <div className="group relative flex items-center">
                <Info
                  size={18}
                  className="text-neutral-400 hover:text-emerald-500 transition-colors cursor-help"
                />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-medium rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-neutral-900 dark:bg-white rotate-45" />
                  <span className="relative z-10">
                    তুমি কোনো নির্দিষ্ট টপিক সিলেক্ট না করলে নির্বাচিত
                    অধ্যায়গুলোর সব টপিক থেকে প্রশ্ন আসবে।
                  </span>
                </div>
              </div>
            </h3>
            <div className="grid gap-8">
              <TopicSelector
                title="অধ্যায়"
                items={availableChapters
                  .sort((a, b) => (a.serial || 0) - (b.serial || 0))
                  .map((c) => c.name)}
                selectedItems={availableChapters
                  .filter((c) => selectedChapters.includes(c.id))
                  .map((c) => c.name)}
                onChange={(names) =>
                  handleTopicSelectionChange("chapters", names)
                }
                disabled={!subject}
                emptyLabel="এই বিষয়ের জন্য কোনো অধ্যায় পাওয়া যায়নি"
              />

              <TopicSelector
                title="টপিক"
                items={availableTopics
                  .sort((a, b) => (a.serial || 0) - (b.serial || 0))
                  .map((t) => t.name)}
                groupedItems={availableTopics
                  .sort((a, b) => (a.serial || 0) - (b.serial || 0))
                  .reduce(
                    (acc, topic: TopicItem) => {
                      const chapterName =
                        availableChapters.find((c) => c.id === topic.chapter_id)
                          ?.name || "Other";
                      if (!acc[chapterName]) acc[chapterName] = [];
                      acc[chapterName].push(topic.name);
                      return acc;
                    },
                    {} as Record<string, string[]>,
                  )}
                selectedItems={availableTopics
                  .filter((t) => selectedTopics.includes(t.id))
                  .map((t) => t.name)}
                onChange={(names) =>
                  handleTopicSelectionChange("topics", names)
                }
                disabled={selectedChapters.length === 0}
                emptyLabel="আগে অধ্যায় নির্বাচন করো"
              />
            </div>
          </section>
          {/* 3. Question Count Selection Card */}
          <section className="bg-white dark:bg-neutral-900 rounded-2xl p-8 md:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <QuestionCountSelection
              questionCount={questionCount}
              setQuestionCount={setQuestionCount}
              noContainer
            />
            {/* Available Count Badge */}
            {subject && (
              <div className="mt-4 flex items-center gap-2">
                {isCountLoading ? (
                  <span className="text-xs text-neutral-400 animate-pulse">
                    গণনা হচ্ছে...
                  </span>
                ) : availableCount !== null ? null : null}
              </div>
            )}
          </section>
          {/* Desktop Submit Button */}
          <StartExamButton className="hidden xl:block" />
        </div>

        {/* Right Column: Settings Cards */}
        <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-24 xl:self-start z-10">
          <ExamTypeSelection
            examTypes={examTypes}
            setExamTypes={setExamTypes}
          />

          <DifficultySelection
            difficulties={difficulties}
            setDifficulties={setDifficulties}
          />

          <TimeSelection duration={duration} setDuration={setDuration} />

          <NegativeMarkingSelection
            negativeMarking={negativeMarking}
            setNegativeMarking={setNegativeMarking}
          />
        </div>

        {/* Mobile Submit Button (Flow with content) */}
        <div className="xl:hidden mt-4 mb-8">
          <StartExamButton />
        </div>
      </div>
    </div>
  );
};

export default ExamSetupForm;
