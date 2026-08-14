import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const GET = async () => {
  const supabase = await createClient();

  try {
    const { data: leaderboard, error } = await supabase.rpc('get_monthly_leaderboard');
    if (error) throw error;

    return NextResponse.json({ leaderboard: leaderboard || [] });
  } catch (err: any) {
    console.error('Error fetching leaderboard:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
};
