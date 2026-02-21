/**
 * ServiceResult<T> — Unified return type for all service functions.
 *
 * Replaces the inconsistent mix of:
 * - throwing errors
 * - returning { success, error }
 * - returning null
 *
 * Usage:
 *   return ok(data)       → success
 *   return fail('msg')    → error
 *   return fromPromise(p) → wraps a promise
 */

export interface ServiceResult<T> {
  data: T | null;
  error: string | null;
  ok: boolean;
}

/** Create a success result */
export function ok<T>(data: T): ServiceResult<T> {
  return { data, error: null, ok: true };
}

/** Create a failure result */
export function fail<T = never>(error: string): ServiceResult<T> {
  return { data: null, error, ok: false };
}

/** Wrap a promise into a ServiceResult, catching errors automatically */
export async function fromPromise<T>(
  promise: Promise<T>,
  fallbackError = 'An unexpected error occurred',
): Promise<ServiceResult<T>> {
  try {
    const data = await promise;
    return ok(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : fallbackError;
    return fail(msg);
  }
}
