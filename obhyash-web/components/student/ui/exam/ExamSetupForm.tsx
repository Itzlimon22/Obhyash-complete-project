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
import { OmrConfigModal } from '@/components/student/features/omr/OmrConfigModal';
import { OmrPrintModal } from '@/components/student/features/omr/OmrPrintModal';

interface ExamSetupFormProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
}

interface Subject {
  id: string;
  label: string;
  icon: string;
  name?: string;
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
  const [availableTopics, setAvailableTopics] = useState<Item[]>([]);
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
  const [isOmrPrintOpen, setIsOmrPrintOpen] = useState(false);
  const [omrDetails, setOmrDetails] = useState<ExamDetails | null>(null);
  const [omrTotalQuestions, setOmrTotalQuestions] = useState(50);

  // --- Data Fetching ---

  // 1. Fetch Subjects on Mount
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

          const formattedSubjects = subjects.map((sub: any) => ({
            id: sub.id,
            label:
              sub.name_en === 'English'
                ? 'English'
                : `${sub.name_bn || sub.name} (${sub.name || sub.name_en || ''})`,
            icon:
              sub.icon ||
              STATIC_SUBJECT_ICONS[sub.name_en] ||
              STATIC_SUBJECT_ICONS[sub.id] ||
              STATIC_SUBJECT_ICONS.default,
            name: sub.name,
          }));

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

  // 2. Fetch Chapters when Subject changes
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

  // 3. Fetch Topics when Chapters change
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
      if (error?.message?.includes('No questions')) {
        toast.error(
          'এই সেটিংসের জন্য পর্যাপ্ত প্রশ্ন নেই। দয়া করে অন্য অধ্যায় বা টপিক চেষ্টা করুন।',
        );
      } else {
        toast.error('পরীক্ষা শুরু করা যাচ্ছে না। আবার চেষ্টা করুন।');
      }
    }
  };

  const handleOmrGenerate = (details: ExamDetails, total: number) => {
    setOmrDetails(details);
    setOmrTotalQuestions(total);
    setIsOmrPrintOpen(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto pb-32 px-4 md:px-6 lg:px-8 font-sans animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
              Exam Setup
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
            কাস্টম এক্সাম
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-medium max-w-lg">
            আপনার প্রস্তুতি যাচাই করতে নিজের পছন্দমতো বিষয় এবং প্যারামিটার সেট
            করে পরীক্ষা দিন।
          </p>
        </div>

        <button
          onClick={() => setIsOmrConfigOpen(true)}
          className="group flex items-center gap-3 px-5 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-neutral-600 dark:text-neutral-300 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
        >
          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors">
            <Share2 className="w-4 h-4" />
          </div>
          <span>OMR শিট জেনারেটর</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Selection (Subject & Topics) */}
        <div className="lg:col-span-7 space-y-10">
          {/* 1. Subject Selection */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs">
                  1
                </div>
                বিষয় নির্বাচন
              </h3>
              {availableSubjects.length > 0 && !isFetchingData && (
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  {availableSubjects.length} টি বিষয় পাওয়া গেছে
                </span>
              )}
            </div>

            {isFetchingData ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl animate-pulse"
                  />
                ))}
              </div>
            ) : availableSubjects.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                <p className="text-neutral-500 font-medium">
                  কোনো বিষয় পাওয়া যায়নি।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {availableSubjects.map((sub) => {
                  const isSelected = subject === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSubject(sub.id)}
                      className={cn(
                        'group relative flex flex-col items-center justify-center gap-3 p-4 h-32 rounded-2xl border-2 transition-all duration-300',
                        isSelected
                          ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-500 shadow-xl shadow-rose-500/10 scale-[1.02]'
                          : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-rose-200 dark:hover:border-rose-900/50 hover:shadow-lg hover:-translate-y-1',
                      )}
                    >
                      <span className="text-4xl filter drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
                        {sub.icon}
                      </span>
                      <span
                        className={cn(
                          'text-sm font-bold text-center leading-tight max-w-[90%]',
                          isSelected
                            ? 'text-rose-700 dark:text-rose-300'
                            : 'text-neutral-600 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white',
                        )}
                      >
                        {sub.label.split('(')[0]}
                      </span>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white animate-in zoom-in">
                          <Zap size={10} fill="currentColor" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
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
                <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs">
                  2
                </div>
                অধ্যায় ও টপিক (ঐচ্ছিক)
              </h3>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl p-6 border border-neutral-100 dark:border-neutral-800 space-y-4">
              <div className="grid gap-4">
                <TopicSelector
                  title="অধ্যায় (Chapters)"
                  // We map items to strings for the selector
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
                  title="টপিক (Topics)"
                  items={availableTopics.map((t) => t.name)}
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
          </section>
        </div>

        {/* Right Column: Settings & Actions */}
        <div className="lg:col-span-5 space-y-8">
          <div className="lg:sticky lg:top-24 space-y-8">
            <section
              className={cn(
                'space-y-4 transition-all duration-500 delay-200',
                !subject
                  ? 'opacity-40 pointer-events-none grayscale'
                  : 'opacity-100',
              )}
            >
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs">
                  3
                </div>
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

                {/* Submit Area */}
                <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-b-3xl border-t border-neutral-100 dark:border-neutral-800">
                  <button
                    onClick={handleStartExam}
                    disabled={isLoading || !subject}
                    className="w-full group relative overflow-hidden bg-rose-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>প্রশ্ন তৈরি হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles
                            size={18}
                            className="group-hover:rotate-12 transition-transform"
                          />
                          <span className="text-lg">পরীক্ষা শুরু করুন</span>
                        </>
                      )}
                    </div>
                    {/* Animated Shine */}
                    {!isLoading && subject && (
                      <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
                    )}
                  </button>
                  <p className="text-center text-[10px] text-neutral-400 mt-3 font-medium">
                    পরবর্তী ধাপে নির্দেশাবলী দেখানো হবে
                  </p>
                </div>
              </div>
            </section>
          </div>
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

      {omrDetails && (
        <OmrPrintModal
          isOpen={isOmrPrintOpen}
          onClose={() => setIsOmrPrintOpen(false)}
          details={omrDetails}
          totalQuestions={omrTotalQuestions}
        />
      )}
    </div>
  );
};

export default ExamSetupForm;
