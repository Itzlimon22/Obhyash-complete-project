import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/utils/bangla_name_helper.dart';
import '../../gamification/presentation/widgets/xp_guide_bottom_sheet.dart';
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
    Color badgeColor,
    IconData badgeIcon,
    Color startColor,
    Color endColor,
  }) _getLevelInfo(int xp) {
    if (xp < 1000) {
      final p = (xp / 1000.0).clamp(0.0, 1.0);
      return (
        currentRank: 'রুকি',
        nextRank: 'স্কাউট',
        progress: p,
        percent: (p * 100).round(),
        currentXp: xp,
        nextTargetXp: 1000,
        xpText: '${BanglaNameHelper.toBanglaNumeral(xp)} / ১,০০০ XP',
        badgeColor: const Color(0xFF10B981),
        badgeIcon: LucideIcons.sprout,
        startColor: const Color(0xFF064E3B),
        endColor: const Color(0xFF047857),
      );
    } else if (xp < 3000) {
      final p = ((xp - 1000) / 2000.0).clamp(0.0, 1.0);
      return (
        currentRank: 'স্কাউট',
        nextRank: 'ওয়ারিয়র',
        progress: p,
        percent: (p * 100).round(),
        currentXp: xp,
        nextTargetXp: 3000,
        xpText: '${BanglaNameHelper.toBanglaNumeral(xp)} / ৩,০০০ XP',
        badgeColor: const Color(0xFF0284C7),
        badgeIcon: LucideIcons.zap,
        startColor: const Color(0xFF0C4A6E),
        endColor: const Color(0xFF0369A1),
      );
    } else if (xp < 7000) {
      final p = ((xp - 3000) / 4000.0).clamp(0.0, 1.0);
      return (
        currentRank: 'ওয়ারিয়র',
        nextRank: 'টাইটান',
        progress: p,
        percent: (p * 100).round(),
        currentXp: xp,
        nextTargetXp: 7000,
        xpText: '${BanglaNameHelper.toBanglaNumeral(xp)} / ৭,০০০ XP',
        badgeColor: const Color(0xFF8B5CF6),
        badgeIcon: LucideIcons.shield,
        startColor: const Color(0xFF4C1D95),
        endColor: const Color(0xFF6D28D9),
      );
    } else if (xp < 15000) {
      final p = ((xp - 7000) / 8000.0).clamp(0.0, 1.0);
      return (
        currentRank: 'টাইটান',
        nextRank: 'লিজেন্ড',
        progress: p,
        percent: (p * 100).round(),
        currentXp: xp,
        nextTargetXp: 15000,
        xpText: '${BanglaNameHelper.toBanglaNumeral(xp)} / ১৫,০০০ XP',
        badgeColor: const Color(0xFFF59E0B),
        badgeIcon: LucideIcons.graduationCap,
        startColor: const Color(0xFF78350F),
        endColor: const Color(0xFFB45309),
      );
    } else {
      return (
        currentRank: 'লিজেন্ড',
        nextRank: 'সর্বোচ্চ স্তর',
        progress: 1.0,
        percent: 100,
        currentXp: xp,
        nextTargetXp: 15000,
        xpText: '${BanglaNameHelper.toBanglaNumeral(xp)} XP (সর্বোচ্চ স্তর)',
        badgeColor: const Color(0xFFEF4444),
        badgeIcon: LucideIcons.crown,
        startColor: const Color(0xFF881337),
        endColor: const Color(0xFFBE123C),
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
          // Level Progress Bar (Premium Design with XP Guide Tap)
          InkWell(
            onTap: () => XpGuideBottomSheet.show(context),
            borderRadius: BorderRadius.circular(24),
            child: Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [levelInfo.startColor.withValues(alpha: 0.85), const Color(0xFF18181B)]
                      : [levelInfo.startColor, levelInfo.endColor],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(
                  color: isDark ? levelInfo.badgeColor.withValues(alpha: 0.3) : Colors.white24,
                ),
                boxShadow: [
                  BoxShadow(
                    color: isDark ? Colors.black45 : levelInfo.badgeColor.withValues(alpha: 0.25),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  Positioned(
                    top: -30,
                    right: -15,
                    child: Icon(
                      levelInfo.badgeIcon,
                      size: 110,
                      color: Colors.white.withValues(alpha: 0.07),
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
                                    horizontal: 12,
                                    vertical: 5,
                                  ),
                                  decoration: BoxDecoration(
                                    color: levelInfo.badgeColor.withValues(alpha: 0.22),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: levelInfo.badgeColor.withValues(alpha: 0.6),
                                      width: 1,
                                    ),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(
                                        levelInfo.badgeIcon,
                                        color: Colors.white,
                                        size: 14,
                                      ),
                                      const SizedBox(width: 6),
                                      Text(
                                        levelInfo.currentRank,
                                        style: const TextStyle(
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white,
                                          fontFamily: 'HindSiliguri',
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    const Text(
                                      'পরবর্তী লেভেল প্রগ্রেস',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.normal,
                                        color: Colors.white70,
                                        fontFamily: 'HindSiliguri',
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    Icon(
                                      LucideIcons.info,
                                      size: 13,
                                      color: Colors.white.withValues(alpha: 0.6),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${BanglaNameHelper.toBanglaNumeral(levelInfo.percent)}%',
                                style: const TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white,
                                  fontFamily: 'HindSiliguri',
                                  height: 1,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2.5,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.black26,
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                    color: Colors.white12,
                                    width: 0.8,
                                  ),
                                ),
                                child: Text(
                                  levelInfo.xpText,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: Color(0xFFFDE047),
                                    fontFamily: 'HindSiliguri',
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // The Bar
                      Container(
                        height: 9,
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
                                gradient: LinearGradient(
                                  colors: [
                                    const Color(0xFF60A5FA),
                                    levelInfo.badgeColor,
                                  ],
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: levelInfo.badgeColor.withValues(alpha: 0.4),
                                    blurRadius: 6,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            levelInfo.currentRank,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Colors.white70,
                              fontFamily: 'HindSiliguri',
                            ),
                          ),
                          Text(
                            levelInfo.nextRank,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: Colors.white70,
                              fontFamily: 'HindSiliguri',
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
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
                    border: user.isPro
                        ? null
                        : Border.all(
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
                      isPro: user.isPro,
                    ),
                  ),
                ),
                Positioned(
                  bottom: -2,
                  right: -2,
                  child: Container(
                    padding: const EdgeInsets.all(5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF12544F),
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
