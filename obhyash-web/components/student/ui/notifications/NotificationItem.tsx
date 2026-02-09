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
  // Format relative time in Bengali
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

  // Get icon and color based on notification type
  const getIconConfig = () => {
    switch (notification.type) {
      case 'exam_result':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-600 dark:text-blue-400',
        };
      case 'achievement':
        return {
          icon: <Trophy className="w-4 h-4" />,
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          textColor: 'text-amber-600 dark:text-amber-400',
        };
      case 'level_up':
        return {
          icon: <TrendingUp className="w-4 h-4" />,
          bgColor: 'bg-purple-100 dark:bg-purple-900/30',
          textColor: 'text-purple-600 dark:text-purple-400',
        };
      case 'announcement':
        return {
          icon: <Megaphone className="w-4 h-4" />,
          bgColor: 'bg-rose-100 dark:bg-rose-900/30',
          textColor: 'text-rose-600 dark:text-rose-400',
        };
      case 'system':
        return {
          icon: <Settings className="w-4 h-4" />,
          bgColor: 'bg-neutral-100 dark:bg-neutral-800',
          textColor: 'text-neutral-600 dark:text-neutral-400',
        };
      default:
        return {
          icon: <Bell className="w-4 h-4" />,
          bgColor: 'bg-neutral-100 dark:bg-neutral-800',
          textColor: 'text-neutral-600 dark:text-neutral-400',
        };
    }
  };

  const config = getIconConfig();

  return (
    <div
      onClick={onClick}
      className={cn(
        'group px-5 py-4 cursor-pointer relative overflow-hidden transition-all duration-200 active:bg-neutral-100 dark:active:bg-neutral-800 tap-highlight-transparent',
        !notification.is_read
          ? 'bg-rose-50/20 dark:bg-rose-900/5'
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
      )}
    >
      {/* Unread Indicator Bar */}
      {!notification.is_read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]"></div>
      )}

      <div className="flex items-start gap-4 relative z-10">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-105 group-active:scale-95',
            config.bgColor,
            config.textColor,
          )}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4
              className={cn(
                'text-[13px] md:text-sm font-bold leading-snug transition-colors',
                !notification.is_read
                  ? 'text-neutral-900 dark:text-white'
                  : 'text-neutral-700 dark:text-neutral-300 group-hover:text-rose-600 dark:group-hover:text-rose-400',
              )}
            >
              {notification.title}
            </h4>
            <span className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
              {getRelativeTime(notification.created_at)}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed line-clamp-2">
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;
