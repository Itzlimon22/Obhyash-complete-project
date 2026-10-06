'use client';

import React from 'react';
import { MessageSquare, Bell, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { cn } from '@/lib/utils';

export interface NiondHeaderProps {
  title?: string;
  subtitle?: string;
  adminName?: string;
  adminRole?: string;
  adminAvatar?: string;
  onSearchClick?: () => void;
  className?: string;
}

export const NiondHeader: React.FC<NiondHeaderProps> = ({
  title = 'Dashboard',
  subtitle,
  adminName = 'Nora Watson',
  adminRole = 'Sales Manager',
  adminAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
  onSearchClick,
  className,
}) => {
  const { theme, toggleTheme } = useTheme();

  // Dynamic formatted date default if not provided
  const currentDate =
    subtitle ||
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date());

  return (
    <header
      className={cn(
        'w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6',
        className,
      )}
    >
      {/* Title & Date */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="text-xs sm:text-sm font-medium text-slate-400 dark:text-zinc-400 mt-0.5">
          {currentDate}
        </p>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Dark/Light mode toggle */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="w-10 h-10 rounded-2xl bg-white dark:bg-[#151515] border border-slate-100/80 dark:border-zinc-800 shadow-card flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all hover:scale-105 active:scale-95"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#c6f634]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Message Trigger */}
        <button
          aria-label="Messages"
          className="w-10 h-10 rounded-2xl bg-white dark:bg-[#151515] border border-slate-100/80 dark:border-zinc-800 shadow-card flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all hover:scale-105 active:scale-95 relative"
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Notification Bell */}
        <button
          aria-label="Notifications"
          className="w-10 h-10 rounded-2xl bg-white dark:bg-[#151515] border border-slate-100/80 dark:border-zinc-800 shadow-card flex items-center justify-center text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white transition-all hover:scale-105 active:scale-95 relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#c6f634] ring-2 ring-white dark:ring-[#151515]" />
        </button>

        {/* Admin Profile Quick-Chip */}
        <div className="flex items-center gap-3 pl-2">
          <img
            src={adminAvatar}
            alt={adminName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-zinc-800 shadow-sm"
          />
          <div className="hidden sm:block text-left">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {adminName}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium leading-tight">
              {adminRole}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NiondHeader;
