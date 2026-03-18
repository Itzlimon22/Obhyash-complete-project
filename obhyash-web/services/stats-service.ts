import { UserProfile, ExamResult, Question, SubjectAnalysis, OverallAnalytics } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';
import { LEVELS } from '@/components/dashboard/leaderboard/leaderboardData';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';

// --- TYPES ---
// Re-exporting for compatibility, though importing directly from @/lib/types is preferred.
export type { SubjectAnalysis, OverallAnalytics };

// Helper function to generate avatar colors

// Helper function to generate avatar colors
const generateAvatarColor = (index: number): string => {
  const colors = [
    'bg-red-500',
    'bg-emerald-500',
    'bg-red-500',
    'bg-red-500',
    'bg-emerald-600',
    'bg-red-500',
    'bg-red-500',
    'bg-emerald-500',
    'bg-emerald-500',
    'bg-slate-500',
    'bg-emerald-500',
    'bg-emerald-500',
  ];
  return colors[index % colors.length];
};

interface LeaderboardUserRow {
  id: string;
  name: string | null;
  institute: string | null;
  xp: number | null;
  level: string | null;
  exams_taken: number | null;
  avatar_url: string | null;
  avatar_color: string | null;
  streak: number | null;
  role?: string | null;
}

export const getLeaderboardUsers = async (
  level: string,
): Promise<UserProfile[]> => {
  try {
    const res = await fetch(
      `/api/leaderboard/level?level=${encodeURIComponent(level)}`,
      {
        // next.js fetch cache: revalidate every 5 minutes on the server
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Restore avatar color fallback for rows that have none stored
    return data.map((u: UserProfile & { _index?: number }) => ({
      ...u,
      avatarColor: u.avatarColor || generateAvatarColor(u._index ?? 0),
    }));
  } catch (err) {
    console.error('Failed to fetch leaderboard users:', err);
    return [];
  }
};

export const getInstituteLeaderboardUsers = async (
  institute: string,
): Promise<UserProfile[]> => {
  if (!institute) return [];
  try {
    const res = await fetch(
      `/api/leaderboard/college?institute=${encodeURIComponent(institute)}`,
      {
        next: { revalidate: 300 },
      },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.map((u: UserProfile & { _index?: number }) => ({
      ...u,
      avatarColor: u.avatarColor || generateAvatarColor(u._index ?? 0),
    }));
  } catch (err) {
    console.error('Failed to fetch institute leaderboard:', err);
    return [];
  }
};

export interface InstituteRankEntry {
  institute: string;
  avgXp: number;
  studentCount: number;
}

export const getInstituteRankings = async (): Promise<InstituteRankEntry[]> => {
  try {
    // Reads from mv_institute_rankings materialized view — refreshed every 15 min by pg_cron.
    // Response is CDN-cached for 15 min so this is effectively free at scale.
    const res = await fetch('/api/leaderboard/rankings', {
      next: { revalidate: 900 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch institute rankings:', e);
    return [];
  }
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
    // Bypassing buggy RPC 'get_subject_analytics' directly to TS fallback to ensure accurate reporting
    try {
      let dateFilter = new Date();
      if (timeFilter === 'week') {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (timeFilter === 'month') {
        dateFilter.setMonth(dateFilter.getMonth() - 1);
      } else {
        dateFilter = new Date('1970-01-01');
      }

      type RawExamRow = {
        id: any;
        total_questions: any;
        correct_count: any;
        wrong_count: any;
        time_taken: any;
        date: any;
        subject: any;
        chapters: any;
        questions: any;
        user_answers: any;
      };

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
        const targetLabel = getSubjectDisplayName(subject).toLowerCase();

        const filteredExams = (rawData as RawExamRow[]).filter((exam) => {
          if (!exam.subject) return false;

          // Resolve both the stored subject and the target subject to display names for robust matching
          const storedLabel = getSubjectDisplayName(exam.subject).toLowerCase();
          const rawSubject = exam.subject.toLowerCase();
          const targetSubjLower = subject.toLowerCase();

          return (
            rawSubject === targetSubjLower ||
            storedLabel === targetLabel ||
            storedLabel.includes(targetLabel) || // e.g. "Physics 1st" includes "Physics"
            targetLabel.includes(storedLabel) ||
            // Legacy fallbacks for specific subjects
            (targetLabel.includes('physics') &&
              storedLabel.includes('পদার্থবিজ্ঞান')) ||
            (targetLabel.includes('chemistry') &&
              storedLabel.includes('রসায়ন')) ||
            (targetLabel.includes('math') && storedLabel.includes('গণিত')) ||
            (targetLabel.includes('biology') &&
              storedLabel.includes('জীববিজ্ঞান')) ||
            (targetLabel.includes('bangla') && storedLabel.includes('বাংলা')) ||
            (targetLabel.includes('english') &&
              storedLabel.includes('ইংরেজি')) ||
            (targetLabel.includes('gk') &&
              (storedLabel.includes('সাধারণ জ্ঞান') || rawSubject === 'gk')) ||
            (targetLabel.includes('ict') &&
              (storedLabel.includes('আইসিটি') || rawSubject === 'ict'))
          );
        });

        let totalQuestions = 0;
        let correct = 0;
        let wrong = 0;
        let totalTime = 0;
        let skipped = 0;

        const chapterMap = new Map<
          string,
          { name: string; total: number; correct: number; wrong: number; skipped: number }
        >();

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

            // Define a more specific type for questions if needed
            type ExtendedQuestion = Question & {
              topic?: string;
              chapter?: string;
              id: string | number;
              correctAnswerIndex?: number;
            };

            exam.questions.forEach((q: ExtendedQuestion) => {
              // Determine chapter/topic name (Fallback to 'General' if both missing)
              const cName = q.topic || q.chapter || 'General';

              if (!chapterMap.has(cName)) {
                chapterMap.set(cName, {
                  name: cName,
                  total: 0,
                  correct: 0,
                  wrong: 0,
                  skipped: 0,
                });
              }

              const cData = chapterMap.get(cName)!;
              cData.total += 1; // 1 Question

              const userAnswer = answers[q.id];
              if (userAnswer === undefined) {
                cData.skipped += 1;
              } else if (userAnswer === q.correctAnswerIndex) {
                cData.correct += 1;
              } else {
                cData.wrong += 1;
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
              const wTotal = (exam.total_questions || 0) / chaptersArray.length;
              const wCorrect = (exam.correct_count || 0) / chaptersArray.length;
              const wWrong = (exam.wrong_count || 0) / chaptersArray.length;
              const wSkipped = ((exam.total_questions || 0) - ((exam.correct_count || 0) + (exam.wrong_count || 0))) / chaptersArray.length;

              chaptersArray.forEach((chap: string) => {
                if (!chapterMap.has(chap)) {
                  chapterMap.set(chap, { name: chap, total: 0, correct: 0, wrong: 0, skipped: 0 });
                }
                const cData = chapterMap.get(chap)!;
                cData.total += wTotal;
                cData.correct += wCorrect;
                cData.wrong += wWrong;
                cData.skipped += Math.max(0, wSkipped);
              });
            }
          }
        });

        const chapterPerformance = Array.from(chapterMap.values())
          .map((c) => ({
            name: c.name,
            total: Math.round(c.total),
            correct: Math.round(c.correct),
            wrong: Math.round(c.wrong),
            skipped: Math.round(c.skipped),
            accuracy: c.total > 0 ? Math.round((c.correct / c.total) * 100) : 0,
          }))
          .sort((a, b) => b.total - a.total);

        const examsWithTime = filteredExams.filter(e => (e.time_taken || 0) > 0);
        const totalTimeForAvg = examsWithTime.reduce((acc, e) => acc + (e.time_taken || 0), 0);
        const totalQuestionsForAvg = examsWithTime.reduce((acc, e) => acc + (e.total_questions || 0), 0);

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
            totalQuestionsForAvg > 0 ? Math.round(totalTimeForAvg / totalQuestionsForAvg) : 0,
          chapterPerformance,
          mistakes: [],
        };
      }
    } catch (fallbackEx) {
      console.error('Fallback subject analysis failed', fallbackEx);
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
    // Bypassing buggy RPCs to use safe TS fallback for accurate metric calculation
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
        let examsWithTimeCount = 0;
        let questionsWithTimeCount = 0;

        const subjectMap = new Map<
          string,
          {
            id: string;
            name: string;
            correct: number;
            wrong: number;
            skipped: number;
            total: number;
          }
        >();
        const timelineMap = new Map<
          string,
          { name: string; score: number; _count: number; fullDate: string }
        >();

        let totalWrong = 0;
        let totalSkipped = 0;

        rawData.forEach(
          (exam: {
            score: number;
            total_marks: number;
            total_questions: number;
            correct_count: number;
            wrong_count: number;
            time_taken: number;
            date: string;
            subject?: string;
          }) => {
            totalQuestions += exam.total_questions || 0;
            totalCorrect += exam.correct_count || 0;
            totalTime += exam.time_taken || 0;
            
            if ((exam.time_taken || 0) > 0) {
              examsWithTimeCount++;
              questionsWithTimeCount += exam.total_questions || 0;
            }

            if (exam.total_marks > 0) {
              scoreSum += (exam.score / exam.total_marks) * 100;
            }

            // Subject aggregate - normalize ID and resolve label
            const subjId = exam.subject || 'General';
            const subjName = getSubjectDisplayName(subjId);
            
            if (!subjectMap.has(subjId)) {
              subjectMap.set(subjId, {
                id: subjId,
                name: subjName,
                correct: 0,
                wrong: 0,
                skipped: 0,
                total: 0,
              });
            }
            const sData = subjectMap.get(subjId)!;
            sData.correct += exam.correct_count || 0;
            sData.wrong += exam.wrong_count || 0;
            sData.total += exam.total_questions || 0;
            
            const examSkipped = Math.max(
              0,
              (exam.total_questions || 0) -
                ((exam.correct_count || 0) + (exam.wrong_count || 0)),
            );
            sData.skipped += examSkipped;
            
            totalWrong += exam.wrong_count || 0;
            totalSkipped += examSkipped;

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
            const tData = timelineMap.get(dateStr)!;
            tData._count += 1;
            tData.score +=
              exam.total_marks > 0 ? (exam.score / exam.total_marks) * 100 : 0;
          },
        );

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
          totalQuestions,
          totalCorrect,
          totalWrong,
          totalSkipped,
          avgTimePerExam: examsWithTimeCount > 0 ? Math.round(totalTime / examsWithTimeCount) : 0,
          avgTimePerQuestion: questionsWithTimeCount > 0 ? Math.round(totalTime / questionsWithTimeCount) : 0,
        };
      }
    } catch (fallbackEx) {
      console.error('Fallback analytics failed', fallbackEx);
    }
  }

  return {
    totalExams: 0,
    avgScore: 0,
    avgAccuracy: 0,
    totalTime: 0,
    timelineData: [],
    subjectData: [],
    totalQuestions: 0,
    totalCorrect: 0,
    totalWrong: 0,
    totalSkipped: 0,
    avgTimePerExam: 0,
    avgTimePerQuestion: 0,
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
        approved:
          data?.filter((q: { status: string }) => q.status === 'Approved')
            .length || 0,
        pending:
          data?.filter((q: { status: string }) => q.status === 'Pending')
            .length || 0,
        rejected:
          data?.filter((q: { status: string }) => q.status === 'Rejected')
            .length || 0,
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
