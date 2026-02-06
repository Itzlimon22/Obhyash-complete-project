'use client';
import React, { useState, useEffect } from 'react';
import {
  Search,
  Menu,
  Moon,
  Sun,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { NotificationDropdown } from '@/components/admin/notifications/notification-dropdown';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/utils/supabase';
import { getUserProfile } from '@/services/database';
import { UserProfile } from '@/lib/types';
import Link from 'next/link';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Load Theme Preference from LocalStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

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
    <header className="sticky top-0 z-30 w-full h-16 bg-paper-50/80 dark:bg-obsidian-950/80 backdrop-blur-md border-b border-paper-200 dark:border-obsidian-800 flex items-center justify-between px-6 transition-colors duration-300">
      {/* LEFT: Mobile Toggle, Search, Breadcrumbs */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:text-paper-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-paper-200 dark:hover:bg-obsidian-800 transition-colors"
        >
          <Menu size={20} />
        </button>

        {/* Desktop Breadcrumbs (Replaces Search on bigger screens if desired, or sits next to it) */}
        {generateBreadcrumbs()}

        {/* Search Bar (Optional - Keep hidden on mobile, show on Desktop if needed) */}
        <div className="relative hidden xl:block group ml-auto mr-4">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-obsidian-700 group-focus-within:text-brand-500 transition-colors"
            size={16}
          />
          <input
            type="text"
            placeholder="Search..."
            className="bg-paper-100 dark:bg-obsidian-900 border border-transparent dark:border-obsidian-800 text-paper-900 dark:text-gray-200 text-sm rounded-lg pl-10 pr-4 py-2 w-48 outline-none ring-1 ring-transparent focus:ring-brand-500/50 focus:bg-white dark:focus:bg-obsidian-900 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* RIGHT: Actions & Profile */}
      <div className="flex items-center gap-2 md:gap-4 ml-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-paper-900 dark:text-gray-400 dark:hover:text-white hover:bg-paper-100 dark:hover:bg-obsidian-800 rounded-lg transition-colors"
        >
          {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        <div className="h-6 w-px bg-paper-200 dark:bg-obsidian-800 mx-1"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 pl-1 pr-3 py-1.5 rounded-full hover:bg-paper-100 dark:hover:bg-obsidian-900 border border-transparent hover:border-paper-200 dark:hover:border-obsidian-800 transition-all group"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full border-2 border-white dark:border-obsidian-800"
              />
            ) : (
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md shadow-brand-500/20 ring-2 ring-white dark:ring-obsidian-950 bg-gradient-to-tr from-brand-500 to-indigo-600`}
              >
                {user?.name?.[0]?.toUpperCase() || 'A'}
              </div>
            )}

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

              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-obsidian-900 rounded-xl shadow-lg border border-gray-100 dark:border-obsidian-800 py-1 z-20 animate-in fade-in zoom-in-95 duration-200">
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
