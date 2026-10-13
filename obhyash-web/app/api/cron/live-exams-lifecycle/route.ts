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
export async function GET(_request: NextRequest) {
  // Cron execution temporarily paused to protect Vercel Serverless CPU time limits
  return NextResponse.json({
    success: true,
    paused: true,
    message: 'Live exam lifecycle cron is temporarily disabled to prevent CPU exhaustion.',
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
