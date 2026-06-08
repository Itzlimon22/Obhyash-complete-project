import { useState, useCallback } from 'react';

/**
 * Like useState but persists the value in sessionStorage.
 * - The lazy initializer reads sessionStorage synchronously on mount
 *   so the correct value is available on the very first render (no flash).
 * - sessionStorage is cleared when the browser tab closes, keeping state
 *   scoped to the current session only.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setStateRaw] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = sessionStorage.getItem(key);
      if (raw === null) return defaultValue;
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  });

  const setState = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStateRaw((prev) => {
        const next = typeof value === 'function' ? (value as (p: T) => T)(prev) : value;
        try {
          sessionStorage.setItem(key, JSON.stringify(next));
        } catch {
          // sessionStorage unavailable (private mode quota) — graceful degradation
        }
        return next;
      });
    },
    [key],
  );

  return [state, setState];
}
