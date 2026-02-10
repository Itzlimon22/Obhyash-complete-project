'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      const userProfile = data as UserProfile;
      // Cache profile
      localStorage.setItem('obhyash_user_profile', JSON.stringify(userProfile));
      return userProfile;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // 1. Try to load from cache first for immediate UI
      try {
        const cachedProfile = localStorage.getItem('obhyash_user_profile');
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          if (isMounted) {
            setProfile(parsed);
            // We don't set user here because we need the Supabase User object
            // But having profile allows UI to show something
          }
        }
      } catch (e) {
        console.error('Cache parse error', e);
      }

      try {
        // 2. Get current user (server-validated)
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error('Auth check error:', authError);
          // If auth fails, clear cache
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
          localStorage.removeItem('obhyash_user_profile');
        }

        if (currentUser && isMounted) {
          setUser(currentUser);
          // 3. Fetch Profile (Background validation/update)
          const userProfile = await fetchProfile(currentUser.id);
          if (userProfile && isMounted) {
            setProfile(userProfile);
          }
        } else if (!currentUser && isMounted) {
          // No user, clear everything
          setUser(null);
          setProfile(null);
          localStorage.removeItem('obhyash_user_profile');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // 4. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (isMounted) setUser(session.user);

        // Always ensure profile is loaded if user exists
        const shouldFetchProfile =
          !profile ||
          profile.id !== session.user.id ||
          event === 'USER_UPDATED' ||
          event === 'TOKEN_REFRESHED';

        if (shouldFetchProfile) {
          const userProfile = await fetchProfile(session.user.id);
          if (userProfile && isMounted) {
            setProfile(userProfile);
          }
        }
      } else {
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
        localStorage.removeItem('obhyash_user_profile');

        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }

      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('obhyash_user_profile');
    router.push('/login');
  };

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchProfile(user.id);
      if (userProfile) setProfile(userProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}
