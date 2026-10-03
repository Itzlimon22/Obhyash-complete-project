import { SupabaseClient } from '@supabase/supabase-js';
import { sendFCMNotificationToUsers } from '@/lib/fcm-server';

export interface LiveExamLifecycleResult {
  success: boolean;
  timestamp: string;
  examsEndedPracticeEnabled: number;
  leaderboardsPublished: number;
  notificationsSent: number;
  pushNotificationsSent: number;
  staleAttemptsFinalized: number;
  details?: any[];
  error?: string;
}

/**
 * Automates the live exam lifecycle & mobile push notifications:
 * 1. Upcoming Exams (Starts in 15-30 minutes):
 *    - Sends mobile push notification & in-app alert.
 * 2. Live Now Exams (Starts now):
 *    - Sends "Exam is Live Now" push notification & in-app alert.
 * 3. Exams Ended:
 *    - Unlocks Practice mode immediately (`is_practice_enabled = true`).
 *    - Unlocks Solution / Answer keys (`is_answer_published = true`).
 *    - Finalizes any lingering 'ongoing' attempts after 5 minutes.
 * 4. 15 Minutes After Exam Ended:
 *    - Publishes the Leaderboard (`is_leaderboard_published = true`).
 *    - Sends Leaderboard mobile push notifications & in-app notifications to all exam participants.
 *    - Marks `is_leaderboard_notified = true`.
 */
export async function runLiveExamLifecycleAutomation(
  supabaseAdmin: SupabaseClient
): Promise<LiveExamLifecycleResult> {
  const now = new Date();
  const nowIso = now.toISOString();
  const in15Mins = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  const in30Mins = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

  let examsEndedPracticeEnabled = 0;
  let leaderboardsPublished = 0;
  let notificationsSent = 0;
  let pushNotificationsSent = 0;
  let staleAttemptsFinalized = 0;
  const details: any[] = [];

  try {
    // -------------------------------------------------------------
    // STAGE 1: Upcoming Live Exam Mobile Alerts (15-30 mins before)
    // -------------------------------------------------------------
    const { data: upcomingExams } = await supabaseAdmin
      .from('live_exams')
      .select('id, title, start_time, is_upcoming_notified')
      .gte('start_time', in15Mins)
      .lte('start_time', in30Mins)
      .or('is_upcoming_notified.is.false,is_upcoming_notified.is.null');

    if (upcomingExams && upcomingExams.length > 0) {
      const { data: activeUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(200);

      const activeUserIds = (activeUsers || []).map((u: any) => u.id).filter(Boolean);

      for (const exam of upcomingExams) {
        if (activeUserIds.length > 0) {
          const pushTitle = `${exam.title} শুরু হতে আর ১৫ মিনিট বাকি`;
          const pushBody = `পরীক্ষার জন্য প্রস্তুত হও। কিছুক্ষণের মধ্যে লাইভ প্রতিযোগিতা শুরু হবে।`;
          const targetRoute = `/live_exam_details/${exam.id}`;

          const notifs = activeUserIds.map((userId: string) => ({
            user_id: userId,
            title: pushTitle,
            message: pushBody,
            body: pushBody,
            link: `/live-exams/${exam.id}`,
            data: {
              route: targetRoute,
              exam_id: exam.id,
              type: 'live_exam_upcoming',
              channel_id: 'obhyash_live_exams',
            },
            type: 'live_exam',
            priority: 'high',
            is_read: false,
            created_at: nowIso,
          }));

          // In-app notifications
          for (let i = 0; i < notifs.length; i += 50) {
            const chunk = notifs.slice(i, i + 50);
            const { error: insErr } = await supabaseAdmin.from('notifications').insert(chunk);
            if (!insErr) notificationsSent += chunk.length;
          }

          // Mobile FCM Push Notification
          try {
            const pushRes = await sendFCMNotificationToUsers(supabaseAdmin, {
              userIds: activeUserIds,
              title: pushTitle,
              body: pushBody,
              channelId: 'obhyash_live_exams',
              data: {
                route: targetRoute,
                exam_id: exam.id,
                type: 'live_exam_upcoming',
              },
            });
            pushNotificationsSent += pushRes.sent;
          } catch (fcmErr) {
            console.warn('[FCM Upcoming Alert Warning]:', fcmErr);
          }
        }

        await supabaseAdmin
          .from('live_exams')
          .update({ is_upcoming_notified: true })
          .eq('id', exam.id);

        details.push({ action: 'upcoming_exam_notified', examId: exam.id, title: exam.title });
      }
    }

    // -------------------------------------------------------------
    // STAGE 2: Live Now Exam Mobile Alerts (Exam Starts Right Now)
    // -------------------------------------------------------------
    const { data: startingExams } = await supabaseAdmin
      .from('live_exams')
      .select('id, title, start_time, end_time, is_start_notified')
      .lte('start_time', nowIso)
      .gt('end_time', nowIso)
      .or('is_start_notified.is.false,is_start_notified.is.null');

    if (startingExams && startingExams.length > 0) {
      const { data: activeUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(200);

      const activeUserIds = (activeUsers || []).map((u: any) => u.id).filter(Boolean);

      for (const exam of startingExams) {
        if (activeUserIds.length > 0) {
          const pushTitle = `${exam.title} এখন লাইভ শুরু হয়েছে`;
          const pushBody = `লাইভ পরীক্ষা শুরু হয়ে গেছে। দ্রুত অংশ নিয়ে সবার সাথে মেধা তালিকায় নিজের অবস্থান নিশ্চিত করো।`;
          const targetRoute = `/live_exam_details/${exam.id}`;

          const notifs = activeUserIds.map((userId: string) => ({
            user_id: userId,
            title: pushTitle,
            message: pushBody,
            body: pushBody,
            link: `/live-exams/${exam.id}`,
            data: {
              route: targetRoute,
              exam_id: exam.id,
              type: 'live_exam_started',
              channel_id: 'obhyash_live_exams',
            },
            type: 'live_exam',
            priority: 'high',
            is_read: false,
            created_at: nowIso,
          }));

          for (let i = 0; i < notifs.length; i += 50) {
            const chunk = notifs.slice(i, i + 50);
            const { error: insErr } = await supabaseAdmin.from('notifications').insert(chunk);
            if (!insErr) notificationsSent += chunk.length;
          }

          // Mobile FCM Push Notification
          try {
            const pushRes = await sendFCMNotificationToUsers(supabaseAdmin, {
              userIds: activeUserIds,
              title: pushTitle,
              body: pushBody,
              channelId: 'obhyash_live_exams',
              data: {
                route: targetRoute,
                exam_id: exam.id,
                type: 'live_exam_started',
              },
            });
            pushNotificationsSent += pushRes.sent;
          } catch (fcmErr) {
            console.warn('[FCM Live Now Alert Warning]:', fcmErr);
          }
        }

        await supabaseAdmin
          .from('live_exams')
          .update({ is_start_notified: true })
          .eq('id', exam.id);

        details.push({ action: 'live_now_exam_notified', examId: exam.id, title: exam.title });
      }
    }

    // -------------------------------------------------------------
    // STAGE 3: Enable Practice & Answer keys for exams that just ended
    // -------------------------------------------------------------
    const { data: endedExams, error: endedExamsErr } = await supabaseAdmin
      .from('live_exams')
      .select('id, title, end_time, is_practice_enabled, is_answer_published')
      .lte('end_time', nowIso)
      .or('is_practice_enabled.is.false,is_practice_enabled.is.null,is_answer_published.is.false,is_answer_published.is.null');

    if (!endedExamsErr && endedExams && endedExams.length > 0) {
      const examIdsToUpdate = endedExams.map((e) => e.id);
      const { error: updateEndedErr } = await supabaseAdmin
        .from('live_exams')
        .update({
          is_practice_enabled: true,
          is_answer_published: true,
          updated_at: nowIso,
        })
        .in('id', examIdsToUpdate);

      if (!updateEndedErr) {
        examsEndedPracticeEnabled = examIdsToUpdate.length;
        details.push({
          action: 'practice_and_answers_enabled',
          count: examIdsToUpdate.length,
          examIds: examIdsToUpdate,
        });
      }
    }

    // -------------------------------------------------------------
    // STAGE 4: Auto-close any lingering 'ongoing' attempts
    // -------------------------------------------------------------
    const { data: pastExams } = await supabaseAdmin
      .from('live_exams')
      .select('id')
      .lte('end_time', fiveMinutesAgo);

    if (pastExams && pastExams.length > 0) {
      const pastExamIds = pastExams.map((e) => e.id);
      const { data: ongoingAttempts, error: ongoingErr } = await supabaseAdmin
        .from('live_exam_attempts')
        .select('id, live_exam_id, user_answers')
        .eq('status', 'ongoing')
        .in('live_exam_id', pastExamIds);

      if (!ongoingErr && ongoingAttempts && ongoingAttempts.length > 0) {
        const attemptIds = ongoingAttempts.map((a) => a.id);
        const { error: closeErr } = await supabaseAdmin
          .from('live_exam_attempts')
          .update({
            status: 'submitted',
            submit_time: nowIso,
          })
          .in('id', attemptIds);

        if (!closeErr) {
          staleAttemptsFinalized = attemptIds.length;
          details.push({
            action: 'stale_ongoing_attempts_closed',
            count: attemptIds.length,
          });
        }
      }
    }

    // -------------------------------------------------------------
    // STAGE 5: Auto-publish Leaderboard (15m after end_time) & Push Notification
    // -------------------------------------------------------------
    const { data: eligibleExams, error: eligibleErr } = await supabaseAdmin
      .from('live_exams')
      .select('id, title, end_time, is_leaderboard_published, is_leaderboard_notified')
      .lte('end_time', fifteenMinutesAgo)
      .or('is_leaderboard_published.is.false,is_leaderboard_published.is.null');

    if (!eligibleErr && eligibleExams && eligibleExams.length > 0) {
      for (const exam of eligibleExams) {
        // Publish leaderboard
        const { error: pubErr } = await supabaseAdmin
          .from('live_exams')
          .update({
            is_leaderboard_published: true,
            updated_at: nowIso,
          })
          .eq('id', exam.id);

        if (pubErr) {
          console.error(`Failed to publish leaderboard for exam ${exam.id}:`, pubErr);
          continue;
        }

        leaderboardsPublished++;

        // Dispatch notification to exam participants if not yet notified
        if (!exam.is_leaderboard_notified) {
          const { data: attempts } = await supabaseAdmin
            .from('live_exam_attempts')
            .select('user_id')
            .eq('live_exam_id', exam.id);

          const participantUserIds = Array.from(
            new Set((attempts || []).map((a: any) => a.user_id).filter(Boolean))
          );

          if (participantUserIds.length > 0) {
            const pushTitle = `${exam.title}-এর মেধা তালিকা প্রকাশিত হয়েছে`;
            const pushBody = `লাইভ পরীক্ষার ফলাফল ও মেধা তালিকা এখন উন্মুক্ত। তোমার চূড়ান্ত র‍্যাংক ও স্কোর দেখে নাও।`;
            const targetRoute = `/live_exam_details/${exam.id}`;

            const notifs = participantUserIds.map((userId) => ({
              user_id: userId,
              title: pushTitle,
              message: pushBody,
              body: pushBody,
              link: `/live-exams/${exam.id}`,
              data: {
                route: targetRoute,
                exam_id: exam.id,
                type: 'leaderboard_published',
                channel_id: 'obhyash_live_exams',
              },
              type: 'live_exam',
              priority: 'high',
              is_read: false,
              created_at: nowIso,
            }));

            // In-app notifications
            for (let i = 0; i < notifs.length; i += 50) {
              const chunk = notifs.slice(i, i + 50);
              const { error: notifErr } = await supabaseAdmin
                .from('notifications')
                .insert(chunk);

              if (!notifErr) {
                notificationsSent += chunk.length;
              }
            }

            // Mobile FCM Push Notification
            try {
              const pushRes = await sendFCMNotificationToUsers(supabaseAdmin, {
                userIds: participantUserIds,
                title: pushTitle,
                body: pushBody,
                channelId: 'obhyash_live_exams',
                data: {
                  route: targetRoute,
                  exam_id: exam.id,
                  type: 'leaderboard_published',
                },
              });
              pushNotificationsSent += pushRes.sent;
            } catch (fcmErr) {
              console.warn('[FCM Leaderboard Alert Warning]:', fcmErr);
            }
          }

          // Mark exam as notified
          await supabaseAdmin
            .from('live_exams')
            .update({
              is_leaderboard_notified: true,
            })
            .eq('id', exam.id);

          details.push({
            action: 'leaderboard_published_and_notified',
            examId: exam.id,
            title: exam.title,
            participantsCount: participantUserIds.length,
          });
        }
      }
    }

    return {
      success: true,
      timestamp: nowIso,
      examsEndedPracticeEnabled,
      leaderboardsPublished,
      notificationsSent,
      pushNotificationsSent,
      staleAttemptsFinalized,
      details,
    };
  } catch (err: any) {
    console.error('Error in runLiveExamLifecycleAutomation:', err);
    return {
      success: false,
      timestamp: nowIso,
      examsEndedPracticeEnabled,
      leaderboardsPublished,
      notificationsSent,
      pushNotificationsSent,
      staleAttemptsFinalized,
      error: err.message || 'Unknown lifecycle error',
      details,
    };
  }
}
