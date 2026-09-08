import { SupabaseClient } from '@supabase/supabase-js';
import { getContextualNotification } from './witty-notification-engine';
import { sendFCMNotificationToUsers } from './fcm-server';

export interface AutomatedNotificationResult {
  success: boolean;
  category: string;
  totalUsersTargeted: number;
  inAppInserted: number;
  fcmDispatched: number;
  fcmFailed: number;
  title: string;
  body: string;
}

/**
 * Dispatches automated, witty Duolingo/Chorcha style notifications to all active users
 */
export async function dispatchAutomatedWittyNotification(
  supabaseAdmin: SupabaseClient,
  categoryOverride?: string,
): Promise<AutomatedNotificationResult> {
  const notifMeta = getContextualNotification(categoryOverride);
  const now = new Date().toISOString();

  // 1. Fetch all registered users
  const { data: users, error: usersErr } = await supabaseAdmin
    .from('users')
    .select('id, name, email');

  if (usersErr || !users || users.length === 0) {
    throw new Error(`Failed to fetch users: ${usersErr?.message || 'No users found'}`);
  }

  // 2. Prepare personalized in-app notifications
  const inAppNotifications = users.map((u) => {
    const fullName = (u.name && u.name.trim()) ? u.name.trim() : 'বন্ধু';
    const streakVal = (u.streak_count && u.streak_count > 0) ? u.streak_count : 6;
    const personalizedTitle = notifMeta.title
      .replace(/\{name\}/g, fullName)
      .replace(/\{streak\}/g, String(streakVal));
    const personalizedBody = notifMeta.body
      .replace(/\{name\}/g, fullName)
      .replace(/\{streak\}/g, String(streakVal));

    return {
      user_id: u.id,
      title: personalizedTitle,
      message: personalizedBody,
      body: personalizedBody,
      type: notifMeta.type,
      priority: notifMeta.priority,
      link: notifMeta.route,
      data: { route: notifMeta.route },
      is_read: false,
      created_at: now,
    };
  });

  // Batch insert into `notifications` table (chunk of 50)
  let inAppCount = 0;
  const CHUNK_SIZE = 50;
  for (let i = 0; i < inAppNotifications.length; i += CHUNK_SIZE) {
    const chunk = inAppNotifications.slice(i, i + CHUNK_SIZE);
    const { error: insErr } = await supabaseAdmin.from('notifications').insert(chunk);
    if (!insErr) {
      inAppCount += chunk.length;
    } else {
      console.error('In-app batch insert error:', insErr);
    }
  }

  // 3. Dispatch Device Push Notification via Firebase FCM v1
  const genericTitle = notifMeta.title.replace(/\{name\}/g, 'Limon Howlader').replace(/\{streak\}/g, '6');
  const genericBody = notifMeta.body.replace(/\{name\}/g, 'Limon Howlader').replace(/\{streak\}/g, '6');

  const allUserIds = users.map((u) => u.id);
  const fcmResult = await sendFCMNotificationToUsers(supabaseAdmin, {
    userIds: allUserIds,
    title: genericTitle,
    body: genericBody,
    data: { route: notifMeta.route },
    channelId: notifMeta.channelId,
  });

  return {
    success: true,
    category: notifMeta.category,
    totalUsersTargeted: users.length,
    inAppInserted: inAppCount,
    fcmDispatched: fcmResult.sent,
    fcmFailed: fcmResult.failed,
    title: genericTitle,
    body: genericBody,
  };
}
