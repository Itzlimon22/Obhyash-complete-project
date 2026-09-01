'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Question, UserAnswers, ExamConfig } from '@/lib/types';
import { DEMO_QUESTION_POOL } from '@/lib/data/demo-questions';
import { ExamInstructionsView } from '@/components/student/features/exam/ExamInstructionsView';
import ExamRunner from '@/components/student/features/exam/ExamRunner';
import ResultView from '@/components/student/ui/ResultView';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Sparkles } from 'lucide-react';

// Fisher-Yates shuffle algorithm to pick 10 random questions
function pickRandomQuestions(pool: Question[], count: number = 10): Question[] {
  const array = [...pool];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array.slice(0, count);
}

export default function DemoExamClient() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  const [stage, setStage] = useState<'instructions' | 'exam' | 'result'>(
    'instructions',
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [timeTaken, setTimeTaken] = useState<number>(0);

  // Initialize with 10 random questions from the 20 pool
  const initializeDemo = useCallback(() => {
    const picked = pickRandomQuestions(DEMO_QUESTION_POOL, 10);
    setQuestions(picked);
    setUserAnswers({});
    setTimeTaken(0);
    setStage('instructions');
  }, []);

  useEffect(() => {
    initializeDemo();
  }, [initializeDemo]);

  const examConfig: ExamConfig = useMemo(
    () => ({
      subject: 'physics',
      subjectLabel: 'ডেমো মডেল টেস্ট',
      examType: 'মডেল টেস্ট',
      chapters: 'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞান',
      topics: 'বাছাইকৃত গুরুত্বপূর্ণ MCQ প্রশ্নাবলি',
      difficulty: 'Medium',
      questionCount: 10,
      durationMinutes: 10,
      negativeMarking: 0.25,
    }),
    [],
  );

  const examDetails = useMemo(
    () => ({
      subject: 'demo',
      subjectLabel: 'ডেমো মডেল টেস্ট',
      chapters: 'পদার্থবিজ্ঞান, রসায়ন, উচ্চতর গণিত, জীববিজ্ঞান',
      topics: 'বাছাইকৃত গুরুত্বপূর্ণ MCQ প্রশ্নাবলি',
      totalQuestions: 10,
      durationMinutes: 10,
      totalMarks: 10,
      negativeMarking: 0.25,
      examType: 'Demo Practice',
    }),
    [],
  );

  const handleStartExam = async (): Promise<boolean> => {
    setStage('exam');
    return true;
  };

  const handleExamComplete = (answers: UserAnswers, time: number) => {
    setUserAnswers(answers);
    setTimeTaken(time);
    setStage('result');
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A09]">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09] text-neutral-900 dark:text-neutral-100 font-['HindSiliguri',sans-serif]">
      {/* ── 1. Instructions View ── */}
      {stage === 'instructions' && (
        <ExamInstructionsView
          config={examConfig}
          onStart={handleStartExam}
          onBack={() => router.push('/')}
        />
      )}

      {/* ── 2. Active Exam Runner View ── */}
      {stage === 'exam' && (
        <ExamRunner
          questions={questions}
          durationMinutes={10}
          negativeMarking={0.25}
          onComplete={handleExamComplete}
          onExit={() => router.push('/')}
          isDarkMode={isDark}
          toggleTheme={toggleTheme}
          examDetails={examDetails}
        />
      )}

      {/* ── 3. Result View with Sign Up Prompt ── */}
      {stage === 'result' && (
        <div className="flex flex-col min-h-screen">
          {/* Guest Demo Header Notification Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-3 text-center text-sm sm:text-base font-bold flex items-center justify-center gap-2 shadow-md">
            <Sparkles size={18} className="animate-pulse" />
            <span>
              তুমি ডেমো পরীক্ষা সম্পন্ন করেছ! পূর্ণাঙ্গ সিলেবাস ও আনলিমিটেড পরীক্ষার জন্য ফ্রি অ্যাকাউন্ট খোলো।
            </span>
            <button
              type="button"
              onClick={() => router.push('/signup')}
              className="ml-2 px-3 py-1 bg-white text-emerald-800 rounded-lg text-xs sm:text-sm font-black hover:bg-emerald-50 transition cursor-pointer"
            >
              সাইন আপ
            </button>
          </div>

          <ResultView
            questions={questions}
            userAnswers={userAnswers}
            timeTaken={timeTaken}
            onRestart={() => router.push('/')}
            isDarkMode={isDark}
            onToggleTheme={toggleTheme}
            negativeMarking={0.25}
            examDetails={examDetails}
            onReexam={initializeDemo}
          />
        </div>
      )}
    </div>
  );
}
