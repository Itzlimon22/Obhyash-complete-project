/**
 * Firebase Cloud Messaging (FCM) HTTP v1 Server Dispatcher
 * Modern Google FCM v1 API with Service Account OAuth2 Authentication.
 */

import * as jose from 'jose';

interface SendPushOptions {
  userIds: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  channelId?: string;
}

// In-memory cached OAuth2 access token
let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Generates an OAuth2 access token from Google Service Account credentials using `jose`
 */
async function getGoogleOAuth2AccessToken(serviceAccount: {
  client_email: string;
  private_key: string;
  project_id: string;
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Return cached token if valid (valid for 1 hour, refresh at 50 min)
  if (cachedAccessToken && tokenExpiresAt > now + 300) {
    return cachedAccessToken;
  }

  const { client_email, private_key } = serviceAccount;
  const cleanedKey = private_key.replace(/\\n/g, '\n');

  // Import PKCS8 private key
  const ecPrivateKey = await jose.importPKCS8(cleanedKey, 'RS256');

  // Create and sign JWT
  const jwt = await new jose.SignJWT({
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(client_email)
    .setSubject(client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(ecPrivateKey);

  // Exchange JWT for Google OAuth2 access token
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    throw new Error(`Failed to obtain Google OAuth2 token: ${tokenRes.status} ${errText}`);
  }

  const tokenData = await tokenRes.json();
  cachedAccessToken = tokenData.access_token;
  tokenExpiresAt = now + (tokenData.expires_in || 3600);

  return cachedAccessToken!;
}

/**
 * Resolves Firebase Service Account credentials from environment variables
 */
function getFirebaseCredentials(): {
  client_email: string;
  private_key: string;
  project_id: string;
} | null {
  // Option A: Raw JSON string in FIREBASE_SERVICE_ACCOUNT_KEY
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      if (parsed.client_email && parsed.private_key) {
        return {
          client_email: parsed.client_email,
          private_key: parsed.private_key,
          project_id: parsed.project_id || 'obhyash-app',
        };
      }
    } catch (_) {}
  }

  // Option B: Individual environment variables
  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
      project_id: process.env.FIREBASE_PROJECT_ID || 'obhyash-app',
    };
  }

  return null;
}

/**
 * Sends real push notifications to target users' active mobile devices via FCM HTTP v1
 */
export async function sendFCMNotificationToUsers(
  supabaseAdmin: any,
  options: SendPushOptions,
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const { userIds, title, body, data = {}, channelId = 'obhyash_general' } = options;

  if (!userIds.length) return { sent: 0, failed: 0, errors: [] };

  try {
    // 1. Fetch active device tokens from Supabase
    const { data: tokensData, error: tokensErr } = await supabaseAdmin
      .from('user_fcm_tokens')
      .select('id, user_id, fcm_token, platform')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (tokensErr) {
      console.error('[FCM v1] Error fetching tokens:', tokensErr);
      return { sent: 0, failed: 0, errors: [tokensErr.message] };
    }

    if (!tokensData || tokensData.length === 0) {
      console.log('[FCM v1] No registered device tokens found for users count:', userIds.length);
      return { sent: 0, failed: 0, errors: ['No registered device tokens found'] };
    }

    const credentials = getFirebaseCredentials();
    if (!credentials) {
      console.warn(
        '[FCM v1] ⚠️ Firebase Service Account is not configured in .env.local.\n' +
        'Please add FIREBASE_SERVICE_ACCOUNT_KEY or (FIREBASE_CLIENT_EMAIL & FIREBASE_PRIVATE_KEY) in .env.local.',
      );
      return {
        sent: 0,
        failed: 0,
        errors: ['FIREBASE_SERVICE_ACCOUNT_KEY missing in environment'],
      };
    }

    // 2. Get OAuth2 token
    const accessToken = await getGoogleOAuth2AccessToken(credentials);
    const projectId = credentials.project_id;
    const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];
    const invalidTokenIds: string[] = [];

    // 3. Dispatch to each device token concurrently (in batches of 20)
    const BATCH_CONCURRENCY = 20;
    for (let i = 0; i < tokensData.length; i += BATCH_CONCURRENCY) {
      const chunk = tokensData.slice(i, i + BATCH_CONCURRENCY);

      const promises = chunk.map(async (row: any) => {
        const messagePayload = {
          message: {
            token: row.fcm_token,
            notification: {
              title,
              body,
            },
            data: {
              ...data,
              title,
              body,
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            },
            android: {
              priority: 'HIGH',
              notification: {
                channel_id: channelId,
                sound: 'default',
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
              },
            },
            apns: {
              payload: {
                aps: {
                  alert: { title, body },
                  sound: 'default',
                  badge: 1,
                },
              },
            },
          },
        };

        try {
          const res = await fetch(fcmEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(messagePayload),
          });

          if (res.ok) {
            sentCount++;
          } else {
            failedCount++;
            const errJson = await res.json().catch(() => ({}));
            const errorCode = errJson?.error?.details?.[0]?.errorCode || errJson?.error?.status;

            if (errorCode === 'UNREGISTERED' || errorCode === 'INVALID_ARGUMENT') {
              invalidTokenIds.push(row.id);
            } else {
              errors.push(`Token error: ${JSON.stringify(errJson?.error?.message || errJson)}`);
            }
          }
        } catch (postErr: any) {
          failedCount++;
          errors.push(postErr?.message || String(postErr));
        }
      });

      await Promise.all(promises);
    }

    // 4. Deactivate obsolete/unregistered tokens
    if (invalidTokenIds.length > 0) {
      await supabaseAdmin
        .from('user_fcm_tokens')
        .update({ is_active: false })
        .in('id', invalidTokenIds);
      console.log(`[FCM v1] Deactivated ${invalidTokenIds.length} obsolete device tokens.`);
    }

    console.log(`[FCM v1] Dispatched: ${sentCount} sent, ${failedCount} failed.`);
    return { sent: sentCount, failed: failedCount, errors };
  } catch (err: any) {
    console.error('[FCM v1] Fatal Exception:', err);
    return { sent: 0, failed: 0, errors: [err?.message || String(err)] };
  }
}
