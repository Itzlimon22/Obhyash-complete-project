import React, { useState, useMemo } from 'react';
import { Question, ExamResult, ExamDetails } from '@/lib/types';
import QuestionCard from '@/components/student/ui/exam/QuestionCard';

interface PracticeDashboardProps {
  history: ExamResult[];
  onStartPractice: (questions: Question[], details: ExamDetails) => void;
}

type Tab = 'mistakes' | 'bookmarks';

export const PracticeDashboard: React.FC<PracticeDashboardProps> = ({
  history,
  onStartPractice,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('mistakes');
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(
    new Set(),
  );

  // --- Process Data ---
  const { mistakes, bookmarks } = useMemo(() => {
    // 1. Deduplication using Maps (Already implemented in previous step, ensuring it persists)
    const mistakeMap = new Map<string, Question>();
    const bookmarkMap = new Map<string, Question>();

    history.forEach((result) => {
      // Process Mistakes
      if (result.questions && result.userAnswers) {
        result.questions.forEach((q) => {
          const userAns = result.userAnswers?.[q.id];
          if (
            userAns !== undefined &&
            userAns !== q.correctAnswerIndex &&
            q.correctAnswerIndex !== undefined
          ) {
            // Only add if not already present (Map handles this by key)
            mistakeMap.set(q.id, q);
          }
        });
      }

      // Process Bookmarks
      if (result.questions && result.flaggedQuestions) {
        result.flaggedQuestions.forEach((idx) => {
          const q = result.questions?.[idx];
          if (q) {
            bookmarkMap.set(q.id, q);
          }
        });
      }
    });

    return {
      mistakes: Array.from(mistakeMap.values()),
      bookmarks: Array.from(bookmarkMap.values()),
    };
  }, [history]);

  const currentList = activeTab === 'mistakes' ? mistakes : bookmarks;
  const currentSelection = new Set(
    [...selectedQuestions].filter((id) => currentList.some((q) => q.id === id)),
  );

  // --- Handlers ---

  const toggleSelection = (id: string) => {
    setSelectedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleStartPractice = () => {
    const questionsToPractice = currentList.filter((q) =>
      selectedQuestions.has(q.id),
    );

    if (questionsToPractice.length === 0) return;

    const details: ExamDetails = {
      subject: 'অনুশীলন',
      examType:
        activeTab === 'mistakes' ? 'Mistakes Review' : 'Bookmarks Review',
      chapters: 'Mixed',
      topics: 'Mixed',
      totalQuestions: questionsToPractice.length,
      durationMinutes: questionsToPractice.length * 2,
      totalMarks: questionsToPractice.reduce(
        (acc, q) => acc + (q.points || 1),
        0,
      ),
      negativeMarking: 0,
    };

    onStartPractice(questionsToPractice, details);
  };

  const toggleSelectAll = () => {
    if (currentSelection.size === currentList.length) {
      setSelectedQuestions((prev) => {
        const next = new Set(prev);
        currentList.forEach((q) => next.delete(q.id));
        return next;
      });
    } else {
      setSelectedQuestions((prev) => {
        const next = new Set(prev);
        currentList.forEach((q) => next.add(q.id));
        return next;
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-1">
            অনুশীলন (Practice)
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm">
            আপনার ভুল এবং বুকমার্ক করা প্রশ্নগুলো পুনরায় অনুশীলন করুন।
          </p>
        </div>

        <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl shrink-0">
          <button
            onClick={() => setActiveTab('mistakes')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'mistakes'
                ? 'bg-white dark:bg-neutral-700 text-rose-600 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
            }`}
          >
            ভুল সমূহ ({mistakes.length})
          </button>
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'bookmarks'
                ? 'bg-white dark:bg-neutral-700 text-rose-600 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
            }`}
          >
            বুকমার্ক ({bookmarks.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm min-h-[500px] flex flex-col">
        {currentList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-8 h-8 text-neutral-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
              কোনো তথ্য পাওয়া যায়নি
            </h3>
            <p className="text-neutral-500 text-sm max-w-md mb-6">
              {activeTab === 'mistakes'
                ? 'আপনি এখনো কোনো পরীক্ষায় কোনো প্রশ্ন ভুল করেননি।'
                : 'আপনি এখনো কোনো প্রশ্ন বুকমার্ক করেননি।'}
            </p>
            {/* Call to Action for Empty State */}
            <button
              onClick={() => (window.location.href = '/dashboard?tab=setup')} // Directing to mock setup
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow hover:bg-indigo-700 transition-colors"
            >
              নতুন পরীক্ষা দিন
            </button>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={
                    currentSelection.size === currentList.length &&
                    currentList.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-neutral-300 text-rose-600 focus:ring-rose-500"
                />
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {currentSelection.size} নির্বাচিত
                </span>
              </div>

              <button
                onClick={handleStartPractice}
                disabled={currentSelection.size === 0}
                className={`
                  px-6 py-2 rounded-lg text-sm font-bold transition-all transform active:scale-95
                  ${
                    currentSelection.size > 0
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 hover:bg-rose-700'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                  }
                `}
              >
                অনুশীলন শুরু করুন
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/30 dark:bg-black/20">
              {currentList.map((question) => (
                <div
                  key={question.id}
                  className={`
                    group relative bg-white dark:bg-neutral-900 border rounded-xl p-4 transition-all
                    ${
                      selectedQuestions.has(question.id)
                        ? 'border-rose-500 dark:border-rose-500 ring-1 ring-rose-500'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-rose-300 dark:hover:border-rose-700'
                    }
                  `}
                >
                  <label className="flex items-start gap-4 cursor-pointer">
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.has(question.id)}
                        onChange={() => toggleSelection(question.id)}
                        className="w-5 h-5 rounded border-neutral-300 text-rose-600 focus:ring-rose-500"
                      />
                    </div>
                    <div className="flex-1 pointer-events-none">
                      {/* Simplified View using QuestionCard read-only logic or custom render */}
                      <div className="mb-2">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          {question.subject}
                        </span>
                      </div>
                      <QuestionCard
                        question={question}
                        selectedOptionIndex={question.correctAnswerIndex} // Show correct answer visually for learning
                        isFlagged={activeTab === 'bookmarks'}
                        onSelectOption={() => {}}
                        onToggleFlag={() => {}}
                        onReport={() => {}}
                        readOnly={true}
                        showAnswer={true} // Enhance visual feedback
                      />
                      {/* Overlay to intercept clicks for selection */}
                      <div className="absolute inset-0 z-10" />
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
