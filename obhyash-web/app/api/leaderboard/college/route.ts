import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const PAGE_SIZE = 20;

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
  const { searchParams } = req.nextUrl;
  const institute = searchParams.get('institute');
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE), 10)));

  if (!institute) {
    return NextResponse.json({ error: 'institute param required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Try indexed RPC first with offset/limit
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'leaderboard_by_institute',
    { p_institute: institute, p_offset: offset, p_limit: limit },
  );

  let rows: LeaderboardUserRow[] | null = rpcData;

  if (rpcError || !rows) {
    const { data, error } = await supabase
      .from('public_profiles')
      .select('id, name, institute, xp, level, exams_taken, avatar_url, avatar_color, streak')
      .eq('institute', institute)
      .order('xp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to fetch college leaderboard' }, { status: 500 });
    }
    rows = data;
  }

  const users = rows.map((user, index) => ({
    id: user.id,
    name: user.name || 'Unknown User',
    institute: user.institute || institute,
    xp: user.xp || 0,
    level: user.level || 'Rookie',
    examsTaken: user.exams_taken || 0,
    avatarUrl: user.avatar_url || undefined,
    avatarColor: user.avatar_color || null,
    streakCount: user.streak || 0,
    _index: offset + index,
  }));

  return NextResponse.json(
    { users, hasMore: rows.length === limit, nextOffset: offset + rows.length },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    },
  );
}
