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
  const [isOmrConfigOpen, setIsOmrConfigOpen] = useState(false);
  const [omrPrintDetails, setOmrPrintDetails] = useState<ExamDetails | null>(
    null,
  );
  const [omrQuestionCount, setOmrQuestionCount] = useState(50);
  const [isOmrPrintModalOpen, setIsOmrPrintModalOpen] = useState(false);

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
      setIsSubjectsLoading(true); // Re-use loading state or add a specific one
      getSubjectMetadata(subject)
        .then((data) => {
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
          setIsSubjectsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsSubjectsLoading(false);
        });
    } else {
      setChapterOptions([]);
      setTopicOptions([]);
    }
  }, [subject]);

  useEffect(() => {
    // We already handle topic options flattening via metadata.
    // We also need grouped options.
  }, [selectedChapters, metadata]);

  // Derived grouped topics for new Selector
  const groupedTopics = React.useMemo(() => {
    if (!metadata || selectedChapters.length === 0) return {};
    const groups: Record<string, string[]> = {};
    selectedChapters.forEach((chapter) => {
      if (metadata.topics[chapter]) {
        groups[chapter] = metadata.topics[chapter];
      }
    });
    return groups;
  }, [metadata, selectedChapters]);

  // --- Handlers ---
  const handleChapterChange = (newChapters: string[]) => {
    setSelectedChapters(newChapters);
  };

  const handleTopicChange = (newTopics: string[]) => {
    setSelectedTopics(newTopics);
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
      subject: subject, // Pass the ID/Key (e.g. Physics)
      subjectLabel: subjectLabel, // Pass the Bangla Label
      examType: examTypes.join(' + '),
      chapters:
        selectedChapters.length > 0 ? selectedChapters.join(', ') : 'All',
      // If no topics selected, pass 'General' to indicate all topics (handled by fetchQuestions)
      topics: selectedTopics.length > 0 ? selectedTopics.join(', ') : 'General',
      difficulty,
      questionCount,
      durationMinutes: duration,
      negativeMarking,
    });
  };

  // ... (OMR logic remains)

  // ... (Render)

  return (
    <div className="w-full max-w-5xl mx-auto pb-32">
      {/* ... */}

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
              onChange={handleChapterChange} // NEW PROP
              disabled={!subject}
              emptyLabel="No chapters loaded"
            />

            <TopicSelector
              title="টপিক (Topics)"
              items={topicOptions} // Keep flat options for search if needed, but groupedItems takes precedence for display
              groupedItems={groupedTopics} // NEW PROP
              selectedItems={selectedTopics}
              onChange={handleTopicChange} // NEW PROP
              disabled={!subject || selectedChapters.length === 0}
              emptyLabel="Select chapters to see topics. Leave empty for All Topics."
            />
          </div>
        </div>

        {/* Right Column: Settings */}
        {/* ... */}

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
      {omrPrintDetails && (
        <OmrPrintModal
          isOpen={isOmrPrintModalOpen}
          onClose={() => setIsOmrPrintModalOpen(false)}
          details={omrPrintDetails}
          totalQuestions={omrQuestionCount}
        />
      )}
    </div>
  );
};
