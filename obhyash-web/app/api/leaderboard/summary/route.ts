import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * GET /api/leaderboard/summary?level=Rookie&userId=abc123
 *
 * Lightweight endpoint for the dashboard leaderboard WIDGET only.
 * Returns exactly 2 pieces of data:
 *   - topUser: the #1 ranked user in this level (1 row)
 *   - userRank: the current user's rank position (1 count query)
 *
 * WHY THIS EXISTS:
 * The full /api/leaderboard/level endpoint fetches up to 100 rows and
 * transfers the entire payload just so the dashboard widget can show
 * a 2-row preview. That's wasteful and slow.
 * This endpoint runs 2 targeted queries instead of 1 large one,
 * and the response is a tiny ~200 byte JSON payload.
 */
export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get('level');
  const userId = req.nextUrl.searchParams.get('userId');

  if (!level || !userId) {
    return NextResponse.json(
      { error: 'level and userId params required' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Query 1: Get the top user (#1 in this level) — only 1 row
  const { data: topRows, error: topError } = await supabase
    .from('public_profiles')
    .select('id, name, avatar_url, avatar_color, xp')
    .eq('level', level)
    .ilike('role', 'student')
    .order('xp', { ascending: false })
    .limit(1);

  if (topError) {
    return NextResponse.json(
      { error: 'Failed to fetch top user' },
      { status: 500 },
    );
  }

  const topUser = topRows?.[0] ?? null;

  // Query 2: Count how many users have MORE xp than this user in this level.
  // rank = count of users with higher xp + 1.
  // This avoids fetching all 100 rows just to find an index.
  let userRank = 0;
  let userXp = 0;

  const { data: userRow } = await supabase
    .from('public_profiles')
    .select('xp')
    .eq('id', userId)
    .single();

  if (userRow) {
    userXp = userRow.xp ?? 0;
    const { count } = await supabase
      .from('public_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('level', level)
      .ilike('role', 'student')
      .gt('xp', userXp);

    userRank = (count ?? 0) + 1;
  }

  const xpDiff = topUser ? Math.max(0, (topUser.xp ?? 0) - userXp) : 0;

  return NextResponse.json(
    {
      topUser: topUser
        ? {
            id: topUser.id,
            name: topUser.name || 'Unknown User',
            avatarUrl: topUser.avatar_url || null,
            avatarColor: topUser.avatar_color || null,
            xp: topUser.xp || 0,
          }
        : null,
      userRank,
      xpDiff,
    },
    {
      headers: {
        // Cache at CDN for 3 minutes — leaderboard changes aren't instant anyway.
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=360',
      },
    },
  );
}
