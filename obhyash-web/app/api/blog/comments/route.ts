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

const MAX_COMMENT_LENGTH = 1000;

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

    // Fetch comments with graceful fallback if upvote_count column is missing
    let comments: any[] | null = null;
    let queryError: any = null;

    const res = await db
      .from('blog_comments')
      .select(
        'id, post_slug, user_id, parent_id, content, created_at, updated_at, upvote_count, user:user_id(name, avatarUrl:avatar_url, avatarColor:avatar_color)',
      )
      .eq('post_slug', slug)
      .order('created_at', { ascending: true });

    if (res.error) {
      // Fallback if upvote_count column does not exist
      const fallbackRes = await db
        .from('blog_comments')
        .select(
          'id, post_slug, user_id, parent_id, content, created_at, updated_at, user:user_id(name, avatarUrl:avatar_url, avatarColor:avatar_color)',
        )
        .eq('post_slug', slug)
        .order('created_at', { ascending: true });

      if (fallbackRes.error) {
        throw fallbackRes.error;
      }
      comments = fallbackRes.data;
    } else {
      comments = res.data;
    }

    // Merge user_upvoted flag for the current session user
    let userUpvotedIds: string[] = [];
    if (user && comments && comments.length > 0) {
      try {
        const { data: upvoteRows } = await db
          .from('blog_comment_upvotes')
          .select('comment_id')
          .eq('user_id', user.id)
          .in(
            'comment_id',
            comments.map((c: any) => c.id),
          );
        userUpvotedIds = (upvoteRows ?? []).map((r: any) => r.comment_id);
      } catch (_) {}
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
      { error: error.message || 'Failed to fetch comments' },
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
        { error: 'কমেন্ট করতে প্রথমে লগইন করো।' },
        { status: 401 },
      );
    }

    // Rate limit: 10 comments per minute per user
    const rl = rateLimitResponse(`comments:${user.id}`, 10, 60_000);
    if (rl.limited) return rl.response;

    const { slug, content, parentId } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const trimmed = (content ?? '').trim();
    if (!trimmed || trimmed.length < 3) {
      return NextResponse.json(
        { error: 'কমেন্ট অন্তত ৩ অক্ষরের হতে হবে।' },
        { status: 400 },
      );
    }

    if (trimmed.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        {
          error: `কমেন্ট সর্বোচ্চ ${MAX_COMMENT_LENGTH} অক্ষরের মধ্যে হতে হবে।`,
        },
        { status: 400 },
      );
    }

    const db = getDbClient(token) || supabase;

    let inserted: any = null;
    const insertRes = await db
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

    if (insertRes.error) {
      // Fallback if upvote_count column does not exist
      const fallbackInsert = await db
        .from('blog_comments')
        .insert({
          post_slug: slug,
          user_id: user.id,
          content: trimmed,
          parent_id: parentId ?? null,
        })
        .select(
          'id, post_slug, user_id, parent_id, content, created_at, updated_at, user:user_id(name, avatarUrl:avatar_url, avatarColor:avatar_color)',
        )
        .single();

      if (fallbackInsert.error) {
        throw fallbackInsert.error;
      }
      inserted = fallbackInsert.data;
    } else {
      inserted = insertRes.data;
    }

    return NextResponse.json({
      comment: {
        ...inserted,
        upvote_count: inserted?.upvote_count ?? 0,
        user_upvoted: false,
      },
    });
  } catch (error: any) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: error.message || 'কমেন্ট পোস্ট করতে সমস্যা হয়েছে।' },
      { status: 400 },
    );
  }
}
