import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../dashboard/domain/models.dart';
import 'widgets/stats_grid.dart';
import 'widgets/badges_showcase_section.dart';
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

  ({
    String currentRank,
    String nextRank,
    double progress,
    int percent,
    int currentXp,
    int nextTargetXp,
    String xpText,
  }) _getLevelInfo(int xp) {
    if (xp < 500) {
      final p = (xp / 500.0).clamp(0.0, 1.0);
      return (
        currentRank: 'রুকি',
        nextRank: 'স্কাউট',
        progress: p,
        percent: (p * 100).round(),
        currentXp: xp,
        nextTargetXp: 500,
        xpText: '$xp / ৫০০ XP',
      );
    } else if (xp < 2000) {
      final p = ((xp - 500) / 1500.0).clamp(0.0, 1.0);
      return (
        currentRank: 'স্কাউট',
        nextRank: 'ওয়ারিয়র',
        progress: p,
        percent: (p * 100).round(),
        currentXp: xp,
        nextTargetXp: 2000,
        xpText: '$xp / ২,০০০ XP',
      );
    } else if (xp < 5000) {
      final p = ((xp - 2000) / 3000.0).clamp(0.0, 1.0);
      return (
        currentRank: 'ওয়ারিয়র',
        nextRank: 'টাইটান',
        progress: p,
        percent: (p * 100).round(),
        currentXp: xp,
        nextTargetXp: 5000,
        xpText: '$xp / ৫,০০০ XP',
      );
    } else if (xp < 10000) {
      final p = ((xp - 5000) / 5000.0).clamp(0.0, 1.0);
      return (
        currentRank: 'টাইটান',
        nextRank: 'লিজেন্ড',
        progress: p,
        percent: (p * 100).round(),
        currentXp: xp,
        nextTargetXp: 10000,
        xpText: '$xp / ১০,০০০ XP',
      );
    } else {
      return (
        currentRank: 'লিজেন্ড',
        nextRank: 'সর্বোচ্চ স্তর',
        progress: 1.0,
        percent: 100,
        currentXp: xp,
        nextTargetXp: 10000,
        xpText: '$xp XP (সর্বোচ্চ স্তর)',
      );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final levelInfo = _getLevelInfo(user.xp);

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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // User Profile Card
          _UserProfileCard(user: user, isDark: isDark),
          const SizedBox(height: 20),
          // Level Progress Bar (Premium Design)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: isDark
                    ? [const Color(0xFF1E1B4B), const Color(0xFF312E81)]
                    : [const Color(0xFF312E81), const Color(0xFF4338CA)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: isDark ? Colors.black38 : const Color(0x4D312E81),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned(
                  top: -40,
                  right: -20,
                  child: Icon(
                    Icons.stars_rounded,
                    size: 130,
                    color: Colors.white.withValues(alpha: 0.05),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 6,
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
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.emoji_events_rounded,
                                      color: Color(0xFFFBBF24),
                                      size: 16,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      levelInfo.currentRank,
                                      style: const TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFFFBBF24),
                                        fontFamily: 'Anek Bangla',
                                        letterSpacing: 0.8,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 8),
                              const Text(
                                'পরবর্তী লেভেল রিওয়ার্ড',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white70,
                                  fontFamily: 'Anek Bangla',
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${levelInfo.percent}%',
                              style: const TextStyle(
                                fontSize: 26,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                                fontFamily: 'Anek Bangla',
                                height: 1,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 2,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.black26,
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(
                                  color: Colors.white12,
                                  width: 0.8,
                                ),
                              ),
                              child: Text(
                                levelInfo.xpText,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFFFDE047),
                                  fontFamily: 'Anek Bangla',
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 18),
                    // The Bar
                    Container(
                      height: 10,
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
                          widthFactor: levelInfo.progress,
                          child: Container(
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              gradient: const LinearGradient(
                                colors: [
                                  Color(0xFF60A5FA),
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
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          levelInfo.currentRank,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white60,
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                        Text(
                          levelInfo.nextRank,
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: Colors.white60,
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
          const SizedBox(height: 20),

          // Key Stats Grid
          StatsGrid(
            examsTaken: history.length,
            avgScore: avgScore,
            xp: user.xp,
            streak: user.streakCount,
          ),
          const SizedBox(height: 20),


          // Badges Showcase
          BadgesShowcaseSection(userId: user.id),
          const SizedBox(height: 20),

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
                  const SizedBox(height: 20),
                  RecentActivitySection(history: history),
                ],
              );

              final rightColumn = Column(
                children: [
                  StreakCalendar(
                    calendarData: calendarData,
                    streakCount: user.streakCount,
                  ),
                ],
              );

              if (isDesktop) {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(child: leftColumn),
                    const SizedBox(width: 20),
                    Expanded(child: rightColumn),
                  ],
                );
              }

              return Column(
                children: [leftColumn, const SizedBox(height: 20), rightColumn],
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

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Avatar with Camera Edit Badge
          GestureDetector(
            onTap: () => AvatarPickerModal.show(context, user),
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE2E8F0),
                      width: 2,
                    ),
                  ),
                  child: ClipOval(
                    child: UserAvatar(
                      id: user.id,
                      name: user.name,
                      avatarUrl: user.avatarUrl,
                      gender: user.gender,
                      size: 64,
                      showBorder: false,
                    ),
                  ),
                ),
                Positioned(
                  bottom: -2,
                  right: -2,
                  child: Container(
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF059669),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? const Color(0xFF18181B) : Colors.white,
                        width: 2,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.25),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.camera_alt_rounded,
                      size: 13,
                      color: Colors.white,
                    ),
                  ),
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
                    fontSize: 17.5,
                    fontWeight: FontWeight.w800,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                    fontFamily: 'Anek Bangla',
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                if (user.email != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    user.email!,
                    style: TextStyle(
                      fontSize: 12.5,
                      color: isDark
                          ? const Color(0xFFA1A1AA)
                          : const Color(0xFF64748B),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6,
                  runSpacing: 5,
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
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF27272A) : const Color(0xFFF4F4F5),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE4E4E7),
          width: 0.8,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF3F3F46),
          fontFamily: 'Anek Bangla',
        ),
      ),
    );
  }
}
