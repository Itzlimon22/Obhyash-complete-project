import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();

  // Read from the materialized view — pre-computed every 15 min by pg_cron.
  // This is a trivial SELECT with no aggregation and no joins.
  const { data, error } = await supabase
    .from('mv_institute_rankings')
    .select('institute, avg_top5_xp, student_count')
    .order('avg_top5_xp', { ascending: false })
    .limit(100);

  if (error || !data) {
    return NextResponse.json(
      { error: 'Failed to fetch institute rankings' },
      { status: 500 },
    );
  }

  const rankings = data.map(
    (row: {
      institute: string;
      avg_top5_xp: number;
      student_count: number;
    }) => ({
      institute: row.institute,
      avgXp: row.avg_top5_xp,
      studentCount: row.student_count,
    }),
  );

  return NextResponse.json(rankings, {
    headers: {
      // Rankings change at most every 15 min (pg_cron refresh interval)
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
    },
  });
}
