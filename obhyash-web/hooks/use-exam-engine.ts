import { useState, useRef, useEffect, useCallback } from 'react';
import {
  AppState,
  Question,
  ExamDetails,
  UserAnswers,
  ExamResult,
  ExamConfig,
} from '@/lib/types';
import { fetchExamQuestions } from '../services/examService';
import { evaluateOMRScript } from '../services/geminiService';
import { saveExamResult } from '../services/database';

export const useExamEngine = () => {
  // --- Core State Variables ---
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set(),
  );
  const [errorDetails, setErrorDetails] = useState<string>('');

  // --- Timer State ---
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [graceTimeLeft, setGraceTimeLeft] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const timerRef = useRef<number | null>(null);

  // --- OMR State ---
  const [isOmrMode, setIsOmrMode] = useState(false);
  const [selectedScript, setSelectedScript] = useState<{
    file: File;
    base64: string;
  } | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [omrError, setOmrError] = useState<string | null>(null);

  // --- History State (Local Sync) ---
  const [examHistory, setExamHistory] = useState<ExamResult[]>([]);

  // Load initial history
  useEffect(() => {
    const stored = localStorage.getItem('obhyash_exam_history');
    if (stored) setExamHistory(JSON.parse(stored));
  }, []);

  const calculateExamStats = (
    currentQuestions: Question[],
    currentAnswers: UserAnswers,
    negativeRate: number,
  ) => {
    let rawScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let negativeMarks = 0;

    currentQuestions.forEach((q) => {
      const ua = currentAnswers[q.id];
      if (ua !== undefined) {
        if (ua === q.correctAnswerIndex) {
          rawScore += q.points ?? 0;
          correctCount++;
        } else {
          wrongCount++;
          negativeMarks += (q.points ?? 0) * negativeRate;
        }
      }
    });

    const finalScore = Math.max(0, rawScore - negativeMarks);
    return { finalScore, correctCount, wrongCount };
  };

  const startExam = async (config: ExamConfig) => {
    setErrorDetails('');
    setAppState(AppState.LOADING);
    setIsOmrMode(false);
    setSelectedScript(null);

    try {
      const generatedQuestions = await fetchExamQuestions(config);
      setQuestions(generatedQuestions);
      setExamDetails({
        subject: config.subject,
        examType: config.examType,
        chapters: config.chapters,
        topics: config.topics,
        totalQuestions: generatedQuestions.length,
        durationMinutes: config.durationMinutes,
        totalMarks: generatedQuestions.reduce(
          (acc, q) => acc + (q.points || 0),
          0,
        ),
        negativeMarking: config.negativeMarking,
      });
      setUserAnswers({});
      setFlaggedQuestions(new Set());
      setAppState(AppState.INSTRUCTIONS);
    } catch (e: unknown) {
      console.error(e);
      if (e instanceof Error) {
        setErrorDetails(e.message || 'Failed to load questions from database.');
      } else {
        setErrorDetails('Failed to load questions from database.');
      }
      setAppState(AppState.ERROR);
    }
  };

  const beginTimer = () => {
    if (examDetails) {
      setTimeLeft(examDetails.durationMinutes * 60);
      setAppState(AppState.ACTIVE);
    }
  };

  const submitExam = useCallback(
    async (manualSubmit = false) => {
      // OMR Check
      if (
        (isOmrMode || appState === AppState.GRACE_PERIOD) &&
        !selectedScript
      ) {
        if (appState === AppState.ACTIVE) {
          setAppState(AppState.GRACE_PERIOD);
          setGraceTimeLeft(300);
          return { requiresUpload: true };
        }
        if (manualSubmit && !selectedScript) {
          return { requiresUpload: true };
        }
      }

      setIsEvaluating(true);

      const duration = examDetails
        ? examDetails.durationMinutes * 60 - timeLeft
        : 0;
      setTimeTaken(duration);

      const resultId = Date.now().toString();
      const newResult: ExamResult = {
        id: resultId,
        subject: examDetails?.subject || 'Unknown',
        examType: examDetails?.examType,
        date: new Date().toISOString(),
        score: 0,
        totalMarks: examDetails?.totalMarks || 0,
        totalQuestions: questions.length,
        correctCount: 0,
        wrongCount: 0,
        timeTaken: duration,
        negativeMarking: examDetails?.negativeMarking || 0,
        questions: questions,
        // Persist Flagged Questions
        flaggedQuestions: Array.from(flaggedQuestions),
        submissionType:
          isOmrMode || appState === AppState.GRACE_PERIOD
            ? 'script'
            : 'digital',
      };

      if (newResult.submissionType === 'digital') {
        const stats = calculateExamStats(
          questions,
          userAnswers,
          examDetails?.negativeMarking || 0,
        );
        newResult.score = stats.finalScore;
        newResult.correctCount = stats.correctCount;
        newResult.wrongCount = stats.wrongCount;
        newResult.userAnswers = userAnswers;
        newResult.status = 'evaluated';
      } else {
        newResult.scriptImageData = selectedScript?.base64;
        try {
          if (selectedScript?.base64) {
            const detectedAnswers = await evaluateOMRScript(
              selectedScript.base64,
              questions,
            );
            const stats = calculateExamStats(
              questions,
              detectedAnswers,
              examDetails?.negativeMarking || 0,
            );
            newResult.userAnswers = detectedAnswers;
            newResult.score = stats.finalScore;
            newResult.correctCount = stats.correctCount;
            newResult.wrongCount = stats.wrongCount;
            newResult.status = 'evaluated';
          }
        } catch (error: unknown) {
          console.error('Auto-evaluation failed', error);
          if (error instanceof Error) {
            setOmrError(error.message);
          } else {
            setOmrError('An unknown error occurred during auto-evaluation.');
          }
          newResult.status = 'pending';
        }
      }

      // Save using central database service
      await saveExamResult(newResult);

      // Update local state
      setExamHistory((prev) => [...prev, newResult]);

      setAppState(AppState.COMPLETED);
      setIsEvaluating(false);
      return { success: true, result: newResult };
    },
    [
      isOmrMode,
      appState,
      selectedScript,
      examDetails,
      timeLeft,
      questions,
      userAnswers,
      flaggedQuestions,
    ],
  );

  useEffect(() => {
    if (appState === AppState.ACTIVE && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isOmrMode) {
              setAppState(AppState.GRACE_PERIOD);
              setGraceTimeLeft(300);
              return 0;
            } else {
              submitExam();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (appState === AppState.GRACE_PERIOD && graceTimeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setGraceTimeLeft((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appState, timeLeft, graceTimeLeft, isOmrMode, submitExam]);

  return {
    appState,
    setAppState,
    questions,
    setQuestions,
    examDetails,
    setExamDetails,
    userAnswers,
    setUserAnswers,
    flaggedQuestions,
    setFlaggedQuestions,
    timeLeft,
    setTimeLeft,
    graceTimeLeft,
    setGraceTimeLeft,
    timeTaken,
    setTimeTaken,
    isOmrMode,
    setIsOmrMode,
    selectedScript,
    setSelectedScript,
    isEvaluating,
    omrError,
    setOmrError,
    examHistory,
    setExamHistory,
    errorDetails,
    startExam,
    beginTimer,
    submitExam,
  };
};
