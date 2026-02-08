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

// --- Navigation Data (Mapped to your Routes) ---
const SIDEBAR_NAVIGATION: { title?: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        href: '/admin/dashboard',
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: BarChart3,
        href: '/admin/analytics',
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        id: 'users',
        label: 'User Management',
        icon: Users,
        href: '/admin/user-management',
        count: 23,
      },
      {
        id: 'questions',
        label: 'Question Management',
        icon: FileQuestion,
        href: '/admin/question-management',
      },
      {
        id: 'subscriptions',
        label: 'Subscriptions',
        icon: CreditCard,
        href: '/admin/subscriptions',
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: Flag,
        href: '/admin/reports',
        count: 5,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        href: '/admin/notifications',
      },
      {
        id: 'omr-check',
        label: 'OMR Check',
        icon: FileQuestion,
        href: '/admin/omr-check',
      },
      {
        id: 'complaints',
        label: 'Complaints',
        icon: AlertTriangle,
        href: '/admin/complaints',
        count: 0, // Will be updated dynamically if possible
      },
    ],
  },
];

const BOTTOM_NAVIGATION: NavItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/admin/settings',
  },
  { id: 'logout', label: 'Log Out', icon: LogOut, href: '/auth/logout' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  setIsOpen,
  isMobile,
}) => {
  const pathname = usePathname(); // ✅ Get current URL path
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
    // ✅ Logic Update: Active if the URL matches the href
    const isActive =
      pathname === item.href || pathname?.startsWith(`${item.href}/`);
    const isExpanded = expandedMenus.includes(item.id);

    // Visibility Logic
    const showLabel = isMobile ? true : isOpen;

    const Content = (
      <>
        {/* Active Strip */}
        {isActive && (
          <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-rose-600 rounded-r-full" />
        )}

        {/* Icon */}
        <item.icon
          size={20}
          className={`
            flex-shrink-0 transition-colors 
            ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'}
            ${item.id === 'logout' ? 'text-rose-500 group-hover:text-rose-600' : ''}
          `}
        />

        {/* Label */}
        <span
          className={`
            ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 
            ${showLabel ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 hidden'}
            ${item.id === 'logout' ? 'text-red-600 dark:text-red-400 group-hover:text-red-700 dark:group-hover:text-red-300' : ''}
          `}
        >
          {item.label}
        </span>

        {/* Badges & Submenu Indicators */}
        {showLabel && (
          <div className="ml-auto flex items-center">
            {item.count !== undefined && (
              <span
                className={`
                  text-[10px] font-bold px-2 py-0.5 rounded-full mr-2
                  ${
                    isActive
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                  }
                `}
              >
                {item.count > 9 ? '9+' : item.count}
              </span>
            )}
            {item.hasSubmenu && (
              <ChevronRight
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              />
            )}
          </div>
        )}
      </>
    );

    const containerClass = `
      group flex items-center w-full px-3 py-2.5 rounded-lg transition-all duration-200 ease-in-out border border-transparent mx-auto relative
      ${
        isActive
          ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-100'
          : 'text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white'
      }
      ${!isOpen && !isMobile && 'justify-center px-0'}
      ${item.id === 'logout' ? 'hover:bg-rose-50 dark:hover:bg-rose-900/20' : ''}
    `;

    if (item.id === 'logout') {
      return (
        <div className="mb-1 relative">
          <button onClick={handleLogout} className={containerClass}>
            {Content}
          </button>
        </div>
      );
    }

    return (
      <div className="mb-1 relative">
        {item.hasSubmenu ? (
          // Submenu Parent (Button)
          <button
            onClick={() => toggleSubmenu(item.id)}
            className={containerClass}
          >
            {Content}
          </button>
        ) : (
          // Standard Link (Next.js Link)
          <Link
            href={item.href}
            className={containerClass}
            onClick={() => isMobile && setIsOpen(false)} // Close sidebar on mobile click
          >
            {Content}
          </Link>
        )}

        {/* Submenu Children */}
        {showLabel && item.hasSubmenu && (
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="ml-9 mt-1 space-y-1 border-l border-gray-200 dark:border-zinc-800 pl-3">
              <Link
                href={`${item.href}/create`}
                className="block w-full text-left px-2 py-2 text-xs font-medium text-neutral-500 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
              >
                Create New
              </Link>
              <Link
                href={`${item.href}/archive`}
                className="block w-full text-left px-2 py-2 text-xs font-medium text-neutral-500 hover:text-rose-600 dark:text-neutral-500 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
              >
                Archived
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSidebarClasses = () => {
    // Replaced 'bg-paper-100' with 'bg-gray-100' and 'bg-obsidian-900' with 'bg-black' for standard Tailwind support
    const baseClasses =
      'fixed top-0 left-0 z-[60] h-screen transition-all duration-300 flex flex-col bg-white border-r border-neutral-200 dark:bg-black dark:border-neutral-800';

    if (isMobile) {
      return `${baseClasses} w-72 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`;
    } else {
      return `${baseClasses} translate-x-0 ${isOpen ? 'w-64' : 'w-20'}`;
    }
  };

  return (
    <aside className={getSidebarClasses()}>
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/10">
        <div
          className={`flex items-center gap-3 transition-all ${!isOpen && !isMobile && 'justify-center w-full'}`}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-600 to-rose-700 flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-500/20 ring-1 ring-white/10">
            <Command size={16} className="text-white" />
          </div>
          <span
            className={`font-bold text-lg text-gray-900 dark:text-white whitespace-nowrap transition-opacity duration-300 ${isOpen || isMobile ? 'opacity-100' : 'opacity-0 hidden'}`}
          >
            Obhyash
          </span>
        </div>

        {isMobile && (
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 py-6 space-y-8">
        {SIDEBAR_NAVIGATION.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {section.title && (isOpen || isMobile) && (
              <h3 className="px-3 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                {section.title}
              </h3>
            )}
            {section.items.map((item) => (
              <NavItemComponent key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5">
        {BOTTOM_NAVIGATION.map((item) => (
          <NavItemComponent key={item.id} item={item} />
        ))}
      </div>

      {/* Desktop Toggle Button */}
      {!isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="absolute -right-3 top-20 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 p-1.5 rounded-full shadow-lg hover:text-rose-600 dark:hover:text-white transition-all z-50 hover:scale-110"
          aria-label="Toggle Sidebar"
        >
          <ChevronsLeft
            size={12}
            className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </aside>
  );
};
