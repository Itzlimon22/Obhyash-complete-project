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
  const pathname = usePathname();
  const supabase = createClient();

  // Optimistic UI: Initial load from localStorage
  useEffect(() => {
    const cachedProfileStr = localStorage.getItem('obhyash_user_profile');
    if (cachedProfileStr) {
      try {
        const cachedProfile = JSON.parse(cachedProfileStr) as UserProfile;
        if (cachedProfile && cachedProfile.id) {
          setProfile(cachedProfile);
        }
      } catch (e) {
        console.error('Initial cache parse error', e);
      }
    }
  }, []);

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

      const userProfile = mapDbRowToProfile(data);
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
      try {
        // Use getSession first for faster persistence check, then getUser for security
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session retrieval error:', sessionError);
        }

        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          if (authError && authError.name !== 'AuthSessionMissingError') {
            console.error('Auth verification error:', authError);
            // If it's a suspicious error (not just missing), it might be corruption
            if (localStorage.getItem('obhyash_user_profile')) {
              setShowCorruptionModal(true);
            }
          } else {
            // Definitively no session
            if (isMounted) {
              setUser(null);
              setProfile(null);
              localStorage.removeItem('obhyash_user_profile');
            }
          }
        } else {
          if (isMounted) setUser(currentUser);

          // Verify if cached profile matches authentication
          const cachedProfileStr = localStorage.getItem('obhyash_user_profile');
          if (cachedProfileStr) {
            try {
              const cachedProfile = JSON.parse(cachedProfileStr) as UserProfile;
              if (cachedProfile && cachedProfile.id !== currentUser.id) {
                console.warn('Identity mismatch - clearing stale cache');
                localStorage.removeItem('obhyash_user_profile');
              }
            } catch (e) {
              localStorage.removeItem('obhyash_user_profile');
            }
          }

          // Background profile refresh
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
  }, [supabase, router, profile?.id]);

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

  const handleForceLogout = async () => {
    setShowCorruptionModal(false);
    await signOut();
  };

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
