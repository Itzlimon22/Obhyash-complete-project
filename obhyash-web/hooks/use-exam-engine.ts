import { useState, useRef, useEffect, useCallback } from 'react';
import {
  AppState,
  Question,
  ExamDetails,
  UserAnswers,
  ExamResult,
  ExamConfig,
} from '@/lib/types';
import {
  fetchQuestions,
  initiateExamSession,
  saveExamResult,
} from '@/services/exam-service';
import { evaluateOMRScript } from '../services/gemini-service';
// import { saveExamResult } from '../services/database'; // Using direct service import now

/**
 * Core hook for the Exam Engine logic.
 * Manages the entire lifecycle of an exam:
 * - Fetching questions
 * - Timer management
 * - state transitions (IDLE -> LOADING -> INST -> ACTIVE -> SUBMITTED)
 * - Answer tracking and scoring
 * - OMR evaluation integration
 *
 * @returns An object containing all exam state and control functions.
 */
export const useExamEngine = () => {
  // --- Core State Variables ---
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<
    Set<number | string>
  >(new Set());
  const [dbSessionId, setDbSessionId] = useState<string | null>(null);
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
    const loadHistory = async () => {
      // 1. Try to load from Local Storage first (Instant)
      const stored = localStorage.getItem('obhyash_exam_history');
      if (stored) {
        setExamHistory(JSON.parse(stored));
      }

      // 2. Fetch from Database (Source of Truth) and update
      try {
        // Dynamic import to avoid circular dependency issues if any
        const { getExamHistory } = await import('@/services/database');
        const dbHistory = await getExamHistory();
        if (dbHistory && dbHistory.length > 0) {
          setExamHistory(dbHistory);
          // Update local storage to match cloud
          localStorage.setItem(
            'obhyash_exam_history',
            JSON.stringify(dbHistory),
          );
        }
      } catch (error) {
        console.error('Failed to sync history from DB:', error);
      }
    };

    loadHistory();
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

  /**
   * Initializes and starts a new exam session.
   * Fetches questions based on the provided configuration.
   *
   * @param config - Configuration for the exam (subject, topics, duration, etc.)
   */
  const startExam = async (config: ExamConfig): Promise<boolean> => {
    setErrorDetails('');
    setAppState(AppState.LOADING);
    setIsOmrMode(false);
    setSelectedScript(null);

    try {
      const generatedQuestions = await fetchQuestions(config);

      if (!generatedQuestions || generatedQuestions.length === 0) {
        setAppState(AppState.IDLE);
        throw new Error(
          'No questions found for the selected criteria. Please try different topics.',
        );
      }

      setQuestions(generatedQuestions);
      setExamDetails({
        subject: config.subject,
        subjectLabel: config.subjectLabel,
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

      // --- DB SYNC: START SESSION ---
      initiateExamSession(config, generatedQuestions).then((sid) => {
        if (sid) {
          console.log('✅ Exam Session Initiated:', sid);
          setDbSessionId(sid);
        } else {
          console.warn(
            '⚠️ Failed to initiate DB session, running in offline mode',
          );
        }
      });
      return true;
    } catch (e: unknown) {
      console.error(e);
      let msg = 'Failed to load questions from database.';
      if (e instanceof Error) {
        msg = e.message || msg;
      }

      // If it's the "No questions" error we just threw, keep state IDLE so user stays on form
      if (msg.includes('No questions found')) {
        setAppState(AppState.IDLE);
        // We re-throw so the UI component can toast/alert
        throw e;
      }

      setErrorDetails(msg);
      setAppState(AppState.ERROR);
      return false;
    }
  };

  /**
   * Starts a custom exam with a predefined set of questions (e.g., for Practice mode).
   */
  const startCustomExam = (
    customQuestions: Question[],
    customDetails: ExamDetails,
  ) => {
    setErrorDetails('');
    setAppState(AppState.LOADING);
    setIsOmrMode(false);
    setSelectedScript(null);

    try {
      setQuestions(customQuestions);
      setExamDetails(customDetails);
      setUserAnswers({});
      setFlaggedQuestions(new Set());
      setAppState(AppState.INSTRUCTIONS);
    } catch (e: unknown) {
      console.error(e);
      setErrorDetails('Failed to start custom exam.');
      setAppState(AppState.ERROR);
    }
  };

  // --- Refs for stable values in effects/callbacks ---
  const stateRef = useRef(appState);
  const timeLeftRef = useRef(timeLeft);
  const examDetailsRef = useRef(examDetails);

  useEffect(() => {
    stateRef.current = appState;
  }, [appState]);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);
  useEffect(() => {
    examDetailsRef.current = examDetails;
  }, [examDetails]);

  const beginTimer = useCallback((durationOverride?: number) => {
    const duration =
      durationOverride ||
      (examDetailsRef.current?.durationMinutes
        ? examDetailsRef.current.durationMinutes * 60
        : 0);

    if (duration > 0) {
      console.log('⏱️ [ExamEngine] Starting timer with duration:', duration);
      setTimeLeft(duration);
      setAppState(AppState.ACTIVE);
    } else {
      console.warn(
        '⚠️ [ExamEngine] Cannot start timer: No duration. Details:',
        examDetailsRef.current,
      );
    }
  }, []);

  /**
   * Submits the current exam attempt.
   * Handles both digital submission (calculating score immediately)
   * and OMR submission (triggering AI evaluation).
   *
   * @param manualSubmit - Whether this was triggered manually by the user (vs timer expiry).
   * @returns The result of the submission or a flag indicating further action needed (e.g. upload script).
   */
  const submitExam = useCallback(
    async (manualSubmit = false) => {
      // console.log(
      //   '🏁 [ExamEngine] submitExam called. Manual:',
      //   manualSubmit,
      //   'State:',
      //   stateRef.current,
      // );

      if (
        stateRef.current === AppState.COMPLETED ||
        stateRef.current === AppState.SUBMITTED
      ) {
        return { success: false, error: 'Already submitted' };
      }

      // OMR Check
      if (
        (isOmrMode || stateRef.current === AppState.GRACE_PERIOD) &&
        !selectedScript
      ) {
        if (stateRef.current === AppState.ACTIVE) {
          setAppState(AppState.GRACE_PERIOD);
          setGraceTimeLeft(300);
          return { requiresUpload: true };
        }
        if (manualSubmit && !selectedScript) {
          return { requiresUpload: true };
        }
      }

      setIsEvaluating(true);
      setErrorDetails('');

      try {
        const currentTimeLeft = timeLeftRef.current;
        const duration = examDetailsRef.current
          ? examDetailsRef.current.durationMinutes * 60 - currentTimeLeft
          : 0;
        setTimeTaken(duration);

        const resultId = dbSessionId || Date.now().toString();
        const newResult: ExamResult = {
          id: resultId,
          subject: examDetailsRef.current?.subject || 'Unknown',
          subjectLabel: examDetailsRef.current?.subjectLabel,
          examType: examDetailsRef.current?.examType,
          date: new Date().toISOString(),
          score: 0,
          totalMarks: examDetailsRef.current?.totalMarks || 0,
          totalQuestions: questions.length,
          correctCount: 0,
          wrongCount: 0,
          timeTaken: duration,
          negativeMarking: examDetailsRef.current?.negativeMarking || 0,
          questions: questions,
          // Persist Flagged Questions
          flaggedQuestions: Array.from(flaggedQuestions),
          submissionType:
            isOmrMode || stateRef.current === AppState.GRACE_PERIOD
              ? 'script'
              : 'digital',
        };

        if (newResult.submissionType === 'digital') {
          const stats = calculateExamStats(
            questions,
            userAnswers,
            examDetailsRef.current?.negativeMarking || 0,
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
                examDetailsRef.current?.negativeMarking || 0,
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
        // console.log('✅ [ExamEngine] Exam State moved to COMPLETED');
        return { success: true, result: newResult };
      } catch (error: unknown) {
        console.error('Submit Exam Failed:', error);
        let errorMsg = 'Failed to submit exam.';
        if (error instanceof Error) errorMsg = error.message;
        setErrorDetails(errorMsg);
        setAppState(AppState.ERROR);
        return { success: false, error: errorMsg };
      } finally {
        setIsEvaluating(false);
      }
    },
    [
      isOmrMode,
      selectedScript,
      questions,
      userAnswers,
      flaggedQuestions,
      dbSessionId,
    ],
  );

  // --- PERSISTENCE MANAGER ---
  const PERSISTENCE_KEY = 'obhyash_active_exam_session';
  const isHydrated = useRef(false);

  // 1. SAVE STATE: Persist exam state whenever critical data changes
  useEffect(() => {
    if (!isHydrated.current) return;

    // Only save if exam is ACTIVE or in Grace Period
    if (
      appState === AppState.ACTIVE ||
      appState === AppState.GRACE_PERIOD ||
      (appState === AppState.INSTRUCTIONS && questions.length > 0)
    ) {
      if (!examDetails) return;

      const stateToSave = {
        questions,
        examDetails,
        userAnswers,
        flaggedQuestions: Array.from(flaggedQuestions),
        dbSessionId,
        // We save the TARGET end time to calculate remaining time accurately on reload
        // storedTimeLeft is just a snapshot, but targetEndTime is absolute
        targetEndTime: Date.now() + timeLeft * 1000,
        graceTimeLeft,
        isOmrMode,
        appState,
        lastUpdated: Date.now(),
      };

      localStorage.setItem(PERSISTENCE_KEY, JSON.stringify(stateToSave));
    } else if (
      appState === AppState.COMPLETED ||
      appState === AppState.SUBMITTED ||
      appState === AppState.IDLE
    ) {
      // Clear persistence when exam is done or explicitly idle
      localStorage.removeItem(PERSISTENCE_KEY);
    }
  }, [
    questions,
    examDetails,
    userAnswers,
    flaggedQuestions,
    dbSessionId,
    timeLeft,
    graceTimeLeft,
    isOmrMode,
    appState,
  ]);

  // 2. HYDRATE STATE: Restore on Mount
  useEffect(() => {
    // Only try to restore if we are IDLE (initial load)
    if (appState === AppState.IDLE) {
      const stored = localStorage.getItem(PERSISTENCE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const now = Date.now();

          // Validate expiry (e.g. 24 hours max retention for safety)
          if (now - parsed.lastUpdated > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(PERSISTENCE_KEY);
            return;
          }

          // Calculate remaining time based on absolute target
          // If we saved targetEndTime, use it. usage: (target - now) / 1000
          let restoredTimeLeft = 0;
          if (parsed.targetEndTime) {
            restoredTimeLeft = Math.floor((parsed.targetEndTime - now) / 1000);
          } else {
            // Fallback for older saves? or just use snapshot
            // Ideally we want the timer to Keep Running while window is closed
            restoredTimeLeft = parsed.timeLeft || 0;
          }

          if (restoredTimeLeft <= 0 && parsed.appState === AppState.ACTIVE) {
            // Expired while away!
            // We should probably auto-submit or strictly show error.
            // For now, let's restore but set time to 0 so it triggers submit immediately
            console.warn('⚠️ Exam expired while away');
            restoredTimeLeft = 0;
          }

          console.log('♻️ Restoring Exam Session:', parsed);

          setQuestions(parsed.questions || []);
          setExamDetails(parsed.examDetails || null);
          setUserAnswers(parsed.userAnswers || {});
          setFlaggedQuestions(new Set(parsed.flaggedQuestions || []));
          setDbSessionId(parsed.dbSessionId || null);
          setTimeLeft(restoredTimeLeft);
          setGraceTimeLeft(parsed.graceTimeLeft || 0);
          setIsOmrMode(parsed.isOmrMode || false);

          // Restore state (Triggering UI to show ExamRunner)
          // If time is 0, the runner will see it and trigger auto-submit logic
          setAppState(parsed.appState || AppState.IDLE);
        } catch (e) {
          console.error('Failed to hydrate exam state:', e);
          localStorage.removeItem(PERSISTENCE_KEY);
        }
      }
      isHydrated.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONCE on mount

  useEffect(() => {
    if (appState === AppState.ACTIVE) {
      if (timeLeft > 0) {
        timerRef.current = window.setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              submitExam(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Immediate submit if time is already 0 (e.g. hydrated with 0 time)
        submitExam(false);
      }
    } else if (appState === AppState.GRACE_PERIOD && graceTimeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setGraceTimeLeft((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [appState, timeLeft > 0, graceTimeLeft > 0, submitExam]);

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
    startCustomExam,
    beginTimer,
    submitExam,
  };
};
