import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../dashboard/domain/models.dart';
import 'widgets/stats_grid.dart';
import 'widgets/subjects_progress_section.dart';
import 'widgets/recent_activity_section.dart';
import 'widgets/streak_calendar.dart';

class MyProfileView extends ConsumerWidget {
  final UserProfile user;
  final List<ExamResult> history;
  final List<SubjectStats> subjectStats;
  final List<MonthCalendarDay> calendarData;
  final VoidCallback onEditProfile;
  final Function(String)? onSubjectClick;
  final VoidCallback? onViewNotifications;

  const MyProfileView({
    super.key,
    required this.user,
    required this.history,
    required this.subjectStats,
    required this.calendarData,
    required this.onEditProfile,
    this.onSubjectClick,
    this.onViewNotifications,
  });

  String _getRankName(int xp) {
    if (xp < 1000) return 'রকি';
    if (xp < 2000) return 'স্কাউট';
    if (xp < 3000) return 'ওয়ারিয়র';
    if (xp < 4000) return 'টাইটান';
    return 'লিজেন্ড';
  }

  String _getNextRankName(int xp) {
    if (xp < 1000) return 'স্কাউট';
    if (xp < 2000) return 'ওয়ারিয়র';
    if (xp < 3000) return 'টাইটান';
    if (xp < 4000) return 'লিজেন্ড';
    return 'লিজেন্ড';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final evaluatedExams =
        history; // Assuming all history are evaluated for now
    final avgScore = evaluatedExams.isNotEmpty
        ? (evaluatedExams.fold(0.0, (acc, curr) {
                    final score = curr.totalQuestions > 0
                        ? curr.correctCount / curr.totalQuestions
                        : 0.0;
                    return acc + (score * 100);
                  }) /
                  evaluatedExams.length)
              .round()
        : 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                'প্রোফাইল',
                style: TextStyle(
                  fontSize: 32, // text-4xl
                  fontWeight: FontWeight.w900, // font-extrabold
                  color: isDark
                      ? Colors.white
                      : const Color(0xFF171717), // neutral-900
                  fontFamily: 'HindSiliguri',
                  letterSpacing: -0.5, // tracking-tight
                ),
              ),
              Row(
                children: [
                  if (onViewNotifications != null)
                    Padding(
                      padding: const EdgeInsets.only(right: 12), // gap-3
                      child: OutlinedButton(
                        onPressed: onViewNotifications,
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 24,
                            vertical: 12,
                          ), // px-6 py-3
                          side: BorderSide(
                            color: isDark
                                ? const Color(0xFF262626)
                                : const Color(0xFFE5E5E5),
                          ), // neutral-800 : neutral-200
                          backgroundColor: isDark
                              ? const Color(0xFF171717)
                              : Colors.white, // neutral-900 : white
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ), // rounded-xl
                          foregroundColor: isDark
                              ? const Color(0xFFD4D4D4)
                              : const Color(
                                  0xFF404040,
                                ), // neutral-300 : neutral-700
                        ),
                        child: const Text(
                          'নোটিফিকেশন',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                      ),
                    ),
                  ElevatedButton(
                    onPressed: onEditProfile,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 12,
                      ), // px-6 py-3
                      backgroundColor: isDark
                          ? const Color(0xFF262626)
                          : const Color(
                              0xFFF5F5F5,
                            ), // neutral-800 : neutral-100
                      foregroundColor: isDark
                          ? Colors.white
                          : const Color(0xFF171717), // white : neutral-900
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ), // rounded-xl
                    ),
                    child: const Text(
                      'এডিট করুন',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24), // mb-6
          // Level Progress Bar
          Container(
            padding: const EdgeInsets.all(32), // p-8
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF171717)
                  : Colors.white, // neutral-900 : white
              borderRadius: BorderRadius.circular(24), // rounded-3xl
              border: Border.all(
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFE5E5E5),
              ), // neutral-800 : neutral-200
              boxShadow: const [
                BoxShadow(
                  color: Color(0x05000000),
                  blurRadius: 2,
                  offset: Offset(0, 1),
                ),
              ],
            ),
            child: Stack(
              children: [
                Positioned(
                  top: -64,
                  right: -64, // -mr-24 -mt-24
                  child: Container(
                    width: 192,
                    height: 192, // w-48 h-48
                    decoration: BoxDecoration(
                      color: const Color(0x0EF43F5E), // rose-500/5
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 6,
                              ), // px-4 py-1.5
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0x66881337)
                                    : const Color(
                                        0xFFFFB4E6,
                                      ), // rose-900/40 : rose-100
                                borderRadius: BorderRadius.circular(
                                  8,
                                ), // rounded-lg
                              ),
                              child: Text(
                                _getRankName(user.xp),
                                style: TextStyle(
                                  fontSize: 16, // text-base
                                  fontWeight: FontWeight.w900, // font-black
                                  color: isDark
                                      ? const Color(0xFFFB7185)
                                      : const Color(
                                          0xFFE11D48,
                                        ), // rose-400 : rose-600
                                  fontFamily: 'HindSiliguri',
                                  letterSpacing: 1, // tracking-wider
                                ),
                              ),
                            ),
                            const SizedBox(height: 8), // mb-2
                            Text(
                              'পরবর্তী লেভেল রিভার্ড',
                              style: TextStyle(
                                fontSize: 24, // text-2xl
                                fontWeight: FontWeight.w900, // font-black
                                color: isDark
                                    ? Colors.white
                                    : const Color(
                                        0xFF262626,
                                      ), // white : neutral-800
                                fontFamily: 'HindSiliguri',
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '${((user.xp % 1000) / 10).floor()}%',
                          style: TextStyle(
                            fontSize: 36, // text-4xl
                            fontWeight: FontWeight.w900, // font-black
                            color: isDark
                                ? const Color(0xFFFB7185)
                                : const Color(
                                    0xFFE11D48,
                                  ), // rose-400 : rose-600
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24), // mb-6
                    // The Bar
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8), // rounded-full
                      child: Container(
                        height: 16, // h-4
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF262626)
                              : const Color(
                                  0xFFF5F5F5,
                                ), // neutral-800 : neutral-100
                          border: Border.all(
                            color: isDark
                                ? const Color(0x80404040)
                                : const Color(0x80E5E5E5),
                          ), // neutral-700/50 : neutral-200/50
                        ),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: FractionallySizedBox(
                            widthFactor:
                                ((user.xp % 1000) / 10) / 100, // Percentage
                            child: Container(
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    Color(0xFFF43F5E),
                                    Color(0xFFEF4444),
                                    Color(0xFFE11D48),
                                  ], // rose-500, red-500, rose-600
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16), // mt-4
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _getRankName(user.xp),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFA3A3A3),
                            letterSpacing: 2,
                          ), // neutral-400
                        ),
                        Text(
                          _getNextRankName(user.xp),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFFA3A3A3),
                            letterSpacing: 2,
                          ), // neutral-400
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          // Key Stats Grid
          StatsGrid(
            examsTaken: history.length,
            avgScore: avgScore,
            xp: user.xp,
            streak: user.streakCount,
          ),

          // Main Content Layout (Left Column & Right Column mimic from Web)
          LayoutBuilder(
            builder: (context, constraints) {
              final isDesktop = constraints.maxWidth > 1024;

              final leftColumn = Column(
                children: [
                  SubjectsProgressSection(
                    subjectStats: subjectStats,
                    onSubjectClick: onSubjectClick,
                  ),
                  const SizedBox(height: 24),
                  RecentActivitySection(history: history),
                ],
              );

              final rightColumn = Column(
                children: [
                  StreakCalendar(
                    calendarData: calendarData,
                    streakCount: user.streakCount,
                  ),
                  // Weekly Activity Graph is omitted to avoid FlChart boilerplate noise for now
                ],
              );

              if (isDesktop) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: leftColumn),
                    const SizedBox(width: 24),
                    Expanded(child: rightColumn),
                  ],
                );
              }

              return Column(
                children: [leftColumn, const SizedBox(height: 24), rightColumn],
              );
            },
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
