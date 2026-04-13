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
import { unregisterCurrentDevice } from '@/services/device-session-service';

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

  // Guards for health-check: prevent concurrent calls and debounce rapid events.
  const isHealthCheckingRef = useRef(false);
  const lastHealthCheckRef = useRef(0);
  const healthCheckDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

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
          // Fall back to the cached profile if it belongs to the same user.
          // This prevents the admin layout from returning null (blank screen)
          // on a transient DB failure or Supabase cold-start slow query.
          const cached = readCachedProfile();
          return cached?.id === userId ? cached : null;
        }
        if (!data) return null;

        const userProfile = mapDbRowToProfile(data);
        writeCachedProfile(userProfile);
        return userProfile;
      } catch (error) {
        console.error('Unexpected error fetching profile:', error);
        const cached = readCachedProfile();
        return cached?.id === userId ? cached : null;
      }
    },
    [supabase],
  );

  // ── initializeAuth (runs once on mount) ───────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    // Used by the INITIAL_SESSION handler to decide whether to recover.
    let userSetByInit = false;
    // Set to true when getSession() returns null and we are waiting for
    // INITIAL_SESSION to provide the real session. The finally block must
    // NOT call setLoading(false) in this case — doing so triggers the
    // ClientLayout redirect (!user → /login) BEFORE INITIAL_SESSION fires,
    // then the middleware bounces the admin back → infinite reload loop.
    let waitingForInitialSession = false;

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
          // The Supabase JS client cache is empty, but this does NOT mean there is no session
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
          // CRITICAL: mark this flag so the finally block below does NOT call setLoading(false).
          // Without this, finally runs (return inside try still triggers finally in JS),
          // setLoading(false) fires with user=null, ClientLayout redirects to /login,
          // middleware bounces the admin back to /admin/dashboard → infinite reload loop.
          waitingForInitialSession = true;
          return; // Exit early — INITIAL_SESSION takes over from here.
        }
      } catch (error) {
        console.error('Auth initialization sequence failed:', error);
      } finally {
        // Skip if we are waiting for INITIAL_SESSION to provide the real session.
        // In that case INITIAL_SESSION handler is solely responsible for setLoading(false).
        if (isMounted && !initDoneRef.current && !waitingForInitialSession) {
          setLoading(false);
          initDoneRef.current = true;
        }
      }
    };

    initializeAuth();

    // Safety net: if waitingForInitialSession=true but INITIAL_SESSION never fires
    // (e.g. Supabase Realtime is blocked), unblock loading after 8 seconds so the
    // admin isn't stuck on a spinner forever. The redirect logic will then handle
    // the unauthenticated state correctly.
    const initialSessionTimeout = setTimeout(() => {
      if (isMounted && !initDoneRef.current) {
        console.warn(
          '[Auth] INITIAL_SESSION never fired — unblocking loading as fallback',
        );
        setLoading(false);
        initDoneRef.current = true;
      }
    }, 8000);

    // ── Resiliency Listeners (Network & Focus) ───────────────────────────────
    const handleHealthCheck = async () => {
      if (!isMounted || !initDoneRef.current) return;

      // If we are offline, don't ping (it will just fail and trigger errors)
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      // Guard: skip if a check is already in-flight
      if (isHealthCheckingRef.current) return;

      // Guard: skip if we checked less than 30 seconds ago
      const now = Date.now();
      if (now - lastHealthCheckRef.current < 30_000) return;

      isHealthCheckingRef.current = true;
      lastHealthCheckRef.current = now;

      try {
        // IMPORTANT: Use getSession() here, NOT getUser().
        // getUser() acquires the Supabase JS client's internal auth lock and makes
        // a server round-trip. While the lock is held (1-3 seconds), ALL .from().select()
        // queries queue up and appear to hang — this was causing the admin panel to stop
        // fetching data after a focus/tab-switch event.
        // getSession() reads from the local JS cache (lock-free, synchronous).
        // The middleware (proxy.ts) already validates the JWT server-side on every request,
        // so we can trust the local session here for client-side health checks.
        const { data, error } = await supabase.auth.getSession();
        if (error && isHardAuthError(error)) {
          console.warn('[Auth] Health check failed - session may be corrupted');
          setShowCorruptionModal(true);
        } else if (data.session?.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth] Health check: OK');
          }
          setUser(data.session.user);
        }
      } catch {
        // Soft failure, ignore
      } finally {
        isHealthCheckingRef.current = false;
      }
    };

    // Debounced wrapper — prevents multiple rapid focus/visibility events from
    // firing concurrent health checks (the old code had a comment about debounce
    // but never actually implemented one).
    const scheduleHealthCheck = (delayMs = 500) => {
      if (healthCheckDebounceRef.current) {
        clearTimeout(healthCheckDebounceRef.current);
      }
      healthCheckDebounceRef.current = setTimeout(handleHealthCheck, delayMs);
    };

    const onOnline = () => {
      if (process.env.NODE_ENV === 'development')
        console.log('[Auth] Back online - checking session');
      scheduleHealthCheck(1000);
    };

    const onFocus = () => {
      scheduleHealthCheck(500);
    };

    // Store as a named function so it can be properly removed on cleanup
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') scheduleHealthCheck(500);
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
            // Token silently refreshed — revalidate ALL SWR caches so dashboard
            // data re-fetches with the fresh token. Without this, queries made
            // just before the refresh window may return stale/empty results.
            mutate(() => true, undefined, { revalidate: true });
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
      clearTimeout(initialSessionTimeout);
      if (healthCheckDebounceRef.current) {
        clearTimeout(healthCheckDebounceRef.current);
      }
    };
  }, [supabase, router, fetchProfile]);

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    // Unregister this device BEFORE revoking the session (RLS requires active session)
    if (user) {
      await unregisterCurrentDevice(user.id).catch(() => {});
    }
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
  }, [supabase, router, user]);

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
              নিরবচ্ছিন্ন অভিজ্ঞতার জন্য দয়া করে আবার লগইন করো।
            </p>
            <button
              onClick={handleForceLogout}
              className="w-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all text-sm mb-3"
            >
              আবার লগইন করো
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}
