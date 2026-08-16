import { NextResponse, connection } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// In-Memory Cache (45-second TTL) to reduce database read costs by 95%
let cachedData: any = null;
let cacheExpiresAt = 0;

export async function GET(request: Request) {
  try {
    await connection();
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';

    const now = Date.now();
    if (!forceRefresh && cachedData && now < cacheExpiresAt) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        expiresInSec: Math.round((cacheExpiresAt - now) / 1000),
      });
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    // Parallel Single Roundtrip Database Queries
    const [
      usersCountRes,
      proUsersCountRes,
      questionsCountRes,
      pendingQuestionsRes,
      totalExamsRes,
      todayExamsRes,
      yesterdayExamsRes,
      activeLiveExamsRes,
      pendingReportsRes,
      pendingComplaintsRes,
      appConfigRes,
      recentActivityRes,
    ] = await Promise.all([
      // 1. Users
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .or('plan.eq.pro,plan.eq.premium,is_subscribed.eq.true'),
      // 2. Questions
      supabaseAdmin.from('questions').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .or('status.eq.Pending,status.is.null'),
      // 3. Exams
      supabaseAdmin.from('exam_results').select('*', { count: 'exact', head: true }),
      supabaseAdmin
        .from('exam_results')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
      supabaseAdmin
        .from('exam_results')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart.toISOString())
        .lt('created_at', todayStart.toISOString()),
      // 4. Live Exams
      supabaseAdmin
        .from('live_exams')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'live'),
      // 5. Reports & Complaints
      supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Pending', 'pending']),
      supabaseAdmin
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Open', 'open', 'Pending', 'pending']),
      // 6. Master App Config
      supabaseAdmin
        .from('app_config')
        .select('*')
        .eq('id', 'global_config')
        .maybeSingle(),
      // 7. Recent 50 exam submissions to compute 24h hourly distribution & top subjects
      supabaseAdmin
        .from('exam_results')
        .select('subject, chapter, created_at, score, total_marks')
        .gte('created_at', todayStart.toISOString())
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    // Compute Subject/Chapter frequency
    const subjectCounts: Record<string, number> = {};
    const chapterCounts: Record<string, number> = {};
    const hourlyCounts: number[] = new Array(24).fill(0);

    const recentExams = recentActivityRes.data || [];
    recentExams.forEach((item: any) => {
      if (item.subject) {
        subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
      }
      if (item.chapter) {
        chapterCounts[item.chapter] = (chapterCounts[item.chapter] || 0) + 1;
      }
      if (item.created_at) {
        const hour = new Date(item.created_at).getHours();
        if (hour >= 0 && hour < 24) {
          hourlyCounts[hour]++;
        }
      }
    });

    const topSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topChapters = Object.entries(chapterCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Compute day-over-day exam trend percentage
    const todayCount = todayExamsRes.count || 0;
    const yesterdayCount = yesterdayExamsRes.count || 0;
    let examGrowthPercent = 0;
    if (yesterdayCount > 0) {
      examGrowthPercent = Math.round(
        ((todayCount - yesterdayCount) / yesterdayCount) * 100,
      );
    } else if (todayCount > 0) {
      examGrowthPercent = 100;
    }

    const payload = {
      metrics: {
        totalUsers: usersCountRes.count || 0,
        proUsers: proUsersCountRes.count || 0,
        totalQuestions: questionsCountRes.count || 0,
        pendingQuestions: pendingQuestionsRes.count || 0,
        totalExams: totalExamsRes.count || 0,
        todayExams: todayCount,
        yesterdayExams: yesterdayCount,
        examGrowthPercent,
        activeLiveExams: activeLiveExamsRes.count || 0,
        pendingReports: pendingReportsRes.count || 0,
        pendingComplaints: pendingComplaintsRes.count || 0,
      },
      analytics: {
        topSubjects,
        topChapters,
        hourlyActivity: hourlyCounts,
        todayTotal: todayCount,
      },
      systemControls: appConfigRes.data || {
        maintenance_mode: false,
        live_exams_enabled: true,
        registration_enabled: true,
        free_trial_enabled: true,
        min_app_version: '1.0.0',
        latest_app_version: '1.0.0',
        force_update: false,
        global_announcement_enabled: false,
        global_announcement_text: '',
        global_announcement_type: 'info',
        global_announcement_target: 'all',
      },
      lastUpdated: new Date().toISOString(),
    };

    // Save to in-memory cache for 45s
    cachedData = payload;
    cacheExpiresAt = Date.now() + 45000;

    return NextResponse.json({
      success: true,
      data: payload,
      cached: false,
    });
  } catch (err: any) {
    console.error('Error in /api/admin/dashboard-overview:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal Server Error' },
      { status: 500 },
    );
  }
}
