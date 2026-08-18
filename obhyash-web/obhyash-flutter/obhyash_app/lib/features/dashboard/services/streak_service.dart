import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class StreakService {
  static final _supabase = Supabase.instance.client;

  /// Returns "YYYY-MM-DD" for local calendar date comparison (safe for BST UTC+6).
  static String _toLocalDateStr(DateTime date) {
    final local = date.toLocal();
    return '${local.year}-${local.month.toString().padLeft(2, '0')}-${local.day.toString().padLeft(2, '0')}';
  }

  /// Checks and synchronizes the user's daily streak across exams and logins.
  static Future<int> checkAndUpdateStreak(String userId, {bool forceSync = false}) async {
    if (userId.isEmpty) return 0;

    try {
      final now = DateTime.now();
      final todayStr = _toLocalDateStr(now);

      // 1. Collect all active calendar days from practice exams, live exams, and logins
      final Set<String> activeDates = {};

      try {
        final examData = await _supabase
            .from('exam_results')
            .select('created_at, date')
            .eq('user_id', userId)
            .order('created_at', ascending: false)
            .limit(365);

        for (final row in (examData as List<dynamic>)) {
          final createdStr = row['created_at'] as String?;
          final dateStr = row['date'] as String?;

          if (createdStr != null) {
            final dt = DateTime.tryParse(createdStr);
            if (dt != null) activeDates.add(_toLocalDateStr(dt));
          }
          if (dateStr != null && dateStr.length >= 10) {
            activeDates.add(dateStr.substring(0, 10));
          }
        }
      } catch (e) {
        debugPrint('[StreakService] exam_results fetch error: $e');
      }

      try {
        final liveData = await _supabase
            .from('live_exam_attempts')
            .select('submit_time')
            .eq('user_id', userId)
            .eq('status', 'submitted')
            .order('submit_time', ascending: false)
            .limit(100);

        for (final row in (liveData as List<dynamic>)) {
          final submitStr = row['submit_time'] as String?;
          if (submitStr != null) {
            final dt = DateTime.tryParse(submitStr);
            if (dt != null) activeDates.add(_toLocalDateStr(dt));
          }
        }
      } catch (e) {
        debugPrint('[StreakService] live_exam_attempts fetch error: $e');
      }

      // Today the user is active in the app
      activeDates.add(todayStr);

      // 2. Compute consecutive days streak strictly from active dates backwards
      int computedStreak = 0;
      DateTime checkDate = DateTime(now.year, now.month, now.day);
      while (activeDates.contains(_toLocalDateStr(checkDate))) {
        computedStreak++;
        checkDate = checkDate.subtract(const Duration(days: 1));
      }

      // 3. Fetch current user row from DB
      final res = await _supabase
          .from('users')
          .select('xp, streak, last_streak_date')
          .eq('id', userId)
          .maybeSingle();

      if (res == null) return computedStreak;

      final currentXp = (res['xp'] as num?)?.toInt() ?? 0;
      final currentDbStreak = (res['streak'] as num?)?.toInt() ?? 0;
      final lastStreakDateStr = res['last_streak_date'] as String?;

      bool giveLoginBonus = false;

      if (lastStreakDateStr == null) {
        giveLoginBonus = true;
      } else {
        final lastStreakDate = DateTime.tryParse(lastStreakDateStr)?.toLocal();
        if (lastStreakDate == null || _toLocalDateStr(lastStreakDate) != todayStr) {
          giveLoginBonus = true;
        }
      }

      final newXp = giveLoginBonus ? currentXp + 20 : currentXp;

      // 4. Update Database if streak changed, login bonus given, or forceSync
      final Map<String, dynamic> updatePayload = {};

      if (computedStreak != currentDbStreak || forceSync) {
        updatePayload['streak'] = computedStreak;
      }

      if (giveLoginBonus || forceSync || lastStreakDateStr == null) {
        updatePayload['last_streak_date'] = now.toUtc().toIso8601String();
        if (giveLoginBonus) {
          updatePayload['xp'] = newXp;
        }
      }

      if (updatePayload.isNotEmpty) {
        try {
          await _supabase.from('users').update(updatePayload).eq('id', userId);
        } catch (dbErr) {
          debugPrint('[StreakService] DB update error: $dbErr');
        }

        // Also sync local cached profile in SharedPreferences so UI updates without delay
        try {
          final prefs = await SharedPreferences.getInstance();
          final cacheKey = 'profile_$userId';
          final cached = prefs.getString(cacheKey);
          if (cached != null) {
            final decoded = jsonDecode(cached) as Map<String, dynamic>;
            decoded['streak'] = computedStreak;
            decoded['streak_count'] = computedStreak;
            if (giveLoginBonus) {
              decoded['xp'] = newXp;
            }
            decoded['last_streak_date'] = now.toUtc().toIso8601String();
            await prefs.setString(cacheKey, jsonEncode(decoded));
          }
        } catch (_) {}
      }

      // 5. Create notification if login bonus was given (at most once per day)
      if (giveLoginBonus) {
        try {
          final prefs = await SharedPreferences.getInstance();
          final notifKey = 'login_bonus_notif_${userId}_$todayStr';
          final alreadyNotified = prefs.getBool(notifKey) ?? false;

          if (!alreadyNotified) {
            await prefs.setBool(notifKey, true);
            final message = computedStreak > 1
                ? 'ফিরে আসার জন্য +20 XP! প্রতিদিন পরীক্ষা দিয়ে স্ট্রিক বজায় রাখো।'
                : 'আজকের লগইন এর জন্য তুমি +20 XP অর্জন করেছেন।';

            await _supabase.from('notifications').insert({
              'user_id': userId,
              'title': 'লগইন বোনাস!',
              'message': message,
              'type': 'system',
              'is_read': false,
            });
          }
        } catch (e) {
          debugPrint('Failed to create notification: $e');
        }
      }

      return computedStreak;
    } catch (e) {
      debugPrint('[StreakService] Error checking streak: $e');
      return 0;
    }
  }
}
