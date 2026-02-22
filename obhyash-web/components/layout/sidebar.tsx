'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // ✅ Next.js Routing Hook
import {
  ChevronRight,
  ChevronsLeft,
  Command,
  X,
  LayoutDashboard,
  Users,
  CreditCard,
  FileQuestion,
  Flag,
  BarChart3,
  Settings,
  LogOut,
  Layers,
  BookOpen,
  Bell,
  AlertTriangle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/utils/supabase';

// --- Types ---
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string; // ✅ Changed from 'id' to 'href' for routing
  hasSubmenu?: boolean;
  count?: number;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isMobile: boolean;
}

// --- Navigation Data (Bengali Localized) ---
const SIDEBAR_NAVIGATION: { title?: string; items: NavItem[] }[] = [
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
        id: 'analytics',
        label: 'অ্যানালিটিক্স',
        icon: BarChart3,
        href: '/admin/analytics',
      },
    ],
  },
  {
    title: 'ম্যানেজমেন্ট',
    items: [
      {
        id: 'users',
        label: 'ইউজার ম্যানেজমেন্ট',
        icon: Users,
        href: '/admin/user-management',
        count: 23,
      },
      {
        id: 'questions',
        label: 'প্রশ্ন ব্যাংক',
        icon: FileQuestion,
        href: '/admin/question-management',
      },
      {
        id: 'subscriptions',
        label: 'সাবস্ক্রিপশন',
        icon: CreditCard,
        href: '/admin/subscriptions',
      },
      {
        id: 'reports',
        label: 'রিপোর্টসমূহ',
        icon: Flag,
        href: '/admin/reports',
        count: 5,
      },
      {
        id: 'notifications',
        label: 'নোটিফিকেশন',
        icon: Bell,
        href: '/admin/notifications',
      },
      {
        id: 'omr-check',
        label: 'ওএমআর চেকিং',
        icon: FileQuestion,
        href: '/admin/omr-check',
      },
      {
        id: 'complaints',
        label: 'অভিযোগ কেন্দ্র',
        icon: AlertTriangle,
        href: '/admin/complaints',
        count: 0,
      },
    ],
  },
];

const BOTTOM_NAVIGATION: NavItem[] = [
  {
    id: 'settings',
    label: 'সেটিংস',
    icon: Settings,
    href: '/admin/settings',
  },
  { id: 'logout', label: 'লগ আউট', icon: LogOut, href: '/auth/logout' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  isMobile,
}) => {
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const toggleSubmenu = (id: string) => {
    setExpandedMenus((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  /**
   * Helper component for rendering individual navigation links.
   */
  const NavItemComponent: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive =
      pathname === item.href || pathname?.startsWith(`${item.href}/`);
    const isExpanded = expandedMenus.includes(item.id);

    // Visibility Logic
    const showLabel = isMobile ? true : isOpen;

    const Content = (
      <>
        {/* Active Strip */}
        {isActive && (
          <div className="absolute left-0 top-2 bottom-2 w-1.5 bg-red-600 rounded-r-full shadow-lg shadow-red-500/40" />
        )}

        {/* Icon */}
        <item.icon
          size={isMobile ? 22 : 20}
          strokeWidth={isActive ? 3 : 2}
          className={`
            flex-shrink-0 transition-all duration-300
            ${isActive ? 'text-red-600 dark:text-red-400 scale-110' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'}
            ${item.id === 'logout' ? 'text-red-500 group-hover:text-red-600' : ''}
          `}
        />

        {/* Label */}
        <span
          className={`
            ml-4 text-sm font-black whitespace-nowrap overflow-hidden transition-all duration-300 tracking-tight
            ${showLabel ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 hidden'}
            ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'}
            ${item.id === 'logout' ? 'text-red-600 dark:text-red-400' : ''}
          `}
        >
          {item.label}
        </span>

        {/* Badges & Submenu Indicators */}
        {showLabel && (
          <div className="ml-auto flex items-center">
            {item.count !== undefined && item.count > 0 && (
              <span
                className={`
                  text-[10px] font-black px-2.5 py-1 rounded-full mr-2 shadow-sm
                  ${
                    isActive
                      ? 'bg-red-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }
                `}
              >
                {item.count > 9 ? '9+' : item.count}
              </span>
            )}
            {item.hasSubmenu && (
              <ChevronRight
                size={18}
                strokeWidth={3}
                className={`text-neutral-400 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-red-600' : ''}`}
              />
            )}
          </div>
        )}
      </>
    );

    const containerClass = `
      group flex items-center w-full px-4 py-2 sm:py-3 rounded-2xl transition-all duration-300 border border-transparent mx-auto relative
      ${
        isActive
          ? 'bg-red-50 text-red-700 dark:bg-red-500/10'
          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800/50 dark:hover:text-white'
      }
      ${!isOpen && !isMobile && 'justify-center px-0'}
      ${item.id === 'logout' ? 'mt-4 bg-red-50/50 dark:bg-red-950/20 active:scale-95' : 'active:scale-[0.98]'}
    `;

    if (item.id === 'logout') {
      return (
        <div className="mb-1 sm:mb-2 relative">
          <button onClick={handleLogout} className={containerClass}>
            {Content}
          </button>
        </div>
      );
    }

    return (
      <div className="mb-1 sm:mb-2 relative">
        {item.hasSubmenu ? (
          <button
            onClick={() => toggleSubmenu(item.id)}
            className={containerClass}
          >
            {Content}
          </button>
        ) : (
          <Link
            href={item.href}
            className={containerClass}
            onClick={() => isMobile && setIsOpen(false)}
          >
            {Content}
          </Link>
        )}

        {/* Submenu Children */}
        {showLabel && item.hasSubmenu && (
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="ml-10 mt-1 space-y-1 border-l-2 border-neutral-100 dark:border-neutral-800 pl-4 py-1">
              <Link
                href={`${item.href}/create`}
                className="block w-full text-left px-3 py-2 text-xs font-black text-neutral-500 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400 transition-colors rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                নতুন যুক্ত করুন
              </Link>
              <Link
                href={`${item.href}/archive`}
                className="block w-full text-left px-3 py-2 text-xs font-black text-neutral-500 hover:text-red-600 dark:text-neutral-500 dark:hover:text-red-400 transition-colors rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
              >
                আর্কাইভ
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSidebarClasses = () => {
    const baseClasses =
      'fixed top-0 left-0 z-[60] h-screen transition-all duration-500 ease-in-out flex flex-col bg-white border-r border-neutral-200 dark:bg-black dark:border-neutral-800';

    if (isMobile) {
      return `${baseClasses} w-[85vw] max-w-xs rounded-r-[2.5rem] ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`;
    } else {
      return `${baseClasses} translate-x-0 ${isOpen ? 'w-64' : 'w-20'}`;
    }
  };

  return (
    <aside className={getSidebarClasses()}>
      {/* Header */}
      <div className="h-20 flex items-center justify-between px-6 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/10">
        <div
          className={`flex items-center gap-3 transition-all ${!isOpen && !isMobile && 'justify-center w-full'}`}
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center flex-shrink-0 shadow-xl shadow-red-500/30 ring-2 ring-white/20">
            <Command size={22} strokeWidth={3} className="text-white" />
          </div>
          <span
            className={`font-black text-xl text-neutral-900 dark:text-white whitespace-nowrap tracking-tight transition-all duration-300 ${isOpen || isMobile ? 'opacity-100 scale-100' : 'opacity-0 scale-90 hidden'}`}
          >
            Obhyash
          </span>
        </div>

        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-neutral-400 hover:text-red-600 dark:text-neutral-500 dark:hover:text-white transition-all bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-100 dark:border-neutral-800 active:scale-90"
          >
            <X size={20} strokeWidth={3} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 sm:py-8 space-y-4 sm:space-y-10">
        {SIDEBAR_NAVIGATION.map((section, idx) => (
          <div key={idx} className="space-y-2">
            {section.title && (isOpen || isMobile) && (
              <h3 className="px-4 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.3em] mb-2 sm:mb-4">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItemComponent key={item.id} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/20">
        <div className="space-y-1">
          {BOTTOM_NAVIGATION.map((item) => (
            <NavItemComponent key={item.id} item={item} />
          ))}
        </div>
      </div>

      {/* Desktop Toggle Button */}
      {!isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-4 top-24 bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 p-2 rounded-2xl shadow-xl hover:text-red-600 dark:hover:text-white transition-all z-50 hover:scale-110 group active:scale-90"
          aria-label="Toggle Sidebar"
        >
          <ChevronsLeft
            size={14}
            strokeWidth={3}
            className={`transition-transform duration-500 group-hover:animate-pulse ${!isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </aside>
  );
};
