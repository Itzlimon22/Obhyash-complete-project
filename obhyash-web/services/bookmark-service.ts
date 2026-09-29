import { supabase, isSupabaseConfigured } from './core';
import { Question } from '@/lib/types';

// In-memory cache for instant 0ms subsequent loading
let memoryBookmarksCache: {
  userId: string;
  questions: Question[];
  timestamp: number;
} | null = null;

export const getCachedBookmarkedQuestions = (userId: string): Question[] | null => {
  if (memoryBookmarksCache && memoryBookmarksCache.userId === userId) {
    return memoryBookmarksCache.questions;
  }
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`obhyash_bookmarks_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryBookmarksCache = {
            userId,
            questions: parsed,
            timestamp: Date.now(),
          };
          return parsed;
        }
      }
    } catch (_) {}
  }
  return null;
};

export const invalidateBookmarksCache = (userId?: string) => {
  if (userId) {
    if (memoryBookmarksCache?.userId === userId) {
      memoryBookmarksCache = null;
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`obhyash_bookmarks_${userId}`);
      } catch (_) {}
    }
  } else {
    memoryBookmarksCache = null;
  }
};

export const toggleBookmark = async (
  userId: string,
  questionId: string | number,
  isBookmarked: boolean,
  isPro: boolean = false,
): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    console.warn('Database not configured');
    return false;
  }

  try {
    const qId = questionId;

    if (isBookmarked) {
      // Remove bookmark
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('question_id', qId);

      if (error) throw error;

      if (memoryBookmarksCache && memoryBookmarksCache.userId === userId) {
        memoryBookmarksCache.questions = memoryBookmarksCache.questions.filter(
          (q) => String(q.id) !== String(qId),
        );
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(
              `obhyash_bookmarks_${userId}`,
              JSON.stringify(memoryBookmarksCache.questions),
            );
          } catch (_) {}
        }
      }

      return false;
    } else {
      // For free tier users, verify current bookmark count before adding
      if (!isPro) {
        const { count, error: countErr } = await supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId);

        if (!countErr && typeof count === 'number' && count >= 25) {
          const err = new Error('BOOKMARK_LIMIT_EXCEEDED');
          (err as any).code = 'BOOKMARK_LIMIT_EXCEEDED';
          throw err;
        }
      }

      // Add bookmark
      const { error } = await supabase.from('bookmarks').insert({
        user_id: userId,
        question_id: qId,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
      invalidateBookmarksCache(userId);
      return true;
    }
  } catch (error) {
    console.error('Toggle Bookmark Error:', error);
    throw error;
  }
};

export const getUserBookmarks = async (
  userId: string,
): Promise<Set<number | string>> => {
  if (!isSupabaseConfigured()) return new Set();

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('question_id')
      .eq('user_id', userId);

    if (error) throw error;

    const bookmarkSet = new Set<number | string>();
    data?.forEach((item: { question_id: number | string }) => {
      bookmarkSet.add(item.question_id);
    });
    return bookmarkSet;
  } catch (error) {
    console.error('Get Bookmarks Error:', error);
    return new Set();
  }
};

/**
 * Comprehensive question normalization supporting both web and Flutter schema variants.
 */
export function normalizeQuestion(d: any, bookmarkedAt?: Date): Question {
  if (!d) {
    return {
      id: '',
      question: '',
      options: [],
      correctAnswer: '',
      correctAnswerIndex: 0,
      correctAnswerIndices: [0],
      subject: 'general',
      chapter: '',
      status: 'Approved',
      author: 'system',
      createdAt: new Date().toISOString(),
      version: 1,
      tags: [],
      type: 'MCQ',
      difficulty: 'Medium',
    };
  }

  // 1. Parse options
  let opts: string[] = [];
  if (Array.isArray(d.options)) {
    opts = d.options.map((e: any) => {
      if (typeof e === 'object' && e !== null) {
        return e.text || e.option || '';
      }
      return String(e ?? '');
    });
  }

  // 2. Parse exam_history
  let validExamHistory: any[] = [];
  const rawHistory = d.exam_history || d.examHistory;
  if (Array.isArray(rawHistory)) {
    validExamHistory = rawHistory.map((item: any) => ({
      institute: item?.institute || '',
      code: item?.code || '',
      year: Number(item?.year) || 0,
    }));
  }

  // 3. Parse institutes
  let insts: string[] = [];
  if (Array.isArray(d.institutes)) {
    insts = d.institutes.map((e: any) => String(e).trim()).filter(Boolean);
  } else {
    const raw = d.institute ?? d.institution ?? d.board;
    if (raw) {
      insts = String(raw)
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);
    }
  }

  // 4. Parse years
  let yrs: number[] = [];
  if (Array.isArray(d.years)) {
    for (const y of d.years) {
      if (typeof y === 'number') yrs.push(y);
      else if (y) {
        const parsed = parseInt(String(y).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) yrs.push(parsed);
      }
    }
  } else if (d.year) {
    const parts = String(d.year).split(',');
    for (const p of parts) {
      const parsed = parseInt(p.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(parsed) && parsed > 0) yrs.push(parsed);
    }
  }

  // Synchronize history & legacy fields
  if (validExamHistory.length > 0) {
    if (insts.length === 0) {
      insts = validExamHistory
        .map((h) => h.institute || h.code)
        .filter(Boolean);
    }
    if (yrs.length === 0) {
      yrs = validExamHistory.map((h) => h.year).filter((y) => y > 0);
    }
  }

  // 5. Correct answer resolution
  let correctIdx = 0;
  let correctIndices: number[] = [];

  const rawIndices = d.correct_answer_indices || d.correctAnswerIndices;
  if (Array.isArray(rawIndices) && rawIndices.length > 0) {
    for (const item of rawIndices) {
      const p = typeof item === 'number' ? item : parseInt(String(item), 10);
      if (!isNaN(p)) correctIndices.push(p);
    }
    if (correctIndices.length > 0) correctIdx = correctIndices[0];
  } else if (
    typeof d.correct_answer_index === 'number' ||
    typeof d.correctAnswerIndex === 'number'
  ) {
    correctIdx = d.correct_answer_index ?? d.correctAnswerIndex;
    correctIndices = [correctIdx];
  } else if (d.correct_answer !== undefined || d.correctAnswer !== undefined) {
    const raw = String(d.correct_answer ?? d.correctAnswer).trim();
    const asInt = parseInt(raw, 10);
    if (!isNaN(asInt) && asInt >= 0 && asInt < (opts.length || 4)) {
      correctIdx = asInt;
    } else if (raw.length === 1) {
      const upper = raw.toUpperCase();
      if (upper === 'A') correctIdx = 0;
      else if (upper === 'B') correctIdx = 1;
      else if (upper === 'C') correctIdx = 2;
      else if (upper === 'D') correctIdx = 3;
    } else {
      const idx = opts.indexOf(raw);
      if (idx !== -1) correctIdx = idx;
    }
    correctIndices = [correctIdx];
  }

  if (correctIndices.length === 0) {
    correctIndices = [correctIdx];
  }

  const resolvedQuestionText = d.question || d.question_text || '';
  const resolvedExplanation =
    d.explanation || d.explanation_text || d.solution || '';

  return {
    ...d,
    id: String(d.id ?? ''),
    question: resolvedQuestionText,
    options: opts,
    correctAnswer: (d.correct_answer ||
      d.correctAnswer ||
      opts[correctIdx] ||
      'A') as string,
    correctAnswerIndex: correctIdx,
    correctAnswerIndices: correctIndices,
    subject: d.subject || d.subject_id || 'general',
    subjectId: d.subject_id || d.subject || '',
    subjectLabel: d.subject_label || d.subjectLabel || d.subject || 'General',
    chapter: d.chapter || d.chapter_id || '',
    chapterId: d.chapter_id || d.chapter || '',
    topic: d.topic || d.topic_id || '',
    topicId: d.topic_id || d.topic || '',
    explanation: resolvedExplanation,
    imageUrl: d.image_url || d.imageUrl,
    optionImages: d.option_images || d.optionImages || [],
    explanationImageUrl: d.explanation_image_url || d.explanationImageUrl,
    exam_history: validExamHistory,
    examHistory: validExamHistory,
    institutes: insts,
    years: yrs,
    passage: d.passage || null,
    points: typeof d.points === 'number' ? d.points : 1,
    bookmarkedAt: bookmarkedAt ? bookmarkedAt.toISOString() : d.bookmarkedAt,
  };
}

/**
 * Fetch full question data for all bookmarked questions of a user.
 * Fetches from bookmarks, then queries questions table and falls back to exam_results.
 */
export const getBookmarkedQuestions = async (
  userId: string,
  customClient?: any,
): Promise<Question[]> => {
  const sb = customClient || supabase;
  if (!isSupabaseConfigured() || !sb) return [];

  try {
    // 1. Fetch user bookmarks
    const { data: bData, error: bErr } = await sb
      .from('bookmarks')
      .select('question_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bErr || !bData || bData.length === 0) return [];

    const qIds: string[] = (bData || [])
      .map((e: any) => e.question_id?.toString() || '')
      .filter((id: string) => id.length > 0);

    if (qIds.length === 0) return [];

    const dateMap = new Map<string, Date>();
    bData.forEach((e: any) => {
      const qid = e.question_id?.toString() || '';
      if (qid) {
        dateMap.set(qid, e.created_at ? new Date(e.created_at) : new Date());
      }
    });

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const uuidIds = qIds.filter((id: string) => uuidRegex.test(id));

    const questionMap = new Map<string, Question>();

    // 2. Fetch from 'questions' table in parallel chunks of 50 (only valid UUIDs to avoid 22P02 error)
    const chunkPromises: Promise<any[]>[] = [];
    for (let i = 0; i < uuidIds.length; i += 50) {
      const chunk = uuidIds.slice(i, i + 50);
      chunkPromises.push(
        sb
          .from('questions')
          .select('*')
          .in('id', chunk)
          .then(({ data, error }: any) => {
            if (error) console.warn('[getBookmarkedQuestions] chunk query error:', error);
            return data || [];
          })
          .catch((chunkErr: any) => {
            console.warn('[getBookmarkedQuestions] chunk fetch error:', chunkErr);
            return [];
          }),
      );
    }

    const chunkResults = await Promise.all(chunkPromises);
    chunkResults.forEach((qData) => {
      if (Array.isArray(qData)) {
        qData.forEach((d: any) => {
          if (d && d.id !== undefined && d.id !== null) {
            const qid = String(d.id);
            questionMap.set(qid, normalizeQuestion(d, dateMap.get(qid)));
          }
        });
      }
    });

    // 3. Fallback 1: LocalStorage cache for questions FIRST (instant client-side read)
    const missingAfterDb = qIds.filter((id: string) => !questionMap.has(id));
    if (missingAfterDb.length > 0 && typeof window !== 'undefined') {
      try {
        const cachedJson =
          localStorage.getItem('obhyash_cached_questions') ||
          localStorage.getItem('obhyash_all_questions');
        if (cachedJson) {
          const cachedList = JSON.parse(cachedJson);
          if (Array.isArray(cachedList)) {
            cachedList.forEach((item: any) => {
              if (item && item.id !== undefined && item.id !== null) {
                const sId = String(item.id);
                if (missingAfterDb.includes(sId) && !questionMap.has(sId)) {
                  questionMap.set(
                    sId,
                    normalizeQuestion(item, dateMap.get(sId)),
                  );
                }
              }
            });
          }
        }
      } catch (_) {}
    }

    // 4. Fallback 2: Search missing questions in user's exam_results (limited to last 10 exams for super fast load)
    const stillMissing = qIds.filter((id: string) => !questionMap.has(id));
    if (stillMissing.length > 0) {
      try {
        const { data: examRes } = await sb
          .from('exam_results')
          .select('questions')
          .eq('user_id', userId)
          .not('questions', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);

        if (examRes) {
          examRes.forEach((row: any) => {
            const qList = row.questions;
            if (Array.isArray(qList)) {
              qList.forEach((item: any) => {
                if (item && item.id !== undefined && item.id !== null) {
                  const sId = String(item.id);
                  if (stillMissing.includes(sId) && !questionMap.has(sId)) {
                    questionMap.set(
                      sId,
                      normalizeQuestion(item, dateMap.get(sId)),
                    );
                  }
                }
              });
            }
          });
        }
      } catch (fallbackErr) {
        console.warn(
          '[getBookmarkedQuestions] fallback search error:',
          fallbackErr,
        );
      }
    }

    // 5. Return questions in original bookmark order
    const ordered: Question[] = [];
    qIds.forEach((id: string) => {
      if (questionMap.has(id)) {
        ordered.push(questionMap.get(id)!);
      }
    });

    // Update memory and localStorage cache
    memoryBookmarksCache = {
      userId,
      questions: ordered,
      timestamp: Date.now(),
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`obhyash_bookmarks_${userId}`, JSON.stringify(ordered));
      } catch (_) {}
    }

    return ordered;
  } catch (error) {
    console.error('Get Bookmarked Questions Error:', error);
    return [];
  }
};
