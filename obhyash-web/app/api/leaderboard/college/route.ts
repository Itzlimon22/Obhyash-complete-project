import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getCanonicalCollegeName } from '@/lib/college-mapping';
import { ensureMonthlyLeaderboardReset, calculateEffectiveXp } from '@/lib/leaderboard-utils';

const PAGE_SIZE = 20;

interface LeaderboardUserRow {
  id: string;
  name: string | null;
  institute: string | null;
  xp: number | null;
  monthly_xp?: number | null;
  monthly_xp_reset_at?: string | null;
  level: string | null;
  exams_taken: number | null;
  avatar_url: string | null;
  avatar_color: string | null;
  streak: number | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const rawInstitute = searchParams.get('institute');
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE), 10)));
  
  if (!rawInstitute) {
    return NextResponse.json({ error: 'institute param required' }, { status: 400 });
  }

  const institute = getCanonicalCollegeName(rawInstitute);

  const supabase = await createClient();
  await ensureMonthlyLeaderboardReset(supabase);

  // Try indexed RPC first with offset/limit
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'leaderboard_by_institute',
    { p_institute: institute, p_offset: offset, p_limit: limit },
  );

  let rows: LeaderboardUserRow[] | null = rpcData;

  if (rpcError || !rows || rows.length === 0) {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, institute, xp, monthly_xp, monthly_xp_reset_at, level, exams_taken, avatar_url, avatar_color, streak, role')
      .or('role.ilike.student,role.is.null')
      .ilike('institute', institute.trim())
      .order('monthly_xp', { ascending: false, nullsFirst: false })
      .order('xp', { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1);

    if (error || !data) {
      if (!rows) return NextResponse.json({ error: 'Failed to fetch college leaderboard' }, { status: 500 });
    } else {
      rows = data;
    }
  }

  const studentRows = (rows || []).filter((u: any) => {
    const r = (u.role || 'student').toLowerCase();
    return r === 'student';
  });

  const users = studentRows.map((user: any) => {
    // If from RPC, 'xp' is already current-month XP from the CASE statement.
    // If from users table, calculate via calculateEffectiveXp.
    let mXp = user.monthly_xp !== undefined
      ? calculateEffectiveXp(user, 'monthly')
      : (user.xp ?? 0);

    return {
      id: user.id,
      name: user.name || 'শিক্ষার্থী',
      institute: user.institute || institute,
      xp: mXp,
      allTimeXp: user.xp || 0,
      level: user.level || 'Rookie',
      examsTaken: user.exams_taken || 0,
      avatarUrl: user.avatar_url || undefined,
      avatarColor: user.avatar_color || null,
      streakCount: user.streak || 0,
      rank: 0,
    };
  });

  // Re-sort by monthly XP descending, then lifetime XP
  users.sort((a, b) => {
    if (b.xp !== a.xp) return b.xp - a.xp;
    if (b.allTimeXp !== a.allTimeXp) return b.allTimeXp - a.allTimeXp;
    return b.examsTaken - a.examsTaken;
  });

  // Assign ranks
  let activeRank = offset + 1;
  users.forEach((u) => {
    if (u.xp === 0) {
      u.rank = 0;
    } else {
      u.rank = activeRank++;
    }
  });

  return NextResponse.json(
    { users, hasMore: rows.length === limit, nextOffset: offset + rows.length },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    },
  );
}
