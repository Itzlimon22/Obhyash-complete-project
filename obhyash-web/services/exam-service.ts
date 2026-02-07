import { ExamConfig, Question, ExamResult } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';

export const fetchQuestions = async (
  config: ExamConfig,
): Promise<Question[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  // Supabase Logic: Fetch random questions based on subject/tags
  // RPC signature: get_random_questions(subject_param, limit_param, chapter_param, topic_param)

  // Config passes "All" for chapters/topics sometimes, handle that.
  // Parse comma-separated strings into arrays
  const chapterArgs =
    config.chapters && config.chapters !== 'All'
      ? config.chapters.split(',').map((s) => s.trim())
      : null;

  const topicArgs =
    config.topics && config.topics !== 'General'
      ? config.topics.split(',').map((s) => s.trim())
      : null;

  console.log('Fetching questions with RPC:', {
    subject: config.subject,
    count: config.questionCount,
    chapters: chapterArgs,
    topics: topicArgs,
  });

  const { data, error } = await supabase.rpc('get_random_questions', {
    subject_param: config.subject,
    limit_param: config.questionCount,
    chapter_params: chapterArgs,
    topic_params: topicArgs,
    difficulty_param:
      config.difficulty && config.difficulty !== 'Mixed'
        ? config.difficulty
        : null,
  });

  if (error) {
    console.error('Error fetching questions from DB:', error);
    throw error;
  }

  return data || [];
};

export const saveExamResult = async (result: ExamResult): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  try {
    // Get the current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Add user_id to the result for database trigger
      // Also extract chapters from config/questions if available
      // The frontend result object might need to carry chapters info if exam-service
      // doesn't persist it in 'result' object directly yet.
      // Assuming 'result' object might have it or we infer it.
      // Looking at stats-service, it reads 'chapters' property from ExamResult.

      const resultWithUserId = {
        ...result,
        user_id: user.id,
        // Ensure chapters is included explicitly if it's not in the spread
        // Cast to any to bypass strict type check if Type definition update is separate
        chapters: (result as ExamResult & { chapters?: string }).chapters || 'General',
      };

      const { error } = await supabase
        .from('exam_results')
        .insert(resultWithUserId);

      if (error) {
        console.error('Error saving exam result:', error);
        throw error;
      } else {
        console.log(
          '✅ Exam result saved successfully, examsTaken will be auto-incremented by trigger',
        );
      }
    } else {
      console.warn(
        'No authenticated user found, cannot save exam result to database',
      );
      throw new Error('User not authenticated');
    }
  } catch (error) {
    console.error('Failed to save exam result:', error);
    throw error;
  }

  // Local Storage Logic (always save for backup)
  if (typeof window !== 'undefined') {
    const existingHistory = JSON.parse(
      localStorage.getItem('obhyash_exam_history') || '[]',
    );
    const updatedHistory = [...existingHistory, result];
    localStorage.setItem(
      'obhyash_exam_history',
      JSON.stringify(updatedHistory),
    );
  }
};

export const getExamHistory = async (): Promise<ExamResult[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    if (data) return data;
  }

  // Fallback to local storage if DB is not configured (or maybe we strictly want DB?)
  // Given strict requirements, we should probably prefer DB, but LocalStorage is client-user data ownership backstop.
  // I will leave LocalStorage as a secondary strictly-local backup, but remove any "mock" generated data.

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('obhyash_exam_history');
    return stored ? JSON.parse(stored) : [];
  }
  return [];
};
