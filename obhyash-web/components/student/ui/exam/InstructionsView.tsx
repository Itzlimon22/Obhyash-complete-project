import React, { useState } from 'react';
import { ExamDetails } from '@/lib/types';

interface InstructionsViewProps {
  details: ExamDetails;
  onStart: () => void;
  onBack: () => void;
}

const InstructionsView: React.FC<InstructionsViewProps> = ({
  details,
  onStart,
  onBack,
}) => {
  const [agreed, setAgreed] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = () => {
    if (!agreed) return;
    setIsStarting(true);
    // Add a small delay to simulate processing or allow UI feedback
    setTimeout(() => {
      onStart();
    }, 200);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 transition-colors animate-fade-in">
      <div className="max-w-4xl w-full bg-white dark:bg-neutral-900 rounded-3xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-neutral-900 dark:bg-neutral-950 text-white px-6 py-8 md:px-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-48 h-48"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider mb-3 shadow-lg shadow-emerald-900/20">
              {details.examType || 'Practice Exam'}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold font-serif-exam mb-2">
              নির্দেশাবলী (Instructions)
            </h1>
            <p className="text-neutral-400 text-base md:text-lg max-w-2xl">
              পরীক্ষা শুরু করার আগে নিচের তথ্যগুলো যাচাই করো এবং নিয়মাবলী মনোযোগ
              দিয়ে পড়ো।
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 md:p-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <span className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                বিষয় (Subject)
              </span>
              <span
                className="text-base md:text-lg font-bold text-neutral-900 dark:text-white line-clamp-1"
                title={details.subject}
              >
                {details.subject}
              </span>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <span className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                সময় (Time)
              </span>
              <span className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">
                {details.durationMinutes} মিনিট
              </span>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <span className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                প্রশ্ন (Questions)
              </span>
              <span className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">
                {details.totalQuestions} টি
              </span>
            </div>
            <div className="bg-neutral-50 dark:bg-neutral-800/50 p-4 rounded-2xl border border-neutral-200 dark:border-neutral-700">
              <span className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                মার্কস (Marks)
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">
                  {details.totalMarks}
                </span>
                {details.negativeMarking > 0 && (
                  <span className="text-xs font-bold text-red-500">
                    (-{details.negativeMarking})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
              <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                অধ্যায় (Chapter)
              </span>
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {details.chapters || 'All'}
              </span>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30">
              <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                টপিক (Topic)
              </span>
              <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {details.topics || 'General'}
              </span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-neutral-800 dark:text-white mb-4 flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs">
              i
            </span>
            নিয়মাবলী (Rules):
          </h3>

          <div className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border border-neutral-100 dark:border-neutral-800 mb-8 shadow-sm">
            <ul className="space-y-4 text-neutral-700 dark:text-neutral-300 text-sm md:text-base">
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <span className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  <strong>টাইমার:</strong> &quot;পরীক্ষা শুরু করুন&quot; বাটনে
                  ক্লিক করার সাথে সাথে টাইমার শুরু হবে। সময় শেষ হলে অটোমেটিক
                  খাতা জমা হয়ে যাবে।
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <span>
                  <strong>নেগেটিভ মার্কিং:</strong> প্রতিটি ভুল উত্তরের জন্য{' '}
                  <strong>{details.negativeMarking}</strong> নম্বর কাটা যাবে। না
                  পারলে উত্তর না করাই ভালো।
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <span>
                  <strong>বুকমার্ক:</strong> কঠিন প্রশ্নগুলো পরে উত্তর দেওয়ার
                  জন্য &#39;বুকমার্ক&#39; বা ফ্ল্যাগ করে রাখতে পারবেন।
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-500 mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                <span>
                  <strong>সতর্কতা:</strong> পরীক্ষার মাঝখানে ব্রাউজার রিফ্রেশ বা
                  উইন্ডো বন্ধ করবেন না, এতে আপনার প্রোগ্রেস হারিয়ে যেতে পারে।
                </span>
              </li>
            </ul>
          </div>

          <div
            className="flex items-center gap-3 mb-8 cursor-pointer group"
            onClick={() => setAgreed(!agreed)}
          >
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${agreed ? 'bg-emerald-600 border-emerald-600' : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 group-hover:border-emerald-500'}`}
            >
              {agreed && (
                <svg
                  className="w-3.5 h-3.5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={3}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              )}
            </div>
            <span
              className={`text-sm font-medium ${agreed ? 'text-neutral-900 dark:text-white' : 'text-neutral-600 dark:text-neutral-400'}`}
            >
              আমি উপরের সব নিয়মাবলী পড়েছি এবং সম্মত আছি।
            </span>
          </div>

          <div className="flex flex-col-reverse sm:flex-row items-center gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={onBack}
              disabled={isStarting}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-base disabled:opacity-50"
            >
              বাতিল (Cancel)
            </button>
            <button
              onClick={handleStart}
              disabled={!agreed || isStarting}
              className={`
                w-full sm:w-auto flex-1 px-8 py-3.5 rounded-xl text-white font-bold transition-all shadow-lg text-center flex items-center justify-center gap-2 text-base
                ${
                  agreed && !isStarting
                    ? 'bg-emerald-700 hover:bg-emerald-800 hover:scale-[1.01] cursor-pointer shadow-emerald-500/30'
                    : 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-600 cursor-not-allowed shadow-none'
                }
              `}
            >
              {isStarting ? (
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
                  শুরু হচ্ছে...
                </>
              ) : (
                <>
                  পরীক্ষা শুরু করুন
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
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructionsView;
