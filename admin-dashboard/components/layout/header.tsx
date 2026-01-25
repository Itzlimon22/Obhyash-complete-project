'use client';

import { Bell } from 'lucide-react';
import { UserNav } from './user-nav'; // 👈 Import the new component

export function Header() {
  return (
    <header className="h-16 bg-black border-b border-white/10 flex items-center justify-end px-8 sticky top-0 z-30">
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        <button className="relative text-gray-400 hover:text-white transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 bg-red-600 text-[10px] font-bold text-white w-4 h-4 flex items-center justify-center rounded-full border-2 border-black">
            9+
          </span>
        </button>
        {/* User Profile Dropdown */}
        <UserNav /> {/* 👈 Replaces the static 'A' div */}
      </div>
    </header>
  );
}
