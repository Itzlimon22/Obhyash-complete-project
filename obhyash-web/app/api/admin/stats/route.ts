import { NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let cachedStats: any = null;
let statsExpiresAt = 0;

export async function GET() {
  try {
    await connection();

    const now = Date.now();
    if (cachedStats && now < statsExpiresAt) {
      return NextResponse.json(
        {
          success: true,
          data: cachedStats,
          cached: true,
        },
        {
          headers: {
            'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
          },
        },
      );
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      usersRes,
      questionsRes,
      examsRes,
      todayExamsRes,
      liveExamsRes,
      reportsRes,
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('questions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('exam_results').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('exam_results')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      supabaseAdmin
        .from('live_exams')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'live'),
      supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Pending', 'pending']),
    ]);

    const statsData = {
      totalUsers: usersRes.count || 0,
      totalQuestions: questionsRes.count || 0,
      totalExams: examsRes.count || 0,
      todayExams: todayExamsRes.count || 0,
      activeLiveExams: liveExamsRes.count || 0,
      pendingReports: reportsRes.count || 0,
    };

    cachedStats = statsData;
    statsExpiresAt = Date.now() + 60_000;

    return NextResponse.json(
      {
        success: true,
        data: statsData,
        cached: false,
      },
      {
        headers: {
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
        },
      },
    );
  } catch (err: any) {
    console.error('Error in /api/admin/stats:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
