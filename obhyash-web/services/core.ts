import { createClient } from '@/utils/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * `supabase` is a transparent Proxy that always delegates property access to
 * the live createClient() singleton — never a stale module-level reference.
 *
 * WHY A PROXY?
 * Doing `export const supabase = createClient()` at module level captures a
 * reference ONCE at import time, before auth initializes. On a browser refresh
 * all 12 service files that import this would send queries with no session,
 * causing blank data and infinite loading spinners.
 *
 * The Proxy lets all existing `supabase.from(...)`, `supabase.rpc(...)`,
 * `supabase.auth.*` etc. calls continue to work unchanged in every service
 * file, while always resolving against the fresh client at actual call time.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = createClient();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export const isSupabaseConfigured = () =>
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Retry wrapper for transient DB failures (network blips, timeouts).
 *
 * Usage:
 *   const data = await withRetry(() => supabase.from('x').select('*'));
 *
 * @param fn        — The async function to retry
 * @param retries   — Max retry attempts (default: 2)
 * @param delayMs   — Base delay between retries in ms (default: 500)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 500,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt < retries) {
        // Exponential backoff: 500ms, 1000ms
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }

  throw lastError;
}
