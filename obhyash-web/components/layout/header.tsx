'use client';
import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  Search,
  Menu,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { NotificationDropdown } from '@/components/admin/notifications/notification-dropdown';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { getUserProfile } from '@/services/database';
import { UserProfile } from '@/lib/types';
import Link from 'next/link';
import UserAvatar from '@/components/student/ui/common/UserAvatar';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    const savedTheme = localStorage.getItem('theme');
    return savedTheme !== 'light';
  });
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Load Theme Preference from LocalStorage
  useLayoutEffect(() => {
    const isLight = !isDarkMode;
    if (isLight) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [isDarkMode]);

  // Fetch User Profile
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const profile = await getUserProfile('me');
        setUser(profile);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };
    fetchUser();
  }, []);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  // Generate Breadcrumbs
  const generateBreadcrumbs = () => {
    if (!pathname) return null;
    const paths = pathname.split('/').filter((path) => path);
    return (
      <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          const href = `/${paths.slice(0, index + 1).join('/')}`;

          return (
            <div key={path} className="flex items-center gap-2">
              <span
                className={`capitalize ${isLast ? 'text-gray-900 dark:text-gray-100 font-medium' : ''}`}
              >
                {path.replace(/-/g, ' ')}
              </span>
              {!isLast && <span className="text-gray-400">/</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between px-4 sm:px-6 transition-all duration-300">
      {/* LEFT: Branding & Desktop Breadcrumbs */}
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Branding (Left-aligned) */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="text-white text-xs font-black">O</span>
          </div>
          <span className="font-black text-sm text-neutral-900 dark:text-white uppercase tracking-tight">
            Obhyash
          </span>
        </div>

        {/* Desktop Breadcrumbs */}
        <div className="hidden lg:block">{generateBreadcrumbs()}</div>

        {/* Search Bar - Optimized for visibility */}
        <div className="relative hidden sm:block group ml-auto md:ml-4 lg:ml-0">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-600 group-focus-within:text-red-500 transition-colors"
            size={16}
            strokeWidth={3}
          />
          <input
            type="text"
            placeholder="সার্চ করুন..."
            className="bg-neutral-100 dark:bg-neutral-900 border border-transparent dark:border-neutral-800 text-neutral-900 dark:text-neutral-200 text-xs font-black rounded-2xl pl-11 pr-4 py-2.5 w-32 md:w-56 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 transition-all placeholder:text-neutral-400"
          />
        </div>
      </div>

      {/* RIGHT: Actions & Profile */}
      <div className="flex items-center gap-1 md:gap-3 ml-2">
        {/* Refresh Button */}
        <button
          onClick={() => router.refresh()}
          title="Refresh Page Data"
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors group"
        >
          <RefreshCw size={18} className="group-active:animate-spin" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
        >
          {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        <div className="hidden md:block h-6 w-px bg-neutral-200 dark:bg-neutral-800 mx-1"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-full hover:bg-paper-100 dark:hover:bg-obsidian-900 border border-transparent hover:border-paper-200 dark:hover:border-obsidian-800 transition-all group"
          >
            <UserAvatar user={user} size="sm" showBorder />

            <div className="hidden md:flex flex-col items-start text-left">
              <span className="text-xs font-semibold text-paper-900 dark:text-gray-200 leading-none mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {user?.name || 'Admin'}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-500 font-medium uppercase tracking-wide">
                {user?.role || 'Super Admin'}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              {/* Overlay to close */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-obsidian-900 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl shadow-lg border border-gray-100 dark:border-obsidian-800 py-1 z-20 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 fade-in duration-200">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-obsidian-800">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.name || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || 'admin@obhyash.com'}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-obsidian-800 transition-colors"
                  >
                    <User size={16} />
                    Profile
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-obsidian-800 transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>
                </div>

                <div className="border-t border-gray-100 dark:border-obsidian-800 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
