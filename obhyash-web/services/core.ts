import { supabase } from '@/lib/utils/supabase';

export { supabase };

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
