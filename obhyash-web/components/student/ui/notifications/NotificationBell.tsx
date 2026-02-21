import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
  isOpen: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  unreadCount,
  onClick,
  isOpen,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-1.5 md:p-2 transition-all duration-200 group flex items-center justify-center rounded-xl ${
        isOpen
          ? 'text-emerald-700 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
          : 'text-neutral-500 dark:text-neutral-400 hover:text-emerald-700 dark:hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
      }`}
      aria-label="নোটিফিকেশন"
    >
      <Bell
        className={`w-5 h-5 transition-all duration-200 ${isOpen ? 'scale-110' : 'group-hover:scale-110 group-active:scale-95'}`}
        strokeWidth={2}
      />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white ring-2 ring-white dark:ring-neutral-950 transition-all duration-200 group-hover:scale-110 shadow-md">
          {unreadCount > 99 ? '99+' : unreadCount}
          <span className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20" />
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
