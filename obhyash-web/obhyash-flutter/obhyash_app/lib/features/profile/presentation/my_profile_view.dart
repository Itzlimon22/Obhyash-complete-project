import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../dashboard/domain/models.dart';
import 'widgets/stats_grid.dart';
import 'widgets/subjects_progress_section.dart';
import 'widgets/recent_activity_section.dart';
import 'widgets/streak_calendar.dart';
import '../../../core/presentation/widgets/user_avatar.dart';
import 'widgets/avatar_picker_modal.dart';

class MyProfileView extends ConsumerWidget {
  final UserProfile user;
  final List<ExamResult> history;
  final List<SubjectStats> subjectStats;
  final List<MonthCalendarDay> calendarData;
  final Function(String)? onSubjectClick;

  const MyProfileView({
    super.key,
    required this.user,
    required this.history,
    required this.subjectStats,
    required this.calendarData,
    this.onSubjectClick,
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
          // User Profile Card
          _UserProfileCard(user: user, isDark: isDark),
          const SizedBox(height: 24), // mb-6
          // Level Progress Bar (Premium Design)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF1E1B4B), const Color(0xFF312E81)]
                    : [const Color(0xFF312E81), const Color(0xFF4338CA)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x4D312E81),
                  blurRadius: 15,
                  offset: Offset(0, 8),
                ),
              ],
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  top: -60,
                  right: -40,
                  child: Icon(
                    Icons.stars_rounded,
                    size: 160,
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0x33F59E0B),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: const Color(0x80F59E0B),
                                  width: 1,
                                ),
                              ),
                              child: Row(
                                children: [
                                  const Icon(
                                    Icons.emoji_events_rounded,
                                    color: Color(0xFFFBBF24),
                                    size: 18,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    _getRankName(user.xp),
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFFFBBF24),
                                      fontFamily: 'Anek Bangla',
                                      letterSpacing: 1.2,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              'পরবর্তী লেভেল রিওয়ার্ড',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: Colors.white70,
                                fontFamily: 'Anek Bangla',
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '${((user.xp % 1000) / 10).floor()}%',
                          style: const TextStyle(
                            fontSize: 40,
                            fontWeight: FontWeight.w900,
                            color: Colors.white,
                            fontFamily: 'Anek Bangla',
                            height: 1,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    // The Bar
                    Container(
                      height: 12,
                      decoration: BoxDecoration(
                        color: Colors.black26,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: Colors.white12,
                        ),
                      ),
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: FractionallySizedBox(
                          widthFactor: ((user.xp % 1000) / 10) / 100,
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              gradient: const LinearGradient(
                                colors: [
                                  Color(0xFF1E3A8A),
                                  Color(0xFFFDE047),
                                ],
                              ),
                              boxShadow: const [
                                BoxShadow(
                                  color: Color(0x66F59E0B),
                                  blurRadius: 8,
                                  offset: Offset(0, 2),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _getRankName(user.xp),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white60,
                            letterSpacing: 1.5,
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                        Text(
                          _getNextRankName(user.xp),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white60,
                            letterSpacing: 1.5,
                            fontFamily: 'Anek Bangla',
                          ),
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
          const SizedBox(height: 24),

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


// ── User Profile Card ─────────────────────────────────────────────────────────

class _UserProfileCard extends StatelessWidget {
  final UserProfile user;
  final bool isDark;

  const _UserProfileCard({required this.user, required this.isDark});

  String get _initials {
    final parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0].isNotEmpty ? parts[0][0].toUpperCase() : '?';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000),
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar
          GestureDetector(
            onTap: () => AvatarPickerModal.show(context, user),
            child: Stack(
              children: [
                UserAvatar(
                  id: user.id,
                  name: user.name,
                  avatarUrl: user.avatarUrl,
                  gender: user.gender,
                  size: 64,
                  showBorder: true,
                  borderColor: Colors.white,
                  borderWidth: 2,
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF000000),
                    fontFamily: 'Anek Bangla',
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                if (user.email != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    user.email!,
                    style: TextStyle(
                      fontSize: 16,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    if (user.institute != null && user.institute!.isNotEmpty)
                      _InfoChip(label: user.institute!, isDark: isDark),
                    if (user.stream != null && user.stream!.isNotEmpty)
                      _InfoChip(label: user.stream!, isDark: isDark),
                    if (user.batch != null && user.batch!.isNotEmpty)
                      _InfoChip(label: 'ব্যাচ: ${user.batch!}', isDark: isDark),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final bool isDark;

  const _InfoChip({required this.label, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
          fontFamily: 'Anek Bangla',
        ),
      ),
    );
  }
}
