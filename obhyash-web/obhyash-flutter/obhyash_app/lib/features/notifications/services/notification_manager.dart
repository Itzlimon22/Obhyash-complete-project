import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/services/haptics_service.dart';
import '../domain/notification_model.dart';
import '../domain/notification_templates.dart';
import '../presentation/widgets/in_app_notification_banner.dart';
import '../providers/notification_providers.dart';
import 'notification_storage_service.dart';

class NotificationManager {
  /// Dispatch an in-app notification:
  /// 1. Saves persistently to local storage / inbox
  /// 2. Updates Riverpod inbox state immediately (increases unread badge)
  /// 3. Drops down the luxury animated floating banner on screen
  /// 4. Provides haptic feedback
  static Future<void> dispatch({
    required BuildContext context,
    required WidgetRef ref,
    required String title,
    required String message,
    String type = 'general',
    String? route,
    Map<String, dynamic>? data,
    String? userId,
  }) async {
    final now = DateTime.now();
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

    // 1. Save to local persistent storage
    await NotificationStorageService.saveNotification(notif);

    // 2. Add to active Riverpod inbox state
    ref.read(notificationsProvider.notifier).addLocalNotification(notif);

    // 3. Play haptics
    AppHaptics.light();

    // 4. Show top-sliding floating in-app banner
    if (context.mounted) {
      InAppNotificationBanner.show(context, notif);
    }
  }

  /// Trigger witty Duolingo/Chorcha exam completion notification
  static Future<void> notifyExamCompleted({
    required BuildContext context,
    required WidgetRef ref,
    required String examTitle,
    required num scorePercentage,
    String? studentName,
    int? rank,
  }) async {
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

  /// Trigger witty streak saver notification
  static Future<void> notifyStreakSaver({
    required BuildContext context,
    required WidgetRef ref,
    required int streakDays,
    String? studentName,
  }) async {
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

  /// Trigger witty streak milestone celebration
  static Future<void> notifyStreakMilestone({
    required BuildContext context,
    required WidgetRef ref,
    required int streakDays,
    String? studentName,
  }) async {
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
      data: {'category': 'milestone', 'streak': streakDays},
    );
  }

  /// Trigger witty bookmark confirmation
  static Future<void> notifyBookmarkSaved({
    required BuildContext context,
    required WidgetRef ref,
    String? subject,
  }) async {
    final template = NotificationTemplateLibrary.templates.firstWhere(
      (t) => t.category == NotificationCategory.bookmarkAlert,
      orElse: () => NotificationTemplateLibrary.templates.first,
    );
    final formatted = template.format(subject: subject);

    await dispatch(
      context: context,
      ref: ref,
      title: formatted['title']!,
      message: formatted['body']!,
      type: 'general',
      route: formatted['route'],
      data: {'category': 'bookmark'},
    );
  }
}
