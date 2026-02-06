import React from 'react';
import { Notification } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { Bell, Trophy, TrendingUp, Megaphone, Settings } from 'lucide-react';

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
      className={`group px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-all duration-200 cursor-pointer relative overflow-hidden ${
        !notification.is_read ? 'bg-rose-50/30 dark:bg-rose-900/5' : ''
      }`}
    >
      {/* Unread Indicator Bar */}
      {!notification.is_read && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
      )}

      <div className="flex items-start gap-4 relaltive z-10">
        {/* Icon */}
        <div
          className={`flex-shrink-0 w-9 h-9 rounded-xl ${config.bgColor} ${config.textColor} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h4
              className={`text-sm font-bold text-neutral-800 dark:text-neutral-100 leading-snug group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors ${
                !notification.is_read ? 'text-black dark:text-white' : ''
              }`}
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
