import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

const PAGE_SIZE = 20;

interface LevelThreshold {
  min: number;
  max: number;
}

const LEVEL_THRESHOLDS: Record<string, LevelThreshold> = {
  explorer: { min: 0, max: 999 },
  rookie: { min: 0, max: 999 },
  challenger: { min: 1000, max: 2999 },
  scout: { min: 1000, max: 2999 },
  warrior: { min: 3000, max: 6999 },
  scholar: { min: 7000, max: 14999 },
  titan: { min: 7000, max: 14999 },
  legend: { min: 15000, max: 999999999 },
};

function calculateLevelFromXp(xp: number): string {
  if (xp >= 15000) return 'Legend';
  if (xp >= 7000) return 'Scholar';
  if (xp >= 3000) return 'Warrior';
  if (xp >= 1000) return 'Challenger';
  return 'Explorer';
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const level = searchParams.get('level');
  const timeframe = searchParams.get('timeframe') || 'monthly';
  const offset = Math.max(0, parseInt(searchParams.get('offset') ?? '0', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? String(PAGE_SIZE), 10)));

  if (!level) {
    return NextResponse.json({ error: 'level param required' }, { status: 400 });
  }

  const supabase = await createClient();
  const levelKey = level.toLowerCase();
  const threshold = LEVEL_THRESHOLDS[levelKey] || LEVEL_THRESHOLDS.explorer;
  const isMonthly = timeframe === 'monthly';
  const batch = searchParams.get('batch');

  // Query users belonging to this level tier based on lifetime XP
  let query = supabase
    .from('users')
    .select('id, name, institute, xp, monthly_xp, level, exams_taken, avatar_url, avatar_color, streak, batch')
    .gte('xp', threshold.min);

  if (threshold.max < 999999999) {
    query = query.lte('xp', threshold.max);
  }

  if (batch && batch.trim().length > 0 && batch !== 'all') {
    query = query.ilike('batch', `%${batch.trim()}%`);
  }

  if (isMonthly) {
    query = query
      .order('monthly_xp', { ascending: false, nullsFirst: false })
      .order('xp', { ascending: false, nullsFirst: false });
  } else {
    query = query
      .order('xp', { ascending: false, nullsFirst: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data: rows, error } = await query;

  if (error || !rows) {
    console.error('Leaderboard query error:', error);
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
  }

  const users = rows.map((user: any, index: number) => {
    const effectiveXp = isMonthly
      ? (user.monthly_xp ?? 0)
      : (user.xp ?? 0);

    const userLevel = user.level || calculateLevelFromXp(user.xp || 0);

    return {
      id: user.id,
      name: user.name || 'Unknown User',
      institute: user.institute || 'Unknown Institute',
      xp: effectiveXp,
      allTimeXp: user.xp || 0,
      monthlyXp: user.monthly_xp || 0,
      level: userLevel,
      allTimeLevel: userLevel,
      examsTaken: user.exams_taken || 0,
      avatarUrl: user.avatar_url || undefined,
      avatarColor: user.avatar_color || undefined,
      streak: user.streak || 0,
      batch: user.batch || undefined,
      rank: offset + index + 1,
    };
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
