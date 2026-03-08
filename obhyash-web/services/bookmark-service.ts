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
 * Joins bookmarks → questions so the bookmarks tab works independently of exam history.
 */
export const getBookmarkedQuestions = async (
  userId: string,
): Promise<Question[]> => {
  if (!isSupabaseConfigured() || !supabase) return [];

  try {
    const { data: bookmarkRows, error: bErr } = await supabase
      .from('bookmarks')
      .select('question_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bErr || !bookmarkRows || bookmarkRows.length === 0) return [];

    const ids = bookmarkRows.map((r: { question_id: string | number }) =>
      String(r.question_id),
    );

    const { data: rows, error: qErr } = await supabase
      .from('questions')
      .select('*')
      .in('id', ids);

    if (qErr || !rows) return [];

    // Preserve bookmark order (most recently bookmarked first)
    const orderMap = Object.fromEntries(ids.map((id, i) => [id, i]));

    return (rows as Record<string, unknown>[])
      .map((d) => ({
        ...(d as object),
        id: String(d.id),
        correctAnswer: d.correct_answer as string,
        correctAnswerIndex: d.correct_answer_index as number,
        correctAnswerIndices: (d.correct_answer_indices as number[]) || [],
        subjectId: d.subject_id as string,
        chapterId: d.chapter_id as string,
        topicId: d.topic_id as string,
        imageUrl: d.image_url as string | undefined,
        optionImages: (d.option_images as string[]) || [],
        explanationImageUrl: d.explanation_image_url as string | undefined,
      }))
      .sort(
        (a, b) => (orderMap[a.id] ?? 999) - (orderMap[b.id] ?? 999),
      ) as unknown as Question[];
  } catch (error) {
    console.error('Get Bookmarked Questions Error:', error);
    return [];
  }
};
