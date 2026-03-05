import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rateLimitResponse } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

// GET /api/blog/reactions?slug=some-slug
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug)
    return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const supabase = await createClient();

  // Aggregate counts via RPC — no full-table row scan
  const { data: countRows, error } = await supabase.rpc('get_reaction_counts', {
    p_slug: slug,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const row of countRows ?? []) {
    counts[row.emoji] = Number(row.reaction_count);
  }

  // User's own reactions — only a few rows per user per post, fine to fetch
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let userReactions: string[] = [];
  if (user) {
    const { data: userRows } = await supabase
      .from('blog_reactions')
      .select('emoji')
      .eq('post_slug', slug)
      .eq('user_id', user.id);
    userReactions = (userRows ?? []).map((r) => r.emoji);
  }

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

  // Rate limit: 30 reaction toggles per minute per user
  const rl = rateLimitResponse(`reactions:${user.id}`, 30, 60_000);
  if (rl.limited) return rl.response;

  const { slug, emoji } = await req.json();
  if (!slug || !emoji)
    return NextResponse.json(
      { error: 'slug and emoji required' },
      { status: 400 },
    );

  // Whitelist allowed emojis (no clap)
  const ALLOWED = ['🔥', '💡', '❤️', '😮'];
  if (!ALLOWED.includes(emoji))
    return NextResponse.json({ error: 'Invalid emoji' }, { status: 400 });

  // Enforce single reaction: delete any existing reaction for this user+post first
  await supabase
    .from('blog_reactions')
    .delete()
    .eq('user_id', user.id)
    .eq('post_slug', slug)
    .neq('emoji', emoji);

  // Check if already reacted with this exact emoji (toggle off)
  const { data: existing } = await supabase
    .from('blog_reactions')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_slug', slug)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
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

  // Return fresh aggregate counts via RPC
  const { data: countRows } = await supabase.rpc('get_reaction_counts', {
    p_slug: slug,
  });

  const counts: Record<string, number> = {};
  for (const row of countRows ?? []) {
    counts[row.emoji] = Number(row.reaction_count);
  }

  const { data: userRows } = await supabase
    .from('blog_reactions')
    .select('emoji')
    .eq('post_slug', slug)
    .eq('user_id', user.id);
  const userReactions = (userRows ?? []).map((r) => r.emoji);

  return NextResponse.json({ counts, userReactions, reacted: !existing });
}
