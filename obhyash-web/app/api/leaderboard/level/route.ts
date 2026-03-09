import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

interface LeaderboardUserRow {
  id: string;
  name: string | null;
  institute: string | null;
  xp: number | null;
  level: string | null;
  exams_taken: number | null;
  avatar_url: string | null;
  avatar_color: string | null;
  streak: number | null;
}

export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get('level');
  if (!level) {
    return NextResponse.json(
      { error: 'level param required' },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Try the indexed RPC first (uses leaderboard_by_level function + idx_profiles_level_xp)
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'leaderboard_by_level',
    { p_level: level },
  );

  let rows: LeaderboardUserRow[] | null = rpcData;

  // Fall back when: RPC errored, returned null, OR returned empty array.
  // The empty-array case covers a known role-case mismatch in older DB deployments
  // where the RPC filters `role = 'student'` but rows have `role = 'Student'`.
  if (rpcError || !rows || rows.length === 0) {
    // Fallback: direct query (still uses the composite index)
    const { data, error } = await supabase
      .from('public_profiles')
      .select(
        'id, name, institute, xp, level, exams_taken, avatar_url, avatar_color, streak',
      )
      .eq('level', level)
      .ilike('role', 'student')
      .order('xp', { ascending: false })
      .limit(100);

    if (error || !data) {
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 },
      );
    }
    rows = data;
  }

  const users = rows.map((user, index) => ({
    id: user.id,
    name: user.name || 'Unknown User',
    institute: user.institute || 'Unknown Institute',
    xp: user.xp || 0,
    level: user.level || level,
    examsTaken: user.exams_taken || 0,
    avatarUrl: user.avatar_url || undefined,
    avatarColor: user.avatar_color || null,
    streakCount: user.streak || 0,
    _index: index, // used client-side for fallback avatar color
  }));

  return NextResponse.json(users, {
    headers: {
      // Cache at CDN edge for 5 minutes, stale-while-revalidate for 10 more
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
