'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { useAuth } from '@/components/auth/AuthProvider';

export interface AdminProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | string;
  avatar_url?: string;
}

const ADMIN_CACHE_KEY = 'obhyash_admin_cached_profile';
const USER_CACHE_KEY = 'obhyash_user_profile';

function getCachedAdminProfile(): AdminProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    // 1. Check dedicated admin cache
    const adminRaw = localStorage.getItem(ADMIN_CACHE_KEY);
    if (adminRaw) {
      const parsed = JSON.parse(adminRaw);
      if (parsed?.id && parsed?.role?.toLowerCase() === 'admin') {
        return parsed;
      }
    }
    // 2. Check general user cache (written by AuthProvider)
    const userRaw = localStorage.getItem(USER_CACHE_KEY);
    if (userRaw) {
      const parsed = JSON.parse(userRaw);
      if (parsed?.id && parsed?.role?.toLowerCase() === 'admin') {
        return {
          id: parsed.id,
          name: parsed.name || 'Super Admin',
          email: parsed.email || 'admin@obhyash.com',
          role: 'admin',
          avatar_url: parsed.avatar_url,
        };
      }
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
  const { user: authUser, profile: authProfile, loading: authLoading, signOut: authSignOut } = useAuth();

  const [user, setUser] = useState<User | null>(() => authUser || null);
  const [profile, setProfile] = useState<AdminProfile | null>(() => {
    if (authProfile && authProfile.role?.toLowerCase() === 'admin') {
      return {
        id: authProfile.id,
        name: authProfile.name || 'Super Admin',
        email: authProfile.email || 'admin@obhyash.com',
        role: 'admin',
        avatar_url: authProfile.avatarUrl || (authProfile as any).avatar_url,
      };
    }
    return getCachedAdminProfile();
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If cached admin profile exists or AuthProvider has admin profile, start ready!
    const cached = getCachedAdminProfile();
    if (cached) return false;
    if (authProfile && authProfile.role?.toLowerCase() === 'admin') return false;
    return true;
  });

  const [isAuthorized, setIsAuthorized] = useState<boolean>(() => {
    const cached = getCachedAdminProfile();
    if (cached) return true;
    if (authProfile && authProfile.role?.toLowerCase() === 'admin') return true;
    return false;
  });

  const [authError, setAuthError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const verifyRunningRef = useRef(false);

  const signOut = useCallback(async () => {
    try {
      setCachedAdminProfile(null);
      if (authSignOut) {
        await authSignOut();
      } else {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } finally {
      window.location.href = '/login';
    }
  }, [authSignOut]);

  // Sync with main AuthProvider when available
  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
    if (authProfile) {
      const role = (authProfile.role || '').toLowerCase();
      if (role === 'admin') {
        const adminData: AdminProfile = {
          id: authProfile.id,
          name: authProfile.name || authUser?.email?.split('@')[0] || 'Super Admin',
          email: authProfile.email || authUser?.email || 'admin@obhyash.com',
          role: 'admin',
          avatar_url: authProfile.avatarUrl || (authProfile as any).avatar_url,
        };
        setProfile(adminData);
        setCachedAdminProfile(adminData);
        setIsAuthorized(true);
        setAuthError(null);
        setIsLoading(false);
      } else if (!authLoading) {
        setIsAuthorized(false);
        setAuthError('Access Denied: Administrator privileges required.');
        setIsLoading(false);
      }
    } else if (!authLoading && !authUser) {
      const cached = getCachedAdminProfile();
      if (!cached) {
        setIsAuthorized(false);
        setIsLoading(false);
      }
    }
  }, [authUser, authProfile, authLoading]);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = createClient();

    const verifyAdmin = async () => {
      if (verifyRunningRef.current) return;
      verifyRunningRef.current = true;

      try {
        const { data: { session }, error: sessionErr } = await supabase.auth.getSession();

        if (sessionErr || !session?.user) {
          const cached = getCachedAdminProfile();
          if (!cached && mountedRef.current) {
            setUser(null);
            setProfile(null);
            setIsAuthorized(false);
          }
          return;
        }

        const currentUser = session.user;
        if (mountedRef.current) {
          setUser(currentUser);
        }

        const metaRole = (
          currentUser.app_metadata?.role ||
          currentUser.user_metadata?.role ||
          ''
        ).toLowerCase();

        // Direct DB verification
        const { data: dbUser } = await supabase
          .from('users')
          .select('id, name, email, role, avatar_url')
          .eq('id', currentUser.id)
          .maybeSingle();

        if (!mountedRef.current) return;

        const effectiveRole = (dbUser?.role || metaRole || '').toLowerCase();

        if (effectiveRole === 'admin') {
          const adminData: AdminProfile = {
            id: currentUser.id,
            name: dbUser?.name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Super Admin',
            email: dbUser?.email || currentUser.email || 'admin@obhyash.com',
            role: 'admin',
            avatar_url: dbUser?.avatar_url,
          };
          setProfile(adminData);
          setCachedAdminProfile(adminData);
          setIsAuthorized(true);
          setAuthError(null);
        } else if (dbUser && effectiveRole !== 'admin') {
          setCachedAdminProfile(null);
          setIsAuthorized(false);
          setAuthError('Access Denied: Administrator privileges required.');
        } else {
          // Fallback to cached profile if matching current user
          const cached = getCachedAdminProfile();
          if (cached && cached.id === currentUser.id) {
            setIsAuthorized(true);
          } else if (metaRole === 'admin') {
            setIsAuthorized(true);
          }
        }
      } catch (err) {
        console.warn('[useAdminAuth] Verification soft error:', err);
        const cached = getCachedAdminProfile();
        if (cached) {
          setIsAuthorized(true);
        }
      } finally {
        verifyRunningRef.current = false;
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    verifyAdmin();

    // Safety timer: ensure loading state never hangs
    const safetyTimer = setTimeout(() => {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }, 3500);

    // Listen for auth state changes including INITIAL_SESSION
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
      } else if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user && mountedRef.current) {
          setUser(session.user);
          verifyAdmin();
        } else if (event === 'INITIAL_SESSION' && !session?.user) {
          const cached = getCachedAdminProfile();
          if (!cached && mountedRef.current) {
            setIsAuthorized(false);
            setIsLoading(false);
          }
        }
      }
    });

    return () => {
      mountedRef.current = false;
      clearTimeout(safetyTimer);
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
