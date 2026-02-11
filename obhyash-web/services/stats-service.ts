import { UserProfile, ExamResult, Question } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';
import { LEVELS } from '@/components/dashboard/leaderboard/leaderboardData';

// --- TYPES ---
export interface SubjectAnalysis {
  totalQuestions: number;
  correct: number;
  wrong: number;
  skipped: number;
  accuracy: number;
  averageTime: number;
  chapterPerformance: {
    name: string;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  mistakes: {
    question: Question;
    examDate: string;
    examName: string;
    userAns: number;
    correctAns: number;
  }[];
}

export interface OverallAnalytics {
  totalExams: number;
  avgScore: number;
  avgAccuracy: number;
  totalTime: number;
  timelineData: { name: string; score: number; fullDate: string }[];
  subjectData: {
    name: string;
    correct: number;
    wrong: number;
    skipped: number;
    total: number;
  }[];
}

// Helper function to generate avatar colors
const generateAvatarColor = (index: number): string => {
  const colors = [
    'bg-fuchsia-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-indigo-600',
    'bg-rose-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-slate-500',
    'bg-blue-500',
    'bg-cyan-500',
  ];
  return colors[index % colors.length];
};

export const getLeaderboardUsers = async (
  level: string,
): Promise<UserProfile[]> => {
  if (isSupabaseConfigured() && supabase) {
    const mapUsers = (data: any[], fallbackLevel: string): UserProfile[] =>
      data.map((user, index) => ({
        id: user.id,
        name: user.name || 'Unknown User',
        institute: user.institute || 'Unknown Institute',
        xp: user.xp || 0,
        level: user.level || fallbackLevel,
        examsTaken: user.exams_taken || 0,
        avatarUrl: user.avatar_url || undefined,
        avatarColor: user.avatar_color || generateAvatarColor(index),
        streakCount: user.streak || 0,
      }));

    try {
      // Try querying with role filter (requires public_profiles to have 'role' column)
      const { data, error } = await supabase
        .from('public_profiles')
        .select(
          'id, name, institute, xp, level, exams_taken, avatar_url, avatar_color, streak, role',
        )
        .eq('level', level)
        .ilike('role', 'student')
        .order('xp', { ascending: false })
        .limit(100);

      if (!error && data) {
        return mapUsers(data, level);
      }

      // If the query failed (likely 'role' column missing from view), try without role
      console.warn(
        'Leaderboard: Query with role filter failed, retrying without role filter:',
        error?.message,
      );

      const { data: fallbackData, error: fallbackError } = await supabase
        .from('public_profiles')
        .select(
          'id, name, institute, xp, level, exams_taken, avatar_url, avatar_color, streak',
        )
        .eq('level', level)
        .order('xp', { ascending: false })
        .limit(100);

      if (fallbackError) {
        console.error(
          'Error fetching leaderboard users (fallback):',
          fallbackError,
        );
        throw fallbackError;
      }

      if (fallbackData) {
        return mapUsers(fallbackData, level);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard users:', error);
    }
  }

  console.warn(
    'Leaderboard: Database not configured or query failed, returning empty array',
  );
  return [];
};

export const getLevelUserCounts = async (): Promise<Record<string, number>> => {
  const zeroCounts = (): Record<string, number> => {
    const counts: Record<string, number> = {};
    LEVELS.forEach((l: (typeof LEVELS)[number]) => {
      counts[l.id] = 0;
    });
    return counts;
  };

  if (isSupabaseConfigured() && supabase) {
    try {
      // Try the RPC function first
      const { data, error } = await supabase.rpc('get_level_user_counts');

      if (!error && data) {
        const counts: Record<string, number> = {};
        data.forEach((item: { level: string; user_count: number }) => {
          // Normalize 'Beginner' to 'Rookie' for display
          const levelKey = item.level === 'Beginner' ? 'Rookie' : item.level;
          counts[levelKey] = (counts[levelKey] || 0) + item.user_count;
        });

        LEVELS.forEach((l: (typeof LEVELS)[number]) => {
          if (!(l.id in counts)) {
            counts[l.id] = 0;
          }
        });

        return counts;
      }

      // RPC failed — fall back to counting from public_profiles directly
      console.warn(
        'Leaderboard: RPC get_level_user_counts failed, falling back to direct query:',
        error?.message,
      );

      const { data: profilesData, error: profilesError } = await supabase
        .from('public_profiles')
        .select('level');

      if (!profilesError && profilesData) {
        const counts = zeroCounts();
        profilesData.forEach((row: { level: string | null }) => {
          if (row.level) {
            const levelKey = row.level === 'Beginner' ? 'Rookie' : row.level;
            if (levelKey in counts) {
              counts[levelKey]++;
            }
          }
        });
        return counts;
      }

      console.error('Error fetching level counts (fallback):', profilesError);
    } catch (error) {
      console.error('Failed to fetch level counts:', error);
    }
  }

  console.warn('Leaderboard: Database not configured, returning zero counts');
  return zeroCounts();
};

// --- ANALYTICS SERVICE ---

// --- ANALYTICS SERVICE ---

export const getSubjectAnalysis = async (
  userId: string, // Now requires userId
  subject: string,
  timeFilter: 'all' | 'month' | 'week',
): Promise<SubjectAnalysis> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.rpc('get_subject_analytics', {
      p_user_id: userId,
      p_subject: subject,
      p_time_filter: timeFilter,
    });

    if (!error && data) {
      return data as SubjectAnalysis;
    } else {
      console.error('RPC Error (Subject Analysis):', error);
    }
  }

  // Fallback / Empty state
  return {
    totalQuestions: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    accuracy: 0,
    averageTime: 0,
    chapterPerformance: [],
    mistakes: [],
  };
};

export const getOverallAnalytics = async (
  userId: string, // Now requires userId
  timeFilter: 'all' | 'month' | 'week',
): Promise<OverallAnalytics> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase.rpc('get_overall_analytics', {
      p_user_id: userId,
      p_time_filter: timeFilter,
    });

    if (!error && data) {
      // Ensure defaults if JSON is partial
      return {
        totalExams: data.totalExams || 0,
        avgScore: data.avgScore || 0,
        avgAccuracy: data.avgAccuracy || 0,
        totalTime: data.totalTime || 0,
        timelineData: data.timelineData || [],
        subjectData: data.subjectData || [],
      };
    } else {
      console.error('RPC Error (Overall Analytics):', error);
    }
  }

  return {
    totalExams: 0,
    avgScore: 0,
    avgAccuracy: 0,
    totalTime: 0,
    timelineData: [],
    subjectData: [],
  };
};
// ... existing code ...

export const getTeacherStats = async (
  authorEmailOrName: string, // Match how questions.author is stored
): Promise<{
  totalQuestions: number;
  approved: number;
  pending: number;
  rejected: number;
}> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // We can use the getQuestionCount service we just updated, or do a direct aggregation
      // Direct aggregation might be faster if we want all statuses at once
      const { data, error } = await supabase
        .from('questions')
        .select('status')
        .eq('author', authorEmailOrName);

      if (error) throw error;

      const stats = {
        totalQuestions: data?.length || 0,
        approved: data?.filter((q) => q.status === 'Approved').length || 0,
        pending: data?.filter((q) => q.status === 'Pending').length || 0,
        rejected: data?.filter((q) => q.status === 'Rejected').length || 0,
      };

      return stats;
    } catch (error) {
      console.error('Failed to fetch teacher stats:', error);
    }
  }

  return {
    totalQuestions: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  };
};
