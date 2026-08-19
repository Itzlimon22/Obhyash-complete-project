'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Shield,
  Radio,
  Sparkles,
  ExternalLink,
  User,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

import { useTheme } from '@/components/providers/ThemeProvider';

interface AdminHeaderProps {
  toggleSidebar: () => void;
  adminName?: string;
  adminEmail?: string;
}

const ROUTE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'কমান্ড সেন্টার',
  '/admin/analytics': 'প্ল্যাটফর্ম অ্যানালিটিক্স',
  '/admin/question-management': 'প্রশ্ন ব্যাংক ও বাল্ক আপলোডার',
  '/admin/questions': 'প্রশ্ন অনুসন্ধান ও পরিদর্শন',
  '/admin/live-exams': 'লাইভ পরীক্ষা কন্ট্রোলার',
  '/admin/user-management': 'ইউজার ও রোল ম্যানেজমেন্ট',
  '/admin/subscriptions': 'সাবস্ক্রিপশন ও পেমেন্টস',
  '/admin/reports': 'প্রশ্ন এরর রিপোর্ট সমাধান',
  '/admin/complaints': 'অভিযোগ ও মতামত কেন্দ্র',
  '/admin/feature-requests': 'ফিচার প্রস্তাবনা ও রোডম্যাপ',
  '/admin/notifications': 'সিস্টেম নোটিফিকেশন ব্রডকাস্ট',
  '/admin/blog-management': 'ব্লগ ও কনটেন্ট ম্যানেজমেন্ট',
  '/admin/settings': 'সিস্টেম ও সিকিউরিটি সেটিংস',
  '/admin/profile': 'অ্যাডমিন প্রোফাইল',
};

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  toggleSidebar,
  adminName = 'Super Admin',
  adminEmail = 'admin@obhyash.com',
}) => {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const currentTitle = ROUTE_TITLES[pathname] || 'অ্যাডমিন প্যানেল';

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-white/90 dark:bg-[#0E0E11]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-zinc-800/80 flex items-center justify-between px-4 sm:px-6 transition-colors">
      {/* LEFT: Mobile Menu Button & Dynamic Route Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          onClick={toggleSidebar}
          className="p-2 text-neutral-600 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-sm md:text-base font-extrabold text-neutral-900 dark:text-zinc-100 truncate">
            {currentTitle}
          </h2>
          <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active Mode
          </div>
        </div>
      </div>

      {/* RIGHT: Actions & Admin Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Student View Shortcut */}
        <Link
          href="/dashboard"
          target="_blank"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-600 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800/70 border border-neutral-200/70 dark:border-zinc-800 transition-all"
        >
          <span>Student App</span>
          <ExternalLink size={12} />
        </Link>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-neutral-600 dark:text-zinc-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800/70 border border-neutral-200/70 dark:border-zinc-800 transition-all"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>

        <div className="h-5 w-px bg-neutral-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

        {/* Admin Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-zinc-800/70 border border-transparent hover:border-neutral-200 dark:hover:border-zinc-800 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-[#004633] text-white flex items-center justify-center font-bold text-xs shadow-sm border border-emerald-500/30">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-neutral-900 dark:text-zinc-100 leading-tight">
                {adminName}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold leading-tight">
                Administrator
              </span>
            </div>

            <ChevronDown
              size={14}
              className={`text-neutral-400 transition-transform duration-200 hidden sm:block ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setIsDropdownOpen(false)}
              />

              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#121215] rounded-2xl shadow-xl border border-neutral-200/80 dark:border-zinc-800 p-2 z-30 space-y-1 animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-zinc-800/80 mb-1">
                  <p className="text-xs font-bold text-neutral-900 dark:text-zinc-100 truncate">
                    {adminName}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-zinc-400 truncate">
                    {adminEmail}
                  </p>
                </div>

                <Link
                  href="/admin/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-neutral-700 dark:text-zinc-300 hover:bg-neutral-100 dark:hover:bg-zinc-800/80 rounded-xl transition-colors"
                >
                  <Shield size={14} />
                  <span>Security & Settings</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors text-left"
                >
                  <LogOut size={14} />
                  <span>লগ আউট (Sign Out)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
