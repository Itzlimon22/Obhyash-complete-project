import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../domain/notification_model.dart';

class NotificationStorageService {
  static const String _legacyKey = 'obhyash_local_notifications_v1';
  static const String _legacySeedKey = 'obhyash_notif_has_seeded_v1';

  static String _getUserKey(String? userId) {
    final uid = userId ?? Supabase.instance.client.auth.currentUser?.id;
    if (uid != null && uid.isNotEmpty) {
      return 'obhyash_notifs_v2_$uid';
    }
    return 'obhyash_notifs_v2_guest';
  }

  static String _getSeededKey(String? userId) {
    final uid = userId ?? Supabase.instance.client.auth.currentUser?.id;
    if (uid != null && uid.isNotEmpty) {
      return 'obhyash_seeded_v2_$uid';
    }
    return 'obhyash_seeded_v2_guest';
  }

  /// Fetch all notifications for the given user (or currently logged-in user)
  static Future<List<AppNotification>> getLocalNotifications({String? userId}) async {
    try {
      final prefs = await SharedPreferences.getInstance();

      // Clean up legacy polluted global key if it exists
      if (prefs.containsKey(_legacyKey)) {
        await prefs.remove(_legacyKey);
      }
      if (prefs.containsKey(_legacySeedKey)) {
        await prefs.remove(_legacySeedKey);
      }

      final key = _getUserKey(userId);
      final seededKey = _getSeededKey(userId);
      final hasSeeded = prefs.getBool(seededKey) ?? false;

      if (!hasSeeded) {
        // Brand new user: clean start with exactly 1 welcome notification
        final effectiveUid = userId ?? Supabase.instance.client.auth.currentUser?.id ?? 'local';
        final seeded = _getInitialSeedNotifications(effectiveUid);
        await saveAllNotifications(seeded, userId: userId);
        await prefs.setBool(seededKey, true);
        return seeded;
      }

      final rawList = prefs.getStringList(key) ?? [];
      final notifs = <AppNotification>[];

      for (final raw in rawList) {
        try {
          final map = jsonDecode(raw) as Map<String, dynamic>;
          notifs.add(AppNotification.fromJson(map));
        } catch (_) {}
      }

      // Sort by newest first
      notifs.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return notifs;
    } catch (e) {
      debugPrint('[NotificationStorageService] getLocalNotifications error: $e');
      return [];
    }
  }

  /// Save a new notification to user-scoped local storage
  static Future<void> saveNotification(AppNotification notif, {String? userId}) async {
    try {
      final targetUserId = userId ?? (notif.userId != 'local' ? notif.userId : null);
      final current = await getLocalNotifications(userId: targetUserId);

      // Deduplication: by exact ID or identical title & message within 24h
      final isDuplicate = current.any((item) {
        if (item.id == notif.id) return true;
        if (item.title == notif.title && item.message == notif.message) {
          return notif.createdAt.difference(item.createdAt).inHours.abs() < 24;
        }
        return false;
      });

      if (isDuplicate) {
        debugPrint('[NotificationStorageService] Skipped saving duplicate notification: ${notif.title}');
        return;
      }

      final updated = [
        notif,
        ...current.where((item) => item.id != notif.id),
      ];

      // Keep up to 50 recent notifications
      if (updated.length > 50) {
        updated.removeRange(50, updated.length);
      }

      await saveAllNotifications(updated, userId: targetUserId);
    } catch (e) {
      debugPrint('[NotificationStorageService] saveNotification error: $e');
    }
  }

  /// Save all notifications to user-scoped storage
  static Future<void> saveAllNotifications(List<AppNotification> notifs, {String? userId}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = _getUserKey(userId);

      final stringList = notifs.map((n) {
        return jsonEncode({
          'id': n.id,
          'user_id': n.userId,
          'title': n.title,
          'message': n.message,
          'type': n.type,
          'link': n.link,
          'data': n.data,
          'is_read': n.isRead,
          'created_at': n.createdAt.toIso8601String(),
        });
      }).toList();

      await prefs.setStringList(key, stringList);
    } catch (e) {
      debugPrint('[NotificationStorageService] saveAllNotifications error: $e');
    }
  }

  /// Mark single notification as read
  static Future<void> markAsRead(String id, {String? userId}) async {
    try {
      final list = await getLocalNotifications(userId: userId);
      final updated = list.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList();
      await saveAllNotifications(updated, userId: userId);
    } catch (e) {
      debugPrint('[NotificationStorageService] markAsRead error: $e');
    }
  }

  /// Mark all as read
  static Future<void> markAllAsRead({String? userId}) async {
    try {
      final list = await getLocalNotifications(userId: userId);
      final updated = list.map((n) => n.copyWith(isRead: true)).toList();
      await saveAllNotifications(updated, userId: userId);
    } catch (e) {
      debugPrint('[NotificationStorageService] markAllAsRead error: $e');
    }
  }

  /// Delete single notification
  static Future<void> deleteNotification(String id, {String? userId}) async {
    try {
      final list = await getLocalNotifications(userId: userId);
      final updated = list.where((n) => n.id != id).toList();
      await saveAllNotifications(updated, userId: userId);
    } catch (e) {
      debugPrint('[NotificationStorageService] deleteNotification error: $e');
    }
  }

  /// Completely clear notifications for a specific user (e.g. on user reset)
  static Future<void> clearUserNotifications(String userId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_getUserKey(userId));
      await prefs.remove(_getSeededKey(userId));
    } catch (e) {
      debugPrint('[NotificationStorageService] clearUserNotifications error: $e');
    }
  }

  /// Clean initial onboarding welcome notification for fresh users
  static List<AppNotification> _getInitialSeedNotifications(String userId) {
    final now = DateTime.now();
    return [
      AppNotification(
        id: 'seed_welcome_$userId',
        userId: userId,
        title: '🎉 অভ্যাসে স্বাগতম! অভ্যাস গড়ো, শীর্ষে ওঠো',
        message: 'প্রতিদিন নিয়ম করে অল্প অল্প পড়লেই স্বপ্নের ভার্সিটির চান্স নিশ্চিত! চল আজকের প্রথম চ্যালেঞ্জটা দিয়ে ফেলি 🚀',
        type: 'general',
        link: '/setup',
        data: {'route': '/setup', 'category': 'welcome'},
        isRead: false,
        createdAt: now,
      ),
    ];
  }
}
