import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

// Use globalThis to persist the singleton across Next.js hot module reloads in dev.
// This prevents auth state from being reset every time a file changes.
const globalForSupabase = globalThis as typeof globalThis & {
  _supabaseInstance?: SupabaseClient;
};

export function createClient(): SupabaseClient {
  if (globalForSupabase._supabaseInstance) {
    return globalForSupabase._supabaseInstance;
  }

  // createBrowserClient from @supabase/ssr automatically stores the session
  // in cookies (not localStorage). The middleware reads these cookies on every
  // request and silently refreshes the token — keeping users logged in
  // indefinitely without any manual refresh calls needed.
  const instance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  globalForSupabase._supabaseInstance = instance;
  return instance;
}
