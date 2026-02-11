'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FileQuestion,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider'; // Fixed import path

const TEACHER_NAVIGATION = [
  {
    title: 'ওভারভিউ',
    items: [
      {
        id: 'dashboard',
        label: 'ড্যাশবোর্ড',
        icon: LayoutDashboard,
        href: '/teacher/dashboard',
      },
    ],
  },
  {
    title: 'ম্যানেজমেন্ট',
    items: [
      {
        id: 'questions',
        label: 'প্রশ্ন ব্যাংক',
        icon: FileQuestion,
        href: '/teacher/question-management',
      },
    ],
  },
];

export default function TeacherSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Trigger */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-neutral-900 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400"
      >
        <Menu size={20} />
      </button>

      {/* Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 z-50 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20' : 'w-72',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-800">
            {!isCollapsed && (
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Obhyash Teacher
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-thin scrollbar-thumb-neutral-200 dark:scrollbar-thumb-neutral-800">
            {TEACHER_NAVIGATION.map((group, idx) => (
              <div key={idx}>
                {!isCollapsed && group.title && (
                  <h3 className="px-3 mb-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
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
                            ? 'bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 font-medium'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white',
                          isCollapsed && 'justify-center',
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <item.icon
                          size={20}
                          className={cn(
                            'shrink-0 transition-colors',
                            isActive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-neutral-500 group-hover:text-neutral-700 dark:text-neutral-400 dark:group-hover:text-neutral-200',
                          )}
                        />
                        {!isCollapsed && <span>{item.label}</span>}
                        {isActive && !isCollapsed && (
                          <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
            <button
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white',
                isCollapsed && 'justify-center',
              )}
            >
              <Settings size={20} className="shrink-0" />
              {!isCollapsed && <span>সেটিংস</span>}
            </button>
            <button
              onClick={handleSignOut}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/10',
                isCollapsed && 'justify-center',
              )}
            >
              <LogOut size={20} className="shrink-0" />
              {!isCollapsed && <span>লগ আউট</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
