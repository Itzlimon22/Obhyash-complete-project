"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Types & Services
import {
  UserProfile,
  AppState,
  ExamConfig,
  ExamResult,
  Question,
} from "@/lib/types";
import {
  downloadQuestionPaper,
  downloadResult,
  downloadResultWithExplanations,
} from "@/services/download-service";
import { updateUserProfile } from "@/services/database";
import { calculateLevel } from "@/lib/utils";

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
// import InstructionsView from '@/components/student/ui/InstructionsView'; // Deprecated in new flow
import { ExamInstructionsView } from "@/components/student/features/exam/ExamInstructionsView";
import ExamRunner from "@/components/student/features/exam/ExamRunner";

// History & Results
import ExamHistoryView from "@/components/student/features/history/ExamHistoryView";
import ResultView from "@/components/student/ui/ResultView";
import ResultSkeleton from "@/components/student/ui/results/ResultSkeleton";
import ExamLoadingSkeleton from "@/components/student/ui/exam/ExamLoadingSkeleton";

interface StudentRootProps {
  user: UserProfile;
  theme: "light" | "dark";
  toggleTheme: () => void;
  onLogout: () => void;
  subjects?: { id: string; name: string; [key: string]: unknown }[];
}

import { useAuth } from "@/components/auth/AuthProvider";
import InitialLoader from "@/components/student/ui/InitialLoader";

export default function StudentRoot({
  user: initialUser,
  theme,
  toggleTheme,
  onLogout,
  subjects = [],
}: StudentRootProps) {
  const router = useRouter();
  // ... (keeping existing hooks and state)
  const engine = useExamEngine();
  // DO NOT call createClient() at component level — use AuthProvider's supabase context instead.
  // Calling it here creates a new reference on every render and can cause stale session issues.
  const {
    user: authUser,
    profile: authProfile,
    loading: authLoading,
    signOut: authSignOut,
  } = useAuth();

  // Use authProfile if available, otherwise fall back to initialUser
  const effectiveUser = authProfile || initialUser;

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
      if (typeof window !== "undefined") {
        window.history.pushState({ tab: "exam" }, "", "/exam/active");
        setActiveTab("exam");
        sessionStorage.setItem("obhyash_active_tab", "exam");
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
        beginTimer(pendingConfig.durationMinutes * 60);
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
    "history",
    "practice",
    "leaderboard",
    "analysis",
    "complaint",
    "feature-requests",
    "notifications",
    "about",
    "subscription",
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
    "privacy",
    "terms",
    "faq",
    "help",
  ];

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const pathname = window.location.pathname;
      // Strip leading slash
      const path = pathname.replace(/^\//, "");

      // Deep paths: /leaderboard/user/[id] or /history/[examId]
      if (path.startsWith("leaderboard/user/")) return "user_profile";
      if (path.startsWith("history/") && path !== "history") return "history_result";
      if (path.startsWith("exam/")) return "exam";

      // Top-level tab paths
      if (validTabs.includes(path)) return path;
      return sessionStorage.getItem("obhyash_active_tab") || "dashboard";
    }
    return "dashboard";
  });

  // IDs parsed from the initial URL (for deep-link restoration)
  const [initialDeepUserId] = useState(() => {
    if (typeof window === "undefined") return null;
    const m = window.location.pathname.match(/^\/leaderboard\/user\/(.+)$/);
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

  const activeUserId = authProfile?.id || currentUser?.id || initialUser?.id;
  const isPro = Boolean(
    (currentUser as any)?.isPro ||
    (currentUser as any)?.is_pro ||
    (currentUser as any)?.is_subscribed ||
    (currentUser as any)?.subscription_status === "active" ||
    (currentUser as any)?.plan === "pro" ||
    currentUser?.subscription?.plan === "Pro" ||
    (currentUser?.role as string)?.toLowerCase() === "admin"
  );

  const [showProBookmarkModal, setShowProBookmarkModal] = useState(false);

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

    if (authLoading || !currentUser?.id) return;

    const handleStreakAndHistory = async () => {
      try {
        const { fetchUserStreakInfo } = await import("@/services/streak-service");
        const streakInfo = await fetchUserStreakInfo(currentUser.id);
        
        if (isMounted && streakInfo.currentStreak !== (currentUser.streakCount || 0)) {
          setCurrentUser((prev) =>
            prev ? { ...prev, streakCount: streakInfo.currentStreak, streak: streakInfo.currentStreak } : prev,
          );
        }

        // Fetch History
        const { getExamHistory } = await import("@/services/database");
        const dbHistory = await getExamHistory(currentUser.id);
        if (dbHistory && isMounted) {
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
  }, [currentUser?.id, authLoading]);

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


  // Browser back/forward button support
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      // Guard: don't navigate away mid-exam
      if (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) {
        // Restore the URL without navigation
        window.history.pushState({ tab: activeTab }, '', '/' + activeTab);
        setNavWarning({ isOpen: true, targetTab: null, action: 'tab' });
        return;
      }
      
      // If we're on the results page (completed state) and the user navigates back, exit the results view
      if (appState === AppState.COMPLETED) {
        setAppState(AppState.IDLE);
        setIsReviewingHistory(false);
      }

      const tab = e.state?.tab || window.location.pathname.replace(/^\//, '') || 'dashboard';
      const resolved = validTabs.includes(tab) ? tab : 'dashboard';
      setActiveTab(resolved);
      sessionStorage.setItem('obhyash_active_tab', resolved);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [appState, activeTab]);

  // On mount: sync current URL path to active tab state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const currentPath = window.location.pathname.replace(/^\//, '');
    if (validTabs.includes(currentPath)) {
      setActiveTab(currentPath);
      sessionStorage.setItem('obhyash_active_tab', currentPath);
    } else if (currentPath.startsWith("leaderboard/user/")) {
      setActiveTab("user_profile");
    } else if (currentPath.startsWith("history/") && currentPath !== "history") {
      setActiveTab("history_result");
    } else if (currentPath.startsWith("exam/")) {
      setActiveTab("exam");
    }
  }, []); // only on mount

  const handleTabChange = (tab: string) => {
    if (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) {
      setNavWarning({ isOpen: true, targetTab: tab, action: "tab" });
    } else {
      if (appState === AppState.COMPLETED) {
        setAppState(AppState.IDLE);
        setIsReviewingHistory(false);
      }

      setActiveTab(tab);
      sessionStorage.setItem("obhyash_active_tab", tab);
      if (typeof window !== "undefined" && validTabs.includes(tab)) {
        // pushState updates the URL bar without a page reload —
        // safe on all devices including mobile Safari and PWA mode
        window.history.pushState({ tab }, '', '/' + tab);
      }
    }
  };

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

  const commonLayoutProps = {
    user: currentUser || undefined,
    onTabChange: handleTabChange,
    onLogout: handleLogoutClick,
    toggleTheme: toggleTheme,
    isDarkMode: theme === "dark",
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

      if (activeTab === "history") {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="ইতিহাস"
          >
            <ExamHistoryView
              history={examHistory}
              onBack={() => handleTabChange("dashboard")}
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
            activeTab={activeTab}
            {...commonLayoutProps}
            title="লেজেন্ডস লীগ"
          >
            <LegendsLeagueView
              currentUser={currentUser}
              onBack={() => handleTabChange("leaderboard")}
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
            onBack={() => handleTabChange("dashboard")}
          >
            <MyProfileView
              user={currentUser!}
              history={examHistory}
              onEditProfile={() => handleTabChange("personal")}
              onSubjectClick={(subject) => {
                setSelectedSubjectReport(subject);
                setActiveTab("subject_report"); // internal-only, no route
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
            onBack={() => handleTabChange("dashboard")}
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
            activeTab={activeTab}
            {...commonLayoutProps}
            title="বুকমার্ক করা প্রশ্নসমূহ"
            onBack={() => handleTabChange("practice")}
          >
            <BookmarksView />
          </AppLayout>
        );
      }

      if (activeTab === "formulas") {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="ফর্মুলা ও শর্টকাট শিট"
            onBack={() => handleTabChange("dashboard")}
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
            title="অনুশীলন ও প্র্যাকটিস"
            onBack={() => handleTabChange("dashboard")}
          >
            <PracticeDashboard
              history={examHistory}
              onStartPractice={startCustomExam}
              onNavigateToMock={() => handleTabChange("setup")}
              subjects={subjects.map((s) => s.id)}
              currentUser={currentUser}
              initialTab="mistakes"
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
            onBack={() => handleTabChange("dashboard")}
          >
            <AnalysisView
              history={examHistory}
              onSubjectClick={(subject) => {
                setSelectedSubjectReport(subject);
                setActiveTab("subject_report"); // internal-only, no route
              }}
              onStartExam={() => handleTabChange("setup")}
            />
          </AppLayout>
        );
      }

      if (activeTab === "complaint") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="অভিযোগ ও পরামর্শ"
            onBack={() => handleTabChange("settings")}
          >
            <ComplaintView />
          </AppLayout>
        );
      }

      if (activeTab === "feature-requests") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="নতুন ফিচার প্রস্তাব"
            onBack={() => handleTabChange("settings")}
          >
            <FeatureRequestsView />
          </AppLayout>
        );
      }

      if (activeTab === "notifications") {
        return (
          <AppLayout
            activeTab="dashboard"
            {...commonLayoutProps}
            title="নোটিফিকেশন"
            onBack={() => handleTabChange("dashboard")}
          >
            <NotificationsView onNavigate={(tab) => handleTabChange(tab)} />
          </AppLayout>
        );
      }

      if (activeTab === "info" || activeTab === "account-info") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="অ্যাকাউন্ট ইনফো"
            onBack={() => handleTabChange("settings")}
          >
            <AccountInfoView
              user={currentUser}
              onBack={() => handleTabChange("settings")}
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
            onBack={() => handleTabChange("dashboard")}
          >
            <ReferralView />
          </AppLayout>
        );
      }

      if (activeTab === "about") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="আমাদের সম্পর্কে"
            onBack={() => handleTabChange("settings")}
          >
            <AboutUsView />
          </AppLayout>
        );
      }

      if (activeTab === "privacy") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="প্রাইভেসি পলিসি"
            onBack={() => handleTabChange("settings")}
          >
            <PrivacyPolicyView />
          </AppLayout>
        );
      }

      if (activeTab === "terms") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="ব্যবহারের শর্তাবলী"
            onBack={() => handleTabChange("settings")}
          >
            <TermsConditionsView />
          </AppLayout>
        );
      }

      if (activeTab === "faq" || activeTab === "help") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="সাহায্য ও জিজ্ঞাসা"
            onBack={() => handleTabChange("settings")}
          >
            <FaqPanel onNavigateComplaint={() => handleTabChange("complaint")} />
          </AppLayout>
        );
      }

      if (activeTab === "account-linking" && currentUser) {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="অ্যাকাউন্ট লিংকিং"
            onBack={() => handleTabChange("settings")}
          >
            <AccountLinkingPanel user={currentUser} />
          </AppLayout>
        );
      }

      if (activeTab === "delete-account" && currentUser) {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="অ্যাকাউন্ট মুছুন"
            onBack={() => handleTabChange("settings")}
          >
            <DeleteAccountPanel
              user={currentUser}
              onBack={() => handleTabChange("settings")}
            />
          </AppLayout>
        );
      }

      if (activeTab === "personal" || activeTab === "edit-profile") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="প্রোফাইল সম্পাদনা"
            onBack={() => handleTabChange("settings")}
          >
            <PersonalDetailsPanel
              user={currentUser!}
              onSave={async (data) => {
                await handleProfileUpdate(data);
                handleTabChange("settings");
              }}
            />
          </AppLayout>
        );
      }

      if (activeTab === "reports") {
        return (
          <AppLayout
            activeTab="settings"
            {...commonLayoutProps}
            title="রিপোর্টসমূহ"
            onBack={() => handleTabChange("settings")}
          >
            <ReportsPanel user={currentUser!} />
          </AppLayout>
        );
      }

      if (activeTab === "my-subscription") {
        return (
          <AppLayout
            activeTab="subscription"
            {...commonLayoutProps}
            title="আমার সাবস্ক্রিপশন"
            onBack={() => handleTabChange("settings")}
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
            onBack={() => handleTabChange("settings")}
          >
            <SubscriptionView />
          </AppLayout>
        );
      if (activeTab === "user_profile" && selectedUserProfile)
        return (
          <AppLayout
            activeTab="leaderboard"
            {...commonLayoutProps}
            title={
              selectedUserProfile.name
                ? `${selectedUserProfile.name}-এর প্রোফাইল`
                : "শিক্ষার্থীর প্রোফাইল"
            }
            onBack={() => handleTabChange("leaderboard")}
          >
            <UserProfileView
              user={selectedUserProfile}
              currentUser={currentUser}
              rank={selectedUserRank}
              onBack={() => {
                handleTabChange("leaderboard");
              }}
            />
          </AppLayout>
        );
      if (activeTab === "subject_report" && selectedSubjectReport)
        return (
          <AppLayout
            activeTab="dashboard"
            {...commonLayoutProps}
            title={
              selectedSubjectReport
                ? `${BanglaNameHelper.formatSubject(
                    selectedSubjectReport,
                    selectedSubjectReport
                  )} রিপোর্ট`
                : "বিষয়ভিত্তিক রিপোর্ট"
            }
            onBack={() => handleTabChange("dashboard")}
          >
            <SubjectReportView
              subject={selectedSubjectReport}
              history={examHistory}
              onBack={() => handleTabChange("dashboard")}
            />
          </AppLayout>
        );
    }

    // --- Active Exam States ---

    if (appState === AppState.INSTRUCTIONS) {
      if (examDetails) {
        // If we have examDetails, it means we just fetched questions and are about to start.
        // Show loading or skeleton while changing to ACTIVE
        return (
          <AppLayout
            activeTab="dashboard"
            {...commonLayoutProps}
            title="শুরু হচ্ছে..."
          >
            <ResultSkeleton />
          </AppLayout>
        );
      }

      // Otherwise show Pre-Fetch Instructions
      if (pendingConfig) {
        return (
          <ExamInstructionsView
            config={pendingConfig}
            onStart={handleProceedToExam}
            onBack={() => setAppState(AppState.IDLE)}
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
        <AppLayout
          activeTab="dashboard"
          {...commonLayoutProps}
          title="লোড হচ্ছে..."
        >
          <ExamLoadingSkeleton />
        </AppLayout>
      );
    }

    if (isEvaluating) {
      return (
        <AppLayout
          activeTab="dashboard"
          {...commonLayoutProps}
          title="প্রসেসিং..."
        >
          <ResultSkeleton />
        </AppLayout>
      );
    }

    if (appState === AppState.COMPLETED) {
      return (
        <ResultView
          questions={questions}
          userAnswers={userAnswers}
          timeTaken={timeTaken}
          initialBookmarks={flaggedQuestions}
          onRestart={() => {
            setAppState(AppState.IDLE);
            setIsReviewingHistory(false);
            const targetTab = isReviewingHistory ? "history" : "dashboard";
            setActiveTab(targetTab);
            if (typeof window !== "undefined") {
              window.history.pushState(
                { tab: targetTab },
                "",
                "/" + targetTab
              );
            }
          }}
          isDarkMode={theme === "dark"}
          onToggleTheme={toggleTheme}
          isHistoryMode={isReviewingHistory}
          negativeMarking={examDetails?.negativeMarking}
          submissionType={
            examHistory[examHistory.length - 1]?.submissionType === "script"
              ? "script"
              : "digital"
          }
          onDownloadQuestionPaper={() =>
            examDetails && downloadQuestionPaper(examDetails, questions)
          }
          onDownloadResultWithExplanations={() =>
            examDetails && downloadResultWithExplanations(examDetails, questions, userAnswers)
          }
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
            setActiveTab("setup");
            if (typeof window !== "undefined") {
              window.history.pushState({ tab: "setup" }, "", "/setup");
            }
          }}
        />
      );
    }

    if (appState === AppState.ERROR) {
      return (
        <AppLayout activeTab="dashboard" {...commonLayoutProps} title="ত্রুটি">
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-4">
            <h2 className="text-2xl font-bold text-red-600 mb-2">
              ত্রুটি হয়েছে
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {errorDetails}
            </p>
            <button
              onClick={() => setAppState(AppState.IDLE)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg"
            >
              ফিরে যাও
            </button>
          </div>
        </AppLayout>
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
    </>
  );
}
