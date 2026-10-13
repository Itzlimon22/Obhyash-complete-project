import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runLiveExamLifecycleAutomation } from '@/lib/live-exam-lifecycle-service';
import { runCompleteSmartNotificationPipeline } from '@/lib/smart-notification-automation-service';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Automated Cron Endpoint for Scheduled Notifications & Live Exam Automation:
 * 1. Live Exam 30m Reminder, Start Alert & 15m Leaderboard with Nickname & FCM Push
 * 2. Chorcha-Style Behavioral Events (Streak at Risk, Milestones, Low Activity, Comebacks)
 * 3. Anti-Fatigue Frequency Capping & Delivery Log Records
 * 4. Live Exam Lifecycle (End time -> practice unlock, lingering attempt auto-close)
 */
export async function GET(_request: NextRequest) {
  // Cron execution temporarily paused to protect Vercel Serverless CPU time limits
  return NextResponse.json({
    success: true,
    paused: true,
    message: 'Notifications cron automation is temporarily disabled to prevent CPU exhaustion.',
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}

