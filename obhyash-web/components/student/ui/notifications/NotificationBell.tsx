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
      className="relative flex items-center justify-center p-0.5 text-neutral-600 dark:text-[#D4D4D4] hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer active:scale-95"
      aria-label="নোটিফিকেশন"
    >
      <Bell
        size={24}
        strokeWidth={1.8}
        className="transition-transform"
      />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9.5px] font-bold text-white ring-1.5 ring-white dark:ring-black select-none pointer-events-none">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
