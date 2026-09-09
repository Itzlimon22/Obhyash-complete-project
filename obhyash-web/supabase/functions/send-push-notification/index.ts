/**
 * Obhyash — Supabase Edge Function: send-push-notification
 *
 * Triggered by a PostgreSQL webhook on INSERT into the `notifications` table.
 * Fetches the user's FCM token(s), then calls Firebase FCM HTTP v1 API
 * to deliver a real push notification to the user's device(s).
 *
 * Environment variables (set in Supabase Dashboard → Project Settings → Edge Functions):
 *   SUPABASE_URL               — Your project URL  (auto-set by Supabase)
 *   SUPABASE_SERVICE_ROLE_KEY  — Service role key   (auto-set by Supabase)
 *   FIREBASE_SERVICE_ACCOUNT   — Full Firebase service account JSON (paste as string)
 */

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

// ── Types ────────────────────────────────────────────────────────────────────

interface ServiceAccount {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
}

interface NotificationPayload {
  record: {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    data?: Record<string, unknown>;
    is_read: boolean;
    created_at: string;
  };
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  old_record?: unknown;
}

// ── JWT Utilities (for Firebase OAuth2) ──────────────────────────────────────

function base64urlEncode(data: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...data));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function encodeText(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

async function createServiceAccountJWT(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: sa.token_uri,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = base64urlEncode(encodeText(JSON.stringify(header)));
  const encodedPayload = base64urlEncode(encodeText(JSON.stringify(payload)));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  // Import the RSA private key
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encodeText(signingInput),
  );

  const encodedSignature = base64urlEncode(new Uint8Array(signature));
  return `${signingInput}.${encodedSignature}`;
}

async function getFirebaseAccessToken(sa: ServiceAccount): Promise<string> {
  const jwt = await createServiceAccountJWT(sa);

  const resp = await fetch(sa.token_uri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Failed to get Firebase access token: ${resp.status} ${text}`);
  }

  const { access_token } = await resp.json();
  return access_token as string;
}

// ── FCM Send ─────────────────────────────────────────────────────────────────

async function sendFCMPush(opts: {
  accessToken: string;
  projectId: string;
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ success: boolean; error?: string }> {
  const url = `https://fcm.googleapis.com/v1/projects/${opts.projectId}/messages:send`;

  const message = {
    message: {
      token: opts.fcmToken,
      notification: {
        title: opts.title,
        body: opts.body,
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          channel_id: opts.data?.channel_id ?? 'obhyash_general',
          color: '#059669',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      data: opts.data ?? {},
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${opts.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!resp.ok) {
    const error = await resp.text();
    return { success: false, error };
  }

  return { success: true };
}

// ── Channel Routing ───────────────────────────────────────────────────────────

function resolveChannel(type: string): string {
  switch (type) {
    case 'live_exam':
      return 'obhyash_live_exams';
    case 'streak':
    case 'milestone':
      return 'obhyash_streak_channel';
    default:
      return 'obhyash_general';
  }
}

// ── Main Handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Only allow POST (webhook sends POST)
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const payload: NotificationPayload = await req.json();

    // Only handle INSERT events
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ skipped: true, reason: 'not an INSERT' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const notif = payload.record;
    if (!notif?.user_id || !notif?.title) {
      return new Response(JSON.stringify({ skipped: true, reason: 'missing fields' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Load env vars
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const saRaw = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');

    if (!supabaseUrl || !serviceRoleKey || !saRaw) {
      console.error('[send-push] Missing env vars');
      return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const serviceAccount: ServiceAccount = JSON.parse(saRaw);

    // 1. Fetch active FCM tokens for this user
    const tokenResp = await fetch(
      `${supabaseUrl}/rest/v1/user_fcm_tokens?user_id=eq.${notif.user_id}&is_active=eq.true&select=fcm_token,platform`,
      {
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
      },
    );

    if (!tokenResp.ok) {
      const err = await tokenResp.text();
      console.error('[send-push] Failed to fetch FCM tokens:', err);
      return new Response(JSON.stringify({ error: 'token fetch failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const tokens: Array<{ fcm_token: string; platform: string }> = await tokenResp.json();

    if (!tokens || tokens.length === 0) {
      console.log(`[send-push] No active FCM tokens for user ${notif.user_id} — skipping`);
      return new Response(JSON.stringify({ skipped: true, reason: 'no tokens' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Get Firebase access token
    const accessToken = await getFirebaseAccessToken(serviceAccount);

    // 3. Build data payload
    const dataPayload: Record<string, string> = {
      notification_id: notif.id,
      type: notif.type ?? 'general',
      channel_id: resolveChannel(notif.type ?? 'general'),
    };
    if (notif.link) dataPayload['route'] = notif.link;

    // 4. Send to all active tokens
    const results = await Promise.allSettled(
      tokens.map((t) =>
        sendFCMPush({
          accessToken,
          projectId: serviceAccount.project_id,
          fcmToken: t.fcm_token,
          title: notif.title,
          body: notif.message,
          data: dataPayload,
        })
      ),
    );

    // 5. Deactivate invalid tokens (NotRegistered / InvalidRegistration)
    const staleTokens: string[] = [];
    results.forEach((res, idx) => {
      if (res.status === 'fulfilled' && !res.value.success) {
        const err = res.value.error ?? '';
        if (err.includes('UNREGISTERED') || err.includes('InvalidRegistration')) {
          staleTokens.push(tokens[idx].fcm_token);
        }
        console.warn(`[send-push] Token ${idx} failed:`, err);
      }
    });

    if (staleTokens.length > 0) {
      // Best-effort deactivation, don't fail the request
      fetch(
        `${supabaseUrl}/rest/v1/user_fcm_tokens?fcm_token=in.(${staleTokens.map((t) => `"${t}"`).join(',')})`,
        {
          method: 'PATCH',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active: false }),
        },
      ).catch(() => {});
    }

    const sent = results.filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<{ success: boolean }>).value.success).length;
    console.log(`[send-push] Sent ${sent}/${tokens.length} pushes for notification ${notif.id}`);

    return new Response(
      JSON.stringify({ sent, total: tokens.length, stale_removed: staleTokens.length }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[send-push] Unhandled error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
