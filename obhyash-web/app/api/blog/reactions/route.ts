import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/blog/reactions?slug=some-slug
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug)
    return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const supabase = await createClient();

  // Public counts — no auth needed
  const { data: rows, error } = await supabase
    .from('blog_reactions')
    .select('emoji, user_id')
    .eq('post_slug', slug);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const row of rows ?? []) {
    counts[row.emoji] = (counts[row.emoji] ?? 0) + 1;
  }

  // User's own reactions (if logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userReactions = user
    ? (rows ?? []).filter((r) => r.user_id === user.id).map((r) => r.emoji)
    : [];

  return NextResponse.json({ counts, userReactions });
}

// POST /api/blog/reactions  — body: { slug, emoji }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug, emoji } = await req.json();
  if (!slug || !emoji)
    return NextResponse.json(
      { error: 'slug and emoji required' },
      { status: 400 },
    );

  // Check if already reacted with this emoji
  const { data: existing } = await supabase
    .from('blog_reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_slug', slug)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    // Toggle off
    await supabase
      .from('blog_reactions')
      .delete()
      .eq('user_id', user.id)
      .eq('post_slug', slug)
      .eq('emoji', emoji);
  } else {
    await supabase
      .from('blog_reactions')
      .insert({ user_id: user.id, post_slug: slug, emoji });
  }

  // Return fresh counts
  const { data: rows } = await supabase
    .from('blog_reactions')
    .select('emoji, user_id')
    .eq('post_slug', slug);

  const counts: Record<string, number> = {};
  for (const row of rows ?? []) {
    counts[row.emoji] = (counts[row.emoji] ?? 0) + 1;
  }
  const userReactions = (rows ?? [])
    .filter((r) => r.user_id === user.id)
    .map((r) => r.emoji);

  return NextResponse.json({ counts, userReactions, reacted: !existing });
}
