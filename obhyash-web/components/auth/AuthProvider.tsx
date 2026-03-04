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
  if (err.name === 'AuthApiError') {
    // Some API errors are just rate limits or network issues.
    // Only fail if it's explicitly about invalid/expired credentials.
    if (err.status === 400 || err.status === 403) return true;
  }
  if (err.status === 401) return true;
  if (
    err.code === 'invalid_jwt' ||
    err.code === 'token_expired' ||
    err.code === 'session_not_found'
  )
    return true;
  return false;
}

/**
 * Returns true when there is simply no stored session (clean logged-out state).
 * Supabase raises AuthSessionMissingError for this — it is NOT a network error
 * and should not produce any console warning.
 */
function isNoSessionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; message?: string };
  if (err.name === 'AuthSessionMissingError') return true;
  if (err.message?.toLowerCase().includes('auth session missing')) return true;
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
    // Used by the INITIAL_SESSION handler to decide whether to recover.
    let userSetByInit = false;

    const initializeAuth = async () => {
      try {
        // WHY getSession() instead of getUser()?
        // getUser() makes a round-trip to Supabase servers on every app load.
        // This acquires an internal auth lock in the JS client, which can cause
        // subsequent .from().select() queries to queue and appear to hang.
        // getSession() reads from the local JS client cache synchronously — fast and lock-free.
        // Security note: proxy.ts (middleware) already calls getUser() server-side on every
        // request to validate the JWT and refresh the cookie. So the client can trust the session.
        const {
          data: { session },
          error: authError,
        } = await supabase.auth.getSession();

        const currentUser = session?.user ?? null;

        if (authError) {
          if (isNoSessionError(authError)) {
            // Clean logged-out state — no session stored at all. Safe to clear.
            if (isMounted) {
              setUser(null);
              setProfile(null);
              clearCachedProfile();
              setLoading(false);
            }
          } else if (isHardAuthError(authError)) {
            // Invalid/expired token — show re-login modal if we have a cached profile.
            if (isMounted) {
              if (readCachedProfile()) {
                setShowCorruptionModal(true);
              } else {
                setUser(null);
                setProfile(null);
              }
              setLoading(false);
            }
          } else {
            // Soft failure (network glitch) — keep cached state, let INITIAL_SESSION recover.
            console.warn(
              'Soft auth check failure (network?):',
              authError.message,
            );
            // Do NOT call setLoading(false) here — INITIAL_SESSION will handle it.
          }
        } else if (currentUser) {
          // ✅ Valid user found in the local JS client cache.
          userSetByInit = true;
          if (isMounted) setUser(currentUser);

          // Serve cached profile instantly to avoid layout flash.
          const cached = readCachedProfile();
          if (cached && cached.id === currentUser.id) {
            if (isMounted) setProfile(cached);
          } else {
            clearCachedProfile();
          }

          // Fetch fresh profile from DB in background.
          const fresh = await fetchProfile(currentUser.id);
          if (fresh && isMounted) {
            setProfile(fresh);
            mutate(() => true, undefined, { revalidate: true });
          }
          // setLoading(false) will be called in the finally block below.
        } else {
          // getSession() returned null with NO error.
          // WHY don't we clear state here?
          // The Supabase JS client cache is empty, but this does NOT mean there is no session.
          // proxy.ts validates the session server-side via cookies, and Supabase fires
          // onAuthStateChange('INITIAL_SESSION') shortly after mount to sync the client cache.
          // If we clear user/profile here, ClientLayout redirects to /login.
          // proxy.ts bounces the admin back to /admin/dashboard → infinite reload loop.
          // Solution: set a flag, leave state alone, and let INITIAL_SESSION handle everything.
          // setLoading(false) will be called by the INITIAL_SESSION handler instead.
          if (isMounted) {
            // Signal to INITIAL_SESSION handler that initializeAuth did NOT find a user,
            // so INITIAL_SESSION must resolve loading state regardless.
            userSetByInit = false;
          }
          // Deliberately do NOT call setLoading(false) here.
          // If INITIAL_SESSION never fires (truly no session), the handler below clears state.
          return; // Exit early — INITIAL_SESSION takes over from here.
        }
      } catch (error) {
        console.error('Auth initialization sequence failed:', error);
      } finally {
        if (isMounted && !initDoneRef.current) {
          setLoading(false);
          initDoneRef.current = true;
        }
      }
    };

    initializeAuth();

    // ── Resiliency Listeners (Network & Focus) ───────────────────────────────
    const handleHealthCheck = async () => {
      if (!isMounted || !initDoneRef.current) return;

      // If we are offline, don't ping (it will just fail and trigger errors)
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      try {
        // getUser() is the authoritative way to verify the session with the server.
        const { data, error } = await supabase.auth.getUser();
        if (error && isHardAuthError(error)) {
          console.warn('[Auth] Health check failed - session may be corrupted');
          setShowCorruptionModal(true);
        } else if (data.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Health check: OK');
          }
          setUser(data.user);
        }
      } catch (err) {
        // Soft failure, ignore
      }
    };

    const onOnline = () => {
      if (process.env.NODE_ENV === 'development')
        console.log('[Auth] Back online - checking session');
      handleHealthCheck();
    };

    const onFocus = () => {
      // Small debounce to avoid multiple pings if user clicks fast
      handleHealthCheck();
    };

    // Store as a named function so it can be properly removed on cleanup
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') handleHealthCheck();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    window.addEventListener('visibilitychange', onVisibilityChange);

    // ── Heartbeat (Every 10 minutes) ─────────────────────────────────────────
    const heartbeat = setInterval(handleHealthCheck, 10 * 60 * 1000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (process.env.NODE_ENV === 'development') {
          console.log(
            '[Auth] event:',
            event,
            '| user:',
            session?.user?.id ?? 'none',
          );
        }

        if (session?.user) {
          if (isMounted) setUser(session.user);

          if (event === 'SIGNED_IN') {
            // Fresh login — invalidate all SWR caches and load profile.
            mutate(() => true, undefined, { revalidate: true });
            const fresh = await fetchProfile(session.user.id);
            if (fresh && isMounted) setProfile(fresh);
          } else if (event === 'TOKEN_REFRESHED') {
            // Silently refresh profile in background.
            const fresh = await fetchProfile(session.user.id);
            if (fresh && isMounted) setProfile(fresh);
          } else if (event === 'INITIAL_SESSION') {
            // This fires when the Supabase JS client syncs the session from the server cookie.
            // It recovers the session when initializeAuth's getSession() found nothing in cache.
            if (!initDoneRef.current || !userSetByInit) {
              if (isMounted) setUser(session.user);
              mutate(() => true, undefined, { revalidate: true });
              const fresh = await fetchProfile(session.user.id);
              if (fresh && isMounted) setProfile(fresh);

              // CRITICAL: always unblock loading here, regardless of whether fetchProfile
              // succeeded. If we only call setLoading(false) inside `if (fresh)`, a failed
              // DB query causes the spinner to hang forever.
              if (isMounted) {
                setLoading(false);
                initDoneRef.current = true;
              }
            }
          }
        } else if (event === 'INITIAL_SESSION') {
          // INITIAL_SESSION fired with NO session — the user is genuinely not logged in.
          // initializeAuth exited early (returned before finally) waiting for this event.
          // We must clear state and unblock loading here or the spinner hangs forever.
          if (isMounted) {
            setUser(null);
            setProfile(null);
            clearCachedProfile();
            setLoading(false);
            initDoneRef.current = true;
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
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(heartbeat);
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
