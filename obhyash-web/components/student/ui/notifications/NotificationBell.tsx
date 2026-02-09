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
    e.stopPropagation(); // Prevent propagation just in case
    console.log('Notification bell clicked, isOpen:', isOpen);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`relative p-1.5 md:p-2 transition-all duration-300 group flex items-center justify-center ${
        isOpen
          ? 'text-rose-600 dark:text-rose-400'
          : 'text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400'
      }`}
      aria-label="Notifications"
    >
      <Bell
        className={`w-4.5 h-4.5 md:w-5 md:h-5 transition-all duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-110 group-active:scale-95'}`}
        strokeWidth={2}
      />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white ring-4 ring-white dark:ring-[#0c0a09] transition-all duration-300 group-hover:scale-110 shadow-lg shadow-emerald-500/20">
          {unreadCount > 99 ? '99+' : unreadCount}
          <span className="absolute inset-0 rounded-full bg-emerald-600 animate-ping opacity-25"></span>
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
