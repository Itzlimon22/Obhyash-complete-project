'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

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

// Components - Layout & Common
import AppLayout from '@/components/student/ui/layout/AppLayout';
import TimeoutModal from '@/components/student/ui/TimeoutModal';
import { toast } from 'sonner';
import { celebration } from '@/lib/confetti';
import StreakCelebration from '@/components/student/ui/common/StreakCelebration';

// Features
import Dashboard from '@/components/student/features/dashboard/Dashboard';
import SubjectReportView from '@/components/student/features/dashboard/SubjectReportView';
import LeaderboardView from '@/components/student/features/dashboard/LeaderboardView';
import UserProfileView from '@/components/student/features/dashboard/UserProfileView';
import { ComplaintView } from '@/components/student/features/complaint/ComplaintView';
import AnalysisView from '@/components/student/features/dashboard/AnalysisView';
import { PracticeDashboard } from '@/components/student/features/practice/PracticeDashboard';
import NotificationsView from '@/components/student/features/notifications/NotificationsView';

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
import ExamHistoryView from '@/components/student/ui/ExamHistoryView';
import ResultView from '@/components/student/ui/ResultView';
import ResultSkeleton from '@/components/student/ui/results/ResultSkeleton';

interface StudentRootProps {
  user: UserProfile;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout: () => void;
}

export default function StudentRoot({
  user: initialUser,
  theme,
  toggleTheme,
  onLogout,
}: StudentRootProps) {
  const engine = useExamEngine();
  const supabase = createClient();

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
      if (success) {
        beginTimer();
      } else {
        // This usually falls into AppState.ERROR, but engine might throw specifically
        toast.error(
          'দুঃখিত, কোনো প্রশ্ন পাওয়া যায়নি। অন্য টপিক নির্বাচন করুন।',
          {
            description: 'No questions found for the selected criteria.',
          },
        );
      }

      return success;
    } catch (e: any) {
      console.error('Exam start failed', e);
      const isNoQuestions = e.message?.includes('No questions found');

      toast.error(
        isNoQuestions
          ? 'দুঃখিত, কোনো প্রশ্ন পাওয়া যায়নি। অন্য টপিক নির্বাচন করুন।'
          : 'পরীক্ষা শুরু করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।',
        {
          description: e.message || 'Unknown error starting exam',
        },
      );
      return false;
    }
  };

  // Global User State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    initialUser,
  );

  // Pending Config for Pre-Fetch Instructions
  const [pendingConfig, setPendingConfig] = useState<ExamConfig | null>(null);

  // Streak Celebration State
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [newStreakCount, setNewStreakCount] = useState(0);

  // Sync prop user to state
  useEffect(() => {
    if (initialUser) setCurrentUser(initialUser);
  }, [initialUser]);

  // Streak System Check - Consolidated with initial load logic
  useEffect(() => {
    let isMounted = true;

    const handleStreakAndHistory = async () => {
      if (!currentUser?.id) return;

      try {
        // 1. Streak Check
        const { checkAndUpdateStreak } =
          await import('@/services/streak-service');
        const updatedUser = await checkAndUpdateStreak(currentUser);

        if (updatedUser && isMounted) {
          // If streak incremented, show celebration
          if ((updatedUser.streakCount || 0) > (currentUser.streakCount || 0)) {
            setNewStreakCount(updatedUser.streakCount || 0);
            setShowStreakCelebration(true);
          }
          setCurrentUser(updatedUser);
        }

        // 2. Fetch History
        const { getExamHistory } = await import('@/services/database');
        const dbHistory = await getExamHistory();
        if (dbHistory && dbHistory.length > 0 && isMounted) {
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
  }, [currentUser?.id]);

  // Navigation State
  const [isReviewingHistory, setIsReviewingHistory] = useState(false);
  const [selectedSubjectReport, setSelectedSubjectReport] = useState<
    string | null
  >(null);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
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
              history={examHistory}
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
              onClearHistory={() => {
                setExamHistory([]);
                localStorage.removeItem('obhyash_exam_history');
              }}
              onViewResult={(res) => {
                setQuestions(res.questions || []);
                setUserAnswers(res.userAnswers || {});
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
              onUserClick={(user) => {
                setSelectedUserProfile(user);
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
              rank={0}
              history={examHistory}
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
            examDetails={examDetails}
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

    if (isEvaluating || appState === AppState.LOADING) {
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
              className="px-6 py-2 bg-rose-600 text-white rounded-lg"
            >
              ফিরে যান
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
    </>
  );
}
