import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../domain/notification_model.dart';

class NotificationStorageService {
  static const String _keyNotifications = 'obhyash_local_notifications_v1';
  static const String _keyHasSeeded = 'obhyash_notif_has_seeded_v1';

  /// Fetch all notifications from local storage
  static Future<List<AppNotification>> getLocalNotifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final hasSeeded = prefs.getBool(_keyHasSeeded) ?? false;

      if (!hasSeeded) {
        // Seed initial witty Duolingo/Chorcha style notifications for new users
        final seeded = _getInitialSeedNotifications();
        await saveAllNotifications(seeded);
        await prefs.setBool(_keyHasSeeded, true);
        return seeded;
      }

      final rawList = prefs.getStringList(_keyNotifications) ?? [];
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

  /// Save a new notification to local storage (prepends to top) with intelligent deduplication
  static Future<void> saveNotification(AppNotification notif) async {
    try {
      final current = await getLocalNotifications();

      // Intelligent Deduplication:
      // 1. By exact ID
      // 2. By identical title & message within 24 hours (prevents repetitive spam)
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

      await saveAllNotifications(updated);
    } catch (e) {
      debugPrint('[NotificationStorageService] saveNotification error: $e');
    }
  }

  /// Save all notifications
  static Future<void> saveAllNotifications(List<AppNotification> notifs) async {
    try {
      final prefs = await SharedPreferences.getInstance();
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

      await prefs.setStringList(_keyNotifications, stringList);
    } catch (e) {
      debugPrint('[NotificationStorageService] saveAllNotifications error: $e');
    }
  }

  /// Mark single notification as read
  static Future<void> markAsRead(String id) async {
    try {
      final list = await getLocalNotifications();
      final updated = list.map((n) => n.id == id ? n.copyWith(isRead: true) : n).toList();
      await saveAllNotifications(updated);
    } catch (e) {
      debugPrint('[NotificationStorageService] markAsRead error: $e');
    }
  }

  /// Mark all as read
  static Future<void> markAllAsRead() async {
    try {
      final list = await getLocalNotifications();
      final updated = list.map((n) => n.copyWith(isRead: true)).toList();
      await saveAllNotifications(updated);
    } catch (e) {
      debugPrint('[NotificationStorageService] markAllAsRead error: $e');
    }
  }

  /// Delete single notification
  static Future<void> deleteNotification(String id) async {
    try {
      final list = await getLocalNotifications();
      final updated = list.where((n) => n.id != id).toList();
      await saveAllNotifications(updated);
    } catch (e) {
      debugPrint('[NotificationStorageService] deleteNotification error: $e');
    }
  }

  /// Seed initial clean onboarding welcome notification for new users
  static List<AppNotification> _getInitialSeedNotifications() {
    final now = DateTime.now();
    return [
      AppNotification(
        id: 'seed_welcome',
        userId: 'local',
        title: '🎉 অভ্যাসে স্বাগতম! অভ্যাস গড়ো, শীর্ষে ওঠো',
        message: 'প্রতিদিন নিয়ম করে অল্প অল্প পড়লেই স্বপ্নের ভার্সিটির চান্স নিশ্চিত! চল আজকের প্রথম চ্যালেঞ্জটা দিয়ে ফেলি 🚀',
        type: 'general',
        link: '/setup',
        data: {'route': '/setup', 'category': 'welcome'},
        isRead: true,
        createdAt: now.subtract(const Duration(minutes: 5)),
      ),
    ];
  }
}
