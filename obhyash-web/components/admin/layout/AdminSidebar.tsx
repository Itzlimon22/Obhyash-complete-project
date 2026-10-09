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
  Mail,
  BookOpen,
  Settings,
  LogOut,
  ChevronsLeft,
  X,
  Lightbulb,
  Gift,
  SlidersHorizontal,
  Tag,
  FileText,
  ExternalLink,
  Newspaper,
  Activity,
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
        label: 'ড্যাশবোর্ড',
        icon: LayoutDashboard,
        href: '/admin/dashboard',
      },
      {
        id: 'control-panel',
        label: 'কন্ট্রোল প্যানেল',
        icon: SlidersHorizontal,
        href: '/admin/control-panel',
      },
      {
        id: 'analytics',
        label: 'অ্যানালিটিক্স',
        icon: BarChart3,
        href: '/admin/analytics',
      },
    ],
  },
  {
    title: 'প্রশ্ন ও পরীক্ষা',
    items: [
      {
        id: 'questions',
        label: 'প্রশ্ন ব্যাংক',
        icon: FileQuestion,
        href: '/admin/question-management',
      },
      {
        id: 'question-health',
        label: 'প্রশ্ন হেলথ',
        icon: HeartPulse,
        href: '/admin/question-health',
      },
      {
        id: 'live-exams',
        label: 'লাইভ এক্সাম',
        icon: Radio,
        href: '/admin/live-exams',
      },
      {
        id: 'pdf-generator',
        label: 'PDF জেনারেটর',
        icon: FileText,
        href: '/admin/pdf-generator',
      },
      {
        id: 'reports',
        label: 'এরর রিপোর্ট',
        icon: Flag,
        href: '/admin/reports',
      },
    ],
  },
  {
    title: 'ইউজার ও পেমেন্ট',
    items: [
      {
        id: 'users',
        label: 'ইউজার্স',
        icon: Users,
        href: '/admin/user-management',
      },
      {
        id: 'subscriptions',
        label: 'সাবস্ক্রিপশন',
        icon: CreditCard,
        href: '/admin/subscriptions',
      },
      {
        id: 'coupons',
        label: 'কুপন',
        icon: Tag,
        href: '/admin/coupons',
      },
      {
        id: 'referrals',
        label: 'রেফারেল',
        icon: Gift,
        href: '/admin/referrals',
      },
    ],
  },
  {
    title: 'সাপোর্ট ও আউটরিচ',
    items: [
      {
        id: 'complaints',
        label: 'অভিযোগ কেন্দ্র',
        icon: AlertTriangle,
        href: '/admin/complaints',
      },
      {
        id: 'blog-management',
        label: 'কনভার্শন মনিটর',
        icon: Activity,
        href: '/admin/blog-management',
      },
      {
        id: 'notifications',
        label: 'নোটিফিকেশন',
        icon: Bell,
        href: '/admin/notifications',
      },
      {
        id: 'feature-requests',
        label: 'ফিচার রিকোয়েস্ট',
        icon: Lightbulb,
        href: '/admin/feature-requests',
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
    label: 'স্টুডেন্ট প্ল্যাটফর্ম',
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
  const { isDark } = useTheme();
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
    } finally {
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
              ? 'bg-[#121215] text-zinc-200 border-r border-zinc-800/90'
              : 'bg-white text-slate-800 border-r border-slate-100/90 shadow-card'
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
        {/* Top Branding Bar */}
        <div
          className={`h-20 flex items-center justify-between px-5 shrink-0 transition-colors ${
            isDark
              ? 'border-b border-zinc-800/80 bg-[#121215]'
              : 'border-b border-slate-100 bg-white'
          }`}
        >
          <Link href="/admin/dashboard" className="flex items-center gap-3 min-w-0">
            {/* Modern Obhyash Brand Capsule */}
            <div className="w-10 h-10 rounded-2xl bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 shadow-sm shrink-0">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-4.5 bg-[#c6f634] rounded-full transform -skew-x-12" />
                <span className="w-1.5 h-4.5 bg-white dark:bg-slate-950 rounded-full transform -skew-x-12" />
              </div>
            </div>

            {showLabel && (
              <div className="flex flex-col min-w-0">
                <span
                  className={`font-black text-base tracking-tight truncate ${
                    isDark ? 'text-white' : 'text-slate-950'
                  }`}
                >
                  Obhyash
                </span>
                <span className="text-[10px] text-[#0a666b] dark:text-[#c6f634] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c6f634] animate-pulse" />
                  Admin HQ
                </span>
              </div>
            )}
          </Link>

          {isMobile ? (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X size={20} />
            </button>
          ) : (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
              title={isOpen ? 'সাইডবার গুটিয়ে রাখুন' : 'সাইডবার প্রসারিত করুন'}
            >
              <ChevronsLeft
                size={18}
                className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {/* Navigation Links Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5 scrollbar-thin">
          {ADMIN_NAVIGATION.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {showLabel && section.title && (
                <div
                  className={`px-3.5 text-[10px] font-black uppercase tracking-wider mb-2 ${
                    isDark ? 'text-zinc-500' : 'text-slate-400'
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
                      group relative flex items-center gap-3.5 px-3.5 py-2.5 text-xs font-bold transition-all duration-200
                      ${
                        isActive
                          ? 'bg-[#c6f634] text-slate-950 shadow-sm rounded-2xl'
                          : isDark
                            ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-2xl'
                            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50 rounded-2xl'
                      }
                      ${!isOpen && !isMobile ? 'justify-center px-0' : ''}
                    `}
                    title={!isOpen && !isMobile ? item.label : undefined}
                  >
                    <Icon
                      size={17}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                        isActive
                          ? 'text-slate-950'
                          : isDark
                            ? 'text-zinc-400 group-hover:text-zinc-200'
                            : 'text-slate-500 group-hover:text-slate-950'
                      }`}
                    />

                    {showLabel && (
                      <span className="truncate">{item.label}</span>
                    )}

                    {showLabel && item.count !== undefined && item.count > 0 && (
                      <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Section (Settings, Live Platform & Logout) */}
        <div
          className={`p-3.5 space-y-1.5 shrink-0 transition-colors ${
            isDark
              ? 'border-t border-zinc-800/80 bg-[#0e0e11]'
              : 'border-t border-slate-100 bg-slate-50/80'
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
                  group flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold transition-all
                  ${
                    isActive
                      ? isDark
                        ? 'bg-zinc-800 text-white'
                        : 'bg-slate-200 text-slate-900'
                      : isDark
                        ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={`
              w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-bold transition-all border border-transparent cursor-pointer disabled:opacity-50
              ${
                isDark
                  ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
                  : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
              }
              ${!isOpen && !isMobile ? 'justify-center px-0' : ''}
            `}
            title={!isOpen && !isMobile ? 'লগ আউট' : undefined}
          >
            <LogOut size={16} strokeWidth={2} className={`shrink-0 ${isLoggingOut ? 'animate-spin' : ''}`} />
            {showLabel && <span>{isLoggingOut ? 'লগআউট হচ্ছে...' : 'লগ আউট'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
