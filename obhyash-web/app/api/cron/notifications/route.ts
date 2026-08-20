import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NOTIFICATION_TEMPLATES } from '@/lib/notification-templates';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Automated Cron Endpoint for Scheduled Notifications:
 * 1. Inactive Users (2+ days without taking an exam) -> Sends comeback notification
 * 2. Upcoming Live Exams (Starts within 15-30 minutes) -> Sends alert notification
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
    const results = {
      inactiveUsersNotified: 0,
      liveExamsNotified: 0,
    };

    // ── 1. Inactivity Recovery Notification (2+ days inactive) ───────────────
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // Find users inactive between 2 and 3 days ago who haven't received a comeback notif today
    const { data: inactiveUsers } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .lt('updated_at', twoDaysAgo)
      .gt('updated_at', threeDaysAgo)
      .limit(50);

    if (inactiveUsers && inactiveUsers.length > 0) {
      const inactivityTemplates = NOTIFICATION_TEMPLATES.filter((t) => t.category === 'inactivity');
      const fallbackTemplate = inactivityTemplates[0] || {
        title: '২ দিন ধরে তোমার দেখা নেই... বইগুলো তো কাঁদছে 😢',
        message: 'সবকিছু কি ঠিক আছে? আজ অন্তত একটি ছোট সেট প্র্যাকটিস করে কামব্যাক করো!',
        route: '/exam-setup',
        type: 'warning',
        priority: 'normal',
      };

      const notifsToInsert = inactiveUsers.map((user) => {
        const studentName = user.name || 'শিক্ষার্থী';
        return {
          user_id: user.id,
          title: fallbackTemplate.title.replace('{name}', studentName),
          message: fallbackTemplate.message.replace('{name}', studentName),
          body: fallbackTemplate.message.replace('{name}', studentName),
          link: fallbackTemplate.route,
          data: { route: fallbackTemplate.route },
          type: fallbackTemplate.type,
          priority: fallbackTemplate.priority,
          is_read: false,
          created_at: now.toISOString(),
        };
      });

      const { error: insertErr } = await supabaseAdmin.from('notifications').insert(notifsToInsert);
      if (!insertErr) {
        results.inactiveUsersNotified = notifsToInsert.length;
      }
    }

    // ── 2. Upcoming Live Exam Alerts (Starting in next 15-30 mins) ───────────
    const in15Mins = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
    const in30Mins = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    const { data: upcomingExams } = await supabaseAdmin
      .from('live_exams')
      .select('id, title, start_time')
      .gte('start_time', in15Mins)
      .lte('start_time', in30Mins);

    if (upcomingExams && upcomingExams.length > 0) {
      const { data: activeUsers } = await supabaseAdmin.from('users').select('id').limit(200);

      if (activeUsers && activeUsers.length > 0) {
        for (const exam of upcomingExams) {
          const notifs = activeUsers.map((u) => ({
            user_id: u.id,
            title: '🎯 লাইভ পরীক্ষা শুরু হতে আর মাত্র ১৫ মিনিট!',
            message: `${exam.title} এর জন্য খাতা-কলম নিয়ে রেডি হও। সবার সাথে লাইভ লড়াই শুরু হচ্ছে ⏱️`,
            body: `${exam.title} এর জন্য খাতা-কলম নিয়ে রেডি হও। সবার সাথে লাইভ লড়াই শুরু হচ্ছে ⏱️`,
            link: `/live-exams/${exam.id}`,
            data: { route: `/live-exams/${exam.id}` },
            type: 'live_exam',
            priority: 'high',
            is_read: false,
            created_at: now.toISOString(),
          }));

          const { error: examNotifErr } = await supabaseAdmin.from('notifications').insert(notifs);
          if (!examNotifErr) {
            results.liveExamsNotified += notifs.length;
          }
        }
      }
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
