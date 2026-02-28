'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/lib/types';
import { mutate } from 'swr';
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
  const [showCorruptionModal, setShowCorruptionModal] = useState(false);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Optimistic profile load (for fast UI on refresh/revisit)
  useEffect(() => {
    try {
      const cachedProfileStr = localStorage.getItem('obhyash_user_profile');
      if (!cachedProfileStr) return;

      const cachedProfile = JSON.parse(cachedProfileStr) as UserProfile;
      if (cachedProfile?.id) {
        setProfile(cachedProfile);
      }
    } catch (e) {
      console.error('Initial cache parse error', e);
      localStorage.removeItem('obhyash_user_profile');
    }
  }, []);

  const fetchProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
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

        const userProfile = mapDbRowToProfile(data);
        localStorage.setItem(
          'obhyash_user_profile',
          JSON.stringify(userProfile),
        );
        return userProfile;
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        return null;
      }
    },
    [supabase],
  );

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Secure auth check (server-validated user)
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          if (authError && authError.name !== 'AuthSessionMissingError') {
            console.error('Auth verification error:', authError);

            // Suspicious situation: cache exists but auth invalid
            if (localStorage.getItem('obhyash_user_profile')) {
              setShowCorruptionModal(true);
            }
          } else {
            // No session
            if (isMounted) {
              setUser(null);
              setProfile(null);
            }
            localStorage.removeItem('obhyash_user_profile');
          }
        } else {
          if (isMounted) setUser(currentUser);

          // Ensure cached profile belongs to current user
          const cachedProfileStr = localStorage.getItem('obhyash_user_profile');
          if (cachedProfileStr) {
            try {
              const cachedProfile = JSON.parse(cachedProfileStr) as UserProfile;
              if (cachedProfile?.id && cachedProfile.id !== currentUser.id) {
                console.warn('Identity mismatch - clearing stale cache');
                localStorage.removeItem('obhyash_user_profile');
                if (isMounted) setProfile(null);
              }
            } catch {
              localStorage.removeItem('obhyash_user_profile');
              if (isMounted) setProfile(null);
            }
          }

          // Fresh profile from DB
          const userProfile = await fetchProfile(currentUser.id);
          if (userProfile && isMounted) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error('Auth initialization sequence failed:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        if (isMounted) setUser(session.user);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          // Revalidate all SWR caches after auth changes
          mutate(() => true, undefined, { revalidate: true });
        }

        const userProfile = await fetchProfile(session.user.id);
        if (userProfile && isMounted) {
          setProfile(userProfile);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
        localStorage.removeItem('obhyash_user_profile');
        router.push('/login');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, fetchProfile]);

  const signOut = useCallback(async () => {
    // Listener will handle state reset + redirect on SIGNED_OUT
    localStorage.removeItem('obhyash_user_profile');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      // fallback cleanup if event doesn’t fire due to error
      setUser(null);
      setProfile(null);
      router.push('/login');
    }
  }, [supabase, router]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const userProfile = await fetchProfile(user.id);
    if (userProfile) setProfile(userProfile);
  }, [user, fetchProfile]);

  const handleForceLogout = useCallback(async () => {
    setShowCorruptionModal(false);
    await signOut();
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}

      {/* Corruption / Expiry Confirmation Modal */}
      {showCorruptionModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-neutral-950 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
              সেশন সমস্যা!
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8 leading-relaxed">
              আপনার লগইন সেশনটি মেয়াদোত্তীর্ণ বা ত্রুটিপূর্ণ হয়েছে। নিরবচ্ছিন্ন
              অভিজ্ঞতার জন্য দয়া করে আবার লগইন করুন।
            </p>
            <button
              onClick={handleForceLogout}
              className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all text-sm mb-3"
            >
              আবার লগইন করুন
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
