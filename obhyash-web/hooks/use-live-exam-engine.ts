import { useState, useRef, useEffect, useCallback } from "react";
import { AppState, Question, ExamDetails, UserAnswers, LiveExam } from "@/lib/types";
import { startLiveExam, submitLiveExam } from "@/services/live-exam-student-service";
import { toast } from "sonner";

export const useLiveExamEngine = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examDetails, setExamDetails] = useState<ExamDetails | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number | string>>(new Set());
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [liveExam, setLiveExam] = useState<LiveExam | null>(null);
  const [errorDetails, setErrorDetails] = useState<string>("");

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [graceTimeLeft, setGraceTimeLeft] = useState<number>(0);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);
  const isSubmittingRef = useRef(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const calculateExamStats = (currentQuestions: Question[], currentAnswers: UserAnswers, negativeRate: number) => {
    let rawScore = 0;
    let correctCount = 0;
    let wrongCount = 0;
    let negativeMarks = 0;

    currentQuestions.forEach((q) => {
      const ua = currentAnswers[q.id];
      const points = q.points ?? 1;
      if (ua !== undefined) {
        const isCorrect = ua === q.correctAnswerIndex || (q.correctAnswerIndices && q.correctAnswerIndices.includes(ua));
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

  const startExam = async (exam: LiveExam, userId: string): Promise<boolean> => {
    setErrorDetails("");
    setAppState(AppState.LOADING);
    try {
      const result = await startLiveExam(exam.id, userId);
      setAttemptId(result.attemptId);
      setQuestions(result.questions);
      setLiveExam(exam);

      setExamDetails({
        subject: exam.category,
        subjectLabel: exam.title,
        examType: "live",
        chapters: "",
        topics: "",
        totalQuestions: result.questions.length,
        durationMinutes: exam.duration_minutes,
        totalMarks: result.questions.reduce((acc, q) => acc + (q.points || 1), 0),
        negativeMarking: exam.negative_marking || 0,
      });

      setUserAnswers({});
      setFlaggedQuestions(new Set());
      setAppState(AppState.INSTRUCTIONS);
      return true;
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to start live exam.";
      setErrorDetails(msg);
      setAppState(AppState.ERROR);
      toast.error(msg);
      return false;
    }
  };

  const beginTimer = useCallback(() => {
    if (!liveExam) return;
    const duration = liveExam.duration_minutes * 60;
    if (duration > 0) {
      targetEndTimeRef.current = Date.now() + duration * 1000;
      setTimeLeft(duration);
      setAppState(AppState.ACTIVE);
    }
  }, [liveExam]);

  const stateRef = useRef(appState);
  const timeLeftRef = useRef(timeLeft);
  const examDetailsRef = useRef(examDetails);
  
  useEffect(() => { stateRef.current = appState; }, [appState]);
  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { examDetailsRef.current = examDetails; }, [examDetails]);

  const submitExam = useCallback(
    async (userId: string, manualSubmit = false) => {
      if (isSubmittingRef.current) return { success: false, error: "Already submitting" };
      if (stateRef.current === AppState.COMPLETED || stateRef.current === AppState.SUBMITTED) {
        return { success: false, error: "Already submitted" };
      }
      if (!attemptId) return { success: false, error: "No attempt found" };

      isSubmittingRef.current = true;
      setIsEvaluating(true);
      setErrorDetails("");

      try {
        const duration = examDetailsRef.current ? examDetailsRef.current.durationMinutes * 60 - timeLeftRef.current : 0;
        setTimeTaken(duration);

        const stats = calculateExamStats(questions, userAnswers, examDetailsRef.current?.negativeMarking || 0);

        await submitLiveExam(attemptId, userAnswers, stats.correctCount, stats.wrongCount, stats.finalScore);

        setAppState(AppState.COMPLETED);
        toast.success("পরীক্ষা সফলভাবে জমা হয়েছে!");
        return { success: true };
      } catch (error: unknown) {
        console.error("Submit Exam Failed:", error);
        const errorMsg = error instanceof Error ? error.message : "Failed to submit exam.";
        setErrorDetails(errorMsg);
        toast.error("উত্তরপত্র জমা দিতে সমস্যা হয়েছে।", { description: errorMsg });
        return { success: false, error: errorMsg };
      } finally {
        setIsEvaluating(false);
        isSubmittingRef.current = false;
      }
    },
    [attemptId, questions, userAnswers]
  );

  useEffect(() => {
    if (appState === AppState.ACTIVE) {
      if (timeLeft > 0) {
        timerRef.current = window.setInterval(() => {
          setTimeLeft(() => {
            const remaining = targetEndTimeRef.current ? Math.max(0, Math.round((targetEndTimeRef.current - Date.now()) / 1000)) : 0;
            if (remaining <= 0) {
              // Timer expired, we don't have userId in this effect to auto-submit safely,
              // We'll rely on the parent component triggering auto-submit or just setting state to TIMEOUT
              setAppState(AppState.TIMEOUT);
              return 0;
            }
            return remaining;
          });
        }, 1000);
      } else {
        setAppState(AppState.TIMEOUT);
      }
    } else if (appState === AppState.GRACE_PERIOD && graceTimeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setGraceTimeLeft((prev) => {
          if (prev <= 1) {
            setAppState(AppState.TIMEOUT);
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
  }, [appState, timeLeft > 0, graceTimeLeft > 0]);

  return {
    appState, setAppState,
    questions,
    examDetails,
    userAnswers, setUserAnswers,
    flaggedQuestions, setFlaggedQuestions,
    timeLeft, graceTimeLeft, timeTaken,
    isEvaluating, errorDetails,
    startExam, beginTimer, submitExam
  };
};
