/**
 * Device Session Service
 * Netflix-style device limiting — max N devices per subscription plan.
 *
 * Device identity is a UUID generated once per browser and stored in localStorage.
 * - Survives page refreshes, tab closes, and browser restarts.
 * - Cleared only when the user explicitly revokes the device or clears storage.
 */

import { createClient } from '@/utils/supabase/client';

export interface DeviceSession {
  id: string;
  user_id: string;
  device_token: string;
  device_name: string;
  device_type: 'web' | 'mobile' | 'tablet';
  ip_address: string | null;
  last_active: string;
  created_at: string;
  is_current?: boolean; // populated client-side
}

export interface DeviceLimitCheck {
  allowed: boolean;
  is_known: boolean;
  count: number;
  limit: number;
  plan: string;
}

const DEVICE_TOKEN_KEY = 'obhyash_device_token';

// ---------------------------------------------------------------------------
// Device token — stable UUID for this browser
// ---------------------------------------------------------------------------

export function getDeviceToken(): string {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
  }
  return token;
}

// ---------------------------------------------------------------------------
// Device name — human-readable label from user-agent
// ---------------------------------------------------------------------------

export function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Unknown Device';
  const ua = navigator.userAgent;

  let os = 'Unknown OS';
  if (/Windows NT 10/.test(ua)) os = 'Windows 10/11';
  else if (/Windows NT 6/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/iPhone|iPad/.test(ua)) os = 'iOS';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  else if (/Safari\//.test(ua)) browser = 'Safari';

  return `${browser} on ${os}`;
}

export function getDeviceType(): 'web' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'web';
  const ua = navigator.userAgent;
  if (/Tablet|iPad/.test(ua)) return 'tablet';
  if (/Mobile|Android|iPhone/.test(ua)) return 'mobile';
  return 'web';
}

// ---------------------------------------------------------------------------
// Check if a new device login is allowed (call BEFORE registering)
// ---------------------------------------------------------------------------

export async function checkDeviceLimit(
  userId: string,
  deviceToken: string,
): Promise<DeviceLimitCheck> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('check_device_limit', {
    p_user_id: userId,
    p_device_token: deviceToken,
  });
  if (error) throw error;
  return data as DeviceLimitCheck;
}

// ---------------------------------------------------------------------------
// Register or refresh (heartbeat) this device
// Called after a successful login.
// ---------------------------------------------------------------------------

export async function registerDevice(userId: string): Promise<DeviceSession> {
  const supabase = createClient();
  const token = getDeviceToken();
  const name = getDeviceName();
  const type = getDeviceType();

  const { data, error } = await supabase
    .from('user_devices')
    .upsert(
      {
        user_id: userId,
        device_token: token,
        device_name: name,
        device_type: type,
        last_active: new Date().toISOString(),
      },
      { onConflict: 'user_id,device_token' },
    )
    .select()
    .single();

  if (error) throw error;
  return data as DeviceSession;
}

// ---------------------------------------------------------------------------
// Heartbeat — update last_active every N minutes while the user is active
// ---------------------------------------------------------------------------

export async function heartbeat(userId: string): Promise<void> {
  const supabase = createClient();
  const token = getDeviceToken();
  await supabase
    .from('user_devices')
    .update({ last_active: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('device_token', token);
}

// ---------------------------------------------------------------------------
// List all devices for a user (with current device flagged)
// ---------------------------------------------------------------------------

export async function listDevices(userId: string): Promise<DeviceSession[]> {
  const supabase = createClient();
  const currentToken = getDeviceToken();

  const { data, error } = await supabase
    .from('user_devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_active', { ascending: false });

  if (error) throw error;

  return (data as DeviceSession[]).map((d) => ({
    ...d,
    is_current: d.device_token === currentToken,
  }));
}

// ---------------------------------------------------------------------------
// Revoke (sign out) a specific device by its row id
// ---------------------------------------------------------------------------

export async function revokeDevice(deviceId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('user_devices')
    .delete()
    .eq('id', deviceId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Sign out THIS device (called on explicit log out)
// ---------------------------------------------------------------------------

export async function unregisterCurrentDevice(userId: string): Promise<void> {
  const supabase = createClient();
  const token = getDeviceToken();
  await supabase
    .from('user_devices')
    .delete()
    .eq('user_id', userId)
    .eq('device_token', token);
}
