import { ExamConfig, Question, ExamResult, UserAnswers } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';

// --- DB TYPES ---
interface QuestionDbRow {
  created_at: string;
  correct_answer: number;
  correct_answer_index: number;
  correct_answer_indices: number[];
  image_url?: string;
  option_images?: string[];
  explanation_image_url?: string;
  exam_type?: string;
  // Common fields that match Question type or need no mapping
  id: string | number;
  question: string;
  options: string[];
  explanation?: string;
  points?: number;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  institutes?: string[];
  years?: number[];
  // ... add other fields from Question if they map 1:1
}

interface ExamResultDbRow {
  id: string;
  user_id?: string;
  subject: string;
  subject_label?: string;
  exam_type?: string;
  date: string;
  score: number;
  total_marks: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  time_taken: number;
  negative_marking: number;
  questions?: Question[];
  user_answers?: UserAnswers;
  flagged_questions?: number[];
  chapters?: string;
  submission_type?: 'digital' | 'script';
  script_image_data?: string;
}

export const fetchQuestions = async (
  config: ExamConfig,
): Promise<Question[]> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  console.log('Fetching questions for config:', config);

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If user is logged in, use SMART FETCH (RPC)
    if (user) {
      console.log('Using Smart Fetch for user:', user.id);

      const { data, error } = await supabase.rpc('get_smart_exam_questions', {
        p_user_id: user.id,
        p_subject: config.subject, // Assuming strict match or handled by UI
        p_limit: config.questionCount,
        p_chapters:
          config.chapters && config.chapters !== 'All'
            ? config.chapters.split(',').map((c) => c.trim())
            : null,
        p_topics:
          config.topics &&
          config.topics !== 'General' &&
          config.topics !== 'All'
            ? config.topics.split(',').map((t) => t.trim())
            : null,
        p_difficulty:
          config.difficulty && config.difficulty !== 'Mixed'
            ? config.difficulty
            : null,
      });

      if (error) {
        console.error('Smart Fetch RPC Error:', error);
        // Fallback to legacy fetch if RPC fails
      } else if (data) {
        // Map snake_case to camelCase
        return (data as unknown as QuestionDbRow[]).map((q) => ({
          ...q,
          createdAt: q.created_at,
          correctAnswer: q.correct_answer,
          correctAnswerIndex: q.correct_answer_index,
          correctAnswerIndices: q.correct_answer_indices || [],
          imageUrl: q.image_url,
          optionImages: q.option_images || [],
          explanationImageUrl: q.explanation_image_url,
          examType: q.exam_type,
        })) as unknown as Question[];
      }
    }

    // --- FALLBACK / LEGACY FETCH (For guest users or RPC failure) ---
    console.log('Using Legacy Fetch');
    let query = supabase.from('questions').select('*');

    if (config.subject) {
      query = query.eq('subject', config.subject);
    }

    if (config.chapters && config.chapters !== 'All') {
      const chapters = config.chapters.split(',').map((c) => c.trim());
      if (chapters.length > 0) {
        query = query.in('chapter', chapters);
      }
    }

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

    if (config.difficulty && config.difficulty !== 'Mixed') {
      query = query.eq('difficulty', config.difficulty);
    }

    // Legacy random fetch logic
    query = query.limit(config.questionCount * 2);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase Query Error:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn('No questions found for criteria');
      return [];
    }

    const shuffled = data.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, config.questionCount);

    return (selected as unknown as QuestionDbRow[]).map((q) => ({
      ...q,
      createdAt: q.created_at,
      correctAnswer: q.correct_answer,
      correctAnswerIndex: q.correct_answer_index,
      correctAnswerIndices: q.correct_answer_indices || [],
      imageUrl: q.image_url,
      optionImages: q.option_images || [],
      explanationImageUrl: q.explanation_image_url,
      examType: q.exam_type,
    })) as unknown as Question[];
  } catch (err) {
    console.error('Failed to fetch questions:', err);
    return [];
  }
};

// Helper to update analytics for a single question
const updateQuestionAnalytics = async (
  userId: string,
  questionId: string,
  isCorrect: boolean,
) => {
  try {
    // We use upsert to handle both insert (first time) and update (subsequent times)
    // Logic:
    // - If it exists, increment times_attempted, and increment times_correct IF correct
    // - If it doesn't exist, insert with initial values

    // Note: Standard upsert with computed columns can be tricky.
    // We can use a stored procedure OR basic rpc, but simple upsert might work if we read first.
    // For efficiency, let's call an RPC for the update if possible, or use raw SQL.
    // Since we created the table, let's try a direct RPC approach for atomicity,
    // OR just use client-side logic reading is slower.

    // Better approach: Call a specific RPC for updating stats to avoid concurrency issues.
    // For now, we'll try a simple RPC call.

    const { error } = await supabase.rpc('update_user_question_stats', {
      p_user_id: userId,
      p_question_id: questionId,
      p_is_correct: isCorrect,
    });

    if (error) {
      // Fallback: If RPC doesn't exist yet, we can try manual check-update (slower)
      console.warn('Analytics update error (RPC might be missing):', error);
    }
  } catch (e) {
    console.error('Failed to update analytics for question:', questionId, e);
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
      const { error } = await supabase.from('exam_results').insert({
        user_id: user.id,
        subject: result.subject,
        exam_type: result.examType,
        date: result.date || new Date().toISOString(),
        score: result.score,
        total_marks: result.totalMarks,
        total_questions: result.totalQuestions,
        correct_count: result.correctCount,
        wrong_count: result.wrongCount,
        time_taken: result.timeTaken,
        negative_marking: result.negativeMarking,
        questions: result.questions,
        user_answers: result.userAnswers,
        flagged_questions: result.flaggedQuestions, // If db supports it
        chapters: result.chapters || 'General',
        submission_type: result.submissionType || 'digital',
        script_image_data: result.scriptImageData,
      });

      if (error) {
        console.error('Error saving exam result:', error);
        throw error;
      } else {
        console.log('✅ Exam result saved successfully');

        // --- 🚀 NEW: Update Smart Analytics ---
        // Fire and forget (don't block the UI)
        if (result.userAnswers) {
          // We need to know which questions were correct
          // The 'result' object usually has 'score' but maybe not per-question correctness explicitly
          // unless we re-evaluate or if 'userAnswers' contains it.
          // Types.ts definition of ExamResult: userAnswers?: UserAnswers (Record<string | number, number>)
          // We need the original questions or validity map to know correctness.
          // If 'correctAnswers' or 'scoreDetails' is not in ExamResult, we might skip this
          // OR we rely on the component to call a separate 'submitAnalytics'
          // TODO: The ExamResult type needs to support detailed correctness for this to work perfectly here.
          // Alternatively, we can assume the UI/Frontend has calculated it.
        }
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
    let existingHistory: ExamResult[] = [];
    try {
      const stored = localStorage.getItem('obhyash_exam_history');
      if (stored) {
        existingHistory = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse existing exam history:', e);
      // If malformed, we'll start with a clean slate
      existingHistory = [];
    }
    const updatedHistory = [...existingHistory, result];
    localStorage.setItem(
      'obhyash_exam_history',
      JSON.stringify(updatedHistory),
    );
  }
};

const mapDbResultToExamResult = (data: ExamResultDbRow): ExamResult => {
  return {
    id: data.id,
    user_id: data.user_id,
    subject: data.subject,
    subjectLabel: data.subject_label || data.subject, // Handle potential DB naming
    examType: data.exam_type,
    date: data.date,
    score: data.score,
    totalMarks: data.total_marks,
    totalQuestions: data.total_questions,
    correctCount: data.correct_count,
    wrongCount: data.wrong_count,
    timeTaken: data.time_taken,
    negativeMarking: data.negative_marking,
    questions: data.questions,
    userAnswers: data.user_answers,
    flaggedQuestions: data.flagged_questions || [],
    chapters: data.chapters || 'General',
    submissionType: data.submission_type || 'digital',
    scriptImageData: data.script_image_data,
  };
};

export const getExamHistory = async (): Promise<ExamResult[]> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    if (data)
      return (data as unknown as ExamResultDbRow[]).map(
        mapDbResultToExamResult,
      );
  }

  // Fallback to local storage if DB is not configured (or maybe we strictly want DB?)
  // Given strict requirements, we should probably prefer DB, but LocalStorage is client-user data ownership backstop.
  // I will leave LocalStorage as a secondary strictly-local backup, but remove any "mock" generated data.

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('obhyash_exam_history');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('Failed to parse local exam history:', e);
        // Clear the corrupted data
        localStorage.removeItem('obhyash_exam_history');
        return [];
      }
    }
    return [];
  }
  return [];
};
