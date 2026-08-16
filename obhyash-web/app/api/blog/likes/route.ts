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

    // 1. Get total likes count
    const { count, error: countError } = await db
      .from('blog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_slug', slug);

    if (countError) throw countError;

    // 2. Check if current user liked
    let hasLiked = false;
    if (user) {
      const { data: userLike } = await db
        .from('blog_likes')
        .select('id')
        .eq('post_slug', slug)
        .eq('user_id', user.id)
        .maybeSingle();

      if (userLike) hasLiked = true;
    }

    return NextResponse.json({
      likes: count || 0,
      hasLiked,
    });
  } catch (error: any) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
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
        { error: 'You must be logged in to like posts' },
        { status: 401 },
      );
    }

    // Rate limit: 30 like toggles per minute per user
    const rl = rateLimitResponse(`likes:${user.id}`, 30, 60_000);
    if (rl.limited) return rl.response;

    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const db = getDbClient(token) || supabase;

    // Check if like exists
    const { data: existingLike } = await db
      .from('blog_likes')
      .select('id')
      .eq('post_slug', slug)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingLike) {
      const { error: deleteError } = await db
        .from('blog_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;
      return NextResponse.json({ hasLiked: false });
    } else {
      const { error: insertError } = await db.from('blog_likes').insert({
        post_slug: slug,
        user_id: user.id,
      });

      if (insertError) throw insertError;
      return NextResponse.json({ hasLiked: true });
    }
  } catch (error: any) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like status' },
      { status: 500 },
    );
  }
}
