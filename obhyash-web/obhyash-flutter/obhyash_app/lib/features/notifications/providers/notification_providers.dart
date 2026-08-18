import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/haptics_service.dart';
import '../domain/notification_model.dart';

/// Holds the single active Realtime Channel for notifications
class NotificationRealtimeService {
  final SupabaseClient _client;
  RealtimeChannel? _channel;
  String? _subscribedUserId;

  NotificationRealtimeService(this._client);

  void subscribe({
    required String userId,
    required void Function(AppNotification newNotification) onInsert,
    required void Function(String id, bool isRead) onUpdate,
    required void Function(String id) onDelete,
  }) {
    if (_subscribedUserId == userId && _channel != null) {
      return; // Already subscribed
    }

    unsubscribe();
    _subscribedUserId = userId;

    _channel = _client.channel('realtime_user_notifications_$userId');

    _channel!.onPostgresChanges(
      event: PostgresChangeEvent.all,
      schema: 'public',
      table: 'notifications',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'user_id',
        value: userId,
      ),
      callback: (payload) {
        try {
          final eventType = payload.eventType;
          if (eventType == PostgresChangeEvent.insert) {
            final newRecord = payload.newRecord;
            if (newRecord.isNotEmpty) {
              final notif = AppNotification.fromJson(newRecord);
              onInsert(notif);
              AppHaptics.light();
            }
          } else if (eventType == PostgresChangeEvent.update) {
            final newRecord = payload.newRecord;
            if (newRecord.isNotEmpty) {
              final id = newRecord['id']?.toString() ?? '';
              final isRead = newRecord['is_read'] as bool? ?? false;
              onUpdate(id, isRead);
            }
          } else if (eventType == PostgresChangeEvent.delete) {
            final oldRecord = payload.oldRecord;
            final id = (oldRecord['id'] ?? payload.newRecord['id'])?.toString() ?? '';
            if (id.isNotEmpty) {
              onDelete(id);
            }
          }
        } catch (e) {
          debugPrint('[NotificationRealtime] Error processing payload: $e');
        }
      },
    ).subscribe((status, [error]) {
      if (status == RealtimeSubscribeStatus.subscribed) {
        debugPrint('[NotificationRealtime] Subscribed to notifications for user: $userId');
      } else if (status == RealtimeSubscribeStatus.channelError) {
        debugPrint('[NotificationRealtime] Channel error for user $userId: $error');
      }
    });
  }

  void unsubscribe() {
    if (_channel != null) {
      _client.removeChannel(_channel!);
      _channel = null;
      _subscribedUserId = null;
      debugPrint('[NotificationRealtime] Unsubscribed from notification channel.');
    }
  }
}

final notificationRealtimeServiceProvider = Provider<NotificationRealtimeService>((ref) {
  final service = NotificationRealtimeService(Supabase.instance.client);
  ref.onDispose(() => service.unsubscribe());
  return service;
});

// ─── Stream of Latest Foreground Notification for In-App Toasts ───────────────
class LatestNotificationNotifier extends Notifier<AppNotification?> {
  @override
  AppNotification? build() => null;

  void notify(AppNotification notification) {
    state = notification;
  }
}

final latestNotificationEventProvider = NotifierProvider<LatestNotificationNotifier, AppNotification?>(
  () => LatestNotificationNotifier(),
);

// ─── Production Unread Count Notifier (Zero-Poll, Live WebSocket Sync) ─────────
class UnreadNotificationCountNotifier extends Notifier<int> {
  @override
  int build() {
    final user = ref.watch(authProvider);
    if (user == null) {
      ref.read(notificationRealtimeServiceProvider).unsubscribe();
      return 0;
    }

    // Initial fetch from DB
    _fetchInitialCount(user.id);

    // Setup Live Realtime Listener
    ref.read(notificationRealtimeServiceProvider).subscribe(
      userId: user.id,
      onInsert: (notif) {
        if (!notif.isRead) {
          state = state + 1;
          ref.read(latestNotificationEventProvider.notifier).notify(notif);
        }
      },
      onUpdate: (id, isRead) {
        // If an unread notification became read, decrement
        _fetchInitialCount(user.id);
      },
      onDelete: (id) {
        _fetchInitialCount(user.id);
      },
    );

    return 0;
  }

  Future<void> _fetchInitialCount(String userId) async {
    try {
      final res = await Supabase.instance.client
          .from('notifications')
          .select('id')
          .eq('user_id', userId)
          .eq('is_read', false);
      state = (res as List).length;
    } catch (e) {
      debugPrint('[UnreadNotificationCount] Fetch error: $e');
    }
  }

  void decrement() {
    if (state > 0) state = state - 1;
  }

  void markAllRead() {
    state = 0;
  }
}

final unreadNotificationCountProvider = NotifierProvider<UnreadNotificationCountNotifier, int>(
  () => UnreadNotificationCountNotifier(),
);
