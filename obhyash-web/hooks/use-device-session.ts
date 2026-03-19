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
  // Device limitations have been disabled as per user request.
  // This hook now returns a constant non-blocked state.
  return {
    blocked: false,
    limitData: null,
  };
}
