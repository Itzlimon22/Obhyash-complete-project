import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class StreakService {
  static final _supabase = Supabase.instance.client;

  /// Returns "YYYY-MM-DD" for local date comparison.
  static String _toLocalDateStr(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  /// Checks and updates the user's daily streak based on exam history.
  static Future<int> checkAndUpdateStreak(String userId, {bool forceSync = false}) async {
    try {
      final now = DateTime.now();
      final todayStr = _toLocalDateStr(now);

      // 1. Fetch recent exam dates from regular exams
      final data = await _supabase
          .from('exam_results')
          .select('created_at, date')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(365);

      final List<dynamic> rows = data as List<dynamic>;
      final Set<String> activeDates = {};

      for (final row in rows) {
        final dateStr = row['date'] ?? row['created_at'];
        if (dateStr == null) continue;
        final date = DateTime.tryParse(dateStr)?.toLocal();
        if (date != null) {
          activeDates.add(_toLocalDateStr(date));
        }
      }

      // Also include live exam attempts
      try {
        final liveData = await _supabase
            .from('live_exam_attempts')
            .select('submit_time')
            .eq('user_id', userId)
            .eq('status', 'submitted')
            .order('submit_time', ascending: false)
            .limit(100);

        for (final row in (liveData as List<dynamic>)) {
          final dateStr = row['submit_time'] as String?;
          if (dateStr == null) continue;
          final date = DateTime.tryParse(dateStr)?.toLocal();
          if (date != null) {
            activeDates.add(_toLocalDateStr(date));
          }
        }
      } catch (_) {}

      // 2. Calculate consecutive streak backwards
      int computedStreak = 0;
      DateTime currentDate = now;
      final yesterday = now.subtract(const Duration(days: 1));

      // If user hasn't completed an exam today, check if yesterday was active to keep streak alive
      if (!activeDates.contains(todayStr)) {
        currentDate = yesterday;
      }

      while (activeDates.contains(_toLocalDateStr(currentDate))) {
        computedStreak++;
        currentDate = currentDate.subtract(const Duration(days: 1));
      }

      // 3. Fetch user record for streak & login bonus
      final res = await _supabase
          .from('users')
          .select('xp, streak, last_streak_date')
          .eq('id', userId)
          .maybeSingle();

      if (res == null) return computedStreak;

      final currentXp = (res['xp'] as num?)?.toInt() ?? 0;
      final currentDbStreak = (res['streak'] as num?)?.toInt() ?? 0;
      final lastLoginStr = res['last_streak_date'] as String?;

      bool giveLoginBonus = false;
      if (lastLoginStr == null) {
        giveLoginBonus = true;
      } else {
        final lastLoginDate = DateTime.tryParse(lastLoginStr)?.toLocal();
        if (lastLoginDate != null && _toLocalDateStr(lastLoginDate) != todayStr) {
          giveLoginBonus = true;
        }
      }

      final newXp = giveLoginBonus ? currentXp + 20 : currentXp;

      // 4. Update DB if streak changed or login bonus given
      final Map<String, dynamic> updatePayload = {};

      if (computedStreak != currentDbStreak || forceSync) {
        updatePayload['streak'] = computedStreak;
      }

      if (giveLoginBonus) {
        updatePayload['xp'] = newXp;
        updatePayload['last_streak_date'] = now.toUtc().toIso8601String();
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
              decoded['last_streak_date'] = now.toUtc().toIso8601String();
            }
            await prefs.setString(cacheKey, jsonEncode(decoded));
          }
        } catch (_) {}
      }

      // 5. Create notification if login bonus was given
      if (giveLoginBonus) {
        final message = computedStreak > 0
            ? 'ফিরে আসার জন্য +20 XP! প্রতিদিন পরীক্ষা দিয়ে স্ট্রিক বজায় রাখো।'
            : 'আজকের লগইন এর জন্য তুমি +20 XP অর্জন করেছেন।';

        try {
          await _supabase.from('notifications').insert({
            'user_id': userId,
            'title': 'লগইন বোনাস!',
            'message': message,
            'type': 'system',
            'is_read': false,
            'metadata': {'icon': '🌟'}
          });
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
