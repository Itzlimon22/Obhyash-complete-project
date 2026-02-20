'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Layout,
  Settings2,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/error-utils';

import { ExamConfig, Difficulty, ExamDetails } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  ExamTypeSelection,
  DifficultySelection,
  QuestionCountSelection,
  TimeSelection,
  NegativeMarkingSelection,
} from '@/components/student/features/exam/setup/ExamSettings';
import { TopicSelector } from '@/components/student/features/exam/setup/TopicSelector';
import { SubjectSelector } from '@/components/student/features/exam/setup/SubjectSelector';
import { OmrConfigModal } from '@/components/student/features/omr/OmrConfigModal';
import { printOMRSheet } from '@/services/print-service';
import { EXAM_TYPE_OPTIONS } from '@/lib/constants';

interface ExamSetupFormProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
}

interface Subject {
  id: string;
  label: string;
  icon: string | React.ReactNode;
  name: string;
  rawName?: string; // Added rawName
}

interface Item {
  id: string;
  name: string;
}

const STATIC_SUBJECT_ICONS: Record<string, string> = {
  Physics: '⚛️',
  Chemistry: '🧪',
  Math: '📐',
  Biology: '🧬',
  Bangla: '📚',
  English: '📝',
  GK: '🌍',
  ICT: '💻',
  default: '📖',
};

const ExamSetupForm: React.FC<ExamSetupFormProps> = ({
  onStartExam,
  isLoading,
}) => {
  // --- Data State ---
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [availableChapters, setAvailableChapters] = useState<Item[]>([]);
  interface TopicItem extends Item {
    chapter_id?: string;
  }
  const [availableTopics, setAvailableTopics] = useState<TopicItem[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(true);

  // --- Form State ---
  const [subject, setSubject] = useState('');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>(['Academic']);
  const [difficulties, setDifficulties] = useState<string[]>(['Medium']);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [duration, setDuration] = useState<number>(25);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);

  // --- Modals State ---
  const [isOmrConfigOpen, setIsOmrConfigOpen] = useState(false);

  // --- Data Fetching ---

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsFetchingData(true);
        const { getUserProfile, getSubjects } =
          await import('@/services/database');
        const user = await getUserProfile('me');

        if (user) {
          const subjects = await getSubjects(
            user.division || (user as any).section,
            user.stream,
            (user as any).optional_subject,
          );

          const formattedSubjects = subjects.map((sub: any) => {
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
                STATIC_SUBJECT_ICONS[sub.name_en] ||
                STATIC_SUBJECT_ICONS[sub.id] ||
                STATIC_SUBJECT_ICONS.default,
              name: label,
              rawName: nameBn, // Added rawName
            };
          });

          setAvailableSubjects(formattedSubjects);
        }
      } catch (error) {
        console.error('Error loading subjects:', error);
        toast.error(getErrorMessage(error));
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchSubjects();
  }, []);

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
        const { getChapters } = await import('@/services/database');
        const chaptersData = await getChapters(subject);
        setAvailableChapters(chaptersData);
        setSelectedChapters([]);
        setAvailableTopics([]);
        setSelectedTopics([]);
      } catch (error) {
        console.error('Error loading chapters:', error);
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
        const { getTopics } = await import('@/services/database');
        const topicsData = await getTopics(selectedChapters);
        setAvailableTopics(topicsData);
        setSelectedTopics([]);
      } catch (error) {
        console.error('Failed to fetch topics:', error);
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
    type: 'chapters' | 'topics',
    names: string[],
  ) => {
    if (type === 'chapters') {
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
      toast.error('অনুগ্রহ করে একটি বিষয় নির্বাচন করুন');
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        examType: examTypes.join(' + '),
        chapters: chapterNames.length > 0 ? chapterNames.join(',') : 'All',
        topics: topicNames.length > 0 ? topicNames.join(',') : 'General',
        difficulty: difficulties.join(' + '),
        questionCount,
        durationMinutes: duration,
        negativeMarking,
      });
    } catch (error: any) {
      console.error(error);
    }
  };

  const handleOmrGenerate = (details: ExamDetails, total: number) => {
    printOMRSheet(details, total);
  };

  const StartExamButton = ({ className }: { className?: string }) => (
    <div className={cn('pt-4', className)}>
      <button
        onClick={handleStartExam}
        disabled={isLoading || !subject}
        className="w-full group relative overflow-hidden bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-5 rounded-3xl shadow-lg hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        <div className="relative z-10 flex items-center justify-center gap-3">
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Cooking...</span>
            </>
          ) : (
            <>
              <span className="text-xl">পরীক্ষা শুরু করুন</span>
              <Sparkles
                size={22}
                className="group-hover:rotate-12 transition-transform"
              />
            </>
          )}
        </div>
      </button>
      <p className="text-center text-[11px] text-neutral-400 mt-4 font-bold uppercase tracking-widest">
        পরবর্তী ধাপে নির্দেশাবলী দেখানো হবে
      </p>
    </div>
  );

  return (
    <div className="w-full max-w-7xl mx-auto pb-32 px-4 md:px-6 lg:px-8 font-sans animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pt-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest">
              Exam Configuration
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-neutral-900 dark:text-white tracking-tight">
            পরীক্ষা সেটআপ করুন
          </h1>
        </div>

        <button
          onClick={() => setIsOmrConfigOpen(true)}
          className="group flex items-center gap-3 px-6 py-4 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl font-black text-neutral-700 dark:text-neutral-300 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all active:scale-95"
        >
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
            <Share2 className="w-5 h-5" />
          </div>
          <span>OMR Sheet</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Left Column: Selection (Subject & Topics) */}
        <div className="xl:col-span-8 space-y-8">
          {/* 1. Subject Selection Card */}
          <section className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 md:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm">
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
              'bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 md:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-500',
              !subject ? 'opacity-50 pointer-events-none' : 'opacity-100',
            )}
          >
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-8 flex items-center gap-3">
              অধ্যায় ও টপিক
            </h3>
            <div className="grid gap-8">
              <TopicSelector
                title="অধ্যায়"
                items={availableChapters.map((c) => c.name)}
                selectedItems={availableChapters
                  .filter((c) => selectedChapters.includes(c.id))
                  .map((c) => c.name)}
                onChange={(names) =>
                  handleTopicSelectionChange('chapters', names)
                }
                disabled={!subject}
                emptyLabel="এই বিষয়ের জন্য কোনো অধ্যায় পাওয়া যায়নি"
              />

              <TopicSelector
                title="টপিক"
                items={availableTopics.map((t) => t.name)}
                groupedItems={availableTopics.reduce(
                  (acc, topic: any) => {
                    const chapterName =
                      availableChapters.find((c) => c.id === topic.chapter_id)
                        ?.name || 'Other';
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
                  handleTopicSelectionChange('topics', names)
                }
                disabled={selectedChapters.length === 0}
                emptyLabel="আগে অধ্যায় নির্বাচন করুন"
              />
            </div>

            {selectedChapters.length > 0 && selectedTopics.length === 0 && (
              <div className="mt-8 flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-sm text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50">
                <BookOpen size={18} className="mt-0.5 shrink-0" />
                <p className="font-medium">
                  আপনি কোনো নির্দিষ্ট টপিক সিলেক্ট না করলে নির্বাচিত অধ্যায়গুলোর
                  সব টপিক থেকে প্রশ্ন আসবে।
                </p>
              </div>
            )}
          </section>
          {/* 3. Question Count Selection Card */}
          <section className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 md:p-10 border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <QuestionCountSelection
              questionCount={questionCount}
              setQuestionCount={setQuestionCount}
              noContainer
            />
          </section>
          {/* Desktop Submit Button */}
          <StartExamButton className="hidden xl:block" />
        </div>

        {/* Right Column: Settings Cards */}
        <div className="xl:col-span-4 space-y-6">
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

        {/* Mobile Submit Button */}
        <div className="xl:hidden pb-10">
          <StartExamButton />
        </div>
      </div>

      {/* Modals */}
      <OmrConfigModal
        isOpen={isOmrConfigOpen}
        onClose={() => setIsOmrConfigOpen(false)}
        onGenerate={handleOmrGenerate}
        initialSubject={
          availableSubjects.find((s) => s.id === subject)?.label || subject
        }
        subjects={availableSubjects.map((s) => ({
          id: s.id,
          name: s.label || s.name || '',
        }))}
      />

      {/* OMR Sheet is now generated and printed via printOMRSheet service */}
    </div>
  );
};

export default ExamSetupForm;
