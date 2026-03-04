import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/utils/rate-limit';

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

    // 1. Get total likes count
    const { count, error: countError } = await supabase
      .from('blog_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_slug', slug);

    if (countError) throw countError;

    // 2. Check if the current user has liked it (if logged in)
    let hasLiked = false;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: userLike } = await supabase
        .from('blog_likes')
        .select('id')
        .eq('post_slug', slug)
        .eq('user_id', user.id)
        .single();

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

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // Check if the like already exists
    const { data: existingLike } = await supabase
      .from('blog_likes')
      .select('id')
      .eq('post_slug', slug)
      .eq('user_id', user.id)
      .single();

    if (existingLike) {
      // Unlike (Delete the record)
      const { error: deleteError } = await supabase
        .from('blog_likes')
        .delete()
        .eq('id', existingLike.id);

      if (deleteError) throw deleteError;

      return NextResponse.json({ hasLiked: false });
    } else {
      // Like (Insert a new record)
      const { error: insertError } = await supabase.from('blog_likes').insert({
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
