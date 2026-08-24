import { supabase, isSupabaseConfigured } from './core';
import { Question } from '@/lib/types';

export interface SpacedRepetitionStats {
  box1_count: number;
  box2_count: number;
  box3_count: number;
  box4_count: number;
  box5_count: number;
  due_today_count: number;
  total_tracked: number;
  mastered_count: number;
}

export interface SpacedRepetitionSessionResult {
  success: boolean;
  total_answered: number;
  correct_count: number;
  accuracy: number;
  xp_earned: number;
  is_perfect_score: boolean;
  mystery_gift?: string | null;
  promoted_count: number;
  demoted_count: number;
  stats_before: SpacedRepetitionStats;
  stats_after: SpacedRepetitionStats;
}

/**
 * Fetch 10 Due Questions for Today's Spaced Repetition Session
 */
export async function getDueRevisionQuestions(limit = 10): Promise<Question[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) return [];

    const { data, error } = await supabase.rpc('get_due_spaced_repetition_questions', {
      p_user_id: session.user.id,
      p_limit: limit,
    });

    if (error) {
      console.warn('get_due_spaced_repetition_questions error, falling back to random fetch:', error);
      const { data: fallbackQuestions } = await supabase
        .from('questions')
        .select('*')
        .eq('status', 'Approved')
        .limit(limit);
      return (fallbackQuestions || []) as unknown as Question[];
    }

    return (data || []) as unknown as Question[];
  } catch (err) {
    console.error('getDueRevisionQuestions failed:', err);
    return [];
  }
}

/**
 * Fetch User's 5-Box Leitner Memory Mastery Stats
 */
export async function getSpacedRepetitionStats(userId?: string): Promise<SpacedRepetitionStats> {
  const fallbackStats: SpacedRepetitionStats = {
    box1_count: 0,
    box2_count: 0,
    box3_count: 0,
    box4_count: 0,
    box5_count: 0,
    due_today_count: 0,
    total_tracked: 0,
    mastered_count: 0,
  };

  if (!isSupabaseConfigured()) return fallbackStats;

  try {
    let targetUserId = userId;
    if (!targetUserId) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      targetUserId = session?.user?.id;
    }

    if (!targetUserId) return fallbackStats;

    const { data, error } = await supabase.rpc('get_user_spaced_repetition_stats', {
      p_user_id: targetUserId,
    });

    if (error) {
      console.warn('get_user_spaced_repetition_stats error:', error);
      return fallbackStats;
    }

    return (data as SpacedRepetitionStats) || fallbackStats;
  } catch (err) {
    console.error('getSpacedRepetitionStats failed:', err);
    return fallbackStats;
  }
}

/**
 * Submit 10-Question Daily Spaced Repetition Session
 */
export async function submitSpacedRepetitionSession(
  answers: Array<{ questionId: string; isCorrect: boolean; timeSpent: number }>,
): Promise<SpacedRepetitionSessionResult | null> {
  if (!isSupabaseConfigured() || !answers.length) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) throw new Error('User not authenticated');

    const payload = answers.map((a) => ({
      question_id: a.questionId,
      is_correct: a.isCorrect,
      time_spent: a.timeSpent,
    }));

    const { data, error } = await supabase.rpc('submit_spaced_repetition_session', {
      p_user_id: session.user.id,
      p_answers: payload,
    });

    if (error) throw error;

    return data as SpacedRepetitionSessionResult;
  } catch (err) {
    console.error('submitSpacedRepetitionSession failed:', err);
    return null;
  }
}
