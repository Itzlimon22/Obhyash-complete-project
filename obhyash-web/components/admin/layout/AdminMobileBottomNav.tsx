'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileQuestion,
  Flag,
  Menu,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminMobileBottomNavProps {
  onMenuClick: () => void;
}

const AdminMobileBottomNav: React.FC<AdminMobileBottomNavProps> = ({
  onMenuClick,
}) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Home',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
    },
    {
      label: 'Users',
      icon: Users,
      href: '/admin/user-management',
    },
    {
      label: 'Question',
      icon: FileQuestion,
      href: '/admin/question-management',
    },
    {
      label: 'Reports',
      icon: Flag,
      href: '/admin/reports',
      count: 0,
    },
    {
      label: 'Complain',
      icon: AlertTriangle,
      href: '/admin/complaints',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-800/50 pb-safe z-50 lg:hidden px-4 md:px-8 h-16 flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 group relative flex-1 min-w-0"
          >
            <div
              className={cn(
                'relative flex items-center justify-center h-8 w-14 rounded-full transition-all duration-300 ease-out',
                isActive
                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'text-neutral-500 dark:text-neutral-400 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800',
              )}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  'transition-transform duration-300',
                  isActive && 'scale-110',
                )}
              />
              {item.count && item.count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-neutral-900">
                  {item.count}
                </span>
              )}
            </div>
            <span
              className={cn(
                'text-[10px] font-bold tracking-tight transition-colors duration-300 truncate w-full text-center',
                isActive
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-500 dark:text-neutral-500',
              )}
            >
              {item.label}
            </span>
          </Link>
        );
      })}

      <button
        onClick={onMenuClick}
        className="flex flex-col items-center justify-center gap-1 group flex-1 min-w-0"
      >
        <div className="flex items-center justify-center h-8 w-14 rounded-full text-neutral-500 dark:text-neutral-400 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-800 transition-all duration-300">
          <Menu size={22} />
        </div>
        <span className="text-[10px] font-bold tracking-tight text-neutral-500 dark:text-neutral-500">
          Menu
        </span>
      </button>
    </nav>
  );
};

export default AdminMobileBottomNav;
