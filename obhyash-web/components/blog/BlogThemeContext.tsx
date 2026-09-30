'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type BlogTheme = 'dark' | 'light';

interface BlogThemeContextType {
  theme: BlogTheme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: BlogTheme) => void;
  mounted: boolean;
}

const BlogThemeContext = createContext<BlogThemeContextType | undefined>(undefined);

export const BLOG_THEME_KEY = 'obhyash-blog-theme';
const BLOG_THEME_EVENT = 'obhyash-blog-theme-change';
const APP_THEME_KEY = 'theme';

export function BlogThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<BlogTheme>('dark');
  const [mounted, setMounted] = useState(false);

  const applyBlogTheme = useCallback((newTheme: BlogTheme, broadcast = true) => {
    setThemeState(newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(BLOG_THEME_KEY, newTheme);
    } catch {
      // localStorage may be restricted in private/sandboxed mode
    }

    if (broadcast && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(BLOG_THEME_EVENT, { detail: { theme: newTheme } }));
    }
  }, []);

  useEffect(() => {
    // 1. Independent blog theme determination:
    // Strictly read 'obhyash-blog-theme'. Do NOT inherit from app's 'theme' key!
    let initialBlogTheme: BlogTheme = 'dark';
    try {
      const saved = localStorage.getItem(BLOG_THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        initialBlogTheme = saved;
      } else if (document.documentElement.classList.contains('dark')) {
        initialBlogTheme = 'dark';
      } else {
        initialBlogTheme = 'dark';
      }
    } catch {
      // Fallback
    }

    applyBlogTheme(initialBlogTheme, false);
    setMounted(true);

    // 2. Synchronize across tabs and any blog components
    const handleStorage = (e: StorageEvent) => {
      if (e.key === BLOG_THEME_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        applyBlogTheme(e.newValue, false);
      }
    };

    const handleCustomBlogThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ theme: BlogTheme }>;
      if (customEvent.detail?.theme) {
        applyBlogTheme(customEvent.detail.theme, false);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(BLOG_THEME_EVENT, handleCustomBlogThemeChange);

    // 3. Cleanup: ONLY restore app theme when leaving the blog completely (/blog/* -> /student, /dashboard, etc.)
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(BLOG_THEME_EVENT, handleCustomBlogThemeChange);

      try {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/blog')) {
          const appTheme = localStorage.getItem(APP_THEME_KEY);
          if (appTheme === 'light') {
            document.documentElement.classList.remove('dark');
          } else {
            document.documentElement.classList.add('dark');
          }
        }
      } catch {
        // Fallback
      }
    };
  }, [applyBlogTheme]);

  const setTheme = useCallback(
    (newTheme: BlogTheme) => {
      applyBlogTheme(newTheme, true);
    },
    [applyBlogTheme]
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: BlogTheme = prev === 'dark' ? 'light' : 'dark';
      applyBlogTheme(next, true);
      return next;
    });
  }, [applyBlogTheme]);

  const value = {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
    mounted,
  };

  return (
    <BlogThemeContext.Provider value={value}>
      {children}
    </BlogThemeContext.Provider>
  );
}

export function useBlogTheme() {
  const context = useContext(BlogThemeContext);
  if (!context) {
    return {
      theme: 'dark' as BlogTheme,
      isDark: true,
      toggleTheme: () => {},
      setTheme: () => {},
      mounted: false,
    };
  }
  return context;
}
