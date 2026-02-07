'use client';

import React, { useState, useEffect } from 'react';
import { SubjectSelector } from './SubjectSelector';
import { TopicSelector } from './TopicSelector';
import { ExamSettings } from './ExamSettings';
import { ExamConfig, Difficulty, ExamDetails } from '@/lib/types';
import { OmrPrintModal } from '@/components/student/features/omr/OmrPrintModal';
import { getSubjectMetadata, SubjectMetadata } from '@/services/database';
import { toast } from 'sonner';
import { AlertCircle, Zap, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Props for the ExamSetupContainer component.
 */
interface ExamSetupContainerProps {
  /** Callback function triggered when the user starts the exam with valid configuration. */
  onStartExam: (config: ExamConfig) => void;
  /** Loading state indicating if the exam initialization is in progress. */
  isLoading: boolean;
}

/**
 * ExamSetupContainer Component
 *
 * Orchestrates the exam configuration process. It handles:
 * - Fetching available subjects based on user profile.
 * - cascading selection logic (Subject -> Chapters -> Topics).
 * - Exam settings configuration (Type, Difficulty, Question Count, Duration, Negative Marking).
 * - OMR Sheet generation and download.
 * - Validation and submission of the exam configuration.
 *
 * @param props - {@link ExamSetupContainerProps}
 */
export const ExamSetupContainer: React.FC<ExamSetupContainerProps> = ({
  onStartExam,
  isLoading,
}) => {
  // State
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(true);

  // OMR Modal State
  const [isOmrModalOpen, setIsOmrModalOpen] = useState(false);

  // Selection
  const [subject, setSubject] = useState('');
  const [metadata, setMetadata] = useState<SubjectMetadata | null>(null);
  const [chapterOptions, setChapterOptions] = useState<string[]>([]);
  const [topicOptions, setTopicOptions] = useState<string[]>([]);

  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Settings
  const [examTypes, setExamTypes] = useState<string[]>(['Academic']);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Mixed);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [duration, setDuration] = useState<number>(20);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);

  // Error
  const [validationError, setValidationError] = useState<string | null>(null);

  // --- Effects ---
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { getUserProfile, getSubjects } =
          await import('@/services/database');
        const user = await getUserProfile('me');
        if (user) {
          const subjects = await getSubjects(
            user.division || (user as any).section,
            user.stream,
            (user as any).optional_subject,
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

  useEffect(() => {
    if (subject) {
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
      });
    } else {
      setChapterOptions([]);
      setTopicOptions([]);
    }
  }, [subject]);

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
      // Filter out selected topics that are no longer valid
      const validTopics = Array.from(aggregatedTopics);
      setSelectedTopics((prev) => prev.filter((t) => validTopics.includes(t)));
    } else {
      setTopicOptions([]);
      setSelectedTopics([]);
    }
  }, [selectedChapters, metadata]);

  // --- Handlers ---
  const toggleSelection = (
    item: string,
    list: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const handleStartExam = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const subjectLabel =
      availableSubjects.find((s) => s.id === subject)?.name || subject;

    if (!subject) {
      setValidationError('Please select a subject to continue.');
      toast.error('বিষয় নির্বাচন করুন');
      return;
    }

    onStartExam({
      subject: subjectLabel,
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

  // OMR Logic
  const handleOmrClick = () => {
    setIsOmrModalOpen(true);
  };

  const getOmrDetails = (): ExamDetails => {
    const subjectLabel = subject
      ? availableSubjects.find((s) => s.id === subject)?.name || subject
      : '______________';
    const chaptersLabel =
      selectedChapters.length > 0
        ? selectedChapters.join(', ')
        : 'All Chapters';

    return {
      subject: subjectLabel,
      examType: 'Practice Exam',
      chapters: chaptersLabel,
      topics: '',
      totalQuestions: 50,
      durationMinutes: 0,
      totalMarks: 0,
      negativeMarking: 0,
    };
  };

  return (
    <div className="w-full max-w-5xl mx-auto pb-32">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 px-1">
        <div>
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-2 tracking-tight">
            Create Custom Exam
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">
            আপনার প্রস্তুতি যাচাই করতে নিজের মত পরীক্ষা সাজান
          </p>
        </div>
        <button
          type="button"
          onClick={handleOmrClick}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold text-xs hover:border-neutral-300 transition-colors shadow-sm"
        >
          <Download size={16} />
          OMR Sheet
        </button>
      </div>

      {validationError && (
        <Alert
          variant="destructive"
          className="mb-6 mx-1 animate-in slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Attention</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      <form
        onSubmit={handleStartExam}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* Left Column: Selections */}
        <div className="lg:col-span-7 space-y-8">
          <SubjectSelector
            subjects={availableSubjects}
            selectedSubject={subject}
            onSelect={setSubject}
            isLoading={isSubjectsLoading}
          />

          <div className="space-y-6">
            <TopicSelector
              title="অধ্যায় (Chapters)"
              items={chapterOptions}
              selectedItems={selectedChapters}
              onToggle={(c) =>
                toggleSelection(c, selectedChapters, setSelectedChapters)
              }
              onSelectAll={() => setSelectedChapters([...chapterOptions])}
              onClear={() => setSelectedChapters([])}
              disabled={!subject}
              emptyLabel="No chapters loaded"
            />

            <TopicSelector
              title="টপিক (Topics)"
              items={topicOptions}
              selectedItems={selectedTopics}
              onToggle={(t) =>
                toggleSelection(t, selectedTopics, setSelectedTopics)
              }
              onSelectAll={() => setSelectedTopics([...topicOptions])}
              onClear={() => setSelectedTopics([])}
              disabled={!subject || chapterOptions.length === 0}
              emptyLabel="Select chapters to see topics"
            />
          </div>
        </div>

        {/* Right Column: Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-24">
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

            <div className="mt-8">
              <button
                type="submit"
                disabled={isLoading || !subject || examTypes.length === 0}
                className="w-full group relative overflow-hidden bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-rose-500/20 active:scale-[0.98] disabled:opacity-50 disabled:grayscale"
              >
                <div className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-current" />
                      <span className="text-base">Start Exam Now</span>
                    </>
                  )}
                </div>
              </button>
              <p className="text-center text-xs text-neutral-400 mt-3 font-medium">
                {questionCount} questions • {duration} mins •{' '}
                {negativeMarking > 0 ? `-${negativeMarking}` : 'No'} neg. marks
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* OMR Modal */}
      <OmrPrintModal
        isOpen={isOmrModalOpen}
        onClose={() => setIsOmrModalOpen(false)}
        details={getOmrDetails()}
      />
    </div>
  );
};
