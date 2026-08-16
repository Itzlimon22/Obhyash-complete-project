'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | string;
  avatar_url?: string;
}

const ADMIN_CACHE_KEY = 'obhyash_admin_cached_profile';

function getCachedAdminProfile(): AdminProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id && parsed?.role?.toLowerCase() === 'admin') {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function setCachedAdminProfile(profile: AdminProfile | null) {
  if (typeof window === 'undefined') return;
  try {
    if (profile) {
      localStorage.setItem(ADMIN_CACHE_KEY, JSON.stringify(profile));
    } else {
      localStorage.removeItem(ADMIN_CACHE_KEY);
    }
  } catch {
    // quota exceeded or private mode
  }
}

export function useAdminAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(getCachedAdminProfile);
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If cached admin profile exists, we start without blocking loading screen
    return !getCachedAdminProfile();
  });
  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    return !!getCachedAdminProfile();
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const signOut = useCallback(async () => {
    try {
      setCachedAdminProfile(null);
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      window.location.href = '/login';
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = createClient();

    const verifyAdmin = async () => {
      try {
        // Fast local session inspection (zero API lock)
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

        if (sessionErr || !session?.user) {
          if (mountedRef.current) {
            setCachedAdminProfile(null);
            setUser(null);
            setProfile(null);
            setIsAuthorized(false);
            setIsLoading(false);
          }
          return;
        }

        const currentUser = session.user;
        if (mountedRef.current) {
          setUser(currentUser);
        }

        // Direct DB verification
        const { data: dbUser, error: dbErr } = await supabase
          .from('users')
          .select('id, name, email, role, avatar_url')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!mountedRef.current) return;

        if (dbUser) {
          const role = (dbUser.role || '').toLowerCase();
          if (role === 'admin') {
            const adminData: AdminProfile = {
              id: dbUser.id,
              name: dbUser.name || currentUser.email?.split('@')[0] || 'Super Admin',
              email: dbUser.email || currentUser.email || 'admin@obhyash.com',
              role: 'admin',
              avatar_url: dbUser.avatar_url,
            };
            setProfile(adminData);
            setCachedAdminProfile(adminData);
            setIsAuthorized(true);
            setAuthError(null);
          } else {
            // Not an admin role
            setIsAuthorized(false);
            setAuthError('Access Denied: Administrator privileges required.');
          }
        } else {
          // If cached profile exists and matches, keep it
          const cached = getCachedAdminProfile();
          if (cached && cached.id === currentUser.id) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        }
      } catch (err) {
        console.warn('[useAdminAuth] Verification soft error:', err);
        // Do not kick out if cached profile is present
        const cached = getCachedAdminProfile();
        if (cached) {
          setIsAuthorized(true);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    verifyAdmin();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCachedAdminProfile(null);
        if (mountedRef.current) {
          setUser(null);
          setProfile(null);
          setIsAuthorized(false);
          setIsLoading(false);
          router.replace('/login');
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user && mountedRef.current) {
          setUser(session.user);
          verifyAdmin();
        }
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [router]);

  return {
    user,
    profile,
    isLoading,
    isAuthorized,
    authError,
    signOut,
  };
}
