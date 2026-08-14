import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';


class StreakService {
  static final _supabase = Supabase.instance.client;

  /// Calculates the difference in days between two dates using local midnight.
  static int _daysDiff(DateTime from, DateTime to) {
    final fromMidnight = DateTime(from.year, from.month, from.day);
    final toMidnight = DateTime(to.year, to.month, to.day);
    return toMidnight.difference(fromMidnight).inDays;
  }

  /// Returns "YYYY-MM-DD" for local date comparison.
  static String _toLocalDateStr(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }

  /// Checks and updates the user's daily streak based on exam history.
  /// Runs ONLY ONCE per calendar day using SharedPreferences as a guard, unless [forceSync] is true.
  static Future<void> checkAndUpdateStreak(String userId, {bool forceSync = false}) async {
    try {
      final now = DateTime.now();
      final todayStr = _toLocalDateStr(now);
      
      final prefs = await SharedPreferences.getInstance();
      final streakKey = 'streak_checked_$userId';
      final lastCheckedDate = prefs.getString(streakKey);

      if (!forceSync && lastCheckedDate == todayStr) {
        // Already checked today locally, do nothing.
        return;
      }

      // 1. Fetch recent exam dates for this user to calculate actual streak
      final data = await _supabase
          .from('exam_results')
          .select('created_at, date')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(365); // Support up to a year of streak calculation

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

      // 2. Calculate streak backwards from today or yesterday
      int computedStreak = 0;
      DateTime currentDate = now;
      final yesterday = now.subtract(const Duration(days: 1));
      
      if (!activeDates.contains(todayStr)) {
        currentDate = yesterday;
      }
      
      while (activeDates.contains(_toLocalDateStr(currentDate))) {
        computedStreak++;
        currentDate = currentDate.subtract(const Duration(days: 1));
      }

      // 3. Fetch fresh user data to give login bonus
      final res = await _supabase
          .from('users')
          .select('xp, last_streak_date')
          .eq('id', userId)
          .maybeSingle();
      
      if (res == null) return;

      final currentXp = (res['xp'] as num?)?.toInt() ?? 0;
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

      // 4. Update DB
      final Map<String, dynamic> updatePayload = {
        'streak': computedStreak,
        'streak_count': computedStreak,
      };
      
      if (giveLoginBonus) {
        updatePayload['xp'] = newXp;
        updatePayload['last_streak_date'] = now.toUtc().toIso8601String();
      }

      await _supabase.from('users').update(updatePayload).eq('id', userId);

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

      // Mark locally as checked today
      await prefs.setString(streakKey, todayStr);

    } catch (e) {
      debugPrint('[StreakService] Error checking streak: $e');
    }
  }
}
