"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/types";
import { mutate } from "swr";
import { mapDbRowToProfile } from "@/services/user-service";
import { unregisterCurrentDevice } from "@/services/device-session-service";

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

const PROFILE_KEY = "obhyash_user_profile";

function readCachedProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
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
  if (!error || typeof error !== "object") return false;
  const err = error as { name?: string; status?: number; code?: string };
  if (err.name === "AuthApiError") {
    // Some API errors are just rate limits or network issues.
    // Only fail if it's explicitly about invalid/expired credentials.
    if (err.status === 400 || err.status === 403) return true;
  }
  if (err.status === 401) return true;
  if (
    err.code === "invalid_jwt" ||
    err.code === "token_expired" ||
    err.code === "session_not_found"
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
  if (!error || typeof error !== "object") return false;
  const err = error as { name?: string; message?: string };
  if (err.name === "AuthSessionMissingError") return true;
  if (err.message?.toLowerCase().includes("auth session missing")) return true;
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
    async (userId: string, retryCount = 0): Promise<UserProfile | null> => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
          // Automatic retry with exponential backoff (max 3 attempts)
          if (retryCount < 3) {
            const delayMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            return fetchProfile(userId, retryCount + 1);
          }
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
        console.error("Unexpected error fetching profile:", error);
        // Automatic retry on network errors
        if (retryCount < 3) {
          const delayMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          return fetchProfile(userId, retryCount + 1);
        }
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
              "Soft auth check failure (network?):",
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
          }
          // setLoading(false) will be called in the finally block below.
        } else {
          // getSession() returned null with NO error.
          if (isMounted) {
            userSetByInit = false;
          }
          waitingForInitialSession = true;
          return; // Exit early — INITIAL_SESSION takes over from here.
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error("Auth initialization sequence failed:", error);
        }
      } finally {
        if (isMounted && !initDoneRef.current && !waitingForInitialSession) {
          setLoading(false);
          initDoneRef.current = true;
        }
      }
    };

    initializeAuth();

    const initialSessionTimeout = setTimeout(() => {
      if (isMounted && !initDoneRef.current) {
        console.warn(
          "[Auth] INITIAL_SESSION taking too long — using cached profile",
        );
        setLoading(false);
        initDoneRef.current = true;
      }
    }, 5000);

    // ── Resiliency Listeners (Network & Focus) ───────────────────────────────
    let lastProfileFetchTime = Date.now();

    const handleHealthCheck = async () => {
      if (!isMounted || !initDoneRef.current) return;
      if (typeof navigator !== "undefined" && !navigator.onLine) return;
      if (isHealthCheckingRef.current) return;

      const now = Date.now();
      if (now - lastHealthCheckRef.current < 60_000) return;

      isHealthCheckingRef.current = true;
      lastHealthCheckRef.current = now;

      try {
        const { data, error } = await supabase.auth.getSession();
        if (error && isHardAuthError(error)) {
          console.warn("[Auth] Health check failed - session may be corrupted");
          setShowCorruptionModal(true);
        } else if (data.session?.user) {
          setUser(data.session.user);
        }
      } catch {
        // Soft failure, ignore
      } finally {
        isHealthCheckingRef.current = false;
      }
    };

    const scheduleHealthCheck = (delayMs = 1000) => {
      if (healthCheckDebounceRef.current) {
        clearTimeout(healthCheckDebounceRef.current);
      }
      healthCheckDebounceRef.current = setTimeout(handleHealthCheck, delayMs);
    };

    const onOnline = () => {
      scheduleHealthCheck(1000);
      if (user?.id && Date.now() - lastProfileFetchTime > 60_000) {
        lastProfileFetchTime = Date.now();
        fetchProfile(user.id, 0).catch(() => {});
      }
    };

    const onFocus = () => {
      scheduleHealthCheck(1000);
      if (user?.id && Date.now() - lastProfileFetchTime > 120_000) {
        lastProfileFetchTime = Date.now();
        fetchProfile(user.id, 0).catch(() => {});
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleHealthCheck(1000);
        if (user?.id && Date.now() - lastProfileFetchTime > 120_000) {
          lastProfileFetchTime = Date.now();
          fetchProfile(user.id, 0).catch(() => {});
        }
      }
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("focus", onFocus);
    window.addEventListener("visibilitychange", onVisibilityChange);

    // ── Heartbeat (Every 10 minutes) ─────────────────────────────────────────
    const heartbeat = setInterval(handleHealthCheck, 10 * 60 * 1000);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        if (session?.user) {
          if (isMounted) setUser(session.user);

          if (event === "SIGNED_IN") {
            const fresh = await fetchProfile(session.user.id);
            if (fresh && isMounted) setProfile(fresh);
          } else if (event === "TOKEN_REFRESHED") {
            const fresh = await fetchProfile(session.user.id);
            if (fresh && isMounted) setProfile(fresh);
          } else if (event === "INITIAL_SESSION") {
            if (!initDoneRef.current || !userSetByInit) {
              if (isMounted) setUser(session.user);

              if (isMounted && !initDoneRef.current) {
                setLoading(false);
                initDoneRef.current = true;
              }

              fetchProfile(session.user.id).then((fresh) => {
                if (fresh && isMounted) setProfile(fresh);
              });
            }
          }
        } else if (event === "INITIAL_SESSION") {
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
        } else if (event === "SIGNED_OUT") {
          const { data: currentSessionData } =
            await supabase.auth.getSession();
          if (!currentSessionData?.session) {
            // The local session is truly gone — real logout.
            if (isMounted) {
              setUser(null);
              setProfile(null);
            }
            clearCachedProfile();
            if (typeof window !== "undefined") {
              const currentPath = window.location.pathname;
              if (
                currentPath.startsWith("/admin") ||
                currentPath.startsWith("/teacher") ||
                currentPath.startsWith("/dashboard") ||
                currentPath.startsWith("/setup") ||
                currentPath.startsWith("/history") ||
                currentPath.startsWith("/practice") ||
                currentPath.startsWith("/leaderboard") ||
                currentPath.startsWith("/analysis") ||
                currentPath.startsWith("/profile") ||
                currentPath.startsWith("/settings")
              ) {
                window.location.href = "/login?logout=true";
              }
            }
          }
          // else: session still valid (e.g. another device logged out) — stay logged in.
        }
      },
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener("online", onOnline);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(heartbeat);
      clearTimeout(initialSessionTimeout);
      if (healthCheckDebounceRef.current) {
        clearTimeout(healthCheckDebounceRef.current);
      }
    };
  }, [supabase, router, fetchProfile]);

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    const userId = user?.id;

    // Instant UI feedback
    setUser(null);
    setProfile(null);
    clearCachedProfile();

    try {
      if (typeof window !== "undefined") {
        try {
          Object.keys(localStorage).forEach((key) => {
            if (
              key.startsWith("sb-") ||
              key.startsWith("obhyash_") ||
              key.includes("supabase") ||
              key.includes("auth") ||
              key.includes("profile")
            ) {
              localStorage.removeItem(key);
            }
          });
          sessionStorage.clear();
        } catch (e) {}

        document.cookie = "obhyash_role_cache=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }

      if (userId) {
        await unregisterCurrentDevice(userId).catch(() => {});
      }

      // Server-side signout to clear auth cookies
      await fetch("/api/auth/signout", { method: "POST" }).catch(() => {});

      // Client-side Supabase signout
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
      }
    } catch (err) {
      console.error("Signout error in AuthProvider:", err);
    } finally {
      window.location.replace("/login?logout=true");
    }
  }, [supabase, user]);

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
              তোমার লগইন সেশনটি মেয়াদোত্তীর্ণ বা ত্রুটিপূর্ণ হয়েছে।
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
