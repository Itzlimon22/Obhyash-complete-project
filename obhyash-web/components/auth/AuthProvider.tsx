'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const PROFILE_KEY = 'obhyash_user_profile';

function readCachedProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserProfile;
    return parsed?.id ? parsed : null;
  } catch {
    localStorage.removeItem(PROFILE_KEY);
    return null;
  }
}

function writeCachedProfile(profile: UserProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // storage quota exceeded — non-fatal
  }
}

function clearCachedProfile() {
  try {
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Returns true only for hard auth failures (invalid/expired JWT).
 * Generic network errors (offline, Supabase cold-start) return false
 * to prevent false "session corruption" modals.
 */
function isHardAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; status?: number; code?: string };
  if (err.name === 'AuthApiError') return true;
  if (err.status === 401) return true;
  if (err.code === 'invalid_jwt' || err.code === 'token_expired') return true;
  return false;
}

// ─── Provider ───────────────────────────────────────────────────────────────

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(
    // Serve cached profile instantly — eliminates skeleton flash on refresh
    () => readCachedProfile(),
  );
  const [loading, setLoading] = useState(true);
  const [showCorruptionModal, setShowCorruptionModal] = useState(false);

  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  // Prevent double-fetch when onAuthStateChange fires INITIAL_SESSION
  // right after initializeAuth has already loaded the profile.
  const initDoneRef = useRef(false);

  // ── fetchProfile ──────────────────────────────────────────────────────────
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
        writeCachedProfile(userProfile);
        return userProfile;
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        return null;
      }
    },
    [supabase],
  );

  // ── initializeAuth (runs once on mount) ───────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // getUser() validates the JWT against the Supabase server.
        // Unlike getSession(), it never returns stale data.
        // Wrapped in a timeout to prevent infinite loading if Supabase is unreachable.
        const authResult = await Promise.race([
          supabase.auth.getUser(),
          new Promise<{ data: { user: null }; error: Error }>((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: null },
                  error: new Error('Auth timeout'),
                }),
              10000,
            ),
          ),
        ]);
        const {
          data: { user: currentUser },
          error: authError,
        } = authResult as Awaited<ReturnType<typeof supabase.auth.getUser>>;

        if (authError || !currentUser) {
          if (authError && isHardAuthError(authError)) {
            // Real auth failure (invalid/expired token) — check if we have
            // a stale profile in cache and show the re-login modal.
            if (readCachedProfile()) {
              if (isMounted) setShowCorruptionModal(true);
            } else {
              if (isMounted) {
                setUser(null);
                setProfile(null);
              }
            }
          } else if (authError) {
            // Soft failure (network glitch, Supabase cold-start) — don't
            // destroy the session. The cached profile already shows in UI.
            console.warn(
              'Soft auth check failure (network?):',
              authError.message,
            );
          } else {
            // No user at all — clean state
            if (isMounted) {
              setUser(null);
              setProfile(null);
              clearCachedProfile();
            }
          }
        } else {
          // ✅ Valid user confirmed by server
          if (isMounted) setUser(currentUser);

          // Validate cached profile belongs to this user
          const cached = readCachedProfile();
          if (cached && cached.id === currentUser.id) {
            if (isMounted) setProfile(cached);
          } else {
            clearCachedProfile();
          }

          // Fetch fresh profile from DB (updates cache automatically)
          const fresh = await fetchProfile(currentUser.id);
          if (fresh && isMounted) setProfile(fresh);
        }
      } catch (error) {
        console.error('Auth initialization sequence failed:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
          initDoneRef.current = true;
        }
      }
    };

    initializeAuth();

    // ── onAuthStateChange — handles token refresh & sign-in/out events ──────
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth] event:', event);
        }

        if (session?.user) {
          if (isMounted) setUser(session.user);

          if (event === 'SIGNED_IN') {
            // Fresh login — invalidate all SWR caches and load profile
            mutate(() => true, undefined, { revalidate: true });
            const fresh = await fetchProfile(session.user.id);
            if (fresh && isMounted) setProfile(fresh);
          } else if (event === 'TOKEN_REFRESHED') {
            // Silently refresh profile in background
            const fresh = await fetchProfile(session.user.id);
            if (fresh && isMounted) setProfile(fresh);
          } else if (event === 'INITIAL_SESSION') {
            // Only fetch profile if initializeAuth hasn't already done it
            if (!initDoneRef.current) {
              mutate(() => true, undefined, { revalidate: true });
              const fresh = await fetchProfile(session.user.id);
              if (fresh && isMounted) setProfile(fresh);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            setProfile(null);
          }
          clearCachedProfile();
          router.push('/login');
        }
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, fetchProfile]);

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    clearCachedProfile();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      // Fallback manual cleanup if the event doesn't fire
      setUser(null);
      setProfile(null);
      router.push('/login');
    }
    // If signOut succeeds, the SIGNED_OUT event handler above handles redirect
  }, [supabase, router]);

  // ── refreshProfile ────────────────────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const fresh = await fetchProfile(user.id);
    if (fresh) setProfile(fresh);
  }, [user, fetchProfile]);

  // ── handleForceLogout ─────────────────────────────────────────────────────
  const handleForceLogout = useCallback(async () => {
    setShowCorruptionModal(false);
    await signOut();
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signOut, refreshProfile }}
    >
      {children}

      {/* Re-login modal — only shows for genuine invalid-JWT errors */}
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
              আপনার লগইন সেশনটি মেয়াদোত্তীর্ণ বা ত্রুটিপূর্ণ হয়েছে।
              নিরবচ্ছিন্ন অভিজ্ঞতার জন্য দয়া করে আবার লগইন করুন।
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
