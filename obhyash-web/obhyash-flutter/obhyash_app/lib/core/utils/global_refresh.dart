import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../features/dashboard/providers/dashboard_providers.dart';
import '../../features/dashboard/domain/models.dart';
import '../../features/live_exam/domain/models.dart';
import '../../features/live_exam/providers/live_exam_providers.dart';
import '../../features/dashboard/services/streak_service.dart';
import '../../features/exam/services/offline_exam_sync_queue.dart';

/// Call [globalRefresh] to invalidate all major providers, sync offline queues,
/// recalculate streaks, and trigger a background re-fetch — exactly like Facebook feed pull-to-refresh.
Future<void> globalRefresh(WidgetRef ref) async {
  final currentUserId = Supabase.instance.client.auth.currentUser?.id;

  // 1. Sync pending offline exams in background
  OfflineExamSyncQueueService.syncPendingExams();

  // 2. Force streak recalculation if logged in
  if (currentUserId != null) {
    await StreakService.checkAndUpdateStreak(currentUserId, forceSync: true);
  }

  // 3. Invalidate profile first so downstream providers receive fresh data
  ref.invalidate(userProfileProvider);

  try {
    await ref.read(userProfileProvider.future).timeout(
      const Duration(seconds: 5),
    );
  } catch (_) {}

  // 4. Invalidate all dashboard, leaderboard, and exam providers
  ref.invalidate(leaderboardProvider);
  ref.invalidate(dashboardSubjectStatsProvider);
  ref.invalidate(dashboardLiveExamsProvider);
  ref.invalidate(liveExamsProvider);

  // 5. Wait for all to settle
  await Future.wait([
    ref.read(leaderboardProvider.future).catchError((_) => <LeaderboardUser>[]),
    ref.read(dashboardSubjectStatsProvider.future).catchError((_) => <SubjectStats>[]),
    ref.read(dashboardLiveExamsProvider.future).catchError((_) => <LiveExam>[]),
  ]).timeout(const Duration(seconds: 8), onTimeout: () => []);
}
