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

import { ExamConfig, Difficulty, ExamDetails } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ExamSettings } from '@/components/student/features/exam/setup/ExamSettings';
import { TopicSelector } from '@/components/student/features/exam/setup/TopicSelector';
import { SubjectSelector } from '@/components/student/features/exam/setup/SubjectSelector'; // New Import
import { OmrConfigModal } from '@/components/student/features/omr/OmrConfigModal';
import { OmrSheet } from '@/components/student/features/omr/OmrSheet';
import Portal from '@/components/ui/portal';

interface ExamSetupFormProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
}

interface Subject {
  id: string;
  label: string;
  icon: string | React.ReactNode; // Updated to allow both
  name: string; // Added name property
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
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Mixed);
  const [questionCount, setQuestionCount] = useState<number>(25);
  const [duration, setDuration] = useState<number>(25);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);

  // --- Modals State ---
  const [isOmrConfigOpen, setIsOmrConfigOpen] = useState(false);
  // Removed isOmrPrintOpen state as we will print directly
  const [omrDetails, setOmrDetails] = useState<ExamDetails | null>(null);
  const [omrTotalQuestions, setOmrTotalQuestions] = useState(50);

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
            };
          });

          setAvailableSubjects(formattedSubjects);
        }
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
        toast.error('বিষয় তালিকা লোড করা যাচ্ছে না');
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
        console.error('Failed to fetch chapters:', error);
        toast.error('অধ্যায় লোড করা যাচ্ছে না');
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

    const subjectLabel =
      availableSubjects.find((s) => s.id === subject)?.label || subject;

    try {
      // We pass the config to parent. Parent will show instructions.
      // We are NOT calling engine.startExam here anymore in the redesigned flow (conceptually).
      // But we call props.onStartExam which is hooked to handleStartExam in StudentRoot.
      await onStartExam({
        subject,
        subjectLabel,
        examType: examTypes.join(' + '),
        chapters: selectedChapters.join(',') || 'All',
        topics: selectedTopics.join(',') || 'General',
        difficulty,
        questionCount,
        durationMinutes: duration,
        negativeMarking,
      });
    } catch (error: any) {
      // Errors handled by parent or toast
      console.error(error);
    }
  };

  const handleOmrGenerate = (details: ExamDetails, total: number) => {
    setOmrDetails(details);
    setOmrTotalQuestions(total);
    // Use setTimeout to allow state update and DOM rendering of the hidden OMR sheet before printing
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-32 px-4 md:px-6 lg:px-8 font-sans animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              পরীক্ষা সেটআপ
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            প্রশ্নপদ্ধতি নির্বাচন করুন
          </h1>
        </div>

        <button
          onClick={() => setIsOmrConfigOpen(true)}
          className="group flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-neutral-600 dark:text-neutral-300 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors">
            <Share2 className="w-4 h-4" />
          </div>
          <span>OMR শিট জেনারেটর</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Selection (Subject & Topics) - User Friendly Width */}
        <div className="lg:col-span-8 space-y-10">
          {/* 1. Subject Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                বিষয় নির্বাচন
              </h3>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
              <SubjectSelector
                subjects={availableSubjects.map((s) => ({
                  id: s.id,
                  name: s.name, // Pass the name/label
                  icon: s.icon,
                }))}
                selectedSubject={subject}
                onSelect={setSubject}
                isLoading={isFetchingData}
              />
            </div>
          </section>

          {/* 2. Topics Selection */}
          <section
            className={cn(
              'space-y-6 transition-all duration-500 delay-100',
              !subject
                ? 'opacity-40 pointer-events-none grayscale blur-[1px]'
                : 'opacity-100',
            )}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                অধ্যায় ও টপিক (ঐচ্ছিক)
              </h3>
            </div>

            <div className="bg-white dark:bg-neutral-900/50 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 space-y-4 shadow-sm">
              <div className="grid gap-4">
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
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs text-blue-700 dark:text-blue-300">
                  <BookOpen size={14} className="mt-0.5 shrink-0" />
                  <p>
                    আপনি কোনো নির্দিষ্ট টপিক সিলেক্ট না করলে নির্বাচিত
                    অধ্যায়গুলোর সব টপিক থেকে প্রশ্ন আসবে।
                  </p>
                </div>
              )}
            </div>

            {/* Submit Area - Moved/Duplicated to Left Column for better UX */}
            <div className="pt-4">
              <button
                onClick={handleStartExam}
                disabled={isLoading || !subject}
                className="w-full group relative overflow-hidden bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                <div className="relative z-10 flex items-center justify-center gap-3">
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>প্রসেস হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">নির্দেশাবলী দেখুন</span>
                      <Sparkles
                        size={18}
                        className="group-hover:rotate-12 transition-transform"
                      />
                    </>
                  )}
                </div>
              </button>
              <p className="text-center text-[10px] text-neutral-400 mt-3 font-medium">
                পরবর্তী ধাপে নির্দেশাবলী দেখানো হবে
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Settings & Actions (Sticky) */}
        <div className="lg:col-span-4 space-y-8 lg:sticky lg:top-24">
          <section
            className={cn('space-y-4 transition-all duration-500 delay-200')}
          >
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              সেটিংস ও কনফিগারেশন
            </h3>

            <div className="bg-white dark:bg-neutral-900 rounded-3xl p-1 border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-200/50 dark:shadow-none">
              <div className="p-5">
                <ExamSettings
                  examTypes={examTypes}
                  setExamTypes={setExamTypes}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  questionCount={questionCount}
                  setQuestionCount={setQuestionCount}
                  duration={duration}
                  setDuration={setDuration}
                  negativeMarking={negativeMarking}
                  setNegativeMarking={setNegativeMarking}
                />
              </div>

              {/* Submit Area Removed from Right Column */}
            </div>
          </section>
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
      />

      {/* Hidden OMR Sheet for Printing - Portal to escape parent hiding */}
      {omrDetails && (
        <Portal>
          <div className="hidden print:block fixed inset-0 z-[9999] bg-white h-screen w-screen">
            <div className="print-content">
              <OmrSheet
                details={omrDetails}
                totalQuestions={omrTotalQuestions}
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
};

export default ExamSetupForm;
