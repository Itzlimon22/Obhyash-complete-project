"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { getStudentRouteUrl, getParentRoute } from "@/lib/routes";


// Types & Services
import {
  UserProfile,
  AppState,
  ExamConfig,
  ExamResult,
  Question,
  ExamDetails,
} from "@/lib/types";
import {
  downloadQuestionPaper,
  downloadResult,
  downloadResultWithExplanations,
} from "@/services/download-service";
import { updateUserProfile } from "@/services/database";
import { calculateLevel, cn } from "@/lib/utils";

import { useRouter } from "next/navigation";
import { mutate } from "swr";
import { fetchUserStreakInfo } from "@/services/streak-service";
import { getExamHistory } from "@/services/exam-service";
import { getUserProfile } from "@/services/user-service";

// Hooks
import { useExamEngine } from "@/hooks/use-exam-engine";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { getBookmarkedQuestions } from "@/services/bookmark-service";
import { useSessionMonitor } from "@/hooks/use-session-monitor";

// Components - Layout & Common
import AppLayout from "@/components/student/ui/layout/AppLayout";
import TimeoutModal from "@/components/student/ui/TimeoutModal";
import ProUpgradeModal from "@/components/common/ProUpgradeModal";
import { toast } from "sonner";
import { celebration } from "@/lib/confetti";
import StreakCelebration from "@/components/student/ui/common/StreakCelebration";

// Features
import Dashboard from "@/components/student/features/dashboard/Dashboard";
import ExamTargetModal from "@/components/student/features/dashboard/ExamTargetModal";
import {
  incrementDailyCompletions,
  addDailyMCQs,
} from "@/components/student/features/dashboard/DailyGoalCard";
import SubjectReportView from "@/components/student/features/dashboard/SubjectReportView";
import LeaderboardView from "@/components/student/features/dashboard/LeaderboardView";
import UserProfileView from "@/components/student/features/dashboard/UserProfileView";
import { ComplaintView } from "@/components/student/features/complaint/ComplaintView";
import { FeatureRequestsView } from "@/components/student/features/feature_requests/FeatureRequestsView";
import AnalysisView from "@/components/student/features/dashboard/AnalysisView";
import { PracticeDashboard } from "@/components/student/features/practice/PracticeDashboard";
import FormulaAppPromoView from "@/components/student/features/formulas/FormulaAppPromoView";
import NotificationsView from "@/components/student/features/notifications/NotificationsView";
import LegendsLeagueView from "@/components/student/ui/legends_league/LegendsLeagueView";
// Profile Features
import MyProfileView from "@/components/student/ui/profile/MyProfileView";
import SubscriptionView from "@/components/student/ui/profile/SubscriptionView";
import SettingsView from "@/components/student/ui/profile/SettingsView";
import AboutUsView from "@/components/student/ui/profile/AboutUsView";
import PrivacyPolicyView from "@/components/student/ui/profile/PrivacyPolicyView";
import TermsConditionsView from "@/components/student/ui/profile/TermsConditionsView";
import FaqPanel from "@/components/student/ui/profile/settings/FaqPanel";
import BookmarksView from "@/components/student/features/bookmarks/BookmarksView";
import { BanglaNameHelper } from "@/lib/bangla-name-helper";
import AccountInfoView from "@/components/student/ui/profile/settings/AccountInfoView";
import AccountLinkingPanel from "@/components/student/ui/profile/settings/AccountLinkingPanel";
import DeleteAccountPanel from "@/components/student/ui/profile/settings/DeleteAccountPanel";
import PersonalDetailsPanel from "@/components/student/ui/profile/settings/PersonalDetailsPanel";
import ReportsPanel from "@/components/student/ui/profile/settings/ReportsPanel";
import MySubscriptionPanel from "@/components/student/ui/profile/settings/MySubscriptionPanel";
import ReferralView from "@/components/student/features/referral/ReferralView";

// Exam Features
import { ExamSetupContainer } from "@/components/student/features/exam/setup/ExamSetupContainer";
import LiveExamView from "@/components/student/features/live-exam/LiveExamView";
import QuestionBankView, {
  SubjectCardItem,
  InstituteCardItem,
  findQuestionBankSubject,
  findQuestionBankInstitute,
} from "@/components/student/features/question-bank/QuestionBankView";
import SubjectCategoryDetailView from "@/components/student/features/question-bank/SubjectCategoryDetailView";
import AcademicCategoryDetailView from "@/components/student/features/question-bank/AcademicCategoryDetailView";
import AcademicSectionDetailView from "@/components/student/features/question-bank/AcademicSectionDetailView";
import InstituteDetailView from "@/components/student/features/question-bank/InstituteDetailView";
// import InstructionsView from '@/components/student/ui/InstructionsView'; // Deprecated in new flow
import { ExamInstructionsView } from "@/components/student/features/exam/ExamInstructionsView";
import ExamRunner from "@/components/student/features/exam/ExamRunner";

// History & Results
import ExamHistoryView from "@/components/student/features/history/ExamHistoryView";
import ResultView from "@/components/student/ui/ResultView";
import ResultSkeleton from "@/components/student/ui/results/ResultSkeleton";
import ExamLoadingSkeleton from "@/components/student/ui/exam/ExamLoadingSkeleton";
import { X } from "lucide-react";

interface StudentRootProps {
  user: UserProfile;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onLogout: () => void;
  subjects?: { id: string; name: string; [key: string]: unknown }[];
  initialHistory?: ExamResult[];
  initialTab?: string;
}

import { useAuth } from "@/components/auth/AuthProvider";
import { isUserPro } from "@/lib/subscription-utils";
import InitialLoader from "@/components/student/ui/InitialLoader";

export default function StudentRoot({
  user: initialUser,
  theme,
  toggleTheme,
  onLogout,
  subjects = [],
  initialHistory = [],
  initialTab = "dashboard",
}: StudentRootProps) {
  const router = useRouter();
  const {
    user: authUser,
    profile: authProfile,
    loading: authLoading,
    signOut: authSignOut,
  } = useAuth();

  // Use authProfile if available, otherwise fall back to initialUser
  const effectiveUser = authProfile || initialUser;
  const engine = useExamEngine(effectiveUser?.id, initialHistory);

  // Multi-device session monitor - keeps the Supabase Realtime connection warm
  useSessionMonitor({
    userId: effectiveUser?.id,
    onForcedSignOut: authSignOut,
  });

  // Device session limiting (Netflix-style) - DISABLED
  // const deviceSession = useDeviceSession(effectiveUser?.id);

  const {
    appState,
    setAppState,
    questions,
    examDetails,
    userAnswers,
    setUserAnswers,
    flaggedQuestions,
    setFlaggedQuestions,
    timeLeft,
    graceTimeLeft,
    timeTaken,
    isEvaluating,
    examHistory,
    setExamHistory,
    errorDetails,
    startExam,
    beginTimer,
    submitExam,
    setQuestions,
    setExamDetails,
    setTimeTaken,
    startCustomExam,
  } = engine;

  // Store the last ExamConfig so we can reattempt without type mismatch
  const lastExamConfigRef = useRef<ExamConfig | null>(null);

  // Modified: Sets up the instructions view instead of starting immediately
  const handleStartExam = useCallback(
    async (config: ExamConfig) => {
      lastExamConfigRef.current = config;
      setPendingConfig(config);
      setAppState(AppState.INSTRUCTIONS);
      setActiveTab("exam");
      sessionStorage.setItem("obhyash_active_tab", "exam");
      if (typeof window !== "undefined") {
        window.history.pushState({ tab: "exam" }, "", "/exam/active");
      }
    },
    [setAppState],
  );

  const handleProceedToExam = async () => {
    if (!pendingConfig) return false;

    try {
      // 1. Fetch Questions
      const success = await startExam(pendingConfig);

      // 2. If success, Auto-Start Timer
      if (success && pendingConfig) {
        const safeDuration =
          pendingConfig.durationMinutes && pendingConfig.durationMinutes > 0
            ? pendingConfig.durationMinutes
            : 25;
        beginTimer(safeDuration * 60);
      } else if (!success) {
        // This usually falls into AppState.ERROR, but engine might throw specifically
        toast.error(
          "দুঃখিত, কোনো প্রশ্ন পাওয়া যায়নি। অন্য টপিক নির্বাচন করো।",
          {
            description: "No questions found for the selected criteria.",
          },
        );
      }

      return success;
    } catch (e: unknown) {
      console.error("Exam start failed", e);
      const errorMessage =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: string }).message)
          : "Unknown error starting exam";
      const isNoQuestions = errorMessage.includes("No questions found");

      toast.error(
        isNoQuestions
          ? "দুঃখিত, কোনো প্রশ্ন পাওয়া যায়নি। অন্য টপিক নির্বাচন করো।"
          : "পরীক্ষা শুরু করতে সমস্যা হয়েছে। আবার চেষ্টা করো।",
        {
          description: errorMessage,
        },
      );
      return false;
    }
  };

  // Global User State
  // Valid tabs matching our Next.js root routes
  const validTabs = [
    "dashboard",
    "setup",
    "live_exam",
    "live-exam",
    "question_bank",
    "question-bank",
    "history",
    "history_result",
    "practice",
    "leaderboard",
    "user_profile",
    "analysis",
    "subject_report",
    "complaint",
    "feature-requests",
    "notifications",
    "about",
    "subscription",
    "my-subscription",
    "profile",
    "settings",
    "exam",
    "legends-league",
    "legends_league",
    "formulas",
    "bookmarks",
    "referral",
    "upgrade",
    "info",
    "account-info",
    "account-linking",
    "delete-account",
    "personal",
    "edit-profile",
    "privacy",
    "terms",
    "faq",
    "help",
    "reports",
  ];

  const resolvePathToTab = useCallback((rawPath: string): string => {
    const path = rawPath.replace(/^\//, "").split("?")[0].split("#")[0];
    if (!path || path === "dashboard") return "dashboard";
    if (path.startsWith("leaderboard/user/") || path.startsWith("leaderboard/user-profile/")) return "user_profile";
    if (path.startsWith("history/") && path !== "history") return "history_result";
    if (path.startsWith("exam/")) return "exam";
    if (path === "live-exam" || path === "live_exam") return "live_exam";
    if (path === "question-bank" || path === "question_bank") return "question_bank";
    if (path === "legends-league" || path === "legends_league") return "legends-league";
    if (path === "account-info" || path === "info") return "account-info";
    if (path === "personal" || path === "edit-profile") return "personal";
    if (path === "my-subscription") return "my-subscription";
    if (validTabs.includes(path)) return path;
    return "dashboard";
  }, []);

  const [activeTab, setActiveTab] = useState(() => {
    if (initialTab && initialTab !== "dashboard") return resolvePathToTab(initialTab);
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      const resolved = resolvePathToTab(pathname);
      if (resolved !== "dashboard" || pathname === "/" || pathname === "/dashboard") {
        return resolved;
      }
      return sessionStorage.getItem("obhyash_active_tab") || "dashboard";
    }
    return initialTab || "dashboard";
  });

  // IDs parsed from the initial URL (for deep-link restoration)
  const [initialDeepUserId] = useState(() => {
    if (typeof window === "undefined") return null;
    const m = window.location.pathname.match(/^\/leaderboard\/(?:user|user-profile)\/(.+)$/);
    return m ? m[1] : null;
  });
  const [initialDeepExamId] = useState(() => {
    if (typeof window === "undefined") return null;
    const m = window.location.pathname.match(/^\/history\/([\w-]+)$/);
    return m ? m[1] : null;
  });

  // Local state to track user updates (XP, level) that happen during session
  // Initialize with the most reliable source
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    effectiveUser,
  );

  // Pending Config for Pre-Fetch Instructions
  const [pendingConfig, setPendingConfig] = useState<ExamConfig | null>(null);
  const [questionBankTab, setQuestionBankTab] = useState<"institution" | "subject">("institution");
  const [selectedQuestionBankSubject, setSelectedQuestionBankSubject] = useState<SubjectCardItem | null>(null);
  const [selectedQuestionBankCategory, setSelectedQuestionBankCategory] = useState<string | null>(null);
  const [selectedQuestionBankSection, setSelectedQuestionBankSection] = useState<{
    id: string;
    title: string;
    subtitle: string;
    gradient?: string;
    svgIcon?: string;
    count?: number;
  } | null>(null);
  const [selectedQuestionBankInstitute, setSelectedQuestionBankInstitute] = useState<InstituteCardItem | null>(null);
  const [historyTab, setHistoryTab] = useState<"exams" | "questions">("exams");
  const [practiceTab, setPracticeTab] = useState<"mistakes" | "bookmarks">("mistakes");

  const activeUserId = authProfile?.id || currentUser?.id || initialUser?.id;
  const isPro = isUserPro(currentUser || effectiveUser);

  const [showProBookmarkModal, setShowProBookmarkModal] = useState(false);
  const [showProPdfModal, setShowProPdfModal] = useState(false);

  // PDF weekly download quota helpers (free users: max 3 per week)
  const FREE_WEEKLY_PDF_LIMIT = 3;
  const getPdfWeeklyCount = (): { count: number; weekKey: string } => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7
    );
    const weekKey = `${now.getFullYear()}-W${weekNum}`;
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(`obhyash_pdf_dl_${weekKey}`)
        : null;
    return { count: stored ? parseInt(stored, 10) : 0, weekKey };
  };
  const incrementPdfWeeklyCount = () => {
    const { count, weekKey } = getPdfWeeklyCount();
    localStorage.setItem(`obhyash_pdf_dl_${weekKey}`, String(count + 1));
  };

  const handleBookmarkLimitReached = useCallback(() => {
    if (appState === AppState.ACTIVE) {
      toast.error(
        "বুকমার্ক লিমিট শেষ! ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন সংরক্ষণ করা যাবে। পরীক্ষা শেষে প্রো সাবস্ক্রিপশন আপগ্রেড করো।",
        { duration: 4000 }
      );
    } else {
      setShowProBookmarkModal(true);
    }
  }, [appState]);

  const {
    bookmarkedIds,
    isBookmarked,
    toggle: toggleBookmark,
    isLoading: isBookmarksLoading,
    refetch: refetchBookmarkIds,
  } = useBookmarks(
    activeUserId,
    authLoading,
    isPro,
    handleBookmarkLimitReached,
  );

  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Question[] | undefined>(undefined);
  
  useEffect(() => {
    if (!currentUser?.id || authLoading || isBookmarksLoading || activeTab !== "bookmarks") return;
    
    // Optimistically remove any questions that are no longer in bookmarkedIds
    setBookmarkedQuestions((prev) => {
      if (!prev) return prev;
      const filtered = prev.filter((q) => bookmarkedIds.has(String(q.id)));
      return filtered.length !== prev.length ? filtered : prev;
    });

    let ignore = false;

    // Fetch latest from DB to capture any additions
    getBookmarkedQuestions(currentUser.id).then((fetchedQs) => {
      if (ignore) return;
      setBookmarkedQuestions(fetchedQs.filter((q) => bookmarkedIds.has(String(q.id))));
    });

    return () => {
      ignore = true;
    };
  }, [currentUser?.id, authLoading, isBookmarksLoading, bookmarkedIds.size, activeTab]);

  // Streak Celebration State
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [newStreakCount, setNewStreakCount] = useState(0);

  // Exam Target Modal + Daily Goal
  const [showTargetModal, setShowTargetModal] = useState(false);
  const hasCheckedExamTarget = useRef(false);

  // Sync with AuthProvider updates
  useEffect(() => {
    if (authProfile) {
      setCurrentUser(authProfile);
    } else if (initialUser && !currentUser) {
      setCurrentUser(initialUser);
    }
  }, [authProfile, initialUser]);

  // Deep-link restore: /history/[examId] → open that exam result
  const deepLinkRestored = useRef(false);
  useEffect(() => {
    if (deepLinkRestored.current || !initialDeepExamId) return;

    // 1. Try local history cache first
    const res = examHistory.find((e) => e.id === initialDeepExamId);
    if (res) {
      deepLinkRestored.current = true;
      setQuestions(res.questions || []);
      setUserAnswers(res.userAnswers || {});
      setFlaggedQuestions(new Set(res.flaggedQuestions || []));
      setExamDetails({
        subject: res.subject,
        subjectLabel: res.subjectLabel || res.subject,
        examType: res.examType || "",
        chapters: res.chapters || "",
        topics: "",
        totalQuestions: res.totalQuestions,
        durationMinutes: 0,
        totalMarks: res.totalMarks,
        negativeMarking: res.negativeMarking,
      });
      setTimeTaken(res.timeTaken);
      setIsReviewingHistory(true);
      setAppState(AppState.COMPLETED);
      return;
    }

    // 2. Fetch directly from DB if not in local memory yet
    if (activeUserId || !authLoading) {
      import("@/services/exam-service").then(async ({ getExamResultById }) => {
        try {
          const fetched = await getExamResultById(initialDeepExamId, activeUserId);
          if (fetched) {
            deepLinkRestored.current = true;
            setQuestions(fetched.questions || []);
            setUserAnswers(fetched.userAnswers || {});
            setFlaggedQuestions(new Set(fetched.flaggedQuestions || []));
            setExamDetails({
              subject: fetched.subject,
              subjectLabel: fetched.subjectLabel || fetched.subject,
              examType: fetched.examType || "",
              chapters: fetched.chapters || "",
              topics: "",
              totalQuestions: fetched.totalQuestions,
              durationMinutes: 0,
              totalMarks: fetched.totalMarks,
              negativeMarking: fetched.negativeMarking,
            });
            setTimeTaken(fetched.timeTaken);
            setIsReviewingHistory(true);
            setAppState(AppState.COMPLETED);
          }
        } catch (err) {
          console.error("Failed to load deep exam history:", err);
        }
      });
    }
  }, [initialDeepExamId, examHistory, activeUserId, authLoading]);

  // Deep-link restore: /leaderboard/user/[userId] → fetch + open that user profile
  const deepLinkUserRestored = useRef(false);
  useEffect(() => {
    if (deepLinkUserRestored.current || !initialDeepUserId || authLoading) return;
    deepLinkUserRestored.current = true;
    import("@/services/database").then(async ({ getUserProfile }) => {
      const user = await getUserProfile(initialDeepUserId);
      if (user) {
        setSelectedUserProfile(user);
        setSelectedUserRank(0);
        setActiveTab("user_profile");
      } else {
        // Profile not found — fall back to leaderboard
        handleTabChange("leaderboard");
      }
    });
  }, [initialDeepUserId, authLoading]);

  // Show exam target modal once per session if not set
  useEffect(() => {
    if (!authLoading && currentUser && !hasCheckedExamTarget.current) {
      hasCheckedExamTarget.current = true;
      if (!currentUser.exam_target) {
        setShowTargetModal(true);
      }
    }
  }, [authLoading, currentUser?.id]);

  // Streak System Check - Loads unified production streak info from DB
  useEffect(() => {
    let isMounted = true;
    const targetUserId = currentUser?.id || effectiveUser?.id;
    if (!targetUserId) return;

    const handleStreakAndHistory = async () => {
      try {
        const streakInfo = await fetchUserStreakInfo(targetUserId);
        
        if (isMounted && streakInfo.currentStreak !== (currentUser?.streakCount || 0)) {
          setCurrentUser((prev) =>
            prev ? { ...prev, streakCount: streakInfo.currentStreak, streak: streakInfo.currentStreak } : prev,
          );
        }

        // Fetch History
        const dbHistory = await getExamHistory(targetUserId);
        if (dbHistory && dbHistory.length > 0 && isMounted) {
          setExamHistory(dbHistory);
        }
      } catch (err) {
        console.error("Error in streak/history sync:", err);
      }
    };

    handleStreakAndHistory();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, effectiveUser?.id]);

  // Resume detection: check for unfinished exam on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("obhyash_exam_draft");
      if (!raw) return;

      const draft = JSON.parse(raw);
      const age = Date.now() - (draft.savedAt || 0);
      const THREE_HOURS = 3 * 60 * 60 * 1000;

      if (age > THREE_HOURS) {
        localStorage.removeItem("obhyash_exam_draft");
        return;
      }

      // How many questions were answered?
      const answeredCount = Object.keys(draft.userAnswers || {}).length;
      const totalCount = (draft.questions || []).length;

      toast.info(
        `আপনার একটি অসম্পন্ন পরীক্ষা আছে (${answeredCount}/${totalCount} উত্তর দেওয়া)`,
        {
          duration: 15000,
          action: {
            label: "↩ চালিয়ে যাও",
            onClick: () => {
              try {
                setQuestions(draft.questions || []);
                setExamDetails(draft.examDetails || null);
                setUserAnswers(draft.userAnswers || {});
                setFlaggedQuestions(new Set(draft.flaggedQuestions || []));
                if (draft.pendingConfig) {
                  setPendingConfig(draft.pendingConfig);
                }
                // Resume with remaining time
                const remainingTime = Math.max(draft.timeLeft || 60, 60); // at least 1 min
                beginTimer(remainingTime);
                toast.success("পরীক্ষা পুনরুদ্ধার হয়েছে!");
              } catch {
                toast.error("পরীক্ষা পুনরুদ্ধার করতে ব্যর্থ");
                localStorage.removeItem("obhyash_exam_draft");
              }
            },
          },
        },
      );
    } catch {
      localStorage.removeItem("obhyash_exam_draft");
    }
  }, []);

  // Wrong answer retry handler
  const handleRetryWrongAnswers = useCallback(
    (wrongQuestions: import("@/lib/types").Question[]) => {
      setQuestions(wrongQuestions);
      setUserAnswers({});
      setFlaggedQuestions(new Set());
      beginTimer(wrongQuestions.length * 60); // 1 min per question
    },
    [setQuestions, setUserAnswers, setFlaggedQuestions, beginTimer],
  );

  // Navigation State
  const [isReviewingHistory, setIsReviewingHistory] = useState(false);
  const [selectedSubjectReport, setSelectedSubjectReport] = useState<
    string | null
  >(null);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [selectedUserRank, setSelectedUserRank] = useState<number>(0);
  const [navWarning, setNavWarning] = useState<{
    isOpen: boolean;
    targetTab: string | null;
    action: "tab" | "logout";
  }>({ isOpen: false, targetTab: null, action: "tab" });
  const [isTimeoutModalOpen, setIsTimeoutModalOpen] = useState(false);

  // Exam Completion Logic
  const handleExamComplete = async (result: ExamResult) => {
    if (!currentUser) return;

    // XP Logic:
    // 1. Correct Answer: +10 XP per question
    // 2. Completion Bonus: +50 XP
    // 3. Perfect Score Bonus: +100 XP
    const correctXp = result.correctCount * 10;
    const completionXp = 50;
    const isPerfect =
      result.correctCount === result.totalQuestions &&
      result.totalQuestions > 0;
    const perfectXp = isPerfect ? 100 : 0;

    const totalXpGained = correctXp + completionXp + perfectXp;

    const oldLevel = currentUser.level;
    const oldXp = currentUser.xp || 0;
    const newXpOralValue = oldXp + totalXpGained;
    const newLevel = calculateLevel(newXpOralValue);

    const updatedUser = {
      ...currentUser,
      xp: (currentUser.xp || 0) + totalXpGained,
      examsTaken: (currentUser.examsTaken || 0) + 1,
      level: newLevel,
    };

    setCurrentUser(updatedUser);
    await updateUserProfile(updatedUser);

    // Update daily completions
    incrementDailyCompletions(currentUser.id);
    addDailyMCQs(currentUser.id, result.totalQuestions);

    // Sync Streak from database
    try {
      const { fetchUserStreakInfo } = await import("@/services/streak-service");
      const streakInfo = await fetchUserStreakInfo(currentUser.id);
      if (streakInfo.currentStreak > 0) {
        const prevStreak = currentUser.streakCount || 0;
        setCurrentUser((prev) =>
          prev ? { ...prev, streakCount: streakInfo.currentStreak, streak: streakInfo.currentStreak } : prev,
        );
        if (streakInfo.currentStreak > prevStreak || (prevStreak === 0 && streakInfo.currentStreak === 1)) {
          setNewStreakCount(streakInfo.currentStreak);
          setShowStreakCelebration(true);
        }
      }
    } catch (e) {
      console.warn("Streak sync after exam completion failed:", e);
    }

    // Provide feedback & Celebrations
    if (newLevel !== oldLevel) {
      celebration.levelUp();
      toast.success(`অভিনন্দন! তুমি ${newLevel}-এ উন্নীত হয়েছেন!`, {
        description: `আপনার বর্তমান XP: ${updatedUser.xp}`,
        duration: 8000,
      });
    } else if (isPerfect) {
      toast.success("অসাধারন! তুমি পারফেক্ট স্কোর করেছেন।", {
        description: `আপনি +${totalXpGained} XP অর্জন করেছেন! (বোনাস সহ)`,
      });
    } else {
      toast.success("পরীক্ষা সম্পন্ন হয়েছে!", {
        description: `আপনি +${totalXpGained} XP অর্জন করেছেন।`,
      });
    }
  };

  useEffect(() => {
    if (appState === AppState.COMPLETED && !isReviewingHistory) {
      const latestResult = examHistory[examHistory.length - 1];
      if (latestResult && currentUser) {
        handleExamComplete(latestResult);
        
        // Give the live result view a shareable URL so it doesn't vanish on refresh
        if (latestResult.id) {
          window.history.replaceState(
            { tab: "history_result", examId: latestResult.id },
            "",
            `/history/${latestResult.id}`
          );
        }
      }
    }
  }, [appState]);

  // Auto-save exam progress to localStorage for crash recovery
  useEffect(() => {
    if (
      (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) &&
      questions.length > 0
    ) {
      const draft = {
        userAnswers,
        flaggedQuestions: Array.from(flaggedQuestions),
        questions,
        examDetails,
        timeLeft,
        pendingConfig,
        savedAt: Date.now(),
      };
      localStorage.setItem("obhyash_exam_draft", JSON.stringify(draft));
    }
  }, [userAnswers, flaggedQuestions, appState]);

  // Clear draft when exam completes or goes back to idle
  useEffect(() => {
    if (appState === AppState.COMPLETED || appState === AppState.IDLE) {
      localStorage.removeItem("obhyash_exam_draft");
    }
  }, [appState]);

  // Handle Profile Updates
  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    if (!currentUser) return;
    const newUser = { ...currentUser, ...updatedData };
    // Optimistically update local state so the UI reflects changes immediately
    setCurrentUser(newUser);

    const result = await updateUserProfile(newUser);

    if (!result.success) {
      // Revert the optimistic update so the UI doesn't show stale data
      setCurrentUser(currentUser);
      // Throw so the awaiting handleSubmit in PersonalDetailsPanel catches it
      throw new Error(result.error || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।');
    }
  };


  // Session navigation history stack to distinguish in-app clicks from direct landing
  const navHistoryRef = useRef<string[]>([initialTab || "dashboard"]);

  const canGoBackInSession = useCallback(() => {
    if (typeof window === "undefined") return false;
    const idx = window.history.state?.idx;
    if (typeof idx === "number" && idx > 0) return true;
    return navHistoryRef.current.length > 1;
  }, []);

  const restoreExamHistoryResult = useCallback((examId: string) => {
    const res = examHistory.find((e) => e.id === examId);
    if (res) {
      setQuestions(res.questions || []);
      setUserAnswers(res.userAnswers || {});
      setFlaggedQuestions(new Set(res.flaggedQuestions || []));
      setExamDetails({
        subject: res.subject,
        subjectLabel: res.subjectLabel || res.subject,
        examType: res.examType || "",
        chapters: res.chapters || "",
        topics: "",
        totalQuestions: res.totalQuestions,
        durationMinutes: 0,
        totalMarks: res.totalMarks,
        negativeMarking: res.negativeMarking,
      });
      setTimeTaken(res.timeTaken);
      setIsReviewingHistory(true);
      setAppState(AppState.COMPLETED);
    } else {
      import("@/services/exam-service").then(async ({ getExamResultById }) => {
        try {
          const fetched = await getExamResultById(examId, activeUserId);
          if (fetched) {
            setQuestions(fetched.questions || []);
            setUserAnswers(fetched.userAnswers || {});
            setFlaggedQuestions(new Set(fetched.flaggedQuestions || []));
            setExamDetails({
              subject: fetched.subject,
              subjectLabel: fetched.subjectLabel || fetched.subject,
              examType: fetched.examType || "",
              chapters: fetched.chapters || "",
              topics: "",
              totalQuestions: fetched.totalQuestions,
              durationMinutes: 0,
              totalMarks: fetched.totalMarks,
              negativeMarking: fetched.negativeMarking,
            });
            setTimeTaken(fetched.timeTaken);
            setIsReviewingHistory(true);
            setAppState(AppState.COMPLETED);
          }
        } catch (err) {
          console.error("Failed to load deep exam history:", err);
        }
      });
    }
  }, [examHistory, activeUserId]);

  const handleSelectQuestionBankSubject = useCallback((subj: SubjectCardItem | null) => {
    setSelectedQuestionBankSubject(subj);
    setSelectedQuestionBankCategory(null);
    setSelectedQuestionBankSection(null);
    if (subj && typeof window !== "undefined") {
      const currentIdx = (window.history.state?.idx as number) ?? 0;
      window.history.pushState(
        { tab: "question_bank", qbView: "subject", subjectId: subj.id, idx: currentIdx + 1 },
        "",
        `/question-bank?subject=${encodeURIComponent(subj.id)}`
      );
    }
  }, []);

  const handleSelectQuestionBankCategory = useCallback((catId: string | null) => {
    setSelectedQuestionBankCategory(catId);
    if (catId && selectedQuestionBankSubject && typeof window !== "undefined") {
      const currentIdx = (window.history.state?.idx as number) ?? 0;
      window.history.pushState(
        { tab: "question_bank", qbView: "category", subjectId: selectedQuestionBankSubject.id, category: catId, idx: currentIdx + 1 },
        "",
        `/question-bank?subject=${encodeURIComponent(selectedQuestionBankSubject.id)}&category=${encodeURIComponent(catId)}`
      );
    }
  }, [selectedQuestionBankSubject]);

  const handleSelectQuestionBankInstitute = useCallback((inst: InstituteCardItem | null) => {
    setSelectedQuestionBankInstitute(inst);
    if (inst && typeof window !== "undefined") {
      const currentIdx = (window.history.state?.idx as number) ?? 0;
      window.history.pushState(
        { tab: "question_bank", qbView: "institute", instituteId: inst.id, idx: currentIdx + 1 },
        "",
        `/question-bank?institute=${encodeURIComponent(inst.id)}`
      );
    }
  }, []);

  const handleTabChange = useCallback((tab: string, replace = false) => {
    if (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) {
      setNavWarning({ isOpen: true, targetTab: tab, action: "tab" });
      return;
    }

    if (appState === AppState.COMPLETED) {
      setAppState(AppState.IDLE);
      setIsReviewingHistory(false);
    }

    if (tab === "question_bank" || tab === "question-bank") {
      if (activeTab === tab) {
        setSelectedQuestionBankSubject(null);
        setSelectedQuestionBankCategory(null);
        setSelectedQuestionBankSection(null);
        setSelectedQuestionBankInstitute(null);
      }
    } else {
      setSelectedQuestionBankSubject(null);
      setSelectedQuestionBankCategory(null);
      setSelectedQuestionBankSection(null);
      setSelectedQuestionBankInstitute(null);
    }

    setActiveTab(tab);
    sessionStorage.setItem("obhyash_active_tab", tab);

    // Track internal history stack
    if (replace) {
      if (navHistoryRef.current.length > 0) {
        navHistoryRef.current[navHistoryRef.current.length - 1] = tab;
      } else {
        navHistoryRef.current.push(tab);
      }
    } else {
      navHistoryRef.current.push(tab);
    }

    // Reset page scroll position to top instantly
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
      const mainContent = document.querySelector("main") || document.getElementById("main-scroll-container");
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: "instant" });
      }

      const canonicalUrl = getStudentRouteUrl(tab);
      const currentIdx = (window.history.state?.idx as number) ?? 0;
      if (replace) {
        window.history.replaceState({ tab, idx: currentIdx }, "", canonicalUrl);
      } else {
        window.history.pushState({ tab, idx: currentIdx + 1 }, "", canonicalUrl);
      }
    }
  }, [appState, activeTab]);

  const smartBack = useCallback((fallbackTab?: string) => {
    // 1. Guard: Don't allow accidental back during active exam
    if (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) {
      setNavWarning({ isOpen: true, targetTab: null, action: "tab" });
      return;
    }

    // 2. If on instructions view, cancel instructions cleanly
    if (appState === AppState.INSTRUCTIONS) {
      setAppState(AppState.IDLE);
      setPendingConfig(null);
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/exam/")) {
        if (canGoBackInSession()) {
          window.history.back();
        } else {
          handleTabChange("setup", true);
        }
      }
      return;
    }

    // 3. If reviewing history or on completed result view
    if (appState === AppState.COMPLETED) {
      setAppState(AppState.IDLE);
      const isHistory = isReviewingHistory;
      setIsReviewingHistory(false);
      const target = isHistory ? "history" : "dashboard";
      if (canGoBackInSession()) {
        window.history.back();
      } else {
        handleTabChange(target, true);
      }
      return;
    }

    // 4. Question Bank deep navigation:
    if (activeTab === "question_bank" || activeTab === "question-bank") {
      if (selectedQuestionBankSection) {
        setSelectedQuestionBankSection(null);
        if (typeof window !== "undefined" && (window.history.state?.qbView === "section" || window.history.state?.qbSubView === "section")) {
          window.history.back();
          return;
        }
      }
      if (selectedQuestionBankCategory) {
        setSelectedQuestionBankCategory(null);
        if (typeof window !== "undefined" && window.history.state?.qbView === "category") {
          window.history.back();
          return;
        }
      }
      if (selectedQuestionBankSubject) {
        setSelectedQuestionBankSubject(null);
        if (typeof window !== "undefined" && (window.history.state?.qbView === "subject" || window.history.state?.subjectId)) {
          window.history.back();
          return;
        }
      }
      if (selectedQuestionBankInstitute) {
        setSelectedQuestionBankInstitute(null);
        if (typeof window !== "undefined" && (window.history.state?.qbView === "institute" || window.history.state?.instituteId)) {
          window.history.back();
          return;
        }
      }
    }

    // 5. Subject report deep view
    if (activeTab === "subject_report") {
      setSelectedSubjectReport(null);
      if (canGoBackInSession()) {
        window.history.back();
      } else {
        handleTabChange("analysis", true);
      }
      return;
    }

    // 6. User profile deep view
    if (activeTab === "user_profile") {
      setSelectedUserProfile(null);
      if (canGoBackInSession()) {
        window.history.back();
      } else {
        handleTabChange("leaderboard", true);
      }
      return;
    }

    // 7. General in-app back vs direct landing
    if (canGoBackInSession()) {
      window.history.back();
    } else {
      // Direct landing: fall back to logical parent
      const target = fallbackTab || getParentRoute(activeTab);
      handleTabChange(target, true);
    }
  }, [
    appState,
    isReviewingHistory,
    activeTab,
    selectedQuestionBankInstitute,
    selectedQuestionBankCategory,
    selectedQuestionBankSubject,
    selectedQuestionBankSection,
    canGoBackInSession,
    handleTabChange,
  ]);

  // Browser back/forward button support
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      // Guard: don't navigate away mid-exam
      if (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) {
        const canonicalUrl = getStudentRouteUrl(activeTab);
        const currentIdx = (window.history.state?.idx as number) ?? 0;
        window.history.pushState({ tab: activeTab, idx: currentIdx + 1 }, '', canonicalUrl);
        setNavWarning({ isOpen: true, targetTab: null, action: 'tab' });
        return;
      }
      
      // If on completed result or instructions, exit cleanly
      if (appState === AppState.COMPLETED) {
        setAppState(AppState.IDLE);
        setIsReviewingHistory(false);
      }
      if (appState === AppState.INSTRUCTIONS) {
        setAppState(AppState.IDLE);
        setPendingConfig(null);
      }

      // Sync internal history stack
      if (navHistoryRef.current.length > 1) {
        navHistoryRef.current.pop();
      }

      const rawPath = window.location.pathname;
      const targetTab = e.state?.tab || resolvePathToTab(rawPath);
      const resolved = validTabs.includes(targetTab) ? targetTab : 'dashboard';

      setActiveTab(resolved);
      sessionStorage.setItem('obhyash_active_tab', resolved);

      // Handle Question Bank deep sub-views restoration
      if (resolved === "question_bank" || resolved === "question-bank") {
        const params = new URLSearchParams(window.location.search);
        const subjId = e.state?.subjectId || params.get("subject");
        const instId = e.state?.instituteId || params.get("institute");
        const cat = e.state?.category || params.get("category");
        const qbView = e.state?.qbView;

        if (subjId) {
          const found = findQuestionBankSubject(subjId);
          if (found) setSelectedQuestionBankSubject(found);
          if (cat === "academic" || qbView === "category") {
            setSelectedQuestionBankCategory("academic");
          } else {
            setSelectedQuestionBankCategory(null);
          }
          setSelectedQuestionBankInstitute(null);
          setSelectedQuestionBankSection(null);
        } else if (instId) {
          const foundInst = findQuestionBankInstitute(instId);
          if (foundInst) setSelectedQuestionBankInstitute(foundInst);
          setSelectedQuestionBankSubject(null);
          setSelectedQuestionBankCategory(null);
          setSelectedQuestionBankSection(null);
        } else {
          setSelectedQuestionBankSubject(null);
          setSelectedQuestionBankInstitute(null);
          setSelectedQuestionBankCategory(null);
          setSelectedQuestionBankSection(null);
        }
      }

      // Handle User Profile exit / restoration
      if (resolved !== "user_profile") {
        setSelectedUserProfile(null);
      } else {
        const match = window.location.pathname.match(/^\/leaderboard\/(?:user|user-profile)\/(.+)$/);
        if (match && (!selectedUserProfile || selectedUserProfile.id !== match[1])) {
          import("@/services/database").then(async ({ getUserProfile }) => {
            const u = await getUserProfile(match[1]);
            if (u) {
              setSelectedUserProfile(u);
              setSelectedUserRank(0);
            }
          });
        }
      }

      // Handle Subject Report exit
      if (resolved !== "subject_report") {
        setSelectedSubjectReport(null);
      }

      // Handle History Result restoration
      if (resolved === "history_result") {
        const m = window.location.pathname.match(/^\/history\/([\w-]+)$/);
        if (m && m[1]) {
          restoreExamHistoryResult(m[1]);
        }
      }

      // Reset scroll on pop instantly
      window.scrollTo({ top: 0, behavior: 'instant' });
      const mainContent = document.querySelector('main') || document.getElementById('main-scroll-container');
      if (mainContent) {
        mainContent.scrollTo({ top: 0, behavior: 'instant' });
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [appState, activeTab, resolvePathToTab, restoreExamHistoryResult, selectedUserProfile]);

  // On mount: sync current URL path & search params to active tab and sub-views state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize history state with idx: 0 so we can track session depth accurately
    if (window.history.state?.idx === undefined) {
      window.history.replaceState({ tab: activeTab, idx: 0 }, '', window.location.href);
    }

    const currentPath = window.location.pathname;
    const resolved = resolvePathToTab(currentPath);
    setActiveTab(resolved);
    sessionStorage.setItem('obhyash_active_tab', resolved);

    // Initial Question Bank restoration from URL query params
    if (resolved === "question_bank" || resolved === "question-bank") {
      const params = new URLSearchParams(window.location.search);
      const subjId = params.get("subject");
      const instId = params.get("institute");
      const cat = params.get("category");
      if (subjId) {
        const found = findQuestionBankSubject(subjId);
        if (found) setSelectedQuestionBankSubject(found);
        if (cat === "academic") setSelectedQuestionBankCategory("academic");
      } else if (instId) {
        const foundInst = findQuestionBankInstitute(instId);
        if (foundInst) setSelectedQuestionBankInstitute(foundInst);
      }
    }
  }, [resolvePathToTab]);


  const handleLogoutClick = async () => {
    if (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) {
      setNavWarning({ isOpen: true, targetTab: null, action: "logout" });
    } else {
      if (onLogout) {
        onLogout();
      } else {
        await authSignOut();
      }
    }
  };

  const confirmNavigation = async () => {
    setAppState(AppState.IDLE);
    if (navWarning.action === "tab" && navWarning.targetTab) {
      setActiveTab(navWarning.targetTab);
    } else if (navWarning.action === "logout") {
      if (onLogout) {
        onLogout();
      } else {
        await authSignOut();
      }
    }
    setNavWarning({ isOpen: false, targetTab: null, action: "tab" });
  };

  const handleGlobalRefresh = async () => {
    if (!currentUser?.id) return;
    const userId = currentUser.id;

    // Helper for per-query safety timeout (max 2200ms)
    const withTimeout = <T,>(p: Promise<T>, ms = 2200, fallback: T): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
      ]);

    try {
      // 1. Revalidate all active SWR queries in parallel (Dashboard stats, subjects, etc.)
      try {
        mutate(() => true);
      } catch (e) {
        console.warn("[StudentRoot] SWR mutate error:", e);
      }

      // 2. Dispatch broadcast event so active views (Bookmarks, Leaderboard, Live Exam) refresh their data
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:refresh"));
      }

      // 3. Trigger server components revalidation
      try {
        router.refresh();
      } catch {}

      // 4. Fetch Core User Data in PARALLEL with strict timeouts
      const [streakRes, historyRes, profileRes, bookmarksRes] = await Promise.allSettled([
        withTimeout(fetchUserStreakInfo(userId), 2000, null),
        withTimeout(getExamHistory(userId), 2200, null),
        withTimeout(getUserProfile(userId), 2000, null),
        withTimeout(getBookmarkedQuestions(userId), 2200, null),
      ]);

      // Apply streak update
      if (streakRes.status === "fulfilled" && streakRes.value) {
        const streakInfo = streakRes.value;
        if (streakInfo.currentStreak !== (currentUser.streakCount || 0)) {
          setCurrentUser((prev) =>
            prev ? { ...prev, streakCount: streakInfo.currentStreak, streak: streakInfo.currentStreak } : prev
          );
        }
      }

      // Apply exam history update
      if (historyRes.status === "fulfilled" && historyRes.value) {
        setExamHistory(historyRes.value);
      }

      // Apply user profile update
      if (profileRes.status === "fulfilled" && profileRes.value) {
        setCurrentUser(profileRes.value);
      }

      // Apply bookmarks questions update
      if (bookmarksRes.status === "fulfilled" && bookmarksRes.value) {
        setBookmarkedQuestions(bookmarksRes.value.filter((q) => bookmarkedIds.has(String(q.id))));
      }

      // Refresh bookmark IDs in hook
      if (refetchBookmarkIds) {
        refetchBookmarkIds().catch(() => {});
      }

      toast.success("ডাটা রিফ্রেশ সম্পন্ন হয়েছে", { id: "pull-to-refresh-toast", duration: 1200 });
    } catch (err) {
      console.error("[StudentRoot] Global refresh error:", err);
    }
  };

  const commonLayoutProps = {
    user: currentUser || undefined,
    onTabChange: handleTabChange,
    onBack: () => smartBack(),
    onLogout: handleLogoutClick,
    toggleTheme: toggleTheme,
    isDarkMode: theme === "dark",
    onRefresh: handleGlobalRefresh,
  };

  const handleExamSubmit = async (manual = true) => {
    await submitExam(manual);
  };

  if (authLoading && !effectiveUser) return <InitialLoader />;

  if (!currentUser) return null; // Should not happen if page handles loading

  // --- Routing Logic ---

  const renderApp = () => {
    if (appState === AppState.IDLE) {
      if (activeTab === "dashboard") {
        return (
          <AppLayout activeTab={activeTab} {...commonLayoutProps}>
            <Dashboard
              user={currentUser!}
              initialSubjects={subjects}
              onMockExamClick={() => handleTabChange("setup")}
              onHistoryClick={() => handleTabChange("history")}
              onSubjectClick={(subject) => {
                setSelectedSubjectReport(subject);
                setActiveTab("subject_report"); // internal-only, no route
              }}
              onLeaderboardClick={() => handleTabChange("leaderboard")}
              onAnalysisClick={() => handleTabChange("analysis")}
              onLiveExamClick={() => handleTabChange("live_exam")}
              onFormulasClick={() => handleTabChange("formulas")}
              onPracticeClick={() => handleTabChange("practice")}
              onBookmarksClick={() => handleTabChange("bookmarks")}
              history={examHistory}
              examTarget={currentUser?.exam_target}
              onChangeTarget={() => setShowTargetModal(true)}
            />
          </AppLayout>
        );
      }

      if (activeTab === "setup") {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="নতুন পরীক্ষা"
            hideBottomNav={true}
          >
            <ExamSetupContainer
              onStartExam={handleStartExam}
              isLoading={false}
              currentUser={currentUser}
              userDivision={currentUser?.division}
              userStream={currentUser?.stream}
              userOptionalSubject={currentUser?.optional_subject}
            />
          </AppLayout>
        );
      }

      if (activeTab === "exam") {
        if (typeof window !== "undefined" && !localStorage.getItem("obhyash_exam_draft")) {
           // Redirect back to setup if there's no active draft
           setTimeout(() => handleTabChange("setup"), 0);
        }
        return <InitialLoader />;
      }

      if (activeTab === "live_exam") {
        return (
          <LiveExamView commonLayoutProps={commonLayoutProps} />
        );
      }

      if (activeTab === "question_bank" || activeTab === "question-bank") {
        if (selectedQuestionBankInstitute) {
          return (
            <AppLayout
              activeTab="question_bank"
              {...commonLayoutProps}
              title={`${selectedQuestionBankInstitute.name} প্রশ্নব্যাংক`}
              onBack={() => smartBack()}
              hideTitle={false}
              hideBottomNav={true}
            >
              <InstituteDetailView
                institute={selectedQuestionBankInstitute}
                onBack={() => smartBack()}
                showHeader={false}
                onStartExam={(examSet, qs) => {
                  const totalMarks =
                    examSet.type === "written"
                      ? 400
                      : selectedQuestionBankInstitute.id === "ckruet"
                      ? 500
                      : selectedQuestionBankInstitute.id === "mist"
                      ? 200
                      : 100;
                  const details: ExamDetails = {
                    subject: selectedQuestionBankInstitute.name,
                    subjectLabel: `${selectedQuestionBankInstitute.name} ${examSet.title}`,
                    examType: examSet.type === "written" ? "Written" : "Admission",
                    chapters: "সকল অধ্যায়",
                    topics: "সকল বিষয়",
                    totalQuestions: qs.length,
                    durationMinutes: examSet.durationMinutes,
                    totalMarks: totalMarks,
                    negativeMarking: examSet.type === "written" ? 0 : 0.25,
                  };
                  startCustomExam(qs, details);
                  beginTimer(examSet.durationMinutes * 60);
                }}
              />
            </AppLayout>
          );
        }

        if (selectedQuestionBankSubject) {
          const paperClean = selectedQuestionBankSubject.paper
            ? selectedQuestionBankSubject.paper.split(" ")[0]
            : "";
          const displayTitle = paperClean
            ? `${selectedQuestionBankSubject.name} ${paperClean}`
            : selectedQuestionBankSubject.name;

          // If a section is selected (e.g. MCQ, CQ, Board, Textbook)
          if (selectedQuestionBankSection) {
            return (
              <AppLayout
                activeTab="question_bank"
                {...commonLayoutProps}
                title={`${displayTitle} - ${selectedQuestionBankSection.title}`}
                onBack={() => setSelectedQuestionBankSection(null)}
                hideTitle={false}
                hideBottomNav={true}
              >
                <AcademicSectionDetailView
                  subject={selectedQuestionBankSubject}
                  section={selectedQuestionBankSection}
                  onBack={() => setSelectedQuestionBankSection(null)}
                  showHeader={false}
                />
              </AppLayout>
            );
          }

          if (selectedQuestionBankCategory === "academic") {
            return (
              <AppLayout
                activeTab="question_bank"
                {...commonLayoutProps}
                title={`${displayTitle} - একাডেমিক`}
                onBack={() => smartBack()}
                hideTitle={false}
                hideBottomNav={true}
              >
                <AcademicCategoryDetailView
                  subject={selectedQuestionBankSubject}
                  onBack={() => smartBack()}
                  showHeader={false}
                  onSelectSection={(sec) => setSelectedQuestionBankSection(sec)}
                />
              </AppLayout>
            );
          }

          return (
            <AppLayout
              activeTab="question_bank"
              {...commonLayoutProps}
              title={displayTitle}
              onBack={() => smartBack()}
              hideTitle={false}
              hideBottomNav={true}
            >
              <SubjectCategoryDetailView
                subject={selectedQuestionBankSubject}
                onBack={() => smartBack()}
                showHeader={false}
                onSelectCategory={(cat) => {
                  if (cat.id === "academic") {
                    handleSelectQuestionBankCategory("academic");
                  } else {
                    setSelectedQuestionBankSection({
                      id: cat.id,
                      title: cat.title,
                      subtitle: cat.subtitle,
                      gradient: cat.gradient,
                      svgIcon: cat.svgIcon,
                      count: cat.count || 50,
                    });
                  }
                }}
              />
            </AppLayout>
          );
        }

        return (
          <AppLayout
            activeTab="question_bank"
            {...commonLayoutProps}
            hideTitle={true}
            headerTabs={{
              tabs: [
                { id: "institution", label: "প্রতিষ্ঠান ভিত্তিক" },
                { id: "subject", label: "বিষয় ভিত্তিক" },
              ],
              activeTabId: questionBankTab,
              onTabSelect: (id) => setQuestionBankTab(id as "institution" | "subject"),
            }}
          >
            <QuestionBankView
              user={currentUser}
              activeHeaderTab={questionBankTab}
              onHeaderTabChange={setQuestionBankTab}
              onSelectSubject={handleSelectQuestionBankSubject}
              onSelectInstitute={handleSelectQuestionBankInstitute}
            />
          </AppLayout>
        );
      }

      if (activeTab === "history") {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="ইতিহাস"
            onBack={() => smartBack("dashboard")}
            headerRight={
              <div className="h-[36px] p-[3px] bg-[#F3F4F6] dark:bg-[#1E1E1E] rounded-[12px] border border-[#E5E7EB] dark:border-[#2E2E2E] flex items-center shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setHistoryTab("exams")}
                  className={cn(
                    "h-[30px] px-3 rounded-[9px] text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center font-['Anek_Bangla',sans-serif]",
                    historyTab === "exams"
                      ? "bg-[#12544F] text-white shadow-xs"
                      : "text-[#71717A] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  পরীক্ষা
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryTab("questions")}
                  className={cn(
                    "h-[30px] px-3 rounded-[9px] text-[13px] font-semibold transition-all cursor-pointer flex items-center justify-center font-['Anek_Bangla',sans-serif]",
                    historyTab === "questions"
                      ? "bg-[#12544F] text-white shadow-xs"
                      : "text-[#71717A] dark:text-[#A1A1AA] hover:text-neutral-900 dark:hover:text-white"
                  )}
                >
                  প্রশ্ন
                </button>
              </div>
            }
          >
            <ExamHistoryView
              activeTab={historyTab}
              onTabChange={setHistoryTab}
              history={examHistory}
              subjects={subjects}
              user={effectiveUser}
              onBack={() => smartBack("dashboard")}
              onClearHistory={async (ids?: string[]) => {
                const { clearExamHistory, bulkDeleteExamResults } =
                  await import("@/services/database");
                
                if (ids && ids.length > 0) {
                  const success = await bulkDeleteExamResults(ids);
                  if (success) {
                    setExamHistory((prev) => prev.filter((e) => !ids.includes(e.id)));
                    toast.success("নির্বাচিত ইতিহাস মুছে ফেলা হয়েছে");
                  } else {
                    toast.error("কিছু ইতিহাস মুছতে সমস্যা হয়েছে");
                  }
                } else {
                  const success = await clearExamHistory();
                  if (success) {
                    setExamHistory([]);
                    toast.success("ইতিহাস মুছে ফেলা হয়েছে");
                  } else {
                    toast.error("ইতিহাস মুছতে সমস্যা হয়েছে");
                  }
                }
              }}
              onViewResult={(res) => {
                setQuestions(res.questions || []);
                setUserAnswers(res.userAnswers || {});
                setFlaggedQuestions(new Set(res.flaggedQuestions || [])); // Hydrate bookmarks
                setExamDetails({
                  subject: res.subject,
                  subjectLabel: res.subjectLabel || res.subject,
                  examType: res.examType || "",
                  chapters: "",
                  topics: "",
                  totalQuestions: res.totalQuestions,
                  durationMinutes: 0,
                  totalMarks: res.totalMarks,
                  negativeMarking: res.negativeMarking,
                });
                setTimeTaken(res.timeTaken);
                setIsReviewingHistory(true);
                setAppState(AppState.COMPLETED);
                // Give the result view a shareable URL
                if (res.id) {
                  window.history.pushState({ tab: "history_result", examId: res.id }, "", `/history/${res.id}`);
                }
              }}
              onRecheckRequest={(id) => alert("Recheck requested for: " + id)}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={toggleBookmark}
              bookmarkedQuestions={bookmarkedQuestions}
            />
          </AppLayout>
        );
      }

      if (activeTab === "leaderboard") {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="লিডারবোর্ড"
          >
            <LeaderboardView
              currentUser={effectiveUser}
              onLegendsLeagueClick={() => handleTabChange("legends-league")}
              onUserClick={(user: UserProfile, rank: number) => {
                setSelectedUserProfile(user);
                setSelectedUserRank(rank || 0);
                setActiveTab("user_profile");
                // Give this view a shareable URL
                window.history.pushState({ tab: "user_profile", userId: user.id }, "", `/leaderboard/user/${user.id}`);
              }}
            />
          </AppLayout>
        );
      }

      if (activeTab === "legends-league" || activeTab === "legends_league") {
        return (
          <AppLayout
            activeTab="legends-league"
            {...commonLayoutProps}
            title="লেজেন্ডস লীগ"
            onBack={() => smartBack("leaderboard")}
            hideBottomNav={true}
          >
            <LegendsLeagueView
              currentUser={currentUser}
              onBack={() => smartBack("leaderboard")}
            />
          </AppLayout>
        );
      }

      if (activeTab === "profile") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="আমার প্রোফাইল"
            onBack={() => smartBack("dashboard")}
          >
            <MyProfileView
              user={currentUser!}
              history={examHistory}
              onEditProfile={() => handleTabChange("personal")}
              onSubjectClick={(subject) => {
                setSelectedSubjectReport(subject);
                setActiveTab("subject_report");
              }}
              onViewNotifications={() => handleTabChange("notifications")}
            />
          </AppLayout>
        );
      }

      if (activeTab === "settings") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="সেটিংস"
            onBack={() => smartBack("dashboard")}
          >
            <SettingsView
              user={currentUser!}
              onSave={handleProfileUpdate}
              onNavigate={(tab) => handleTabChange(tab)}
              onLogout={handleLogoutClick}
              toggleTheme={toggleTheme}
              isDarkMode={theme === "dark"}
            />
          </AppLayout>
        );
      }

      if (activeTab === "bookmarks") {
        return (
          <AppLayout
            activeTab="bookmarks"
            {...commonLayoutProps}
            title="বুকমার্ক করা প্রশ্নসমূহ"
            onBack={() => smartBack("practice")}
            hideBottomNav={true}
          >
            <BookmarksView userId={activeUserId || currentUser?.id} />
          </AppLayout>
        );
      }

      if (activeTab === "formulas") {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="ফর্মুলা ও শর্টকাট শিট"
            onBack={() => smartBack("dashboard")}
          >
            <FormulaAppPromoView />
          </AppLayout>
        );
      }

      if (activeTab === "practice") {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="অনুশীলন"
            onBack={() => smartBack("dashboard")}
            headerSegment={{
              tabs: [
                { id: "mistakes", label: "ভুলসমূহ" },
                { id: "bookmarks", label: "বুকমার্ক" },
              ],
              activeTabId: practiceTab,
              onTabSelect: (id) => setPracticeTab(id as "mistakes" | "bookmarks"),
            }}
          >
            <PracticeDashboard
              history={examHistory}
              onStartPractice={startCustomExam}
              onNavigateToMock={() => handleTabChange("setup")}
              subjects={subjects.map((s) => s.id)}
              currentUser={currentUser}
              activeTab={practiceTab}
              onTabChange={setPracticeTab}
            />
          </AppLayout>
        );
      }

      if (activeTab === "analysis") {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="পারফরম্যান্স অ্যানালিটিক্স"
            onBack={() => smartBack("dashboard")}
          >
            <AnalysisView
              currentUser={currentUser || effectiveUser}
              history={examHistory}
              onSubjectClick={(subject) => {
                setSelectedSubjectReport(subject);
                setActiveTab("subject_report");
              }}
              onStartExam={() => handleTabChange("setup")}
            />
          </AppLayout>
        );
      }

      if (activeTab === "complaint") {
        return (
          <AppLayout
            activeTab="complaint"
            {...commonLayoutProps}
            title="অভিযোগ ও পরামর্শ"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <ComplaintView />
          </AppLayout>
        );
      }

      if (activeTab === "feature-requests") {
        return (
          <AppLayout
            activeTab="feature-requests"
            {...commonLayoutProps}
            title="নতুন ফিচার প্রস্তাব"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <FeatureRequestsView />
          </AppLayout>
        );
      }

      if (activeTab === "notifications") {
        return (
          <AppLayout
            activeTab="notifications"
            {...commonLayoutProps}
            title="নোটিফিকেশন"
            onBack={() => smartBack("dashboard")}
            hideBottomNav={true}
          >
            <NotificationsView onNavigate={(tab) => handleTabChange(tab)} />
          </AppLayout>
        );
      }

      if (activeTab === "info" || activeTab === "account-info") {
        return (
          <AppLayout
            activeTab="account-info"
            {...commonLayoutProps}
            title="অ্যাকাউন্ট ইনফো"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <AccountInfoView
              user={currentUser}
              onBack={() => smartBack("settings")}
            />
          </AppLayout>
        );
      }

      if (activeTab === "referral") {
        return (
          <AppLayout
            activeTab="referral"
            {...commonLayoutProps}
            title="রেফারেল ও রিওয়ার্ড"
            onBack={() => smartBack("dashboard")}
            hideBottomNav={true}
            noPadding={true}
          >
            <ReferralView user={currentUser} />
          </AppLayout>
        );
      }

      if (activeTab === "about") {
        return (
          <AppLayout
            activeTab="about"
            {...commonLayoutProps}
            title="আমাদের সম্পর্কে"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <AboutUsView />
          </AppLayout>
        );
      }

      if (activeTab === "privacy") {
        return (
          <AppLayout
            activeTab="privacy"
            {...commonLayoutProps}
            title="প্রাইভেসি পলিসি"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <PrivacyPolicyView />
          </AppLayout>
        );
      }

      if (activeTab === "terms") {
        return (
          <AppLayout
            activeTab="terms"
            {...commonLayoutProps}
            title="ব্যবহারের শর্তাবলী"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <TermsConditionsView />
          </AppLayout>
        );
      }

      if (activeTab === "faq" || activeTab === "help") {
        return (
          <AppLayout
            activeTab="faq"
            {...commonLayoutProps}
            title="সাহায্য ও জিজ্ঞাসা"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <FaqPanel onNavigateComplaint={() => handleTabChange("complaint")} />
          </AppLayout>
        );
      }

      if (activeTab === "account-linking" && currentUser) {
        return (
          <AppLayout
            activeTab="account-linking"
            {...commonLayoutProps}
            title="অ্যাকাউন্ট লিংকিং"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <AccountLinkingPanel user={currentUser} />
          </AppLayout>
        );
      }

      if (activeTab === "delete-account" && currentUser) {
        return (
          <AppLayout
            activeTab="delete-account"
            {...commonLayoutProps}
            title="অ্যাকাউন্ট মুছুন"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <DeleteAccountPanel
              user={currentUser}
              onBack={() => smartBack("settings")}
            />
          </AppLayout>
        );
      }

      if (activeTab === "personal" || activeTab === "edit-profile") {
        return (
          <AppLayout
            activeTab="personal"
            {...commonLayoutProps}
            title="প্রোফাইল সম্পাদনা"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <PersonalDetailsPanel
              user={currentUser!}
              onSave={async (data) => {
                await handleProfileUpdate(data);
                smartBack("settings");
              }}
            />
          </AppLayout>
        );
      }

      if (activeTab === "reports") {
        return (
          <AppLayout
            activeTab="reports"
            {...commonLayoutProps}
            title="রিপোর্টসমূহ"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <ReportsPanel user={currentUser!} />
          </AppLayout>
        );
      }

      if (activeTab === "my-subscription") {
        return (
          <AppLayout
            activeTab="my-subscription"
            {...commonLayoutProps}
            title="আমার সাবস্ক্রিপশন"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <MySubscriptionPanel onUpgrade={() => handleTabChange("upgrade")} />
          </AppLayout>
        );
      }

      if (activeTab === "subscription" || activeTab === "upgrade")
        return (
          <AppLayout
            activeTab="subscription"
            {...commonLayoutProps}
            title="প্রো সাবস্ক্রিপশন"
            onBack={() => smartBack("settings")}
            hideBottomNav={true}
          >
            <SubscriptionView />
          </AppLayout>
        );
      if (activeTab === "user_profile")
        return (
          <AppLayout
            activeTab="user_profile"
            {...commonLayoutProps}
            title={
              selectedUserProfile?.name
                ? `${selectedUserProfile.name}-এর প্রোফাইল`
                : "শিক্ষার্থীর প্রোফাইল"
            }
            onBack={() => smartBack("leaderboard")}
            hideBottomNav={true}
          >
            {selectedUserProfile ? (
              <UserProfileView
                user={selectedUserProfile}
                currentUser={currentUser}
                rank={selectedUserRank}
                onBack={() => smartBack("leaderboard")}
              />
            ) : (
              <div className="w-full max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center">
                <ExamLoadingSkeleton hideHeader={true} />
              </div>
            )}
          </AppLayout>
        );

      if (activeTab === "history_result") {
        return (
          <AppLayout
            activeTab="history"
            {...commonLayoutProps}
            title="পরীক্ষার ফলাফল"
            onBack={() => smartBack("history")}
          >
            {examDetails && questions.length > 0 ? (
              <ResultView
                questions={questions}
                userAnswers={userAnswers}
                timeTaken={timeTaken}
                initialBookmarks={flaggedQuestions}
                onRestart={() => smartBack("history")}
                isDarkMode={theme === "dark"}
                onToggleTheme={toggleTheme}
                isHistoryMode={true}
                negativeMarking={examDetails?.negativeMarking}
                submissionType="digital"
              />
            ) : (
              <div className="w-full max-w-4xl mx-auto py-12 px-4 flex flex-col items-center justify-center">
                <ExamLoadingSkeleton hideHeader={true} />
              </div>
            )}
          </AppLayout>
        );
      }
      if (activeTab === "subject_report") {
        if (selectedSubjectReport) {
          return (
            <AppLayout
              activeTab="subject_report"
              {...commonLayoutProps}
              title={`${BanglaNameHelper.formatSubject(
                selectedSubjectReport,
                selectedSubjectReport
              )} রিপোর্ট`}
              onBack={() => smartBack("analysis")}
              hideBottomNav={true}
            >
              <SubjectReportView
                subject={selectedSubjectReport}
                history={examHistory}
                currentUser={currentUser || effectiveUser}
                onBack={() => smartBack("analysis")}
              />
            </AppLayout>
          );
        } else {
          return (
            <AppLayout
              activeTab="analysis"
              {...commonLayoutProps}
              title="পারফরম্যান্স অ্যানালিটিক্স"
              onBack={() => smartBack("dashboard")}
            >
              <AnalysisView
                currentUser={currentUser || effectiveUser}
                history={examHistory}
                onSubjectClick={(subject) => {
                  setSelectedSubjectReport(subject);
                  setActiveTab("subject_report");
                }}
                onStartExam={() => handleTabChange("setup")}
              />
            </AppLayout>
          );
        }
      }
    }

    // --- Active Exam States ---

    if (appState === AppState.INSTRUCTIONS) {
      if (examDetails) {
        // If we have examDetails, it means we just fetched questions and are about to start.
        return (
          <div className="min-h-screen w-full bg-[#F4F6F9] dark:bg-[#0A0B0E] flex flex-col items-center justify-center font-['HindSiliguri',sans-serif]">
            <ExamLoadingSkeleton />
          </div>
        );
      }

      // Otherwise show Pre-Fetch Instructions (STANDALONE, WITHOUT SIDEBAR)
      if (pendingConfig) {
        return (
          <ExamInstructionsView
            config={pendingConfig}
            onStart={handleProceedToExam}
            onBack={() => smartBack("setup")}
            showHeader={true}
          />
        );
      }
    }

    if (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) {
      if (!examDetails) return null;
      return (
        <>
          <ExamRunner
            appState={appState}
            examDetails={examDetails ?? undefined}
            questions={questions}
            userAnswers={userAnswers}
            setUserAnswers={setUserAnswers}
            flaggedQuestions={flaggedQuestions}
            setFlaggedQuestions={setFlaggedQuestions}
            timeLeft={timeLeft}
            isEvaluating={isEvaluating}
            onSubmit={handleExamSubmit}
            onExit={() =>
              setNavWarning({
                isOpen: true,
                targetTab: "dashboard",
                action: "tab",
              })
            }
            onTimeoutReattempt={() => {
              setIsTimeoutModalOpen(false);
              setAppState(AppState.IDLE);
              if (lastExamConfigRef.current)
                startExam(lastExamConfigRef.current);
            }}
            onTimeoutCancel={() => setAppState(AppState.IDLE)}
            setAppState={setAppState}
            navWarning={navWarning}
            setNavWarning={setNavWarning}
            confirmNavigation={confirmNavigation}
            currentUser={currentUser}
            handleTabChange={handleTabChange}
            handleLogoutClick={handleLogoutClick}
            toggleTheme={toggleTheme}
            isDarkMode={theme === "dark"}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
          />
          {isTimeoutModalOpen && (
            <TimeoutModal
              onReattempt={() => {
                setIsTimeoutModalOpen(false);
                setAppState(AppState.IDLE);
                if (lastExamConfigRef.current)
                  startExam(lastExamConfigRef.current);
              }}
              onCancel={() => setAppState(AppState.IDLE)}
            />
          )}
        </>
      );
    }

    if (appState === AppState.LOADING) {
      return (
        <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#000000] flex flex-col font-['HindSiliguri',sans-serif]">
          {/* Top Exam Header Skeleton (Matching ExamRunner sticky header exactly, without text) */}
          <header className="sticky top-0 z-30 h-[52px] bg-white dark:bg-[#000000] border-b border-[#E2E8F0] dark:border-[#27272A] shadow-xs select-none">
            <div className="max-w-3xl mx-auto px-3.5 sm:px-4 h-full flex items-center justify-between gap-3">
              {/* Left: Answered/Total Pill Skeleton */}
              <div className="h-8 w-14 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />

              {/* Middle: Timer Capsule Skeleton */}
              <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />

              {/* Right: Actions Skeleton + Cancel Icon Button */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <button
                  type="button"
                  onClick={() => setAppState(AppState.IDLE)}
                  title="বাতিল করো"
                  aria-label="বাতিল করো"
                  className="w-8 h-8 rounded-lg bg-[#F1F5F9] dark:bg-[#1C1C1E] border border-[#E2E8F0] dark:border-[#27272A] flex items-center justify-center text-[#64748B] dark:text-[#94A3B8] hover:text-red-500 hover:border-red-200 dark:hover:border-red-900/50 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </header>
          <div className="flex-1 py-2 sm:py-4">
            <ExamLoadingSkeleton hideHeader={true} />
          </div>
        </div>
      );
    }

    if (isEvaluating) {
      return (
        <div className="min-h-screen w-full bg-[#F4F6F9] dark:bg-[#0A0B0E] flex flex-col items-center justify-center p-4">
          <ResultSkeleton />
        </div>
      );
    }

    if (appState === AppState.COMPLETED) {
      return (
        <AppLayout
          activeTab={isReviewingHistory ? "history" : "dashboard"}
          {...commonLayoutProps}
          title={isReviewingHistory ? "পরীক্ষার ইতিহাস ও ফলাফল" : "পরীক্ষার ফলাফল"}
          onBack={() => smartBack(isReviewingHistory ? "history" : "dashboard")}
        >
          <ResultView
            questions={questions}
            userAnswers={userAnswers}
            timeTaken={timeTaken}
            initialBookmarks={flaggedQuestions}
            onRestart={() => smartBack(isReviewingHistory ? "history" : "dashboard")}
            isDarkMode={theme === "dark"}
            onToggleTheme={toggleTheme}
            isHistoryMode={isReviewingHistory}
            negativeMarking={examDetails?.negativeMarking}
            submissionType={
              examHistory[examHistory.length - 1]?.submissionType === "script"
                ? "script"
                : "digital"
            }
            onDownloadQuestionPaper={() => {
                if (!isPro) {
                  const { count } = getPdfWeeklyCount();
                  if (count >= FREE_WEEKLY_PDF_LIMIT) {
                    setShowProPdfModal(true);
                    return;
                  }
                  incrementPdfWeeklyCount();
                }
                examDetails && downloadQuestionPaper(examDetails, questions);
              }}
            onDownloadResultWithExplanations={() => {
                // Solution PDF is Pro-only
                if (!isPro) {
                  setShowProPdfModal(true);
                  return;
                }
                examDetails && downloadResultWithExplanations(examDetails, questions, userAnswers);
              }}
            currentUser={currentUser}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            examDetails={examDetails ?? undefined}
            onRetryWrongAnswers={
              isReviewingHistory ? undefined : handleRetryWrongAnswers
            }
            onReexam={() => {
              setAppState(AppState.IDLE);
              setIsReviewingHistory(false);
              handleTabChange("setup");
            }}
            showHeader={false}
          />
        </AppLayout>
      );
    }

    if (appState === AppState.ERROR) {
      return (
        <div className="min-h-screen w-full bg-[#F4F6F9] dark:bg-[#0A0B0E] flex flex-col items-center justify-center p-4 font-['HindSiliguri',sans-serif]">
          <div className="w-full max-w-md bg-white dark:bg-[#141417] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 sm:p-8 text-center shadow-xl">
            <h2 className="text-xl font-bold text-red-600 mb-2">
              ত্রুটি হয়েছে
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-6">
              {errorDetails || "পরীক্ষা লোড করতে সমস্যা হয়েছে। অন্য অধ্যায় বা টপিক নির্বাচন করো।"}
            </p>
            <button
              onClick={() => setAppState(AppState.IDLE)}
              className="w-full py-3 px-6 bg-[#12544F] hover:brightness-105 text-white font-bold rounded-[14px] shadow-[0_4.5px_0_#092328] active:shadow-[0_1px_0_#092328] active:translate-y-[3.5px] transition cursor-pointer text-[16px] tracking-[0.2px]"
            >
              ফিরে যাও
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {renderApp()}
      {showStreakCelebration && (
        <StreakCelebration
          count={newStreakCount}
          onComplete={() => setShowStreakCelebration(false)}
        />
      )}
      {showTargetModal && currentUser && (
        <ExamTargetModal
          user={currentUser}
          onClose={(updatedTarget) => {
            if (updatedTarget) {
              setCurrentUser((u) =>
                u ? { ...u, exam_target: updatedTarget } : u,
              );
            }
            setShowTargetModal(false);
          }}
        />
      )}
      <ProUpgradeModal
        isOpen={showProBookmarkModal}
        onClose={() => setShowProBookmarkModal(false)}
        title="বুকমার্ক লিমিট শেষ 📌"
        message="ফ্রি অ্যাকাউন্টে সর্বোচ্চ ২৫টি প্রশ্ন বুকমার্ক করা যাবে। আনলিমিটেড বুকমার্ক ও প্র্যাকটিসের জন্য প্রো সাবস্ক্রিপশন নাও।"
        featurePill="বুকমার্ক লিমিট: ২৫/২৫"
        onUpgradeClick={() => {
          setShowProBookmarkModal(false);
          setActiveTab("subscription");
          if (typeof window !== "undefined") {
            window.history.pushState({ tab: "subscription" }, "", "/subscription");
          }
        }}
      />
      <ProUpgradeModal
        isOpen={showProPdfModal}
        onClose={() => setShowProPdfModal(false)}
        title="PDF ডাউনলোড সীমিত"
        message="ফ্রি অ্যাকাউন্টে সপ্তাহে মাত্র ৩টি প্রশ্নপত্র PDF ডাউনলোড করা যাবে। ব্যাখ্যাসহ উত্তরপত্র PDF শুধুমাত্র প্রো সদস্যদের জন্য। আনলিমিটেড ডাউনলোডের জন্য প্রো সাবস্ক্রিপশন নাও।"
        featurePill="সাপ্তাহিক লিমিট: ৩টি PDF"
        onUpgradeClick={() => {
          setShowProPdfModal(false);
          setActiveTab("subscription");
          if (typeof window !== "undefined") {
            window.history.pushState({ tab: "subscription" }, "", "/subscription");
          }
        }}
      />
    </>
  );
}
