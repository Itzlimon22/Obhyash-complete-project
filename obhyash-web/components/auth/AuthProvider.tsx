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
import { mapDbRowToProfile } from '@/services/user-service';

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

      if (!data) return null;

      // Use centralized mapping logic
      const userProfile = mapDbRowToProfile(data);

      // Cache the correctly-mapped profile in local storage
      localStorage.setItem('obhyash_user_profile', JSON.stringify(userProfile));
      return userProfile;
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      toast.error('Failed to load user profile. Please refresh.');
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // START of initializeAuth
    const initializeAuth = async () => {
      // Safety Timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        if (isMounted && loading) {
          console.warn('⚠️ Auth check timed out - Forcing load completion');
          setLoading(false);
        }
      }, 5000); // 5 seconds max wait

      try {
        // 1. Get current user (server-validated via Cookie)
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          // AuthSessionMissingError is expected when no user is logged in — don't spam console
          if (authError && authError.name !== 'AuthSessionMissingError') {
            console.error('Auth check error:', authError);
          }
          // No valid session, clear everything immediately
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
          localStorage.removeItem('obhyash_user_profile');
        } else {
          // Valid Session exists
          if (isMounted) setUser(currentUser);

          // 2. Try to load cached profile FOR THIS USER
          const cachedProfileStr = localStorage.getItem('obhyash_user_profile');
          let hasCachedProfile = false;

          if (cachedProfileStr) {
            try {
              const cachedProfile = JSON.parse(cachedProfileStr) as UserProfile;
              // START FIX: Ensure cached profile matches current user AND has valid data
              if (
                cachedProfile &&
                cachedProfile.id === currentUser.id &&
                cachedProfile.role
              ) {
                if (isMounted) {
                  setProfile(cachedProfile);
                  // ✅ OPTIMISTIC UI: We have a valid user and profile, stop loading immediately
                  setLoading(false);
                }
                hasCachedProfile = true;
              } else {
                // Invalid cache (wrong user or malformed), clear it
                console.warn('Clearing invalid/stale profile cache');
                localStorage.removeItem('obhyash_user_profile');
              }
              // END FIX
            } catch (e) {
              console.error('Cache parse error', e);
              localStorage.removeItem('obhyash_user_profile');
            }
          }

          // 3. Fetch/Update Profile (Background validation)
          // Even if we loaded from cache, we fetch fresh data to update transparently
          const userProfile = await fetchProfile(currentUser.id);
          if (userProfile && isMounted) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        // Prepare to stop loading if not already stopped by cache hit
        if (isMounted) setLoading(false);
        clearTimeout(timeoutId); // Clear timeout if successful
      }
    };

    initializeAuth();

    // 4. Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (isMounted) setUser(session.user);

        // Fetch profile if missing or user changed or token refreshed
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
        // Signed out or session expired
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
        localStorage.removeItem('obhyash_user_profile');

        if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    });

    // 5. Realtime Subscription for Profile Updates
    const profileSubscription = supabase
      .channel(`public:users:id=eq.${user?.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('🔄 Realtime Profile Update Detected:', payload);
          if (payload.new) {
            const updatedProfile = mapDbRowToProfile(
              payload.new,
              user?.email,
              user?.phone,
              user?.created_at,
            );
            setProfile(updatedProfile);
            localStorage.setItem(
              'obhyash_user_profile',
              JSON.stringify(updatedProfile),
            );
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(profileSubscription);
    };
  }, [supabase, router, user?.id]);

  // Keep‑alive ping to maintain Supabase session
  useEffect(() => {
    if (!supabase) return;
    const interval = setInterval(
      () => {
        fetch('/api/ping', { method: 'GET', credentials: 'include' }).catch(
          () => {},
        );
      },
      5 * 60 * 1000,
    ); // every 5 minutes
    return () => clearInterval(interval);
  }, [supabase]);
  // Sign out function
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('obhyash_user_profile');
    router.push('/login');
  };

  // Refresh profile function
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
