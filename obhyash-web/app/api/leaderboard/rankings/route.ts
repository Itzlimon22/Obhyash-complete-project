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
    .select('institute, xp, monthly_xp, monthly_xp_reset_at, role')
    .or('role.ilike.student,role.is.null')
    .not('institute', 'is', null)
    .neq('institute', '')
    .order('monthly_xp', { ascending: false, nullsFirst: false })
    .limit(5000);

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to fetch institute rankings' },
      { status: 500 },
    );
  }

  // Consider students with active XP
  const activeStudents: { institute: string; xp: number }[] = [];
  data.forEach((row) => {
    const rawInst = row.institute;
    if (!rawInst || !rawInst.trim()) return;

    const userXp = timeframe === 'all_time' ? (row.xp || 0) : (row.monthly_xp || 0);
    if (userXp > 0) {
      activeStudents.push({
        institute: getCanonicalCollegeName(rawInst),
        xp: userXp,
      });
    }
  });

  activeStudents.sort((a, b) => b.xp - a.xp);

  const institutePoints: Record<string, number> = {};
  const instituteCounts: Record<string, number> = {};
  const instituteBestRank: Record<string, number> = {};

  activeStudents.forEach((student, idx) => {
    const inst = student.institute;
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
