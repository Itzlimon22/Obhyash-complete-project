'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart2,
  Receipt,
  Users,
  FileBarChart,
  Settings,
  LogOut,
  Zap,
} from 'lucide-react';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { cn } from '@/lib/utils';

export interface NavLinkItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavLinkItem[] = [
  { id: 'dashboard', label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { id: 'statistics', label: 'Statistics', href: '/admin/analytics', icon: BarChart2 },
  { id: 'transaction', label: 'Transaction', href: '/admin/subscriptions', icon: Receipt },
  { id: 'my-team', label: 'My Team', href: '/admin/user-management', icon: Users },
  { id: 'sell-reports', label: 'Sell Reports', href: '/admin/reports', icon: FileBarChart },
  { id: 'settings', label: 'Settings', href: '/admin/settings', icon: Settings },
];

export interface NiondSidebarProps {
  className?: string;
  adminName?: string;
  adminRole?: string;
  adminAvatar?: string;
}

export const NiondSidebar: React.FC<NiondSidebarProps> = ({
  className,
  adminName = 'Nora Watson',
  adminRole = 'Sales Manager',
  adminAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=face',
}) => {
  const pathname = usePathname();
  const { signOut } = useAdminAuth();

  return (
    <aside
      className={cn(
        'w-64 min-h-screen p-6 flex flex-col justify-between shrink-0',
        'bg-white dark:bg-[#151515] border-r border-slate-100/80 dark:border-zinc-800/80',
        className,
      )}
    >
      <div>
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <div className="w-9 h-9 rounded-2xl bg-slate-950 dark:bg-white flex items-center justify-center text-white dark:text-slate-950 shadow-sm">
            {/* Stylized Double Slash / Niond Mark */}
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-4.5 bg-[#c6f634] rounded-full transform -skew-x-12" />
              <span className="w-1.5 h-4.5 bg-white dark:bg-slate-950 rounded-full transform -skew-x-12" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-slate-950 dark:text-white">
              Niond
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block -mt-1">
              Obhyash OS
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5" aria-label="Main Navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin/dashboard'
                ? pathname === '/admin/dashboard' || pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  'flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs font-bold transition-all duration-200',
                  isActive
                    ? 'bg-[#c6f634] text-slate-950 shadow-sm'
                    : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-900/60',
                )}
              >
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0 transition-transform duration-200',
                    isActive ? 'text-slate-950 stroke-[2.5]' : 'opacity-70 group-hover:scale-110',
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Profile & Logout Card */}
      <div className="pt-6 border-t border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3 px-2 mb-4">
          <img
            src={adminAvatar}
            alt={adminName}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-zinc-800 shadow-sm"
          />
          <div className="truncate">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {adminName}
            </h4>
            <p className="text-[11px] text-slate-400 dark:text-zinc-400 font-medium truncate">
              {adminRole}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => signOut?.()}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

export default NiondSidebar;
