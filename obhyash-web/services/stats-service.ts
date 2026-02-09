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
    try {
      // Select safe columns from public view
      const { data, error } = await supabase
        .from('public_profiles')
        .select(
          'id, name, institute, xp, level, exams_taken, avatar_url, avatar_color',
        )
        .eq('level', level)
        .order('xp', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching leaderboard users:', error);
        throw error;
      }

      if (data) {
        // Transform database snake_case to UserProfile camelCase
        return data.map((user, index) => ({
          id: user.id,
          name: user.name || 'Unknown User',
          institute: user.institute || 'Unknown Institute',
          xp: user.xp || 0,
          level: user.level || level,
          examsTaken: user.exams_taken || 0,
          avatarUrl: user.avatar_url || undefined,
          avatarColor: user.avatar_color || generateAvatarColor(index),
        }));
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard users:', error);
    }
  }

  // Return empty array if database is not configured or query fails
  console.warn(
    'Leaderboard: Database not configured or query failed, returning empty array',
  );
  return [];
};

export const getLevelUserCounts = async (): Promise<Record<string, number>> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Use the RPC function we created in the SQL script
      const { data, error } = await supabase.rpc('get_level_user_counts');

      if (error) {
        console.error('Error fetching level counts:', error);
        throw error;
      }

      if (data) {
        // Convert array of {level, user_count} to Record<string, number>
        const counts: Record<string, number> = {};
        data.forEach((item: { level: string; user_count: number }) => {
          counts[item.level] = item.user_count;
        });

        // Ensure all levels exist in the result, even if count is 0
        LEVELS.forEach((l: (typeof LEVELS)[number]) => {
          if (!(l.id in counts)) {
            counts[l.id] = 0;
          }
        });

        return counts;
      }
    } catch (error) {
      console.error('Failed to fetch level counts:', error);
    }
  }

  // Return empty counts if database is not configured
  console.warn('Leaderboard: Database not configured, returning zero counts');
  const counts: Record<string, number> = {};
  LEVELS.forEach((l: (typeof LEVELS)[number]) => {
    counts[l.id] = 0;
  });
  return counts;
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
