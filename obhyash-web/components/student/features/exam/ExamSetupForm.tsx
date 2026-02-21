'use client';

import React, { useState, useEffect } from 'react';
import { ExamConfig, Difficulty, ExamDetails } from '@/lib/types';
import { printQuestionPaper, printOMRSheet } from '@/services/print-service';
import { getSubjectMetadata, SubjectMetadata } from '@/services/database';
import { getAvailableQuestionCount } from '@/services/exam-service';
import {
  EXAM_TYPE_OPTIONS,
  DIFFICULTY_OPTIONS,
  NEGATIVE_MARKING_OPTIONS,
} from '@/lib/constants';
import {
  AlertCircle,
  BookOpen,
  Clock,
  FileQuestion,
  Layers,
  Zap,
  X,
  CheckSquare,
  ListFilter,
  ChevronRight,
  Sparkles,
  Timer,
  FileText,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../../ui/alert';
import SelectionModal from '@/components/student/ui/common/SelectionModal';

interface ExamSetupFormProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
}

const ExamSetupForm: React.FC<ExamSetupFormProps> = ({
  onStartExam,
  isLoading,
}) => {
  // --- Form State ---
  const [subject, setSubject] = useState('');
  const [examTypes, setExamTypes] = useState<string[]>(['Academic']);

  // Data Options
  const [chapterOptions, setChapterOptions] = useState<string[]>([]);
  const [topicOptions, setTopicOptions] = useState<string[]>([]);

  // Selection State
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Modal State
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

  // Exam Config
  const [difficulties, setDifficulties] = useState<string[]>(['Medium']);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [duration, setDuration] = useState<number>(25);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);

  // Metadata Cache & Loading
  const [metadata, setMetadata] = useState<SubjectMetadata | null>(null);
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<
    {
      id: string;
      name: string;
      label?: string;
      icon?: string;
      group?: string;
    }[]
  >([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);

  // Validation
  const [validationError, setValidationError] = useState<string | null>(null);

  // OMR State (Restored)
  const [isOmrModalOpen, setIsOmrModalOpen] = useState(false);
  const [omrCount, setOmrCount] = useState(50);
  const [omrIsBlank, setOmrIsBlank] = useState(false);

  // Available question count
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [isCountLoading, setIsCountLoading] = useState(false);

  // --- Effects ---

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { getUserProfile, getSubjects } =
          await import('@/services/database');
        const user = await getUserProfile('me');
        if (user) {
          const subjects = await getSubjects(
            user.division,
            user.stream,
            user.optional_subject,
          );
          setAvailableSubjects(subjects);
        }
      } catch (error) {
        console.error('Failed to load subjects', error);
      } finally {
        setIsSubjectsLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  // Sync duration with question limit
  useEffect(() => {
    setDuration(questionCount);
  }, [questionCount]);

  // Load Chapters when Subject changes
  useEffect(() => {
    if (subject) {
      setIsMetaLoading(true);
      getSubjectMetadata(subject).then((data) => {
        if (data) {
          setMetadata(data);
          setChapterOptions(data.chapters);
          setSelectedChapters([]);
          setSelectedTopics([]);
          setTopicOptions([]);
        } else {
          setChapterOptions([]);
          setTopicOptions([]);
        }
        setIsMetaLoading(false);
      });
    } else {
      setChapterOptions([]);
      setTopicOptions([]);
    }
  }, [subject]);

  // Load Topics when Chapters change
  useEffect(() => {
    if (
      selectedChapters.length > 0 &&
      metadata &&
      Object.keys(metadata.topics).length > 0
    ) {
      const aggregatedTopics = new Set<string>();
      selectedChapters.forEach((chapter) => {
        if (metadata.topics[chapter]) {
          metadata.topics[chapter].forEach((t) => aggregatedTopics.add(t));
        }
      });
      setTopicOptions(Array.from(aggregatedTopics));
    } else {
      setTopicOptions([]);
    }
  }, [selectedChapters, metadata]);

  // Fetch available question count when subject/chapters/difficulty change
  useEffect(() => {
    if (!subject) {
      setAvailableCount(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCountLoading(true);
      const subjectLabel =
        availableSubjects.find((s) => s.id === subject)?.name || subject;
      const chapters = selectedChapters.length > 0 ? selectedChapters : null;
      const difficultyValue =
        difficulties.length === DIFFICULTY_OPTIONS.length
          ? null
          : difficulties.join('+');
      const count = await getAvailableQuestionCount(
        subject,
        subjectLabel,
        chapters,
        difficultyValue,
      );
      setAvailableCount(count);
      setIsCountLoading(false);
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [subject, selectedChapters, difficulties, availableSubjects]);

  // --- Handlers ---

  const toggleExamType = (typeId: string) => {
    setExamTypes((prev) => {
      if (prev.includes(typeId)) {
        return prev.filter((id) => id !== typeId);
      } else {
        return [...prev, typeId];
      }
    });
  };

  const toggleChapterSelection = (chapter: string) => {
    setSelectedChapters((prev) => {
      if (prev.includes(chapter)) {
        return prev.filter((c) => c !== chapter);
      } else {
        return [...prev, chapter];
      }
    });
  };

  const toggleDifficulty = (levelId: string) => {
    setDifficulties((prev) => {
      if (prev.includes(levelId)) {
        if (prev.length === 1) return prev; // Prevent deselecting all
        return prev.filter((id) => id !== levelId);
      }
      return [...prev, levelId];
    });
  };

  const handleSelectAllDifficulties = () => {
    if (difficulties.length === DIFFICULTY_OPTIONS.length) {
      setDifficulties(['Medium']);
    } else {
      setDifficulties(DIFFICULTY_OPTIONS.map((opt) => opt.id));
    }
  };

  const toggleTopicSelection = (topic: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((t) => t !== topic);
      } else {
        return [...prev, topic];
      }
    });
  };

  const handleSelectAllExamTypes = () => {
    if (examTypes.length === EXAM_TYPE_OPTIONS.length) {
      setExamTypes([]); // Deselect all
    } else {
      setExamTypes(EXAM_TYPE_OPTIONS.map((opt) => opt.id)); // Select all
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const subjectLabel =
      availableSubjects.find((s) => s.id === subject)?.name || subject;

    if (!subject) {
      setValidationError('অনুগ্রহ করে একটি বিষয় নির্বাচন করুন।');
      return;
    }

    if (examTypes.length === 0) {
      setValidationError(
        'অনুগ্রহ করে কমপক্ষে একটি পরীক্ষার ধরণ নির্বাচন করুন।',
      );
      return;
    }

    const examTypeValue =
      examTypes.length === EXAM_TYPE_OPTIONS.length
        ? 'Mixed'
        : examTypes.join(' + ');

    const difficultyValue =
      difficulties.length === DIFFICULTY_OPTIONS.length
        ? 'Mixed'
        : difficulties.join(' , ');

    onStartExam({
      subject: subject,
      subjectLabel: subjectLabel,
      examType: examTypeValue,
      chapters:
        selectedChapters.length > 0 ? selectedChapters.join(', ') : 'All',
      topics: selectedTopics.length > 0 ? selectedTopics.join(', ') : 'General',
      difficulty: difficultyValue, // Handled properly now
      questionCount,
      durationMinutes: duration,
      negativeMarking,
    });
  };

  const handleOmrDownload = () => {
    const finalSubject = omrIsBlank
      ? ''
      : subject
        ? availableSubjects.find((s) => s.id === subject)?.name || subject
        : '______________________';
    const finalChapter = omrIsBlank
      ? ''
      : selectedChapters.length > 0
        ? selectedChapters.join(', ')
        : 'All Chapters';

    const details: ExamDetails = {
      subject: subject,
      subjectLabel: finalSubject,
      examType: omrIsBlank ? '' : 'Practice Exam',
      chapters: finalChapter,
      topics: '',
      totalQuestions: omrCount,
      durationMinutes: 0,
      totalMarks: 0,
      negativeMarking: 0,
    };

    printOMRSheet(details, omrCount);
    setIsOmrModalOpen(false);
  };

  const cn = (...classes: (string | boolean | undefined)[]) =>
    classes.filter(Boolean).join(' ');

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-24">
      <div className="mb-6 md:mb-8">
        <h2 className="text-xl md:text-3xl font-extrabold text-neutral-900 dark:text-white mb-1 md:mb-2 flex items-center gap-3">
          মক টেস্ট সেটআপ
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-wider font-extrabold">
            <Sparkles className="w-3 h-3" />
            Smart AI Active
          </span>
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm flex items-center gap-2">
          আপনার প্রয়োজন অনুযায়ী পরীক্ষা কাস্টমাইজ করুন
          <span className="sm:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-[10px] font-bold">
            <Sparkles className="w-3 h-3" /> AI Active
          </span>
        </p>
      </div>

      {validationError && (
        <Alert
          variant="destructive"
          className="mb-6 border-red-200 dark:border-red-900/50"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="font-semibold">ত্রুটি</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* LEFT COLUMN - SELECTION */}
        <div className="lg:col-span-2 space-y-4">
          {/* ── Subject / Chapter / Topic — compact trigger rows ─── */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
            {/* Subject trigger */}
            <div>
              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                বিষয়
              </label>
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(true)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3.5 text-left hover:border-neutral-300 dark:hover:border-neutral-600 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {subject ? (
                    <>
                      <span className="text-xl flex-shrink-0">
                        {availableSubjects.find((s) => s.id === subject)?.icon}
                      </span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {availableSubjects.find((s) => s.id === subject)
                          ?.name ||
                          availableSubjects.find((s) => s.id === subject)
                            ?.label}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                      {isSubjectsLoading
                        ? 'লোড হচ্ছে...'
                        : 'বিষয় নির্বাচন করো'}
                    </span>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors flex-shrink-0" />
              </button>
            </div>

            {/* Chapter trigger */}
            <div className={cn(!subject && 'opacity-50 pointer-events-none')}>
              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                অধ্যায়
              </label>
              <button
                type="button"
                onClick={() => setIsChapterModalOpen(true)}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3.5 text-left hover:border-neutral-300 dark:hover:border-neutral-600 transition-all flex items-center justify-between group"
              >
                <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                  {selectedChapters.length === 0
                    ? 'সব অধ্যায়'
                    : selectedChapters.length === 1
                      ? selectedChapters[0]
                      : `${selectedChapters.length} টি নির্বাচিত`}
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
              </button>
              {selectedChapters.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {selectedChapters.slice(0, 3).map((c) => (
                    <span
                      key={c}
                      className="text-[11px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-md font-medium"
                    >
                      {c}
                    </span>
                  ))}
                  {selectedChapters.length > 3 && (
                    <span className="text-[11px] px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-md">
                      +{selectedChapters.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Topic trigger */}
            <div
              className={cn(
                topicOptions.length === 0 && 'opacity-50 pointer-events-none',
              )}
            >
              <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
                টপিক
              </label>
              <button
                type="button"
                onClick={() =>
                  topicOptions.length > 0 && setIsTopicModalOpen(true)
                }
                disabled={topicOptions.length === 0}
                className="w-full bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3.5 text-left hover:border-neutral-300 dark:hover:border-neutral-600 transition-all flex items-center justify-between group disabled:cursor-not-allowed"
              >
                <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                  {topicOptions.length === 0
                    ? 'অধ্যায় নির্বাচন করো'
                    : selectedTopics.length === 0
                      ? 'সব টপিক'
                      : `${selectedTopics.length} টি নির্বাচিত`}
                </span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SETTINGS */}
        <div className="space-y-6">
          {/* Exam Type & Difficulty */}
          <div className="w-full bg-white dark:bg-neutral-900 rounded-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-6">
            {/* Exam Type */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  পরীক্ষার ধরণ
                </label>
                <button
                  type="button"
                  onClick={handleSelectAllExamTypes}
                  className="text-xs font-bold text-emerald-700 dark:text-emerald-500 hover:underline"
                >
                  {examTypes.length === EXAM_TYPE_OPTIONS.length
                    ? 'সব মুছুন'
                    : 'সব নির্বাচন করুন'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {EXAM_TYPE_OPTIONS.map((type) => {
                  const isSelected = examTypes.includes(type.id);
                  return (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => toggleExamType(type.id)}
                      className={cn(
                        'p-3 rounded-xl border-2 text-left transition-all',
                        isSelected
                          ? 'border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
                      )}
                    >
                      <div
                        className={cn(
                          'text-xs font-semibold mb-0.5',
                          isSelected
                            ? 'text-emerald-800 dark:text-emerald-300'
                            : 'text-neutral-700 dark:text-neutral-300',
                        )}
                      >
                        {type.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {type.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                কঠিনতা
              </label>
              <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl gap-1 overflow-x-auto">
                <button
                  type="button"
                  onClick={handleSelectAllDifficulties}
                  className={cn(
                    'flex-1 min-w-[60px] py-2 rounded-lg text-xs font-semibold transition-all',
                    difficulties.length === DIFFICULTY_OPTIONS.length
                      ? 'bg-white dark:bg-neutral-700 text-emerald-700 dark:text-emerald-400 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                  )}
                >
                  সব (All)
                </button>
                {DIFFICULTY_OPTIONS.map((opt) => {
                  const isSelected = difficulties.includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggleDifficulty(opt.id)}
                      className={cn(
                        'flex-1 min-w-[60px] py-2 rounded-lg text-xs font-semibold transition-all',
                        isSelected
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                          : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time & Marks */}
          <div className="w-full bg-white dark:bg-neutral-900 rounded-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 p-5 sm:p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-6">
            {/* Question Count */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  প্রশ্নের সংখ্যা
                </label>
                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-900 dark:text-white font-semibold text-sm">
                  {questionCount}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-700"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-2">
                <span>1</span>
                <span>100</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  সময় (মিনিট)
                </label>
                <span className="px-3 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-900 dark:text-white font-semibold text-sm">
                  {duration}m
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="180"
                step="1"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2.5 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-emerald-700"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-2">
                <span>1m</span>
                <span>3h</span>
              </div>
            </div>

            {/* Negative Marking */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                নেগেটিভ মার্কিং
              </label>
              <div className="flex gap-2">
                {NEGATIVE_MARKING_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNegativeMarking(val)}
                    className={cn(
                      'flex-1 py-2 px-1 rounded-xl border-2 text-xs font-semibold transition-all',
                      negativeMarking === val
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-700 text-emerald-800 dark:text-emerald-300'
                        : 'bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600',
                    )}
                  >
                    {val === 0 ? 'None' : `-${val}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons — side by side */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-3">
          {/* OMR Download — secondary action */}
          <button
            type="button"
            onClick={() => setIsOmrModalOpen(true)}
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 rounded-2xl font-semibold text-sm border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-sm transition-all active:scale-[0.98]"
          >
            <FileQuestion className="w-4 h-4" />
            OMR ডাউনলোড
          </button>

          {/* Start Exam — primary CTA */}
          <button
            type="submit"
            disabled={isLoading || !subject || examTypes.length === 0}
            className="w-full bg-emerald-800 dark:bg-emerald-700 text-white font-extrabold py-4 sm:py-4.5 rounded-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 hover:bg-emerald-900 dark:hover:bg-emerald-600 shadow-lg shadow-emerald-800/20 transition-all active:scale-[0.98] flex justify-center items-center gap-3 text-base md:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                প্রশ্ন তৈরি হচ্ছে...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                শুরু করুন
              </>
            )}
          </button>
        </div>
      </form>
      {/* Subject Selection Bottom Sheet */}
      {isSubjectModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in-0 duration-300"
          onClick={() => setIsSubjectModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg max-h-[50vh] sm:max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-emerald-700 rounded-t-3xl z-10" />

            <div className="rounded-t-3xl sm:rounded-t-3xl bg-white dark:bg-neutral-950 border border-b-0 border-neutral-200 dark:border-neutral-800 px-6 pt-5 pb-4 flex-shrink-0">
              <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-700 sm:hidden" />
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                বিষয় নির্বাচন
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                তোমার পরীক্ষার বিষয় বেছে নাও
              </p>
            </div>

            <div className="flex-1 overflow-y-auto bg-white dark:bg-neutral-950 border-x border-neutral-200 dark:border-neutral-800 px-4 py-3">
              {isSubjectsLoading ? (
                <div className="flex items-center justify-center py-12 text-neutral-400 text-sm animate-pulse">
                  বিষয় লোড হচ্ছে...
                </div>
              ) : availableSubjects.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-neutral-400 text-sm">
                  কোনো বিষয় পাওয়া যায়নি
                </div>
              ) : (
                <div className="space-y-1.5">
                  {availableSubjects.map((opt) => {
                    const isSelected = subject === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setSubject(opt.id);
                          setIsSubjectModalOpen(false);
                        }}
                        className={cn(
                          'flex items-center gap-3.5 p-3.5 rounded-2xl cursor-pointer transition-all duration-150',
                          isSelected
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 ring-1 ring-emerald-700/20'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-900',
                        )}
                      >
                        <span className="text-2xl flex-shrink-0">
                          {opt.icon}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            isSelected
                              ? 'text-emerald-900 dark:text-emerald-300'
                              : 'text-neutral-700 dark:text-neutral-300',
                          )}
                        >
                          {opt.name || opt.label}
                        </span>
                        {isSelected && (
                          <div className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="white"
                              className="w-3 h-3"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="rounded-b-none sm:rounded-b-3xl bg-white dark:bg-neutral-950 border border-t-0 border-neutral-200 dark:border-neutral-800 px-6 py-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsSubjectModalOpen(false)}
                className="w-full py-3 rounded-2xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-medium text-sm transition-colors duration-150"
              >
                বন্ধ করো
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chapter Selection Modal */}
      <SelectionModal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        title="অধ্যায় নির্বাচন"
        items={chapterOptions}
        selectedItems={selectedChapters}
        onToggle={toggleChapterSelection}
        onSelectAll={() => setSelectedChapters([...chapterOptions])}
        onClearAll={() => setSelectedChapters([])}
      />

      {/* Topic Selection Modal */}
      <SelectionModal
        isOpen={isTopicModalOpen}
        onClose={() => setIsTopicModalOpen(false)}
        title="টপিক নির্বাচন"
        items={topicOptions}
        selectedItems={selectedTopics}
        onToggle={toggleTopicSelection}
        onSelectAll={() => setSelectedTopics([...topicOptions])}
        onClearAll={() => setSelectedTopics([])}
      />

      {/* OMR Modal (Restored & Fixed Layout) */}
      {isOmrModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsOmrModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 zoom-in-95 duration-300 scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Download className="w-6 h-6 text-neutral-700 dark:text-neutral-300" />
                  OMR ডাউনলোড
                </h3>
                <p className="text-sm text-neutral-500 mt-2 font-medium">
                  প্রিন্ট করে অফলাইনে প্র্যাকটিস করুন
                </p>
              </div>
              <button
                onClick={() => setIsOmrModalOpen(false)}
                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
              >
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800">
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white text-base">
                    ইউনিভার্সাল ব্ল্যাঙ্ক OMR
                  </div>
                  <div className="text-xs text-neutral-500 mt-1 font-medium">
                    যেকোনো পরীক্ষার জন্য ব্যবহারযোগ্য
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={omrIsBlank}
                    onChange={(e) => setOmrIsBlank(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-7 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-700 transition-colors"></div>
                </label>
              </div>

              <div
                className={cn(
                  'space-y-5 transition-all duration-300',
                  omrIsBlank
                    ? 'opacity-40 pointer-events-none grayscale'
                    : 'opacity-100',
                )}
              >
                <div className="p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">
                      বিষয় (Subject)
                    </label>
                    <select
                      value={subject || ''}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-bold border-none focus:ring-2 focus:ring-emerald-700/20"
                    >
                      <option value="" disabled>
                        বিষয় নির্বাচন করুন
                      </option>
                      {availableSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">
                      অধ্যায় (Chapters)
                    </label>
                    <button
                      onClick={() => setIsChapterModalOpen(true)}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-bold flex justify-between items-center hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all"
                    >
                      <span className="truncate">
                        {selectedChapters.length > 0
                          ? selectedChapters.join(', ')
                          : 'সব অধ্যায়'}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">
                      টপিক (Topics)
                    </label>
                    <button
                      onClick={() =>
                        topicOptions.length > 0 && setIsTopicModalOpen(true)
                      }
                      disabled={topicOptions.length === 0}
                      className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-bold flex justify-between items-center hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="truncate">
                        {topicOptions.length === 0
                          ? 'অধ্যায় নির্বাচন করুন'
                          : selectedTopics.length === 0
                            ? 'সব টপিক'
                            : `${selectedTopics.length} টি নির্বাচিত`}
                      </span>
                      <ChevronRight className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-xs font-bold text-neutral-500 uppercase">
                    প্রশ্নের সংখ্যা
                  </label>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-lg text-sm border border-rose-100 dark:border-rose-900/30">
                    {omrCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={omrCount}
                  onChange={(e) => setOmrCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-rose-600"
                />
                <div className="flex justify-between text-[10px] text-neutral-400 mt-2 font-bold px-1">
                  <span>10</span>
                  <span>100</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleOmrDownload}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-white dark:to-neutral-200 hover:shadow-lg hover:-translate-y-0.5 text-white dark:text-neutral-900 font-extrabold shadow-md transition-all active:scale-[0.98] flex justify-center items-center gap-3"
                >
                  <FileQuestion className="w-5 h-5" />
                  PDF জেনারেট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSetupForm;
