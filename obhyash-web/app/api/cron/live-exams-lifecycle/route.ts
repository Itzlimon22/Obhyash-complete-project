import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runLiveExamLifecycleAutomation } from '@/lib/live-exam-lifecycle-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Automated Cron Endpoint for Live Exam Lifecycle:
 * 1. Checks ended exams and enables Practice mode + Answer solutions immediately.
 * 2. Auto-closes lingering ongoing attempts after end_time.
 * 3. 15 minutes after end_time, marks is_leaderboard_published = true.
 * 4. Dispatches push notifications to all participants for published leaderboards.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Optional authorization check if CRON_SECRET is configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const result = await runLiveExamLifecycleAutomation(supabaseAdmin);

    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (error: any) {
    console.error('Error in /api/cron/live-exams-lifecycle:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal cron error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
