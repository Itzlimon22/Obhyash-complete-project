'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Users,
  FileQuestion,
  HeartPulse,
  Radio,
  CreditCard,
  Flag,
  Bell,
  AlertTriangle,
  MessageSquare,
  BookOpen,
  Settings,
  LogOut,
  ChevronRight,
  ChevronsLeft,
  X,
  Sparkles,
  UploadCloud,
  Gift,
  Sun,
  Moon,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAdminAuth } from '@/hooks/use-admin-auth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  count?: number;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface AdminSidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isMobile: boolean;
}

const ADMIN_NAVIGATION: NavSection[] = [
  {
    title: 'ওভারভিউ',
    items: [
      {
        id: 'dashboard',
        label: 'কমান্ড সেন্টার',
        icon: LayoutDashboard,
        href: '/admin/dashboard',
      },
      {
        id: 'analytics',
        label: 'অ্যানালিটিক্স ও রিপোর্ট',
        icon: BarChart3,
        href: '/admin/analytics',
      },
    ],
  },
  {
    title: 'ম্যানেজমেন্ট',
    items: [
      {
        id: 'questions',
        label: 'প্রশ্ন ব্যাংক ও বাল্ক',
        icon: FileQuestion,
        href: '/admin/question-management',
      },
      {
        id: 'question-health',
        label: 'প্রশ্ন হেলথ ও কোয়ালিটি',
        icon: HeartPulse,
        href: '/admin/question-health',
      },
      {
        id: 'live-exams',
        label: 'লাইভ পরীক্ষা কন্ট্রোলার',
        icon: Radio,
        href: '/admin/live-exams',
      },
      {
        id: 'users',
        label: 'ইউজার ও রোল',
        icon: Users,
        href: '/admin/user-management',
      },
      {
        id: 'subscriptions',
        label: 'সাবস্ক্রিপশন ও পেমেন্ট',
        icon: CreditCard,
        href: '/admin/subscriptions',
      },
      {
        id: 'referrals',
        label: 'রেফারেল ও রিওয়ার্ড',
        icon: Gift,
        href: '/admin/referrals',
      },
      {
        id: 'reports',
        label: 'প্রশ্ন এরর রিপোর্ট',
        icon: Flag,
        href: '/admin/reports',
      },
      {
        id: 'complaints',
        label: 'অভিযোগ কেন্দ্র',
        icon: AlertTriangle,
        href: '/admin/complaints',
      },
      {
        id: 'feature-requests',
        label: 'ফিচার প্রস্তাবনা',
        icon: Sparkles,
        href: '/admin/feature-requests',
      },
      {
        id: 'notifications',
        label: 'নোটিফিকেশন ব্রডকাস্ট',
        icon: Bell,
        href: '/admin/notifications',
      },
      {
        id: 'blog-management',
        label: 'ব্লগ ও কনটেন্ট',
        icon: MessageSquare,
        href: '/admin/blog-management',
      },
    ],
  },
];

const BOTTOM_ITEMS: NavItem[] = [
  {
    id: 'settings',
    label: 'সিস্টেম সেটিংস',
    icon: Settings,
    href: '/admin/settings',
  },
  {
    id: 'live-site',
    label: 'লাইভ প্ল্যাটফর্ম',
    icon: BookOpen,
    href: '/dashboard',
  },
];

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  setIsOpen,
  isMobile,
}) => {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const { signOut } = useAdminAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error('Logout error in AdminSidebar:', err);
      window.location.replace('/login?logout=true');
    }
  };

  const showLabel = isMobile || isOpen;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 flex flex-col
          ${
            isDark
              ? 'bg-[#0E0E11] text-zinc-200 border-r border-zinc-800/80'
              : 'bg-white text-neutral-800 border-r border-neutral-200 shadow-sm'
          }
          transition-all duration-300 ease-in-out
          ${
            isMobile
              ? isOpen
                ? 'translate-x-0 w-72 shadow-2xl'
                : '-translate-x-full w-72'
              : isOpen
                ? 'w-64'
                : 'w-20'
          }
        `}
      >
        {/* Top Branding */}
        <div
          className={`h-16 flex items-center justify-between px-4 shrink-0 transition-colors ${
            isDark
              ? 'border-b border-zinc-800/80 bg-[#0E0E11]'
              : 'border-b border-neutral-200 bg-white'
          }`}
        >
          <Link href="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#004633] to-[#00664B] border border-emerald-500/30 flex items-center justify-center shadow-md shrink-0">
              <span className="text-white font-black text-sm tracking-tighter font-mono">O</span>
            </div>

            {showLabel && (
              <div className="flex flex-col min-w-0">
                <span
                  className={`font-extrabold text-sm tracking-tight truncate ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}
                >
                  অভ্যাস অ্যাডমিন
                </span>
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Command Hub
                </span>
              </div>
            )}
          </Link>

          {isMobile ? (
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <X size={20} />
            </button>
          ) : (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark
                  ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/80'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
              title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
            >
              <ChevronsLeft
                size={18}
                className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Navigation Links Scrollable Area */}
        <div
          className={`flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin ${
            isDark ? 'scrollbar-thumb-zinc-800' : 'scrollbar-thumb-neutral-200'
          }`}
        >
          {ADMIN_NAVIGATION.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {showLabel && section.title && (
                <div
                  className={`px-3 text-[10px] font-extrabold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-zinc-500' : 'text-neutral-400'
                  }`}
                >
                  {section.title}
                </div>
              )}

              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => isMobile && setIsOpen(false)}
                    className={`
                      group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200
                      ${
                        isActive
                          ? isDark
                            ? 'bg-[#004633]/30 text-emerald-400 border border-emerald-500/30 shadow-sm'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm'
                          : isDark
                            ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 border border-transparent'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-transparent'
                      }
                      ${!isOpen && !isMobile ? 'justify-center px-0' : ''}
                    `}
                    title={!isOpen && !isMobile ? item.label : undefined}
                  >
                    {/* Active Accent Indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-500 rounded-r-full" />
                    )}

                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isActive
                          ? isDark
                            ? 'text-emerald-400'
                            : 'text-emerald-600'
                          : isDark
                            ? 'text-zinc-400 group-hover:text-zinc-200'
                            : 'text-neutral-500 group-hover:text-neutral-900'
                      }`}
                    />

                    {showLabel && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {showLabel && item.count !== undefined && item.count > 0 && (
                      <span
                        className={`ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                          isDark
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Section (Settings, Live Platform, Theme Toggle & Logout) */}
        <div
          className={`p-3 space-y-1.5 shrink-0 transition-colors ${
            isDark
              ? 'border-t border-zinc-800/80 bg-[#0A0A0C]'
              : 'border-t border-neutral-200 bg-neutral-50/90'
          }`}
        >
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => isMobile && setIsOpen(false)}
                className={`
                  group flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                  ${
                    isActive
                      ? isDark
                        ? 'bg-zinc-800 text-white'
                        : 'bg-neutral-200 text-neutral-900'
                      : isDark
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                  }
                  ${!isOpen && !isMobile ? 'justify-center px-0' : ''}
                `}
                title={!isOpen && !isMobile ? item.label : undefined}
              >
                <Icon size={16} strokeWidth={2} className="shrink-0" />
                {showLabel && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all
              ${
                isDark
                  ? 'text-zinc-300 hover:text-white hover:bg-zinc-800/60 border border-zinc-800'
                  : 'text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200/70 border border-neutral-200'
              }
              ${!isOpen && !isMobile ? 'justify-center px-0' : ''}
            `}
            title={isDark ? 'লাইট মোড অন করুন' : 'ডার্ক মোড অন করুন'}
          >
            {isDark ? (
              <Sun size={16} className="text-amber-400 shrink-0" />
            ) : (
              <Moon size={16} className="text-indigo-600 shrink-0" />
            )}
            {showLabel && (
              <span className="truncate">
                {isDark ? 'লাইট মোড (Light)' : 'ডার্ক মোড (Dark)'}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all border border-transparent cursor-pointer disabled:opacity-50
              ${
                isDark
                  ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 hover:border-rose-500/20'
                  : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200'
              }
              ${!isOpen && !isMobile ? 'justify-center px-0' : ''}
            `}
            title={!isOpen && !isMobile ? 'লগ আউট' : undefined}
          >
            <LogOut size={16} strokeWidth={2} className={`shrink-0 ${isLoggingOut ? 'animate-spin' : ''}`} />
            {showLabel && <span>{isLoggingOut ? 'লগ আউট হচ্ছে...' : 'লগ আউট'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
