'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AUTH_SYSTEM_MODE } from '@/lib/constants/auth-config';

export type AuthMode = 'minimal' | 'classic';

/**
 * Hook to retrieve the current auth system mode from Supabase app_config table.
 * No URL query parameter overrides allowed.
 * Automatically synchronizes in realtime if the admin changes the mode.
 */
export function useAuthSystemMode(): { mode: AuthMode; loading: boolean } {
  const [mode, setMode] = useState<AuthMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('obhyash_auth_system_mode');
        if (cached === 'classic' || cached === 'minimal') return cached;
      } catch (_) {}
    }
    return AUTH_SYSTEM_MODE;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    async function fetchConfigMode() {
      try {
        const { data, error } = await supabase
          .from('app_config')
          .select('auth_system_mode')
          .eq('id', 'global_config')
          .maybeSingle();

        if (!error && data?.auth_system_mode && isMounted) {
          const dbMode = data.auth_system_mode;
          if (dbMode === 'classic' || dbMode === 'minimal') {
            setMode(dbMode);
            try {
              sessionStorage.setItem('obhyash_auth_system_mode', dbMode);
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Error fetching auth_system_mode:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchConfigMode();

    // Realtime listener
    const channel = supabase
      .channel('app_config_auth_system_mode')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_config' },
        (payload: any) => {
          if (payload.new && payload.new.auth_system_mode && isMounted) {
            const dbMode = payload.new.auth_system_mode;
            if (dbMode === 'classic' || dbMode === 'minimal') {
              setMode(dbMode);
              try {
                sessionStorage.setItem('obhyash_auth_system_mode', dbMode);
              } catch (_) {}
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { mode, loading };
}
