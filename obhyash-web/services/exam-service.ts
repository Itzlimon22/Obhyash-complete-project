import { ExamConfig, Question, ExamResult } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';

export const fetchQuestions = async (
  config: ExamConfig,
): Promise<Question[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  console.log('Fetching questions for config:', config);

  try {
    // 1. Base Query
    let query = supabase.from('questions').select('*');

    // 2. Subject Filter (Mandatory)
    // Handle case where subject might be an ID or a Name.
    // Ideally we should use ID. If simple string matching fails, we might need a join or dual check.
    // For now assuming ID is passed or Name matches exactly.
    if (config.subject) {
      query = query.eq('subject', config.subject);
    }

    // 3. Chapter Filter
    if (config.chapters && config.chapters !== 'All') {
      const chapters = config.chapters.split(',').map((c) => c.trim());
      if (chapters.length > 0) {
        query = query.in('chapter', chapters);
      }
    }

    // 4. Topic Filter
    if (
      config.topics &&
      config.topics !== 'General' &&
      config.topics !== 'All'
    ) {
      const topics = config.topics.split(',').map((t) => t.trim());
      if (topics.length > 0) {
        query = query.in('topic', topics);
      }
    }

    // 5. Difficulty Filter
    if (config.difficulty && config.difficulty !== 'Mixed') {
      query = query.eq('difficulty', config.difficulty);
    }

    // 6. Question Count Limit (Randomized efficiently)
    // Note: 'random()' is not standard Supabase/PostgREST.
    // We typically fetch more and shuffle client side, or use a customized RPC.
    // Since RPC was failing, we'll try a direct fetch limit.
    // To get "randomness" without RPC, we can fetch a larger batch and shuffle client-side,
    // or rely on the RPC if we fix it.
    // LET'S TRY DIRECT QUERY FIRST to rule out RPC issues.

    query = query.limit(config.questionCount * 2); // Fetch double to allow some client-side shuffling

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Query Error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('No questions found for criteria');
      return [];
    }

    // Client-side Shuffle
    const shuffled = data.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, config.questionCount);

    // Map to Question type (snake_case -> camelCase)
    return selected.map((q: any) => ({
      ...q,
      createdAt: q.created_at,
      correctAnswer: q.correct_answer,
      correctAnswerIndex: q.correct_answer_index,
      correctAnswerIndices: q.correct_answer_indices || [],
      imageUrl: q.image_url,
      optionImages: q.option_images || [],
      explanationImageUrl: q.explanation_image_url,
      examType: q.exam_type,
    }));
  } catch (err) {
    console.error('Failed to fetch questions:', err);
    // Fallback to empty array instead of crashing, let UI handle "No Questions"
    return [];
  }
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
        chapters:
          (result as ExamResult & { chapters?: string }).chapters || 'General',
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
