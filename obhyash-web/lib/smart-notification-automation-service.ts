import { SupabaseClient } from '@supabase/supabase-js';
import { sendFCMNotificationToUsers } from '@/lib/fcm-server';

export interface SmartNotificationResult {
  success: boolean;
  timestamp: string;
  liveExam30mDispatched: number;
  liveExamStartDispatched: number;
  leaderboardDispatched: number;
  behavioralDispatched: number;
  fatigueBlocked: number;
  logsRecorded: number;
  error?: string;
  details?: any[];
}

/**
 * Strips formal prefixes/titles and returns the user's natural calling nickname / first name.
 * e.g. "Md. Limon Howlader" -> "Limon", "Mohammad Tanvir" -> "Tanvir", "Sadia Akter" -> "Sadia"
 */
export function extractCallingNickname(fullName?: string | null): string {
  if (!fullName || typeof fullName !== 'string') return '';

  const clean = fullName.trim();
  if (!clean) return '';

  const ignorePrefixes = new Set([
    'md.', 'md', 'md:', 'mohammad', 'mohammed', 'muhammad', 'mohd', 'mohd.',
    'most.', 'most', 'mst.', 'mst', 'mosa.', 'mosa',
    'dr.', 'dr', 'engr.', 'engr', 'prof.', 'prof',
    'kazi', 'syed', 'syeda', 'sheikh', 'sk.', 'sk', 'al',
    'মো:', 'মোঃ', 'মুহাম্মদ', 'মোহাম্মদ', 'মোসা:', 'মোসাম্মৎ', 'ডা:', 'ইঞ্জি:',
  ]);

  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';

  let callingPart = '';
  for (const p of parts) {
    const normalized = p.toLowerCase().replace(/[,.:_-]/g, '');
    const rawLower = p.toLowerCase();
    if (!ignorePrefixes.has(rawLower) && !ignorePrefixes.has(normalized) && normalized.length > 1) {
      callingPart = p;
      break;
    }
  }

  if (!callingPart && parts.length > 0) {
    callingPart = parts[0];
  }

  return callingPart.replace(/[,.:_-]+$/, '').trim();
}

/**
 * Prepends user nickname if it exists: e.g. "লিমন, পরীক্ষা শুরু হতে ৩০ মিনিট বাকি"
 */
export function formatHeadingWithNickname(nickname: string, textPattern: string): string {
  if (nickname && nickname.trim().length > 0) {
    return `${nickname}, ${textPattern}`;
  }
  return textPattern;
}

/**
 * Anti-Fatigue / Spam Guard:
 * Ensures a student is never annoyed or spammed with too many notifications.
 * - Global cap: Max 2 engagement notifications per 24 hours.
 * - Minimum gap: At least 3.5 hours between any 2 notifications.
 * - Deduplication: Never send the exact same notification type + reference_id twice.
 */
async function canSendNotificationToUser(
  supabaseAdmin: SupabaseClient,
  userId: string,
  notificationType: string,
  referenceId?: string,
  minHoursGap: number = 3.5,
  maxPer24h: number = 2
): Promise<boolean> {
  const now = new Date();
  const gapThreshold = new Date(now.getTime() - minHoursGap * 60 * 60 * 1000).toISOString();
  const dayThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  try {
    // 1. Check exact reference deduplication
    if (referenceId) {
      const { data: existingRef } = await supabaseAdmin
        .from('notification_delivery_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('notification_type', notificationType)
        .eq('reference_id', referenceId)
        .limit(1);

      if (existingRef && existingRef.length > 0) {
        return false;
      }
    }

    // 2. Check minimum hours gap
    const { data: recentLogs } = await supabaseAdmin
      .from('notification_delivery_logs')
      .select('id')
      .eq('user_id', userId)
      .gte('created_at', gapThreshold)
      .limit(1);

    if (recentLogs && recentLogs.length > 0) {
      return false;
    }

    // 3. Check 24-hour frequency cap
    const { count: count24h } = await supabaseAdmin
      .from('notification_delivery_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', dayThreshold);

    if (typeof count24h === 'number' && count24h >= maxPer24h) {
      return false;
    }

    return true;
  } catch (err) {
    return true;
  }
}

/**
 * Intelligent variety selector:
 * Inspects past delivery logs for this user & notification type,
 * excludes recently sent templates, and picks a fresh one so the user never gets bored!
 */
async function pickUnrepeatedTemplate(
  supabaseAdmin: SupabaseClient,
  userId: string,
  notificationType: string,
  templates: { heading: string; body: string }[]
): Promise<{ heading: string; body: string }> {
  try {
    const { data: pastLogs } = await supabaseAdmin
      .from('notification_delivery_logs')
      .select('title, body')
      .eq('user_id', userId)
      .eq('notification_type', notificationType)
      .order('created_at', { ascending: false })
      .limit(4);

    if (!pastLogs || pastLogs.length === 0) {
      return templates[Math.floor(Math.random() * templates.length)];
    }

    const pastBodies = new Set(pastLogs.map((l: any) => l.body));
    const pastTitles = (pastLogs || []).map((l: any) => l.title || '');

    // Filter out templates recently sent to this specific user
    const freshTemplates = templates.filter(
      (t) => !pastBodies.has(t.body) && !pastTitles.some((pt) => pt.includes(t.heading))
    );

    const pool = freshTemplates.length > 0 ? freshTemplates : templates;
    return pool[Math.floor(Math.random() * pool.length)];
  } catch {
    return templates[Math.floor(Math.random() * templates.length)];
  }
}

/**
 * Records dispatched notification in delivery log table for auditing and tracking
 */
async function recordNotificationLog(
  supabaseAdmin: SupabaseClient,
  log: {
    userId: string;
    notificationType: string;
    referenceId?: string;
    title: string;
    body: string;
    route?: string;
    channelId?: string;
    fcmSent?: boolean;
  }
): Promise<void> {
  try {
    await supabaseAdmin.from('notification_delivery_logs').insert({
      user_id: log.userId,
      notification_type: log.notificationType,
      reference_id: log.referenceId || null,
      title: log.title,
      body: log.body,
      route: log.route || '/dashboard',
      channel_id: log.channelId || 'obhyash_general',
      fcm_sent: log.fcmSent ?? true,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[recordNotificationLog] delivery log insert skipped:', err);
  }
}

/**
 * Dispatches both in-app notification and Firebase Cloud Messaging (FCM) mobile push,
 * and records the delivery in public.notification_delivery_logs.
 */
async function dispatchPersonalizedMessage(
  supabaseAdmin: SupabaseClient,
  options: {
    userId: string;
    title: string;
    body: string;
    route: string;
    channelId: string;
    notificationType: string;
    referenceId?: string;
    examId?: string;
  }
): Promise<boolean> {
  const { userId, title, body, route, channelId, notificationType, referenceId, examId } = options;

  // 1. Insert in-app notification
  const { error: insErr } = await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    title,
    message: body,
    body: body,
    link: route,
    data: {
      route,
      exam_id: examId || referenceId,
      type: notificationType,
      channel_id: channelId,
    },
    type: notificationType.startsWith('live_exam') ? 'live_exam' : (notificationType.startsWith('streak') ? 'streak' : 'general'),
    priority: 'high',
    is_read: false,
    created_at: new Date().toISOString(),
  });

  // 2. Dispatch FCM Push to student's mobile device
  let fcmSent = false;
  try {
    const fcmRes = await sendFCMNotificationToUsers(supabaseAdmin, {
      userIds: [userId],
      title,
      body,
      channelId,
      data: {
        route,
        exam_id: examId || referenceId || '',
        type: notificationType,
      },
    });
    fcmSent = fcmRes.sent > 0;
  } catch (fcmErr) {
    console.warn('[FCM Dispatch Warning]:', fcmErr);
  }

  // 3. Record delivery log
  await recordNotificationLog(supabaseAdmin, {
    userId,
    notificationType,
    referenceId,
    title,
    body,
    route,
    channelId,
    fcmSent,
  });

  return !insErr || fcmSent;
}

// ==============================================================================
// 1. LIVE EXAM AUTOMATION (30 Mins Before, Exam Starts, Leaderboard Published)
// ==============================================================================
export async function runAutomatedLiveExamNotifications(
  supabaseAdmin: SupabaseClient
): Promise<{
  liveExam30m: number;
  liveExamStart: number;
  leaderboard: number;
  fatigueBlocked: number;
}> {
  const now = new Date();
  const nowIso = now.toISOString();
  const in30MinsStart = new Date(now.getTime() + 15 * 60 * 1000).toISOString();
  const in30MinsEnd = new Date(now.getTime() + 35 * 60 * 1000).toISOString();
  const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000).toISOString();

  let liveExam30m = 0;
  let liveExamStart = 0;
  let leaderboard = 0;
  let fatigueBlocked = 0;

  // -------------------------------------------------------------
  // A. 30 Minutes Before Exam Starts (Rich Variety Pool)
  // -------------------------------------------------------------
  const { data: upcoming30mExams } = await supabaseAdmin
    .from('live_exams')
    .select('id, title, start_time, is_upcoming_notified')
    .gte('start_time', in30MinsStart)
    .lte('start_time', in30MinsEnd)
    .or('is_upcoming_notified.is.false,is_upcoming_notified.is.null');

  if (upcoming30mExams && upcoming30mExams.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .limit(300);

    for (const exam of upcoming30mExams) {
      const examTitle = exam.title || 'লাইভ পরীক্ষা';
      const templates30m = [
        {
          heading: '৩০ মিনিট পর লাইভ এক্সাম শুরু!',
          body: `বইখাতা গুছিয়ে নাও 👀 ${examTitle}-এর ঘড়ির কাঁটা কিন্তু দৌড়াচ্ছে!`,
        },
        {
          heading: 'আর মাত্র ৩০ মিনিট বাকি!',
          body: `${examTitle}-এর জন্য রুম রেডি তো? একটু পানি খেয়ে রিফ্রেশ হয়ে নাও ☕`,
        },
        {
          heading: 'ঘড়ির কাঁটা দেখছো? ৩০ মিনিট বাকি!',
          body: `আজকে সেরাটা দিতে হবে কিন্তু ✍️ প্রস্তুতি শেষ করো দ্রুত!`,
        },
        {
          heading: 'লাইভ এক্সাম শুরু হতে ৩০ মিনিট!',
          body: `সবাই কিন্তু প্র্যাকটিস টেবিল গুছিয়ে বসে পড়েছে 👀 তুমি রেডি তো?`,
        },
        {
          heading: `৩০ মিনিট পর শুরু হচ্ছে ${examTitle}!`,
          body: 'একটু ডিপ ব্রিথ নাও, শান্ত মাথায় টপ র‍্যাংক দখলে নিতে হবে 🏆',
        },
        {
          heading: 'কাউন্টডাউন শুরু: আর মাত্র ৩০ মিনিট!',
          body: 'নেট কানেকশন চেক করে নাও, শুরু থেকেই ফুল স্পিডে শুরু করতে হবে 🔥',
        },
        {
          heading: '৩০ মিনিট পর আসল লড়াই!',
          body: `${examTitle}-এ আজকে কে টপ করবে? তোমার নাম কিন্তু দেখতে চাই 🧐`,
        },
        {
          heading: 'দেরি করো না, ৩০ মিনিট পর এক্সাম!',
          body: 'মোবাইল সাইলেন্ট করে রেডি হও, মিস করলেই কিন্তু র‍্যাংক পিছিয়ে পড়বে 🏃',
        },
      ];

      for (const u of (users || [])) {
        const canSend = await canSendNotificationToUser(supabaseAdmin, u.id, 'live_exam_30m', exam.id, 2.0, 4);
        if (!canSend) {
          fatigueBlocked++;
          continue;
        }

        const nickname = extractCallingNickname(u.name);
        const picked = await pickUnrepeatedTemplate(supabaseAdmin, u.id, 'live_exam_30m', templates30m);
        const title = formatHeadingWithNickname(nickname, picked.heading);
        const route = `/live_exam_details/${exam.id}`;

        await dispatchPersonalizedMessage(supabaseAdmin, {
          userId: u.id,
          title,
          body: picked.body,
          route,
          channelId: 'obhyash_live_exams',
          notificationType: 'live_exam_30m',
          referenceId: exam.id,
          examId: exam.id,
        });

        liveExam30m++;
      }

      await supabaseAdmin.from('live_exams').update({ is_upcoming_notified: true }).eq('id', exam.id);
    }
  }

  // -------------------------------------------------------------
  // B. Exam Starts Right Now (Rich Variety Pool)
  // -------------------------------------------------------------
  const { data: startingExams } = await supabaseAdmin
    .from('live_exams')
    .select('id, title, start_time, end_time, is_start_notified')
    .lte('start_time', nowIso)
    .gt('end_time', nowIso)
    .or('is_start_notified.is.false,is_start_notified.is.null');

  if (startingExams && startingExams.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, name')
      .limit(300);

    for (const exam of startingExams) {
      const examTitle = exam.title || 'লাইভ পরীক্ষা';
      const templatesStart = [
        {
          heading: 'লাইভ এক্সাম শুরু হয়ে গেছে!',
          body: `দেরি না করে এখনই ঢুকে পড়ো, সবাই ${examTitle} দেওয়া শুরু করেছে 🔥`,
        },
        {
          heading: 'পরীক্ষা লাইভ! ঘড়ির কাঁটা ঘুরছে ⌛',
          body: 'এক সেকেন্ডও নষ্ট করো না, এখনই জয়েন করে উত্তর দেওয়া শুরু করো!',
        },
        {
          heading: 'এক্সাম রুম ওপেন! দ্রুত এসো 🏃',
          body: 'দেরি করলে কিন্তু সময় কমে যাবে, ঝটপট সাবমিট করে এগিয়ে যাও ✍️',
        },
        {
          heading: `শুরু হয়ে গেল ${examTitle}!`,
          body: 'সবার সাথে লাইভ মেধা তালিকায় লড়তে এখনই ঢুকে পড়ো 👀',
        },
        {
          heading: 'সময় শুরু! আজ টপ করতেই হবে 🏆',
          body: 'অন্যরা অলরেডি কয়েকটা দাগিয়ে ফেলেছে! তুমি এখনও বাইরে কেন? 😂',
        },
        {
          heading: 'লাইভ প্রতিযোগিতা এখন চলছে!',
          body: `${examTitle}-এ শান্ত মাথায় ঠান্ডা ব্রেনে সব উত্তর দিয়ে বাজিমাত করো 🔥`,
        },
        {
          heading: 'স্টার্ট হয়ে গেছে! আর ভাবার সময় নেই ⌛',
          body: 'এখনই কুইজে ঢুকে পড়ো, প্রমাণ করো প্রস্তুতিতে তুমিই সেরা 🫡',
        },
      ];

      for (const u of (users || [])) {
        const canSend = await canSendNotificationToUser(supabaseAdmin, u.id, 'live_exam_started', exam.id, 1.5, 4);
        if (!canSend) {
          fatigueBlocked++;
          continue;
        }

        const nickname = extractCallingNickname(u.name);
        const picked = await pickUnrepeatedTemplate(supabaseAdmin, u.id, 'live_exam_started', templatesStart);
        const title = formatHeadingWithNickname(nickname, picked.heading);
        const route = `/live_exam_details/${exam.id}`;

        await dispatchPersonalizedMessage(supabaseAdmin, {
          userId: u.id,
          title,
          body: picked.body,
          route,
          channelId: 'obhyash_live_exams',
          notificationType: 'live_exam_started',
          referenceId: exam.id,
          examId: exam.id,
        });

        liveExamStart++;
      }

      await supabaseAdmin.from('live_exams').update({ is_start_notified: true }).eq('id', exam.id);
    }
  }

  // -------------------------------------------------------------
  // C. Leaderboard & Results Published (Rich Variety Pool)
  // -------------------------------------------------------------
  const { data: lbExams } = await supabaseAdmin
    .from('live_exams')
    .select('id, title, end_time, is_leaderboard_published, is_leaderboard_notified')
    .lte('end_time', fifteenMinsAgo)
    .or('is_leaderboard_notified.is.false,is_leaderboard_notified.is.null');

  if (lbExams && lbExams.length > 0) {
    for (const exam of lbExams) {
      const examTitle = exam.title || 'লাইভ পরীক্ষা';
      const templatesLeaderboard = [
        {
          heading: `${examTitle}-এর মেধা তালিকা প্রকাশিত!`,
          body: 'তোমার র‍্যাংক আর স্কোর কত হলো দেখে নাও 👀',
        },
        {
          heading: 'রেজাল্ট চলে এসেছে! দেখো তো কত পেলে 🏆',
          body: `সবার মাঝে তোমার অবস্থান কোথায়? ${examTitle}-এর লিডারবোর্ড জমে গেছে!`,
        },
        {
          heading: 'লিডারবোর্ড আউট! তোমার নাম কত নম্বরে? 🧐',
          body: 'কে প্রথম হলো আর তুমি কোথায় আছো, এখনই চেক করে নাও 🔥',
        },
        {
          heading: 'কাঙ্ক্ষিত রেজাল্ট পাবলিশ হয়েছে!',
          body: 'কোন কোন প্রশ্নে ভুল হলো আর সঠিক উত্তর কী ছিল, মিলিয়ে নাও ✍️',
        },
        {
          heading: 'রেজাল্ট শিট রেডি! তুমি কি টপ টেনে আছো? 👀',
          body: 'বাকিদের চেয়ে তুমি কতটা এগিয়ে, লিডারবোর্ডে চোখ বুলিয়ে আসো!',
        },
        {
          heading: 'পরীক্ষার ফল ও সমাধান উন্মুক্ত!',
          body: 'ভুলগুলো এখনই শুধরে নাও, পরের পরীক্ষায় আরও ফাটিয়ে দিতে হবে 👏',
        },
        {
          heading: 'মেধা তালিকা চলে এসেছে!',
          body: 'স্কোরকার্ড রেডি, গিয়ে দেখে এসো তোমার পরিশ্রমের ফলাফল কেমন হলো 💥',
        },
      ];

      // Find all participants who submitted an attempt
      const { data: attempts } = await supabaseAdmin
        .from('live_exam_attempts')
        .select('user_id, users(id, name)')
        .eq('live_exam_id', exam.id);

      if (attempts && attempts.length > 0) {
        for (const att of attempts) {
          const userObj = att.users as any;
          const userId = att.user_id;
          if (!userId) continue;

          const canSend = await canSendNotificationToUser(supabaseAdmin, userId, 'leaderboard_published', exam.id, 0.5, 4);
          if (!canSend) {
            fatigueBlocked++;
            continue;
          }

          const nickname = extractCallingNickname(userObj?.name);
          const picked = await pickUnrepeatedTemplate(supabaseAdmin, userId, 'leaderboard_published', templatesLeaderboard);
          const title = formatHeadingWithNickname(nickname, picked.heading);
          const route = `/live_exam_details/${exam.id}`;

          await dispatchPersonalizedMessage(supabaseAdmin, {
            userId,
            title,
            body: picked.body,
            route,
            channelId: 'obhyash_live_exams',
            notificationType: 'leaderboard_published',
            referenceId: exam.id,
            examId: exam.id,
          });

          leaderboard++;
        }
      }

      await supabaseAdmin.from('live_exams').update({
        is_leaderboard_published: true,
        is_leaderboard_notified: true,
      }).eq('id', exam.id);
    }
  }

  return { liveExam30m, liveExamStart, leaderboard, fatigueBlocked };
}

// ==============================================================================
// 2. BEHAVIORAL ENGAGEMENT AUTOMATION (Chorcha-Style Rich Variety Pools)
// ==============================================================================
export async function runAutomatedBehavioralNotifications(
  supabaseAdmin: SupabaseClient
): Promise<{ dispatched: number; fatigueBlocked: number }> {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const dhakaHour = (utcHours + 6) % 24; // Asia/Dhaka time
  const todayDhakaStr = now.toISOString().split('T')[0];

  let dispatched = 0;
  let fatigueBlocked = 0;

  // Fetch active users with streak and metadata
  const { data: users, error: usersErr } = await supabaseAdmin
    .from('users')
    .select('id, name, streak, last_streak_date, updated_at')
    .limit(100);

  if (usersErr || !users || users.length === 0) {
    return { dispatched: 0, fatigueBlocked: 0 };
  }

  for (const user of users) {
    const userId = user.id;
    const nickname = extractCallingNickname(user.name);
    const streak = user.streak || 0;
    const lastStreakDate = user.last_streak_date ? String(user.last_streak_date).split('T')[0] : '';
    const hasPracticedToday = lastStreakDate === todayDhakaStr;

    // ─────────────────────────────────────────────────────────────
    // EVENT 1: Streak At Risk (রাত ৮:৩০ - ১১:৪৫ PM) - 10 Variations
    // ─────────────────────────────────────────────────────────────
    if (dhakaHour >= 20 && dhakaHour <= 23 && streak >= 1 && !hasPracticedToday) {
      const canSend = await canSendNotificationToUser(supabaseAdmin, userId, 'streak_at_risk', todayDhakaStr, 4.0, 2);
      if (!canSend) {
        fatigueBlocked++;
        continue;
      }

      const streakHooks = [
        {
          heading: `টানা ${streak} দিনের স্ট্রিকটা হারাবি? 😭`,
          body: 'রিলস কালও থাকবে, কিন্তু আজকের স্ট্রিক আর ফিরবে না! ১টা কুইজ দিয়ে নাও।',
        },
        {
          heading: 'আজ কি পড়ার ছুটি নাকি? 👀',
          body: 'রাত ১২টা বাজার আগেই ৩ মিনিটের একটা টেস্ট দিয়ে স্ট্রিকটা বাঁচাও।',
        },
        {
          heading: 'ঘুমাবি নাকি রে? 😂',
          body: 'মাত্র ১টা ছোট টেস্ট দিয়ে শান্তিতে ঘুমাতে যা, নয়তো কাল সকালে স্ট্রিক ০!',
        },
        {
          heading: 'আমি কি বেশি বিরক্ত করছি? 🥺',
          body: 'না পড়লে আর কখনও বলব না... কিন্তু নিজের স্ট্রিকটা তো বাঁচা!',
        },
        {
          heading: 'আর মাত্র কিছুক্ষণ বাকি! স্ট্রিক যাবে কিন্তু 💔',
          body: `এত কষ্ট করে জমানো ${streak} দিনের অর্জন কি পানিতে যাবে? এখনই ৫টা প্রশ্ন সলভ কর!`,
        },
        {
          heading: 'আজকে এখনও অ্যাপে ঢোকোনি কেন? 🧐',
          body: 'ঘুমানোর আগে জাস্ট ৩ মিনিট সময় দাও, নিজের রেকর্ড নিজে ভাঙো 🔥',
        },
        {
          heading: 'স্ট্রিক শেষ হওয়ার কাউন্টডাউন শুরু ⌛',
          body: 'ঘড়ির কাঁটা ১২টা ছোঁয়ার আগেই ছোট্ট একটা টেস্ট দিয়ে স্ট্রিক লক করে নাও!',
        },
        {
          heading: 'তোমার স্ট্রিক কিন্তু এখন লাইফ সাপোর্টে! 😂',
          body: 'দ্রুত এসে ১টা কুইজ সমাধান করে একে বাঁচিয়ে তোলো!',
        },
        {
          heading: 'আরে ভাই, এখনো পরীক্ষা দেও নাই? 😱',
          body: '১টা ছোট টেস্ট দিয়ে ঘুমাও, কাল সকালে যেন আফসোস না করতে হয়!',
        },
        {
          heading: `আজকে ${streak} দিনের রেকর্ড ভাঙবে না তো? 👀`,
          body: 'দেরি করো না, মাত্র ২ মিনিট সময় দিয়ে স্ট্রিকটা কনফার্ম করে ফেলো!',
        },
      ];

      const picked = await pickUnrepeatedTemplate(supabaseAdmin, userId, 'streak_at_risk', streakHooks);
      const title = formatHeadingWithNickname(nickname, picked.heading);

      await dispatchPersonalizedMessage(supabaseAdmin, {
        userId,
        title,
        body: picked.body,
        route: '/exam-setup',
        channelId: 'obhyash_streak_channel',
        notificationType: 'streak_at_risk',
        referenceId: todayDhakaStr,
      });

      dispatched++;
      continue;
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT 2: Streak Milestones (৩, ৭, ১৪, ২১, ৩০, ৫০, ১০০ দিন পূর্ণ হলে) - 8 Variations
    // ─────────────────────────────────────────────────────────────
    const milestones = [3, 7, 14, 21, 30, 50, 100];
    if (milestones.includes(streak) && hasPracticedToday) {
      const milestoneRef = `milestone_${streak}_${todayDhakaStr}`;
      const canSend = await canSendNotificationToUser(supabaseAdmin, userId, 'streak_milestone', milestoneRef, 24.0, 2);
      if (canSend) {
        const milestoneHooks = [
          {
            heading: `টানা ${streak} দিন! আগুন পারফরম্যান্স 🔥`,
            body: 'এই স্পিড ধরে রাখলে চান্স কেউ ঠেকাতে পারবে না, চালিয়ে যাও!',
          },
          {
            heading: 'সেই লেভেলের খেলছিস! 👏',
            body: `টানা ${streak} দিন কম কথা না! তোমার প্রস্তুতি সেরা হচ্ছে।`,
          },
          {
            heading: 'কনসিস্টেন্সির বাপদাদা তুমি! 😎',
            body: `টানা ${streak} দিনের স্ট্রিক বানিয়ে ফেললে! স্যালুট তোমার ডেডিকেশনকে 🫡`,
          },
          {
            heading: 'হ্যাটট্রিক নাকি বিশ্বরেকর্ড? 💥',
            body: `${streak} দিন ধরে এক নাগারে পড়ছো! তোমার নাম কিন্তু টপারদের তালিকায় উঠবেই।`,
          },
          {
            heading: `অস্থির ভাই! টানা ${streak} দিন কমপ্লিট 🏆`,
            body: 'সবাই শুরু করে কিন্তু ধরে রাখতে পারে খুব কম জন। তুমি তাদের একজন 👏',
          },
          {
            heading: 'এই তো চাই আসল স্টুডেন্ট! 🔥',
            body: `${streak} দিনের ধারাবাহিকতা! আজকের প্র্যাকটিসটাও সেরকম জমে উঠেছে।`,
          },
          {
            heading: `মাইলস্টোন আনলকড: টানা ${streak} দিন! 🥇`,
            body: 'তোমার কনসিস্টেন্সি দেখে বাকিরাও ইন্সপায়ার হচ্ছে, থামবে না একদম!',
          },
        ];

        const picked = await pickUnrepeatedTemplate(supabaseAdmin, userId, 'streak_milestone', milestoneHooks);
        const title = formatHeadingWithNickname(nickname, picked.heading);

        await dispatchPersonalizedMessage(supabaseAdmin, {
          userId,
          title,
          body: picked.body,
          route: '/dashboard',
          channelId: 'obhyash_streak_channel',
          notificationType: 'streak_milestone',
          referenceId: milestoneRef,
        });

        dispatched++;
        continue;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT 3: Exam কম দিলে / Low Activity Roast (দুপুর ১২:০০ - ৫:০০ PM) - 6 Variations
    // ─────────────────────────────────────────────────────────────
    if (dhakaHour >= 12 && dhakaHour <= 17 && !hasPracticedToday) {
      const lowActRef = `low_act_${todayDhakaStr}`;
      const canSend = await canSendNotificationToUser(supabaseAdmin, userId, 'low_activity', lowActRef, 24.0, 1);
      if (canSend) {
        const lowActivityHooks = [
          {
            heading: 'আজ কি পরীক্ষার ভয় পেয়েছো? 😂',
            body: 'শুধু বই খুলে বসে থাকলে হবে না, ৫টা প্রশ্নের ছোট সেট দিয়ে দেখ তো কত পাও!',
          },
          {
            heading: 'টেস্ট না দিলে প্র্যাকটিস হবে কীভাবে? 🧐',
            body: 'দ্রুত ৩ মিনিটের একটা কুইজ দিয়ে নিজের স্পিড ও প্রস্তুতি যাচাই করে নাও ✍️',
          },
          {
            heading: 'আজকে তোমার স্কোরবোর্ড খালি কেন? 👀',
            body: 'অন্যরা অলরেডি প্র্যাকটিস শুরু করেছে, তুমিও ছোট্ট একটা টেস্ট দিয়ে ফেলো!',
          },
          {
            heading: 'পড়া শেষ? এবার একটু যাচাই কর 💥',
            body: 'পড়া মাথায় আছে কি না দেখতে এখনই একটা ছোট টেস্ট সাবমিট করে ফেলো!',
          },
          {
            heading: 'শুধু থিওরি পড়লে চলবে না কিন্তু! 🙃',
            body: 'আসল খেলা তো এক্সাম হলে! চলো চটপট একটা সেট প্র্যাকটিস করে ফেলি 🔥',
          },
          {
            heading: 'আজকে কোন এক্সাম দেওয়া হয়নি 🥺',
            body: 'মাত্র ১০টি প্রশ্ন সলভ করতে সময় লাগবে ২ মিনিট! শুরু করো এখনই।',
          },
        ];

        const picked = await pickUnrepeatedTemplate(supabaseAdmin, userId, 'low_activity', lowActivityHooks);
        const title = formatHeadingWithNickname(nickname, picked.heading);

        await dispatchPersonalizedMessage(supabaseAdmin, {
          userId,
          title,
          body: picked.body,
          route: '/exam-setup',
          channelId: 'obhyash_general',
          notificationType: 'low_activity',
          referenceId: lowActRef,
        });

        dispatched++;
        continue;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT 4: অনেকদিন App use না করলে (Inactivity 2+ Days Comeback) - 8 Variations
    // ─────────────────────────────────────────────────────────────
    if (dhakaHour >= 11 && dhakaHour <= 19) {
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const isInactive = !lastStreakDate || lastStreakDate < twoDaysAgo;

      if (isInactive) {
        const inactivityRef = `inactive_${todayDhakaStr}`;
        const canSend = await canSendNotificationToUser(supabaseAdmin, userId, 'inactivity_comeback', inactivityRef, 48.0, 1);
        if (canSend) {
          const comebackHooks = [
            {
              heading: 'তুই কি আমাদের ভুলে গেলি? 🥺',
              body: 'বইগুলো কিন্তু কাঁদছে! ঝটপট এসে একটা ছোট টেস্ট দিয়ে কামব্যাক কর।',
            },
            {
              heading: 'এতদিন কোথায় ছিলে? 👀',
              body: 'চলো আজ ৩ মিনিটে একটা কুইজ খেলে আবার ট্র্যাকে ফিরে আসি।',
            },
            {
              heading: 'পড়ার টেবিল কি তোমায় খুঁজছে? 🧐',
              body: 'প্র্যাকটিসে এত ঢিলেমি কেন? আজ অন্তত ৫টা প্রশ্ন সলভ করে হাত চালু করো।',
            },
            {
              heading: 'আমাদের উপর কি কোনো রাগ হয়েছে? 💔',
              body: 'কত নতুন প্রশ্ন অ্যাড হয়েছে জানো? এসে একবার চোখ বুলিয়ে যাও!',
            },
            {
              heading: 'তুমি হারিয়ে গেলে কীভাবে চলবে? 😭',
              body: 'প্রতিদ্বন্দ্বীরা কিন্তু প্রতিদিন এগিয়ে যাচ্ছে, দ্রুত কামব্যাক করো!',
            },
            {
              heading: 'তোমার চেয়ার-টেবিল কিন্তু অপেক্ষা করছে 😴',
              body: 'আলসেমি ঝেড়ে ফেলে আজ মাত্র ৫ মিনিটের একটা ছোট এক্সাম দিয়ে শুরু করো!',
            },
            {
              heading: 'আজ আর কোনো বাহানা চলবে না! 😤',
              body: 'বইটা খোলো আর ১টা ছোট টেস্ট দিয়ে প্রমাণ করো তুমি এখনও ট্র্যাকেই আছো!',
            },
            {
              heading: 'চলো একটা ফ্রেশ স্টার্ট নেওয়া যাক ☕',
              body: 'পুরোনো গ্যাপ ভুলে গিয়ে আজ থেকে আবার নিয়মিত হয়ে যাই!',
            },
          ];

          const picked = await pickUnrepeatedTemplate(supabaseAdmin, userId, 'inactivity_comeback', comebackHooks);
          const title = formatHeadingWithNickname(nickname, picked.heading);

          await dispatchPersonalizedMessage(supabaseAdmin, {
            userId,
            title,
            body: picked.body,
            route: '/exam-setup',
            channelId: 'obhyash_general',
            notificationType: 'inactivity_comeback',
            referenceId: inactivityRef,
          });

          dispatched++;
          continue;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // EVENT 5: সকালের চায়ের সাথে কুইজ (Morning Routine 7:30 AM - 9:30 AM) - 6 Variations
    // ─────────────────────────────────────────────────────────────
    if (dhakaHour >= 7 && dhakaHour <= 9 && !hasPracticedToday) {
      const morningRef = `morning_${todayDhakaStr}`;
      const canSend = await canSendNotificationToUser(supabaseAdmin, userId, 'morning_routine', morningRef, 24.0, 1);
      if (canSend) {
        const morningHooks = [
          {
            heading: 'এক কাপ চায়ের সাথে ১টা কুইজ? ☕',
            body: 'চা ঠান্ডা হওয়ার আগেই ৫টা প্রশ্ন সলভ করে আজকের দিন শুরু করো।',
          },
          {
            heading: 'ঘুম ভাঙল কি? 👀',
            body: 'প্রতিদ্বন্দ্বীরা অলরেডি রিভিশন শুরু করেছে, ৩ মিনিটে আজকের সেটটা দাও।',
          },
          {
            heading: 'শুভ সকাল! ব্রেনটা একটু তাজা করে নাও ☀️',
            body: 'সকালের প্রথম কুইজটা দিয়ে দিনটা দারুণভাবে শুরু হোক!',
          },
          {
            heading: 'আজকের প্রথম চ্যালেঞ্জ রেডি! ✍️',
            body: 'মাত্র ৫টি প্রশ্ন, সকাল সকাল ফুল মার্কস পাওয়ার চেষ্টা করো তো!',
          },
          {
            heading: 'সকাল সকাল পড়াটা ঝালাই হয়ে যাক ☕',
            body: 'ঘুমের ঘোর কাটাতে চলো ৩ মিনিটের একটা দ্রুত টেস্ট দিয়ে ফেলি!',
          },
          {
            heading: 'পাখিরাও উঠে গেছে, তুমি এখনও ঘুমে? 😂',
            body: 'চোখ ঘষে উঠে একটা কুইজ দিয়ে আজকের দিনের স্ট্রিক লক করে নাও!',
          },
        ];

        const picked = await pickUnrepeatedTemplate(supabaseAdmin, userId, 'morning_routine', morningHooks);
        const title = formatHeadingWithNickname(nickname, picked.heading);

        await dispatchPersonalizedMessage(supabaseAdmin, {
          userId,
          title,
          body: picked.body,
          route: '/exam-setup',
          channelId: 'obhyash_general',
          notificationType: 'morning_routine',
          referenceId: morningRef,
        });

        dispatched++;
        continue;
      }
    }
  }

  return { dispatched, fatigueBlocked };
}

/**
 * Master automation entrypoint:
 * Runs both live exam lifecycle notifications (30m, started, leaderboard)
 * and behavioral engagement notifications (streak savior, milestone, comeback)
 * with full delivery logging and anti-fatigue checks.
 */
export async function runCompleteSmartNotificationPipeline(
  supabaseAdmin: SupabaseClient
): Promise<SmartNotificationResult> {
  const now = new Date();
  const details: any[] = [];

  try {
    // 1. Live Exam Notifications
    const liveExamRes = await runAutomatedLiveExamNotifications(supabaseAdmin);
    details.push({ action: 'live_exams', ...liveExamRes });

    // 2. Behavioral & Engagement Notifications
    const behavioralRes = await runAutomatedBehavioralNotifications(supabaseAdmin);
    details.push({ action: 'behavioral', ...behavioralRes });

    const totalDispatched =
      liveExamRes.liveExam30m +
      liveExamRes.liveExamStart +
      liveExamRes.leaderboard +
      behavioralRes.dispatched;

    const totalFatigueBlocked =
      liveExamRes.fatigueBlocked + behavioralRes.fatigueBlocked;

    return {
      success: true,
      timestamp: now.toISOString(),
      liveExam30mDispatched: liveExamRes.liveExam30m,
      liveExamStartDispatched: liveExamRes.liveExamStart,
      leaderboardDispatched: liveExamRes.leaderboard,
      behavioralDispatched: behavioralRes.dispatched,
      fatigueBlocked: totalFatigueBlocked,
      logsRecorded: totalDispatched,
      details,
    };
  } catch (err: any) {
    console.error('[runCompleteSmartNotificationPipeline] Error:', err);
    return {
      success: false,
      timestamp: now.toISOString(),
      liveExam30mDispatched: 0,
      liveExamStartDispatched: 0,
      leaderboardDispatched: 0,
      behavioralDispatched: 0,
      fatigueBlocked: 0,
      logsRecorded: 0,
      error: err.message || String(err),
      details,
    };
  }
}
