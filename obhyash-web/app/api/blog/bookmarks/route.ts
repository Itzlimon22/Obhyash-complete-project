import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/utils/rate-limit';

// GET /api/blog/bookmarks — returns array of bookmarked slugs for current user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ slugs: [] });
    }

    const { data, error } = await supabase
      .from('blog_bookmarks')
      .select('post_slug')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json(
      { slugs: data.map((r) => r.post_slug) },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json(
      { slugs: [] },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}

// POST /api/blog/bookmarks — toggles bookmark for a slug, returns { bookmarked }
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 60 bookmark toggles per minute per user
    const rl = rateLimitResponse(`bookmarks:${user.id}`, 60, 60_000);
    if (rl.limited) return rl.response;

    const { slug } = await request.json();
    if (!slug) {
      return NextResponse.json({ error: 'slug required' }, { status: 400 });
    }

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from('blog_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_slug', slug)
      .single();

    if (existing) {
      await supabase
        .from('blog_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_slug', slug);
      return NextResponse.json({ bookmarked: false });
    } else {
      await supabase
        .from('blog_bookmarks')
        .insert({ user_id: user.id, post_slug: slug });
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to toggle bookmark' },
      { status: 500 },
    );
  }
}
