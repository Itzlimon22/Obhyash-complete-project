import { ExamConfig, Question, ExamResult, UserAnswers } from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';
import { getSubjectDisplayName } from '@/lib/data/subject-name-map';

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

export interface ExamDebugInfo {
  timestamp: string;
  input: ExamConfig;
  resolvedParams: Record<string, unknown>;
  fetchMethod: string;
  rpcError: string | null;
  queryError: string | null;
  resultCount: number;
  diagnosis: string[];
}

// ─── Fisher-Yates Shuffle (unbiased) ─────────────────────────────────────────
function fisherYatesShuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Map a DB row to the Question type ───────────────────────────────────────
function mapDbRow(q: QuestionDbRow): Question {
  const indices = q.correct_answer_indices || [];
  const rawIndex =
    q.correct_answer_index !== undefined && q.correct_answer_index !== null
      ? q.correct_answer_index
      : indices.length > 0
        ? indices[0]
        : 0;
  return {
    ...q,
    createdAt: q.created_at,
    correctAnswer: q.correct_answer,
    correctAnswerIndex: rawIndex,
    correctAnswerIndices: indices.length > 0 ? indices : [rawIndex],
    imageUrl: q.image_url,
    optionImages: q.option_images || [],
    explanationImageUrl: q.explanation_image_url,
    examType: q.exam_type,
  } as unknown as Question;
}

export const fetchQuestionsWithDiagnostics = async (
  config: ExamConfig,
): Promise<{ questions: Question[]; debug: ExamDebugInfo }> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  const debug: ExamDebugInfo = {
    timestamp: new Date().toISOString(),
    input: { ...config },
    resolvedParams: {},
    fetchMethod: 'none',
    rpcError: null,
    queryError: null,
    resultCount: 0,
    diagnosis: [],
  };

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Build filter arrays — null means "no restriction / all"
    const difficulties =
      config.difficulty &&
      config.difficulty !== 'Mixed' &&
      config.difficulty !== 'All'
        ? config.difficulty.split('+').map((d) => d.trim())
        : null;

    const examTypes =
      config.examType &&
      config.examType !== 'Mixed' &&
      config.examType !== 'All'
        ? config.examType.split('+').map((t) => t.trim())
        : null;

    const chapters =
      config.chapters && config.chapters !== 'All'
        ? config.chapters.split(',').map((c) => c.trim())
        : null;

    const topics =
      config.topics && config.topics !== 'General' && config.topics !== 'All'
        ? config.topics.split(',').map((t) => t.trim())
        : null;

    // Normalize subject name for NFC/NFD dual-match
    const subjectName = config.subjectLabel || '';
    const nameForms = [subjectName];
    const nfd = subjectName.normalize('NFD');
    if (nfd !== subjectName) nameForms.push(nfd);
    const nfc = subjectName.normalize('NFC');
    if (nfc !== subjectName && !nameForms.includes(nfc)) nameForms.push(nfc);

    debug.diagnosis.push(`🔍 Subject forms: ${nameForms.join(', ')}`);
    debug.diagnosis.push(
      `🎯 Filters — chapters: ${chapters?.length ?? 'all'}, ` +
        `difficulties: ${difficulties?.join('+') ?? 'all'}, ` +
        `examTypes: ${examTypes?.join('+') ?? 'all'}`,
    );

    // ── Primary: single distributed RPC — one round-trip handles all cells ───
    // The SQL function distributes questions evenly across every
    // (chapter × difficulty × exam_type) combination, respects smart priority
    // (unused → mistaken → random), and self-tops-up any shortfall.
    for (const formName of nameForms) {
      const { data, error } = await supabase.rpc(
        'get_distributed_exam_questions',
        {
          p_user_id: user?.id ?? null,
          p_subject: config.subject,
          p_subject_name: formName,
          p_total: config.questionCount,
          p_chapters: chapters,
          p_topics: topics,
          p_difficulties: difficulties,
          p_exam_types: examTypes,
        },
      );

      if (error) {
        debug.rpcError = error.message;
        debug.diagnosis.push(
          `⚠️ Distributed RPC error (form "${formName}"): ${error.message}`,
        );
        continue;
      }

      if (data && data.length > 0) {
        const questions = fisherYatesShuffle(
          (data as unknown as QuestionDbRow[]).map(mapDbRow),
        );
        debug.fetchMethod = 'DISTRIBUTED_RPC';
        debug.resultCount = questions.length;
        debug.diagnosis.push(
          `✅ Distributed RPC returned ${questions.length}/${config.questionCount}`,
        );
        return { questions, debug };
      }
    }

    // ── Fallback: direct query (RPC not yet deployed, or returned 0) ─────────
    debug.diagnosis.push(
      '⚠️ Distributed RPC returned 0 — falling back to direct query',
    );
    const matchConditions = [`subject.eq.${config.subject}`];
    if (config.subject !== config.subjectLabel && config.subjectLabel) {
      matchConditions.push(`subject.eq.${config.subjectLabel}`);
    }
    nameForms.forEach((form) => {
      if (form !== config.subject && form !== config.subjectLabel) {
        matchConditions.push(`subject.eq.${form}`);
      }
    });

    let query = supabase
      .from('questions')
      .select('*')
      .or(matchConditions.join(','))
      .eq('status', 'Approved');
    if (chapters) query = query.in('chapter', chapters);
    if (topics) query = query.in('topic', topics);
    if (difficulties && difficulties.length === 1)
      query = query.ilike('difficulty', `%${difficulties[0]}%`);
    if (examTypes && examTypes.length === 1)
      query = query.ilike('exam_type', `%${examTypes[0]}%`);
    query = query.limit(config.questionCount * 3);

    const { data: fallbackData, error: fallbackError } = await query;
    if (fallbackError) {
      debug.queryError = fallbackError.message;
      debug.diagnosis.push(`❌ Fallback query error: ${fallbackError.message}`);
      return { questions: [], debug };
    }

    const finalQuestions = fisherYatesShuffle(
      ((fallbackData ?? []) as unknown as QuestionDbRow[]).map(mapDbRow),
    ).slice(0, config.questionCount);

    debug.fetchMethod = 'LEGACY_FALLBACK';
    debug.resultCount = finalQuestions.length;
    debug.diagnosis.push(
      `🏁 Fallback returned ${finalQuestions.length}/${config.questionCount}`,
    );
    return { questions: finalQuestions, debug };
  } catch (err) {
    debug.diagnosis.push(`💥 Exception: ${err}`);
    console.error('💥 [Exam Debug] FATAL:', err);
    return { questions: [], debug };
  }
};

export const fetchQuestions = async (
  config: ExamConfig,
): Promise<Question[]> => {
  const { questions } = await fetchQuestionsWithDiagnostics(config);
  return questions;
};

/**
 * Quick count of available questions matching the given filters.
 * Uses head:true (no data transfer) for speed.
 */
export const getAvailableQuestionCount = async (
  subject: string,
  subjectLabel?: string,
  chapters?: string[] | null,
  difficulty?: string | null,
): Promise<number> => {
  if (!isSupabaseConfigured() || !supabase) return 0;

  try {
    // Build OR conditions for subject (handle NFC/NFD)
    const matchConditions = [`subject.eq.${subject}`];
    if (subjectLabel && subjectLabel !== subject) {
      matchConditions.push(`subject.eq.${subjectLabel}`);
    }
    const nfd = (subjectLabel || subject).normalize('NFD');
    const nfc = (subjectLabel || subject).normalize('NFC');
    if (nfd !== subject && !matchConditions.includes(`subject.eq.${nfd}`)) {
      matchConditions.push(`subject.eq.${nfd}`);
    }
    if (nfc !== subject && !matchConditions.includes(`subject.eq.${nfc}`)) {
      matchConditions.push(`subject.eq.${nfc}`);
    }

    let query = supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .or(matchConditions.join(','))
      .eq('status', 'Approved'); // Only count approved questions

    if (chapters && chapters.length > 0) {
      query = query.in('chapter', chapters);
    }
    if (difficulty && difficulty !== 'Mixed' && difficulty !== 'All') {
      const diffs = difficulty.split('+').map((d) => d.trim());
      if (diffs.length === 1) {
        query = query.ilike('difficulty', `%${diffs[0]}%`);
      }
    }

    const { count, error } = await query;
    if (error) {
      console.error('Count query error:', error);
      return 0;
    }
    return count || 0;
  } catch {
    return 0;
  }
};

// Helper to update analytics for a single question
export const updateQuestionAnalytics = async (
  userId: string,
  questionId: string,
  isCorrect: boolean,
) => {
  try {
    const { error } = await supabase.rpc('update_user_question_stats', {
      p_user_id: userId,
      p_question_id: questionId,
      p_is_correct: isCorrect,
    });
    if (error) {
      console.warn('Analytics update error (RPC might be missing):', error);
    }
  } catch (e) {
    console.error('Failed to update analytics for question:', questionId, e);
  }
};

// Bulk-update analytics for all answered questions in one RPC call.
// Replaces the N-individual-call pattern after exam submission.
const bulkUpdateQuestionAnalytics = async (
  userId: string,
  questions: Question[],
  userAnswers: UserAnswers,
) => {
  const answered = questions.filter((q) => userAnswers[q.id] !== undefined);
  if (!answered.length) return;
  try {
    const questionIds = answered.map((q) => String(q.id));
    const areCorrect = answered.map((q) => {
      const ua = userAnswers[q.id];
      return (
        ua === q.correctAnswerIndex ||
        (q.correctAnswerIndices != null && q.correctAnswerIndices.includes(ua))
      );
    });
    const { error } = await supabase.rpc('bulk_update_user_question_stats', {
      p_user_id: userId,
      p_question_ids: questionIds,
      p_are_correct: areCorrect,
    });
    if (error) {
      console.warn('Bulk analytics update error:', error);
    }
  } catch (e) {
    console.error('Failed to bulk update question analytics:', e);
  }
};

// --- DB SYNC METHODS ---

export const initiateExamSession = async (
  config: ExamConfig,
  questions: Question[],
): Promise<string | null> => {
  if (!isSupabaseConfigured() || !supabase) return null;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    // Clean up dangling 'started' rows for this user+subject to prevent row accumulation
    await supabase
      .from('exam_results')
      .delete()
      .eq('user_id', user.id)
      .eq('subject', config.subject)
      .eq('submission_type', 'started');

    // Insert a lightweight session row — questions are NOT stored here to avoid
    // writing large JSON before the student even answers anything.
    // Full questions are written when the exam is submitted (updateExamResult).
    const { data, error } = await supabase
      .from('exam_results')
      .insert({
        user_id: user.id,
        subject: config.subject,
        exam_type: config.examType,
        date: new Date().toISOString(),
        score: 0,
        total_marks: questions.reduce((acc, q) => acc + (q.points || 1), 0),
        total_questions: questions.length,
        correct_count: 0,
        wrong_count: 0,
        time_taken: 0,
        negative_marking: config.negativeMarking,
        chapters: config.chapters || 'General',
        submission_type: 'started',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to initiate exam session:', error);
      return null;
    }

    return data.id;
  } catch (err) {
    console.error('Error initiating exam session:', err);
    return null;
  }
};

export const updateExamResult = async (
  examId: string,
  result: ExamResult,
): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const { error } = await supabase
      .from('exam_results')
      .update({
        score: result.score,
        total_marks: result.totalMarks,
        total_questions: result.totalQuestions,
        correct_count: result.correctCount,
        wrong_count: result.wrongCount,
        time_taken: result.timeTaken,
        negative_marking: result.negativeMarking,
        user_answers: result.userAnswers,
        questions: result.questions,
        flagged_questions: result.flaggedQuestions,
        subject_label: result.subjectLabel,
        chapters: result.chapters,
        status: result.status || 'evaluated',
        submission_type: result.submissionType || 'digital',
        script_image_data: result.scriptImageData,
      })
      .eq('id', examId);

    if (error) {
      console.error('Failed to update exam result:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error updating exam result:', err);
    return false;
  }
};

export const saveExamResult = async (result: ExamResult): Promise<void> => {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Database configuration missing');
  }

  try {
    // Check if this result has a valid UUID (meaning it was initiated in DB)
    // Legacy results have Date.now() IDs which are numbers-as-strings (usually shorter or different format)
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        result.id,
      );

    // Resolve user once — reused across both update and fallback-insert paths
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isUuid) {
      // Update existing session
      const success = await updateExamResult(result.id, result);

      // Bulk-update analytics in a single RPC call (best effort)
      if (user && result.questions && result.userAnswers) {
        bulkUpdateQuestionAnalytics(
          user.id,
          result.questions,
          result.userAnswers,
        );
      }

      if (success) {
        console.log('✅ Exam session updated successfully');
        return; // Done
      } else {
        console.warn('⚠️ Update failed, falling back to insert...');
      }
    }

    // Fallback: Insert new row (Legacy behavior or if init failed)
    if (user) {
      const { error } = await supabase.from('exam_results').insert({
        user_id: user.id,
        subject: result.subject,
        subject_label: result.subjectLabel,
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
        status: result.status || 'evaluated',
        flagged_questions: result.flaggedQuestions,
        chapters: result.chapters || 'General',
        submission_type: result.submissionType || 'digital',
        script_image_data: result.scriptImageData,
      });

      if (error) {
        console.error('Error saving exam result:', error);
        throw error;
      } else {
        console.log('✅ Exam result saved successfully (New Insert)');

        // Bulk-update analytics in a single RPC call (best effort)
        if (result.questions && result.userAnswers) {
          bulkUpdateQuestionAnalytics(
            user.id,
            result.questions,
            result.userAnswers,
          );
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
    // Update if exists, else append
    const index = existingHistory.findIndex((r) => r.id === result.id);
    if (index >= 0) {
      existingHistory[index] = result;
    } else {
      existingHistory.push(result);
      // Cap at 100 most recent entries to prevent localStorage quota overflow
      if (existingHistory.length > 100) {
        existingHistory = existingHistory.slice(-100);
      }
    }

    localStorage.setItem(
      'obhyash_exam_history',
      JSON.stringify(existingHistory),
    );
  }
};

const mapDbResultToExamResult = (data: ExamResultDbRow): ExamResult => {
  // Resolve the display label: prefer stored subject_label, then look up locally,
  // then fall back to the raw subject ID.
  const rawLabel = data.subject_label || data.subject;
  const resolvedLabel =
    rawLabel === data.subject ? getSubjectDisplayName(data.subject) : rawLabel;

  return {
    id: data.id,
    user_id: data.user_id,
    subject: data.subject,
    subjectLabel: resolvedLabel,
    examType: data.exam_type,
    date: data.date,
    score: data.score,
    totalMarks: data.total_marks,
    totalQuestions: data.total_questions,
    correctCount: data.correct_count,
    wrongCount: data.wrong_count,
    timeTaken: data.time_taken,
    negativeMarking: data.negative_marking,
    questions: data.questions?.map((q) => {
      const indices = q.correctAnswerIndices || [];
      const rawIndex =
        q.correctAnswerIndex !== undefined && q.correctAnswerIndex !== null
          ? q.correctAnswerIndex
          : indices.length > 0
            ? indices[0]
            : 0;

      return {
        ...q,
        correctAnswerIndex: rawIndex,
        correctAnswerIndices: indices.length > 0 ? indices : [rawIndex],
      };
    }),
    userAnswers: data.user_answers,
    flaggedQuestions: data.flagged_questions || [],
    chapters: data.chapters || 'General',
    submissionType: data.submission_type || 'digital',
    scriptImageData: data.script_image_data,
  };
};

export const getExamHistory = async (knownUserId?: string): Promise<ExamResult[]> => {
  if (isSupabaseConfigured() && supabase) {
    // If the caller already knows the userId (e.g. from AuthProvider),
    // skip auth.getUser() — it acquires the Supabase JS auth lock and makes
    // a server round-trip, blocking all concurrent .from() queries for 1-3s.
    // This was causing the dashboard to appear frozen / keep loading on refresh.
    let resolvedUserId = knownUserId;
    if (!resolvedUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      resolvedUserId = user?.id;
    }

    if (!resolvedUserId) {
      console.warn('getExamHistory: No user found');
      return [];
    }
    const user = { id: resolvedUserId };

    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .eq('user_id', user.id)
      .neq('submission_type', 'started') // Exclude incomplete/abandoned sessions
      .order('date', { ascending: false });

    if (error) {
      console.error('getExamHistory error:', error);
      throw error;
    }
    if (data) {
      const results = (data as unknown as ExamResultDbRow[]).map(
        mapDbResultToExamResult,
      );

      // --- Enrich missing subject labels for old records ---
      // Step 1: Resolve string-key subjects (e.g. 'hsc_chemistry_1') from local map.
      const enrichedResults = results.map((r) => {
        if (!r.subjectLabel || r.subjectLabel === r.subject) {
          const localName = getSubjectDisplayName(r.subject);
          if (localName !== r.subject) {
            return { ...r, subjectLabel: localName };
          }
        }
        return r;
      });

      // Step 2: For UUID subjects with no label, resolve from DB subjects table.
      const subjectIdsToResolve = [
        ...new Set(
          enrichedResults
            .filter((r) => !r.subjectLabel || r.subjectLabel === r.subject)
            .map((r) => r.subject)
            .filter((s) =>
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                s,
              ),
            ),
        ),
      ];

      if (subjectIdsToResolve.length > 0) {
        const { data: subjectsData } = await supabase
          .from('subjects')
          .select('id, name_bn, name')
          .in('id', subjectIdsToResolve);

        if (subjectsData && subjectsData.length > 0) {
          const subjectLabelMap = new Map<string, string>(
            (
              subjectsData as { id: string; name_bn?: string; name?: string }[]
            ).map((s) => [s.id, s.name_bn || s.name || s.id]),
          );

          return enrichedResults.map((r) => {
            if (
              subjectLabelMap.has(r.subject) &&
              (!r.subjectLabel || r.subjectLabel === r.subject)
            ) {
              return { ...r, subjectLabel: subjectLabelMap.get(r.subject)! };
            }
            return r;
          });
        }
      }

      return enrichedResults;
    }
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

export const clearExamHistory = async (): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    // Delete from DB
    const { error } = await supabase
      .from('exam_results')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to clear exam history from DB:', error);
      return false;
    }

    // Clear local storage as well
    if (typeof window !== 'undefined') {
      localStorage.removeItem('obhyash_exam_history');
    }

    return true;
  } catch (error) {
    console.error('Error clearing exam history:', error);
    return false;
  }
};

export const deleteExamResult = async (examId: string): Promise<boolean> => {
  if (!isSupabaseConfigured() || !supabase) return false;

  try {
    const { error } = await supabase
      .from('exam_results')
      .delete()
      .eq('id', examId);

    if (error) {
      console.error(`Failed to delete exam result ${examId}:`, error);
      return false;
    }

    // Update local storage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('obhyash_exam_history');
      if (stored) {
        const history: ExamResult[] = JSON.parse(stored);
        const updated = history.filter((r) => r.id !== examId);
        localStorage.setItem('obhyash_exam_history', JSON.stringify(updated));
      }
    }

    return true;
  } catch (error) {
    console.error(`Error deleting exam result ${examId}:`, error);
    return false;
  }
};
