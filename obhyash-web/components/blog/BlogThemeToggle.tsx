'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useBlogTheme } from './BlogThemeContext';

interface BlogThemeToggleProps {
  className?: string;
}

export default function BlogThemeToggle({ className = '' }: BlogThemeToggleProps) {
  const { isDark, toggleTheme, mounted } = useBlogTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'লাইট মোডে পরিবর্তন করুন' : 'ডার্ক মোডে পরিবর্তন করুন'}
      title={isDark ? 'লাইট মোড' : 'ডার্ক মোড'}
      className={`relative w-9 h-9 flex items-center justify-center rounded-xl bg-black/5 dark:bg-white/5 text-slate-700 dark:text-slate-200 hover:bg-black/10 dark:hover:bg-white/10 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 ${className}`}
    >
      {!mounted ? (
        <span className="w-4 h-4" />
      ) : isDark ? (
        <Sun className="w-[18px] h-[18px] text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-[18px] h-[18px] text-slate-700 transition-transform duration-300 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
}
