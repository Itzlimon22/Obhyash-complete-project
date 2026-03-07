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
import { cacheQuestions, getCachedQuestions } from '@/services/question-cache';
import { toast } from 'sonner';

// ─── Tiny XOR cipher for exam progress (tamper-resistance, not security) ───
// Key is mixed with the persistence key so even the same data looks different
// across different exam sessions.
const CIPHER_KEY = 'obhyash_exam_2025';

function xorCipher(input: string, key: string): string {
  return input
    .split('')
    .map((ch, i) =>
      String.fromCharCode(ch.charCodeAt(0) ^ key.charCodeAt(i % key.length)),
    )
    .join('');
}

function encryptAnswers(answers: Record<string | number, number>): string {
  return btoa(xorCipher(JSON.stringify(answers), CIPHER_KEY));
}

function decryptAnswers(encrypted: string): Record<string | number, number> {
  try {
    return JSON.parse(xorCipher(atob(encrypted), CIPHER_KEY));
  } catch {
    return {};
  }
}

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
  // Absolute epoch ms at which the exam timer expires — used to self-correct drift on each tick
  const targetEndTimeRef = useRef<number | null>(null);
  // Synchronous mutex — prevents double-submit when a user taps Submit twice rapidly.
  // useRef is intentional: it updates synchronously unlike React state.
  const isSubmittingRef = useRef(false);

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
        if (dbHistory) {
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
      const points = q.points ?? 1;
      if (ua !== undefined) {
        // Correct if answer matches singular index OR is contained in indices array
        const isCorrect =
          ua === q.correctAnswerIndex ||
          (q.correctAnswerIndices && q.correctAnswerIndices.includes(ua));

        if (isCorrect) {
          rawScore += points;
          correctCount++;
        } else {
          wrongCount++;
          negativeMarks += points * negativeRate;
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

    /** Helper: set up exam state from a question array (used by both fetch & cache paths) */
    const setupExamFromQuestions = (
      qs: Question[],
      cfg: ExamConfig,
    ): boolean => {
      setQuestions(qs);
      setExamDetails({
        subject: cfg.subject,
        subjectLabel: cfg.subjectLabel,
        examType: cfg.examType,
        chapters: cfg.chapters,
        topics: cfg.topics,
        totalQuestions: qs.length,
        durationMinutes: cfg.durationMinutes,
        totalMarks: qs.reduce((acc, q) => acc + (q.points || 1), 0),
        negativeMarking: cfg.negativeMarking,
      });
      setUserAnswers({});
      setFlaggedQuestions(new Set());
      setAppState(AppState.INSTRUCTIONS);

      // DB sync (fire and forget)
      initiateExamSession(cfg, qs).then((sid) => {
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
    };

    try {
      const generatedQuestions = await fetchQuestions(config);

      if (!generatedQuestions || generatedQuestions.length === 0) {
        // Try offline cache as fallback
        const chaptersArr =
          config.chapters && config.chapters !== 'All'
            ? config.chapters.split(',').map((c) => c.trim())
            : null;
        const cached = getCachedQuestions(config.subject, chaptersArr);
        if (cached && cached.length > 0) {
          console.log('📦 Using cached questions (offline fallback)');
          return setupExamFromQuestions(cached, config);
        }

        setAppState(AppState.IDLE);
        throw new Error(
          'No questions found for the selected criteria. Please try different topics.',
        );
      }

      // Cache for offline use
      const chaptersArr =
        config.chapters && config.chapters !== 'All'
          ? config.chapters.split(',').map((c) => c.trim())
          : null;
      cacheQuestions(config.subject, generatedQuestions, chaptersArr);

      return setupExamFromQuestions(generatedQuestions, config);
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

      // Try offline cache on network failure
      const chaptersArr =
        config.chapters && config.chapters !== 'All'
          ? config.chapters.split(',').map((c) => c.trim())
          : null;
      const cached = getCachedQuestions(config.subject, chaptersArr);
      if (cached && cached.length > 0) {
        console.log('📦 Network error — using cached questions');
        return setupExamFromQuestions(cached, config);
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
      targetEndTimeRef.current = Date.now() + duration * 1000;
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

      // stateRef is updated asynchronously (via useEffect after render), so it
      // cannot guard against two near-simultaneous clicks on its own.
      // isSubmittingRef is a synchronous mutex that closes that gap.
      if (isSubmittingRef.current) {
        return { success: false, error: 'Already submitting' };
      }
      if (
        stateRef.current === AppState.COMPLETED ||
        stateRef.current === AppState.SUBMITTED
      ) {
        return { success: false, error: 'Already submitted' };
      }
      isSubmittingRef.current = true;

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
          chapters: examDetailsRef.current?.chapters,
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
          // AI Evaluation has been disabled. Status is set to 'pending' for manual review.
          newResult.status = 'pending';
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
        isSubmittingRef.current = false;
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
        userAnswers: encryptAnswers(userAnswers), // XOR-ciphered
        flaggedQuestions: Array.from(flaggedQuestions),
        dbSessionId,
        // Absolute epoch ms timestamp — enables real timer resume across closes
        targetEndTime: Date.now() + timeLeft * 1000,
        graceTimeLeft,
        isOmrMode,
        appState,
        lastUpdated: Date.now(),
        version: 2,
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

          // Restore exam state
          console.log(
            '♻️ Restoring exam session (version:',
            parsed.version,
            ')',
          );

          // Notify user so they know the session was restored
          toast.info('পূর্বের পরীক্ষার সেশন পুনরুদ্ধার হচ্ছে...', {
            duration: 3000,
            id: 'exam-restore',
          });

          setQuestions(parsed.questions || []);
          setExamDetails(parsed.examDetails || null);
          // Decrypt answers (v2) or use raw (v1 fallback)
          const restoredAnswers =
            typeof parsed.userAnswers === 'string'
              ? decryptAnswers(parsed.userAnswers)
              : (parsed.userAnswers ?? {});
          setUserAnswers(restoredAnswers);
          setFlaggedQuestions(new Set(parsed.flaggedQuestions || []));
          setDbSessionId(parsed.dbSessionId || null);
          setTimeLeft(restoredTimeLeft);
          if (parsed.targetEndTime && restoredTimeLeft > 0) {
            // Restore absolute epoch so the live timer can self-correct drift
            targetEndTimeRef.current = parsed.targetEndTime;
          }
          setGraceTimeLeft(parsed.graceTimeLeft || 0);
          setIsOmrMode(parsed.isOmrMode || false);

          if (restoredTimeLeft <= 0 && parsed.appState === AppState.ACTIVE) {
            // Expired while away — restore state first, then submitExam will
            // fire immediately in the timer effect when it sees timeLeft=0
            console.warn('⚠️ Exam expired while away — auto-submitting');
            toast.warning(
              'পরীক্ষার সময় শেষ হয়ে গেছে। ফলাফল হিসাব করা হচ্ছে...',
              {
                duration: 4000,
              },
            );
          }

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
          setTimeLeft(() => {
            // Epoch-corrected tick: derive remaining time from the absolute target
            // instead of decrementing, eliminating drift from throttled/sleeping tabs.
            const remaining = targetEndTimeRef.current
              ? Math.max(
                  0,
                  Math.round((targetEndTimeRef.current - Date.now()) / 1000),
                )
              : 0;
            if (remaining <= 0) {
              submitExam(false);
              return 0;
            }
            return remaining;
          });
        }, 1000);
      } else {
        // Immediate submit if time is already 0 (e.g. hydrated with 0 time)
        submitExam(false);
      }
    } else if (appState === AppState.GRACE_PERIOD && graceTimeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setGraceTimeLeft((prev) => {
          if (prev <= 1) {
            submitExam(false); // Auto-submit when grace period expires
            return 0;
          }
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
