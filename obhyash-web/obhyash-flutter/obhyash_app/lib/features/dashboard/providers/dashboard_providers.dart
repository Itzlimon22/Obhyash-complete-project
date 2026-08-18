import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../domain/dashboard_repository.dart';
import '../domain/models.dart';
import '../../live_exam/domain/models.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/providers/shared_prefs_provider.dart';

/// Mirrors the web app's `getAvatarUrl()` in storage-service.ts.
/// If [raw] is already a full https URL, returns it unchanged.
/// If it's a storage path (e.g. "1234-abc.jpg"), constructs the
/// Supabase Storage public URL for the 'avatars' bucket.
String? _resolveAvatarUrl(String? raw) {
  if (raw == null || raw.isEmpty || raw == 'null') return null;
  if (raw.startsWith('http')) return raw;
  // It's a bare file path — build the full public URL
  final publicUrl = Supabase.instance.client.storage
      .from('avatars')
      .getPublicUrl(raw);
  return publicUrl;
}

/// Builds a UserProfile from JSON and resolves its avatarUrl.
UserProfile _profileFromJson(Map<String, dynamic> json) {
  final profile = UserProfile.fromJson(json);
  final resolved = _resolveAvatarUrl(profile.avatarUrl);
  if (resolved == profile.avatarUrl) return profile;
  // Return a copy with the resolved URL
  return UserProfile(
    id: profile.id,
    name: profile.name,
    email: profile.email,
    xp: profile.xp,
    level: profile.level,
    division: profile.division,
    stream: profile.stream,
    optionalSubject: profile.optionalSubject,
    institute: profile.institute,
    streakCount: profile.streakCount,
    phone: profile.phone,
    dob: profile.dob,
    gender: profile.gender,
    address: profile.address,
    batch: profile.batch,
    target: profile.target,
    sscRoll: profile.sscRoll,
    sscReg: profile.sscReg,
    sscBoard: profile.sscBoard,
    sscYear: profile.sscYear,
    avatarUrl: resolved,
    examTarget: profile.examTarget,
    dailyExamsGoal: profile.dailyExamsGoal,
    admissionTrackInterest: profile.admissionTrackInterest,
    lastStreakDate: profile.lastStreakDate,
    isSubscribed: profile.isSubscribed,
    subscriptionStatus: profile.subscriptionStatus,
    subscriptionExpiresAt: profile.subscriptionExpiresAt,
  );
}

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
        // Only use cache if it came from the 'users' table (has users-specific fields)
        // Old cache from public_profiles lacks 'email', 'phone', etc.
        if (decoded.containsKey('email') ||
            decoded.containsKey('phone') ||
            decoded.containsKey('stream') ||
            decoded.containsKey('optional_subject')) {
          return _profileFromJson(decoded);
        }
        // Else fall through to re-fetch from users table
      } catch (_) {}
    }

    // 2. Network Fetch — use 'users' table to get stream, optional_subject, etc.
    final supabase = ref.watch(supabaseClientProvider);
    try {
      final response = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

      if (response != null) {
        prefs.setString(cacheKey, jsonEncode(response));
        return _profileFromJson(response);
      }
    } catch (e) {
      debugPrint('[UserProfileNotifier] users table query failed: $e');
    }

    // Fallback: try public_profiles view (available even without a users row)
    try {
      final fallback = await supabase
          .from('public_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

      if (fallback != null) {
        // public_profiles may lack email/phone/stream — store with flag so we re-fetch later
        return _profileFromJson(fallback);
      }
    } catch (e) {
      debugPrint('[UserProfileNotifier] public_profiles fallback failed: $e');
    }

    return null;
  }
}

final userProfileProvider =
    AsyncNotifierProvider<UserProfileNotifier, UserProfile?>(() {
      return UserProfileNotifier();
    });

const int _kLeaderboardTtlMs = 10 * 60 * 1000; // 10 minutes
const int _kSubjectStatsTtlMs = 15 * 60 * 1000; // 15 minutes

class LeaderboardNotifier extends AsyncNotifier<List<LeaderboardUser>> {
  @override
  FutureOr<List<LeaderboardUser>> build() async {
    final profile = await ref.watch(userProfileProvider.future);
    if (profile == null) return [];

    final prefs = ref.watch(sharedPreferencesProvider);
    final cacheKey = 'leaderboard_${profile.level ?? "HSC"}';
    final cacheTimeKey = '${cacheKey}_time';

    // 1. Cache-first with TTL check (10 min)
    final cached = prefs.getString(cacheKey);
    final cachedTime = prefs.getInt(cacheTimeKey) ?? 0;
    final isCacheFresh = (DateTime.now().millisecondsSinceEpoch - cachedTime) < _kLeaderboardTtlMs;

    if (cached != null && isCacheFresh) {
      try {
        final List list = jsonDecode(cached);
        final cachedUsers = list
            .map((e) => LeaderboardUser.fromJson(e))
            .toList();
        if (cachedUsers.isNotEmpty) {
          return cachedUsers;
        }
      } catch (_) {}
    }

    // 2. Network Fetch
    final repository = ref.watch(dashboardRepositoryProvider);
    final fresh = await repository.getLeaderboardUsers(profile.level ?? 'HSC');

    if (fresh.isNotEmpty) {
      prefs.setString(
        cacheKey,
        jsonEncode(fresh.map((e) => e.toJson()).toList()),
      );
      prefs.setInt(cacheTimeKey, DateTime.now().millisecondsSinceEpoch);
    }
    return fresh;
  }

  Future<void> forceRefresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      final profile = await ref.read(userProfileProvider.future);
      if (profile == null) return [];

      final repository = ref.read(dashboardRepositoryProvider);
      final fresh = await repository.getLeaderboardUsers(profile.level ?? 'HSC');

      final prefs = ref.read(sharedPreferencesProvider);
      final cacheKey = 'leaderboard_${profile.level ?? "HSC"}';
      prefs.setString(cacheKey, jsonEncode(fresh.map((e) => e.toJson()).toList()));
      prefs.setInt('${cacheKey}_time', DateTime.now().millisecondsSinceEpoch);

      return fresh;
    });
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
    final cacheKey = 'subject_stats_v2_${profile.id}';
    final cacheTimeKey = '${cacheKey}_time';

    // 1. Cache-first with TTL check (15 min)
    final cached = prefs.getString(cacheKey);
    final cachedTime = prefs.getInt(cacheTimeKey) ?? 0;
    final isCacheFresh = (DateTime.now().millisecondsSinceEpoch - cachedTime) < _kSubjectStatsTtlMs;

    if (cached != null && isCacheFresh) {
      try {
        final List list = jsonDecode(cached);
        final cachedStats = list.map((e) => SubjectStats.fromJson(e)).toList();
        // Only use cache if it has data; empty cache forces a re-fetch
        if (cachedStats.isNotEmpty) {
          return cachedStats;
        }
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

    final fresh = subjects.map((sub) {
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
          skipped += (exam.totalQuestions - exam.correctCount - exam.wrongCount)
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
    }).toList();

    prefs.setString(
      cacheKey,
      jsonEncode(fresh.map((e) => e.toJson()).toList()),
    );
    prefs.setInt(cacheTimeKey, DateTime.now().millisecondsSinceEpoch);
    return fresh;
  }
}

final dashboardSubjectStatsProvider =
    AsyncNotifierProvider<DashboardSubjectStatsNotifier, List<SubjectStats>>(
      () {
        return DashboardSubjectStatsNotifier();
      },
    );

class DashboardLiveExamsNotifier extends AsyncNotifier<List<LiveExam>> {
  @override
  FutureOr<List<LiveExam>> build() async {
    final profile = await ref.watch(userProfileProvider.future);
    final prefs = ref.watch(sharedPreferencesProvider);

    final targetStream = profile?.stream?.toLowerCase().trim() ?? '';
    final examTarget = profile?.examTarget?.toLowerCase().trim() ?? '';
    final cacheKey = 'cached_dashboard_live_exams_${targetStream}_$examTarget';

    // 1. Cache-first: return immediately if cached
    final cached = prefs.getString(cacheKey);
    if (cached != null) {
      try {
        final List list = jsonDecode(cached);
        final cachedExams = list
            .map((e) => LiveExam.fromJson(e as Map<String, dynamic>))
            .where((e) => e.isOngoing || e.isUpcoming)
            .toList();
        if (cachedExams.isNotEmpty) {
          // Trigger background refresh
          unawaited(_fetchAndCache(targetStream, examTarget, cacheKey, prefs));
          return cachedExams;
        }
      } catch (_) {}
    }

    // 2. Network fetch
    return _fetchAndCache(targetStream, examTarget, cacheKey, prefs);
  }

  Future<List<LiveExam>> _fetchAndCache(
    String targetStream,
    String examTarget,
    String cacheKey,
    dynamic prefs,
  ) async {
    final supabase = ref.read(supabaseClientProvider);
    try {
      // Fetch all published/active live exams
      final examsResponse = await supabase
          .from('live_exams')
          .select()
          .inFilter('status', ['published', 'active', 'ongoing', 'upcoming', 'Published'])
          .order('start_time', ascending: true);

      final List<LiveExam> allExams = (examsResponse as List)
          .map((e) => LiveExam.fromJson(e as Map<String, dynamic>))
          .toList();

      // Filter: keep ongoing or upcoming exams
      final activeExams =
          allExams.where((e) => e.isOngoing || e.isUpcoming).toList();

      // Sort: ongoing exams first, then upcoming exams by nearest start time
      activeExams.sort((a, b) {
        if (a.isOngoing && !b.isOngoing) return -1;
        if (!a.isOngoing && b.isOngoing) return 1;
        return a.startTime.compareTo(b.startTime);
      });

      // If student has a specific stream or exam target, prioritize matching exams first
      final matchingExams = activeExams.where((e) {
        final cat = e.category.toLowerCase().trim();
        if (cat.isEmpty || cat == 'all' || cat == 'general') return true;
        if (targetStream.isNotEmpty && (cat.contains(targetStream) || targetStream.contains(cat))) return true;
        if (examTarget.isNotEmpty && (cat.contains(examTarget) || examTarget.contains(cat))) return true;
        return false;
      }).toList();

      final displayExams = matchingExams.isNotEmpty ? matchingExams : activeExams;

      prefs.setString(
        cacheKey,
        jsonEncode(displayExams.map((e) => e.toJson()).toList()),
      );

      return displayExams;
    } catch (e) {
      debugPrint('[DashboardLiveExamsNotifier] failed: $e');
      return [];
    }
  }
}

final dashboardLiveExamsProvider =
    AsyncNotifierProvider<DashboardLiveExamsNotifier, List<LiveExam>>(() {
  return DashboardLiveExamsNotifier();
});
