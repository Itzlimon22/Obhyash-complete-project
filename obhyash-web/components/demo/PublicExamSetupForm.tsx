'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  List,
  Settings,
  Activity,
  HelpCircle,
  ChevronDown,
  X,
  Check,
  CheckCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { ExamConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { MathRenderer } from '@/components/common/MathRenderer';
import {
  PUBLIC_LEVELS,
  PUBLIC_SUBJECTS,
  PUBLIC_CHAPTERS,
  PublicSubject,
  PublicChapter,
} from '@/lib/data/public-mock-data';
import AppInstallPromptModal from '@/components/demo/AppInstallPromptModal';

interface PublicExamSetupFormProps {
  onStartExam: (config: ExamConfig, selectedLevel: 'HSC' | 'SSC') => void;
  isLoading?: boolean;
}

export default function PublicExamSetupForm({
  onStartExam,
  isLoading = false,
}: PublicExamSetupFormProps) {
  // 1. Level / Class State (Normal Dropdown)
  const [selectedLevel, setSelectedLevel] = useState<'HSC' | 'SSC'>('HSC');

  // 2. Filter subjects by selected level
  const availableSubjects = useMemo(() => {
    return PUBLIC_SUBJECTS.filter((s) => s.level === selectedLevel);
  }, [selectedLevel]);

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    availableSubjects[0]?.id || 'hsc_physics_1'
  );
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [examTypes, setExamTypes] = useState<Set<string>>(new Set(['Academic', 'Board']));
  const [difficulties, setDifficulties] = useState<Set<string>>(new Set(['Medium']));
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [negativeMarking] = useState<number>(0.25);

  // Modals
  const [showSubjectModal, setShowSubjectModal] = useState<boolean>(false);
  const [showChapterModal, setShowChapterModal] = useState<boolean>(false);
  const [showTopicLockModal, setShowTopicLockModal] = useState<boolean>(false);
  const [showQuestionLimitModal, setShowQuestionLimitModal] = useState<boolean>(false);

  // Available chapters for the selected subject
  const availableChapters = useMemo(() => {
    return PUBLIC_CHAPTERS.filter((c) => c.subjectId === selectedSubjectId);
  }, [selectedSubjectId]);

  const selectedSubData = useMemo(() => {
    return availableSubjects.find((s) => s.id === selectedSubjectId) || availableSubjects[0];
  }, [availableSubjects, selectedSubjectId]);

  // Dynamic exam types based on selected level and subject
  const availableExamTypes = useMemo(() => {
    if (selectedLevel === 'SSC') {
      return ['Board', 'Academic'];
    }

    const subId = (selectedSubjectId || '').toLowerCase();
    const subName = (selectedSubData?.name || '').toLowerCase();
    const subLabel = (selectedSubData?.label || '').toLowerCase();
    const isBiology =
      subId.includes('biology') || subName.includes('biology') || subLabel.includes('জীববিজ্ঞান');
    const isICT =
      subId.includes('ict') || subName.includes('ict') || subLabel.includes('তথ্য');

    if (isBiology) {
      return ['Medical', 'Varsity', 'Board', 'Academic'];
    }
    if (isICT) {
      return ['Board', 'Academic'];
    }
    return ['Engineering', 'Varsity', 'Board', 'Academic'];
  }, [selectedLevel, selectedSubjectId, selectedSubData]);

  // Sync selected examTypes when level or subject changes
  React.useEffect(() => {
    setExamTypes((prev) => {
      const valid = new Set(Array.from(prev).filter((t) => availableExamTypes.includes(t)));
      if (valid.size === 0) {
        return new Set(availableExamTypes.slice(-2));
      }
      return valid;
    });
  }, [availableExamTypes]);

  // Handle level change
  const handleLevelChange = (newLevel: 'HSC' | 'SSC') => {
    setSelectedLevel(newLevel);
    const newSubjects = PUBLIC_SUBJECTS.filter((s) => s.level === newLevel);
    if (newSubjects.length > 0) {
      setSelectedSubjectId(newSubjects[0].id);
    }
    setSelectedChapters(new Set());
  };

  // Handle start exam
  const handleStart = () => {
    const chapterNames = availableChapters
      .filter((c) => selectedChapters.size === 0 || selectedChapters.has(c.id))
      .map((c) => c.name);

    const config: ExamConfig = {
      subject: selectedSubData?.id || selectedSubData?.name || 'physics',
      subjectLabel: selectedSubData?.label || 'পদার্থবিজ্ঞান',
      examType: Array.from(examTypes).join('+'),
      chapters: chapterNames.length > 0 ? chapterNames.join(',') : 'All',
      topics: 'General',
      difficulty: difficulties.size > 0 ? Array.from(difficulties).join('+') : 'Medium',
      questionCount,
      durationMinutes,
      negativeMarking,
    };

    onStartExam(config, selectedLevel);
  };

  return (
    <div className="w-full max-w-xl mx-auto px-0 sm:px-4 py-2 sm:py-5 select-none font-['HindSiliguri']">
      <div className="flex flex-col gap-2.5 sm:gap-3">
        {/* ─── Level / Class Selector (Normal Dropdown) ─── */}
        <div className="p-3.5 sm:p-4 rounded-[16px] bg-white dark:bg-[#121212] border border-neutral-200/80 dark:border-white/[0.08] shadow-xs flex flex-col gap-2">
          <label
            htmlFor="public-level-select"
            className="text-xs sm:text-sm font-bold text-neutral-600 dark:text-neutral-400 font-['Anek_Bangla',sans-serif]"
          >
            ক্লাস / পর্যায় নির্বাচন
          </label>
          <div className="relative">
            <select
              id="public-level-select"
              value={selectedLevel}
              onChange={(e) => handleLevelChange(e.target.value as 'HSC' | 'SSC')}
              className="w-full appearance-none px-3.5 py-2.5 pr-9 text-sm sm:text-base font-bold rounded-xl bg-neutral-50 dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/[0.08] text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] outline-none cursor-pointer"
            >
              {PUBLIC_LEVELS.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={18}
              className="text-neutral-400 dark:text-neutral-500 absolute right-3 top-3.5 pointer-events-none"
            />
          </div>
        </div>

        {/* ─── 1. Subject Selector Card ─── */}
        <CardContainer title="বিষয় নির্বাচন">
          <button
            type="button"
            onClick={() => setShowSubjectModal(true)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 outline-none text-left cursor-pointer bg-neutral-50/80 dark:bg-[#18181B] border-neutral-200/90 dark:border-white/[0.08] hover:border-neutral-300 dark:hover:border-white/[0.16] shadow-xs"
          >
            <span className="text-sm sm:text-base font-bold truncate font-['Anek_Bangla',sans-serif] text-neutral-900 dark:text-neutral-100">
              {selectedSubData ? selectedSubData.label : 'বিষয় নির্বাচন করো...'}
            </span>
            <ChevronDown
              size={18}
              className="text-neutral-400 dark:text-neutral-500 shrink-0 ml-2"
            />
          </button>
        </CardContainer>

        {/* ─── 2. Chapters & Topics Card ─── */}
        <CardContainer
          title="অধ্যায় ও টপিক"
          tooltip="যে বিষয় ও অধ্যায়গুলোর ওপর পরীক্ষা দিতে চাও সেগুলো বেছে নাও"
        >
          <div className="flex flex-col gap-3">
            {/* Chapter Dropdown Trigger */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 font-['Anek_Bangla',sans-serif]">
                অধ্যায়
              </label>
              <button
                type="button"
                onClick={() => setShowChapterModal(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 outline-none text-left cursor-pointer bg-neutral-50/80 dark:bg-[#18181B] border-neutral-200/90 dark:border-white/[0.08]"
              >
                <span className="text-sm sm:text-base truncate font-['Anek_Bangla',sans-serif] text-neutral-500 dark:text-neutral-400 font-normal">
                  {selectedChapters.size === 0 || selectedChapters.size === availableChapters.length
                    ? 'সব অধ্যায়'
                    : `${selectedChapters.size}টি অধ্যায় নির্বাচিত`}
                </span>
                <ChevronDown
                  size={18}
                  className="text-neutral-400 dark:text-neutral-500 shrink-0 ml-2"
                />
              </button>
            </div>

            {/* Topic Dropdown Trigger (App Install Trigger) */}
            <div>
              <label className="block text-xs sm:text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1.5 font-['Anek_Bangla',sans-serif]">
                টপিক
              </label>
              <button
                type="button"
                onClick={() => setShowTopicLockModal(true)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all duration-200 outline-none text-left cursor-pointer bg-neutral-50/80 dark:bg-[#18181B] border-neutral-200/90 dark:border-white/[0.08]"
              >
                <span className="text-sm sm:text-base truncate font-['Anek_Bangla',sans-serif] text-neutral-400 dark:text-neutral-500 font-normal">
                  সব টপিক
                </span>
                <ChevronDown
                  size={18}
                  className="text-neutral-400 dark:text-neutral-500 shrink-0 ml-2"
                />
              </button>
            </div>
          </div>
        </CardContainer>

        {/* ─── 3. Exam Type Card ─── */}
        <CardContainer
          title="পরীক্ষার ধরন"
          tooltip="বোর্ড ও অ্যাকাডেমিক মান অনুযায়ী পরীক্ষার প্রশ্ন প্রস্তুত করা হবে।"
        >
          <div
            className={cn(
              "grid gap-1.5 p-1 rounded-xl bg-neutral-50/80 dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/[0.08]",
              availableExamTypes.length === 2 ? 'grid-cols-2' : 'grid-cols-4'
            )}
          >
            {availableExamTypes.map((t) => {
              const isSelected = examTypes.has(t);
              const labelMap: Record<string, string> = {
                Engineering: 'ইঞ্জিনিয়ারিং',
                Medical: 'মেডিকেল',
                Varsity: 'ভার্সিটি',
                Board: 'বোর্ড',
                Academic: 'একাডেমিক',
              };
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
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
                  className={cn(
                    "py-2 px-1 rounded-lg text-xs sm:text-sm font-bold transition-all text-center font-['Anek_Bangla',sans-serif] cursor-pointer",
                    isSelected
                      ? 'bg-[#0b4d44] text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  {labelMap[t] || t}
                </button>
              );
            })}
          </div>
        </CardContainer>

        {/* ─── 4. Difficulty Card ─── */}
        <CardContainer
          title="কঠিনতা"
          tooltip={'সহজ: বেসিক ধারণা\nমধ্যম: স্ট্যান্ডার্ড মান\nকঠিন: চ্যালেঞ্জিং ও উচ্চতর দক্ষতা'}
        >
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#f0f4f9] dark:bg-[#18181B] border border-neutral-200/70 dark:border-white/[0.08]">
            {[
              { val: 'Easy', label: 'সহজ' },
              { val: 'Medium', label: 'মধ্যম' },
              { val: 'Hard', label: 'কঠিন' },
            ].map(({ val, label }) => {
              const isSelected = difficulties.has(val);
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setDifficulties((prev) => {
                      const next = new Set(prev);
                      if (next.has(val) && next.size > 1) {
                        next.delete(val);
                      } else if (!next.has(val)) {
                        next.add(val);
                      }
                      return next;
                    });
                  }}
                  className={cn(
                    "py-2 px-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center font-['Anek_Bangla',sans-serif] cursor-pointer",
                    isSelected
                      ? 'bg-[#0b4d44] text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </CardContainer>

        {/* ─── 5. Question Count Card (Max 25 for Free Demo) ─── */}
        <CardContainer
          title="প্রশ্নের সংখ্যা"
          tooltip="পরীক্ষায় মোট কতটি প্রশ্ন থাকবে তা নির্ধারণ করো"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200 font-['Anek_Bangla',sans-serif]">
                মোট প্রশ্ন:
              </span>
              <div className="flex items-center justify-between w-40 px-3 py-1.5 rounded-xl bg-[#f0f4f9] dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/[0.08]">
                <button
                  type="button"
                  disabled={questionCount <= 5}
                  onClick={() => {
                    const next = Math.max(5, questionCount - 5);
                    setQuestionCount(next);
                    setDurationMinutes(next);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-xl font-bold text-neutral-700 dark:text-neutral-300 disabled:opacity-30 cursor-pointer"
                >
                  −
                </button>
                <span className="text-sm sm:text-base font-bold text-[#0b4d44] dark:text-[#34D399] font-['Anek_Bangla',sans-serif]">
                  {questionCount} টি
                </span>
                <button
                  type="button"
                  disabled={questionCount >= 100}
                  onClick={() => {
                    if (questionCount >= 25) {
                      setShowQuestionLimitModal(true);
                      return;
                    }
                    const next = Math.min(25, questionCount + 5);
                    setQuestionCount(next);
                    setDurationMinutes(next);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-xl font-bold text-neutral-700 dark:text-neutral-300 disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Preset Pills matching reference image */}
            <div className="grid grid-cols-5 gap-1.5">
              {[10, 20, 25, 50, 100].map((cnt) => {
                const isSelected = questionCount === cnt;
                return (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => {
                      if (cnt > 25) {
                        setShowQuestionLimitModal(true);
                        return;
                      }
                      setQuestionCount(cnt);
                      setDurationMinutes(cnt);
                    }}
                    className={cn(
                      "py-2 rounded-xl text-xs sm:text-sm font-bold text-center transition-all font-['Anek_Bangla',sans-serif] cursor-pointer",
                      isSelected
                        ? 'bg-[#0b4d44] text-white shadow-xs'
                        : 'bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-400'
                    )}
                  >
                    {cnt}টি
                  </button>
                );
              })}
            </div>
          </div>
        </CardContainer>

        {/* ─── 6. Duration Card ─── */}
        <CardContainer
          title="পরীক্ষার সময়"
          tooltip="পরীক্ষার মোট সময় (মিনিট)"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base font-bold text-neutral-800 dark:text-neutral-200 font-['Anek_Bangla',sans-serif]">
                মোট সময়:
              </span>
              <div className="flex items-center justify-between w-40 px-3 py-1.5 rounded-xl bg-[#f0f4f9] dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/[0.08]">
                <button
                  type="button"
                  disabled={durationMinutes <= 5}
                  onClick={() => setDurationMinutes(Math.max(5, durationMinutes - 5))}
                  className="w-7 h-7 flex items-center justify-center text-xl font-bold text-neutral-700 dark:text-neutral-300 disabled:opacity-30 cursor-pointer"
                >
                  −
                </button>
                <span className="text-sm sm:text-base font-bold text-[#0b4d44] dark:text-[#34D399] font-['Anek_Bangla',sans-serif]">
                  {durationMinutes} মি.
                </span>
                <button
                  type="button"
                  disabled={durationMinutes >= 180}
                  onClick={() => setDurationMinutes(Math.min(180, durationMinutes + 5))}
                  className="w-7 h-7 flex items-center justify-center text-xl font-bold text-neutral-700 dark:text-neutral-300 disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Quick Preset Pills */}
            <div className="grid grid-cols-5 gap-1.5">
              {[10, 20, 30, 60, 90].map((mins) => {
                const isSelected = durationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={cn(
                      "py-2 rounded-xl text-xs sm:text-sm font-bold text-center transition-all font-['Anek_Bangla',sans-serif] cursor-pointer",
                      isSelected
                        ? 'bg-[#0b4d44] text-white shadow-xs'
                        : 'bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/[0.08] text-neutral-500 dark:text-neutral-400'
                    )}
                  >
                    {mins} মি.
                  </button>
                );
              })}
            </div>
          </div>
        </CardContainer>

        {/* ─── 7. Negative Marking Card ─── */}
        <CardContainer
          title="নেগেটিভ মার্কিং"
          tooltip={"-০.২৫: প্রতি ৪টি ভুল উত্তরের জন্য ১ নম্বর কাটা\n-০.৫০: প্রতি ২টি ভুল উত্তরের জন্য ১ নম্বর কাটা"}
        >
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#f0f4f9] dark:bg-[#18181B] border border-neutral-200/70 dark:border-white/[0.08]">
            {[
              { val: 0.0, label: '০ (নেই)' },
              { val: 0.25, label: '-০.২৫ মার্ক' },
              { val: 0.5, label: '-০.৫ মার্ক' },
            ].map(({ val, label }) => {
              const isSelected = negativeMarking === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => {}}
                  className={cn(
                    "py-2 rounded-lg text-xs sm:text-sm font-bold transition-all text-center font-['Anek_Bangla',sans-serif] cursor-pointer",
                    isSelected
                      ? 'bg-[#0b4d44] text-white shadow-xs'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </CardContainer>

        {/* ─── 8. Live Blueprint Capsule Summary ─── */}
        <div className="my-1 px-4 py-2.5 rounded-full bg-[#f2fbf7] dark:bg-[#121f1c] border border-emerald-200/80 dark:border-emerald-800/40 shadow-xs flex items-center justify-around text-center">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-sky-500 font-bold">?</span>
            <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 font-['Anek_Bangla',sans-serif]">
              {questionCount}টি প্রশ্ন
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-emerald-200 dark:bg-emerald-800/50" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-amber-500 font-bold">⏱</span>
            <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 font-['Anek_Bangla',sans-serif]">
              {durationMinutes} মিনিট
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-emerald-200 dark:bg-emerald-800/50" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-rose-500 font-bold">⊖</span>
            <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 font-['Anek_Bangla',sans-serif]">
              -0.25
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-emerald-200 dark:bg-emerald-800/50" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-purple-500 font-bold">⚡</span>
            <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 font-['Anek_Bangla',sans-serif]">
              +50 XP
            </span>
          </div>
        </div>

        {/* ─── 9. Primary Start Button ─── */}
        <button
          type="button"
          disabled={isLoading}
          onClick={handleStart}
          className="w-full py-3.5 rounded-2xl bg-[#0b4d44] hover:bg-[#093e37] active:scale-[0.99] text-white font-bold text-base sm:text-lg transition-all flex items-center justify-center gap-2 mt-1 mb-6 cursor-pointer font-['Anek_Bangla',sans-serif] shadow-sm disabled:opacity-50"
        >
          <span>শুরু করো</span>
        </button>
      </div>

      {/* ─── Modals ─── */}
      {/* Subject Modal */}
      {showSubjectModal && (
        <SubjectDropdownModal
          subjects={availableSubjects}
          selectedId={selectedSubjectId}
          onSelect={(id) => {
            setSelectedSubjectId(id);
            setSelectedChapters(new Set());
            setShowSubjectModal(false);
          }}
          onClose={() => setShowSubjectModal(false)}
        />
      )}

      {/* Chapter Modal */}
      {showChapterModal && (
        <ChapterMultiSelectModal
          title={`${selectedSubData?.label} - অধ্যায়সমূহ`}
          items={availableChapters}
          selectedIds={selectedChapters}
          getId={(c) => c.id}
          getName={(c) => c.name}
          onSave={(selected) => {
            setSelectedChapters(selected);
            setShowChapterModal(false);
          }}
          onClose={() => setShowChapterModal(false)}
        />
      )}

      {/* Topic Lock App Install Modal */}
      <AppInstallPromptModal
        isOpen={showTopicLockModal}
        onClose={() => setShowTopicLockModal(false)}
        title="টপিক ধরে ধরে এক্সাম দিতে চাও?"
        utmContent="setup_topic_click"
      />

      {/* Question Limit App Install Modal */}
      <AppInstallPromptModal
        isOpen={showQuestionLimitModal}
        onClose={() => setShowQuestionLimitModal(false)}
        title="যেকোনো সংখ্যক প্রশ্নে এক্সাম দিতে চাও?"
        utmContent="setup_question_limit"
      />
    </div>
  );
}

// ─── Subcomponents (Identical to ExamSetupForm) ───
interface CardContainerProps {
  title: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  tooltip?: string;
  children: React.ReactNode;
}

const CardContainer: React.FC<CardContainerProps> = ({ title, tooltip, children }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="p-3.5 sm:p-4 rounded-[16px] bg-white dark:bg-[#121212] border border-neutral-200/80 dark:border-white/[0.08] shadow-xs flex flex-col gap-2.5 sm:gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <h2 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
            {title}
          </h2>
          {tooltip && (
            <div className="relative inline-block">
              <button
                type="button"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 p-0.5 cursor-pointer"
              >
                <HelpCircle size={15} className="stroke-[2.2]" />
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
    <div className="p-1 rounded-xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/[0.08] flex flex-wrap gap-1">
      {items.map((item) => {
        const isSelected = selectedItems.has(item);
        return (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className={cn(
              "flex-1 min-w-[65px] py-2 px-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 text-center font-['Anek_Bangla',sans-serif] cursor-pointer",
              isSelected
                ? 'bg-[#12544F] text-white border border-[#12544F] shadow-xs active:scale-95'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
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
    <div className="flex items-center rounded-xl bg-neutral-100 dark:bg-[#18181B] border border-neutral-200/80 dark:border-white/[0.08] overflow-hidden p-0.5">
      <button
        type="button"
        disabled={value <= min}
        onClick={() => onChanged(value - step)}
        className="w-8 h-8 flex items-center justify-center text-[#12544F] dark:text-[#34D399] disabled:text-neutral-300 dark:disabled:text-neutral-700 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
      >
        <span className="text-base font-bold">−</span>
      </button>
      <span className="px-2.5 text-sm sm:text-base font-bold text-[#12544F] dark:text-[#34D399] font-['Anek_Bangla',sans-serif] min-w-[55px] text-center">
        {value} {unit}
      </span>
      <button
        type="button"
        disabled={value >= max}
        onClick={() => onChanged(value + step)}
        className="w-8 h-8 flex items-center justify-center text-[#12544F] dark:text-[#34D399] disabled:text-neutral-300 dark:disabled:text-neutral-700 hover:bg-white dark:hover:bg-neutral-800 rounded-lg transition active:scale-95 cursor-pointer disabled:cursor-not-allowed"
      >
        <span className="text-base font-bold">+</span>
      </button>
    </div>
  );
};

interface SubjectDropdownModalProps {
  subjects: PublicSubject[];
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
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[82vh] border border-neutral-200/80 dark:border-[#2C2C2E] z-10 animate-in slide-in-from-bottom duration-300">
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3" />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 dark:border-white/[0.08]">
          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
            বিষয় নির্বাচন করো
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-2">
          {subjects.map((sub) => {
            const isSelected = sub.id === selectedId;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSelect(sub.id)}
                className={cn(
                  "w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left font-['Anek_Bangla',sans-serif] cursor-pointer",
                  isSelected
                    ? 'bg-[#12544F] border-[#12544F] text-white shadow-sm active:scale-[0.99]'
                    : 'bg-neutral-50 dark:bg-[#18181B] border-neutral-200/80 dark:border-white/[0.08] text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
                )}
              >
                <span className="text-base font-bold">{sub.label}</span>
                {isSelected && (
                  <CheckCircle2 size={20} className="text-white shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface ChapterMultiSelectModalProps {
  title: string;
  items: PublicChapter[];
  selectedIds: Set<string>;
  getId: (item: PublicChapter) => string;
  getName: (item: PublicChapter) => string;
  onSave: (selected: Set<string>) => void;
  onClose: () => void;
}

const ChapterMultiSelectModal: React.FC<ChapterMultiSelectModalProps> = ({
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
  const isAllSelected =
    allIds.size > 0 && Array.from(allIds).every((id) => currentSelected.has(id));

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[82vh] border border-neutral-200/80 dark:border-[#2C2C2E] z-10 animate-in slide-in-from-bottom duration-300">
        <div className="sm:hidden w-10 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full mx-auto my-3" />
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-neutral-100 dark:border-white/[0.08]">
          <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif] truncate mr-2">
            {title}
          </h3>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleSelectAll}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition font-['Anek_Bangla',sans-serif] cursor-pointer",
                isAllSelected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                  : 'bg-neutral-100 dark:bg-[#2C2C2E] border-neutral-200 dark:border-[#3A3A3C] text-neutral-700 dark:text-neutral-300'
              )}
            >
              {isAllSelected ? <CheckCheck size={13} /> : <Check size={13} />}
              <span>{isAllSelected ? 'সব বাছাইকৃত' : 'সবগুলো'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-neutral-400 dark:text-neutral-500 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {items.length === 0 ? (
            <div className="py-10 text-center text-neutral-400 dark:text-neutral-500 font-['Anek_Bangla',sans-serif] text-sm">
              এই বিষয়ের সকল অধ্যায় সমন্বিত পূর্ণাঙ্গ মডেল টেস্ট অনুষ্ঠিত হবে।
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
                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left font-['Anek_Bangla',sans-serif] cursor-pointer",
                    isSelected
                      ? 'bg-[#12544F]/10 dark:bg-[#12544F]/20 border-[#12544F] dark:border-[#34D399]/60 text-[#12544F] dark:text-[#34D399]'
                      : 'bg-neutral-50 dark:bg-[#18181B] border-neutral-200/80 dark:border-white/[0.08] text-neutral-800 dark:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition',
                      isSelected
                        ? 'bg-[#12544F] dark:bg-[#34D399] border-[#12544F] dark:border-[#34D399]'
                        : 'border-neutral-300 dark:border-neutral-600 bg-transparent'
                    )}
                  >
                    {isSelected && (
                      <Check size={13} className="text-white dark:text-black stroke-[3]" />
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

        <div className="p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-neutral-100 dark:border-white/[0.08]">
          <button
            type="button"
            onClick={() => onSave(currentSelected)}
            className="w-full py-3 px-4 rounded-[14px] bg-[#12544F] text-white shadow-md hover:brightness-105 active:scale-[0.99] font-bold text-base font-['Anek_Bangla',sans-serif] transition cursor-pointer"
          >
            সংরক্ষণ করো ({currentSelected.size === 0 ? 'সব' : currentSelected.size})
          </button>
        </div>
      </div>
    </div>
  );
};
