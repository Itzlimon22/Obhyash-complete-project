import { NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    await connection();
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

    return NextResponse.json({
      success: true,
      data: {
        totalUsers: usersRes.count || 0,
        totalQuestions: questionsRes.count || 0,
        totalExams: examsRes.count || 0,
        todayExams: todayExamsRes.count || 0,
        activeLiveExams: liveExamsRes.count || 0,
        pendingReports: reportsRes.count || 0,
      },
    });
  } catch (err: any) {
    console.error('Error in /api/admin/stats:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
