import { supabase, isSupabaseConfigured } from './core';
import { Question } from '@/lib/types';

export const toggleBookmark = async (
  userId: string,
  questionId: string | number,
  isBookmarked: boolean,
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
      return false;
    } else {
      // Add bookmark
      const { error } = await supabase.from('bookmarks').insert({
        user_id: userId,
        question_id: qId,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
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
 * Fetch full question data for all bookmarked questions of a user.
 * Fetches from bookmarks, then queries questions table and falls back to exam_results.
 */
export const getBookmarkedQuestions = async (
  userId: string,
): Promise<Question[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    // 1. Fetch user bookmarks
    const { data: bData, error: bErr } = await supabase
      .from('bookmarks')
      .select('question_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bErr || !bData || bData.length === 0) return [];

    const qIds = bData
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

    const questionMap = new Map<string, Question>();

    // 2. Fetch from 'questions' table in chunks of 50
    for (let i = 0; i < qIds.length; i += 50) {
      const chunk = qIds.slice(i, i + 50);
      try {
        const { data: qData } = await supabase
          .from('questions')
          .select('*')
          .in('id', chunk);

        if (qData) {
          qData.forEach((d: any) => {
            if (d && d.id) {
              const qObj: Question = {
                ...d,
                id: String(d.id),
                question: d.question || d.question_text || '',
                options: d.options || [],
                correctAnswer: (d.correct_answer || d.correctAnswer || 'A') as string,
                correctAnswerIndex:
                  typeof d.correct_answer_index === 'number'
                    ? d.correct_answer_index
                    : typeof d.correctAnswerIndex === 'number'
                    ? d.correctAnswerIndex
                    : 0,
                correctAnswerIndices:
                  d.correct_answer_indices || d.correctAnswerIndices || [],
                subject: d.subject || d.subject_id || '',
                subjectId: d.subject_id || d.subject || '',
                chapter: d.chapter || d.chapter_id || '',
                chapterId: d.chapter_id || d.chapter || '',
                topicId: d.topic_id || d.topic || '',
                explanation: d.explanation || '',
                imageUrl: d.image_url || d.imageUrl,
                optionImages: d.option_images || d.optionImages || [],
                explanationImageUrl:
                  d.explanation_image_url || d.explanationImageUrl,
                bookmarkedAt: dateMap.get(String(d.id)),
              };
              questionMap.set(String(d.id), qObj);
            }
          });
        }
      } catch (chunkErr) {
        console.warn('[getBookmarkedQuestions] chunk fetch error:', chunkErr);
      }
    }

    // 3. Fallback: Search missing questions in exam_results
    const missingIds = qIds.filter((id) => !questionMap.has(id));
    if (missingIds.length > 0) {
      try {
        const { data: examRes } = await supabase
          .from('exam_results')
          .select('questions')
          .eq('user_id', userId)
          .not('questions', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50);

        if (examRes) {
          examRes.forEach((row: any) => {
            const qList = row.questions;
            if (Array.isArray(qList)) {
              qList.forEach((item: any) => {
                if (item && item.id && missingIds.includes(String(item.id))) {
                  const sId = String(item.id);
                  if (!questionMap.has(sId)) {
                    questionMap.set(sId, {
                      ...item,
                      id: sId,
                      bookmarkedAt: dateMap.get(sId),
                    } as Question);
                  }
                }
              });
            }
          });
        }
      } catch (fallbackErr) {
        console.warn('[getBookmarkedQuestions] fallback search error:', fallbackErr);
      }
    }

    // 4. Return questions in original bookmark order
    const ordered: Question[] = [];
    qIds.forEach((id) => {
      if (questionMap.has(id)) {
        ordered.push(questionMap.get(id)!);
      }
    });

    return ordered;
  } catch (error) {
    console.error('Get Bookmarked Questions Error:', error);
    return [];
  }
};
