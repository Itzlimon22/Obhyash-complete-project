import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../dashboard/domain/models.dart';
import 'widgets/stats_grid.dart';
import 'widgets/subjects_progress_section.dart';
import 'widgets/recent_activity_section.dart';
import 'widgets/streak_calendar.dart';
import '../../dashboard/presentation/widgets/exam_target_modal.dart';

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
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    'প্রোফাইল',
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      color: isDark ? Colors.white : const Color(0xFF171717),
                      fontFamily: 'HindSiliguri',
                      letterSpacing: -0.5,
                    ),
                  ),
                  ElevatedButton.icon(
                    onPressed: onEditProfile,
                    icon: Icon(LucideIcons.pencil, size: 16),
                    label: const Text(
                      'এডিট করুন',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 10,
                      ),
                      backgroundColor: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                      foregroundColor: isDark
                          ? Colors.white
                          : const Color(0xFF171717),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  if (onViewNotifications != null) ...[
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onViewNotifications,
                        icon: Icon(LucideIcons.bell, size: 16),
                        label: const Text(
                          'নোটিফিকেশন',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
                          ),
                        ),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 10,
                          ),
                          side: BorderSide(
                            color: isDark
                                ? const Color(0xFF262626)
                                : const Color(0xFFE5E5E5),
                          ),
                          backgroundColor: isDark
                              ? const Color(0xFF171717)
                              : Colors.white,
                          foregroundColor: isDark
                              ? const Color(0xFFD4D4D4)
                              : const Color(0xFF404040),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                  ],
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {},
                      icon: Icon(LucideIcons.gift, size: 16),
                      label: const Text(
                        'রেফার করুন',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          fontFamily: 'HindSiliguri',
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        side: BorderSide(
                          color: isDark
                              ? const Color(0x887f1d1d)
                              : const Color(0xFFfecdd3),
                        ),
                        backgroundColor: isDark
                            ? const Color(0x33881337)
                            : const Color(0xFFFFF1F2),
                        foregroundColor: isDark
                            ? const Color(0xFFFB7185)
                            : const Color(0xFFE11D48),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),

          // User Profile Card
          _UserProfileCard(user: user, isDark: isDark),
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
                  _ExamTargetCard(
                    initialTarget: user.examTarget,
                    isDark: isDark,
                  ),
                  const SizedBox(height: 24),
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

// ── Exam Target Card ──────────────────────────────────────────────────────────

class _ExamTargetCard extends StatefulWidget {
  final String? initialTarget;
  final bool isDark;

  const _ExamTargetCard({this.initialTarget, required this.isDark});

  @override
  State<_ExamTargetCard> createState() => _ExamTargetCardState();
}

class _ExamTargetCardState extends State<_ExamTargetCard> {
  String? _localTarget;

  @override
  void initState() {
    super.initState();
    _localTarget = widget.initialTarget;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = widget.isDark;
    final Map<String, String>? targetData = _localTarget != null
        ? kExamTargets.cast<Map<String, String>>().firstWhere(
            (t) => t['value'] == _localTarget,
            orElse: () => {},
          )
        : null;
    final hasTarget = targetData != null && targetData.isNotEmpty;

    Future<void> openModal() async {
      final result = await showExamTargetModal(
        context,
        initialTarget: _localTarget,
      );
      if (result != null && mounted) setState(() => _localTarget = result);
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000),
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('🎯', style: TextStyle(fontSize: 18)),
                  const SizedBox(width: 8),
                  Text(
                    'তোমার লক্ষ্য কী?',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF171717),
                    ),
                  ),
                ],
              ),
              TextButton(
                onPressed: openModal,
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF059669),
                  backgroundColor: isDark
                      ? const Color(0x1A059669)
                      : const Color(0xFFECFDF5),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'পরিবর্তন করো',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'HindSiliguri',
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (hasTarget)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF0A1F17)
                    : const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFF059669), width: 2),
              ),
              child: Row(
                children: [
                  Text(
                    targetData['icon']!,
                    style: const TextStyle(fontSize: 22),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    targetData['label']!,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      fontFamily: 'HindSiliguri',
                      color: isDark
                          ? const Color(0xFF34D399)
                          : const Color(0xFF047857),
                    ),
                  ),
                ],
              ),
            )
          else
            GestureDetector(
              onTap: openModal,
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark
                        ? const Color(0xFF404040)
                        : const Color(0xFFD4D4D4),
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  '+ লক্ষ্য নির্ধারণ করো',
                  style: TextStyle(
                    fontSize: 14,
                    fontFamily: 'HindSiliguri',
                    fontWeight: FontWeight.w600,
                    color: isDark
                        ? const Color(0xFF737373)
                        : const Color(0xFF525252),
                  ),
                ),
              ),
            ),
          const SizedBox(height: 8),
          Text(
            'তোমার পরীক্ষার লক্ষ্য নির্বাচন করো — আমরা সেই অনুযায়ী তোমাকে সাহায্য করব',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFF525252) : const Color(0xFFA3A3A3),
            ),
          ),
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
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
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
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFE11D48),
              image: user.avatarUrl != null
                  ? DecorationImage(
                      image: NetworkImage(user.avatarUrl!),
                      fit: BoxFit.cover,
                    )
                  : null,
            ),
            child: user.avatarUrl == null
                ? Center(
                    child: Text(
                      _initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  )
                : null,
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
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : const Color(0xFF171717),
                    fontFamily: 'HindSiliguri',
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                if (user.email != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    user.email!,
                    style: TextStyle(
                      fontSize: 13,
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
        color: isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
          fontFamily: 'HindSiliguri',
        ),
      ),
    );
  }
}
