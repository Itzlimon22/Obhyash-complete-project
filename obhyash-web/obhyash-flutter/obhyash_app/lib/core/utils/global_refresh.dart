import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/dashboard/providers/dashboard_providers.dart';
import '../../features/dashboard/domain/models.dart';
import '../../features/live_exam/domain/models.dart';

/// Call [globalRefresh] from any widget to invalidate all major providers,
/// triggering a background re-fetch — exactly like Facebook's feed refresh.
///
/// Usage inside a ConsumerWidget:
/// ```dart
/// await globalRefresh(ref);
/// ```
Future<void> globalRefresh(WidgetRef ref) async {
  // Invalidate in dependency order — profile first so downstream providers
  // (leaderboard, subjectStats, liveExams) receive the fresh profile.
  ref.invalidate(userProfileProvider);

  // Wait for profile to reload before cascading to dependent providers
  try {
    await ref.read(userProfileProvider.future).timeout(
      const Duration(seconds: 8),
    );
  } catch (_) {
    // If network is slow / offline, still try to refresh the rest
  }

  // Invalidate all dashboard data
  ref.invalidate(leaderboardProvider);
  ref.invalidate(dashboardSubjectStatsProvider);
  ref.invalidate(dashboardLiveExamsProvider);

  // Wait for all to settle (or time out gracefully)
  await Future.wait([
    ref.read(leaderboardProvider.future).catchError((_) => <LeaderboardUser>[]),
    ref.read(dashboardSubjectStatsProvider.future).catchError((_) => <SubjectStats>[]),
    ref.read(dashboardLiveExamsProvider.future).catchError((_) => <LiveExam>[]),
  ]).timeout(const Duration(seconds: 10), onTimeout: () => []);
}
