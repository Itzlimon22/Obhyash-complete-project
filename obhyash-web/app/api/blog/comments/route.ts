import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { rateLimitResponse } from '@/lib/utils/rate-limit';

function getDbClient(token?: string | null) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  if (token) {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { persistSession: false },
      },
    );
  }
  return null;
}

async function getAuthUserAndToken(request: NextRequest, supabase: any) {
  const authHeader =
    request.headers.get('authorization') ||
    request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (data?.user && !error) return { user: data.user, token };
    }
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { user: user ?? null, token: null };
}

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
    const { user, token } = await getAuthUserAndToken(request, supabase);
    const db = getDbClient(token) || supabase;

    // Fetch comments with upvote_count
    const { data: comments, error } = await db
      .from('blog_comments')
      .select(
        'id, post_slug, user_id, parent_id, content, created_at, updated_at, upvote_count, user:user_id(name, avatarUrl:avatar_url, avatarColor:avatar_color)',
      )
      .eq('post_slug', slug)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Merge user_upvoted flag for the current session user
    let userUpvotedIds: string[] = [];
    if (user && comments && comments.length > 0) {
      const { data: upvoteRows } = await db
        .from('blog_comment_upvotes')
        .select('comment_id')
        .eq('user_id', user.id)
        .in(
          'comment_id',
          comments.map((c: any) => c.id),
        );
      userUpvotedIds = (upvoteRows ?? []).map((r: any) => r.comment_id);
    }

    const enriched = (comments ?? []).map((c: any) => ({
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
    const { user, token } = await getAuthUserAndToken(request, supabase);

    if (!user) {
      return NextResponse.json(
        { error: 'You must be logged in to comment' },
        { status: 401 },
      );
    }

    // Rate limit: 20 comments per minute per user
    const rl = rateLimitResponse(`comments:${user.id}`, 20, 60_000);
    if (rl.limited) return rl.response;

    const { slug, content, parentId } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const trimmed = (content ?? '').trim();
    if (!trimmed) {
      return NextResponse.json(
        { error: 'Comment content cannot be empty' },
        { status: 400 },
      );
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        {
          error: `Comment must be at most ${MAX_COMMENT_LENGTH} characters`,
        },
        { status: 400 },
      );
    }

    const db = getDbClient(token) || supabase;

    const { data: inserted, error: insertError } = await db
      .from('blog_comments')
      .insert({
        post_slug: slug,
        user_id: user.id,
        content: trimmed,
        parent_id: parentId ?? null,
      })
      .select(
        'id, post_slug, user_id, parent_id, content, created_at, updated_at, upvote_count, user:user_id(name, avatarUrl:avatar_url, avatarColor:avatar_color)',
      )
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({
      comment: {
        ...inserted,
        upvote_count: 0,
        user_upvoted: false,
      },
    });
  } catch (error: any) {
    console.error('Error posting comment:', error);
    return NextResponse.json(
      { error: 'Failed to post comment' },
      { status: 500 },
    );
  }
}
