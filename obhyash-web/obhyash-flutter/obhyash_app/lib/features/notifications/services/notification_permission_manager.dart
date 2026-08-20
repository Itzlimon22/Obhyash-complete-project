import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../presentation/widgets/notification_permission_sheet.dart';

class NotificationPermissionManager {
  static const String keyDismissedAt = 'notif_prompt_dismissed_at';
  static const String keyDismissCount = 'notif_prompt_dismiss_count';
  static const String keyGranted = 'notif_prompt_granted';

  /// Checks if the soft prompt should be displayed based on smart cooldown logic
  static Future<bool> shouldShowPrompt() async {
    try {
      // 1. Check OS permission status first
      final status = await Permission.notification.status;
      if (status.isGranted) return false;

      final prefs = await SharedPreferences.getInstance();

      // If user previously granted or permanently denied through app prompt
      final isGranted = prefs.getBool(keyGranted) ?? false;
      if (isGranted) return false;

      final dismissCount = prefs.getInt(keyDismissCount) ?? 0;
      if (dismissCount >= 3) return false; // Never disturb after 3 dismissals

      final dismissedAt = prefs.getInt(keyDismissedAt) ?? 0;
      if (dismissedAt == 0) return true; // First time

      final now = DateTime.now().millisecondsSinceEpoch;
      final diff = now - dismissedAt;

      // Smart Cooldown intervals:
      // After 1st dismiss: 3 days cooldown
      // After 2nd dismiss: 7 days cooldown
      final cooldownMs = dismissCount == 1
          ? 3 * 24 * 60 * 60 * 1000 // 3 days
          : 7 * 24 * 60 * 60 * 1000; // 7 days

      return diff >= cooldownMs;
    } catch (e) {
      debugPrint('[NotificationPermissionManager] shouldShowPrompt error: $e');
      return false;
    }
  }

  /// Records user tapping "পরে করবো" (Dismiss)
  static Future<void> recordDismissed() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final count = prefs.getInt(keyDismissCount) ?? 0;
      await prefs.setInt(keyDismissCount, count + 1);
      await prefs.setInt(keyDismissedAt, DateTime.now().millisecondsSinceEpoch);
    } catch (_) {}
  }

  /// Records user enabling notifications
  static Future<void> recordGranted() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(keyGranted, true);
    } catch (_) {}
  }

  /// Evaluates and shows the soft bottom sheet if eligible
  static Future<void> maybeShowPrompt(BuildContext context) async {
    final shouldShow = await shouldShowPrompt();
    if (!shouldShow || !context.mounted) return;

    // Small delay to ensure the screen transition is complete
    await Future.delayed(const Duration(seconds: 2));
    if (!context.mounted) return;

    NotificationPermissionSheet.show(context);
  }
}
