'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Types & Services
import { UserProfile, AppState, ExamConfig, ExamResult } from '@/lib/types';
import {
  printQuestionPaper,
  printResultWithExplanations,
} from '@/services/print-service';
import { updateUserProfile } from '@/services/database';
import { calculateLevel } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';

// Hooks
import { useExamEngine } from '@/hooks/use-exam-engine';
import { useBookmarks } from '@/hooks/use-bookmarks';
import { useSessionMonitor } from '@/hooks/use-session-monitor';

// Components - Layout & Common
import AppLayout from '@/components/student/ui/layout/AppLayout';
import TimeoutModal from '@/components/student/ui/TimeoutModal';
import { toast } from 'sonner';
import { celebration } from '@/lib/confetti';
import StreakCelebration from '@/components/student/ui/common/StreakCelebration';

// Features
import Dashboard from '@/components/student/features/dashboard/Dashboard';
import ExamTargetModal from '@/components/student/features/dashboard/ExamTargetModal';
import {
  getDailyCompletions,
  incrementDailyCompletions,
} from '@/components/student/features/dashboard/DailyGoalCard';
import SubjectReportView from '@/components/student/features/dashboard/SubjectReportView';
import LeaderboardView from '@/components/student/features/dashboard/LeaderboardView';
import UserProfileView from '@/components/student/features/dashboard/UserProfileView';
import { ComplaintView } from '@/components/student/features/complaint/ComplaintView';
import AnalysisView from '@/components/student/features/dashboard/AnalysisView';
import { PracticeDashboard } from '@/components/student/features/practice/PracticeDashboard';
import NotificationsView from '@/components/student/features/notifications/NotificationsView';
import StudentReportView from '@/components/student/features/reports/StudentReportView';

// Profile Features
import MyProfileView from '@/components/student/ui/profile/MyProfileView';
import SubscriptionView from '@/components/student/ui/profile/SubscriptionView';
import SettingsView from '@/components/student/ui/profile/SettingsView';
import AboutUsView from '@/components/student/ui/profile/AboutUsView';

// Exam Features
import { ExamSetupContainer } from '@/components/student/features/exam/setup/ExamSetupContainer';
// import InstructionsView from '@/components/student/ui/InstructionsView'; // Deprecated in new flow
import { ExamInstructionsView } from '@/components/student/features/exam/ExamInstructionsView';
import ExamRunner from '@/components/student/features/exam/ExamRunner';

// History & Results
import ExamHistoryView from '@/components/student/features/history/ExamHistoryView';
import ResultView from '@/components/student/ui/ResultView';
import ResultSkeleton from '@/components/student/ui/results/ResultSkeleton';
import ExamLoadingSkeleton from '@/components/student/ui/exam/ExamLoadingSkeleton';

interface StudentRootProps {
  user: UserProfile;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
  subjects?: { id: string; name: string; [key: string]: unknown }[];
}

import { useAuth } from '@/components/auth/AuthProvider';
import InitialLoader from '@/components/student/ui/InitialLoader';

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
  const supabase = createClient();
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
      // Manually set to INSTRUCTIONS to show the rule page
      // Engine is still IDLE or pre-loading, but we want to show instructions first.
      // We rely on checking !examDetails to know it's pre-fetch.
      setAppState(AppState.INSTRUCTIONS);
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
          'দুঃখিত, কোনো প্রশ্ন পাওয়া যায়নি। অন্য টপিক নির্বাচন করো।',
          {
            description: 'No questions found for the selected criteria.',
          },
        );
      }

      return success;
    } catch (e: unknown) {
      console.error('Exam start failed', e);
      const errorMessage =
        typeof e === 'object' && e !== null && 'message' in e
          ? String((e as { message?: string }).message)
          : 'Unknown error starting exam';
      const isNoQuestions = errorMessage.includes('No questions found');

      toast.error(
        isNoQuestions
          ? 'দুঃখিত, কোনো প্রশ্ন পাওয়া যায়নি। অন্য টপিক নির্বাচন করো।'
          : 'পরীক্ষা শুরু করতে সমস্যা হয়েছে। আবার চেষ্টা করো।',
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
    'dashboard',
    'setup',
    'history',
    'practice',
    'leaderboard',
    'analysis',
    'complaint',
    'notifications',
    'about',
    'my-reports',
    'subscription',
    'profile',
    'settings',
  ];

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      // Allow loading initial tab based on the URL (e.g. /practice -> practice)
      const path = window.location.pathname.replace(/^\//, '');
      if (validTabs.includes(path)) return path;
      return sessionStorage.getItem('obhyash_active_tab') || 'dashboard';
    }
    return 'dashboard';
  });

  // Local state to track user updates (XP, level) that happen during session
  // Initialize with the most reliable source
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    effectiveUser,
  );

  // Pending Config for Pre-Fetch Instructions
  const [pendingConfig, setPendingConfig] = useState<ExamConfig | null>(null);

  // ── Centralised bookmark state (decoupled from exam flags) ─────────────────
  const {
    bookmarkedIds,
    isBookmarked,
    toggle: toggleBookmark,
  } = useBookmarks(currentUser?.id, authLoading);

  // Streak Celebration State
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [newStreakCount, setNewStreakCount] = useState(0);

  // Exam Target Modal + Daily Goal
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [dailyCompletions, setDailyCompletions] = useState(0);
  const hasCheckedExamTarget = useRef(false);

  // Sync with AuthProvider updates
  useEffect(() => {
    if (authProfile) {
      setCurrentUser(authProfile);
    } else if (initialUser && !currentUser) {
      setCurrentUser(initialUser);
    }
  }, [authProfile, initialUser]);

  // Show exam target modal once per session if not set
  useEffect(() => {
    if (!authLoading && currentUser && !hasCheckedExamTarget.current) {
      hasCheckedExamTarget.current = true;
      if (!currentUser.exam_target) {
        setShowTargetModal(true);
      }
    }
  }, [authLoading, currentUser?.id]);

  // Load daily completions from localStorage
  useEffect(() => {
    if (currentUser?.id) {
      setDailyCompletions(getDailyCompletions(currentUser.id));
    }
  }, [currentUser?.id]);

  // Streak System Check - Uses localStorage guard to run ONCE per calendar day
  useEffect(() => {
    let isMounted = true;

    // Do not initiate DB calls until auth initialization completes to avoid Supabase JS deadlock
    if (authLoading || !currentUser?.id) return;

    const handleStreakAndHistory = async () => {
      try {
        // ✅ Immediately compute the display streak from existing data
        // This prevents stale streak showing in header before async check runs
        const { getDisplayStreak } = await import('@/services/streak-service');
        const displayStreak = getDisplayStreak(currentUser);
        if (isMounted && displayStreak !== (currentUser.streakCount || 0)) {
          setCurrentUser((prev) =>
            prev ? { ...prev, streakCount: displayStreak } : prev,
          );
        }

        // ✅ localStorage guard: use LOCAL date (matching streak-service logic)
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const streakKey = `streak_checked_${currentUser.id}`;
        const lastCheckedDate = localStorage.getItem(streakKey);

        if (lastCheckedDate !== today) {
          // ✅ Set guard IMMEDIATELY (optimistic lock) — prevents race on fast refreshes
          localStorage.setItem(streakKey, today);

          const { checkAndUpdateStreak } =
            await import('@/services/streak-service');
          const updatedUser = await checkAndUpdateStreak(currentUser);

          if (updatedUser && isMounted) {
            setNewStreakCount(updatedUser.streakCount || 0);
            setShowStreakCelebration(true);
            setCurrentUser(updatedUser);
          }
        }

        // 2. Fetch History (always, regardless of streak)
        const { getExamHistory } = await import('@/services/database');
        const dbHistory = await getExamHistory();
        if (dbHistory && isMounted) {
          setExamHistory(dbHistory);
        }
      } catch (err) {
        console.error('Error in streak/history sync:', err);
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
      const raw = localStorage.getItem('obhyash_exam_draft');
      if (!raw) return;

      const draft = JSON.parse(raw);
      const age = Date.now() - (draft.savedAt || 0);
      const THREE_HOURS = 3 * 60 * 60 * 1000;

      if (age > THREE_HOURS) {
        localStorage.removeItem('obhyash_exam_draft');
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
            label: '↩ চালিয়ে যাও',
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
                toast.success('পরীক্ষা পুনরুদ্ধার হয়েছে!');
              } catch {
                toast.error('পরীক্ষা পুনরুদ্ধার করতে ব্যর্থ');
                localStorage.removeItem('obhyash_exam_draft');
              }
            },
          },
        },
      );
    } catch {
      localStorage.removeItem('obhyash_exam_draft');
    }
  }, []);

  // Wrong answer retry handler
  const handleRetryWrongAnswers = useCallback(
    (wrongQuestions: import('@/lib/types').Question[]) => {
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
    action: 'tab' | 'logout';
  }>({ isOpen: false, targetTab: null, action: 'tab' });
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
    const newCount = incrementDailyCompletions(currentUser.id);
    setDailyCompletions(newCount);

    // Provide feedback & Celebrations
    if (newLevel !== oldLevel) {
      celebration.levelUp();
      toast.success(`অভিনন্দন! আপনি ${newLevel}-এ উন্নীত হয়েছেন!`, {
        description: `আপনার বর্তমান XP: ${updatedUser.xp}`,
        duration: 8000,
      });
    } else if (isPerfect) {
      toast.success('অসাধারন! আপনি পারফেক্ট স্কোর করেছেন।', {
        description: `আপনি +${totalXpGained} XP অর্জন করেছেন! (বোনাস সহ)`,
      });
    } else {
      toast.success('পরীক্ষা সম্পন্ন হয়েছে!', {
        description: `আপনি +${totalXpGained} XP অর্জন করেছেন।`,
      });
    }
  };

  useEffect(() => {
    if (appState === AppState.COMPLETED && !isReviewingHistory) {
      const latestResult = examHistory[examHistory.length - 1];
      if (latestResult && currentUser) {
        handleExamComplete(latestResult);
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
      localStorage.setItem('obhyash_exam_draft', JSON.stringify(draft));
    }
  }, [userAnswers, flaggedQuestions, appState]);

  // Clear draft when exam completes or goes back to idle
  useEffect(() => {
    if (appState === AppState.COMPLETED || appState === AppState.IDLE) {
      localStorage.removeItem('obhyash_exam_draft');
    }
  }, [appState]);

  // Handle Profile Updates
  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    if (!currentUser) return;
    const newUser = { ...currentUser, ...updatedData };
    setCurrentUser(newUser);

    const result = await updateUserProfile(newUser);

    if (result.success) {
      console.log('✅ Profile updated successfully');
      // Success is already shown in SettingsView
    } else {
      console.error('❌ Profile update failed:', result.error);
      alert(`প্রোফাইল আপডেট করতে সমস্যা: ${result.error}`);
    }

    setActiveTab('profile');
  };

  // Navigation Logic
  const handleTabChange = (tab: string) => {
    if (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) {
      setNavWarning({ isOpen: true, targetTab: tab, action: 'tab' });
    } else {
      if (appState === AppState.COMPLETED) {
        setAppState(AppState.IDLE);
        setIsReviewingHistory(false);
      }

      // if (tab === 'complaint') ... removed to allow internal navigation

      setActiveTab(tab);
      sessionStorage.setItem('obhyash_active_tab', tab);
      if (typeof window !== 'undefined' && validTabs.includes(tab)) {
        window.history.pushState(null, '', '/' + tab);
      }
    }
  };

  const handleLogoutClick = async () => {
    if (appState === AppState.ACTIVE || appState === AppState.GRACE_PERIOD) {
      setNavWarning({ isOpen: true, targetTab: null, action: 'logout' });
    } else {
      onLogout();
    }
  };

  const confirmNavigation = async () => {
    setAppState(AppState.IDLE);
    if (navWarning.action === 'tab' && navWarning.targetTab) {
      setActiveTab(navWarning.targetTab);
    } else if (navWarning.action === 'logout') {
      onLogout();
    }
    setNavWarning({ isOpen: false, targetTab: null, action: 'tab' });
  };

  const commonLayoutProps = {
    user: currentUser || undefined,
    onTabChange: handleTabChange,
    onLogout: handleLogoutClick,
    toggleTheme: toggleTheme,
    isDarkMode: theme === 'dark',
  };

  const handleExamSubmit = async (manual = true) => {
    await submitExam(manual);
  };

  if (authLoading && !effectiveUser) return <InitialLoader />;

  if (!currentUser) return null; // Should not happen if page handles loading

  // --- Routing Logic ---

  const renderApp = () => {
    if (appState === AppState.IDLE) {
      if (activeTab === 'dashboard') {
        return (
          <AppLayout activeTab={activeTab} {...commonLayoutProps}>
            <Dashboard
              user={currentUser}
              onMockExamClick={() => setActiveTab('setup')}
              onHistoryClick={() => setActiveTab('history')}
              onSubjectClick={(subject) => {
                setSelectedSubjectReport(subject);
                setActiveTab('subject_report');
              }}
              onLeaderboardClick={() => setActiveTab('leaderboard')}
              onAnalysisClick={() => setActiveTab('analysis')}
              onPracticeClick={() => handleTabChange('practice')}
              onBlogClick={() => router.push('/blog')}
              history={examHistory}
              examTarget={currentUser.exam_target}
              completedToday={dailyCompletions}
              onChangeTarget={() => setShowTargetModal(true)}
            />
          </AppLayout>
        );
      }

      if (activeTab === 'setup') {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="নতুন পরীক্ষা"
          >
            <ExamSetupContainer
              onStartExam={handleStartExam}
              isLoading={false}
            />
          </AppLayout>
        );
      }

      if (activeTab === 'history') {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="ইতিহাস"
          >
            <ExamHistoryView
              history={examHistory}
              onBack={() => setActiveTab('dashboard')}
              onClearHistory={async () => {
                const { clearExamHistory } =
                  await import('@/services/database');
                const success = await clearExamHistory();
                if (success) {
                  setExamHistory([]);
                  toast.success('ইতিহাস মুছে ফেলা হয়েছে');
                } else {
                  toast.error('ইতিহাস মুছতে সমস্যা হয়েছে');
                }
              }}
              onViewResult={(res) => {
                setQuestions(res.questions || []);
                setUserAnswers(res.userAnswers || {});
                setFlaggedQuestions(new Set(res.flaggedQuestions || [])); // Hydrate bookmarks
                setExamDetails({
                  subject: res.subject,
                  subjectLabel: res.subjectLabel || res.subject,
                  examType: res.examType || '',
                  chapters: '',
                  topics: '',
                  totalQuestions: res.totalQuestions,
                  durationMinutes: 0,
                  totalMarks: res.totalMarks,
                  negativeMarking: res.negativeMarking,
                });
                setTimeTaken(res.timeTaken);
                setIsReviewingHistory(true);
                setAppState(AppState.COMPLETED);
              }}
              onRecheckRequest={(id) => alert('Recheck requested for: ' + id)}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={toggleBookmark}
            />
          </AppLayout>
        );
      }

      if (activeTab === 'leaderboard') {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="লিডারবোর্ড"
          >
            <LeaderboardView
              onUserClick={(user: UserProfile, rank: number) => {
                setSelectedUserProfile(user);
                setSelectedUserRank(rank || 0);
                setActiveTab('user_profile');
              }}
            />
          </AppLayout>
        );
      }

      if (activeTab === 'profile') {
        return (
          <AppLayout activeTab="" {...commonLayoutProps} title="আমার প্রোফাইল">
            <MyProfileView
              user={currentUser!}
              history={examHistory}
              onEditProfile={() => setActiveTab('settings')}
              onSubjectClick={(subject) => {
                setSelectedSubjectReport(subject);
                setActiveTab('subject_report');
              }}
              onViewNotifications={() => setActiveTab('notifications')}
            />
          </AppLayout>
        );
      }

      if (activeTab === 'settings') {
        return (
          <AppLayout activeTab="" {...commonLayoutProps} title="সেটিংস">
            <SettingsView user={currentUser!} onSave={handleProfileUpdate} />
          </AppLayout>
        );
      }

      if (activeTab === 'practice') {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="অনুশীলন"
          >
            <PracticeDashboard
              history={examHistory}
              onStartPractice={startCustomExam}
              onNavigateToMock={() => setActiveTab('setup')}
              subjects={subjects.map((s) => s.id)}
              currentUser={currentUser}
            />
          </AppLayout>
        );
      }

      if (activeTab === 'analysis') {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="এনালাইসিস"
          >
            <AnalysisView
              history={examHistory}
              onSubjectClick={(subject) => {
                setSelectedSubjectReport(subject);
                setActiveTab('subject_report');
              }}
            />
          </AppLayout>
        );
      }

      if (activeTab === 'complaint') {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="অভিযোগ ও পরামর্শ"
          >
            <ComplaintView />
          </AppLayout>
        );
      }

      if (activeTab === 'notifications') {
        return (
          <AppLayout activeTab="" {...commonLayoutProps} title="নোটিফিকেশন">
            <NotificationsView />
          </AppLayout>
        );
      }

      if (activeTab === 'about') {
        return (
          <AppLayout
            activeTab=""
            {...commonLayoutProps}
            title="আমাদের সম্পর্কে"
          >
            <AboutUsView />
          </AppLayout>
        );
      }

      if (activeTab === 'my-reports') {
        return (
          <AppLayout
            activeTab={activeTab}
            {...commonLayoutProps}
            title="আমার রিপোর্ট"
          >
            <StudentReportView user={currentUser!} />
          </AppLayout>
        );
      }

      if (activeTab === 'subscription')
        return (
          <AppLayout activeTab="" {...commonLayoutProps} title="সাবস্ক্রিপশন">
            <SubscriptionView />
          </AppLayout>
        );
      if (activeTab === 'user_profile' && selectedUserProfile)
        return (
          <AppLayout
            activeTab="leaderboard"
            {...commonLayoutProps}
            title="প্রোফাইল"
          >
            <UserProfileView
              user={selectedUserProfile}
              currentUser={currentUser}
              rank={selectedUserRank}
              onBack={() => setActiveTab('leaderboard')}
            />
          </AppLayout>
        );
      if (activeTab === 'subject_report' && selectedSubjectReport)
        return (
          <AppLayout
            activeTab="dashboard"
            {...commonLayoutProps}
            title="রিপোর্ট"
          >
            <SubjectReportView
              subject={selectedSubjectReport}
              history={examHistory}
              onBack={() => setActiveTab('dashboard')}
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
          <AppLayout
            activeTab="setup"
            {...commonLayoutProps}
            title="নির্দেশাবলী"
          >
            <ExamInstructionsView
              config={pendingConfig}
              onStart={handleProceedToExam}
              onBack={() => setAppState(AppState.IDLE)}
            />
          </AppLayout>
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
            graceTimeLeft={graceTimeLeft}
            isOmrMode={isOmrMode}
            setIsOmrMode={setIsOmrMode}
            selectedScript={selectedScript}
            setSelectedScript={setSelectedScript}
            onSubmit={handleExamSubmit}
            onExit={() =>
              setNavWarning({
                isOpen: true,
                targetTab: 'dashboard',
                action: 'tab',
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
            isDarkMode={theme === 'dark'}
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
        <AppLayout
          activeTab="results"
          onTabChange={handleTabChange}
          onLogout={handleLogoutClick}
          toggleTheme={toggleTheme}
          isDarkMode={theme === 'dark'}
          title="ফলাফল"
          user={currentUser!}
        >
          <ResultView
            questions={questions}
            userAnswers={userAnswers}
            timeTaken={timeTaken}
            initialBookmarks={flaggedQuestions} // Pass the hydrated bookmarks
            onRestart={() => {
              setAppState(AppState.IDLE);
              setIsReviewingHistory(false);
            }}
            isDarkMode={theme === 'dark'}
            onToggleTheme={toggleTheme}
            isHistoryMode={isReviewingHistory}
            negativeMarking={examDetails?.negativeMarking}
            submissionType={
              isOmrMode ||
              examHistory[examHistory.length - 1]?.submissionType === 'script'
                ? 'script'
                : 'digital'
            }
            onDownloadQuestionPaper={() =>
              examDetails && printQuestionPaper(examDetails, questions)
            }
            onDownloadResultWithExplanations={() =>
              examDetails &&
              printResultWithExplanations(examDetails, questions, userAnswers)
            }
            currentUser={currentUser}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={toggleBookmark}
            examDetails={examDetails ?? undefined}
            onRetryWrongAnswers={
              isReviewingHistory ? undefined : handleRetryWrongAnswers
            }
          />
        </AppLayout>
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
    </>
  );
}
