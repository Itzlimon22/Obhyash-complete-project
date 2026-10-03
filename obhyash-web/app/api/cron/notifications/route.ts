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
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Optional authorization check if secret is configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();
    const results: Record<string, any> = {
      liveExamLifecycle: null,
      smartNotifications: null,
    };

    // ── 0. Live Exam Lifecycle Automation (Auto-end, Practice unlock, Attempt close) ──
    try {
      const lifecycleRes = await runLiveExamLifecycleAutomation(supabaseAdmin);
      results.liveExamLifecycle = lifecycleRes;
    } catch (lifecycleErr: any) {
      console.error('Error in live exam lifecycle automation:', lifecycleErr);
      results.liveExamLifecycleError = lifecycleErr.message;
    }

    // ── 1. Master Smart Notification Pipeline (Live Exam 30m/Start/Leaderboard + Behavioral Events) ──
    try {
      const smartNotifRes = await runCompleteSmartNotificationPipeline(supabaseAdmin);
      results.smartNotifications = smartNotifRes;
    } catch (smartErr: any) {
      console.error('Error in smart notification pipeline:', smartErr);
      results.smartNotificationsError = smartErr.message;
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error: any) {
    console.error('Error in /api/cron/notifications:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal cron error' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

