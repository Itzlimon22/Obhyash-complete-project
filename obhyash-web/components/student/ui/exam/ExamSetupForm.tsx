import React, { useState, useEffect } from 'react';
import { ExamConfig, Difficulty, ExamDetails } from '@/lib/types';
import { printQuestionPaper } from '@/services/print-service'; // Removed printOMRSheet
import { OmrPrintModal } from '@/components/student/features/omr/OmrPrintModal'; // Added

interface ExamSetupFormProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
}

interface Subject {
  id: string;
  label: string;
  icon: string;
}

// Keep this as a fallback or for Icon mapping if your DB doesn't return icons
const STATIC_SUBJECT_ICONS: Record<string, string> = {
  Physics: '⚛️',
  Chemistry: '🧪',
  Math: '📐',
  Biology: '🧬',
  Bangla: '📚',
  English: '📝',
  GK: '🌍',
  default: '📖',
};

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
  // --- New State for Database Data ---
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const [subject, setSubject] = useState('');
  const [examTypes, setExamTypes] = useState<string[]>(['Academic']);
  const [chapters, setChapters] = useState('');
  const [topics, setTopics] = useState('');

  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.Mixed);
  const [questionCount, setQuestionCount] = useState<number>(20);
  const [duration, setDuration] = useState<number>(20);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);

  // OMR Modal State
  const [isOmrModalOpen, setIsOmrModalOpen] = useState(false);
  const [omrSubject, setOmrSubject] = useState('');
  const [omrChapter, setOmrChapter] = useState('');
  const [omrTopic, setOmrTopic] = useState('');
  const [omrCount, setOmrCount] = useState(50);
  const [omrIsBlank, setOmrIsBlank] = useState(false);

  // OMR Print Modal State
  const [isOmrPrintModalOpen, setIsOmrPrintModalOpen] = useState(false);
  const [omrPrintDetails, setOmrPrintDetails] = useState<ExamDetails | null>(
    null,
  );

  // --- EFFECT: Fetch Subjects from Database ---
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

          // Transform DB data to UI format
          const formattedSubjects = subjects.map((sub: any) => ({
            id: sub.id,
            label:
              sub.name_en === 'English'
                ? 'English'
                : `${sub.name_bn || sub.name} (${sub.name || sub.name_en})`,
            icon:
              sub.icon ||
              STATIC_SUBJECT_ICONS[sub.id] ||
              STATIC_SUBJECT_ICONS.default,
            name: sub.name,
          }));

          setAvailableSubjects(formattedSubjects);
        }
      } catch (error) {
        console.error('Failed to fetch subjects from database:', error);
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchSubjects();
  }, []);

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
    // Look up from state instead of static constant
    const subjectLabel =
      availableSubjects.find((s) => s.id === subject)?.label || subject;

    if (!subject) return;

    onStartExam({
      subject: subjectLabel,
      examType: examTypes.join(' + '),
      chapters: chapters || 'All',
      topics: topics || 'General',
      difficulty,
      questionCount,
      durationMinutes: duration,
      negativeMarking,
    });
  };

  const handleOmrDownload = () => {
    const finalSubject = omrIsBlank
      ? ''
      : omrSubject || '______________________';
    const finalChapter = omrIsBlank
      ? ''
      : omrChapter || '______________________';
    const finalTopic = omrIsBlank ? '' : omrTopic || '______________________';

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
    setIsOmrModalOpen(false);
  };

  const sectionClass =
    'bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl p-5 border border-neutral-100 dark:border-neutral-800';
  const labelClass =
    'block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3';
  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-neutral-400 font-medium';

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            কাস্টম এক্সাম
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            আপনার প্রস্তুতি যাচাই করতে নিজের মতো পরীক্ষা সাজান
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOmrModalOpen(true)}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-sm"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          OMR শিট
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: Subject & Topics */}
        <div className={sectionClass}>
          <label className={labelClass}>বিষয় ও অধ্যায়</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative group md:col-span-2">
              <select
                id="subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={isFetchingData}
                className={`${inputClass} appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-wait`}
              >
                <option value="" disabled>
                  {isFetchingData
                    ? 'লোড হচ্ছে...'
                    : 'বিষয় নির্বাচন করুন (Select Subject)'}
                </option>

                {availableSubjects.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-neutral-500">
                {isFetchingData ? (
                  <svg
                    className="animate-spin h-5 w-5 text-indigo-500"
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
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    ></path>
                  </svg>
                )}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-3.5 text-neutral-400">
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
              </span>
              <input
                type="text"
                value={chapters}
                onChange={(e) => setChapters(e.target.value)}
                placeholder="অধ্যায় (Chapter Names)"
                className={`${inputClass} pl-12`}
              />
            </div>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-neutral-400">
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
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 6h.008v.008H6V6Z"
                  />
                </svg>
              </span>
              <input
                type="text"
                value={topics}
                onChange={(e) => setTopics(e.target.value)}
                placeholder="টপিক (Specific Topics)"
                className={`${inputClass} pl-12`}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Configuration */}
        <div className={sectionClass}>
          <label className={labelClass}>পরীক্ষার ধরণ ও কঠিনতা</label>
          <div className="space-y-5">
            {/* Exam Types */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {EXAM_TYPE_OPTIONS.map((type) => {
                const isSelected = examTypes.includes(type.id);
                return (
                  <div
                    key={type.id}
                    onClick={() => toggleExamType(type.id)}
                    className={`
                                    cursor-pointer text-center p-3 rounded-xl border transition-all text-xs font-bold select-none
                                    ${
                                      isSelected
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                                        : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
                                    }
                                `}
                  >
                    {type.label}
                  </div>
                );
              })}
            </div>

            {/* Difficulty Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = difficulty === opt.id;
                // Dynamic color classes based on selection state
                const activeClass =
                  opt.color === 'emerald'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : opt.color === 'amber'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      : opt.color === 'red'
                        ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-indigo-50 border-indigo-500 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400';

                return (
                  <div
                    key={opt.id}
                    onClick={() => setDifficulty(opt.id as Difficulty)}
                    className={`
                                    cursor-pointer p-4 rounded-xl border-2 text-center transition-all
                                    ${isSelected ? activeClass : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'}
                                `}
                  >
                    <span className="block font-bold text-sm">{opt.label}</span>
                    <span className="text-[10px] opacity-70 uppercase tracking-wide">
                      {opt.id}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 3: Time & Marks */}
        <div className={sectionClass}>
          <label className={labelClass}>সময় ও নম্বর বন্টন</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Count */}
            <div>
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
                প্রশ্নের সংখ্যা
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() =>
                    setQuestionCount(Math.max(5, questionCount - 5))
                  }
                  className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-l-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500"
                >
                  -
                </button>
                <input
                  type="number"
                  value={questionCount}
                  onChange={(e) =>
                    setQuestionCount(parseInt(e.target.value) || 20)
                  }
                  className="w-full text-center py-3 border-y border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuestionCount(Math.min(100, questionCount + 5))
                  }
                  className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-r-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500"
                >
                  +
                </button>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
                সময় (মিনিট)
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setDuration(Math.max(5, duration - 5))}
                  className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-l-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500"
                >
                  -
                </button>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 20)}
                  className="w-full text-center py-3 border-y border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setDuration(Math.min(180, duration + 5))}
                  className="p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-r-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500"
                >
                  +
                </button>
              </div>
            </div>

            {/* Negative Marking Segmented Control */}
            <div>
              <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 block">
                নেগেটিভ মার্কিং
              </label>
              <div className="flex bg-white dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 h-[50px]">
                {NEGATIVE_MARKING_OPTIONS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNegativeMarking(val)}
                    className={`flex-1 rounded-lg text-xs font-bold transition-all ${negativeMarking === val ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading || !subject || examTypes.length === 0}
            className="w-full bg-neutral-900 dark:bg-indigo-600 hover:bg-neutral-800 dark:hover:bg-indigo-500 disabled:bg-neutral-300 dark:disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl shadow-neutral-200 dark:shadow-none transition-all active:scale-[0.98] flex justify-center items-center gap-3 text-lg"
          >
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
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-6 h-6"
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
          </button>
        </div>
      </form>

      {/* OMR Config Modal */}
      {isOmrModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-neutral-100 dark:border-neutral-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                OMR শিট ডাউনলোড
              </h3>
              <button
                onClick={() => setIsOmrModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
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

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white">
                    ব্ল্যাঙ্ক OMR শিট
                  </div>
                  <div className="text-xs text-neutral-500">
                    তথ্য হাতে লিখে পূরণ করার জন্য
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={omrIsBlank}
                    onChange={(e) => setOmrIsBlank(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-neutral-700 peer-checked:after:tranneutral-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div
                className={`space-y-4 transition-opacity duration-200 ${omrIsBlank ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
              >
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">
                    বিষয় (Subject)
                  </label>
                  <input
                    type="text"
                    value={omrSubject}
                    onChange={(e) => setOmrSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                    placeholder="উদাঃ পদার্থবিজ্ঞান"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      অধ্যায়
                    </label>
                    <input
                      type="text"
                      value={omrChapter}
                      onChange={(e) => setOmrChapter(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                      placeholder="ঐচ্ছিক"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                      টপিক
                    </label>
                    <input
                      type="text"
                      value={omrTopic}
                      onChange={(e) => setOmrTopic(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm"
                      placeholder="ঐচ্ছিক"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  প্রশ্নের সংখ্যা (সর্বোচ্চ ১০০)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={omrCount}
                    onChange={(e) => setOmrCount(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                  />
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 w-12 text-right">
                    {omrCount}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleOmrDownload}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                >
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
                      d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
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
