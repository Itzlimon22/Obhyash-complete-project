'use client';

import { useEffect, useRef, useCallback } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

interface UseSessionMonitorOptions {
  /** User id of current logged-in user. Pass null to disable monitoring. */
  userId: string | null | undefined;
  /** Called when another device signs in with the same account. */
  onForcedSignOut?: () => void | Promise<void>;
}

/**
 * useSessionMonitor — "Professional Polish" multi-device session detection.
 *
 * How it works:
 * 1. On mount, broadcasts this device's current JWT `jti` (JWT ID) to a
 *    Supabase Realtime Presence channel scoped to the user.
 * 2. Listens for other presence entries with a *different* session_id.
 * 3. When a new device logs in, all existing devices receive a presence
 *    `SYNC` event. If the new session_id differs from ours, we force sign-out.
 *
 * This is purely client-side and requires no extra database tables.
 * The Realtime channel is torn down on unmount (page leave / sign-out).
 */
export function useSessionMonitor({
  userId,
  onForcedSignOut,
}: UseSessionMonitorOptions): void {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const supabase = createClient();

  // Derive a stable session fingerprint for this browser device.
  // We use a persistent device ID in localStorage to ensure multiple tabs 
  // share the same session ID and don't kick each other out, 
  // and to survive token refreshes (which change the JWT `iat`).
  const getSessionId = useCallback(async (): Promise<string> => {
    try {
      let deviceId = localStorage.getItem('obhyash_device_id');
      if (!deviceId) {
        // Generate a random ID for this device
        deviceId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem('obhyash_device_id', deviceId);
      }
      return deviceId;
    } catch {
      // Fallback for private browsing where localStorage might throw
      return Math.random().toString(36).slice(2);
    }
  }, []);

  useEffect(() => {
    // Feature disabled: allow multiple devices simultaneously without kicking users out.
    return;
    /*
    if (!userId) return;

    let mounted = true;

    const startMonitoring = async () => {
      const mySessionId = await getSessionId();
      if (!mounted) return;
      sessionIdRef.current = mySessionId;

      // Create a presence channel scoped to this user
      const channel = supabase.channel(`session:${userId}`, {
        config: { presence: { key: mySessionId } },
      });

      // Track our own presence
      channel.on('presence', { event: 'sync' }, () => {
        if (!mounted || !sessionIdRef.current) return;

        const presenceState = channel.presenceState();

        // Collect all session IDs from other devices
        const otherSessions = Object.keys(presenceState).filter(
          (id) => id !== sessionIdRef.current,
        );

        if (otherSessions.length > 0) {
          // Another device with a different session is present
          // Give a small debounce — they may be leaving, not joining
          setTimeout(async () => {
            if (!mounted) return;

            // Re-check: still other sessions?
            const currentState = channel.presenceState();
            const stillOthers = Object.keys(currentState).filter(
              (id) => id !== sessionIdRef.current,
            );

            if (stillOthers.length > 0) {
              toast.error('অন্য ডিভাইসে লগইন হয়েছে। সেশন বন্ধ হচ্ছে...', {
                duration: 4000,
                id: 'forced-signout',
              });

              // Small delay so the toast is visible before redirect
              await new Promise((r) => setTimeout(r, 1500));

              if (onForcedSignOut) {
                await onForcedSignOut();
              } else {
                await supabase.auth.signOut();
              }
            }
          }, 2000); // 2 s debounce
        }
      });

      const subscribeWithRetry = async (attempt = 0) => {
        if (!mounted) return;

        const status = await channel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED' && mounted) {
            // Broadcast our presence
            await channel.track({ session_id: mySessionId });
          } else if (status === 'CHANNEL_ERROR' || status === 'CLOSED') {
            if (mounted && attempt < 5) {
              const delay = Math.pow(2, attempt) * 1000;
              if (process.env.NODE_ENV === 'development') {
                console.warn(
                  `[Realtime] Subscription failed (${status}), retrying in ${delay}ms...`,
                );
              }
              setTimeout(() => subscribeWithRetry(attempt + 1), delay);
            }
          }
        });
      };

      await subscribeWithRetry();
      channelRef.current = channel;
    };

    startMonitoring();

    return () => {
      mounted = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
