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
import { motion, AnimatePresence } from 'framer-motion';
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
      label: 'ড্যাশবোর্ড',
      icon: LayoutDashboard,
      href: '/admin/dashboard',
    },
    {
      label: 'ইউজার',
      icon: Users,
      href: '/admin/user-management',
    },
    {
      label: 'প্রশ্ন',
      icon: FileQuestion,
      href: '/admin/question-management',
    },
    {
      label: 'রিপোর্ট',
      icon: Flag,
      href: '/admin/reports',
      count: 0,
    },
    {
      label: 'অভিযোগ',
      icon: AlertTriangle,
      href: '/admin/complaints',
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/60 dark:bg-black/60 backdrop-blur-2xl border-t border-neutral-200/50 dark:border-neutral-800/50 pb-safe z-50 lg:hidden px-2 flex justify-around items-center h-20 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href || pathname?.startsWith(`${item.href}/`);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-1 group relative flex-1 min-w-0 py-2 h-full"
          >
            <div className="relative flex items-center justify-center mb-1">
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="activeTabCircle"
                    className="absolute inset-0 bg-red-600 rounded-2xl -m-2.5 shadow-lg shadow-red-500/30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{
                      type: 'spring',
                      stiffness: 400,
                      damping: 25,
                    }}
                  />
                )}
              </AnimatePresence>

              <Icon
                size={22}
                strokeWidth={isActive ? 3 : 2}
                className={cn(
                  'relative z-10 transition-all duration-300',
                  isActive
                    ? 'text-white'
                    : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white',
                )}
              />

              {item.count && item.count > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-black z-20 shadow-sm">
                  {item.count}
                </span>
              )}
            </div>
            <span
              className={cn(
                'text-[9px] font-black tracking-tight transition-colors duration-300 truncate w-full text-center relative z-10 uppercase',
                isActive
                  ? 'text-red-600 dark:text-red-400 mt-0.5'
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
        className="flex flex-col items-center justify-center gap-1 group flex-1 min-w-0 py-2 h-full"
      >
        <div className="flex items-center justify-center p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-500 group-hover:text-red-600 transition-all duration-300 relative shadow-inner">
          <Menu size={22} strokeWidth={3} className="relative z-10" />
        </div>
        <span className="text-[9px] font-black tracking-tight text-neutral-500 uppercase mt-0.5">
          মেনু
        </span>
      </button>
    </nav>
  );
};

export default AdminMobileBottomNav;
