'use client';

import React, { useEffect, useState } from 'react';
import { Bell, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { Notification } from '@/lib/types';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '@/services/database';
import { formatDistanceToNow } from 'date-fns';
import { bn } from 'date-fns/locale';
import { toast } from 'sonner';

const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifs = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications(50); // Fetch last 50
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkRead = async (id: string) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('সব বার্তা পঠিত হিসেবে চিহ্নিত করা হয়েছে');
    }
  };

  const handleDelete = async (id: string) => {
    const success = await deleteNotification(id);
    if (success) {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('বার্তা মুছে ফেলা হয়েছে');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-2xl">
            <Bell className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              সব নোটিফিকেশন
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              আপনার সব আপডেট এখানে পাবেন
            </p>
          </div>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
          >
            সব পঠিত হিসেবে চিহ্নিত করুন
          </button>
        )}
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 bg-white dark:bg-neutral-900 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`group p-4 rounded-2xl border transition-all ${
                notif.is_read
                  ? 'bg-neutral-50/50 dark:bg-neutral-900/30 border-neutral-200 dark:border-neutral-800 opacity-80'
                  : 'bg-white dark:bg-neutral-900 border-red-100 dark:border-red-900/30 shadow-sm'
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`mt-1 h-2 w-2 rounded-full shrink-0 ${notif.is_read ? 'bg-transparent' : 'bg-red-500'}`}
                />

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <h4
                      className={`font-bold text-neutral-900 dark:text-white ${notif.is_read ? 'text-base' : 'text-lg'}`}
                    >
                      {notif.title}
                    </h4>
                    <span className="text-[10px] md:text-xs text-neutral-400 font-medium flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(notif.created_at), {
                        addSuffix: true,
                        locale: bn,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="flex items-center gap-4 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        পঠিত হিসেবে চিহ্নিত করুন
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="text-xs font-bold text-neutral-400 hover:text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      মুছে ফেলুন
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-10 h-10 text-neutral-300 dark:text-neutral-700" />
            </div>
            <h3 className="text-xl font-bold text-neutral-600 dark:text-neutral-400">
              কোনো নোটিফিকেশন নেই
            </h3>
            <p className="text-neutral-400 dark:text-neutral-500">
              আপনার সব আপডেট এখানে দেখানো হবে
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsView;
