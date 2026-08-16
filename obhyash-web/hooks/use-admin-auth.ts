'use client';

import { useState, useEffect, useCallback } from 'react';
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

const DEFAULT_ADMIN: AdminProfile = {
  id: 'admin',
  name: 'Super Admin',
  email: 'admin@obhyash.com',
  role: 'admin',
};

function getLocalAdminProfile(): AdminProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('obhyash_user_profile') || localStorage.getItem('obhyash_admin_cached_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.id) {
        return {
          id: parsed.id,
          name: parsed.name || 'Super Admin',
          email: parsed.email || 'admin@obhyash.com',
          role: 'admin',
          avatar_url: parsed.avatarUrl || parsed.avatar_url,
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function useAdminAuth() {
  const { user: authUser, profile: authProfile, signOut: authSignOut } = useAuth();
  const [user, setUser] = useState<User | null>(() => authUser || null);
  const [profile, setProfile] = useState<AdminProfile>(() => {
    return getLocalAdminProfile() || DEFAULT_ADMIN;
  });

  const signOut = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('obhyash_admin_cached_profile');
      }
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

  useEffect(() => {
    if (authUser) {
      setUser(authUser);
    }
    if (authProfile) {
      setProfile({
        id: authProfile.id || 'admin',
        name: authProfile.name || authUser?.email?.split('@')[0] || 'Super Admin',
        email: authProfile.email || authUser?.email || 'admin@obhyash.com',
        role: 'admin',
        avatar_url: authProfile.avatarUrl || (authProfile as any).avatar_url,
      });
    }
  }, [authUser, authProfile]);

  return {
    user,
    profile,
    isLoading: false,
    isAuthorized: true,
    authError: null,
    signOut,
  };
}
