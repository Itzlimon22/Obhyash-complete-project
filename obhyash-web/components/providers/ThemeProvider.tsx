'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const isBlog = pathname?.startsWith('/blog');
  const isBlogRef = useRef(isBlog);
  isBlogRef.current = isBlog;

  // Apply theme to DOM documentElement and broadcast
  const applyTheme = useCallback((newTheme: Theme, broadcast = true) => {
    setThemeState(newTheme);

    // Only manipulate DOM if NOT on blog routes (blog manages its own theme)
    if (!isBlogRef.current) {
      const root = document.documentElement;
      if (newTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
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
    // Determine initial theme on mount:
    let currentTheme: Theme = 'dark';
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        currentTheme = stored;
      } else if (document.documentElement.classList.contains('dark')) {
        currentTheme = 'dark';
      } else {
        currentTheme = 'light';
      }
    } catch {
      // Fallback
    }

    setThemeState(currentTheme);

    // Only apply to DOM if NOT on blog routes
    if (!window.location.pathname.startsWith('/blog')) {
      const root = document.documentElement;
      if (currentTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    setMounted(true);

    // Synchronize across multiple components and browser tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue);
        if (!window.location.pathname.startsWith('/blog')) {
          const root = document.documentElement;
          if (e.newValue === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      }
    };

    const handleCustomThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: Theme }>;
      if (customEvent.detail?.theme) {
        setThemeState(customEvent.detail.theme);
        if (!window.location.pathname.startsWith('/blog')) {
          const root = document.documentElement;
          if (customEvent.detail.theme === 'dark') {
            root.classList.add('dark');
          } else {
            root.classList.remove('dark');
          }
        }
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(THEME_EVENT, handleCustomThemeChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(THEME_EVENT, handleCustomThemeChange);
    };
  }, []);

  // When navigating back from blog to main app, re-apply the app theme
  const prevIsBlogRef = useRef(isBlog);
  useEffect(() => {
    if (mounted && prevIsBlogRef.current && !isBlog) {
      let currentAppTheme: Theme = theme;
      try {
        const stored = localStorage.getItem(THEME_KEY);
        if (stored === 'dark' || stored === 'light') {
          currentAppTheme = stored;
        }
      } catch {}
      const root = document.documentElement;
      if (currentAppTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    prevIsBlogRef.current = isBlog;
  }, [isBlog, mounted, theme]);

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
