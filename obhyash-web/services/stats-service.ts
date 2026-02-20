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
  userId: string,
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
      console.warn(
        'RPC Error (Subject Analysis). Attempting fallback...',
        error,
      );

      try {
        let dateFilter = new Date();
        if (timeFilter === 'week') {
          dateFilter.setDate(dateFilter.getDate() - 7);
        } else if (timeFilter === 'month') {
          dateFilter.setMonth(dateFilter.getMonth() - 1);
        } else {
          dateFilter = new Date('1970-01-01');
        }

        const { data: rawData, error: fallbackError } = await supabase
          .from('exam_results')
          .select(
            'id, total_questions, correct_count, wrong_count, time_taken, date, subject, chapters, questions, user_answers',
          )
          .eq('user_id', userId)
          .eq('status', 'evaluated')
          .gte('date', dateFilter.toISOString());

        if (!fallbackError && rawData) {
          // Filter by subject manually
          const targetSubjLower = subject.toLowerCase();
          const filteredExams = rawData.filter((exam) => {
            if (!exam.subject) return false;
            const sLower = exam.subject.toLowerCase();
            return (
              sLower === targetSubjLower ||
              sLower.includes(targetSubjLower) ||
              (targetSubjLower === 'physics' &&
                sLower.includes('পদার্থবিজ্ঞান')) ||
              (targetSubjLower === 'chemistry' && sLower.includes('রসায়ন')) ||
              (targetSubjLower === 'math' &&
                (sLower.includes('গণিত') || sLower.includes('math'))) ||
              (targetSubjLower === 'biology' &&
                (sLower.includes('জীববিজ্ঞান') || sLower.includes('bio'))) ||
              (targetSubjLower === 'bangla' && sLower.includes('বাংলা')) ||
              (targetSubjLower === 'english' && sLower.includes('ইংরেজি')) ||
              (targetSubjLower === 'gk' && sLower.includes('সাধারণ জ্ঞান')) ||
              (targetSubjLower === 'ict' && sLower.includes('আইসিটি'))
            );
          });

          let totalQuestions = 0;
          let correct = 0;
          let wrong = 0;
          let totalTime = 0;
          let skipped = 0;

          const chapterMap = new Map<string, any>();

          filteredExams.forEach((exam) => {
            totalQuestions += exam.total_questions || 0;
            correct += exam.correct_count || 0;
            wrong += exam.wrong_count || 0;
            totalTime += exam.time_taken || 0;
            skipped += Math.max(
              0,
              (exam.total_questions || 0) -
                ((exam.correct_count || 0) + (exam.wrong_count || 0)),
            );

            // Better chapter extraction using actual questions and answers
            if (exam.questions && Array.isArray(exam.questions)) {
              const answers = exam.user_answers || {};

              exam.questions.forEach((q: any) => {
                // Determine chapter/topic name (Fallback to 'General' if both missing)
                const cName = q.topic || q.chapter || 'General';

                if (!chapterMap.has(cName)) {
                  chapterMap.set(cName, { name: cName, total: 0, correct: 0 });
                }

                const cData = chapterMap.get(cName);
                cData.total += 1; // 1 Question

                const userAnswer = answers[q.id];
                if (
                  userAnswer !== undefined &&
                  userAnswer === q.correctAnswerIndex
                ) {
                  cData.correct += 1;
                }
              });
            } else {
              // Legacy fallback if `questions` array is missing
              const chaptersText = exam.chapters || 'General';
              const chaptersArray = chaptersText
                .split(',')
                .map((c: string) => c.trim())
                .filter(Boolean);

              if (chaptersArray.length > 0) {
                const wTotal =
                  (exam.total_questions || 0) / chaptersArray.length;
                const wCorrect =
                  (exam.correct_count || 0) / chaptersArray.length;

                chaptersArray.forEach((chap: string) => {
                  if (!chapterMap.has(chap)) {
                    chapterMap.set(chap, { name: chap, total: 0, correct: 0 });
                  }
                  const cData = chapterMap.get(chap);
                  cData.total += wTotal;
                  cData.correct += wCorrect;
                });
              }
            }
          });

          const chapterPerformance = Array.from(chapterMap.values())
            .map((c) => ({
              name: c.name,
              total: Math.round(c.total),
              correct: Math.round(c.correct),
              accuracy:
                c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0,
            }))
            .sort((a, b) => b.total - a.total);

          return {
            totalQuestions,
            correct,
            wrong,
            skipped,
            accuracy:
              totalQuestions > 0
                ? Math.round((correct / totalQuestions) * 100)
                : 0,
            averageTime:
              totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
            chapterPerformance,
            mistakes: [],
          };
        }
      } catch (fallbackEx) {
        console.error('Fallback subject analysis failed', fallbackEx);
      }
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
  userId: string,
  timeFilter: 'all' | 'month' | 'week',
): Promise<OverallAnalytics> => {
  if (isSupabaseConfigured() && supabase) {
    // 1. Try the new optimized RPC for summary stats
    const { data: summary, error: summaryError } = await supabase.rpc(
      'get_dashboard_summary',
      { p_user_id: userId },
    );

    const { data, error } = await supabase.rpc('get_overall_analytics', {
      p_user_id: userId,
      p_time_filter: timeFilter,
    });

    if (!error && data) {
      // Merge results: Use summary from the new RPC if available
      return {
        totalExams: summary?.totalExams ?? data.totalExams ?? 0,
        avgScore: summary?.avgScore ?? data.avgScore ?? 0,
        avgAccuracy: summary?.avgAccuracy ?? data.avgAccuracy ?? 0,
        totalTime: data.totalTime || 0,
        timelineData: data.timelineData || [],
        subjectData: data.subjectData || [],
      };
    } else {
      console.warn(
        'RPC Error (Overall Analytics). Attempting fallback...',
        error,
      );

      try {
        // Fallback: Calculate analytics client-side if RPC fails or is missing
        let dateFilter = new Date();
        if (timeFilter === 'week') {
          dateFilter.setDate(dateFilter.getDate() - 7);
        } else if (timeFilter === 'month') {
          dateFilter.setMonth(dateFilter.getMonth() - 1);
        } else {
          dateFilter = new Date('1970-01-01');
        }

        const { data: rawData, error: fallbackError } = await supabase
          .from('exam_results')
          .select(
            'score, total_marks, total_questions, correct_count, wrong_count, time_taken, date, subject',
          )
          .eq('user_id', userId)
          .eq('status', 'evaluated')
          .gte('date', dateFilter.toISOString());

        if (!fallbackError && rawData) {
          let totalQuestions = 0;
          let totalCorrect = 0;
          let totalTime = 0;
          let scoreSum = 0;

          const subjectMap = new Map<string, any>();
          const timelineMap = new Map<string, any>();

          rawData.forEach((exam) => {
            totalQuestions += exam.total_questions || 0;
            totalCorrect += exam.correct_count || 0;
            totalTime += exam.time_taken || 0;

            if (exam.total_marks > 0) {
              scoreSum += (exam.score / exam.total_marks) * 100;
            }

            // Subject aggregate
            const subj = exam.subject || 'General';
            if (!subjectMap.has(subj)) {
              subjectMap.set(subj, {
                name: subj,
                correct: 0,
                wrong: 0,
                skipped: 0,
                total: 0,
              });
            }
            const sData = subjectMap.get(subj);
            sData.correct += exam.correct_count || 0;
            sData.wrong += exam.wrong_count || 0;
            sData.total += exam.total_questions || 0;
            sData.skipped += Math.max(
              0,
              (exam.total_questions || 0) -
                ((exam.correct_count || 0) + (exam.wrong_count || 0)),
            );

            // Timeline aggregate
            const examDate = new Date(exam.date);
            const dateStr = examDate.toLocaleDateString('bn-BD', {
              day: 'numeric',
              month: 'short',
            });
            if (!timelineMap.has(dateStr)) {
              timelineMap.set(dateStr, {
                name: dateStr,
                score: 0,
                _count: 0,
                fullDate: exam.date,
              });
            }
            const tData = timelineMap.get(dateStr);
            tData._count += 1;
            tData.score +=
              exam.total_marks > 0 ? (exam.score / exam.total_marks) * 100 : 0;
          });

          const timelineData = Array.from(timelineMap.values())
            .map((t) => ({
              name: t.name,
              score: Math.round(t.score / t._count),
              fullDate: new Date(t.fullDate).toLocaleDateString('bn-BD', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              }),
            }))
            .sort(
              (a, b) =>
                new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime(),
            );

          return {
            totalExams: rawData.length,
            avgScore:
              rawData.length > 0 ? Math.round(scoreSum / rawData.length) : 0,
            avgAccuracy:
              totalQuestions > 0
                ? Math.round((totalCorrect / totalQuestions) * 100)
                : 0,
            totalTime,
            timelineData,
            subjectData: Array.from(subjectMap.values()).sort(
              (a, b) => b.total - a.total,
            ),
          };
        }
      } catch (fallbackEx) {
        console.error('Fallback analytics failed', fallbackEx);
      }
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
