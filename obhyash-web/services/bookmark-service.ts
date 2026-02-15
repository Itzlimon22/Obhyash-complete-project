import { supabase, isSupabaseConfigured } from './core';

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
    const qId =
      typeof questionId === 'string' ? parseInt(questionId) : questionId;

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
): Promise<Set<number>> => {
  if (!isSupabaseConfigured()) return new Set();

  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('question_id')
      .eq('user_id', userId);

    if (error) throw error;

    const bookmarkSet = new Set<number>();
    data?.forEach((item: any) => {
      bookmarkSet.add(item.question_id);
    });
    return bookmarkSet;
  } catch (error) {
    console.error('Get Bookmarks Error:', error);
    return new Set();
  }
};
