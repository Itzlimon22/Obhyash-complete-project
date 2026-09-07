import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/notification_model.dart';
import '../services/notification_service.dart';
import '../services/notification_storage_service.dart';
import '../../../core/providers/auth_provider.dart';

class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
  RealtimeChannel? _subscription;

  @override
  Future<List<AppNotification>> build() async {
    // 1. Always load local persistent notifications immediately (offline-first & seed support)
    final localList = await NotificationStorageService.getLocalNotifications();

    final authId = ref.watch(authProvider)?.id ?? Supabase.instance.client.auth.currentUser?.id;
    if (authId == null) {
      return localList;
    }

    // 2. Start realtime subscription
    _listenRealtime(authId);

    // 3. Fetch remote notifications & merge with local
    final remoteList = await _fetchNotifications(authId);
    if (remoteList.isEmpty) {
      return localList;
    }

    final map = <String, AppNotification>{};
    for (final n in localList) {
      map[n.id] = n;
    }
    for (final n in remoteList) {
      map[n.id] = n;
    }

    final merged = map.values.toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

    // Also update local cache
    await NotificationStorageService.saveAllNotifications(merged);

    return merged;
  }

  Future<List<AppNotification>> _fetchNotifications(String userId) async {
    try {
      final sb = Supabase.instance.client;
      final response = await sb
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(50);

      final list = (response as List<dynamic>?) ?? [];
      return list.map((json) => AppNotification.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      debugPrint('[NotificationsNotifier] fetch error: $e');
      return [];
    }
  }

  void _listenRealtime(String userId) {
    _subscription?.unsubscribe();
    final sb = Supabase.instance.client;

    _subscription = sb
        .channel('public:notifications:$userId')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'notifications',
          filter: PostgresChangeFilter(
            type: PostgresChangeFilterType.eq,
            column: 'user_id',
            value: userId,
          ),
          callback: (payload) {
            try {
              final newRow = payload.newRecord;
              final notification = AppNotification.fromJson(newRow);

              // Update local state
              state = state.whenData((current) => [notification, ...current]);
              ref.read(latestNotificationEventProvider.notifier).emit(notification);
              NotificationStorageService.saveNotification(notification);

              // Trigger heads up local alert
              final targetRoute = notification.data?['route']?.toString() ?? notification.link;
              NotificationService().showNotification(
                id: notification.id.hashCode,
                title: notification.title,
                body: notification.body,
                route: targetRoute,
                channelId: notification.type == 'live_exam'
                    ? NotificationService.channelLiveExams
                    : (notification.type == 'streak'
                        ? NotificationService.channelStreak
                        : NotificationService.channelGeneral),
              );
            } catch (e) {
              debugPrint('[NotificationsNotifier] realtime insert error: $e');
            }
          },
        )
        .subscribe();
  }

  /// Add in-app local notification dynamically from any event (exam finished, streak, bookmark, etc.)
  void addLocalNotification(AppNotification notification) {
    state = state.whenData((current) {
      final filtered = current.where((n) => n.id != notification.id).toList();
      return [notification, ...filtered];
    });
    ref.read(latestNotificationEventProvider.notifier).emit(notification);
  }

  Future<void> markAsRead(String id) async {
    // 1. Update local storage
    await NotificationStorageService.markAsRead(id);

    // 2. Update remote in background if possible
    final sb = Supabase.instance.client;
    try {
      await sb.from('notifications').update({'is_read': true}).eq('id', id);
    } catch (_) {}

    // 3. Update state
    state = state.whenData((list) {
      return list.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList();
    });
    ref.read(unreadNotificationCountProvider.notifier).decrement();
  }

  Future<void> markAllAsRead() async {
    // 1. Update local storage
    await NotificationStorageService.markAllAsRead();

    // 2. Update remote in background if possible
    final authId = ref.read(authProvider)?.id ?? Supabase.instance.client.auth.currentUser?.id;
    if (authId != null) {
      final sb = Supabase.instance.client;
      try {
        await sb.from('notifications').update({'is_read': true}).eq('user_id', authId);
      } catch (_) {}
    }

    // 3. Update state
    state = state.whenData((list) {
      return list.map((n) => n.copyWith(isRead: true)).toList();
    });
    ref.read(unreadNotificationCountProvider.notifier).markAllRead();
  }

  Future<void> deleteNotification(String id) async {
    // 1. Update local storage
    await NotificationStorageService.deleteNotification(id);

    // 2. Update remote in background if possible
    final sb = Supabase.instance.client;
    try {
      await sb.from('notifications').delete().eq('id', id);
    } catch (_) {}

    // 3. Update state
    state = state.whenData((list) {
      return list.where((n) => n.id != id).toList();
    });
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
  NotificationsNotifier.new,
);

class UnreadNotificationCountNotifier extends Notifier<int> {
  @override
  int build() {
    final notifs = ref.watch(notificationsProvider).value ?? [];
    return notifs.where((n) => !n.isRead).length;
  }

  void decrement() {
    if (state > 0) state--;
  }

  void markAllRead() {
    state = 0;
  }

  void set(int count) {
    state = count;
  }
}

final unreadNotificationCountProvider =
    NotifierProvider<UnreadNotificationCountNotifier, int>(
  UnreadNotificationCountNotifier.new,
);

class LatestNotificationEventNotifier extends Notifier<AppNotification?> {
  @override
  AppNotification? build() => null;

  void emit(AppNotification notification) {
    state = notification;
  }
}

final latestNotificationEventProvider =
    NotifierProvider<LatestNotificationEventNotifier, AppNotification?>(
  LatestNotificationEventNotifier.new,
);
