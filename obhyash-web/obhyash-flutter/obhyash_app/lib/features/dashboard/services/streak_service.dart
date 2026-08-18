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

  /// Fetches real-time streak directly from the Supabase `users` database table.
  /// Does NOT overwrite database values with offline calculations.
  static Future<int> checkAndUpdateStreak(String userId, {bool forceSync = false}) async {
    if (userId.isEmpty) return 0;

    try {
      final now = DateTime.now();
      final todayStr = _toLocalDateStr(now);

      // Fetch current authoritative user row from Supabase DB
      final res = await _supabase
          .from('users')
          .select('xp, streak, last_streak_date')
          .eq('id', userId)
          .maybeSingle();

      if (res == null) return 0;

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

      // Only update login bonus / last_streak_date if a bonus is due, NEVER overwrite streak
      if (giveLoginBonus) {
        try {
          await _supabase.from('users').update({
            'last_streak_date': now.toUtc().toIso8601String(),
            'xp': newXp,
          }).eq('id', userId);
        } catch (dbErr) {
          debugPrint('[StreakService] DB login bonus update error: $dbErr');
        }
      }

      // Sync local cache
      try {
        final prefs = await SharedPreferences.getInstance();
        final cacheKey = 'profile_$userId';
        final cached = prefs.getString(cacheKey);
        if (cached != null) {
          final decoded = jsonDecode(cached) as Map<String, dynamic>;
          decoded['streak'] = currentDbStreak;
          decoded['streak_count'] = currentDbStreak;
          if (giveLoginBonus) {
            decoded['xp'] = newXp;
            decoded['last_streak_date'] = now.toUtc().toIso8601String();
          }
          await prefs.setString(cacheKey, jsonEncode(decoded));
        }
      } catch (_) {}

      return currentDbStreak;
    } catch (e) {
      debugPrint('[StreakService] Error fetching realtime streak from DB: $e');
      return 0;
    }
  }

  /// Increments streak when an exam is submitted today.
  static Future<int> onExamCompleted(String userId) async {
    if (userId.isEmpty) return 0;
    try {
      final now = DateTime.now();
      final todayStr = _toLocalDateStr(now);

      final res = await _supabase
          .from('users')
          .select('streak, last_streak_date')
          .eq('id', userId)
          .maybeSingle();

      if (res == null) return 0;

      final currentStreak = (res['streak'] as num?)?.toInt() ?? 0;
      final lastDateStr = res['last_streak_date'] as String?;
      
      int newStreak = currentStreak;
      if (lastDateStr == null) {
        newStreak = currentStreak > 0 ? currentStreak + 1 : 1;
      } else {
        final lastDate = DateTime.tryParse(lastDateStr)?.toLocal();
        if (lastDate != null) {
          final lastDateOnly = _toLocalDateStr(lastDate);
          if (lastDateOnly != todayStr) {
            final diffDays = DateTime(now.year, now.month, now.day)
                .difference(DateTime(lastDate.year, lastDate.month, lastDate.day))
                .inDays;
            if (diffDays == 1) {
              newStreak = currentStreak + 1;
            } else if (diffDays > 1) {
              newStreak = 1;
            }
          }
        }
      }

      await _supabase.from('users').update({
        'streak': newStreak,
        'last_streak_date': now.toUtc().toIso8601String(),
      }).eq('id', userId);

      return newStreak;
    } catch (e) {
      debugPrint('[StreakService] onExamCompleted error: $e');
      return 0;
    }
  }
}
