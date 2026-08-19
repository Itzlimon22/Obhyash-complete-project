'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'theme';
const THEME_EVENT = 'obhyash-theme-change';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  // Apply theme to DOM documentElement and broadcast
  const applyTheme = useCallback((newTheme: Theme, broadcast = true) => {
    setThemeState(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // localStorage may be restricted in private/sandboxed mode
    }

    if (broadcast && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme: newTheme } }));
    }
  }, []);

  useEffect(() => {
    // Determine initial theme:
    // 1. Check localStorage
    // 2. Check current class on html
    // 3. Fallback to 'dark' (luxury brand default)
    let currentTheme: Theme = 'dark';
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        currentTheme = stored;
      } else if (document.documentElement.classList.contains('dark')) {
        currentTheme = 'dark';
      }
    } catch {
      // Fallback
    }

    applyTheme(currentTheme, false);
    setMounted(true);

    // Synchronize across multiple components and browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        applyTheme(e.newValue, false);
      }
    };

    const handleCustomThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: Theme }>;
      if (customEvent.detail?.theme && customEvent.detail.theme !== theme) {
        setThemeState(customEvent.detail.theme);
        if (customEvent.detail.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_EVENT, handleCustomThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_EVENT, handleCustomThemeChange);
    };
  }, [applyTheme, theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      applyTheme(newTheme, true);
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      return next;
    });
  }, [applyTheme]);

  const value = {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback for SSR or usage outside provider
    return {
      theme: 'dark' as Theme,
      isDark: true,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return context;
}
