import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Return existing singleton (works on both server and client).
  // createBrowserClient handles the SSR case internally — we do NOT
  // need a separate server-side bypass here.
  if (supabaseInstance) return supabaseInstance;

  supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // Stable key — prevents accidental clearing by other libraries
      // and makes debugging straightforward.
      storageKey: 'obhyash_auth',
    },
  });

  return supabaseInstance;
}
