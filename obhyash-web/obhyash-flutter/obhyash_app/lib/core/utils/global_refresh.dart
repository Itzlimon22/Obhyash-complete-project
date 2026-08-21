import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../features/dashboard/providers/dashboard_providers.dart';
import '../../features/dashboard/domain/models.dart';
import '../../features/live_exam/domain/models.dart';
import '../../features/live_exam/providers/live_exam_providers.dart';
import '../../features/dashboard/services/streak_service.dart';
import '../../features/exam/services/offline_exam_sync_queue.dart';

/// Call [globalRefresh] to invalidate all major providers, sync offline queues,
/// recalculate streaks, and trigger a fast concurrent re-fetch.
Future<void> globalRefresh(WidgetRef ref) async {
  final currentUserId = Supabase.instance.client.auth.currentUser?.id;

  // 1. Fire background tasks
  OfflineExamSyncQueueService.syncPendingExams();

  // 2. Invalidate providers concurrently
  ref.invalidate(userProfileProvider);
  ref.invalidate(leaderboardProvider);
  ref.invalidate(dashboardSubjectStatsProvider);
  ref.invalidate(dashboardLiveExamsProvider);
  ref.invalidate(liveExamsProvider);
  ref.read(examHistoryRefreshTriggerProvider.notifier).trigger();
  ref.read(dailyQuestsRefreshTriggerProvider.notifier).trigger();

  // 3. Concurrently fetch refreshed futures + streak sync
  final futures = <Future<dynamic>>[
    if (currentUserId != null) StreakService.syncStreak(currentUserId),
    ref.read(userProfileProvider.future).catchError((_) => null),
    ref.read(leaderboardProvider.future).catchError((_) => <LeaderboardUser>[]),
    ref.read(dashboardSubjectStatsProvider.future).catchError((_) => <SubjectStats>[]),
    ref.read(dashboardLiveExamsProvider.future).catchError((_) => <LiveExam>[]),
  ];

  await Future.wait(futures).timeout(const Duration(seconds: 4), onTimeout: () => []);
}
