import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { rateLimitResponse } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

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

// GET /api/blog/reactions?slug=some-slug
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug');
  if (!slug)
    return NextResponse.json({ error: 'slug required' }, { status: 400 });

  const supabase = await createClient();
  const { user, token } = await getAuthUserAndToken(req, supabase);
  const db = getDbClient(token) || supabase;

  // Aggregate counts via RPC
  const { data: countRows, error } = await db.rpc('get_reaction_counts', {
    p_slug: slug,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const counts: Record<string, number> = {};
  for (const row of countRows ?? []) {
    counts[row.emoji] = Number(row.reaction_count);
  }

  // User's own reactions
  let userReactions: string[] = [];
  if (user) {
    const { data: userRows } = await db
      .from('blog_reactions')
      .select('emoji')
      .eq('post_slug', slug)
      .eq('user_id', user.id);
    userReactions = (userRows ?? []).map((r: any) => r.emoji);
  }

  return NextResponse.json({ counts, userReactions });
}

// POST /api/blog/reactions  — body: { slug, emoji }
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { user, token } = await getAuthUserAndToken(req, supabase);
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit: 30 reaction toggles per minute per user
  const rl = rateLimitResponse(`reactions:${user.id}`, 30, 60_000);
  if (rl.limited) return rl.response;

  const { slug, emoji } = await req.json();
  if (!slug || !emoji)
    return NextResponse.json(
      { error: 'slug and emoji are required' },
      { status: 400 },
    );

  const db = getDbClient(token) || supabase;

  // Check if this reaction already exists for this user
  const { data: existing } = await db
    .from('blog_reactions')
    .select('id')
    .eq('post_slug', slug)
    .eq('user_id', user.id)
    .eq('emoji', emoji)
    .maybeSingle();

  if (existing) {
    const { error: delErr } = await db
      .from('blog_reactions')
      .delete()
      .eq('id', existing.id);
    if (delErr)
      return NextResponse.json({ error: delErr.message }, { status: 500 });
  } else {
    const { error: insErr } = await db.from('blog_reactions').insert({
      post_slug: slug,
      user_id: user.id,
      emoji,
    });
    if (insErr)
      return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  // Return fresh counts
  const { data: countRows } = await db.rpc('get_reaction_counts', {
    p_slug: slug,
  });
  const counts: Record<string, number> = {};
  for (const row of countRows ?? []) {
    counts[row.emoji] = Number(row.reaction_count);
  }

  const { data: userRows } = await db
    .from('blog_reactions')
    .select('emoji')
    .eq('post_slug', slug)
    .eq('user_id', user.id);
  const userReactions = (userRows ?? []).map((r: any) => r.emoji);

  return NextResponse.json({ counts, userReactions });
}
