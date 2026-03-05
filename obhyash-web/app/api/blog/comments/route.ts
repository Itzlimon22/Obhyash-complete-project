import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/utils/rate-limit';

const MAX_COMMENT_LENGTH = 2000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json(
        { error: 'Post slug is required' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Fetch comments with upvote_count
    const { data: comments, error } = await supabase
      .from('blog_comments')
      .select(
        'id, post_slug, user_id, parent_id, content, created_at, updated_at, upvote_count, user:user_id(name, avatarUrl:avatar_url, avatarColor:avatar_color)',
      )
      .eq('post_slug', slug)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Merge user_upvoted flag for the current session user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let userUpvotedIds: string[] = [];
    if (user && comments && comments.length > 0) {
      const { data: upvoteRows } = await supabase
        .from('blog_comment_upvotes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in(
          'comment_id',
          comments.map((c) => c.id),
        );
      userUpvotedIds = (upvoteRows ?? []).map((r) => r.comment_id);
    }

    const enriched = (comments ?? []).map((c) => ({
      ...c,
      upvote_count: c.upvote_count ?? 0,
      user_upvoted: userUpvotedIds.includes(c.id),
    }));

    return NextResponse.json({ comments: enriched });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'You must be logged in to comment' },
        { status: 401 },
      );
    }

    const { slug, content, parentId } = await request.json();

    if (!slug || !content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Slug and content are required' },
        { status: 400 },
      );
    }

    if (content.trim().length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    // Rate limit: 5 comments per minute per user
    const rl = rateLimitResponse(`comments:${user.id}`, 5, 60_000);
    if (rl.limited) return rl.response;

    // Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from('blog_comments')
      .insert({
        post_slug: slug,
        user_id: user.id,
        content: content.trim(),
        ...(parentId ? { parent_id: parentId } : {}),
      })
      .select(
        '*, user:user_id(name, avatarUrl:avatar_url, avatarColor:avatar_color)',
      )
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ comment: newComment });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json(
      { error: 'Failed to post comment' },
      { status: 500 },
    );
  }
}
