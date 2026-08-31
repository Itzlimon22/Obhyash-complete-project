"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen,
  List,
  Settings,
  Activity,
  HelpCircle,
  Clock,
  MinusCircle,
  Zap,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  CheckCheck,
  CheckCircle2,
  CalendarCheck,
  Crown,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/services/core";
import { ExamConfig, UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BanglaNameHelper, SubjectCategoryType } from "@/lib/bangla-name-helper";
import { MathRenderer } from "@/components/common/MathRenderer";
import ProUpgradeModal from "@/components/common/ProUpgradeModal";

// --- Domain Models ---
export interface SubjectItem {
  id: string;
  name: string;
  label: string;
  category?: string;
  sortOrder?: number;
}

export interface ChapterItem {
  id: string;
  name: string;
}

export interface TopicItem {
  id: string;
  name: string;
  chapterId: string;
}

interface ExamSetupFormProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading?: boolean;
  currentUser?: UserProfile | null;
  userDivision?: string;
  userStream?: string;
  userOptionalSubject?: string;
}

export const ExamSetupForm: React.FC<ExamSetupFormProps> = ({
  onStartExam,
  isLoading: isExternalLoading = false,
  currentUser,
  userDivision,
  userStream,
  userOptionalSubject,
}) => {
  // Data State
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form State
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [examTypes, setExamTypes] = useState<Set<string>>(new Set(["Academic", "Board"]));
  const [difficulties, setDifficulties] = useState<Set<string>>(new Set(["Medium"]));
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);
  const [showTopicModal, setShowTopicModal] = useState<boolean>(false);

  // Pro Upgrade Modal State
  const [proModalConfig, setProModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    featurePill: string;
    icon?: any;
  }>({
    isOpen: false,
    title: "প্রো সাবস্ক্রিপশন প্রয়োজন 👑",
    message: "আনলিমিটেড এক্সাম, KaTeX ব্যাখ্যা ও পূর্ণাঙ্গ প্রশ্ন ব্যাংক পেতে প্রো সাবস্ক্রিপশন নাও।",
    featurePill: "প্রো ফিচার",
  });

  const effectiveDivision = userDivision || currentUser?.division;
  const effectiveLevel = userStream || currentUser?.stream || currentUser?.level;
  const effectiveOptional = userOptionalSubject || currentUser?.optional_subject;
  const isPro = Boolean(
    (currentUser as any)?.isPro ||
    currentUser?.subscription?.plan === "Pro" ||
    (currentUser?.role as string) === "Admin" ||
    (currentUser?.role as string) === "admin"
  );

  // Initialize Exam Types based on user profile
  useEffect(() => {
    const allowed = BanglaNameHelper.getAllowedExamTypesForProfile(currentUser);
    setExamTypes(new Set(allowed));
  }, [currentUser]);

  // Fetch Subjects
  const fetchSubjects = useCallback(async () => {
    setIsLoadingData(true);
    try {
      let data: any[] | null = null;
      try {
        let query = supabase.from("subjects").select("*");
        if (
          effectiveDivision &&
          effectiveDivision.trim() !== "" &&
          effectiveDivision !== "General"
        ) {
          query = query.or(
            `division.eq.${effectiveDivision},division.eq.General,division.is.null`
          );
        }
        const res = await query.limit(150);
        data = res.data;
      } catch (queryErr) {
        console.warn("[ExamSetupForm] Filtered subjects query failed, falling back to all:", queryErr);
        const res = await supabase.from("subjects").select("*").limit(150);
        data = res.data;
      }

      if (!data || data.length === 0) {
        const res = await supabase.from("subjects").select("*").limit(150);
        data = res.data;
      }

      const rawList = Array.isArray(data) ? data : [];
      let filteredData = rawList.filter((e) => {
        const subName = (e.name || e.name_en || "").toString().toLowerCase();
        const subId = (e.id || "").toString().toLowerCase();
        const subLevel = (e.level || "").toString().toUpperCase();

        if (effectiveLevel && effectiveLevel.toUpperCase() === "SSC") {
          if (subId.startsWith("hsc_") || subName.includes("hsc") || subLevel === "HSC") {
            return false;
          }
        } else if (effectiveLevel && effectiveLevel.toUpperCase() === "HSC") {
          if (subId.startsWith("ssc_") || subName.includes("ssc") || subLevel === "SSC") {
            return false;
          }
        }

        const isBiology =
          subName.includes("biology") || subId.includes("biology") || subName.includes("জীববিজ্ঞান");
        const isStatistics =
          subName.includes("statistics") || subId.includes("statistics") || subName.includes("পরিসংখ্যান");

        if (effectiveOptional && effectiveOptional.trim() !== "") {
          if (effectiveOptional.toLowerCase().includes("stat")) {
            if (isBiology) return false;
          } else if (effectiveOptional.toLowerCase().includes("bio")) {
            if (isStatistics) return false;
          }
        }
        return true;
      });

      if (filteredData.length === 0) {
        filteredData = rawList;
      }

      const seen = new Set<string>();
      const list: SubjectItem[] = [];
      for (const e of filteredData) {
        const rawName = (e.name || e.name_en || "").toString();
        const rawNameEn = (e.name_en || "").toString();
        const formattedName = BanglaNameHelper.formatSubject(
          rawNameEn.length > 0 ? rawNameEn : rawName,
          rawName
        );

        if (!formattedName || seen.has(formattedName)) continue;
        seen.add(formattedName);

        list.push({
          id: e.id.toString(),
          name: formattedName,
          label: formattedName,
          category: e.category?.toString(),
          sortOrder: typeof e.sort_order === "number" ? e.sort_order : undefined,
        });
      }

      // Canonical sort
      list.sort((a, b) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined && a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }
        const priorityA = BanglaNameHelper.getSubjectSortPriority(a.name, a.id);
        const priorityB = BanglaNameHelper.getSubjectSortPriority(b.name, b.id);
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        return a.name.localeCompare(b.name, "bn");
      });

      setSubjects(list);
    } catch (e) {
      console.error("[ExamSetupForm] Failed to fetch subjects:", e);
    } finally {
      setIsLoadingData(false);
    }
  }, [effectiveDivision, effectiveLevel, effectiveOptional]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // Fetch Chapters when subject changes
  const fetchChapters = async (subjectId: string) => {
    setChapters([]);
    setTopics([]);
    setSelectedChapters(new Set());
    setSelectedTopics(new Set());

    try {
      let res = await supabase
        .from("chapters")
        .select("id, name")
        .eq("subject_id", subjectId)
        .limit(200);

      let data = res.data;
      if (!data || data.length === 0) {
        const cleanId = subjectId.replace("hsc_", "").replace("ssc_", "");
        const fallbackRes = await supabase
          .from("chapters")
          .select("id, name")
          .or(`subject_id.ilike.%${cleanId}%,subject_id.ilike.%${subjectId}%`)
          .limit(200);
        data = fallbackRes.data;
      }

      const rawList: ChapterItem[] = (data || []).map((e: any) => ({
        id: e.id.toString(),
        name: e.name || "",
      }));

      // Sort chapters
      rawList.sort((a, b) => {
        const idxA = BanglaNameHelper.getChapterSortIndex(a.name, a.id);
        const idxB = BanglaNameHelper.getChapterSortIndex(b.name, b.id);
        return idxA - idxB;
      });

      setChapters(rawList);
    } catch (e) {
      console.error("[ExamSetupForm] Failed to fetch chapters:", e);
    }
  };

  // Fetch Topics when selected chapters change
  const fetchTopics = async (chapterIds: Set<string>) => {
    if (chapterIds.size === 0) {
      setTopics([]);
      setSelectedTopics(new Set());
      return;
    }

    try {
      const res = await supabase
        .from("topics")
        .select("id, name, chapter_id")
        .in("chapter_id", Array.from(chapterIds))
        .limit(500);

      const topicList: TopicItem[] = (res.data || []).map((e: any) => ({
        id: e.id.toString(),
        name: e.name || "",
        chapterId: e.chapter_id.toString(),
      }));

      setTopics(topicList);
      setSelectedTopics((prev) => {
        const updated = new Set<string>();
        for (const id of prev) {
          if (topicList.some((t) => t.id === id)) {
            updated.add(id);
          }
        }
        return updated;
      });
    } catch (e) {
      console.error("[ExamSetupForm] Failed to fetch topics:", e);
    }
  };

  const handleSubjectSelect = (id: string) => {
    setSelectedSubject(id);
    fetchChapters(id);
  };

  const handleStartExam = async () => {
    if (!selectedSubject) {
      toast.warning("অনুগ্রহ করে প্রথমে একটি বিষয় নির্বাচন করো");
      return;
    }

    // Gatekeeper 1: 50+ Questions limit for free users
    if (questionCount > 50 && !isPro) {
      setProModalConfig({
        isOpen: true,
        title: "৫০+ প্রশ্ন আনলক করো ⚡",
        message:
          "ফ্রি অ্যাকাউন্টে সর্বোচ্চ ৫০টি প্রশ্ন দিয়ে পরীক্ষা তৈরি করা যায়। ৭৫ বা ১০০ প্রশ্নের পূর্ণাঙ্গ মডেল টেস্ট দিতে প্রো সাবস্ক্রিপশন নাও।",
        featurePill: "প্রো ফিচার",
        icon: Crown,
      });
      return;
    }

    // Gatekeeper 2: Daily 2 free exams quota
    if (!isPro) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const now = new Date();
          const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

          const { data: examResults } = await supabase
            .from("exam_results")
            .select("id")
            .eq("user_id", userData.user.id)
            .gte("created_at", startOfDay);

          if (examResults && examResults.length >= 2) {
            setProModalConfig({
              isOpen: true,
              title: "আজকের ফ্রি কোটা শেষ 🎯",
              message:
                "তুমি আজকের ২টি ফ্রি পরীক্ষা সম্পন্ন করে ফেলেছ! প্রতিদিন আনলিমিটেড পরীক্ষা দিতে প্রো সাবস্ক্রিপশন নাও।",
              featurePill: "দৈনিক ফ্রি কোটা: ২/২",
              icon: CalendarCheck,
            });
            return;
          }
        }
      } catch (e) {
        console.warn("[ExamSetupForm] Quota check error:", e);
      }
    }

    setIsStarting(true);

    const selectedSub = subjects.find((s) => s.id === selectedSubject);
    const chapterNames = chapters
      .filter((c) => selectedChapters.has(c.id))
      .map((c) => c.name);
    const topicNames = topics
      .filter((t) => selectedTopics.has(t.id))
      .map((t) => t.name);

    const config: ExamConfig = {
      subject: selectedSub?.name || selectedSubject,
      subjectLabel: selectedSub?.id || selectedSubject,
      examType: Array.from(examTypes).join("+"),
      chapters: chapterNames.length > 0 ? chapterNames.join(",") : "All",
      topics: topicNames.length > 0 ? topicNames.join(",") : "General",
      difficulty: difficulties.size > 0 ? Array.from(difficulties).join("+") : "Medium",
      questionCount,
      durationMinutes,
      negativeMarking,
    };

    try {
      await onStartExam(config);
    } catch (e) {
      console.error("[ExamSetupForm] Failed to start exam:", e);
    } finally {
      setIsStarting(false);
    }
  };

  const allowedExamTypes = useMemo(() => {
    return BanglaNameHelper.getAllowedExamTypesForProfile(currentUser);
  }, [currentUser]);

  const selectedSubData = subjects.find((s) => s.id === selectedSubject);

  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 py-4 sm:py-6 select-none font-['HindSiliguri']">
      <div className="flex flex-col gap-3">
        {/* 1. Subject Selector Card */}
        <CardContainer
          title="বিষয় নির্বাচন"
          icon={BookOpen}
        >
          {isLoadingData ? (
            <div className="h-12 w-full bg-neutral-100 dark:bg-neutral-800/60 animate-pulse rounded-xl" />
          ) : (
            <button
              type="button"
              onClick={() => setShowSubjectModal(true)}
              className={cn(
                "w-full flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all duration-200 outline-none text-left",
                selectedSubject
                  ? "bg-[#FFFBEB] dark:bg-[#2E1A0D]/35 border-[#F59E0B]/60 dark:border-[#D97706]/50 shadow-sm"
                  : "bg-[#F8FAFC] dark:bg-[#161619] border-[#E2E8F0] dark:border-[#27272A] hover:border-neutral-300 dark:hover:border-neutral-700"
              )}
            >
              <span
                className={cn(
                  "text-base font-bold truncate",
                  selectedSubject
                    ? "text-[#0F172A] dark:text-white"
                    : "text-[#94A3B8] dark:text-[#71717A] font-normal"
                )}
              >
                {selectedSubData ? selectedSubData.label : "বিষয় নির্বাচন করো..."}
              </span>
              <ChevronDown
                size={18}
                className="text-[#64748B] dark:text-[#A1A1AA] shrink-0 ml-2"
              />
            </button>
          )}
        </CardContainer>

        {/* 2. Chapters & Topics Card */}
        <div
          className={cn(
            "transition-opacity duration-200",
            !selectedSubject && "opacity-50 pointer-events-none"
          )}
        >
          <CardContainer
            title="অধ্যায় ও টপিক"
            icon={List}
            tooltip="যে বিষয় ও অধ্যায়গুলোর ওপর পরীক্ষা দিতে চাও সেগুলো বেছে নাও"
          >
            <div className="flex flex-col gap-3">
              {/* Chapter Dropdown Trigger */}
              <div>
                <label className="block text-sm font-bold text-[#737373] dark:text-[#A3A3A3] mb-1.5">
                  অধ্যায়
                </label>
                <button
                  type="button"
                  onClick={() => setShowChapterModal(true)}
                  disabled={chapters.length === 0 && selectedSubject !== null}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all duration-200 outline-none text-left",
                    selectedChapters.size > 0
                      ? "bg-[#FFFBEB] dark:bg-[#2E1A0D]/35 border-[#F59E0B]/60 dark:border-[#D97706]/50 shadow-sm"
                      : "bg-[#F8FAFC] dark:bg-[#161619] border-[#E2E8F0] dark:border-[#27272A]"
                  )}
                >
                  <span
                    className={cn(
                      "text-base truncate",
                      selectedChapters.size > 0
                        ? "text-[#0F172A] dark:text-white font-bold"
                        : "text-[#94A3B8] dark:text-[#71717A] font-normal"
                    )}
                  >
                    {selectedChapters.size === 0
                      ? "সব অধ্যায়"
                      : selectedChapters.size === chapters.length
                      ? "সব অধ্যায়"
                      : `${selectedChapters.size}টি অধ্যায় নির্বাচিত`}
                  </span>
                  <ChevronDown
                    size={18}
                    className="text-[#64748B] dark:text-[#A1A1AA] shrink-0 ml-2"
                  />
                </button>
              </div>

              {/* Topic Dropdown Trigger */}
              <div>
                <label className="block text-sm font-bold text-[#737373] dark:text-[#A3A3A3] mb-1.5">
                  টপিক
                </label>
                <button
                  type="button"
                  onClick={() => setShowTopicModal(true)}
                  disabled={selectedChapters.size === 0 || topics.length === 0}
                  className={cn(
                    "w-full flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all duration-200 outline-none text-left disabled:opacity-50",
                    selectedTopics.size > 0
                      ? "bg-[#FFFBEB] dark:bg-[#2E1A0D]/35 border-[#F59E0B]/60 dark:border-[#D97706]/50 shadow-sm"
                      : "bg-[#F8FAFC] dark:bg-[#161619] border-[#E2E8F0] dark:border-[#27272A]"
                  )}
                >
                  <span
                    className={cn(
                      "text-base truncate",
                      selectedTopics.size > 0
                        ? "text-[#0F172A] dark:text-white font-bold"
                        : "text-[#94A3B8] dark:text-[#71717A] font-normal"
                    )}
                  >
                    {selectedTopics.size === 0
                      ? "সব টপিক"
                      : selectedTopics.size === topics.length
                      ? "সব টপিক"
                      : `${selectedTopics.size}টি টপিক নির্বাচিত`}
                  </span>
                  <ChevronDown
                    size={18}
                    className="text-[#64748B] dark:text-[#A1A1AA] shrink-0 ml-2"
                  />
                </button>
              </div>
            </div>
          </CardContainer>
        </div>

        {/* 3. Exam Type Card */}
        <CardContainer
          title="পরীক্ষার ধরন"
          icon={Settings}
          tooltip="তোমার প্রোফাইলের লক্ষ্য অনুযায়ী পরীক্ষার ধরন ফিল্টার করা হয়েছে। এটি প্রোফাইল থেকে যেকোনো সময় পরিবর্তন করা যাবে।"
        >
          <SegmentedGroup
            items={allowedExamTypes}
            selectedItems={examTypes}
            onToggle={(t) => {
              setExamTypes((prev) => {
                const next = new Set(prev);
                if (next.has(t) && next.size > 1) {
                  next.delete(t);
                } else if (!next.has(t)) {
                  next.add(t);
                }
                return next;
              });
            }}
          />
        </CardContainer>

        {/* 4. Difficulty Card */}
        <CardContainer
          title="কঠিনতা"
          icon={Activity}
          tooltip={"Easy: বেসিক ধারণা\nMedium: স্ট্যান্ডার্ড মান\nHard: চ্যালেঞ্জিং ও উচ্চতর দক্ষতা"}
        >
          <SegmentedGroup
            items={["Easy", "Medium", "Hard"]}
            selectedItems={difficulties}
            onToggle={(d) => {
              setDifficulties((prev) => {
                const next = new Set(prev);
                if (next.has(d) && next.size > 1) {
                  next.delete(d);
                } else if (!next.has(d)) {
                  next.add(d);
                }
                return next;
              });
            }}
          />
        </CardContainer>

        {/* 5. Question Count Card */}
        <CardContainer
          title="প্রশ্নের সংখ্যা"
          icon={HelpCircle}
          tooltip="পরীক্ষায় মোট কতটি প্রশ্ন থাকবে তা নির্ধারণ করো"
        >
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[#64748B] dark:text-[#A1A1AA]">
                মোট প্রশ্ন:
              </span>
              <StepperControl
                value={questionCount}
                unit="টি"
                min={5}
                max={100}
                step={5}
                onChanged={(val) => {
                  if (val > 50 && !isPro) {
                    setProModalConfig({
                      isOpen: true,
                      title: "৫০+ প্রশ্ন আনলক করো ⚡",
                      message:
                        "ফ্রি অ্যাকাউন্টে সর্বোচ্চ ৫০টি প্রশ্ন দিয়ে পরীক্ষা তৈরি করা যায়। ৭৫ বা ১০০ প্রশ্নের পূর্ণাঙ্গ মডেল টেস্ট দিতে প্রো সাবস্ক্রিপশন নাও।",
                      featurePill: "প্রো ফিচার",
                      icon: Crown,
                    });
                    return;
                  }
                  setQuestionCount(val);
                  setDurationMinutes(val);
                }}
              />
            </div>

            {/* Quick Preset Pills */}
            <div className="grid grid-cols-5 gap-1.5">
              {[10, 20, 25, 50, 100].map((count) => {
                const isSelected = questionCount === count;
                return (
                  <PresetPill
                    key={count}
                    label={`${count}টি`}
                    isSelected={isSelected}
                    onClick={() => {
                      if (count > 50 && !isPro) {
                        setProModalConfig({
                          isOpen: true,
                          title: "৫০+ প্রশ্ন আনলক করো ⚡",
                          message:
                            "ফ্রি অ্যাকাউন্টে সর্বোচ্চ ৫০টি প্রশ্ন দিয়ে পরীক্ষা তৈরি করা যায়। ১০০ প্রশ্নের পূর্ণাঙ্গ মডেল টেস্ট দিতে প্রো সাবস্ক্রিপশন নাও।",
                          featurePill: "প্রো ফিচার",
                          icon: Crown,
                        });
                        return;
                      }
                      setQuestionCount(count);
                      setDurationMinutes(count);
                    }}
                  />
                );
              })}
            </div>
          </div>
        </CardContainer>

        {/* 6. Time Duration Card */}
        <CardContainer
          title="পরীক্ষার সময়"
          icon={Clock}
          tooltip="পরীক্ষার মোট সময় (মিনিট)"
        >
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-[#64748B] dark:text-[#A1A1AA]">
                মোট সময়:
              </span>
              <StepperControl
                value={durationMinutes}
                unit="মি."
                min={5}
                max={180}
                step={5}
                onChanged={(val) => setDurationMinutes(val)}
              />
            </div>

            {/* Quick Preset Pills */}
            <div className="grid grid-cols-5 gap-1.5">
              {[10, 20, 30, 60, 90].map((mins) => {
                const isSelected = durationMinutes === mins;
                return (
                  <PresetPill
                    key={mins}
                    label={`${mins} মি.`}
                    isSelected={isSelected}
                    onClick={() => setDurationMinutes(mins)}
                  />
                );
              })}
            </div>
          </div>
        </CardContainer>

        {/* 7. Negative Marking Card */}
        <CardContainer
          title="নেগেটিভ মার্কিং"
          icon={MinusCircle}
          tooltip={"-০.২৫: প্রতি ৪টি ভুল উত্তরের জন্য ১ নম্বর কাটা\n-০.৫০: প্রতি ২টি ভুল উত্তরের জন্য ১ নম্বর কাটা"}
        >
          <div className="p-1 rounded-2xl bg-[#F1F5F9] dark:bg-[#18181B] border border-[#E2E8F0] dark:border-[#27272A] grid grid-cols-3 gap-1">
            {[
              { val: 0.0, label: "০ (নেই)" },
              { val: 0.25, label: "-০.২৫ মার্ক" },
              { val: 0.5, label: "-০.৫ মার্ক" },
            ].map(({ val, label }) => {
              const isSelected = negativeMarking === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => setNegativeMarking(val)}
                  className={cn(
                    "py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                    isSelected
                      ? "bg-[#B45309] dark:bg-[#3B2314] text-white dark:text-[#FEF3C7] border border-[#B45309] dark:border-[#D97706]/60 shadow-sm"
                      : "text-[#64748B] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </CardContainer>

        {/* 8. Live Blueprint Capsule Summary */}
        <div className="my-2 p-3.5 rounded-2xl bg-[#FFFBEB] dark:bg-[#22160E] border border-[#FDE68A] dark:border-[#D97706]/35 shadow-sm shadow-[#B45309]/5 flex items-center justify-around text-center">
          <div className="flex items-center gap-1.5">
            <HelpCircle size={14} className="text-[#38BDF8]" />
            <span className="text-xs font-bold text-[#78350F] dark:text-[#FEF3C7]">
              {questionCount}টি প্রশ্ন
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-[#FDE68A] dark:bg-[#D97706]/25" />

          <div className="flex items-center gap-1.5">
            <Clock size={14} className="text-[#FBBF24]" />
            <span className="text-xs font-bold text-[#78350F] dark:text-[#FEF3C7]">
              {durationMinutes} মিনিট
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-[#FDE68A] dark:bg-[#D97706]/25" />

          <div className="flex items-center gap-1.5">
            <MinusCircle size={14} className="text-[#F87171]" />
            <span className="text-xs font-bold text-[#78350F] dark:text-[#FEF3C7]">
              {negativeMarking === 0 ? "০ মার্ক" : `-${negativeMarking}`}
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-[#FDE68A] dark:bg-[#D97706]/25" />

          <div className="flex items-center gap-1.5">
            <Zap size={14} className="text-[#A78BFA]" />
            <span className="text-xs font-bold text-[#78350F] dark:text-[#FEF3C7]">
              +{questionCount * 2} XP
            </span>
          </div>
        </div>

        {/* 9. Start Button - Deep Green */}
        <button
          type="button"
          onClick={handleStartExam}
          disabled={isStarting || isExternalLoading}
          className="w-full py-4 px-6 rounded-2xl bg-[#004633] hover:bg-[#003828] active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none text-white font-black text-lg shadow-lg shadow-[#004633]/30 transition-all flex items-center justify-center gap-2 mt-1 mb-8"
        >
          {isStarting || isExternalLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>শুরু করো</span>
          )}
        </button>
      </div>

      {/* --- Modals --- */}

      {/* Subject Dropdown Modal (3-tier) */}
      {showSubjectModal && (
        <SubjectDropdownModal
          subjects={subjects}
          selectedId={selectedSubject}
          onSelect={(id) => {
            handleSubjectSelect(id);
            setShowSubjectModal(false);
          }}
          onClose={() => setShowSubjectModal(false)}
        />
      )}

      {/* Chapter Modal */}
      {showChapterModal && (
        <MultiSelectModal
          title="অধ্যায় নির্বাচন করো"
          items={chapters}
          selectedIds={selectedChapters}
          getId={(c) => c.id}
          getName={(c) => c.name}
          onClose={() => setShowChapterModal(false)}
          onSave={(newSelected) => {
            setSelectedChapters(newSelected);
            setShowChapterModal(false);
            fetchTopics(newSelected);
          }}
        />
      )}

      {/* Topic Collapsible Modal */}
      {showTopicModal && (
        <TopicCollapsibleModal
          chapters={
            selectedChapters.size === 0
              ? chapters
              : chapters.filter((c) => selectedChapters.has(c.id))
          }
          topics={topics}
          selectedTopicIds={selectedTopics}
          onClose={() => setShowTopicModal(false)}
          onSave={(newSelected) => {
            setSelectedTopics(newSelected);
            setShowTopicModal(false);
          }}
        />
      )}

      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={proModalConfig.isOpen}
        onClose={() => setProModalConfig((prev) => ({ ...prev, isOpen: false }))}
        title={proModalConfig.title}
        message={proModalConfig.message}
        featurePill={proModalConfig.featurePill}
        icon={proModalConfig.icon}
      />
    </div>
  );
};

// ============================================================================
// Subcomponents & Modals
// ============================================================================

interface CardContainerProps {
  title: string;
  icon?: any;
  tooltip?: string;
  children: React.ReactNode;
}

const CardContainer: React.FC<CardContainerProps> = ({ title, tooltip, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="p-4 sm:p-5 rounded-[18px] bg-white dark:bg-[#131316] border border-[#E2E8F0] dark:border-[#222226] shadow-sm flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-[17px] font-black text-[#0F172A] dark:text-white font-['HindSiliguri']">
            {title}
          </h2>
          {tooltip && (
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-[#94A3B8] dark:text-[#71717A] hover:text-[#0F172A] dark:hover:text-white p-0.5"
              >
                <Info size={15} />
              </button>
              {showTooltip && (
                <div className="absolute left-0 top-6 z-50 w-56 p-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-800 text-white text-xs whitespace-pre-line shadow-xl border border-neutral-700 animate-in fade-in duration-150">
                  {tooltip}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

interface SegmentedGroupProps {
  items: string[];
  selectedItems: Set<string>;
  onToggle: (item: string) => void;
}

const SegmentedGroup: React.FC<SegmentedGroupProps> = ({ items, selectedItems, onToggle }) => {
  return (
    <div className="p-1 rounded-2xl bg-[#F1F5F9] dark:bg-[#161619] border border-[#E2E8F0] dark:border-[#27272A] flex flex-wrap gap-1">
      {items.map((item) => {
        const isSelected = selectedItems.has(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={cn(
              "flex-1 min-w-[70px] py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 text-center font-['HindSiliguri']",
              isSelected
                ? "bg-[#B45309] dark:bg-[#3B2314] text-white dark:text-[#FEF3C7] border border-[#B45309] dark:border-[#D97706]/60 shadow-sm shadow-[#B45309]/10"
                : "text-[#64748B] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white"
            )}
          >
            {item}
          </button>
        );
      })}
    </div>
  );
};

interface StepperControlProps {
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChanged: (val: number) => void;
}

const StepperControl: React.FC<StepperControlProps> = ({
  value,
  unit,
  min,
  max,
  step,
  onChanged,
}) => {
  return (
    <div className="flex items-center rounded-xl bg-[#F1F5F9] dark:bg-[#161619] border border-[#E2E8F0] dark:border-[#27272A] overflow-hidden p-0.5">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChanged(value - step)}
        className="w-9 h-9 flex items-center justify-center text-[#B45309] dark:text-[#FEF3C7] disabled:text-[#CBD5E1] dark:disabled:text-[#3F3F46] hover:bg-neutral-200 dark:hover:bg-neutral-800/80 rounded-lg transition"
      >
        <span className="text-lg font-bold">−</span>
      </button>
      <span className="px-3 text-base font-black text-[#B45309] dark:text-[#FBBF24] font-['HindSiliguri']">
        {value} {unit}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChanged(value + step)}
        className="w-9 h-9 flex items-center justify-center text-[#B45309] dark:text-[#FEF3C7] disabled:text-[#CBD5E1] dark:disabled:text-[#3F3F46] hover:bg-neutral-200 dark:hover:bg-neutral-800/80 rounded-lg transition"
      >
        <span className="text-lg font-bold">+</span>
      </button>
    </div>
  );
};

interface PresetPillProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const PresetPill: React.FC<PresetPillProps> = ({ label, isSelected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "py-2 px-1 rounded-xl text-[13px] font-bold text-center transition-all duration-150 font-['HindSiliguri']",
        isSelected
          ? "bg-[#B45309] dark:bg-[#3B2314] text-white dark:text-[#FEF3C7] border border-[#B45309] dark:border-[#D97706]/60 shadow-sm"
          : "bg-[#F8FAFC] dark:bg-[#161619] border border-[#E2E8F0] dark:border-[#27272A] text-[#64748B] dark:text-[#A1A1AA] hover:border-neutral-300 dark:hover:border-neutral-700"
      )}
    >
      {label}
    </button>
  );
};

// ----------------------------------------------------------------------------
// Subject Dropdown Modal (3-tier Chorcha Categorization)
// ----------------------------------------------------------------------------
interface SubjectDropdownModalProps {
  subjects: SubjectItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const SubjectDropdownModal: React.FC<SubjectDropdownModalProps> = ({
  subjects,
  selectedId,
  onSelect,
  onClose,
}) => {
  const compulsory: SubjectItem[] = [];
  const core: SubjectItem[] = [];
  const elective: SubjectItem[] = [];

  subjects.forEach((s) => {
    const cat = s.category?.toLowerCase() || BanglaNameHelper.getSubjectCategory(s.id, s.name);
    if (cat === "compulsory") compulsory.push(s);
    else if (cat === "elective") elective.push(s);
    else core.push(s);
  });

  const sections = (
    [
      {
        type: "compulsory" as SubjectCategoryType,
        title: BanglaNameHelper.getCategoryTitle("compulsory"),
        items: compulsory,
        color: "bg-[#3B82F6]",
      },
      {
        type: "core" as SubjectCategoryType,
        title: BanglaNameHelper.getCategoryTitle("core"),
        items: core,
        color: "bg-[#10B981]",
      },
      {
        type: "elective" as SubjectCategoryType,
        title: BanglaNameHelper.getCategoryTitle("elective"),
        items: elective,
        color: "bg-[#8B5CF6]",
      },
    ] as const
  ).filter((s) => s.items.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#000000] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[82vh] border border-neutral-200 dark:border-neutral-800 z-10 animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-xl font-black text-[#0F172A] dark:text-white font-['HindSiliguri']">
            বিষয় নির্বাচন করো
          </h3>
          <button
            onClick={onClose}
            className="text-[#64748B] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
          {sections.length === 0 ? (
            <div className="text-center py-8 text-[#64748B] dark:text-[#A1A1AA] text-base font-['HindSiliguri']">
              কোনো বিষয় পাওয়া যায়নি
            </div>
          ) : (
            sections.map((sec, secIdx) => (
              <div key={sec.type} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn("w-1 h-3.5 rounded-full", sec.color)} />
                  <span className="text-xs font-bold text-[#64748B] dark:text-[#A1A1AA] uppercase tracking-wider font-['HindSiliguri']">
                    {sec.title}
                  </span>
                </div>

                {sec.items.map((sub) => {
                  const isSelected = sub.id === selectedId;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => onSelect(sub.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left font-['HindSiliguri']",
                        isSelected
                          ? "bg-[#B45309] dark:bg-[#3B2314] border-[#B45309] dark:border-[#D97706]/60 text-white dark:text-[#FEF3C7] shadow-sm"
                          : "bg-[#FAFAFA] dark:bg-[#141416] border-[#E2E8F0] dark:border-[#27272A] text-[#334155] dark:text-[#D4D4D8] hover:border-neutral-300 dark:hover:border-neutral-700"
                      )}
                    >
                      <span className="text-base font-bold">{sub.label}</span>
                      {isSelected && (
                        <CheckCircle2
                          size={20}
                          className="text-white dark:text-[#FBBF24] shrink-0 ml-2"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// Chapter Multi-Select Modal
// ----------------------------------------------------------------------------
interface MultiSelectModalProps {
  title: string;
  items: ChapterItem[];
  selectedIds: Set<string>;
  getId: (item: ChapterItem) => string;
  getName: (item: ChapterItem) => string;
  onSave: (selected: Set<string>) => void;
  onClose: () => void;
}

const MultiSelectModal: React.FC<MultiSelectModalProps> = ({
  title,
  items,
  selectedIds,
  getId,
  getName,
  onSave,
  onClose,
}) => {
  const [currentSelected, setCurrentSelected] = useState<Set<string>>(new Set(selectedIds));

  const allIds = useMemo(() => new Set(items.map(getId)), [items, getId]);
  const isAllSelected = allIds.size > 0 && Array.from(allIds).every((id) => currentSelected.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setCurrentSelected(new Set());
    } else {
      setCurrentSelected(new Set(allIds));
    }
  };

  const toggleSelection = (id: string) => {
    setCurrentSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141417] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[82vh] border border-neutral-200 dark:border-neutral-800 z-10 animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-lg font-black text-[#0F172A] dark:text-white font-['HindSiliguri'] truncate mr-2">
            {title}
          </h3>

          <div className="flex items-center gap-2 shrink-0">
            {/* Select All Pill */}
            <button
              type="button"
              onClick={toggleSelectAll}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition font-['HindSiliguri']",
                isAllSelected
                  ? "bg-[#ECFDF5] dark:bg-[#064E3B] border-[#A7F3D0] dark:border-[#059669] text-[#047857] dark:text-[#34D399]"
                  : "bg-[#F1F5F9] dark:bg-[#1F1F24] border-[#E2E8F0] dark:border-[#2E2E33] text-[#334155] dark:text-[#E4E4E7]"
              )}
            >
              {isAllSelected ? <CheckCheck size={13} /> : <Check size={13} />}
              <span>{isAllSelected ? "সব বাছাইকৃত" : "সবগুলো"}</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#64748B] dark:text-[#A1A1AA] p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-[#64748B] dark:text-[#A1A1AA] text-base font-['HindSiliguri']">
              কোনো অধ্যায় পাওয়া যায়নি
            </div>
          ) : (
            items.map((item) => {
              const id = getId(item);
              const name = getName(item);
              const isSelected = currentSelected.has(id);

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleSelection(id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left font-['HindSiliguri']",
                    isSelected
                      ? "bg-[#004633] dark:bg-[#003D2C] border-[#004633] dark:border-[#059669] text-white dark:text-[#E6FFFA]"
                      : "bg-transparent dark:bg-[#18181B] border-[#E2E8F0] dark:border-[#27272A] text-[#334155] dark:text-[#D4D4D8] hover:border-neutral-300 dark:hover:border-neutral-700"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition",
                      isSelected
                        ? "bg-white dark:bg-[#10B981] border-white dark:border-[#10B981]"
                        : "border-[#CBD5E1] dark:border-[#52525B] bg-transparent"
                    )}
                  >
                    {isSelected && (
                      <Check
                        size={13}
                        className="text-[#004633] dark:text-black stroke-[3]"
                      />
                    )}
                  </div>
                  <div className="flex-1 text-base font-semibold truncate">
                    <MathRenderer text={name} />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => onSave(currentSelected)}
            className="w-full py-3.5 px-4 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-base font-['HindSiliguri'] shadow-sm transition"
          >
            সংরক্ষণ করো ({currentSelected.size})
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// Topic Collapsible Selection Modal
// ----------------------------------------------------------------------------
interface TopicCollapsibleModalProps {
  chapters: ChapterItem[];
  topics: TopicItem[];
  selectedTopicIds: Set<string>;
  onSave: (selected: Set<string>) => void;
  onClose: () => void;
}

const TopicCollapsibleModal: React.FC<TopicCollapsibleModalProps> = ({
  chapters,
  topics,
  selectedTopicIds,
  onSave,
  onClose,
}) => {
  const [currentSelected, setCurrentSelected] = useState<Set<string>>(new Set(selectedTopicIds));
  const [expandedChapterIds, setExpandedChapterIds] = useState<Set<string>>(
    new Set(chapters.map((c) => c.id))
  );

  const topicsByChapter = useMemo(() => {
    const map = new Map<string, TopicItem[]>();
    for (const t of topics) {
      if (!map.has(t.chapterId)) map.set(t.chapterId, []);
      map.get(t.chapterId)!.push(t);
    }
    return map;
  }, [topics]);

  const visibleChapters = useMemo(() => {
    return chapters.filter((c) => (topicsByChapter.get(c.id) || []).length > 0);
  }, [chapters, topicsByChapter]);

  const allTopicIds = useMemo(() => new Set(topics.map((t) => t.id)), [topics]);
  const isAllSelected =
    allTopicIds.size > 0 && Array.from(allTopicIds).every((id) => currentSelected.has(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setCurrentSelected(new Set());
    } else {
      setCurrentSelected(new Set(allTopicIds));
    }
  };

  const toggleChapterAll = (chapterId: string, chapterTopics: TopicItem[]) => {
    const chapterTopicIds = chapterTopics.map((t) => t.id);
    const isChapterAllSelected = chapterTopicIds.every((id) => currentSelected.has(id));

    setCurrentSelected((prev) => {
      const next = new Set(prev);
      if (isChapterAllSelected) {
        chapterTopicIds.forEach((id) => next.delete(id));
      } else {
        chapterTopicIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const toggleTopic = (topicId: string) => {
    setCurrentSelected((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const toggleExpand = (chapterId: string) => {
    setExpandedChapterIds((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) next.delete(chapterId);
      else next.add(chapterId);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#141417] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[82vh] border border-neutral-200 dark:border-neutral-800 z-10 animate-in slide-in-from-bottom duration-300">
        {/* Drag handle */}
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h3 className="text-lg font-black text-[#0F172A] dark:text-white font-['HindSiliguri'] truncate mr-2">
            টপিক নির্বাচন করো
          </h3>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleSelectAll}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition font-['HindSiliguri']",
                isAllSelected
                  ? "bg-[#ECFDF5] dark:bg-[#064E3B] border-[#A7F3D0] dark:border-[#059669] text-[#047857] dark:text-[#34D399]"
                  : "bg-[#F1F5F9] dark:bg-[#1F1F24] border-[#E2E8F0] dark:border-[#2E2E33] text-[#334155] dark:text-[#E4E4E7]"
              )}
            >
              {isAllSelected ? <CheckCheck size={13} /> : <Check size={13} />}
              <span>{isAllSelected ? "সব বাছাইকৃত" : "সবগুলো"}</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#64748B] dark:text-[#A1A1AA] p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Collapsible List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {visibleChapters.length === 0 ? (
            <div className="text-center py-8 text-[#64748B] dark:text-[#A1A1AA] text-base font-['HindSiliguri']">
              কোনো টপিক পাওয়া যায়নি
            </div>
          ) : (
            visibleChapters.map((chapter) => {
              const chapterTopics = topicsByChapter.get(chapter.id) || [];
              const isExpanded = expandedChapterIds.has(chapter.id);
              const selectedCount = chapterTopics.filter((t) => currentSelected.has(t.id)).length;
              const isAllInChapterSelected =
                chapterTopics.length > 0 && selectedCount === chapterTopics.length;

              return (
                <div
                  key={chapter.id}
                  className={cn(
                    "rounded-2xl border transition-all overflow-hidden",
                    selectedCount > 0
                      ? "border-[#CBD5E1] dark:border-[#3F3F46] bg-white dark:bg-[#141416]"
                      : "border-[#E2E8F0] dark:border-[#27272A] bg-white dark:bg-[#141416]"
                  )}
                >
                  {/* Chapter Header */}
                  <div
                    onClick={() => toggleExpand(chapter.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 select-none font-['HindSiliguri']"
                  >
                    <div className="flex items-center gap-2 flex-1 truncate mr-2">
                      <ChevronDown
                        size={18}
                        className={cn(
                          "text-[#64748B] dark:text-[#A1A1AA] transition-transform shrink-0",
                          isExpanded && "rotate-180"
                        )}
                      />
                      <span className="font-bold text-base text-[#0F172A] dark:text-white truncate">
                        <MathRenderer text={chapter.name} />
                      </span>
                      <span className="text-xs text-[#64748B] dark:text-[#A1A1AA] shrink-0">
                        ({selectedCount}/{chapterTopics.length})
                      </span>
                    </div>

                    {/* Chapter-level Select All toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChapterAll(chapter.id, chapterTopics);
                      }}
                      className={cn(
                        "px-2 py-1 rounded-md text-xs font-bold border transition",
                        isAllInChapterSelected
                          ? "bg-[#ECFDF5] dark:bg-[#064E3B] border-[#059669] text-[#047857] dark:text-[#34D399]"
                          : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
                      )}
                    >
                      {isAllInChapterSelected ? "সব" : "সবগুলো"}
                    </button>
                  </div>

                  {/* Expanded Topics List */}
                  {isExpanded && (
                    <div className="p-3 pt-0 flex flex-col gap-1.5 border-t border-neutral-100 dark:border-neutral-800/60 mt-1">
                      {chapterTopics.map((topic) => {
                        const isSelected = currentSelected.has(topic.id);
                        return (
                          <button
                            key={topic.id}
                            type="button"
                            onClick={() => toggleTopic(topic.id)}
                            className={cn(
                              "w-full flex items-center gap-2.5 p-2.5 rounded-xl border transition-all text-left font-['HindSiliguri']",
                              isSelected
                                ? "bg-[#004633] dark:bg-[#003D2C] border-[#004633] dark:border-[#059669] text-white dark:text-[#E6FFFA]"
                                : "bg-transparent border-[#E2E8F0] dark:border-[#27272A] text-[#334155] dark:text-[#D4D4D8] hover:border-neutral-300 dark:hover:border-neutral-700"
                            )}
                          >
                            <div
                              className={cn(
                                "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition",
                                isSelected
                                  ? "bg-white dark:bg-[#10B981] border-white dark:border-[#10B981]"
                                  : "border-[#CBD5E1] dark:border-[#52525B] bg-transparent"
                              )}
                            >
                              {isSelected && (
                                <Check
                                  size={11}
                                  className="text-[#004633] dark:text-black stroke-[3]"
                                />
                              )}
                            </div>
                            <div className="flex-1 text-sm font-semibold truncate">
                              <MathRenderer text={topic.name} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
          <button
            type="button"
            onClick={() => onSave(currentSelected)}
            className="w-full py-3.5 px-4 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-base font-['HindSiliguri'] shadow-sm transition"
          >
            সংরক্ষণ করো ({currentSelected.size})
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamSetupForm;
