import React, { useState, useEffect } from 'react';
import { ExamConfig, Difficulty, ExamDetails } from '@/lib/types';
import { OmrPrintModal } from '@/components/student/features/omr/OmrPrintModal';
import { toast } from 'sonner';

interface ExamSetupFormProps {
  onStartExam: (config: ExamConfig) => void;
  isLoading: boolean;
}

interface Subject {
  id: string;
  label: string;
  icon: string;
}

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

  // Form State
  const [subject, setSubject] = useState('');
  const [activeStep, setActiveStep] = useState(1); // 1: Subject, 2: Config

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

  // --- EFFECT: Fetch Subjects ---
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
        console.error('Failed to fetch subjects:', error);
        toast.error('বিষয় লোড করা যাচ্ছে না।');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) {
      toast.error('অনুগ্রহ করে একটি বিষয় নির্বাচন করুন');
      return;
    }

    const subjectLabel =
      availableSubjects.find((s) => s.id === subject)?.label || subject;

    try {
      await onStartExam({
        subject: subject,
        subjectLabel: subjectLabel,
        examType: examTypes.join(' + '),
        chapters: chapters || 'All',
        topics: topics || 'General',
        difficulty,
        questionCount,
        durationMinutes: duration,
        negativeMarking,
      });
    } catch (error: any) {
      // Error is handled in use-exam-engine mostly, but we catch here just in case wrapper doesn't separate it
      // If onStartExam is async and throws, we can show toast here
      if (error.message && error.message.includes('No questions')) {
        toast.error(
          'এই টপিক বা অধ্যায়ের কোনো প্রশ্ন পাওয়া যায়নি। দয়া করে অন্য টপিক চেষ্টা করুন।',
        );
      } else {
        toast.error('পরীক্ষা শুরু করা যাচ্ছে না। আবার চেষ্টা করুন।');
      }
    }
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
      subjectLabel: finalSubject,
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

  return (
    <div className="w-full max-w-4xl mx-auto pb-24 px-4 md:px-0 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-neutral-900 dark:text-white mb-2">
            কাস্টম এক্সাম
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">
            আপনার প্রস্তুতি যাচাই করতে নিজের মতো পরীক্ষা সাজান
          </p>
        </div>
        <button
          onClick={() => setIsOmrModalOpen(true)}
          className="group flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-neutral-800 border-2 border-dashed border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl font-bold text-sm hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 dark:hover:border-indigo-500 transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-5 h-5 group-hover:scale-110 transition-transform"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          OMR শিট ডাউনলোড
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Subject Selection Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              বিষয় নির্বাচন করুন
            </label>
          </div>

          {isFetchingData ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-neutral-100 dark:bg-neutral-800 rounded-2xl animate-pulse"
                ></div>
              ))}
            </div>
          ) : availableSubjects.length === 0 ? (
            <div className="text-center p-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
              <p className="text-neutral-500">কোনো বিষয় খুঁজে পাওয়া যায়নি।</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {availableSubjects.map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSubject(sub.id)}
                  className={`
                                relative p-4 h-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 transition-all active:scale-95 duration-200
                                ${
                                  subject === sub.id
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-600 dark:border-indigo-400 shadow-lg shadow-indigo-100 dark:shadow-none'
                                    : 'bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                }
                            `}
                >
                  <span className="text-3xl filter drop-shadow-sm">
                    {sub.icon}
                  </span>
                  <span
                    className={`text-sm font-bold text-center leading-tight ${subject === sub.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-neutral-700 dark:text-neutral-300'}`}
                  >
                    {sub.label.split('(')[0]}
                  </span>
                  {subject === sub.id && (
                    <div className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-5 h-5"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Configuration Section (Always visible but disabled state handling) */}
        <div
          className={`space-y-8 transition-all duration-500 ${!subject ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Col: Topics */}
            <div className="space-y-6">
              <div className="bg-neutral-50 dark:bg-neutral-800/40 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4 block">
                  অধ্যায় ও টপিক (ঐচ্ছিক)
                </label>
                <div className="space-y-4">
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
                      placeholder="নির্দিষ্ট অধ্যায়ের নাম লিখুন..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-neutral-400 font-medium"
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
                      placeholder="নির্দিষ্ট টপিক লিখুন..."
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all placeholder:text-neutral-400 font-medium"
                    />
                  </div>
                  <p className="text-xs text-neutral-400 pl-1">
                    * খালি রাখলে পুরো বইয়ের ওপর পরীক্ষা হবে
                  </p>
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/40 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800">
                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4 block">
                  পরীক্ষার ধরন
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXAM_TYPE_OPTIONS.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleExamType(type.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${
                        examTypes.includes(type.id)
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-500/20'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Col: Difficulty & Time */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 shadow-sm">
                <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-4 block">
                  কঠিনতার স্তর
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDifficulty(opt.id as Difficulty)}
                      className={`
                                        p-3 rounded-xl border-2 text-center transition-all
                                        ${
                                          difficulty === opt.id
                                            ? `bg-${opt.color}-50 dark:bg-${opt.color}-900/20 border-${opt.color}-500 text-${opt.color}-700 dark:text-${opt.color}-400`
                                            : 'border-neutral-100 dark:border-neutral-800 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                        }
                                    `}
                    >
                      <span className="block font-bold text-sm">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  <label className="text-xs font-bold text-neutral-500 mb-2 block">
                    প্রশ্ন সংখ্যা
                  </label>
                  <input
                    type="number"
                    value={questionCount}
                    onChange={(e) =>
                      setQuestionCount(
                        Math.min(
                          100,
                          Math.max(5, parseInt(e.target.value) || 20),
                        ),
                      )
                    }
                    className="w-full bg-transparent text-2xl font-black text-neutral-800 dark:text-white outline-none border-b-2 border-dashed border-neutral-300 focus:border-indigo-500 transition-colors py-1"
                  />
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  <label className="text-xs font-bold text-neutral-500 mb-2 block">
                    সময় (মিনিট)
                  </label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) =>
                      setDuration(
                        Math.min(
                          180,
                          Math.max(5, parseInt(e.target.value) || 20),
                        ),
                      )
                    }
                    className="w-full bg-transparent text-2xl font-black text-neutral-800 dark:text-white outline-none border-b-2 border-dashed border-neutral-300 focus:border-indigo-500 transition-colors py-1"
                  />
                </div>
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-800/40 p-5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <label className="text-xs font-bold text-neutral-500 mb-3 block">
                  নেগেটিভ মার্কিং
                </label>
                <div className="flex bg-white dark:bg-neutral-900 p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                  {NEGATIVE_MARKING_OPTIONS.map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setNegativeMarking(val)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${negativeMarking === val ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' : 'text-neutral-400 hover:text-neutral-600'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Action Bar */}
          <div className="pt-6 sticky bottom-4 z-20">
            <button
              type="submit"
              disabled={isLoading || !subject}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-neutral-900 to-neutral-800 dark:from-indigo-600 dark:to-indigo-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-neutral-500/20 dark:shadow-indigo-500/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>প্রশ্ন তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">পরীক্ষা শুরু করুন</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </>
                )}
              </div>
              {/* Shine Effect */}
              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 group-hover:animate-shine" />
            </button>
          </div>
        </div>
      </form>

      {/* Legacy OMR Modal (Preserved Functionality) */}
      {isOmrModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-fade-in">
          {/* ... Simply reusing the content logic for OMR Modal but styled cleaner if needed. Content omitted for brevity but strictly keeping functionality ... */}
          {/* Re-implementing OMR Modal Content inline for completeness or keeping original if user wants exact same modal. Users request was "redesign form". I will keep the modal markup but slightly cleaned. */}
          <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-neutral-100 dark:border-neutral-800">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white">
                OMR শিট প্রিন্ট
              </h3>
              <button
                onClick={() => setIsOmrModalOpen(false)}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
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

            <div className="space-y-6">
              {/* Blank Option */}
              <div
                onClick={() => setOmrIsBlank(!omrIsBlank)}
                className={`cursor-pointer p-4 rounded-2xl border-2 transition-all flex items-center justify-between ${omrIsBlank ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-neutral-200 dark:border-neutral-700'}`}
              >
                <div>
                  <div className="font-bold text-neutral-900 dark:text-white">
                    ব্ল্যাঙ্ক শিট (Blank)
                  </div>
                  <div className="text-xs text-neutral-500">
                    হাতে লিখে তথ্য পূরণ করার জন্য
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${omrIsBlank ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-neutral-300'}`}
                >
                  {omrIsBlank && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>

              <div
                className={`space-y-4 transition-all ${omrIsBlank ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
              >
                <div>
                  <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">
                    বিষয়
                  </label>
                  <input
                    type="text"
                    value={omrSubject}
                    onChange={(e) => setOmrSubject(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 font-medium"
                    placeholder="উদাঃ পদার্থবিজ্ঞান"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">
                      অধ্যায়
                    </label>
                    <input
                      type="text"
                      value={omrChapter}
                      onChange={(e) => setOmrChapter(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">
                      টপিক
                    </label>
                    <input
                      type="text"
                      value={omrTopic}
                      onChange={(e) => setOmrTopic(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 font-medium"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-neutral-500 uppercase">
                    প্রশ্ন সংখ্যা
                  </label>
                  <span className="text-xs font-bold text-indigo-600">
                    {omrCount}
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={omrCount}
                  onChange={(e) => setOmrCount(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <button
                onClick={handleOmrDownload}
                className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-all mt-4"
              >
                PDF ডাউনলোড
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OMR Print Preview */}
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
