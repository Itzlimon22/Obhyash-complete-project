'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileQuestion,
  FileText,
  Flag,
  BarChart2,
  Layers,
  BookOpen,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Upload,
  PanelLeftClose
} from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility, or use a simple join

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'User Management', href: '/users' },
  { icon: CreditCard, label: 'Subscriptions', href: '/subscriptions' },
  {
    icon: FileQuestion,
    label: 'Question Management',
    href: '#',
    subItems: [
      { label: 'All Questions', href: '/questions' },
      { label: 'Bulk Upload', href: '/questions/upload', icon: Upload }, // 👈 Added Here
    ]
  },
  {
    icon: FileText,
    label: 'Exam Management',
    href: '#',
    subItems: [
      { label: 'All Exams', href: '/exams' },
      { label: 'Create Exam', href: '/exams/create' },
    ]
  },
  { icon: Flag, label: 'Reports', href: '/reports' },
  { icon: BarChart2, label: 'Analytics', href: '/analytics' },
  { icon: Layers, label: 'Segments', href: '/segments' },
  { icon: BookOpen, label: 'Study Materials', href: '/study-materials' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>(['Question Management']);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) ? prev.filter(item => item !== label) : [...prev, label]
    );
  };

  return (
    <aside className="w-64 bg-black border-r border-white/10 text-white flex flex-col h-screen fixed left-0 top-0 z-40">
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder - Matches image style */}
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            অভ্যাস
          </span>
        </div>
        <PanelLeftClose className="w-5 h-5 text-gray-400 cursor-pointer hover:text-white" />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.subItems ? (
              // Collapsible Menu Item
              <div>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    "hover:bg-white/5 text-gray-400 hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  {openMenus.includes(item.label) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                
                {/* Sub Menu */}
                {openMenus.includes(item.label) && (
                  <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.label}
                        href={sub.href}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                          pathname === sub.href
                            ? "bg-blue-600/10 text-blue-400"
                            : "text-gray-500 hover:text-white hover:bg-white/5"
                        )}
                      >
                        {sub.icon && <sub.icon className="w-4 h-4" />}
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Standard Menu Item
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href || (item.label === 'Dashboard' && pathname === '/')
                    ? "bg-[#1f1f23] text-white" // Active State
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Footer Links */}
      <div className="p-4 border-t border-white/10 space-y-1">
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
          <LogOut className="w-5 h-5" />
          Back to App
        </button>
      </div>
    </aside>
  );
}