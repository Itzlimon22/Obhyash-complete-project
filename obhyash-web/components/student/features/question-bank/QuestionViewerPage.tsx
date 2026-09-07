"use client";

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Question } from "@/lib/types";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import { QuestionCard } from "@/components/student/ui/exam/QuestionCard";
import {
  InstituteCardItem,
  InstituteExamSet,
} from "./InstituteDetailView";

interface QuestionViewerPageProps {
  institute: InstituteCardItem;
  examSet: InstituteExamSet;
  questions: Question[];
  onBack: () => void;
  onTakeExam?: () => void;
}

export const QuestionViewerPage: React.FC<QuestionViewerPageProps> = ({
  institute,
  examSet,
  questions,
  onBack,
}) => {
  // Map of questionId -> selectedOptionIndex
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  // Statistics
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* ── Top AppBar (Exact same structure as ExamRunner) ── */}
      <header className="sticky top-0 z-30 bg-white dark:bg-black border-b border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-3">
          {/* LEFT: Back Button + Answered/Total Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 text-xs sm:text-sm font-semibold text-neutral-600 dark:text-neutral-300">
              {BanglaNameHelper.toBanglaNumeral(answeredCount)} / {BanglaNameHelper.toBanglaNumeral(questions.length)}
            </div>
          </div>

          {/* MIDDLE: Title badge */}
          <div className="min-w-0 max-w-[50%] sm:max-w-[60%]">
            <div className="px-3 py-1 rounded-md bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs sm:text-sm font-bold text-neutral-800 dark:text-neutral-200 font-['Anek_Bangla',sans-serif] truncate text-center">
              {examSet.title}
            </div>
          </div>

          {/* RIGHT: Practice Tag */}
          <div className="shrink-0 flex items-center gap-1.5">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-['HindSiliguri',sans-serif]">
              অনুশীলন
            </span>
          </div>
        </div>
      </header>

      {/* ── Main Question List (Exact same layout as ExamRunner) ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-5 pb-28 space-y-5">
        {questions.length === 0 ? (
          <div className="text-center py-16 text-neutral-500 dark:text-neutral-400 font-['HindSiliguri',sans-serif]">
            কোনো প্রশ্ন পাওয়া যায়নি।
          </div>
        ) : (
          questions.map((q, idx) => {
            const getSubjectName = (subj?: string) => (subj && subj.trim() ? subj.trim() : "সাধারণ");
            const currentSubjectName = getSubjectName(q.subject);
            const isFirstOfSubject =
              idx === 0 || getSubjectName(questions[idx - 1].subject) !== currentSubjectName;

            const distinctSubjects = new Set(questions.map((item) => getSubjectName(item.subject)));
            const hasMultipleSubjects = distinctSubjects.size > 1;

            const subjectTotalCount = questions.filter(
              (item) => getSubjectName(item.subject) === currentSubjectName
            ).length;

            return (
              <React.Fragment key={q.id || idx}>
                {hasMultipleSubjects && isFirstOfSubject && (
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                    <span className="font-bold text-sm sm:text-base text-neutral-800 dark:text-neutral-200 font-['HindSiliguri',sans-serif]">
                      {currentSubjectName}{" "}
                      <span className="text-neutral-400 dark:text-neutral-500 font-normal">
                        ({BanglaNameHelper.toBanglaNumeral(subjectTotalCount)}টি প্রশ্ন)
                      </span>
                    </span>
                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                  </div>
                )}

                <QuestionCard
                  question={q}
                  serialNumber={idx + 1}
                  selectedOptionIndex={selectedAnswers[q.id]}
                  isFlagged={flaggedQuestions.has(q.id)}
                  showFeedback={selectedAnswers[q.id] !== undefined || !q.options || q.options.length === 0}
                  initiallyExpanded={true}
                  onSelectOption={(optIndex) => {
                    setSelectedAnswers((prev) => ({
                      ...prev,
                      [q.id]: optIndex,
                    }));
                  }}
                  hideMetadata={true}
                  onReport={() => {
                    alert('রিপোর্ট গ্রহণ করা হয়েছে। আমাদের টিম এটি পর্যালোচনা করবে।');
                  }}
                  onToggleFlag={() => {
                    setFlaggedQuestions((prev) => {
                      const next = new Set(prev);
                      if (next.has(q.id)) next.delete(q.id);
                      else next.add(q.id);
                      return next;
                    });
                  }}
                  isBookmarked={bookmarkedIds.has(q.id)}
                  onToggleBookmark={() => {
                    setBookmarkedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(q.id)) next.delete(q.id);
                      else next.add(q.id);
                      return next;
                    });
                  }}
                />
              </React.Fragment>
            );
          })
        )}
      </main>
    </div>
  );
};

export default QuestionViewerPage;
