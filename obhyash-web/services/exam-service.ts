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

    // 1. Resolve multi-select parameters
    const difficultyList =
      config.difficulty &&
      config.difficulty !== 'Mixed' &&
      config.difficulty !== 'All'
        ? config.difficulty.split('+').map((d) => d.trim())
        : [null];

    const examTypeList =
      config.examType &&
      config.examType !== 'Mixed' &&
      config.examType !== 'All'
        ? config.examType.split('+').map((t) => t.trim())
        : [null];

    const resolvedChapters =
      config.chapters && config.chapters !== 'All'
        ? config.chapters.split(',').map((c) => c.trim())
        : null;

    const resolvedTopics =
      config.topics && config.topics !== 'General' && config.topics !== 'All'
        ? config.topics.split(',').map((t) => t.trim())
        : null;

    // 2. Normalize subject name for Dual-Match robustness
    const subjectName = config.subjectLabel || '';
    const nameForms = [subjectName];
    const nfd = subjectName.normalize('NFD');
    if (nfd !== subjectName) nameForms.push(nfd);
    const nfc = subjectName.normalize('NFC');
    if (nfc !== subjectName && !nameForms.includes(nfc)) nameForms.push(nfc);

    debug.diagnosis.push(`🔍 Subject Name Forms: ${nameForms.join(', ')}`);

    // 3. Bucket Strategy: Calculate combinations and distribution
    const combinations: {
      difficulty: string | null;
      examType: string | null;
    }[] = [];
    difficultyList.forEach((d) => {
      examTypeList.forEach((t) => {
        combinations.push({ difficulty: d, examType: t });
      });
    });

    const totalNeeded = config.questionCount;
    const bucketSize = Math.floor(totalNeeded / combinations.length);
    const remainder = totalNeeded % combinations.length;

    debug.diagnosis.push(
      `🎯 Multi-bucket strategy: ${combinations.length} combinations, ~${bucketSize} per bucket`,
    );

    let allCollectedQuestions: Question[] = [];
    const seenIds = new Set<string | number>();

    // 4. Fetch per bucket
    for (let i = 0; i < combinations.length; i++) {
      const bucket = combinations[i];
      const neededForThisBucket = bucketSize + (i < remainder ? 1 : 0);

      debug.diagnosis.push(
        `📦 Bucket ${i + 1}: Difficulty=${bucket.difficulty || 'All'}, ExamType=${bucket.examType || 'All'}, Target=${neededForThisBucket}`,
      );

      // --- FETCH LOGIC FOR ONE BUCKET ---
      let bucketQuestions: Question[] = [];

      if (user) {
        // Try RPC Smart Fetch
        let rpcSuccess = false;
        for (const formName of nameForms) {
          const { data, error } = await supabase.rpc(
            'get_smart_exam_questions',
            {
              p_user_id: user.id,
              p_subject: config.subject,
              p_limit: neededForThisBucket * 2, // Fetch extra for deduplication margin
              p_chapters: resolvedChapters,
              p_topics: resolvedTopics,
              p_difficulty: bucket.difficulty,
              p_exam_types: bucket.examType ? [bucket.examType] : null,
              p_subject_name: formName,
            },
          );

          if (error) {
            debug.rpcError = error.message;
            continue;
          }

          if (data && data.length > 0) {
            bucketQuestions = (data as unknown as QuestionDbRow[]).map(
              (q) =>
                ({
                  ...q,
                  createdAt: q.created_at,
                  correctAnswer: q.correct_answer,
                  correctAnswerIndex: q.correct_answer_index,
                  correctAnswerIndices: q.correct_answer_indices || [],
                  imageUrl: q.image_url,
                  optionImages: q.option_images || [],
                  explanationImageUrl: q.explanation_image_url,
                  examType: q.exam_type,
                }) as unknown as Question,
            );
            rpcSuccess = true;
            break;
          }
        }

        if (rpcSuccess) {
          debug.fetchMethod = 'SMART_RPC_MULTI';
        } else {
          debug.diagnosis.push(
            `⚠️ Bucket ${i + 1} RPC returned 0, falling back`,
          );
        }
      }

      // Fallback to Legacy Fetch for bucket
      if (bucketQuestions.length === 0) {
        let query = supabase.from('questions').select('*');

        // Subject filter
        const matchConditions = [`subject.eq.${config.subject}`];
        if (config.subject !== config.subjectLabel && config.subjectLabel) {
          matchConditions.push(`subject.eq.${config.subjectLabel}`);
        }
        nameForms.forEach((form) => {
          if (form !== config.subject && form !== config.subjectLabel) {
            matchConditions.push(`subject.eq.${form}`);
          }
        });
        query = query.or(matchConditions.join(','));

        if (resolvedChapters) query = query.in('chapter', resolvedChapters);
        if (resolvedTopics) query = query.in('topic', resolvedTopics);
        if (bucket.difficulty)
          query = query.ilike('difficulty', `%${bucket.difficulty}%`);
        if (bucket.examType)
          query = query.ilike('exam_type', `%${bucket.examType}%`);

        query = query.limit(neededForThisBucket * 3); // Overfetch for random selection

        const { data, error } = await query;
        if (error) {
          debug.queryError = error.message;
          debug.diagnosis.push(
            `❌ Bucket ${i + 1} Legacy Error: ${error.message}`,
          );
        } else if (data && data.length > 0) {
          bucketQuestions = (data as unknown as QuestionDbRow[]).map(
            (q) =>
              ({
                ...q,
                createdAt: q.created_at,
                correctAnswer: q.correct_answer,
                correctAnswerIndex: q.correct_answer_index,
                correctAnswerIndices: q.correct_answer_indices || [],
                imageUrl: q.image_url,
                optionImages: q.option_images || [],
                explanationImageUrl: q.explanation_image_url,
                examType: q.exam_type,
              }) as unknown as Question,
          );
          if (debug.fetchMethod === 'none') debug.fetchMethod = 'LEGACY_MULTI';
        }
      }

      // Add unique questions from this bucket
      let addedFromThisBucket = 0;
      const shuffledBucket = bucketQuestions.sort(() => 0.5 - Math.random());
      for (const q of shuffledBucket) {
        if (!seenIds.has(q.id)) {
          allCollectedQuestions.push(q);
          seenIds.add(q.id);
          addedFromThisBucket++;
          if (addedFromThisBucket >= neededForThisBucket) break;
        }
      }

      debug.diagnosis.push(
        `✅ Bucket ${i + 1} added: ${addedFromThisBucket}/${neededForThisBucket}`,
      );
    }

    // 5. Final Shuffle and Truncate
    const finalQuestions = allCollectedQuestions
      .sort(() => 0.5 - Math.random())
      .slice(0, totalNeeded);

    debug.resultCount = finalQuestions.length;
    debug.diagnosis.push(`🏁 Final total questions: ${finalQuestions.length}`);

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
      .or(matchConditions.join(','));

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

    // Insert new row with 'started' status (implicit via 0 score/null completion data)
    // We store the question IDs or full questions to ensure history matches what was taken
    const { data, error } = await supabase
      .from('exam_results')
      .insert({
        user_id: user.id,
        subject: config.subject,
        exam_type: config.examType,
        date: new Date().toISOString(),
        score: 0, // Placeholder
        total_marks: questions.reduce((acc, q) => acc + (q.points || 1), 0),
        total_questions: questions.length,
        correct_count: 0,
        wrong_count: 0,
        time_taken: 0,
        negative_marking: config.negativeMarking,
        questions: questions, // Store full questions to preserve context
        chapters: config.chapters || 'General',
        submission_type: 'started', // Use this to denote in-progress if allowed, else 'digital'
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
        correct_count: result.correctCount,
        wrong_count: result.wrongCount,
        time_taken: result.timeTaken,
        user_answers: result.userAnswers,
        status: 'evaluated', // Mark as complete so analytics can pick it up
        submission_type: result.submissionType || 'digital',
        script_image_data: result.scriptImageData,
        // Update total marks/questions just in case they changed (unlikely)
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

    if (isUuid) {
      // Update existing session
      const success = await updateExamResult(result.id, result);

      // Update Question Analytics (Best Effort)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && result.questions && result.userAnswers) {
        result.questions.forEach((q) => {
          const userAnswer = result.userAnswers![q.id];
          if (userAnswer !== undefined) {
            const isCorrect = userAnswer === q.correctAnswerIndex;
            const qId = String(q.id);
            // Fire and forget
            updateQuestionAnalytics(user.id, qId, isCorrect);
          }
        });
      }

      if (success) {
        console.log('✅ Exam session updated successfully');
        return; // Done
      } else {
        console.warn('⚠️ Update failed, falling back to insert...');
      }
    }

    // Fallback: Insert new row (Legacy behavior or if init failed)
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
        status: 'evaluated', // Mark as complete so analytics can pick it up
        flagged_questions: result.flaggedQuestions, // If db supports it
        chapters: result.chapters || 'General',
        submission_type: result.submissionType || 'digital',
        script_image_data: result.scriptImageData,
      });

      if (error) {
        console.error('Error saving exam result:', error);
        throw error;
      } else {
        console.log('✅ Exam result saved successfully (New Insert)');

        // Update Question Analytics (Best Effort)
        if (result.questions && result.userAnswers) {
          result.questions.forEach((q) => {
            const userAnswer = result.userAnswers![q.id];
            if (userAnswer !== undefined) {
              const isCorrect = userAnswer === q.correctAnswerIndex;
              const qId = String(q.id);
              updateQuestionAnalytics(user.id, qId, isCorrect);
            }
          });
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
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.warn('getExamHistory: No user found');
      return [];
    }

    const { data, error } = await supabase
      .from('exam_results')
      .select('*')
      .eq('user_id', user.id)
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
