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

  /// Save a new notification to local storage (prepends to top)
  static Future<void> saveNotification(AppNotification notif) async {
    try {
      final current = await getLocalNotifications();

      // Deduplicate by ID
      final updated = [
        notif,
        ...current.where((item) => item.id != notif.id),
      ];

      // Keep up to 100 recent notifications
      if (updated.length > 100) {
        updated.removeRange(100, updated.length);
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

  /// Seed initial witty, engaging Duolingo/Chorcha notifications for new users
  static List<AppNotification> _getInitialSeedNotifications() {
    final now = DateTime.now();
    return [
      AppNotification(
        id: 'seed_streak_panic',
        userId: 'local',
        title: '🚨 তোমার ৩ দিনের স্ট্রিক পুড়ছে!',
        message: 'ফায়ার সার্ভিস ডাকার আগেই ১টি ৫ মিনিটের কুইজ দিয়ে আগুনটা বাঁচাও 🚒🔥 রাত ১২টার পর কিন্তু কান্না থামবে না!',
        type: 'streak',
        link: '/setup',
        data: {'route': '/setup', 'category': 'streak'},
        isRead: false,
        createdAt: now.subtract(const Duration(minutes: 42)),
      ),
      AppNotification(
        id: 'seed_morning_tea',
        userId: 'local',
        title: 'চা ঠান্ডা হওয়ার আগেই কুইজ শেষ করো! 🍵',
        message: 'ঘুম থেকে উঠো শিক্ষার্থী, বুয়েট/মেডিকেল ডাকছে! মাত্র ৫ মিনিটে ১০টি কঠিন প্রশ্ন সলভ করে লিডারবোর্ডে এসো ☕⚡',
        type: 'general',
        link: '/setup',
        data: {'route': '/setup', 'category': 'morning'},
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 3, minutes: 15)),
      ),
      AppNotification(
        id: 'seed_live_exam',
        userId: 'local',
        title: '🔴 মেগা উইকলি লাইভ টেস্ট শুরু হয়েছে!',
        message: 'হাজারো শিক্ষার্থীর সাথে লাইভ লড়াই শুরু হয়েছে। দেরি না করে এখনই জয়েন করো, নয়তো সময় কমে যাবে! 🏆⏱️',
        type: 'live_exam',
        link: '/live-exams',
        data: {'route': '/live-exams', 'category': 'live_exam'},
        isRead: false,
        createdAt: now.subtract(const Duration(hours: 7)),
      ),
      AppNotification(
        id: 'seed_welcome',
        userId: 'local',
        title: '🎉 অভ্যাসে স্বাগতম! অভ্যাস গড়ো, শীর্ষে ওঠো',
        message: 'প্রতিদিন নিয়ম করে অল্প অল্প পড়লেই স্বপ্নের ভার্সিটির চান্স নিশ্চিত! চল আজকের প্রথম চ্যালেঞ্জটা দিয়ে ফেলি 🚀',
        type: 'general',
        link: '/setup',
        data: {'route': '/setup', 'category': 'welcome'},
        isRead: true,
        createdAt: now.subtract(const Duration(days: 1)),
      ),
    ];
  }
}
