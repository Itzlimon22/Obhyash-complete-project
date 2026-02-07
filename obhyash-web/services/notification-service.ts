import {
  Notification,
  NotificationType,
  NotificationPriority,
} from '@/lib/types';
import { supabase, isSupabaseConfigured } from './core';

/**
 * Get user's notifications
 * @param limit - Number of notifications to fetch (default: 10)
 * @param unreadOnly - Fetch only unread notifications
 */
export const getNotifications = async (
  limit: number = 10,
  unreadOnly: boolean = false,
): Promise<Notification[]> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No authenticated user found');
        return [];
      }

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    }
  }

  // Return empty array if database not configured
  return [];
};

/**
 * Get count of unread notifications
 */
export const getUnreadNotificationCount = async (): Promise<number> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.rpc(
        'get_unread_notification_count',
      );

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }
  }

  return 0;
};

/**
 * Mark a notification as read
 * @param notificationId - ID of the notification to mark as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
): Promise<boolean> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Try RPC first
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });

      if (!error) return true;

      console.warn('RPC failed, falling back to direct update:', error.message);

      // Fallback: Direct Update
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (updateError) {
        console.error('Error marking notification as read:', updateError);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  return false;
};

/**
 * Mark all notifications as read for the current user
 */
export const markAllNotificationsAsRead = async (): Promise<boolean> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // Try RPC first
      const { error } = await supabase.rpc('mark_all_notifications_read');

      if (!error) {
        console.log('✅ All notifications marked as read (RPC)');
        return true;
      }

      console.warn('RPC failed, falling back to direct update:', error.message);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      // Fallback: Direct Update
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (updateError) {
        console.error('Error marking all notifications as read:', updateError);
        return false;
      }

      console.log('✅ All notifications marked as read (Direct)');
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  return false;
};

/**
 * Delete a notification
 * @param notificationId - ID of the notification to delete
 */
export const deleteNotification = async (
  notificationId: string,
): Promise<boolean> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.warn('No authenticated user found');
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }
  }

  return false;
};

/**
 * Create a notification for a user
 * @param userId - ID of the user to notify
 * @param title - Notification title
 * @param message - Notification message
 * @param type - Type of notification
 * @param options - Additional options
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType,
  options?: {
    priority?: NotificationPriority;
    actionUrl?: string;
    icon?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<string | null> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase.rpc('create_notification', {
        p_user_id: userId,
        p_title: title,
        p_message: message,
        p_type: type,
        p_priority: options?.priority || 'normal',
        p_action_url: options?.actionUrl || null,
        p_icon: options?.icon || null,
        p_metadata: options?.metadata || {},
      });

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      console.log('✅ Notification created:', title);
      return data;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  return null;
};

/**
 * Broadcast a notification to multiple users
 * @param userIds - Array of User IDs (or 'all' for everyone)
 * @param title - Notification title
 * @param message - Notification message
 * @param type - Notification type
 * @param options - Additional options
 */
export const broadcastNotification = async (
  userIds: string[] | 'all',
  title: string,
  message: string,
  type: NotificationType,
  options?: {
    priority?: NotificationPriority;
    actionUrl?: string;
    icon?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{ success: number; failed: number }> => {
  if (isSupabaseConfigured() && supabase) {
    try {
      // ✅ 1. Optimized Broadcast to All (Database Server-Side)
      if (userIds === 'all') {
        const { data, error } = await supabase.rpc(
          'broadcast_notification_to_all',
          {
            p_title: title,
            p_message: message,
            p_type: type,
            p_priority: options?.priority || 'normal',
            p_action_url: options?.actionUrl || null,
            p_icon: options?.icon || null,
            p_metadata: options?.metadata || {},
          },
        );

        if (error) {
          console.error('Broadcast RPC failed:', error);
          throw error;
        }

        // RPC returns { success: boolean, count: number }
        return { success: data?.count || 0, failed: 0 };
      }

      // ✅ 2. Standard Broadcast (Client-Side Batching)
      // This is still useful for targeting specific groups of users
      const targetIds = userIds;

      if (targetIds.length === 0) return { success: 0, failed: 0 };

      // Prepare bulk insert data
      const notifications = targetIds.map((uid) => ({
        user_id: uid,
        title,
        message,
        type,
        priority: options?.priority || 'normal',
        action_url: options?.actionUrl,
        icon: options?.icon,
        metadata: options?.metadata || {},
      }));

      // Insert in chunks of 100 to avoid request size limits
      const chunkSize = 100;
      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < notifications.length; i += chunkSize) {
        const chunk = notifications.slice(i, i + chunkSize);
        const { error } = await supabase.from('notifications').insert(chunk);

        if (error) {
          console.error('Batch insert failed:', error);
          failCount += chunk.length;
        } else {
          successCount += chunk.length;
        }
      }

      return { success: successCount, failed: failCount };
    } catch (error) {
      console.error('Broadcast failed:', error);
      return {
        success: 0,
        failed: Array.isArray(userIds) ? userIds.length : 0,
      };
    }
  }
  return { success: 0, failed: 0 };
};
