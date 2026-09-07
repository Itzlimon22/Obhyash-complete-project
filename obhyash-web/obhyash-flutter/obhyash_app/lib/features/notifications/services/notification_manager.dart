import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/haptics_service.dart';
import '../domain/notification_model.dart';
import '../domain/notification_templates.dart';
import '../presentation/widgets/in_app_notification_banner.dart';
import '../providers/notification_providers.dart';
import 'notification_storage_service.dart';

class NotificationManager {
  // ── Intelligent Throttling & Cooldown Tracking ──
  static final Map<String, int> _categoryLastDispatched = {};
  static final Map<String, int> _titleLastDispatched = {};
  static int _lastBannerShownMillis = 0;

  // Category cooldown rules (prevent repetitive notifications)
  static const Map<String, Duration> _categoryCooldowns = {
    'result': Duration(hours: 24), // Max 1 exam celebration per day (milestones only)
    'streak': Duration(hours: 18), // Max 1 streak reminder per evening
    'milestone': Duration(hours: 12), // Max 1 milestone celebration per half-day
    'morning': Duration(hours: 20),
    'live_exam': Duration(hours: 2),
    'system': Duration(minutes: 10),
    'general': Duration(hours: 4),
  };

  /// Dispatch an in-app notification with intelligent deduplication & rate limiting:
  /// 1. Verifies cooldown so identical or repetitive category notifications are never sent repeatedly
  /// 2. Saves persistently to local storage (with 24h content deduplication)
  /// 3. Updates Riverpod inbox state immediately
  /// 4. Shows top-sliding banner ONLY if urgent or outside banner fatigue window (min 5 min)
  /// 5. Provides haptic feedback
  static Future<bool> dispatch({
    required BuildContext context,
    required WidgetRef ref,
    required String title,
    required String message,
    String type = 'general',
    String? route,
    Map<String, dynamic>? data,
    String? userId,
    bool force = false,
  }) async {
    final now = DateTime.now();
    final nowMillis = now.millisecondsSinceEpoch;
    final category = data?['category']?.toString() ?? type;

    // INTELLIGENT GUARD 1: Category Cooldown Check
    if (!force) {
      final cooldown = _categoryCooldowns[category] ?? const Duration(hours: 2);
      final lastCategoryTime = _categoryLastDispatched[category];
      if (lastCategoryTime != null && (nowMillis - lastCategoryTime) < cooldown.inMilliseconds) {
        debugPrint('[NotificationManager] Throttled duplicate category "$category" (cooldown active).');
        return false;
      }

      // INTELLIGENT GUARD 2: Exact Title Deduplication (within 12 hours)
      final lastTitleTime = _titleLastDispatched[title];
      if (lastTitleTime != null && (nowMillis - lastTitleTime) < const Duration(hours: 12).inMilliseconds) {
        debugPrint('[NotificationManager] Throttled duplicate title: "$title"');
        return false;
      }
    }

    _categoryLastDispatched[category] = nowMillis;
    _titleLastDispatched[title] = nowMillis;

    final notifId = 'notif_${now.microsecondsSinceEpoch}';

    final notif = AppNotification(
      id: notifId,
      userId: userId ?? 'local',
      title: title,
      message: message,
      type: type,
      link: route,
      data: {
        'route': ?route,
        ...?data,
      },
      isRead: false,
      createdAt: now,
    );

    // 1. Save to local persistent storage (deduplicated against existing cards)
    await NotificationStorageService.saveNotification(notif);

    // 2. Add to active Riverpod inbox state
    ref.read(notificationsProvider.notifier).addLocalNotification(notif);

    // 3. Play haptics
    AppHaptics.light();

    // 4. INTELLIGENT GUARD 3: Floating Banner Fatigue Prevention
    // Banners interrupt study flow. Only show if urgent/live_exam OR minimum 5 mins since last banner.
    final isUrgent = data?['urgent'] == true || type == 'urgent' || type == 'live_exam';
    final canShowBanner = isUrgent || (nowMillis - _lastBannerShownMillis) > const Duration(minutes: 5).inMilliseconds;

    if (canShowBanner && context.mounted) {
      _lastBannerShownMillis = nowMillis;
      InAppNotificationBanner.show(context, notif);
    }

    return true;
  }

  /// Trigger intelligent exam celebration notification (ONLY for notable milestones)
  static Future<void> notifyExamCompleted({
    required BuildContext context,
    required WidgetRef ref,
    required String examTitle,
    required num scorePercentage,
    String? studentName,
    int? rank,
  }) async {
    // INTELLIGENT RULE: Do NOT notify for routine practice / average scores
    // The student is already looking at the ResultView screen!
    // Only notify if they achieve a remarkable score (e.g. 100% or top rank in Live Exam)
    if (scorePercentage < 100 && rank == null) {
      debugPrint('[NotificationManager] Routine exam score ($scorePercentage%). Notification skipped to avoid spam.');
      return;
    }

    final formatted = NotificationTemplateLibrary.getExamResultNotification(
      name: studentName,
      examTitle: examTitle,
      score: scorePercentage,
      rank: rank,
    );

    await dispatch(
      context: context,
      ref: ref,
      title: formatted['title']!,
      message: formatted['body']!,
      type: 'result',
      route: formatted['route'],
      data: {
        'exam_title': examTitle,
        'score': scorePercentage,
        'category': 'result',
      },
    );
  }

  /// Trigger intelligent streak saver notification (max 1 per day in the evening)
  static Future<void> notifyStreakSaver({
    required BuildContext context,
    required WidgetRef ref,
    required int streakDays,
    String? studentName,
  }) async {
    if (streakDays <= 0) return; // Don't notify if no streak to save

    final formatted = NotificationTemplateLibrary.getRandomStreakSaver().format(
      name: studentName,
      streak: streakDays,
    );

    await dispatch(
      context: context,
      ref: ref,
      title: formatted['title']!,
      message: formatted['body']!,
      type: 'streak',
      route: formatted['route'],
      data: {'category': 'streak', 'streak': streakDays},
    );
  }

  /// Trigger intelligent streak milestone celebration (ONLY for real milestones)
  static Future<void> notifyStreakMilestone({
    required BuildContext context,
    required WidgetRef ref,
    required int streakDays,
    String? studentName,
  }) async {
    // Only celebrate key milestones: 3, 7, 14, 30, 60, 100, 365 days
    const milestoneDays = {3, 7, 14, 30, 60, 100, 365};
    if (!milestoneDays.contains(streakDays)) {
      return;
    }

    final template = NotificationTemplateLibrary.templates.firstWhere(
      (t) => t.category == NotificationCategory.milestoneReward,
      orElse: () => NotificationTemplateLibrary.getRandomStreakSaver(),
    );
    final formatted = template.format(name: studentName, streak: streakDays);

    await dispatch(
      context: context,
      ref: ref,
      title: formatted['title']!,
      message: formatted['body']!,
      type: 'milestone',
      route: formatted['route'],
      data: {
        'category': 'milestone',
        'streak': streakDays,
        'urgent': true, // Real milestone is worth a banner
      },
    );
  }

  /// Deprecated micro-action notification: Bookmarks should be subtle in-place actions
  static Future<void> notifyBookmarkSaved({
    required BuildContext context,
    required WidgetRef ref,
    String? subject,
  }) async {
    // Intentionally a no-op: bookmarking should never spam floating banners or the notification tray
    AppHaptics.light();
  }
}
