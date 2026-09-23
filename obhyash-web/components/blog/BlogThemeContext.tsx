'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type BlogTheme = 'dark' | 'light';

interface BlogThemeContextType {
  theme: BlogTheme;
  isDark: boolean;
  toggleTheme: () => void;
  mounted: boolean;
}

const BlogThemeContext = createContext<BlogThemeContextType | undefined>(undefined);

const BLOG_THEME_KEY = 'obhyash-blog-theme';
const APP_THEME_KEY = 'theme';

export function BlogThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<BlogTheme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 1. Remember the main app's original theme so we can restore it when leaving the blog
    const originalAppTheme = localStorage.getItem(APP_THEME_KEY) || (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

    // 2. Check if user already has a saved preference specifically for the blog
    let initialBlogTheme: BlogTheme = 'dark';
    try {
      const saved = localStorage.getItem(BLOG_THEME_KEY);
      if (saved === 'dark' || saved === 'light') {
        initialBlogTheme = saved;
      } else {
        // Default to current theme or dark
        initialBlogTheme = originalAppTheme === 'light' ? 'light' : 'dark';
      }
    } catch {
      // Fallback
    }

    setTheme(initialBlogTheme);
    if (initialBlogTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setMounted(true);

    // 3. Cleanup: When leaving the blog (navigating back to dashboard/app), restore app theme
    return () => {
      try {
        const appTheme = localStorage.getItem(APP_THEME_KEY) || originalAppTheme;
        if (appTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch {
        // Fallback
      }
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: BlogTheme = prev === 'dark' ? 'light' : 'dark';
      if (next === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      try {
        localStorage.setItem(BLOG_THEME_KEY, next);
      } catch {
        // Fallback
      }
      return next;
    });
  }, []);

  return (
    <BlogThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, mounted }}>
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
      mounted: false,
    };
  }
  return context;
}
