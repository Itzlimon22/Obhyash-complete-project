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

// GET /api/blog/bookmarks — returns array of bookmarked slugs for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { user, token } = await getAuthUserAndToken(request, supabase);

    if (!user) {
      return NextResponse.json({ slugs: [] });
    }

    const db = getDbClient(token) || supabase;
    const { data, error } = await db
      .from('blog_bookmarks')
      .select('post_slug')
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json(
      { slugs: (data ?? []).map((r) => r.post_slug) },
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
    const { user, token } = await getAuthUserAndToken(request, supabase);

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

    const db = getDbClient(token) || supabase;

    // Check if already bookmarked
    const { data: existing, error: selectError } = await db
      .from('blog_bookmarks')
      .select('id')
      .eq('user_id', user.id)
      .eq('post_slug', slug)
      .maybeSingle();

    if (selectError) {
      console.error('Error querying existing bookmark:', selectError);
    }

    if (existing) {
      const { error: deleteError } = await db
        .from('blog_bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_slug', slug);

      if (deleteError) throw deleteError;
      return NextResponse.json({ bookmarked: false });
    } else {
      const { error: insertError } = await db
        .from('blog_bookmarks')
        .insert({ user_id: user.id, post_slug: slug });

      if (insertError) throw insertError;
      return NextResponse.json({ bookmarked: true });
    }
  } catch (error: any) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to toggle bookmark' },
      { status: 500 },
    );
  }
}
