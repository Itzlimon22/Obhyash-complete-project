import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Result of a streak sync — contains everything UI needs from one DB call.
class StreakData {
  /// Consecutive days the user has been active (completed at least one exam).
  final int streakCount;

  /// Whether the user has completed an exam today.
  final bool hasCompletedToday;

  /// Which of the 7 days of the current week (Sun=0 … Sat=6) are active.
  final List<bool> weekActiveDays;

  /// Activity count for each of the last 30 days (index 0 = 29 days ago, index 29 = today).
  final List<int> last30DaysActivity;

  const StreakData({
    required this.streakCount,
    required this.hasCompletedToday,
    required this.weekActiveDays,
    required this.last30DaysActivity,
  });

  static StreakData get empty => StreakData(
        streakCount: 0,
        hasCompletedToday: false,
        weekActiveDays: List.filled(7, false),
        last30DaysActivity: List.filled(30, 0),
      );
}

/// Single source of truth for all streak logic in Flutter.
///
/// Production Rules:
/// - Streak is earned by completing ≥ 1 exam per calendar day in Bangladesh time.
/// - If a student completed yesterday's exam, their streak stays active (pending today's exam)
///   and is NOT wiped to 0 in the morning.
/// - If neither yesterday nor today was active, streak is 0.
class StreakService {
  static final _supabase = Supabase.instance.client;

  /// Local date string "YYYY-MM-DD" in Bangladesh Standard Time (UTC+6).
  static String _toBangladeshDateStr(DateTime dt) {
    // Convert to UTC, then add 6 hours for Asia/Dhaka time
    final dhaka = dt.toUtc().add(const Duration(hours: 6));
    return '${dhaka.year}-${dhaka.month.toString().padLeft(2, '0')}-${dhaka.day.toString().padLeft(2, '0')}';
  }

  /// Midnight in Bangladesh time represented as local DateTime.
  static DateTime _dhakaMidnight(DateTime dt) {
    final dhaka = dt.toUtc().add(const Duration(hours: 6));
    return DateTime(dhaka.year, dhaka.month, dhaka.day);
  }

  /// Fetches distinct calendar dates (last 90 days) on which the user completed
  /// at least one exam (from exam_results + live_exam_attempts).
  static Future<Map<String, int>> _fetchActiveDatesWithCounts(String userId) async {
    final dateCounts = <String, int>{};

    // --- exam_results ---
    try {
      final rows = await _supabase
          .from('exam_results')
          .select('created_at, date')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(300);

      for (final row in rows as List) {
        final dateStr = (row['created_at'] ?? row['date']) as String?;
        if (dateStr == null) continue;
        final dt = DateTime.tryParse(dateStr);
        if (dt != null) {
          final dStr = _toBangladeshDateStr(dt);
          dateCounts[dStr] = (dateCounts[dStr] ?? 0) + 1;
        }
      }
    } catch (e) {
      debugPrint('[StreakService] exam_results fetch error: $e');
    }

    // --- live_exam_attempts ---
    try {
      final rows = await _supabase
          .from('live_exam_attempts')
          .select('submit_time, created_at')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(300);

      for (final row in rows as List) {
        final dateStr = (row['submit_time'] ?? row['created_at']) as String?;
        if (dateStr == null) continue;
        final dt = DateTime.tryParse(dateStr);
        if (dt != null) {
          final dStr = _toBangladeshDateStr(dt);
          dateCounts[dStr] = (dateCounts[dStr] ?? 0) + 1;
        }
      }
    } catch (e) {
      debugPrint('[StreakService] live_exam_attempts fetch error: $e');
    }

    return dateCounts;
  }

  /// Computes consecutive streak matching the production PostgreSQL algorithm:
  /// - If active today: count consecutive days backwards starting today.
  /// - If NOT active today, but active yesterday: count consecutive days backwards starting yesterday.
  /// - If neither: streak is 0.
  static ({int streakCount, bool hasCompletedToday}) _computeStreak(
    Set<String> activeDates,
    DateTime now,
  ) {
    final todayStr = _toBangladeshDateStr(now);
    final todayMidnight = _dhakaMidnight(now);
    final yesterdayStr = _toBangladeshDateStr(todayMidnight.subtract(const Duration(days: 1)));

    final bool hasCompletedToday = activeDates.contains(todayStr);
    final bool hasCompletedYesterday = activeDates.contains(yesterdayStr);

    DateTime? cursor;
    if (hasCompletedToday) {
      cursor = todayMidnight;
    } else if (hasCompletedYesterday) {
      cursor = todayMidnight.subtract(const Duration(days: 1));
    }

    int streak = 0;
    if (cursor != null) {
      DateTime curr = cursor;
      while (true) {
        final dStr = _toBangladeshDateStr(curr);
        if (activeDates.contains(dStr)) {
          streak++;
          curr = curr.subtract(const Duration(days: 1));
        } else {
          break;
        }
      }
    }

    return (streakCount: streak, hasCompletedToday: hasCompletedToday);
  }

  /// Computes which days of the current week (Sun=0 … Sat=6) are active.
  static List<bool> _computeWeekActiveDays(
    Set<String> activeDates,
    DateTime now,
  ) {
    final todayMidnight = _dhakaMidnight(now);
    // Dart: weekday 1=Mon … 7=Sun. Convert to Sun=0 … Sat=6.
    final dayOfWeek = todayMidnight.weekday == DateTime.sunday ? 0 : todayMidnight.weekday;
    final startOfWeek = todayMidnight.subtract(Duration(days: dayOfWeek));

    final activeDays = List.filled(7, false);
    for (int i = 0; i < 7; i++) {
      final day = startOfWeek.add(Duration(days: i));
      activeDays[i] = activeDates.contains(_toBangladeshDateStr(day));
    }
    return activeDays;
  }

  /// Main entry point called by all consumers (MainLayout, ExamProvider,
  /// StreakDialog, DailyStreakCard, etc.).
  ///
  /// 1. Tries to call PostgreSQL RPC `get_user_streak_info`.
  /// 2. If offline or RPC unavailable, falls back to client-side computation.
  /// 3. Updates local cache and returns [StreakData].
  static Future<StreakData> syncStreak(String userId) async {
    if (userId.isEmpty) return StreakData.empty;

    final now = DateTime.now();

    // 1. Primary: Server-side RPC
    try {
      final response = await _supabase.rpc(
        'get_user_streak_info',
        params: {'p_user_id': userId},
      );

      if (response != null && response is Map) {
        final streakCount = (response['streak_count'] as num?)?.toInt() ??
            (response['current_streak'] as num?)?.toInt() ??
            (response['streak'] as num?)?.toInt() ??
            0;
        final hasCompletedToday = response['has_completed_today'] == true;
        
        final rawWeek = response['week_activity'];
        final List<bool> weekActiveDays = rawWeek is List
            ? rawWeek.map((e) => e == true).toList()
            : List.filled(7, false);

        final raw30 = response['last_30_days_activity'] ?? response['last_30_days'];
        final List<int> last30Days = raw30 is List
            ? raw30.map((e) {
                if (e is num) return e.toInt();
                if (e is Map) {
                  final cnt = e['cnt'] ?? e['count'] ?? e['exam_count'];
                  if (cnt is num) return cnt.toInt();
                  if (e['is_active'] == true) return 1;
                }
                return 0;
              }).toList()
            : List.filled(30, 0);

        // Ensure array is always exactly 30 items
        final List<int> final30Days = last30Days.length == 30
            ? last30Days
            : (last30Days.length < 30
                ? [...List.filled(30 - last30Days.length, 0), ...last30Days]
                : last30Days.sublist(last30Days.length - 30));

        _updateLocalCache(userId, streakCount).catchError((_) {});

        return StreakData(
          streakCount: streakCount,
          hasCompletedToday: hasCompletedToday,
          weekActiveDays: weekActiveDays,
          last30DaysActivity: final30Days,
        );
      }
    } catch (e) {
      debugPrint('[StreakService] RPC get_user_streak_info failed, using fallback: $e');
    }

    // 2. Fallback: Query exam activity from DB directly
    try {
      final dateCounts = await _fetchActiveDatesWithCounts(userId);
      final activeDates = dateCounts.keys.toSet();

      final streakRes = _computeStreak(activeDates, now);
      final weekActiveDays = _computeWeekActiveDays(activeDates, now);

      // Build 30-day array (index 0 = 29 days ago, index 29 = today)
      final todayMidnight = _dhakaMidnight(now);
      final List<int> last30Days = List.filled(30, 0);
      for (int i = 0; i < 30; i++) {
        final d = todayMidnight.subtract(Duration(days: 29 - i));
        final dStr = _toBangladeshDateStr(d);
        last30Days[i] = dateCounts[dStr] ?? 0;
      }

      _updateLocalCache(userId, streakRes.streakCount).catchError((_) {});

      return StreakData(
        streakCount: streakRes.streakCount,
        hasCompletedToday: streakRes.hasCompletedToday,
        weekActiveDays: weekActiveDays,
        last30DaysActivity: last30Days,
      );
    } catch (e) {
      debugPrint('[StreakService] syncStreak error: $e');
      return StreakData.empty;
    }
  }

  /// Overwrites the streak in the local SharedPreferences profile cache so
  /// stale values are never shown again after a fresh syncStreak.
  static Future<void> _updateLocalCache(String userId, int streakCount) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheKey = 'profile_$userId';
      final cached = prefs.getString(cacheKey);
      if (cached != null) {
        final decoded = jsonDecode(cached) as Map<String, dynamic>;
        decoded['streak'] = streakCount;
        decoded['streak_count'] = streakCount;
        await prefs.setString(cacheKey, jsonEncode(decoded));
      }
    } catch (e) {
      debugPrint('[StreakService] cache update error: $e');
    }
  }
}
