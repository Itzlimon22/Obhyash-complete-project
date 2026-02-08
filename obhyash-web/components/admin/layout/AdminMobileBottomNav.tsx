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

interface AdminMobileBottomNavProps {
  onMenuClick: () => void;
}

const AdminMobileBottomNav: React.FC<AdminMobileBottomNavProps> = ({
  onMenuClick,
}) => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
    },
    {
      label: 'Users',
      icon: Users,
      href: '/admin/user-management',
    },
    {
      label: 'Questions',
      icon: FileQuestion,
      href: '/admin/question-management',
    },
    {
      label: 'Reports',
      icon: Flag,
      href: '/admin/reports',
      count: 5, // Mock count for now, could be passed as props
    },
    {
      label: 'Complaints',
      icon: AlertTriangle,
      href: '/admin/complaints',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-obsidian-950/90 backdrop-blur-lg border-t border-neutral-200 dark:border-obsidian-800 pb-safe z-50 lg:hidden px-2 py-1 flex justify-around items-center shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 relative ${
              isActive
                ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10'
                : 'text-neutral-500 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-bold tracking-tight uppercase">
              {item.label}
            </span>

            {item.count && item.count > 0 && (
              <span className="absolute top-1.5 right-3 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-obsidian-950">
                {item.count}
              </span>
            )}

            {isActive && (
              <div className="absolute -top-[1px] left-1/4 right-1/4 h-[2px] bg-rose-600 dark:bg-rose-500 rounded-full" />
            )}
          </Link>
        );
      })}

      <button
        onClick={onMenuClick}
        className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 w-16 text-neutral-500 dark:text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-900"
      >
        <Menu size={20} />
        <span className="text-[10px] font-bold tracking-tight uppercase">
          Menu
        </span>
      </button>
    </nav>
  );
};

export default AdminMobileBottomNav;
