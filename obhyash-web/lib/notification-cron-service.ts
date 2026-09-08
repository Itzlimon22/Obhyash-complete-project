import { SupabaseClient } from '@supabase/supabase-js';
import { getContextualNotification, extractIntelligentNickname } from './witty-notification-engine';
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

  // 1. Fetch all registered users
  const { data: users, error: usersErr } = await supabaseAdmin
    .from('users')
    .select('id, name, email');

  if (usersErr || !users || users.length === 0) {
    throw new Error(`Failed to fetch users: ${usersErr?.message || 'No users found'}`);
  }

  // NOTE: Automated witty Chorcha/Duolingo notifications are strictly device push notifications.
  // Per user specification, device push notifications NEVER enter the user's in-app `notifications` page/table.

  // 2. Build personalized push payloads using intelligent nicknames
  const perUserMap: Record<string, { title: string; body: string }> = {};
  for (const u of users) {
    const userObj = u as Record<string, any>;
    const nickname = extractIntelligentNickname(userObj.name);
    const streakVal = (userObj.streak_count && userObj.streak_count > 0) ? userObj.streak_count : 6;
    perUserMap[userObj.id] = {
      title: notifMeta.title.replace(/\{name\}/g, nickname).replace(/\{streak\}/g, String(streakVal)),
      body: notifMeta.body.replace(/\{name\}/g, nickname).replace(/\{streak\}/g, String(streakVal)),
    };
  }

  const sampleNickname = users.length > 0 ? extractIntelligentNickname((users[0] as any).name) : 'বন্ধু';
  const genericTitle = notifMeta.title.replace(/\{name\}/g, sampleNickname).replace(/\{streak\}/g, '6');
  const genericBody = notifMeta.body.replace(/\{name\}/g, sampleNickname).replace(/\{streak\}/g, '6');

  // 3. Dispatch Device Push Notification via Firebase FCM v1
  const allUserIds = users.map((u) => u.id);
  const fcmResult = await sendFCMNotificationToUsers(supabaseAdmin, {
    userIds: allUserIds,
    title: genericTitle,
    body: genericBody,
    perUserPayload: perUserMap,
    data: {
      route: notifMeta.route || '/dashboard',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    },
    channelId: notifMeta.channelId,
  });

  return {
    success: true,
    category: notifMeta.category,
    totalUsersTargeted: users.length,
    inAppInserted: 0, // Strictly separated from in-app notifications page
    fcmDispatched: fcmResult.sent,
    fcmFailed: fcmResult.failed,
    title: genericTitle,
    body: genericBody,
  };
}
