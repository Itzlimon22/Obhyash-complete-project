'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getDeviceToken,
  getDeviceName,
  getDeviceType,
  DeviceSession,
} from '@/services/device-session-service';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

export interface DeviceLimitState {
  blocked: boolean; // true = this device is over the limit
  limitData: {
    limit: number;
    count: number;
    plan: string;
    devices: DeviceSession[];
  } | null;
}

const HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function doRegister() {
  const res = await fetch('/api/devices/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      device_token: getDeviceToken(),
      device_name: getDeviceName(),
      device_type: getDeviceType(),
    }),
  });

  if (res.status === 403) {
    const body = await res.json();
    return {
      blocked: true as const,
      limitData: {
        limit: body.limit as number,
        count: body.count as number,
        plan: body.plan as string,
        devices: (body.devices ?? []) as DeviceSession[],
      },
    };
  }

  return { blocked: false as const, limitData: null };
}

/**
 * useDeviceSession
 *
 * Call this once after the user is confirmed authenticated (e.g. in a root
 * layout or dashboard layout client component).
 *
 * What it does:
 * 1. Registers this device via POST /api/devices/register.
 *    - If the device limit is exceeded → sets `blocked = true` + exposes device list.
 *    - If already registered → refreshes the last_active timestamp.
 * 2. Sends a heartbeat every 5 minutes to keep last_active fresh.
 * 3. On unmount / sign-out, stops the heartbeat (does NOT auto-remove device —
 *    the user must explicitly revoke a device or it ages out after 30 days).
 */
export function useDeviceSession(
  userId: string | null | undefined,
): DeviceLimitState {
  const [state, setState] = useState<DeviceLimitState>({
    blocked: false,
    limitData: null,
  });

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { signOut } = useAuth();

  // Realtime: sign out immediately if this device's row is deleted remotely
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const myToken = getDeviceToken();

    const channel = supabase
      .channel(`device-revoke:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'user_devices',
          filter: `user_id=eq.${userId}`,
        },
        (payload: { old: Partial<DeviceSession> }) => {
          if (payload.old?.device_token === myToken) {
            // Our own device row was deleted — sign out immediately
            signOut().catch(() => {});
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, signOut]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    doRegister()
      .then((result) => {
        if (!cancelled) setState(result);
      })
      .catch(() => {
        /* fail open — don't block user on network error */
      });

    // Heartbeat: re-register (upserts last_active, no limit re-check needed)
    heartbeatRef.current = setInterval(() => {
      doRegister().catch(() => {});
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [userId]);

  return state;
}
