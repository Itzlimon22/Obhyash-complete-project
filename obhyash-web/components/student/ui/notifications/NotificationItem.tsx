import React from 'react';
import { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Bell, Trophy, TrendingUp, Megaphone, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
}) => {
  const getRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: bn,
      });
    } catch {
      return 'সম্প্রতি';
    }
  };

  // Per-type icon + palette — deep green, red, black/white only (no rose/amber)
  const getIconConfig = () => {
    switch (notification.type) {
      case 'exam_result':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          bgColor: 'bg-emerald-700',
          textColor: 'text-white',
        };
      case 'achievement':
        return {
          icon: <Trophy className="w-4 h-4" />,
          bgColor: 'bg-neutral-900 dark:bg-white',
          textColor: 'text-white dark:text-black',
        };
      case 'level_up':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          bgColor: 'bg-emerald-900',
          textColor: 'text-white',
        };
      case 'announcement':
        return {
          icon: <Megaphone className="w-4 h-4" />,
          bgColor: 'bg-red-600',
          textColor: 'text-white',
        };
      case 'system':
        return {
          icon: <Settings className="w-4 h-4" />,
          bgColor: 'bg-neutral-200 dark:bg-neutral-700',
          textColor: 'text-neutral-700 dark:text-neutral-300',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4" />,
          bgColor: 'bg-neutral-200 dark:bg-neutral-700',
          textColor: 'text-neutral-700 dark:text-neutral-300',
        };
    }
  };

  const config = getIconConfig();

  return (
    <div
      onClick={onClick}
      className={cn(
        'group px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer relative overflow-hidden transition-all duration-150 active:bg-neutral-100 dark:active:bg-neutral-800',
        !notification.is_read
          ? 'bg-[#12544F]/6 dark:bg-[#12544F]/12'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/50',
      )}
    >
      {/* Unread indicator bar — Viridian Forest #12544F */}
      {!notification.is_read && (
        <div className="absolute left-0 top-0 bottom-0 w-[3.5px] bg-[#12544F] dark:bg-[#34D399]" />
      )}

      <div className="flex items-start gap-3.5 relative z-10">
        {/* Square icon badge (42x42, rounded-[13px] matching Flutter) */}
        <div
          className={cn(
            'flex-shrink-0 w-10.5 h-10.5 rounded-[13px] flex items-center justify-center shadow-2xs transition-transform duration-200 group-hover:scale-105 group-active:scale-95',
            config.bgColor,
            config.textColor,
          )}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4
              className={cn(
                "text-[14px] font-bold leading-snug flex-1 font-['Anek_Bangla',sans-serif] truncate",
                !notification.is_read
                  ? "text-neutral-900 dark:text-white"
                  : "text-neutral-600 dark:text-neutral-400",
              )}
            >
              {notification.title}
            </h4>
            <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 whitespace-nowrap flex-shrink-0 mt-px font-['Anek_Bangla',sans-serif]">
              {getRelativeTime(notification.created_at)}
            </span>
          </div>
          <p className="text-[12.5px] text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2 font-['HindSiliguri',sans-serif]">
            {notification.message}
          </p>

          {/* Unread dot */}
          {!notification.is_read && (
            <div className="mt-1.5 flex items-center gap-1.5 font-['Anek_Bangla',sans-serif]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#12544F] dark:bg-[#34D399] flex-shrink-0" />
              <span className="text-[10.5px] font-bold text-[#12544F] dark:text-[#34D399]">
                নতুন
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
