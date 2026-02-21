import { Question } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';
import { createNotification } from './notification-service';

// --- TYPES ---
export interface QuestionFilters {
  subject?: string | null;
  chapter?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  status?: string | null;
  search?: string | null;
  author?: string | null; // Added author filter
}

export interface PaginatedQuestionsResponse {
  questions: Question[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Fetch paginated questions with filters, search, and sorting
 */
export const getQuestionsPage = async (
  page: number = 1,
  pageSize: number = 20,
  filters: QuestionFilters = {},
  sortBy: string = 'created_at',
  sortOrder: 'asc' | 'desc' = 'desc',
): Promise<PaginatedQuestionsResponse> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Build the query
      let query = supabase.from('questions').select('*', { count: 'exact' });

      // Apply filters
      if (filters.subject) {
        query = query.eq('subject', filters.subject);
      }
      if (filters.chapter) {
        query = query.eq('chapter', filters.chapter);
      }
      if (filters.topic) {
        query = query.eq('topic', filters.topic);
      }
      if (filters.difficulty) {
        query = query.ilike('difficulty', `%${filters.difficulty}%`);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.author) {
        query = query.eq('author', filters.author);
      }

      // Apply search (full-text search on question content and metadata)
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim();
        query = query.or(
          `question.ilike.%${searchTerm}%,exam_type.ilike.%${searchTerm}%,institute.ilike.%${searchTerm}%,institutes.cs.{${searchTerm}}`,
        );
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching questions page:', error);
        throw error;
      }

      // Map snake_case to camelCase
      const mappedQuestions: Question[] = (data || []).map(
        (q: Record<string, unknown>) =>
          ({
            ...q,
            createdAt: q.created_at || new Date().toISOString(),
            correctAnswer: q.correct_answer,
            correctAnswerIndex: q.correct_answer_index,
            correctAnswerIndices: q.correct_answer_indices || [],
            imageUrl: q.image_url,
            optionImages: q.option_images || [],
            explanationImageUrl: q.explanation_image_url,
            examType: q.exam_type,
            institutes: q.institutes || [],
            years: q.years || [],
          }) as Question,
      );

      return {
        questions: mappedQuestions,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
        currentPage: page,
        pageSize,
      };
    } catch (error) {
      console.error('Failed to fetch questions page:', error);
    }
  }

  // Fallback to empty response
  return {
    questions: [],
    totalCount: 0,
    totalPages: 0,
    currentPage: page,
    pageSize,
  };
};

/**
 * Get total count of questions matching filters
 */
export const getQuestionCount = async (
  filters: QuestionFilters = {},
): Promise<number> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      if (filters.subject) query = query.eq('subject', filters.subject);
      if (filters.chapter) query = query.eq('chapter', filters.chapter);
      if (filters.topic) query = query.eq('topic', filters.topic);
      if (filters.difficulty)
        query = query.ilike('difficulty', `%${filters.difficulty}%`);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.author) query = query.eq('author', filters.author);
      if (filters.search) {
        const searchTerm = filters.search.trim();
        query = query.or(
          `question.ilike.%${searchTerm}%,exam_type.ilike.%${searchTerm}%,institute.ilike.%${searchTerm}%,institutes.cs.{${searchTerm}}`,
        );
      }

      const { count, error } = await query;

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Failed to get question count:', error);
    }
  }

  return 0;
};

/**
 * Get a single question by ID
 */
export const getQuestion = async (id: string): Promise<Question | null> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching question:', error);
        return null;
      }

      if (data) {
        return {
          ...data,
          createdAt: data.created_at || new Date().toISOString(),
          correctAnswer: data.correct_answer,
          correctAnswerIndex: data.correct_answer_index,
          correctAnswerIndices: data.correct_answer_indices || [],
          imageUrl: data.image_url,
          optionImages: data.option_images || [],
          explanationImageUrl: data.explanation_image_url,
          examType: data.exam_type,
          institutes: data.institutes || [],
          years: data.years || [],
        };
      }
    } catch (error) {
      console.error('Failed to fetch question:', error);
    }
  }

  return null;
};

/**
 * Create a new question
 */
export const createQuestion = async (
  question: Partial<Question>,
): Promise<{ success: boolean; error?: string; id?: string }> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Build correct_answer_indices array
      const correctAnswerIndices =
        question.correctAnswerIndices ||
        (question.correctAnswerIndex !== undefined
          ? [question.correctAnswerIndex]
          : [0]);

      const payload = {
        question: question.question,
        options: question.options || [],
        correct_answer_indices: correctAnswerIndices,
        explanation: question.explanation,
        type: question.type || 'MCQ',
        difficulty: question.difficulty || 'Medium',
        subject: question.subject,
        chapter: question.chapter,
        topic: question.topic,
        stream: question.stream,
        division: question.division,
        section: question.section,
        exam_type: question.examType || 'Academic',
        institutes: question.institutes || [],
        years: question.years || [],
        status: question.status || 'Pending',
        author: question.author || 'Admin',
        tags: question.tags || [],
        version: 1,
        image_url: question.imageUrl,
        option_images: question.optionImages,
        explanation_image_url: question.explanationImageUrl,
        // Sync: Add random_id for Smart Fetch
        random_id: Math.random(),
      };

      const { data, error } = await supabase
        .from('questions')
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error(
          'Error creating question:',
          JSON.stringify(error, null, 2),
        );
        return {
          success: false,
          error: error.message || JSON.stringify(error),
        };
      }

      // Notify Admin if not created by Admin
      if (payload.author !== 'Admin') {
        // TODO: Replace with actual Admin ID fetching logic
        const ADMIN_ID = 'me'; // For testing purposes, notifying self
        await createNotification(
          ADMIN_ID,
          'New Question Pending',
          `A new question has been submitted by ${payload.author} and is waiting for approval.`,
          'info',
          {
            actionUrl: '/admin/question-management',
            priority: 'normal',
          },
        );
      }

      return { success: true, id: data?.id };
    } catch (error) {
      console.error('Failed to create question:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return { success: false, error: 'Database not configured' };
};

/**
 * Update an existing question
 */
export const updateQuestion = async (
  id: string,
  updates: Partial<Question>,
): Promise<{ success: boolean; error?: string }> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const payload: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      // Map camelCase to snake_case
      if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
      if (updates.optionImages !== undefined)
        payload.option_images = updates.optionImages;
      if (updates.explanationImageUrl !== undefined)
        payload.explanation_image_url = updates.explanationImageUrl;
      if (updates.correctAnswerIndices !== undefined)
        payload.correct_answer_indices = updates.correctAnswerIndices;
      if (updates.examType !== undefined) payload.exam_type = updates.examType;
      if (updates.correctAnswer !== undefined)
        payload.correct_answer = updates.correctAnswer;
      if (updates.correctAnswerIndex !== undefined)
        payload.correct_answer_index = updates.correctAnswerIndex;

      // Remove fields that shouldn't be updated or are mapped
      delete payload.id;
      delete payload.createdAt;
      delete payload.created_at;
      delete payload.imageUrl;
      delete payload.optionImages;
      delete payload.explanationImageUrl;
      delete payload.correctAnswerIndices;
      delete payload.examType;
      delete payload.correctAnswer;
      delete payload.correctAnswerIndex;

      const { error } = await supabase
        .from('questions')
        .update(payload)
        .eq('id', id);

      if (error) {
        console.error('Error updating question:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Failed to update question:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return { success: false, error: 'Database not configured' };
};

/**
 * Delete one or more questions
 */
export const deleteQuestions = async (
  ids: string[],
): Promise<{ success: boolean; error?: string; deletedCount?: number }> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error, count } = await supabase
        .from('questions')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error deleting questions:', error);
        return { success: false, error: error.message };
      }

      return { success: true, deletedCount: count || ids.length };
    } catch (error) {
      console.error('Failed to delete questions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return { success: false, error: 'Database not configured' };
};

/**
 * Bulk update question status
 */
export const bulkUpdateQuestionStatus = async (
  ids: string[],
  status: string,
): Promise<{ success: boolean; error?: string; updatedCount?: number }> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error, count } = await supabase
        .from('questions')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids);

      if (error) {
        console.error('Error updating question status:', error);
        return { success: false, error: error.message };
      }

      return { success: true, updatedCount: count || ids.length };
    } catch (error) {
      console.error('Failed to update question status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return { success: false, error: 'Database not configured' };
};

/**
 * Bulk update question metadata (subject, chapter, topic)
 */
export const bulkUpdateMetadata = async (
  ids: string[],
  fields: { subject?: string; chapter?: string; topic?: string },
): Promise<{ success: boolean; error?: string; updatedCount?: number }> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const updateData: Record<string, string> = {
        updated_at: new Date().toISOString(),
      };
      if (fields.subject !== undefined) updateData.subject = fields.subject;
      if (fields.chapter !== undefined) updateData.chapter = fields.chapter;
      if (fields.topic !== undefined) updateData.topic = fields.topic;

      const { error, count } = await supabase
        .from('questions')
        .update(updateData)
        .in('id', ids);

      if (error) {
        console.error('Error updating question metadata:', error);
        return { success: false, error: error.message };
      }

      return { success: true, updatedCount: count || ids.length };
    } catch (error) {
      console.error('Failed to update question metadata:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  return { success: false, error: 'Database not configured' };
};

/**
 * Check which question texts already exist in the database.
 * Returns a Set of indices (0-based) that are duplicates.
 */
export const checkDuplicateQuestions = async (
  questionTexts: string[],
): Promise<Set<number>> => {
  const duplicateIndices = new Set<number>();
  if (!isSupabaseConfigured() || !supabase || questionTexts.length === 0) {
    return duplicateIndices;
  }

  try {
    // Batch: check 20 at a time to avoid overly large queries
    const BATCH_SIZE = 20;
    for (let i = 0; i < questionTexts.length; i += BATCH_SIZE) {
      const batch = questionTexts.slice(i, i + BATCH_SIZE);
      const trimmedBatch = batch
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      if (trimmedBatch.length === 0) continue;

      // Build OR filter for exact matches
      const orFilter = trimmedBatch
        .map((text) => `question.eq.${text}`)
        .join(',');

      const { data } = await supabase
        .from('questions')
        .select('question')
        .or(orFilter)
        .limit(BATCH_SIZE);

      if (data && data.length > 0) {
        const existingTexts = new Set(
          data.map((d: { question: string }) =>
            d.question.trim().toLowerCase(),
          ),
        );

        batch.forEach((text, batchIdx) => {
          if (existingTexts.has(text.trim().toLowerCase())) {
            duplicateIndices.add(i + batchIdx);
          }
        });
      }
    }
  } catch (err) {
    console.error('Duplicate check error:', err);
    // Don't block the upload if dedup fails
  }

  return duplicateIndices;
};

/**
 * Bulk create questions (for imports from bulk upload)
 * Accepts database format with snake_case fields
 */
/**
 * Bulk create questions (for imports from bulk upload)
 * Accepts application Question objects and maps to database format
 */
export const bulkCreateQuestions = async (
  questions: Partial<Question>[],
): Promise<{ success: boolean; count: number; errors: unknown[] }> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Map Question objects to database format
      const payload = questions.map((q) => {
        const correctAnswerIndices =
          q.correctAnswerIndices ||
          (q.correctAnswerIndex !== undefined ? [q.correctAnswerIndex] : [0]);

        return {
          question: q.question, // Maps to 'question' column
          // content: q.content, // parsing 'content' if it exists, but usually 'question' is the column
          options: q.options || [],
          correct_answer_indices: correctAnswerIndices,
          correct_answer: q.correctAnswer, // Legacy
          correct_answer_index: q.correctAnswerIndex, // Legacy
          explanation: q.explanation,
          type: q.type || 'MCQ',
          difficulty: q.difficulty || 'Medium',
          subject: q.subject,
          chapter: q.chapter,
          topic: q.topic,
          stream: q.stream,
          division: q.division,
          section: q.section,
          exam_type: q.examType || 'Academic',
          institutes: q.institutes || [],
          years: q.years || [],
          status: q.status || 'Pending',
          author: q.author || 'Admin',
          tags: q.tags || [],
          version: 1,
          image_url: q.imageUrl,
          option_images: q.optionImages,
          explanation_image_url: q.explanationImageUrl,
          // Sync: Add random_id for Smart Fetch
          random_id: Math.random(),
        };
      });

      const { data, error } = await supabase
        .from('questions')
        .insert(payload)
        .select();

      if (error) {
        console.error('Bulk insert error:', error);
        return { success: false, count: 0, errors: [error] };
      }

      return { success: true, count: data?.length || 0, errors: [] };
    } catch (err) {
      console.error('Bulk insert exception:', err);
      return { success: false, count: 0, errors: [err] };
    }
  }

  return { success: false, count: 0, errors: ['Supabase not configured'] };
};
/**
 * Get multiple questions by IDs
 */
export const getQuestionsByIds = async (ids: string[]): Promise<Question[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      if (ids.length === 0) return [];

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .in('id', ids);

      if (error) {
        console.error('Error fetching questions by IDs:', error);
        return [];
      }

      return (data || []).map(
        (q: Record<string, unknown>) =>
          ({
            ...q,
            createdAt: q.created_at || new Date().toISOString(),
            correctAnswer: q.correct_answer,
            correctAnswerIndex: q.correct_answer_index,
            correctAnswerIndices: q.correct_answer_indices || [],
            imageUrl: q.image_url,
            optionImages: q.option_images || [],
            explanationImageUrl: q.explanation_image_url,
            examType: q.exam_type,
            institutes: q.institutes || [],
            years: q.years || [],
          }) as Question,
      );
    } catch (error) {
      console.error('Failed to fetch questions by IDs:', error);
    }
  }
  return [];
};
