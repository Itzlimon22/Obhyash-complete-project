import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getCanonicalCollegeName } from '@/lib/college-mapping';

function calculateRankPoints(rank: number): number {
  if (rank === 1) return 500;
  if (rank === 2) return 400;
  if (rank === 3) return 350;
  if (rank <= 5) return 300;
  if (rank <= 10) return 250;
  if (rank <= 25) return 180;
  if (rank <= 50) return 120;
  if (rank <= 100) return 80;
  if (rank <= 250) return 40;
  if (rank <= 500) return 20;
  return 10;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const timeframe = searchParams.get('timeframe') || 'monthly';
  const xpCol = timeframe === 'all_time' ? 'xp' : 'monthly_xp';

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('users')
    .select('institute, xp, monthly_xp')
    .not('institute', 'is', null)
    .neq('institute', '')
    .order(xpCol, { ascending: false, nullsFirst: false })
    .limit(5000);

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to fetch institute rankings' },
      { status: 500 },
    );
  }

  const institutePoints: Record<string, number> = {};
  const instituteCounts: Record<string, number> = {};
  const instituteBestRank: Record<string, number> = {};

  data.forEach((row, idx) => {
    const rawInst = row.institute;
    if (!rawInst || !rawInst.trim()) return;
    const inst = getCanonicalCollegeName(rawInst);
    const nationalRank = idx + 1;
    const pts = calculateRankPoints(nationalRank);

    institutePoints[inst] = (institutePoints[inst] || 0) + pts;
    instituteCounts[inst] = (instituteCounts[inst] || 0) + 1;
    if (!instituteBestRank[inst] || nationalRank < instituteBestRank[inst]) {
      instituteBestRank[inst] = nationalRank;
    }
  });

  const rankings = Object.keys(institutePoints).map((inst) => ({
    institute: inst,
    points: institutePoints[inst],
    studentCount: instituteCounts[inst],
    bestRank: instituteBestRank[inst] || 999999,
  }));

  rankings.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return a.bestRank - b.bestRank;
  });

  return NextResponse.json(rankings, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  });
}
