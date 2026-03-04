import { Question } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';
import { createNotification } from './notification-service';
import { generateQuestionFingerprint } from '@/lib/crypto-utils';

const isValidUUID = (id: unknown): boolean =>
  typeof id === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

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

export interface BulkUploadJob {
  id: string;
  status: 'Processing' | 'Completed' | 'Failed';
  total_rows: number;
  processed_rows: number;
  inserted_rows: number;
  duplicate_rows: number;
  error_rows: number;
  errors: string[];
  created_at: string;
  updated_at: string;
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
            subjectId: q.subject_id,
            chapterId: q.chapter_id,
            topicId: q.topic_id,
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
          subjectId: data.subject_id,
          chapterId: data.chapter_id,
          topicId: data.topic_id,
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

      // Generate fingerprint for deduplication
      const fingerprint = await generateQuestionFingerprint({
        question: question.question || '',
        options: question.options || [],
        subject: question.subject,
        chapter: question.chapter,
      });

      const payload = {
        question: question.question,
        options: question.options || [],
        correct_answer_indices: correctAnswerIndices,
        explanation: question.explanation,
        type: question.type || 'MCQ',
        difficulty: question.difficulty || 'Medium',
        subject: question.subject,
        subject_id: question.subjectId || null,
        chapter: question.chapter,
        chapter_id: question.chapterId || null,
        topic: question.topic,
        topic_id: question.topicId || null,
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
        fingerprint,
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
      if (updates.subjectId !== undefined)
        payload.subject_id = updates.subjectId;
      if (updates.chapterId !== undefined)
        payload.chapter_id = updates.chapterId;
      if (updates.topicId !== undefined) payload.topic_id = updates.topicId;

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
      delete payload.subjectId;
      delete payload.chapterId;
      delete payload.topicId;

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
 * Check which questions already exist in the database using their fingerprints.
 * Returns a Set of indices (0-based) that are duplicates.
 */
export const checkDuplicateQuestions = async (
  questions: Partial<Question>[],
): Promise<Set<number>> => {
  const duplicateIndices = new Set<number>();
  if (!isSupabaseConfigured() || !supabase || questions.length === 0) {
    return duplicateIndices;
  }

  try {
    // 1. Generate fingerprints for all input questions
    const fingerprintPromises = questions.map(async (q) => {
      return await generateQuestionFingerprint({
        question: q.question || '',
        options: q.options || [],
        subject: q.subject,
        chapter: q.chapter,
      });
    });

    const fingerprints = await Promise.all(fingerprintPromises);

    // 2. Batch check against database (100 at a time)
    const BATCH_SIZE = 100;
    for (let i = 0; i < fingerprints.length; i += BATCH_SIZE) {
      const batch = fingerprints.slice(i, i + BATCH_SIZE);

      const { data, error } = await supabase
        .from('questions')
        .select('fingerprint')
        .in('fingerprint', batch);

      if (error) throw error;

      if (data && data.length > 0) {
        const existingFingerprints = new Set(
          data.map((d: { fingerprint: string }) => d.fingerprint),
        );

        batch.forEach((fp, batchIdx) => {
          if (existingFingerprints.has(fp)) {
            duplicateIndices.add(i + batchIdx);
          }
        });
      }
    }
  } catch (err) {
    console.error('Duplicate check error:', err);
  }

  return duplicateIndices;
};

/**
 * Create a new bulk upload job
 */
export const createBulkUploadJob = async (
  totalRows: number,
): Promise<{ id: string | null; error?: string }> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('bulk_upload_jobs')
      .insert({ total_rows: totalRows, status: 'Processing' })
      .select('id')
      .single();

    if (error) return { id: null, error: error.message };
    return { id: data.id };
  }
  return { id: null, error: 'Database not configured' };
};

/**
 * Get status of a bulk upload job
 */
export const getBulkUploadJobStatus = async (
  id: string,
): Promise<BulkUploadJob | null> => {
  if (isSupabaseConfigured() && supabase) {
    const { data, error } = await supabase
      .from('bulk_upload_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as BulkUploadJob;
  }
  return null;
};

/**
 * Bulk create questions (for imports from bulk upload)
 * Accepts application Question objects and maps to database format
 */
export const bulkCreateQuestions = async (
  questions: Partial<Question>[],
  jobId?: string,
): Promise<{
  success: boolean;
  count: number;
  duplicates: number;
  errors: number;
  errorDetails: string[];
  jobId?: string;
}> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // If noJobID provided but many questions, create one
      let internalJobId = jobId;
      if (!internalJobId && questions.length > 50) {
        const jobRes = await createBulkUploadJob(questions.length);
        internalJobId = jobRes.id || undefined;
      }

      // Pre-fetch taxonomy to map names to UUIDs safely
      const { data: allSubjects } = await supabase
        .from('subjects')
        .select('id, name, name_en');
      const { data: allChapters } = await supabase
        .from('chapters')
        .select('id, name, subject_id');
      const { data: allTopics } = await supabase
        .from('topics')
        .select('id, name, chapter_id');

      // Map Question objects to database format and generate fingerprints
      const payloadPromises = questions.map(async (q) => {
        const correctAnswerIndices =
          q.correctAnswerIndices ||
          (q.correctAnswerIndex !== undefined ? [q.correctAnswerIndex] : [0]);

        const fingerprint = await generateQuestionFingerprint({
          question: q.question || '',
          options: q.options || [],
          subject: q.subject,
          chapter: q.chapter,
        });

        // Resolve IDs from pre-fetched taxonomy if missing
        let sId = q.subjectId;
        let cId = q.chapterId;
        let tId = q.topicId;

        const normalize = (str: any) =>
          typeof str === 'string' ? str.trim().toLowerCase() : '';

        if (!sId && q.subject && allSubjects) {
          const normSubj = normalize(q.subject);
          const s = allSubjects.find(
            (sub: any) =>
              normalize(sub.name) === normSubj ||
              normalize(sub.name_en) === normSubj ||
              normalize(sub.id) === normSubj,
          );
          if (s) sId = s.id;
        }

        if (!isValidUUID(cId) && q.chapter && allChapters) {
          const normChap = normalize(q.chapter);
          const c = allChapters.find(
            (ch: any) =>
              normalize(ch.name) === normChap &&
              (!sId || ch.subject_id === sId),
          );
          if (c) cId = c.id;
        }

        if (!isValidUUID(tId) && q.topic && allTopics) {
          const normTop = normalize(q.topic);
          const t = allTopics.find(
            (tp: any) =>
              normalize(tp.name) === normTop && (!cId || tp.chapter_id === cId),
          );
          if (t) tId = t.id;
        }

        return {
          question: q.question,
          options: q.options || [],
          correct_answer_indices: correctAnswerIndices,
          explanation: q.explanation,
          type: q.type || 'MCQ',
          difficulty: q.difficulty || 'Medium',
          subject: q.subject,
          subject_id: sId || null, // subject_id can be text
          chapter: q.chapter,
          chapter_id: isValidUUID(cId) ? cId : null,
          topic: q.topic,
          topic_id: isValidUUID(tId) ? tId : null,
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
          fingerprint,
          random_id: Math.random(),
        };
      });

      const payload = await Promise.all(payloadPromises);

      // Use the modernized SQL RPC for atomic bulk merge with job support
      const { data, error } = await supabase.rpc('bulk_merge_questions_v2', {
        p_questions: payload,
        p_job_id: internalJobId || null,
      });

      if (error) {
        console.error('Bulk merge error:', error);
        return {
          success: false,
          count: 0,
          duplicates: 0,
          errors: questions.length,
          errorDetails: [error.message],
          jobId: internalJobId,
        };
      }

      return {
        success: true,
        count: data.inserted || 0,
        duplicates: data.duplicates || 0,
        errors: data.errors || 0,
        errorDetails: data.error_details || [],
        jobId: internalJobId,
      };
    } catch (err) {
      console.error('Bulk insert exception:', err);
      return {
        success: false,
        count: 0,
        duplicates: 0,
        errors: questions.length,
        errorDetails: [err instanceof Error ? err.message : String(err)],
      };
    }
  }

  return {
    success: false,
    count: 0,
    duplicates: 0,
    errors: questions.length,
    errorDetails: ['Supabase not configured'],
  };
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
