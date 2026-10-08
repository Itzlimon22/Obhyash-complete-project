'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Question, UserAnswers, ExamConfig, ExamDetails, AppState } from '@/lib/types';
import { PUBLIC_QUESTIONS } from '@/lib/data/public-mock-data';
import PublicExamSetupForm from '@/components/demo/PublicExamSetupForm';
import { ExamInstructionsView } from '@/components/student/features/exam/ExamInstructionsView';
import ExamRunner from '@/components/student/features/exam/ExamRunner';
import ResultView from '@/components/student/ui/ResultView';
import { useTheme } from '@/components/providers/ThemeProvider';
import AppInstallPromptModal from '@/components/demo/AppInstallPromptModal';

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Pick questions matching subject and chapters, fall back to pool if not enough
function getQuestionsForConfig(
  pool: Question[],
  config: ExamConfig,
  chapterNames: string[],
  count: number = 25
): Question[] {
  const subjectKey = (config.subject || '').toLowerCase();
  const subjectLabel = (config.subjectLabel || '').toLowerCase();

  // 1. Match questions by subject id, subject name, or label
  let matching = pool.filter((q) => {
    const qSubId = ((q as any).subjectId || '').toLowerCase();
    const qSubName = (q.subject || '').toLowerCase();
    const qSubLabel = (q.subjectLabel || '').toLowerCase();

    return (
      (qSubId && (qSubId === subjectKey || qSubId.includes(subjectKey))) ||
      (qSubName && (qSubName === subjectKey || qSubName.includes(subjectKey))) ||
      (qSubLabel && (qSubLabel.includes(subjectLabel) || subjectLabel.includes(qSubLabel)))
    );
  });

  // If chapter filter specified and not 'All'
  if (chapterNames.length > 0 && !chapterNames.includes('All')) {
    const chapterFiltered = matching.filter((q) =>
      chapterNames.some(
        (c) =>
          q.chapter.toLowerCase().includes(c.toLowerCase()) ||
          c.toLowerCase().includes(q.chapter.toLowerCase())
      )
    );
    if (chapterFiltered.length > 0) {
      matching = chapterFiltered;
    }
  }

  // 2. If matching count is less than requested, backfill from matching subject or pool
  if (matching.length < count) {
    const remaining = pool.filter((q) => !matching.some((m) => m.id === q.id));
    matching = [...matching, ...shuffleArray(remaining)];
  }

  return shuffleArray(matching).slice(0, Math.min(count, matching.length));
}

export default function DemoExamClient() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();

  // 4-Stage Flow: setup -> instructions -> exam -> result
  const [stage, setStage] = useState<'setup' | 'instructions' | 'exam' | 'result'>('setup');

  const [currentConfig, setCurrentConfig] = useState<ExamConfig>({
    subject: 'physics',
    subjectLabel: 'পদার্থবিজ্ঞান ১ম পত্র',
    examType: 'Academic+Board',
    chapters: 'All',
    topics: 'General',
    difficulty: 'Medium',
    questionCount: 25,
    durationMinutes: 25,
    negativeMarking: 0.25,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number | string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);

  // Freemium Gate State (Limit to 1 Free Exam)
  const [showSecondExamGate, setShowSecondExamGate] = useState<boolean>(false);

  // Handle Setup Form "Start Exam" Click -> Moves to Instructions
  const handleSetupComplete = (config: ExamConfig) => {
    // Check if user already took their 1 free demo exam
    if (typeof window !== 'undefined') {
      const completedCount = parseInt(
        localStorage.getItem('obhyash_demo_exams_completed') || '0',
        10
      );
      if (completedCount >= 1) {
        setShowSecondExamGate(true);
        return;
      }
    }

    setCurrentConfig(config);
    setStage('instructions');
  };

  // Handle Proceed from Instructions View -> Moves to Exam Runner
  const handleProceedToExam = async (): Promise<boolean> => {
    const chapterList = currentConfig.chapters
      ? currentConfig.chapters.split(',').map((c) => c.trim())
      : ['All'];

    const picked = getQuestionsForConfig(
      PUBLIC_QUESTIONS,
      currentConfig,
      chapterList,
      currentConfig.questionCount || 25
    );

    setQuestions(picked);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    const totalSec = (currentConfig.durationMinutes || 25) * 60;
    setTimeLeft(totalSec);
    setTimeTaken(0);
    setAppState(AppState.RUNNING);
    setStage('exam');
    return true;
  };

  // Handle Exam Submit -> Moves to Result View
  const handleExamSubmit = useCallback((_manual = false) => {
    const totalSec = (currentConfig.durationMinutes || 25) * 60;
    setTimeLeft((currentLeft) => {
      const spent = totalSec - currentLeft;
      setTimeTaken(Math.max(1, spent));
      return currentLeft;
    });

    // Record completion in localStorage
    if (typeof window !== 'undefined') {
      const prev = parseInt(
        localStorage.getItem('obhyash_demo_exams_completed') || '0',
        10
      );
      localStorage.setItem('obhyash_demo_exams_completed', String(prev + 1));
    }

    setStage('result');
    setAppState(AppState.COMPLETED);
  }, [currentConfig.durationMinutes]);

  // Active Countdown Timer for Exam Runner
  useEffect(() => {
    if (stage !== 'exam') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleExamSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stage, handleExamSubmit]);

  // Handle "Take Another Exam" from Result View -> Triggers Gate Modal
  const handleAttemptAnotherExam = () => {
    if (typeof window !== 'undefined') {
      const completedCount = parseInt(
        localStorage.getItem('obhyash_demo_exams_completed') || '0',
        10
      );
      if (completedCount >= 1) {
        setShowSecondExamGate(true);
        return;
      }
    }
    setStage('setup');
  };

  const examDetails: ExamDetails = useMemo(
    () => ({
      subject: currentConfig.subject,
      subjectLabel: currentConfig.subjectLabel,
      chapters: currentConfig.chapters,
      topics: currentConfig.topics,
      totalQuestions: questions.length,
      durationMinutes: currentConfig.durationMinutes,
      totalMarks: questions.length,
      negativeMarking: currentConfig.negativeMarking || 0.25,
      examType: currentConfig.examType || 'Mock Test',
    }),
    [currentConfig, questions.length]
  );

  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-[#0C0A09] text-neutral-900 dark:text-neutral-100 font-['HindSiliguri',sans-serif]">
      {/* ── 1. Setup Stage (Identical to ExamSetupForm with Class Dropdown) ── */}
      {stage === 'setup' && (
        <div className="py-6 sm:py-10 px-3 sm:px-6">
          <div className="max-w-xl mx-auto mb-4 text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white font-['Anek_Bangla',sans-serif]">
              ফ্রি ডেমো মডেল টেস্ট
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1 font-['Anek_Bangla',sans-serif]">
              লগইন ছাড়াই সরাসরি বোর্ডের মানসম্মত মডেল টেস্ট দিয়ে নিজের প্রস্তুতি যাচাই করো
            </p>
          </div>

          <PublicExamSetupForm onStartExam={handleSetupComplete} />
        </div>
      )}

      {/* ── 2. Instructions Stage (Exact ExamInstructionsView) ── */}
      {stage === 'instructions' && (
        <ExamInstructionsView
          config={currentConfig}
          onStart={handleProceedToExam}
          onBack={() => setStage('setup')}
        />
      )}

      {/* ── 3. Exam Runner Stage (Exact ExamRunner like Flutter App) ── */}
      {stage === 'exam' && (
        <ExamRunner
          appState={appState}
          examDetails={examDetails}
          questions={questions}
          userAnswers={userAnswers}
          setUserAnswers={setUserAnswers}
          flaggedQuestions={flaggedQuestions}
          setFlaggedQuestions={setFlaggedQuestions}
          timeLeft={timeLeft}
          onSubmit={handleExamSubmit}
          onExit={() => setStage('setup')}
          setAppState={setAppState}
        />
      )}

      {/* ── 4. Result Stage (Exact ResultView with Explanations & 2nd Exam Gate) ── */}
      {stage === 'result' && (
        <div className="flex flex-col min-h-screen">
          <ResultView
            questions={questions}
            userAnswers={userAnswers}
            timeTaken={timeTaken}
            onRestart={handleAttemptAnotherExam}
            isDarkMode={isDark}
            onToggleTheme={toggleTheme}
            negativeMarking={currentConfig.negativeMarking || 0.25}
            examDetails={examDetails}
            onReexam={handleAttemptAnotherExam}
          />
        </div>
      )}

      {/* ── Freemium Gate: 2nd Exam App Install Prompt ── */}
      <AppInstallPromptModal
        isOpen={showSecondExamGate}
        onClose={() => setShowSecondExamGate(false)}
        title="১ম ফ্রি ডেমো টেস্ট সম্পন্ন হয়েছে! 🏆"
        message="তুমি সফলভাবে তোমার ১ম ফ্রি টেস্ট শেষ করেছ! পরবর্তী আনলিমিটেড মডেল টেস্ট দিতে, মেধা তালিকায় নিজের বোর্ড র‍্যাঙ্ক দেখতে এবং ভুল উত্তরের অধ্যায়ভিত্তিক প্রস্তুতি নিতে এখনই প্লে স্টোর থেকে Obhyash অ্যাপ ইনস্টল করো।"
        featureBadge="আনলিমিটেড মডেল টেস্ট"
        utmContent="second_exam_gate"
      />
    </div>
  );
}
