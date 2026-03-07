import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Returns the key used to store daily completions in SharedPreferences.
String _dailyKey(String userId) {
  final today = DateFormat('yyyy-MM-dd').format(DateTime.now());
  return 'obhyash_daily_goal_${userId}_$today';
}

/// Returns how many exams the user has completed today.
Future<int> getDailyCompletions(String userId) async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getInt(_dailyKey(userId)) ?? 0;
}

/// Increments daily completions and returns the new count.
Future<int> incrementDailyCompletions(String userId) async {
  final prefs = await SharedPreferences.getInstance();
  final key = _dailyKey(userId);
  final current = prefs.getInt(key) ?? 0;
  final next = current + 1;
  await prefs.setInt(key, next);
  return next;
}

class DailyGoalCard extends StatelessWidget {
  final int completedToday;
  final int goal;
  final VoidCallback? onStartExam;

  const DailyGoalCard({
    super.key,
    required this.completedToday,
    this.goal = 3,
    this.onStartExam,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final pct = (goal > 0 ? completedToday / goal : 0.0).clamp(0.0, 1.0);
    final isDone = completedToday >= goal;

    final bgColor = isDone
        ? (isDark ? const Color(0xFF0A1F17) : const Color(0xFFF0FDF4))
        : (isDark ? const Color(0xFF171717) : Colors.white);
    final borderColor = isDone
        ? (isDark ? const Color(0xFF065F46) : const Color(0xFFA7F3D0))
        : (isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5));

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          // Circular progress ring
          SizedBox(
            width: 48,
            height: 48,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 48,
                  height: 48,
                  child: CircularProgressIndicator(
                    value: pct,
                    strokeWidth: 4.5,
                    backgroundColor: isDark
                        ? const Color(0xFF404040)
                        : const Color(0xFFE5E5E5),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      isDone
                          ? const Color(0xFF10B981) // emerald-500
                          : const Color(0xFF047857), // emerald-700
                    ),
                  ),
                ),
                Text(
                  '$completedToday',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : const Color(0xFF171717),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 14),
          // Labels
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'আজকের লক্ষ্য',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF10B981),
                    letterSpacing: 0.5,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  isDone
                      ? 'লক্ষ্য পূরণ হয়েছে! 🎉'
                      : '$completedToday / $goal পরীক্ষা সম্পন্ন',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: isDark
                        ? const Color(0xFFD4D4D4)
                        : const Color(0xFF171717),
                  ),
                ),
              ],
            ),
          ),
          // CTA button
          if (!isDone && onStartExam != null)
            GestureDetector(
              onTap: onStartExam,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFF047857),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Text(
                  'শুরু করো',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
