'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileQuestion,
  Upload,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  GraduationCap,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';

const TEACHER_NAVIGATION = [
  {
    title: 'ওভারভিউ',
    items: [
      {
        id: 'dashboard',
        label: 'ড্যাশবোর্ড',
        labelEn: 'Dashboard',
        icon: LayoutDashboard,
        href: '/teacher/dashboard',
      },
    ],
  },
  {
    title: 'কনটেন্ট',
    items: [
      {
        id: 'questions',
        label: 'প্রশ্ন ব্যাংক',
        labelEn: 'Question Bank',
        icon: FileQuestion,
        href: '/teacher/question-management',
      },
    ],
  },
  {
    title: 'অ্যাকাউন্ট',
    items: [
      {
        id: 'profile',
        label: 'প্রোফাইল',
        labelEn: 'Profile',
        icon: UserCircle,
        href: '/teacher/profile',
      },
      {
        id: 'settings',
        label: 'সেটিংস',
        labelEn: 'Settings',
        icon: Settings,
        href: '/teacher/settings',
      },
    ],
  },
];

export default function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const userName =
    user?.user_metadata?.name || user?.email?.split('@')[0] || 'শিক্ষক';
  const userEmail = user?.email || '';
  const userInitial = userName[0]?.toUpperCase() || 'T';

  return (
    <>
      {/* Mobile Trigger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="w-full lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-xl rounded-b-none sm:rounded-b-xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-lg border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:scale-105 active:scale-95 transition-all"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full z-50 transition-all duration-300 ease-in-out',
          'bg-white dark:bg-neutral-950 border-r border-neutral-200 dark:border-neutral-800',
          isCollapsed ? 'w-20' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-100 dark:border-neutral-800">
            {!isCollapsed && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <GraduationCap size={18} className="text-white" />
                </div>
                <div>
                  <span className="text-base font-black bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    Obhyash
                  </span>
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block -mt-0.5">
                    Teacher Panel
                  </span>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 mx-auto">
                <GraduationCap size={18} className="text-white" />
              </div>
            )}
            <button
              onClick={() => {
                if (isMobileOpen) setIsMobileOpen(false);
                else setIsCollapsed(!isCollapsed);
              }}
              className="hidden lg:flex p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </button>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Upload Button */}
          {!isCollapsed && (
            <div className="px-4 pt-5 pb-2">
              <Link
                href="/teacher/question-management"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Upload size={16} />
                প্রশ্ন আপলোড করুন
              </Link>
            </div>
          )}
          {isCollapsed && (
            <div className="px-3 pt-5 pb-2">
              <Link
                href="/teacher/question-management"
                title="প্রশ্ন আপলোড করুন"
                className="flex items-center justify-center w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:scale-[1.05] active:scale-[0.95] transition-all"
              >
                <Upload size={18} />
              </Link>
            </div>
          )}

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
            {TEACHER_NAVIGATION.map((group, idx) => (
              <div key={idx}>
                {!isCollapsed && group.title && (
                  <h3 className="px-3 mb-2 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">
                    {group.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                          isActive
                            ? 'bg-emerald-50 dark:bg-emerald-900/15 text-emerald-700 dark:text-emerald-400 font-semibold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white',
                          isCollapsed && 'justify-center',
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full" />
                        )}
                        <item.icon
                          size={20}
                          className={cn(
                            'shrink-0 transition-colors',
                            isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300',
                          )}
                        />
                        {!isCollapsed && (
                          <div className="flex flex-col">
                            <span className="text-sm">{item.label}</span>
                            <span className="text-[10px] text-neutral-400 font-medium">
                              {item.labelEn}
                            </span>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer - User Profile + Actions */}
          <div className="border-t border-neutral-100 dark:border-neutral-800">
            {/* User Profile */}
            {!isCollapsed ? (
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                    {userInitial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                      {userName}
                    </p>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {userEmail}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full flex-shrink-0">
                    শিক্ষক
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <Link
                    href="/teacher/settings"
                    onClick={() => setIsMobileOpen(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-700 dark:hover:text-neutral-200 transition-all"
                  >
                    <Settings size={14} />
                    সেটিংস
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all"
                  >
                    <LogOut size={14} />
                    লগ আউট
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 space-y-1.5">
                <div
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm mx-auto shadow-md"
                  title={userName}
                >
                  {userInitial}
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all"
                  title="লগ আউট"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
