import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  CreditCard,
  Settings,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  MessageSquare,
} from 'lucide-react';

interface ProfileDropdownProps {
  user?: {
    name: string;
    email?: string;
    institute?: string;
  } | null;
  onLogout: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  onNavigate: (path: string) => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  user,
  onLogout,
  toggleTheme,
  isDarkMode,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const menuItems = [
    {
      label: 'আমার প্রোফাইল',
      icon: User,
      action: () => onNavigate('profile'),
    },
    {
      label: 'সাবস্ক্রিপশন ও বিল্ডিং',
      icon: CreditCard,
      action: () => onNavigate('subscription'),
    },
    {
      label: 'সেটিংস',
      icon: Settings,
      action: () => onNavigate('settings'),
    },
    {
      label: 'অভিযোগ ও পরামর্শ',
      icon: MessageSquare,
      action: () => onNavigate('complaint'),
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-rose-600 text-white font-bold text-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow border-2 border-white dark:border-neutral-800"
      >
        {user?.name?.[0] || 'A'}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-14 w-72 bg-white dark:bg-neutral-900 rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3 bg-neutral-50/50 dark:bg-neutral-800/20">
            <div className="w-12 h-12 rounded-full bg-rose-600 text-white font-bold text-xl flex items-center justify-center shrink-0 shadow-sm">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="overflow-hidden">
              <h4 className="font-bold text-neutral-900 dark:text-white text-base truncate">
                {user?.name || 'আপনি (You)'}
              </h4>
              <p className="text-xs text-neutral-500 truncate">
                {user?.institute || 'Student'}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {menuItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  item.action();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors text-sm font-medium"
              >
                <item.icon className="w-4 h-4 text-neutral-400" />
                {item.label}
              </button>
            ))}

            {/* Divider */}
            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-2 mx-1"></div>

            {/* Dark Mode Toggle */}
            <div
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer select-none"
              onClick={toggleTheme}
            >
              <div className="flex items-center gap-3 text-neutral-600 dark:text-neutral-300 text-sm font-medium">
                {isDarkMode ? (
                  <Moon className="w-4 h-4 text-neutral-400" />
                ) : (
                  <Sun className="w-4 h-4 text-neutral-400" />
                )}
                ডার্ক মোড
              </div>
              <div
                className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 flex items-center ${
                  isDarkMode ? 'bg-indigo-600' : 'bg-neutral-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${
                    isDarkMode ? 'tranneutral-x-4' : 'tranneutral-x-0'
                  }`}
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-2 mx-1"></div>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-sm font-bold"
            >
              <LogOut className="w-4 h-4" />
              লগ আউট
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
