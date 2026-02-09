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
      className={`relative p-2 md:p-2.5 rounded-full transition-all duration-300 group flex items-center justify-center border ${
        isOpen
          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 shadow-sm shadow-rose-100 dark:shadow-none'
          : 'bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm border-neutral-200/60 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 hover:border-rose-200 dark:hover:border-rose-900/50 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400'
      }`}
      aria-label="Notifications"
    >
      <Bell
        className={`w-4.5 h-4.5 md:w-5 md:h-5 transition-all duration-300 ${isOpen ? 'scale-110' : 'group-hover:scale-110 group-active:scale-95'}`}
        strokeWidth={2}
      />

      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[10px] font-bold text-white ring-4 ring-white dark:ring-[#0c0a09] transition-all duration-300 group-hover:scale-110 shadow-lg shadow-rose-500/20">
          {unreadCount > 99 ? '99+' : unreadCount}
          <span className="absolute inset-0 rounded-full bg-rose-600 animate-ping opacity-25"></span>
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
