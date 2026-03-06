import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/dashboard_repository.dart';
import '../domain/models.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/shared_prefs_provider.dart';
import 'dart:convert';

// Riverpod Provider for the Supabase Client
final supabaseClientProvider = Provider<SupabaseClient>((ref) {
  return Supabase.instance.client;
});

// Riverpod Provider for the Dashboard Repository
final dashboardRepositoryProvider = Provider<DashboardRepository>((ref) {
  final supabase = ref.watch(supabaseClientProvider);
  return DashboardRepository(supabase);
});

class UserProfileNotifier extends AsyncNotifier<UserProfile?> {
  @override
  FutureOr<UserProfile?> build() async {
    final user = ref.watch(authProvider);
    if (user == null) return null;

    final prefs = ref.watch(sharedPreferencesProvider);
    final cacheKey = 'profile_${user.id}';

    // 1. Cache-first: return immediately if we have cached data
    final cached = prefs.getString(cacheKey);
    if (cached != null) {
      try {
        final decoded = jsonDecode(cached) as Map<String, dynamic>;
        // Invalidate old cache entries from public_profiles that lack stream/optional_subject
        if (decoded.containsKey('stream') ||
            decoded.containsKey('optional_subject')) {
          return UserProfile.fromJson(decoded);
        }
        // Else fall through to re-fetch from users table
      } catch (_) {}
    }

    // 2. Network Fetch — use 'users' table to get stream, optional_subject, etc.
    final supabase = ref.watch(supabaseClientProvider);
    final response = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (response != null) {
      prefs.setString(cacheKey, jsonEncode(response));
      return UserProfile.fromJson(response);
    }
    return null;
  }
}

final userProfileProvider =
    AsyncNotifierProvider<UserProfileNotifier, UserProfile?>(() {
      return UserProfileNotifier();
    });

class LeaderboardNotifier extends AsyncNotifier<List<LeaderboardUser>> {
  @override
  FutureOr<List<LeaderboardUser>> build() async {
    final profile = await ref.watch(userProfileProvider.future);
    if (profile == null) return [];

    final prefs = ref.watch(sharedPreferencesProvider);
    final cacheKey = 'leaderboard_${profile.level ?? "HSC"}';

    // 1. Cache-first
    final cached = prefs.getString(cacheKey);
    if (cached != null) {
      try {
        final List list = jsonDecode(cached);
        return list.map((e) => LeaderboardUser.fromJson(e)).toList();
      } catch (_) {}
    }

    // 2. Network Fetch
    final repository = ref.watch(dashboardRepositoryProvider);
    final fresh = await repository.getLeaderboardUsers(profile.level ?? 'HSC');

    prefs.setString(
      cacheKey,
      jsonEncode(fresh.map((e) => e.toJson()).toList()),
    );
    return fresh;
  }
}

final leaderboardProvider =
    AsyncNotifierProvider<LeaderboardNotifier, List<LeaderboardUser>>(() {
      return LeaderboardNotifier();
    });

class DashboardSubjectStatsNotifier extends AsyncNotifier<List<SubjectStats>> {
  @override
  FutureOr<List<SubjectStats>> build() async {
    final profile = await ref.watch(userProfileProvider.future);
    if (profile == null) return [];

    final prefs = ref.watch(sharedPreferencesProvider);
    final cacheKey = 'subject_stats_${profile.id}';

    // 1. Cache-first
    final cached = prefs.getString(cacheKey);
    if (cached != null) {
      try {
        final List list = jsonDecode(cached);
        return list
            .map((e) => SubjectStats.fromJson(e))
            .where((s) => s.total > 0)
            .toList();
      } catch (_) {}
    }

    // 2. Network Fetch
    final repository = ref.watch(dashboardRepositoryProvider);

    final subjects = await repository.getSubjects(
      division: profile.division,
      stream: profile.stream,
      optionalSubject: profile.optionalSubject,
    );

    final history = await repository.getUserHistory(profile.id);

    final fresh = subjects
        .map((sub) {
          final subName = sub.name.toLowerCase();
          final subId = sub.id.toLowerCase();

          int correct = 0;
          int wrong = 0;
          int skipped = 0;
          int total = 0;

          for (var exam in history) {
            final hSub = (exam.subjectLabel ?? exam.subject).toLowerCase();
            final hSubId = exam.subject.toLowerCase();

            final isMatch =
                hSubId == subId ||
                hSub.contains(subName) ||
                hSub.contains(subId) ||
                (subName == 'পদার্থবিজ্ঞান' && hSub.contains('physics')) ||
                (subName == 'রসায়ন' && hSub.contains('chemistry')) ||
                (subName == 'গণিত' && hSub.contains('math')) ||
                (subName == 'জীববিজ্ঞান' && hSub.contains('biology')) ||
                (subName == 'বাংলা' && hSub.contains('bangla')) ||
                (subName == 'ইংরেজি' && hSub.contains('english')) ||
                (subName == 'সাধারণ জ্ঞান' && hSub.contains('gk')) ||
                (subName == 'আইসিটি' && hSub.contains('ict'));

            if (isMatch) {
              correct += exam.correctCount;
              wrong += exam.wrongCount;
              total += exam.totalQuestions;
              skipped +=
                  (exam.totalQuestions - exam.correctCount - exam.wrongCount)
                      .clamp(0, 9999);
            }
          }

          return SubjectStats(
            id: sub.id,
            name: sub.name,
            correct: correct,
            wrong: wrong,
            skipped: skipped,
            total: total,
          );
        })
        .where((s) => s.total > 0)
        .toList();

    prefs.setString(
      cacheKey,
      jsonEncode(fresh.map((e) => e.toJson()).toList()),
    );
    return fresh;
  }
}

final dashboardSubjectStatsProvider =
    AsyncNotifierProvider<DashboardSubjectStatsNotifier, List<SubjectStats>>(
      () {
        return DashboardSubjectStatsNotifier();
      },
    );
