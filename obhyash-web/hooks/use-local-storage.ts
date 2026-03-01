'use client';

import {
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
} from 'react';

type SetValue<T> = Dispatch<SetStateAction<T>>;

interface UseLocalStorageReturn<T> {
  value: T;
  setValue: SetValue<T>;
  removeValue: () => void;
}

/**
 * useLocalStorage — type-safe, SSR-safe hook for non-sensitive user metadata.
 *
 * Features:
 * - Reads from localStorage synchronously on mount (no skeleton flash)
 * - Handles JSON parse errors gracefully with fallback to defaultValue
 * - Safe to use in Server Components (returns defaultValue on SSR)
 * - Cross-tab sync via the 'storage' event
 *
 * @example
 * // Profile metadata (non-sensitive — name, xp, rank)
 * const { value: meta, setValue: setMeta } = useLocalStorage('profile-main', defaultMeta);
 *
 * // Theme preference
 * const { value: theme, setValue: setTheme } = useLocalStorage('obhyash-theme', 'light');
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): UseLocalStorageReturn<T> {
  // Initialize state with the current localStorage value (SSR-safe).
  // Using a function initializer means we only read from localStorage once
  // during mount, not on every render.
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Write to localStorage whenever value changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (value === undefined || value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (err) {
      // Storage quota exceeded — non-fatal, state still correct in memory
      console.warn(`[useLocalStorage] Failed to persist key "${key}":`, err);
    }
  }, [key, value]);

  // Cross-tab sync: listen for changes from other tabs/windows.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        setValue(
          e.newValue !== null ? (JSON.parse(e.newValue) as T) : defaultValue,
        );
      } catch {
        setValue(defaultValue);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key, defaultValue]);

  // removeValue helper — clears both state and localStorage entry.
  const removeValue = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    setValue(defaultValue);
  }, [key, defaultValue]);

  return { value, setValue, removeValue };
}
