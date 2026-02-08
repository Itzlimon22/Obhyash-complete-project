'use client';

import React, { useState, useEffect } from 'react';
import { ExamConfig, Difficulty, ExamDetails } from '@/lib/types';
import { printQuestionPaper } from '@/services/print-service'; // Removed printOMRSheet
import { OmrPrintModal } from '@/components/student/features/omr/OmrPrintModal'; // Added
import { getSubjectMetadata, SubjectMetadata } from '@/services/database';
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
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

  // Exam Config
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Mixed);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [duration, setDuration] = useState<number>(20);
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

  // OMR Print Modal State
  const [isOmrPrintModalOpen, setIsOmrPrintModalOpen] = useState(false);
  const [omrPrintDetails, setOmrPrintDetails] = useState<ExamDetails | null>(
    null,
  );

  // --- Effects ---

  // Load Subjects
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

  // --- Handlers ---

  const toggleExamType = (typeId: string) => {
    setExamTypes((prev) => {
      if (prev.includes(typeId)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== typeId);
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

  const toggleTopicSelection = (topic: string) => {
    setSelectedTopics((prev) => {
      if (prev.includes(topic)) {
        return prev.filter((t) => t !== topic);
      } else {
        return [...prev, topic];
      }
    });
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

    onStartExam({
      subject: subjectLabel,
      subjectLabel: subjectLabel,
      examType: examTypes.join(' + '),
      chapters:
        selectedChapters.length > 0 ? selectedChapters.join(', ') : 'All',
      topics: selectedTopics.length > 0 ? selectedTopics.join(', ') : 'General',
      difficulty,
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

    setOmrPrintDetails(details);
    setIsOmrPrintModalOpen(true);
    setIsOmrModalOpen(false);
  };

  const cn = (...classes: (string | boolean | undefined)[]) =>
    classes.filter(Boolean).join(' ');

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            মক টেস্ট সেটআপ
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            আপনার প্রয়োজন অনুযায়ী পরীক্ষা কাস্টমাইজ করুন
          </p>
        </div>

        {/* OMR Button */}
        <button
          type="button"
          onClick={() => setIsOmrModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-semibold text-sm hover:shadow-lg transition-all active:scale-95"
        >
          <FileQuestion className="w-4 h-4" />
          OMR শিট ডাউনলোড
        </button>
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
        <div className="lg:col-span-2 space-y-6">
          {/* Subject Selection */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800">
            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              বিষয় নির্বাচন করুন
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {isSubjectsLoading ? (
                <div className="col-span-full py-12 text-center text-neutral-400 text-sm animate-pulse">
                  বিষয় লোড হচ্ছে...
                </div>
              ) : availableSubjects.length === 0 ? (
                <div className="col-span-full py-12 text-center text-neutral-400 text-sm">
                  কোনো বিষয় পাওয়া যায়নি
                </div>
              ) : (
                availableSubjects.map((opt) => (
                  <button
                    type="button"
                    key={opt.id}
                    onClick={() => setSubject(opt.id)}
                    className={cn(
                      'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 text-center',
                      subject === opt.id
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 shadow-sm'
                        : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
                    )}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        subject === opt.id
                          ? 'text-rose-700 dark:text-rose-300'
                          : 'text-neutral-700 dark:text-neutral-300',
                      )}
                    >
                      {opt.name || opt.label}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chapters & Topics Selection */}
          <div
            className={cn(
              'bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-6',
              !subject && 'opacity-50 pointer-events-none',
            )}
          >
            {/* Chapter Selection */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                অধ্যায় (Chapters)
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(true)}
                  className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-left hover:border-neutral-300 dark:hover:border-neutral-600 transition-all flex items-center justify-between group"
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
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(true)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl border border-neutral-200 dark:border-neutral-700 font-medium text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                >
                  <ListFilter className="w-4 h-4" />
                </button>
              </div>

              {/* Selected Chips */}
              {selectedChapters.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedChapters.slice(0, 5).map((c) => (
                    <span
                      key={c}
                      className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg"
                    >
                      {c}
                    </span>
                  ))}
                  {selectedChapters.length > 5 && (
                    <span className="text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded-lg">
                      +{selectedChapters.length - 5}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Topic Selection */}
            <div className={cn(topicOptions.length === 0 && 'opacity-50')}>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                টপিক (Topics)
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    topicOptions.length > 0 && setIsTopicModalOpen(true)
                  }
                  disabled={topicOptions.length === 0}
                  className="flex-1 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-left hover:border-neutral-300 dark:hover:border-neutral-600 transition-all flex items-center justify-between group disabled:cursor-not-allowed"
                >
                  <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">
                    {topicOptions.length === 0
                      ? 'অধ্যায় নির্বাচন করুন'
                      : selectedTopics.length === 0
                        ? 'সব টপিক'
                        : `${selectedTopics.length} টি নির্বাচিত`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors" />
                </button>
                <button
                  type="button"
                  disabled={topicOptions.length === 0}
                  onClick={() => setIsTopicModalOpen(true)}
                  className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl border border-neutral-200 dark:border-neutral-700 font-medium text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ListFilter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - SETTINGS */}
        <div className="space-y-6">
          {/* Exam Type & Difficulty */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-6">
            {/* Exam Type */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                পরীক্ষার ধরণ
              </label>
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
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                          : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600',
                      )}
                    >
                      <div
                        className={cn(
                          'text-xs font-semibold mb-0.5',
                          isSelected
                            ? 'text-rose-700 dark:text-rose-300'
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
              <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1.5 rounded-xl">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDifficulty(opt.id as Difficulty)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-semibold transition-all',
                      difficulty === opt.id
                        ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Time & Marks */}
          <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-6">
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
                min="5"
                max="100"
                step="5"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-2">
                <span>5</span>
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
                min="5"
                max="180"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-2">
                <span>5m</span>
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
                        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 dark:text-rose-300'
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

        {/* Start Button */}
        <div className="lg:col-span-3">
          <button
            type="submit"
            disabled={isLoading || !subject || examTypes.length === 0}
            className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-4 rounded-xl hover:shadow-lg transition-all active:scale-[0.99] flex justify-center items-center gap-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                প্রশ্ন তৈরি হচ্ছে...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                পরীক্ষা শুরু করুন
              </>
            )}
          </button>
        </div>
      </form>

      {/* Chapter Selection Modal */}
      {isChapterModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsChapterModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-5 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-t-3xl">
              <div>
                <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                  অধ্যায় নির্বাচন
                </h3>
                <p className="text-xs font-medium text-neutral-500 mt-1">
                  {selectedChapters.length} টি নির্বাচিত
                </p>
              </div>
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-4 p-3 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10">
              <button
                onClick={() => setSelectedChapters([...chapterOptions])}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                সবগুলো সিলেক্ট
              </button>
              <div className="w-px bg-neutral-200 dark:bg-neutral-800 h-6 my-auto"></div>
              <button
                onClick={() => setSelectedChapters([])}
                className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                মুছে ফেলুন
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {chapterOptions.length === 0 ? (
                <div className="text-center text-neutral-400 py-12 text-sm flex flex-col items-center gap-2">
                  <AlertTriangle className="w-8 h-8 opacity-50" />
                  কোন অধ্যায় পাওয়া যায়নি
                </div>
              ) : (
                <div className="space-y-2">
                  {chapterOptions.map((chapter) => {
                    const isSelected = selectedChapters.includes(chapter);
                    return (
                      <div
                        key={chapter}
                        onClick={() => toggleChapterSelection(chapter)}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 group',
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500/20 shadow-sm'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent',
                        )}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 scale-100'
                              : 'border-neutral-300 dark:border-neutral-600 bg-transparent group-hover:border-indigo-400',
                          )}
                        >
                          {isSelected && (
                            <CheckSquare className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm font-semibold leading-snug',
                            isSelected
                              ? 'text-indigo-900 dark:text-indigo-100'
                              : 'text-neutral-700 dark:text-neutral-300',
                          )}
                        >
                          {chapter}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-b-3xl">
              <button
                onClick={() => setIsChapterModalOpen(false)}
                className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic Selection Modal */}
      {/* Similar design update for Topic Modal */}
      {isTopicModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsTopicModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col border border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-bottom-5 zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50 rounded-t-3xl">
              <div>
                <h3 className="text-xl font-extrabold text-neutral-900 dark:text-white">
                  টপিক নির্বাচন
                </h3>
                <p className="text-xs font-medium text-neutral-500 mt-1">
                  {selectedTopics.length} টি নির্বাচিত
                </p>
              </div>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="flex gap-4 p-3 border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10">
              <button
                onClick={() => setSelectedTopics([...topicOptions])}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                সবগুলো সিলেক্ট
              </button>
              <div className="w-px bg-neutral-200 dark:bg-neutral-800 h-6 my-auto"></div>
              <button
                onClick={() => setSelectedTopics([])}
                className="text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                মুছে ফেলুন
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {topicOptions.length === 0 ? (
                <div className="text-center text-neutral-400 py-12 text-sm flex flex-col items-center gap-2">
                  <AlertTriangle className="w-8 h-8 opacity-50" />
                  কোন টপিক পাওয়া যায়নি
                </div>
              ) : (
                <div className="space-y-2">
                  {topicOptions.map((topic) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <div
                        key={topic}
                        onClick={() => toggleTopicSelection(topic)}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 group',
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-500/20 shadow-sm'
                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-transparent',
                        )}
                      >
                        <div
                          className={cn(
                            'w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300',
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 scale-100'
                              : 'border-neutral-300 dark:border-neutral-600 bg-transparent group-hover:border-indigo-400',
                          )}
                        >
                          {isSelected && (
                            <CheckSquare className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span
                          className={cn(
                            'text-sm font-semibold leading-snug',
                            isSelected
                              ? 'text-indigo-900 dark:text-indigo-100'
                              : 'text-neutral-700 dark:text-neutral-300',
                          )}
                        >
                          {topic}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 rounded-b-3xl">
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold text-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                সম্পন্ন করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OMR Modal (Restored & Fixed Layout) */}
      {isOmrModalOpen && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsOmrModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-5 zoom-in-95 duration-300 scrollbar-hide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-extrabold text-neutral-900 dark:text-white flex items-center gap-2">
                  <Download className="w-6 h-6 text-rose-500" />
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
                  <div className="w-12 h-7 bg-neutral-200 peer-focus:outline-none rounded-full peer dark:bg-neutral-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-rose-600 transition-colors"></div>
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
                    <div className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-bold truncate">
                      {subject
                        ? availableSubjects.find((s) => s.id === subject)
                            ?.name || subject
                        : '⚠️ আগে বিষয় নির্বাচন করুন'}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">
                      অধ্যায় (Chapters)
                    </label>
                    <div className="w-full px-4 py-3 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white text-sm font-bold truncate">
                      {selectedChapters.length > 0
                        ? selectedChapters.join(', ')
                        : 'সব অধ্যায়'}
                    </div>
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
      {/* OMR Preview & Print Modal */}
      {omrPrintDetails && (
        <OmrPrintModal
          isOpen={isOmrPrintModalOpen}
          onClose={() => setIsOmrPrintModalOpen(false)}
          details={omrPrintDetails}
          totalQuestions={omrCount}
        />
      )}
    </div>
  );
};

export default ExamSetupForm;
