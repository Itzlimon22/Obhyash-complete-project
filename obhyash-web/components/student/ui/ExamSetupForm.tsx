import React, { useState } from 'react';
import { ExamConfig, Difficulty, ExamDetails } from '@/lib/types';
import { printQuestionPaper } from '@/services/print-service'; // Removed printOMRSheet
import { OmrPrintModal } from '@/components/student/features/omr/OmrPrintModal'; // Added

interface ExamSetupFormProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
}

// ... (Constants options remain same)

const EXAM_TYPE_OPTIONS = [
  { id: 'Academic', label: 'Academic' },
  { id: 'Medical Admission', label: 'Medical Admission' },
  { id: 'Engineering Admission', label: 'Engineering Admission' },
  { id: 'Varsity Admission', label: 'Varsity Admission' },
  { id: 'Main Book', label: 'Main Book' },
  { id: 'Mixed', label: 'Mixed' },
];

const DIFFICULTY_OPTIONS = [
  { id: Difficulty.Easy, label: 'সহজ', color: 'emerald' },
  { id: Difficulty.Medium, label: 'মধ্যম', color: 'amber' },
  { id: Difficulty.Hard, label: 'কঠিন', color: 'red' },
  { id: Difficulty.Mixed, label: 'মিশ্র', color: 'indigo' },
];

const NEGATIVE_MARKING_OPTIONS = [0, 0.25, 0.5, 1.0];

const ExamSetupForm: React.FC<ExamSetupFormProps> = ({
  onStartExam,
  isLoading,
}) => {
  // Dynamic Options State
  const [subjectOptions, setSubjectOptions] = useState<any[]>([]);
  const [chapterOptions, setChapterOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [topicOptions, setTopicOptions] = useState<
    { id: string; name: string }[]
  >([]);

  const [subject, setSubject] = useState(''); // Stores ID
  const [examTypes, setExamTypes] = useState<string[]>(['Academic']);
  const [chapters, setChapters] = useState(''); // Stores ID (singular for now based on select)
  const [topics, setTopics] = useState(''); // Stores ID

  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Mixed);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [duration, setDuration] = useState<number>(20);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);

  // OMR specific options state
  const [omrSubjectOptions, setOmrSubjectOptions] = useState<any[]>([]);
  const [omrChapterOptions, setOmrChapterOptions] = useState<
    { id: string; name: string }[]
  >([]);
  const [omrTopicOptions, setOmrTopicOptions] = useState<
    { id: string; name: string }[]
  >([]);

  // OMR Config Modal State
  const [isOmrModalOpen, setIsOmrModalOpen] = useState(false);
  // OMR Print Modal State
  const [isOmrPrintModalOpen, setIsOmrPrintModalOpen] = useState(false); // New
  const [omrPrintDetails, setOmrPrintDetails] = useState<ExamDetails | null>(
    null,
  ); // New

  const [omrSubject, setOmrSubject] = useState(''); // ID
  const [omrChapter, setOmrChapter] = useState(''); // ID
  const [omrTopic, setOmrTopic] = useState(''); // ID
  const [omrCount, setOmrCount] = useState(50);
  const [omrIsBlank, setOmrIsBlank] = useState(false);

  // ... (Effects 1, 2, 3 remain same - omitted from replacement to match range?)
  // Actually I need to cover up to handleOmrDownload.

  // 1. Fetch Subjects
  React.useEffect(() => {
    const loadSubjects = async () => {
      const { getSubjects, getUserProfile } =
        await import('@/services/database');
      const user = await getUserProfile('me');
      const subjects = await getSubjects(user?.division || undefined);
      setSubjectOptions(subjects);
    };
    loadSubjects();
  }, []);

  // 2. Fetch Chapters when Subject Changes
  React.useEffect(() => {
    if (subject) {
      const loadChapters = async () => {
        const { getChapters } = await import('@/services/database');
        const chaps = await getChapters(subject); // subject is the ID
        setChapterOptions(chaps);
        setChapters(''); // Reset selection
      };
      loadChapters();
    } else {
      setChapterOptions([]);
      setChapters('');
    }
  }, [subject]);

  // 3. Fetch Topics when Chapter Changes
  React.useEffect(() => {
    if (chapters && chapters !== 'All') {
      const loadTopics = async () => {
        const { getTopics } = await import('@/services/database');
        const tops = await getTopics(chapters); // chapters is now chapterId
        setTopicOptions(tops);
        setTopics('');
      };
      loadTopics();
    } else {
      setTopicOptions([]);
      setTopics('');
    }
  }, [chapters]);

  // Load OMR Subjects when modal opens
  React.useEffect(() => {
    if (isOmrModalOpen) {
      const loadOmrSubjects = async () => {
        const { getSubjects, getUserProfile } =
          await import('@/services/database');
        const user = await getUserProfile('me');
        const subjects = await getSubjects(user?.division || undefined);
        setOmrSubjectOptions(subjects);
      };
      loadOmrSubjects();
    }
  }, [isOmrModalOpen]);

  // Load OMR Chapters
  React.useEffect(() => {
    if (omrSubject) {
      const loadChapters = async () => {
        const { getChapters } = await import('@/services/database');
        const chaps = await getChapters(omrSubject);
        setOmrChapterOptions(chaps);
        setOmrChapter('');
      };
      loadChapters();
    } else {
      setOmrChapterOptions([]);
      setOmrChapter('');
    }
  }, [omrSubject]);

  // Load OMR Topics
  React.useEffect(() => {
    if (omrChapter && omrChapter !== 'All') {
      const loadTopics = async () => {
        const { getTopics } = await import('@/services/database');
        const tops = await getTopics(omrChapter);
        setOmrTopicOptions(tops);
        setOmrTopic('');
      };
      loadTopics();
    } else {
      setOmrTopicOptions([]);
      setOmrTopic('');
    }
  }, [omrChapter]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Resolve IDs to Names for the Exam Config
    const subjectObj = subjectOptions.find((s) => s.id === subject);
    const chapterObj = chapterOptions.find((c) => c.id === chapters);
    const topicObj = topicOptions.find((t) => t.id === topics);

    const subjectLabel = subjectObj?.name || subject;
    // If 'All' or empty, pass special keyword or empty string
    const chapterLabel = chapters === '' ? 'All' : chapterObj?.name || 'All';
    const topicLabel = topics === '' ? 'General' : topicObj?.name || 'General';

    if (!subject) return;

    onStartExam({
      subject: subjectLabel,
      examType: examTypes.join(' + '),
      chapters: chapterLabel,
      topics: topicLabel,
      difficulty,
      questionCount,
      durationMinutes: duration,
      negativeMarking,
    });
  };

  // ... (omr logic unchanged)

  const handleOmrDownload = () => {
    // Resolve IDs to Names for the PDF
    const subjName =
      omrSubjectOptions.find((s) => s.id === omrSubject)?.name || '';
    const chapName =
      omrChapterOptions.find((c) => c.id === omrChapter)?.name || '';
    const topicName =
      omrTopicOptions.find((t) => t.id === omrTopic)?.name || '';

    const finalSubject = omrIsBlank ? '' : subjName || '______________________';
    const finalChapter = omrIsBlank ? '' : chapName || '______________________';
    const finalTopic = omrIsBlank ? '' : topicName || '______________________';

    const details: ExamDetails = {
      subject: finalSubject,
      examType: omrIsBlank ? '' : 'Practice Exam',
      chapters: finalChapter,
      topics: finalTopic,
      totalQuestions: omrCount,
      durationMinutes: 0,
      totalMarks: 0,
      negativeMarking: 0,
    };

    setOmrPrintDetails(details);
    setIsOmrPrintModalOpen(true);
    // don't close the config modal yet, or maybe closing it is better UX?
    // setIsOmrModalOpen(false); // Let's keep it open or close depending on preference. Closing it seems correct as we open the preview.
    setIsOmrModalOpen(false);
  };

  const sectionClass =
    'bg-white dark:bg-neutral-950 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-lg transition-all duration-300';
  const labelClass =
    'flex items-center gap-2 text-sm font-bold text-neutral-600 dark:text-neutral-300 mb-3';
  const inputContainerClass = 'relative transition-all duration-200';
  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 outline-none transition-all placeholder:text-neutral-400';

  // OMR Modal Input Class
  const modalInputClass =
    'w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all';

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-12 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 px-2">
        <div>
          <h2 className="text-3xl md:text-4xl font-black text-neutral-900 dark:text-white mb-2">
            কাস্টম এক্সাম
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-lg font-medium">
            আপনার প্রস্তুতি যাচাই করতে নিজের মতো পরীক্ষা সাজান 🚀
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOmrModalOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-2xl font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all shadow-lg shadow-neutral-200/50 dark:shadow-none hover:-translate-y-1"
        >
          <div className="p-1.5 bg-rose-100 dark:bg-rose-900/50 rounded-lg text-rose-600 dark:text-rose-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
              />
            </svg>
          </div>
          OMR শিট ডাউনলোড
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-8 space-y-8">
            {/* SECTION 1: Subject & Topics */}
            <div className={sectionClass}>
              <label className={labelClass}>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                বিষয় ও অধ্যায় নির্বাচন
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Subject Select */}
                <div className="md:col-span-2 relative group/input">
                  <label className="text-xs font-bold text-neutral-400 mb-1.5 ml-1 block">
                    বিষয় (Subject)
                  </label>
                  <div className={inputContainerClass}>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-2xl opacity-80 backdrop-grayscale transition-transform group-hover/input:scale-110 duration-300">
                        {subjectOptions.find((s) => s.id === subject)?.icon ||
                          '📚'}
                      </span>
                    </div>
                    <select
                      id="subject"
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className={`${inputClass} appearance-none cursor-pointer pl-14 hover:ring-2`}
                    >
                      <option value="" disabled>
                        বিষয় নির্বাচন করুন...{' '}
                      </option>
                      {subjectOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label || opt.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-neutral-400 group-hover/input:text-indigo-500 transition-colors">
                      <svg
                        className="w-5 h-5 transition-transform group-hover/input:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Chapter Select */}
                <div
                  className="relative group/input animate-fade-in-up"
                  style={{ animationDelay: '100ms' }}
                >
                  <label className="text-xs font-bold text-neutral-400 mb-1.5 ml-1 block">
                    অধ্যায় (Chapter)
                  </label>
                  <div className={inputContainerClass}>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                        />
                      </svg>
                    </div>
                    {chapterOptions.length > 0 ? (
                      <select
                        value={chapters}
                        onChange={(e) => setChapters(e.target.value)}
                        className={`${inputClass} appearance-none pl-12 cursor-pointer hover:ring-2`}
                      >
                        <option value="">সকল অধ্যায় (All Chapters)</option>
                        {chapterOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={chapters}
                        onChange={(e) => setChapters(e.target.value)}
                        placeholder="অধ্যায় লোড হচ্ছে..."
                        disabled={!subject}
                        className={`${inputClass} pl-12 opacity-70 cursor-not-allowed`}
                      />
                    )}
                    <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-neutral-400 group-hover/input:text-indigo-500 transition-colors">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Topic Select */}
                <div
                  className="relative group/input animate-fade-in-up"
                  style={{ animationDelay: '200ms' }}
                >
                  <label className="text-xs font-bold text-neutral-400 mb-1.5 ml-1 block">
                    টপিক (Topic)
                  </label>
                  <div className={inputContainerClass}>
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
                        />{' '}
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 6h.008v.008H6V6Z"
                        />
                      </svg>
                    </div>
                    <select
                      value={topics}
                      onChange={(e) => setTopics(e.target.value)}
                      className={`${inputClass} appearance-none pl-12 cursor-pointer hover:ring-2`}
                      disabled={!chapters || chapters === 'All'}
                    >
                      <option value="">সকল টপিক (All Topics)</option>
                      {topicOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-5 pointer-events-none text-neutral-400 group-hover/input:text-indigo-500 transition-colors">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: Configuration */}
            <div className={sectionClass}>
              <label className={labelClass}>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                পরীক্ষার সেটিংস
              </label>
              <div className="space-y-6">
                {/* Exam Types */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 mb-3 block">
                    পরীক্ষার ধরণ
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {EXAM_TYPE_OPTIONS.map((type) => {
                      const isSelected = examTypes.includes(type.id);
                      return (
                        <div
                          key={type.id}
                          onClick={() => toggleExamType(type.id)}
                          className={`
                                                    cursor-pointer text-center p-3.5 rounded-xl border-2 transition-all duration-200 text-sm font-semibold select-none
                                                    ${
                                                      isSelected
                                                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 shadow-sm'
                                                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:border-rose-300 dark:hover:border-rose-700'
                                                    }
                                                `}
                        >
                          {type.label}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Difficulty Cards */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 mb-3 block">
                    কঠিনতা স্তর
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DIFFICULTY_OPTIONS.map((opt) => {
                      const isSelected = difficulty === opt.id;
                      // Dynamic color classes based on selection state
                      const activeClass =
                        opt.color === 'emerald'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-emerald-100'
                          : opt.color === 'amber'
                            ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-amber-100'
                            : opt.color === 'red'
                              ? 'bg-red-50 border-red-500 text-red-700 shadow-red-100'
                              : 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-indigo-100';

                      return (
                        <div
                          key={opt.id}
                          onClick={() => setDifficulty(opt.id as Difficulty)}
                          className={`
                                                cursor-pointer p-4 rounded-2xl border-2 text-center transition-all duration-300 relative
                                                ${isSelected ? `${activeClass} shadow-md dark:shadow-none translate-y-[-2px]` : 'bg-white dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300 hover:shadow-lg hover:-translate-y-1'}
                                            `}
                        >
                          <span className="block font-bold text-sm">
                            {opt.label}
                          </span>
                          <span className="text-[10px] opacity-70 uppercase tracking-widest mt-1 block">
                            {opt.id}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Time & Submit */}
          <div className="lg:col-span-4 space-y-8">
            {/* SECTION 3: Time & Marks */}
            <div className={sectionClass}>
              <label className={labelClass}>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                সময় ও নম্বর
              </label>
              <div className="space-y-6">
                {/* Count */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 mb-2 block">
                    প্রশ্নের সংখ্যা
                  </label>
                  <div className="flex items-center shadow-sm rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 group hover:border-indigo-300 transition-colors">
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionCount(Math.max(5, questionCount - 5))
                      }
                      className="p-4 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 font-bold transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={questionCount}
                      onChange={(e) =>
                        setQuestionCount(parseInt(e.target.value) || 20)
                      }
                      className="w-full text-center py-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-black text-xl outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setQuestionCount(Math.min(100, questionCount + 5))
                      }
                      className="p-4 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 mb-2 block">
                    সময় (মিনিট)
                  </label>
                  <div className="flex items-center shadow-sm rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 group hover:border-indigo-300 transition-colors">
                    <button
                      type="button"
                      onClick={() => setDuration(Math.max(5, duration - 5))}
                      className="p-4 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 font-bold transition-colors"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) =>
                        setDuration(parseInt(e.target.value) || 20)
                      }
                      className="w-full text-center py-4 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-black text-xl outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setDuration(Math.min(180, duration + 5))}
                      className="p-4 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Negative Marking */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 mb-2 block">
                    নেগেটিভ মার্কিং
                  </label>
                  <div className="flex bg-neutral-100 dark:bg-neutral-800/50 p-1.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 h-[60px]">
                    {NEGATIVE_MARKING_OPTIONS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setNegativeMarking(val)}
                        className={`flex-1 rounded-xl text-xs font-bold transition-all duration-200 ${negativeMarking === val ? 'bg-white dark:bg-neutral-900 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading || !subject || examTypes.length === 0}
                className="w-full bg-gradient-to-r from-rose-600 to-red-600 dark:from-rose-600 dark:to-red-600 hover:from-rose-700 hover:to-red-700 dark:hover:from-rose-700 dark:hover:to-red-700 disabled:from-neutral-300 disabled:to-neutral-300 dark:disabled:from-neutral-800 dark:disabled:to-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex justify-center items-center gap-3 text-lg"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 -tranneutral-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-0"></div>

                <span className="relative z-10 flex items-center gap-3">
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      প্রশ্ন তৈরি হচ্ছে...
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                        className="w-6 h-6 group-hover:rotate-12 transition-transform"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.91 11.672a.375.375 0 0 1 0 .656l-5.603 3.113a.375.375 0 0 1-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112Z"
                        />
                      </svg>
                      পরীক্ষা শুরু করুন
                    </>
                  )}
                </span>
              </button>
              <p className="text-center text-xs text-neutral-400 mt-4 font-medium">
                * পরীক্ষায় অংশ নিতে লগইন আবশ্যক নয়, তবে লিডারবোর্ডের জন্য লগইন
                করুন
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* OMR Config Modal */}
      {isOmrModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-neutral-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 dark:border-neutral-800">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-500"></div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  OMR শিট ডাউনলোড
                </h3>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-medium mt-1">
                  Printable High-Precision A4 Sheet
                </p>
              </div>
              <button
                onClick={() => setIsOmrModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-neutral-900 dark:text-white text-sm">
                      ব্ল্যাঙ্ক শিট (Blank Sheet)
                    </div>
                    <div className="text-[10px] text-neutral-500 font-medium">
                      হাতে লিখে পূরণ করার জন্য
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={omrIsBlank}
                    onChange={(e) => setOmrIsBlank(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 rounded-full peer dark:bg-neutral-700 peer-checked:after:tranneutral-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {/* Dynamic Inputs */}
              <div
                className={`space-y-4 transition-all duration-300 ${omrIsBlank ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}
              >
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1.5 ml-1">
                    বিষয় (Subject)
                  </label>
                  <div className="relative">
                    <select
                      value={omrSubject}
                      onChange={(e) => setOmrSubject(e.target.value)}
                      className={modalInputClass}
                    >
                      <option value="">বিষয় নির্বাচন করুন...</option>
                      {omrSubjectOptions.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                      অধ্যায় (Chapter)
                    </label>
                    <div className="relative">
                      <select
                        value={omrChapter}
                        onChange={(e) => setOmrChapter(e.target.value)}
                        disabled={!omrSubject}
                        className={`${modalInputClass} disabled:opacity-50 cursor-pointer appearance-none`}
                      >
                        <option value="">সকল অধ্যায়</option>
                        {omrChapterOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                      টপিক (Topic)
                    </label>
                    <div className="relative">
                      <select
                        value={omrTopic}
                        onChange={(e) => setOmrTopic(e.target.value)}
                        disabled={!omrChapter || omrChapter === 'All'}
                        className={`${modalInputClass} disabled:opacity-50 cursor-pointer appearance-none`}
                      >
                        <option value="">সকল টপিক</option>
                        {omrTopicOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-4 ml-1">
                  প্রশ্নের সংখ্যা:{' '}
                  <span className="text-rose-600 dark:text-rose-400 text-lg">
                    {omrCount}
                  </span>
                </label>
                <div className="flex items-center gap-4 px-1">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={omrCount}
                    onChange={(e) => setOmrCount(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-neutral-700 accent-rose-600"
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mt-2 px-1">
                  <span>10 Questions</span>
                  <span>100 Questions</span>
                </div>
              </div>
              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleOmrDownload}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-500/30 transition-all active:scale-[0.98]"
                >
                  Confirm & Print
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
