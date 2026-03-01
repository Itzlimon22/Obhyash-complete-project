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

  // Derive a stable session fingerprint from the current JWT.
  // We use the `jti` claim when available, falling back to a random ID
  // generated once per page load — still good enough to distinguish devices.
  const getSessionId = useCallback(async (): Promise<string> => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        // Base64-decode the JWT payload (middle section)
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.jti) return payload.jti as string;
        // Fallback: use iat + sub as a fingerprint
        if (payload.iat && payload.sub) return `${payload.sub}:${payload.iat}`;
      }
    } catch {
      // Non-fatal — continue with random fallback
    }
    // Random fallback (persists for this page session only)
    return Math.random().toString(36).slice(2);
  }, [supabase]);

  useEffect(() => {
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

      await channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED' && mounted) {
          // Broadcast our presence
          await channel.track({ session_id: mySessionId });
        }
      });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
}
