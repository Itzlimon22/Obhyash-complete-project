import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const GET = async () => {
  const supabase = await createClient();

  try {
    const { data: leaderboard, error } = await supabase.rpc('get_monthly_leaderboard');
    if (error) throw error;

    return NextResponse.json(
      { leaderboard: leaderboard || [] },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
      },
    );
  } catch (err: any) {
    console.error('Error fetching leaderboard:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};
