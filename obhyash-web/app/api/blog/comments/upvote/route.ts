import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/utils/rate-limit';

// POST /api/blog/comments/upvote  — body: { commentId }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to upvote' },
        { status: 401 },
      );
    }

    // Rate limit: 60 upvote toggles per minute per user
    const rl = rateLimitResponse(`comment-upvote:${user.id}`, 60, 60_000);
    if (rl.limited) return rl.response;

    const { commentId } = await request.json();
    if (!commentId) {
      return NextResponse.json(
        { error: 'commentId is required' },
        { status: 400 },
      );
    }

    // Check if already upvoted
    const { data: existing } = await supabase
      .from('blog_comment_upvotes')
      .select('comment_id')
      .eq('comment_id', commentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('blog_comment_upvotes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('blog_comment_upvotes')
        .insert({ comment_id: commentId, user_id: user.id });
    }

    // Return updated count
    const { data: comment } = await supabase
      .from('blog_comments')
      .select('upvote_count')
      .eq('id', commentId)
      .single();

    return NextResponse.json({
      upvote_count: comment?.upvote_count ?? 0,
      user_upvoted: !existing,
    });
  } catch (error: unknown) {
    console.error('Error toggling comment upvote:', error);
    return NextResponse.json(
      { error: 'Failed to toggle upvote' },
      { status: 500 },
    );
  }
}
