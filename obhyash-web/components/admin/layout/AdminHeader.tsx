'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  Shield,
  ExternalLink,
  Bell,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { UserSpotlightSearchBar } from '@/components/admin/dashboard/user-spotlight-modal';

interface AdminHeaderProps {
  toggleSidebar: () => void;
  adminName?: string;
  adminEmail?: string;
}

const ROUTE_TITLES: Record<string, { title: string; subtitle?: string }> = {
  '/admin/dashboard': { title: 'Dashboard', subtitle: 'কমান্ড সেন্টার ও রিয়েল-টাইম ওভারভিউ' },
  '/admin/analytics': { title: 'Analytics & Reports', subtitle: 'প্ল্যাটফর্ম অ্যানালিটিক্স ও রিপোর্ট' },
  '/admin/question-management': { title: 'Question Bank', subtitle: 'প্রশ্ন ব্যাংক ও বাল্ক আপলোডার' },
  '/admin/question-health': { title: 'Question Health', subtitle: 'প্রশ্ন হেলথ ও কোয়ালিটি ড্যাশবোর্ড' },
  '/admin/questions': { title: 'Questions Explorer', subtitle: 'প্রশ্ন অনুসন্ধান ও পরিদর্শন' },
  '/admin/live-exams': { title: 'Live Exams Hub', subtitle: 'লাইভ পরীক্ষা কন্ট্রোলার' },
  '/admin/user-management': { title: 'User Management', subtitle: 'ইউজার ও রোল ম্যানেজমেন্ট' },
  '/admin/subscriptions': { title: 'Subscriptions', subtitle: 'সাবস্ক্রিপশন ও পেমেন্টস' },
  '/admin/referrals': { title: 'Referrals & Rewards', subtitle: 'রেফারেল ও রিওয়ার্ড ম্যানেজমেন্ট' },
  '/admin/coupons': { title: 'Coupons', subtitle: 'কুপন ও অ্যাম্বাসেডর কোড' },
  '/admin/reports': { title: 'Question Reports', subtitle: 'প্রশ্ন এরর রিপোর্ট সমাধান' },
  '/admin/complaints': { title: 'Support & Tickets', subtitle: 'অভিযোগ ও মতামত কেন্দ্র' },
  '/admin/feature-requests': { title: 'Feature Requests', subtitle: 'ফিচার প্রস্তাবনা ও রোডম্যাপ' },
  '/admin/notifications': { title: 'Broadcasts', subtitle: 'সিস্টেম নোটিফিকেশন ব্রডকাস্ট' },
  '/admin/blog-management': { title: 'Conversion Monitor Hub', subtitle: 'অ্যাপ ইনস্টল, রেজিস্ট্রেশন ও ডেমো এক্সাম লাইভ মনিটরিং' },
  '/admin/control-panel': { title: 'Control Panel', subtitle: 'সিস্টেম ও প্ল্যাটফর্ম মাস্টার কন্ট্রোল' },
  '/admin/settings': { title: 'System Settings', subtitle: 'সিস্টেম ও সিকিউরিটি সেটিংস' },
  '/admin/profile': { title: 'Admin Profile', subtitle: 'অ্যাডমিন প্রোফাইল' },
};

function getRouteBreadcrumb(pathname: string): { title: string; parent?: { title: string; href: string } } {
  if (ROUTE_TITLES[pathname]) {
    return { title: ROUTE_TITLES[pathname].title };
  }
  if (pathname.startsWith('/admin/user-management/')) {
    return {
      title: 'User Details',
      parent: { title: 'User Management', href: '/admin/user-management' },
    };
  }
  if (pathname === '/admin/questions/new') {
    return {
      title: 'New Question',
      parent: { title: 'Question Bank', href: '/admin/question-management' },
    };
  }
  if (pathname === '/admin/questions/bulk-upload') {
    return {
      title: 'Bulk Upload',
      parent: { title: 'Question Bank', href: '/admin/question-management' },
    };
  }
  if (pathname === '/admin/notifications/history') {
    return {
      title: 'History',
      parent: { title: 'Broadcasts', href: '/admin/notifications' },
    };
  }
  return { title: 'Overview' };
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  toggleSidebar,
  adminName = 'Super Admin',
  adminEmail = 'admin@obhyash.com',
}) => {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAdminAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error in AdminHeader:', err);
    } finally {
      window.location.replace('/login?logout=true');
    }
  };

  const breadcrumb = getRouteBreadcrumb(pathname);
  const pageTitle = breadcrumb.parent
    ? `${breadcrumb.parent.title} / ${breadcrumb.title}`
    : breadcrumb.title;

  const currentDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 w-full h-18 sm:h-20 bg-white/85 dark:bg-[#151515]/85 backdrop-blur-md border-b border-slate-100/90 dark:border-zinc-800/90 flex items-center justify-between px-4 sm:px-8 transition-colors">
      {/* LEFT: Sidebar Toggle & Page Title */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
          title="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-tight leading-tight truncate">
              {pageTitle}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#c6f634] text-slate-950 text-[10px] font-black uppercase tracking-wider shrink-0 shadow-xs">
              • Live
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-400 dark:text-zinc-400 leading-tight mt-0.5">
            {currentDate}
          </p>
        </div>
      </div>

      {/* CENTER: User Spotlight Quick Search (Hidden on small mobile) */}
      <div className="hidden md:block max-w-sm w-full mx-4">
        <UserSpotlightSearchBar />
      </div>

      {/* RIGHT: Actions, Dark Mode Toggle & Admin Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Student View Shortcut Pill */}
        <Link
          href="/dashboard"
          target="_blank"
          className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800/80 border border-slate-200/70 dark:border-zinc-800 transition-all shadow-xs"
        >
          <span>Student App</span>
          <ExternalLink size={12} className="opacity-70" />
        </Link>

        {/* Dark/Light Mode Soft Container */}
        <button
          type="button"
          onClick={toggleTheme}
          className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-zinc-900 border border-slate-200/60 dark:border-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-slate-950 dark:hover:text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun size={17} className="text-[#c6f634]" />
          ) : (
            <Moon size={17} className="text-slate-700" />
          )}
        </button>

        {/* Admin Profile Dropdown Chip */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-2xl bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-800 transition-all cursor-pointer shadow-xs"
          >
            <div className="w-8 h-8 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
              {adminName.charAt(0).toUpperCase()}
            </div>

            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-950 dark:text-white leading-tight">
                {adminName}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-zinc-400 font-medium leading-tight">
                Super Admin
              </span>
            </div>

            <ChevronDown
              size={14}
              className={`text-slate-400 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#151515] rounded-3xl shadow-xl border border-slate-100 dark:border-zinc-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800/80">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {adminName}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-mono truncate">
                  {adminEmail}
                </p>
              </div>

              <div className="py-1">
                <Link
                  href="/admin/profile"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  <Shield size={14} />
                  <span>প্রোফাইল সেটিংস</span>
                </Link>
                <Link
                  href="/admin/control-panel"
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  <Sparkles size={14} />
                  <span>কন্ট্রোল প্যানেল</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <LogOut size={14} className={isLoggingOut ? 'animate-spin' : ''} />
                  <span>{isLoggingOut ? 'লগআউট হচ্ছে...' : 'লগ আউট'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
