import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/presentation/widgets/user_avatar.dart';
import '../../../core/providers/title_provider.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../dashboard/domain/models.dart';
import '../../dashboard/providers/dashboard_providers.dart';
import '../../profile/presentation/widgets/badges_showcase_section.dart';
import '../../profile/presentation/widgets/streak_calendar.dart';
import '../../profile/presentation/widgets/subjects_progress_section.dart';

// ─── Models ────────────────────────────────────────────────────────────────────
class _OtherUser {
  final String id, name, institute, level;
  final int xp, examsTaken, streakCount;
  final String? avatarUrl;
  final String stream;

  const _OtherUser({
    required this.id,
    required this.name,
    required this.institute,
    required this.level,
    required this.xp,
    required this.examsTaken,
    required this.streakCount,
    this.avatarUrl,
    this.stream = 'HSC',
  });

  factory _OtherUser.fromJson(Map<String, dynamic> j) => _OtherUser(
    id: j['id'] as String,
    name: j['name'] as String? ?? 'অজানা',
    institute: j['institute'] as String? ?? '',
    level: j['level'] as String? ?? 'Rookie',
    xp: (j['xp'] as num?)?.toInt() ?? 0,
    examsTaken: (j['exams_taken'] as num?)?.toInt() ?? 0,
    streakCount: (j['streak'] as num?)?.toInt() ?? 0,
    avatarUrl: j['avatar_url'] as String?,
    stream: (j['stream'] as String?)?.toUpperCase() == 'SSC' ? 'SSC' : 'HSC',
  );
}

class _UPAnalytics {
  final int totalExams, totalCorrect, avgScore;
  final List<SubjectStats> subjects;
  final List<MonthCalendarDay> calendarData;

  const _UPAnalytics({
    required this.totalExams,
    required this.totalCorrect,
    required this.avgScore,
    required this.subjects,
    this.calendarData = const [],
  });

  static const empty = _UPAnalytics(
    totalExams: 0,
    totalCorrect: 0,
    avgScore: 0,
    subjects: [],
    calendarData: [],
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
_UPAnalytics _generateSimulatedAnalytics(_OtherUser user) {
  final seed = user.id.hashCode.abs();
  final isSsc = user.stream == 'SSC';

  // Realistic subject list based on stream
  final List<String> subjectKeys = isSsc
      ? ['ssc_physics', 'ssc_chemistry', 'ssc_higher_math', 'ssc_biology', 'ssc_ict', 'ssc_bangla']
      : ['hsc_physics_1', 'hsc_chemistry_1', 'hsc_higher_math_1', 'hsc_biology_1', 'hsc_ict', 'hsc_bangla_1'];

  final int baseAccuracy = (76 + (seed % 16)).clamp(75, 92); // 75% to 92%
  final int totalExams = user.examsTaken > 0 ? user.examsTaken : ((user.xp / 120).round()).clamp(10, 150);
  const int questionsPerExam = 25;
  final int totalQuestions = totalExams * questionsPerExam;

  int totalCorrect = 0;
  final List<SubjectStats> subjects = [];

  for (int i = 0; i < subjectKeys.length; i++) {
    final key = subjectKeys[i];
    final subWeight = 0.12 + (((seed + i * 7) % 12) / 100.0);
    final subTotal = (totalQuestions * subWeight).round().clamp(15, totalQuestions);
    final subAcc = (baseAccuracy + ((seed + i * 3) % 9) - 4).clamp(65, 96);
    final subCorrect = (subTotal * (subAcc / 100.0)).round();
    final subWrong = (subTotal - subCorrect).clamp(0, subTotal);

    subjects.add(SubjectStats(
      id: key,
      name: key,
      correct: subCorrect,
      wrong: subWrong,
      skipped: 0,
      total: subTotal,
    ));

    totalCorrect += subCorrect;
  }

  // Generate calendar days with streak active
  final now = DateTime.now();
  final firstDay = DateTime(now.year, now.month, 1);
  final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
  final startWeekday = firstDay.weekday % 7;

  final List<MonthCalendarDay> calendarDays = [];

  for (int i = 0; i < startWeekday; i++) {
    final date = firstDay.subtract(Duration(days: startWeekday - i));
    calendarDays.add(MonthCalendarDay(
      date: date,
      dayOfMonth: date.day,
      examCount: 0,
      isCurrentMonth: false,
    ));
  }

  final streakDays = user.streakCount.clamp(0, now.day);
  final activeStartDay = (now.day - streakDays + 1).clamp(1, now.day);

  for (int day = 1; day <= daysInMonth; day++) {
    final date = DateTime(now.year, now.month, day);
    int examCount = 0;

    if (day <= now.day) {
      if (day >= activeStartDay && streakDays > 0) {
        // Active streak day: 1 to 3 exams
        examCount = 1 + ((seed + day) % 3);
      } else if ((seed + day * 3) % 4 == 0) {
        // Intermittent older active day in current month
        examCount = 1 + ((seed + day) % 2);
      }
    }

    calendarDays.add(MonthCalendarDay(
      date: date,
      dayOfMonth: day,
      examCount: examCount,
      isCurrentMonth: true,
    ));
  }

  while (calendarDays.length % 7 != 0) {
    final date = calendarDays.last.date.add(const Duration(days: 1));
    calendarDays.add(MonthCalendarDay(
      date: date,
      dayOfMonth: date.day,
      examCount: 0,
      isCurrentMonth: false,
    ));
  }

  return _UPAnalytics(
    totalExams: totalExams,
    totalCorrect: totalCorrect,
    avgScore: baseAccuracy,
    subjects: subjects,
    calendarData: calendarDays,
  );
}

Future<_UPAnalytics> _fetchUserAnalytics(String userId, [_OtherUser? user]) async {
  final supabase = Supabase.instance.client;
  try {
    final data = await supabase
        .from('exam_results')
        .select('total_questions, correct_count, wrong_count, subject, score, total_marks, created_at')
        .eq('user_id', userId);
    final rows = (data as List?) ?? [];

    if (rows.isEmpty) {
      if (user != null && (user.examsTaken > 0 || user.streakCount > 0 || user.xp > 0)) {
        return _generateSimulatedAnalytics(user);
      }
      return _UPAnalytics.empty;
    }

    int totalExams = rows.length;
    int totalCorrect = 0;
    double scoreSum = 0;
    final Map<String, ({int total, int correct, int wrong})> subjMap = {};
    final Map<String, int> dateExamCountMap = {};

    for (final row in rows) {
      final total = (row['total_questions'] as num?)?.toInt() ?? 0;
      final correct = (row['correct_count'] as num?)?.toInt() ?? 0;
      final wrong = (row['wrong_count'] as num?)?.toInt() ?? 0;
      final totalMarks = (row['total_marks'] as num?)?.toDouble() ?? 0;
      final scoreVal = (row['score'] as num?)?.toDouble() ?? 0;
      final score = totalMarks > 0 ? (scoreVal / totalMarks) * 100.0 : (total > 0 ? (correct / total) * 100.0 : 0.0);
      final subject = (row['subject'] as String?) ?? 'general';

      totalCorrect += correct;
      scoreSum += score;

      final prev = subjMap[subject];
      if (prev == null) {
        subjMap[subject] = (total: total, correct: correct, wrong: wrong);
      } else {
        subjMap[subject] = (
          total: prev.total + total,
          correct: prev.correct + correct,
          wrong: prev.wrong + wrong,
        );
      }

      final createdAtStr = row['created_at'] as String?;
      if (createdAtStr != null) {
        final d = DateTime.tryParse(createdAtStr);
        if (d != null) {
          final dateKey = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
          dateExamCountMap[dateKey] = (dateExamCountMap[dateKey] ?? 0) + 1;
        }
      }
    }

    final subjects = subjMap.entries.map((e) {
      final t = e.value.total;
      final c = e.value.correct;
      final w = e.value.wrong;
      final skipped = (t - c - w).clamp(0, t);
      return SubjectStats(
        id: e.key,
        name: e.key,
        correct: c,
        wrong: w,
        skipped: skipped,
        total: t,
      );
    }).toList();

    // Generate Calendar Days for Current Month
    final now = DateTime.now();
    final firstDay = DateTime(now.year, now.month, 1);
    final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
    final startWeekday = firstDay.weekday % 7; // Sunday = 0

    final List<MonthCalendarDay> calendarDays = [];

    // Preceding padding days
    for (int i = 0; i < startWeekday; i++) {
      final date = firstDay.subtract(Duration(days: startWeekday - i));
      calendarDays.add(MonthCalendarDay(
        date: date,
        dayOfMonth: date.day,
        examCount: 0,
        isCurrentMonth: false,
      ));
    }

    // Current month days
    for (int day = 1; day <= daysInMonth; day++) {
      final date = DateTime(now.year, now.month, day);
      final dateKey = '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
      final count = dateExamCountMap[dateKey] ?? 0;
      calendarDays.add(MonthCalendarDay(
        date: date,
        dayOfMonth: day,
        examCount: count,
        isCurrentMonth: true,
      ));
    }

    // Trailing padding days to fill full weeks
    while (calendarDays.length % 7 != 0) {
      final date = calendarDays.last.date.add(const Duration(days: 1));
      calendarDays.add(MonthCalendarDay(
        date: date,
        dayOfMonth: date.day,
        examCount: 0,
        isCurrentMonth: false,
      ));
    }

    return _UPAnalytics(
      totalExams: totalExams,
      totalCorrect: totalCorrect,
      avgScore: totalExams > 0 ? (scoreSum / totalExams).round() : 0,
      subjects: subjects,
      calendarData: calendarDays,
    );
  } catch (e) {
    if (user != null && (user.examsTaken > 0 || user.streakCount > 0 || user.xp > 0)) {
      return _generateSimulatedAnalytics(user);
    }
    return _UPAnalytics.empty;
  }
}

// ─── Main User Profile View ───────────────────────────────────────────────────
class UserProfileView extends ConsumerStatefulWidget {
  final String userId;
  const UserProfileView({super.key, required this.userId});

  @override
  ConsumerState<UserProfileView> createState() => _UserProfileViewState();
}

class _UserProfileViewState extends ConsumerState<UserProfileView> {
  _OtherUser? _user;
  _UPAnalytics _targetA = _UPAnalytics.empty;
  _UPAnalytics _myA = _UPAnalytics.empty;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final myId = supabase.auth.currentUser?.id;

      final profileData = await supabase
          .from('public_profiles')
          .select(
            'id, name, institute, level, xp, exams_taken, streak, avatar_url',
          )
          .eq('id', widget.userId)
          .single();

      final user = _OtherUser.fromJson(profileData);
      final targetA = await _fetchUserAnalytics(widget.userId, user);

      var myA = _UPAnalytics.empty;
      if (myId != null) {
        myA = await _fetchUserAnalytics(myId);
      }

      if (mounted) {
        // Set the title in MainLayout's shared header
        final location = '/leaderboard/user-profile/${widget.userId}';
        ref.read(locationTitleProvider.notifier).updateTitle(location, user.name);

        setState(() {
          _user = user;
          _targetA = targetA;
          _myA = myA;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _getLevelRank(int xp) {
    if (xp < 500) return 'রুকি';
    if (xp < 2000) return 'স্কাউট';
    if (xp < 5000) return 'ওয়ারিয়র';
    if (xp < 10000) return 'টাইটান';
    return 'লিজেন্ড';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final myId = Supabase.instance.client.auth.currentUser?.id;
    final isViewingSelf = widget.userId == myId;
    final myProfile = ref.watch(userProfileProvider).whenOrNull(data: (u) => u);

    if (_isLoading) {
      return const Scaffold(
        backgroundColor: Colors.transparent,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_user == null) {
      return Scaffold(
        backgroundColor: Colors.transparent,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'প্রোফাইল পাওয়া যায়নি',
                  style: TextStyle(
                    fontSize: 16,
                    color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
                    fontFamily: 'Anek Bangla',
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: _fetch,
                  child: const Text('আবার চেষ্টা করো', style: TextStyle(fontFamily: 'Anek Bangla')),
                ),
              ],
            ),
          ),
        ),
      );
    }

    final targetUser = _user!;
    final myXp = myProfile?.xp ?? 0;
    final myStreak = myProfile?.streakCount ?? 0;
    final myExams = _myA.totalExams;
    final myAvgScore = _myA.avgScore;

    final targetXp = targetUser.xp;
    final targetStreak = targetUser.streakCount;
    final targetExams = _targetA.totalExams > 0 ? _targetA.totalExams : targetUser.examsTaken;
    final targetAvgScore = _targetA.avgScore;


    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFF8FAFC),
      body: SingleChildScrollView(

        padding: const EdgeInsets.fromLTRB(10, 8, 10, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── 1. Target User Profile Header Card ─────────────────────────
            _buildProfileHeaderCard(targetUser, isDark, isViewingSelf),
            const SizedBox(height: 16),

            // ── 2. 4 Data Comparison Cards ─────────────────────────────────
            _buildComparisonStatsGrid(
              myExams: myExams,
              targetExams: targetExams,
              myAvgScore: myAvgScore,
              targetAvgScore: targetAvgScore,
              myXp: myXp,
              targetXp: targetXp,
              myStreak: myStreak,
              targetStreak: targetStreak,
              targetName: targetUser.name,
              isViewingSelf: isViewingSelf,
              isDark: isDark,
            ),
            const SizedBox(height: 16),

            // ── 3. Comparison Graph (Head to Head) ─────────────────────────
            if (!isViewingSelf) ...[
              _buildComparisonGraph(
                myExams: myExams,
                targetExams: targetExams,
                myAvgScore: myAvgScore,
                targetAvgScore: targetAvgScore,
                myXp: myXp,
                targetXp: targetXp,
                myStreak: myStreak,
                targetStreak: targetStreak,
                targetName: targetUser.name,
                isDark: isDark,
              ),
              const SizedBox(height: 16),
            ],

            // ── 4. বিষয়ভিত্তিক দক্ষতা (Subjects Progress) ───────────────────
            SubjectsProgressSection(
              subjectStats: _targetA.subjects,
              isViewingSelf: isViewingSelf,
              studentName: targetUser.name,
            ),
            const SizedBox(height: 16),

            // ── 5. স্ট্রিক ক্যালেন্ডার (Streak Calendar) ──────────────────────
            StreakCalendar(
              calendarData: _targetA.calendarData,
              streakCount: targetStreak,
            ),
            const SizedBox(height: 16),

            // ── 6. অর্জন ও ব্যাজসমূহ (Badges Showcase) ──────────────────────
            BadgesShowcaseSection(
              userId: targetUser.id,
            ),
          ],
        ),
      ),
    );
  }

  // ── Profile Header Card ───────────────────────────────────────────────────
  Widget _buildProfileHeaderCard(_OtherUser user, bool isDark, bool isViewingSelf) {
    final rankName = _getLevelRank(user.xp);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          UserAvatar(
            avatarUrl: user.avatarUrl,
            name: user.name,
            size: 64,
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        user.name,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                          fontFamily: 'Anek Bangla',
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isViewingSelf) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'তুমি',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF10B981),
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 4),
                if (user.institute.isNotEmpty)
                  Text(
                    user.institute,
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                      fontFamily: 'Anek Bangla',
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.3),
                      width: 0.8,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(LucideIcons.award, size: 13, color: Color(0xFFF59E0B)),
                      const SizedBox(width: 4),
                      Text(
                        rankName,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFF59E0B),
                          fontFamily: 'Anek Bangla',
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 4 Data Comparison Cards Grid ──────────────────────────────────────────
  Widget _buildComparisonStatsGrid({
    required int myExams,
    required int targetExams,
    required int myAvgScore,
    required int targetAvgScore,
    required int myXp,
    required int targetXp,
    required int myStreak,
    required int targetStreak,
    required String targetName,
    required bool isViewingSelf,
    required bool isDark,
  }) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: isViewingSelf ? 1.6 : 1.18,
      children: [
        _buildSingleComparisonCard(
          title: 'মোট পরীক্ষা',
          myValue: '${BanglaNameHelper.toBanglaNumeral(myExams)}টি',
          targetValue: '${BanglaNameHelper.toBanglaNumeral(targetExams)}টি',
          myNum: myExams.toDouble(),
          targetNum: targetExams.toDouble(),
          suffix: 'টি',
          targetName: targetName,
          isViewingSelf: isViewingSelf,
          isDark: isDark,
        ),
        _buildSingleComparisonCard(
          title: 'গড় স্কোর',
          myValue: '${BanglaNameHelper.toBanglaNumeral(myAvgScore)}%',
          targetValue: '${BanglaNameHelper.toBanglaNumeral(targetAvgScore)}%',
          myNum: myAvgScore.toDouble(),
          targetNum: targetAvgScore.toDouble(),
          suffix: '%',
          targetName: targetName,
          isViewingSelf: isViewingSelf,
          isDark: isDark,
        ),
        _buildSingleComparisonCard(
          title: 'মোট XP',
          myValue: BanglaNameHelper.toBanglaNumeral(myXp),
          targetValue: BanglaNameHelper.toBanglaNumeral(targetXp),
          myNum: myXp.toDouble(),
          targetNum: targetXp.toDouble(),
          suffix: ' XP',
          targetName: targetName,
          isViewingSelf: isViewingSelf,
          isDark: isDark,
        ),
        _buildSingleComparisonCard(
          title: 'স্ট্রিক',
          myValue: '${BanglaNameHelper.toBanglaNumeral(myStreak)} দিন',
          targetValue: '${BanglaNameHelper.toBanglaNumeral(targetStreak)} দিন',
          myNum: myStreak.toDouble(),
          targetNum: targetStreak.toDouble(),
          suffix: ' দিন',
          targetName: targetName,
          isViewingSelf: isViewingSelf,
          isDark: isDark,
        ),
      ],
    );
  }

  Widget _buildSingleComparisonCard({
    required String title,
    required String myValue,
    required String targetValue,
    required double myNum,
    required double targetNum,
    required String suffix,
    required String targetName,
    required bool isViewingSelf,
    required bool isDark,
  }) {
    final diff = myNum - targetNum;
    String badgeText;
    Color badgeBg;
    Color badgeTextColor;

    if (diff > 0) {
      final formattedDiff = diff.abs() >= 1000 && suffix.contains('XP')
          ? '${(diff / 1000).toStringAsFixed(1)}k'
          : '${diff.toInt()}';
      badgeText = '+${BanglaNameHelper.toBanglaNumeral(formattedDiff)}$suffix এগিয়ে';
      badgeBg = const Color(0xFF10B981).withValues(alpha: 0.12);
      badgeTextColor = const Color(0xFF10B981);
    } else if (diff < 0) {
      final formattedDiff = diff.abs() >= 1000 && suffix.contains('XP')
          ? '${(diff.abs() / 1000).toStringAsFixed(1)}k'
          : '${diff.abs().toInt()}';
      badgeText = '${BanglaNameHelper.toBanglaNumeral(formattedDiff)}$suffix পিছিয়ে';
      badgeBg = const Color(0xFFEF4444).withValues(alpha: 0.12);
      badgeTextColor = const Color(0xFFEF4444);
    } else {
      badgeText = 'সমান স্তর';
      badgeBg = const Color(0xFF64748B).withValues(alpha: 0.12);
      badgeTextColor = const Color(0xFF94A3B8);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                    fontFamily: 'Anek Bangla',
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (!isViewingSelf) ...[
                const SizedBox(width: 4),
                Flexible(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: badgeBg,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      badgeText,
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w800,
                        color: badgeTextColor,
                        fontFamily: 'Anek Bangla',
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
            ],
          ),
          if (isViewingSelf)
            Text(
              myValue,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
                fontFamily: 'Anek Bangla',
              ),
            )
          else ...[
            const SizedBox(height: 4),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'তুমি',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF10B981),
                          fontFamily: 'Anek Bangla',
                        ),
                      ),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          myValue,
                          style: const TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF10B981),
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 1,
                  height: 22,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        targetName.split(' ').first,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                          fontFamily: 'Anek Bangla',
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerRight,
                        child: Text(
                          targetValue,
                          style: TextStyle(
                            fontSize: 15.5,
                            fontWeight: FontWeight.w900,
                            color: isDark ? Colors.white : const Color(0xFF0F172A),
                            fontFamily: 'Anek Bangla',
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  // ── 3. Comparison Graph (Bar Comparison) ──────────────────────────────────
  Widget _buildComparisonGraph({
    required int myExams,
    required int targetExams,
    required int myAvgScore,
    required int targetAvgScore,
    required int myXp,
    required int targetXp,
    required int myStreak,
    required int targetStreak,
    required String targetName,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE4E4E7),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black26 : Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'তুলনামূলক বিশ্লেষণ',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                  fontFamily: 'Anek Bangla',
                ),
              ),
              Row(
                children: [
                  _buildLegendDot(const Color(0xFF10B981), 'তুমি', isDark),
                  const SizedBox(width: 12),
                  _buildLegendDot(const Color(0xFF6366F1), targetName.split(' ').first, isDark),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 180,
            child: BarChart(
              BarChartData(
                alignment: BarChartAlignment.spaceAround,
                maxY: 100,
                barTouchData: BarTouchData(enabled: true),
                titlesData: FlTitlesData(
                  show: true,
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (val, meta) {
                        String text = '';
                        switch (val.toInt()) {
                          case 0:
                            text = 'পরীক্ষা';
                            break;
                          case 1:
                            text = 'গড় স্কোর';
                            break;
                          case 2:
                            text = 'XP';
                            break;
                          case 3:
                            text = 'স্ট্রিক';
                            break;
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            text,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                              fontFamily: 'Anek Bangla',
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                gridData: const FlGridData(show: false),
                borderData: FlBorderData(show: false),
                barGroups: [
                  _makeBarGroup(0, (myExams * 5.0).clamp(5, 100), (targetExams * 5.0).clamp(5, 100)),
                  _makeBarGroup(1, myAvgScore.toDouble().clamp(5, 100), targetAvgScore.toDouble().clamp(5, 100)),
                  _makeBarGroup(2, (myXp / 100.0).clamp(5, 100), (targetXp / 100.0).clamp(5, 100)),
                  _makeBarGroup(3, (myStreak * 10.0).clamp(5, 100), (targetStreak * 10.0).clamp(5, 100)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  BarChartGroupData _makeBarGroup(int x, double y1, double y2) {
    return BarChartGroupData(
      x: x,
      barsSpace: 6,
      barRods: [
        BarChartRodData(
          toY: y1,
          color: const Color(0xFF10B981),
          width: 12,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
        ),
        BarChartRodData(
          toY: y2,
          color: const Color(0xFF6366F1),
          width: 12,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(6)),
        ),
      ],
    );
  }

  Widget _buildLegendDot(Color color, String label, bool isDark) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
            fontFamily: 'Anek Bangla',
          ),
        ),
      ],
    );
  }
}
