'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserProfile, ExamResult } from '@/lib/types';
import { createClient } from '@/utils/supabase/client';
import { calculateRadarData, calculateActivityStats } from '@/lib/stats-utils';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';
import { useAuth } from '@/components/auth/AuthProvider';

export interface SubjectStat {
  subject: string;
  examCount: number;
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  lastActivity: string;
}

export interface MonthCalendarDay {
  date: string;
  dayOfMonth: number;
  examCount: number;
  isCurrentMonth: boolean;
}

export interface ProfileData {
  user: UserProfile | null;
  examHistory: ExamResult[];
  subjectStats: SubjectStat[];
  radarData: { subject: string; score: number }[];
  activityData: { name: string; xp: number }[];
  calendarData: MonthCalendarDay[];
  streakCount: number;
  isLoading: boolean;
  error: string | null;
  refetch: (id?: string) => Promise<void>;
}

/**
 * Hook to fetch profile data from Supabase on mount.
 * Cost-friendly: No realtime subscriptions, fetches once on mount.
 *
 * FIX: fetchData now receives targetUserId as an argument rather than
 * reading it from closure — this prevents the race where authLoading
 * flips to false before authUser is set, causing an empty fetch.
 */
export const useProfileData = (userId?: string): ProfileData => {
  const supabase = createClient();
  const { user: authUser, loading: authLoading } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [examHistory, setExamHistory] = useState<ExamResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Stable fetch (userId passed as arg, not from closure) ─────────────────
  const fetchData = useCallback(
    async (targetUserId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user profile
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', targetUserId)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
        } else if (userData) {
          setUser({
            ...userData,
            avatarUrl: userData.avatar_url,
            avatarColor: userData.avatar_color,
            examsTaken: userData.exams_taken || 0,
            streakCount: userData.streak || userData.streak_count || 0,
            lastStreakDate: userData.last_streak_date,
            createdAt: userData.created_at,
            level: userData.level || 'Beginner',
          } as UserProfile);
        }

        // Fetch exam history
        const { data: historyData, error: historyError } = await supabase
          .from('exam_results')
          .select('*')
          .eq('user_id', targetUserId)
          .order('date', { ascending: false });

        if (historyError) {
          console.error('Error fetching exam history:', historyError);
        } else if (historyData) {
          setExamHistory(historyData as ExamResult[]);
        }
      } catch (err) {
        console.error('Profile data fetch error:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load profile data',
        );
      } finally {
        setIsLoading(false);
      }
    },
    // supabase singleton is stable; userId prop changes bust the cache correctly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [supabase, userId],
  );

  // ── Effect: fires once auth resolves — avoids the double-call race ────────
  // Key insight: we watch authUser?.id explicitly instead of wrapping it
  // inside fetchData's closure. This ensures we never fire with a null userId.
  useEffect(() => {
    if (authLoading) return; // wait for auth to finish

    const targetUserId = userId || authUser?.id;
    if (!targetUserId) {
      if (!userId) setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    fetchData(targetUserId);
  }, [authLoading, authUser?.id, userId, fetchData]);

  // ── Derived data (memoised by React per-render) ───────────────────────────
  const subjectStats = calculateSubjectStats(examHistory);
  const radarData = calculateRadarData(examHistory);
  const activityData = calculateActivityStats(examHistory);
  const calendarData = calculateMonthCalendar(examHistory);
  const streakCount = user?.streakCount || 0;

  // Wrap refetch so callers can invoke it with no args (uses current userId)
  const refetch = useCallback(
    (id?: string) => fetchData(id || userId || authUser?.id || ''),
    [fetchData, userId, authUser?.id],
  );

  return {
    user,
    examHistory,
    subjectStats,
    radarData,
    activityData,
    calendarData,
    streakCount,
    isLoading,
    error,
    refetch,
  };
};

// ─── Helper functions ────────────────────────────────────────────────────────

/**
 * Calculate per-subject statistics from exam history.
 * Only includes subjects the user has actually attempted.
 */
function calculateSubjectStats(history: ExamResult[]): SubjectStat[] {
  const statsMap: Record<string, SubjectStat> = {};

  history.forEach((exam) => {
    const subject = getSubjectDisplayName(exam.subjectLabel || exam.subject);

    if (!statsMap[subject]) {
      statsMap[subject] = {
        subject,
        examCount: 0,
        totalQuestions: 0,
        correctCount: 0,
        accuracy: 0,
        lastActivity: exam.date,
      };
    }

    statsMap[subject].examCount += 1;
    statsMap[subject].totalQuestions += exam.totalQuestions;
    statsMap[subject].correctCount += exam.correctCount;

    if (new Date(exam.date) > new Date(statsMap[subject].lastActivity)) {
      statsMap[subject].lastActivity = exam.date;
    }
  });

  return Object.values(statsMap).map((stat) => ({
    ...stat,
    accuracy:
      stat.totalQuestions > 0
        ? Math.round((stat.correctCount / stat.totalQuestions) * 100)
        : 0,
  }));
}

/**
 * Calculate calendar data for current month, week-wise display.
 */
function calculateMonthCalendar(history: ExamResult[]): MonthCalendarDay[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const examCountByDate: Record<string, number> = {};
  history.forEach((exam) => {
    const dateStr = new Date(exam.date).toISOString().split('T')[0];
    examCountByDate[dateStr] = (examCountByDate[dateStr] || 0) + 1;
  });

  const days: MonthCalendarDay[] = [];

  const firstDayOfWeek = firstDay.getDay();
  for (let i = 0; i < firstDayOfWeek; i++) {
    const paddingDate = new Date(year, month, -firstDayOfWeek + i + 1);
    const dateStr = paddingDate.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      dayOfMonth: paddingDate.getDate(),
      examCount: examCountByDate[dateStr] || 0,
      isCurrentMonth: false,
    });
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      dayOfMonth: d,
      examCount: examCountByDate[dateStr] || 0,
      isCurrentMonth: true,
    });
  }

  const lastDayOfWeek = lastDay.getDay();
  for (let i = 1; i < 7 - lastDayOfWeek; i++) {
    const paddingDate = new Date(year, month + 1, i);
    const dateStr = paddingDate.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      dayOfMonth: paddingDate.getDate(),
      examCount: examCountByDate[dateStr] || 0,
      isCurrentMonth: false,
    });
  }

  return days;
}

export default useProfileData;
