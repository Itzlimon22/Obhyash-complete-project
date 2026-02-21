import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Server-side Supabase client for API routes and Server Components.
 * Uses cookies for auth session management.
 *
 * Usage:
 *   import { createServerSupabase } from '@/lib/utils/supabase-server';
 *   const supabase = await createServerSupabase();
 */
export const createServerSupabase = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Cookie setting fails in Server Components (read-only).
            // This is expected and harmless — sessions refresh on next request.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Same as above — expected in read-only contexts.
          }
        },
      },
    },
  );
};
