import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../../dashboard/providers/dashboard_providers.dart';

// ─── Models ────────────────────────────────────────────────────────────────────
class _OtherUser {
  final String id, name, institute, level;
  final int xp, examsTaken, streakCount;
  final String? avatarUrl;

  const _OtherUser({
    required this.id,
    required this.name,
    required this.institute,
    required this.level,
    required this.xp,
    required this.examsTaken,
    required this.streakCount,
    this.avatarUrl,
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
  );
}

class _UPSubject {
  final String key;
  final int total, correct, wrong, skipped;
  final double accuracy;

  const _UPSubject({
    required this.key,
    required this.total,
    required this.correct,
    required this.wrong,
    required this.skipped,
    required this.accuracy,
  });
}

class _UPAnalytics {
  final int totalExams, totalCorrect, avgScore;
  final List<_UPSubject> subjects;
  final List<int> last30DaysActivity;

  const _UPAnalytics({
    required this.totalExams,
    required this.totalCorrect,
    required this.avgScore,
    required this.subjects,
    this.last30DaysActivity = const [],
  });

  static const empty = _UPAnalytics(
    totalExams: 0,
    totalCorrect: 0,
    avgScore: 0,
    subjects: [],
    last30DaysActivity: [],
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
final _upFmt = NumberFormat('#,##0');

String _upSubjName(String key) {
  const m = {
    'physics': 'পদার্থবিজ্ঞান',
    'chemistry': 'রসায়ন',
    'biology': 'জীববিজ্ঞান',
    'math': 'গণিত',
    'bangla': 'বাংলা',
    'english': 'ইংরেজি',
    'ict': 'আইসিটি',
    'general_knowledge': 'সাধারণ জ্ঞান',
    'gk': 'সাধারণ জ্ঞান',
    'general': 'সাধারণ',
  };
  return m[key.toLowerCase()] ?? key;
}

Color _upLevelColor(String id) {
  const colors = {
    'Legend': Color(0xFFB91C1C),
    'Titan': Color(0xFF1E3A8A),
    'Warrior': Color(0xFFB91C1C),
    'Scout': Color(0xFF047857),
    'Rookie': Color(0xFF94A3B8),
  };
  return colors[id] ?? const Color(0xFF94A3B8);
}

String _upLevelBn(String id) {
  const labels = {
    'Legend': 'লিজেন্ড',
    'Titan': 'টাইটান',
    'Warrior': 'ওয়ারিয়র',
    'Scout': 'স্কাউট',
    'Rookie': 'রুকি',
  };
  return labels[id] ?? id;
}

Future<_UPAnalytics> _fetchUPAnalytics(String userId) async {
  final supabase = Supabase.instance.client;
  final data = await supabase
      .from('exam_results')
      .select('total_questions, correct_count, wrong_count, subject, score')
      .eq('user_id', userId);
  final rows = data as List;
  if (rows.isEmpty) return _UPAnalytics.empty;

  int totalExams = rows.length;
  int totalCorrect = 0;
  double scoreSum = 0;
  final Map<String, ({int total, int correct, int wrong})> subjMap = {};

  for (final row in rows) {
    final total = (row['total_questions'] as num?)?.toInt() ?? 0;
    final correct = (row['correct_count'] as num?)?.toInt() ?? 0;
    final wrong = (row['wrong_count'] as num?)?.toInt() ?? 0;
    final score = total > 0 ? correct / total * 100.0 : 0.0;
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
  }

  final subjects = subjMap.entries.map((e) {
    final t = e.value.total;
    final c = e.value.correct;
    final w = e.value.wrong;
    final skipped = (t - c - w).clamp(0, t);
    final acc = t > 0 ? c / t * 100.0 : 0.0;
    return _UPSubject(
      key: e.key,
      total: t,
      correct: c,
      wrong: w,
      skipped: skipped,
      accuracy: acc,
    );
  }).toList()..sort((a, b) => b.accuracy.compareTo(a.accuracy));

  return _UPAnalytics(
    totalExams: totalExams,
    totalCorrect: totalCorrect,
    avgScore: (scoreSum / totalExams).round(),
    subjects: subjects,
  );
}

// ─── View ──────────────────────────────────────────────────────────────────────
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
  int _rank = 0;
  bool _isLoading = true;
  String? _expanded;
  String? _error;

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

      final rankData = await supabase
          .from('public_profiles')
          .select('id')
          .eq('level', user.level)
          .gt('xp', user.xp);
      final rank = (rankData as List).length + 1;

      final targetA = await _fetchUPAnalytics(widget.userId);
      var myA = _UPAnalytics.empty;
      if (myId != null && myId != widget.userId) {
        myA = await _fetchUPAnalytics(myId);
      }

      if (mounted) {
        setState(() {
          _user = user;
          _rank = rank;
          _targetA = targetA;
          _myA = myA;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = e.toString();
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    // Retry fetch when auth becomes available after cold-start session restore
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetch();
    });
    final myId = Supabase.instance.client.auth.currentUser?.id;
    final isViewingSelf = widget.userId == myId;
    final myProfile = ref.watch(userProfileProvider).whenOrNull(data: (u) => u);

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_user == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'প্রোফাইল পাওয়া যায়নি',
                style: TextStyle(
                  fontSize: 16,
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF737373),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: _fetch,
                  child: Text(
                    'আবার চেষ্টা করো',
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark
                          ? const Color(0xFF334155)
                          : const Color(0xFF0F172A),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      );
    }

    final user = _user!;
    final analytics = _targetA;
    final lvlColor = _upLevelColor(user.level);

    return Column(
      children: [
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── Profile Header Card ────────────────────────────────────
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF1C1C1E)
                          : const Color(0xFFE5E5E5),
                    ),
                    boxShadow: isDark
                        ? []
                        : [
                            const BoxShadow(
                              color: Color(0x08000000),
                              blurRadius: 8,
                              offset: Offset(0, 2),
                            ),
                          ],
                  ),
                  child: Column(
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _UPAvatar(
                            avatarUrl: user.avatarUrl,
                            name: user.name,
                            size: 70,
                          ),
                          const SizedBox(width: 16),
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
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: isDark
                                              ? Colors.white
                                              : const Color(0xFF0F172A),
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    if (isViewingSelf) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 2,
                                        ),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFEF2F2),
                                          borderRadius: BorderRadius.circular(
                                            100,
                                          ),
                                        ),
                                        child: const Text(
                                          'তুমি',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFFB91C1C),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: lvlColor.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(100),
                                    border: Border.all(
                                      color: lvlColor.withValues(alpha: 0.3),
                                    ),
                                  ),
                                  child: Text(
                                    _upLevelBn(user.level),
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: lvlColor,
                                    ),
                                  ),
                                ),
                                if (user.institute.isNotEmpty) ...[
                                  const SizedBox(height: 4),
                                  Text(
                                    user.institute,
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Color(0xFFA3A3A3),
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          _UPStatBox(
                            label: 'পয়েন্ট',
                            value: _upFmt.format(user.xp),
                            icon: LucideIcons.star,
                            color: const Color(0xFF1E3A8A),
                            isDark: isDark,
                          ),
                          _UPStatBox(
                            label: 'র‍্যাংক',
                            value: '#$_rank',
                            icon: LucideIcons.mapPin,
                            color: const Color(0xFF047857),
                            isDark: isDark,
                          ),
                          _UPStatBox(
                            label: 'পরীক্ষা',
                            value: user.examsTaken.toString(),
                            icon: LucideIcons.fileText,
                            color: const Color(0xFFB91C1C),
                            isDark: isDark,
                          ),
                          _UPStatBox(
                            label: 'স্ট্রিক',
                            value: user.streakCount.toString(),
                            icon: LucideIcons.flame,
                            color: const Color(0xFF1E3A8A),
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // ── Premium Performance Gauge & Heatmap ─────────────────────
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF0F172A) : Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'পারফরম্যান্স',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          // Circular Gauge
                          SizedBox(
                            width: 80,
                            height: 80,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                CircularProgressIndicator(
                                  value: 1.0,
                                  strokeWidth: 8,
                                  color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                                ),
                                CircularProgressIndicator(
                                  value: analytics.totalExams > 0 ? (analytics.avgScore / 100.0) : 0,
                                  strokeWidth: 8,
                                  color: const Color(0xFF047857),
                                  strokeCap: StrokeCap.round,
                                ),
                                Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      '${analytics.avgScore}%',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 24),
                          // Stats
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'মোট সঠিক উত্তর',
                                  style: TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF737373),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _upFmt.format(analytics.totalCorrect),
                                  style: TextStyle(
                                    fontSize: 24,
                                    fontWeight: FontWeight.w900,
                                    color: isDark ? const Color(0xFF047857) : const Color(0xFF047857),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'গত ৩০ দিনের অ্যাক্টিভিটি',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF737373),
                        ),
                      ),
                      const SizedBox(height: 12),
                      // Heatmap
                      SizedBox(
                        width: double.infinity,
                        child: Wrap(
                          spacing: 4,
                          runSpacing: 4,
                          children: List.generate(30, (index) {
                            final count = analytics.last30DaysActivity.isNotEmpty ? analytics.last30DaysActivity[index] : 0;
                            Color boxColor = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9);
                            if (count > 0) {
                              double opacity = 0.3;
                              if (count > 1) opacity = 0.6;
                              if (count > 3) opacity = 0.8;
                              if (count > 5) opacity = 1.0;
                              boxColor = const Color(0xFF047857).withOpacity(opacity);
                            }
                            return Container(
                              width: 12,
                              height: 12,
                              decoration: BoxDecoration(
                                color: boxColor,
                                borderRadius: BorderRadius.circular(2),
                              ),
                            );
                          }),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                // ── XP Comparison ──────────────────────────────────────────
                if (!isViewingSelf && myProfile != null) ...[
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF1C1C1E)
                            : const Color(0xFFE5E5E5),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'তুলনা: তুমি vs ${user.name.split(' ').first}',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 16),
                        _UPXPBar(
                          label: 'তুমি',
                          xp: myProfile.xp,
                          maxXp: [
                            myProfile.xp,
                            user.xp,
                            1,
                          ].reduce((a, b) => a > b ? a : b),
                          color: const Color(0xFF737373),
                          isDark: isDark,
                        ),
                        const SizedBox(height: 10),
                        _UPXPBar(
                          label: user.name.split(' ').first,
                          xp: user.xp,
                          maxXp: [
                            myProfile.xp,
                            user.xp,
                            1,
                          ].reduce((a, b) => a > b ? a : b),
                          color: const Color(0xFF047857),
                          isDark: isDark,
                        ),
                        const SizedBox(height: 16),
                        _UPActivityComparisonChart(
                          myActivity: _myA.last30DaysActivity,
                          opActivity: analytics.last30DaysActivity,
                          opName: user.name ?? 'Opponent',
                          isDark: isDark,
                        ),
                        const SizedBox(height: 16),
                        Column(
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: _UPCompareCell(
                                    label: 'মোট পরীক্ষা',
                                    myValStr: _upFmt.format(_myA.totalExams),
                                    opponentValStr: _upFmt.format(analytics.totalExams),
                                    myVal: _myA.totalExams.toDouble(),
                                    opponentVal: analytics.totalExams.toDouble(),
                                    opponentName: user.name ?? 'Opponent',
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _UPCompareCell(
                                    label: 'গড় স্কোর',
                                    myValStr: '${_myA.avgScore}%',
                                    opponentValStr: '${analytics.avgScore}%',
                                    myVal: _myA.avgScore.toDouble(),
                                    opponentVal: analytics.avgScore.toDouble(),
                                    opponentName: user.name ?? 'Opponent',
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Expanded(
                                  child: _UPCompareCell(
                                    label: 'সঠিক উত্তর',
                                    myValStr: _upFmt.format(_myA.totalCorrect),
                                    opponentValStr: _upFmt.format(analytics.totalCorrect),
                                    myVal: _myA.totalCorrect.toDouble(),
                                    opponentVal: analytics.totalCorrect.toDouble(),
                                    opponentName: user.name ?? 'Opponent',
                                    isDark: isDark,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: _UPCompareCell(
                                    label: 'মোট XP',
                                    myValStr: _upFmt.format(myProfile.xp),
                                    opponentValStr: _upFmt.format(user.xp),
                                    myVal: myProfile.xp.toDouble(),
                                    opponentVal: user.xp.toDouble(),
                                    opponentName: user.name ?? 'Opponent',
                                    isDark: isDark,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // ── Subject Stats ──────────────────────────────────────────
                if (analytics.subjects.isNotEmpty)
                  Container(
                    decoration: BoxDecoration(
                      color: isDark ? const Color(0xFF0F172A) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF1C1C1E)
                            : const Color(0xFFE5E5E5),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                          child: Row(
                            children: [
                              const Icon(
                                LucideIcons.barChart2,
                                size: 16,
                                color: Color(0xFF047857),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'বিষয়ভিত্তিক পারফরম্যান্স',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF0F172A),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Divider(
                          height: 1,
                          color: isDark
                              ? const Color(0xFF1C1C1E)
                              : const Color(0xFFF0F0F0),
                        ),
                        ...analytics.subjects.asMap().entries.map((e) {
                          final s = e.value;
                          final isLast = e.key == analytics.subjects.length - 1;
                          final isOpen = _expanded == s.key;
                          return _UPSubjectRow(
                            subject: s,
                            isOpen: isOpen,
                            isLast: isLast,
                            isDark: isDark,
                            onTap: () => setState(
                              () => _expanded = isOpen ? null : s.key,
                            ),
                          );
                        }),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Avatar ─────────────────────────────────────────────────────────────────────
class _UPAvatar extends StatelessWidget {
  final String? avatarUrl;
  final String name;
  final double size;

  const _UPAvatar({
    required this.avatarUrl,
    required this.name,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'U';
    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(size / 2),
        child: CachedNetworkImage(
          imageUrl: avatarUrl!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          placeholder: (_, _) => _circle(initial, size),
          errorWidget: (_, _, _) => _circle(initial, size),
        ),
      );
    }
    return _circle(initial, size);
  }

  static Widget _circle(String letter, double size) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      color: const Color(0xFFB91C1C),
      shape: BoxShape.circle,
      border: Border.all(color: const Color(0xFFFEF2F2), width: 3),
    ),
    child: Center(
      child: Text(
        letter,
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.38,
          fontWeight: FontWeight.bold,
        ),
      ),
    ),
  );
}

// ─── Stat Box ────────────────────────────────────────────────────────────────────
class _UPStatBox extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _UPStatBox({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w900,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 10, color: Color(0xFFA3A3A3)),
        ),
      ],
    ),
  );
}

// ─── XP Bar ─────────────────────────────────────────────────────────────────────
class _UPXPBar extends StatelessWidget {
  final String label;
  final int xp, maxXp;
  final Color color;
  final bool isDark;

  const _UPXPBar({
    required this.label,
    required this.xp,
    required this.maxXp,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final pct = maxXp > 0 ? (xp / maxXp).clamp(0.0, 1.0) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF737373),
              ),
            ),
            Text(
              _upFmt.format(xp),
              style: const TextStyle(
                fontSize: 12,
                fontFamily: 'monospace',
                fontWeight: FontWeight.bold,
                color: Color(0xFFA3A3A3),
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 10,
            backgroundColor: isDark
                ? const Color(0xFF1C1C1E)
                : const Color(0xFFF5F5F5),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}

// ─── Compare Cell ────────────────────────────────────────────────────────────────
// ─── Subject Row (collapsible) ──────────────────────────────────────────────────
class _UPSubjectRow extends StatelessWidget {
  final _UPSubject subject;
  final bool isOpen, isLast, isDark;
  final VoidCallback onTap;

  const _UPSubjectRow({
    required this.subject,
    required this.isOpen,
    required this.isLast,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final s = subject;
    final accuracy = s.accuracy.round();
    final Color accColor = accuracy >= 80
        ? const Color(0xFF047857)
        : accuracy >= 50
        ? const Color(0xFFB91C1C)
        : const Color(0xFF737373);

    return Column(
      children: [
        InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  width: 4,
                  height: 28,
                  decoration: BoxDecoration(
                    color: isOpen
                        ? const Color(0xFFB91C1C)
                        : (isDark
                              ? const Color(0xFF27272A)
                              : const Color(0xFFE5E5E5)),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _upSubjName(s.key),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: isOpen
                          ? (isDark
                                ? const Color(0xFFB91C1C)
                                : const Color(0xFFB91C1C))
                          : (isDark ? Colors.white : const Color(0xFF1C1C1E)),
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: accColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: accColor.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    '$accuracy%',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: accColor,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                AnimatedRotation(
                  turns: isOpen ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(
                    LucideIcons.chevronDown,
                    size: 16,
                    color: isDark
                        ? const Color(0xFF737373)
                        : const Color(0xFF737373),
                  ),
                ),
              ],
            ),
          ),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeInOut,
          child: isOpen
              ? Container(
                  color: isDark
                      ? const Color(0xFF1A1A1A)
                      : const Color(0xFFFAFAFA),
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          _UPMini(
                            'সঠিক',
                            s.correct,
                            const Color(0xFF047857),
                            isDark,
                          ),
                          _UPMini(
                            'ভুল',
                            s.wrong,
                            const Color(0xFFB91C1C),
                            isDark,
                          ),
                          _UPMini(
                            'স্কিপ',
                            s.skipped,
                            const Color(0xFFA3A3A3),
                            isDark,
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: SizedBox(
                          height: 6,
                          child: Row(
                            children: [
                              if (s.total > 0) ...[
                                Flexible(
                                  flex: s.correct.clamp(1, 9999),
                                  child: Container(
                                    color: const Color(0xFF047857),
                                  ),
                                ),
                                if (s.wrong > 0)
                                  Flexible(
                                    flex: s.wrong,
                                    child: Container(
                                      color: const Color(0xFFB91C1C),
                                    ),
                                  ),
                                if (s.skipped > 0)
                                  Flexible(
                                    flex: s.skipped,
                                    child: Container(
                                      color: const Color(0xFFA3A3A3),
                                    ),
                                  ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                )
              : const SizedBox.shrink(),
        ),
        if (!isLast)
          Divider(
            height: 1,
            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF0F0F0),
          ),
      ],
    );
  }
}

class _UPMini extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final bool isDark;

  const _UPMini(this.label, this.value, this.color, this.isDark);

  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(
      children: [
        Text(
          value.toString(),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w900,
            color: color,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            color: isDark ? const Color(0xFF737373) : const Color(0xFFA3A3A3),
          ),
        ),
      ],
    ),
  );
}


// ─── Activity Comparison Chart ─────────────────────────────────────────────────
class _UPActivityComparisonChart extends StatelessWidget {
  final List<int> myActivity;
  final List<int> opActivity;
  final String opName;
  final bool isDark;

  const _UPActivityComparisonChart({
    required this.myActivity,
    required this.opActivity,
    required this.opName,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    // We only want the last 7 days
    final my7 = myActivity.length >= 7 ? myActivity.sublist(myActivity.length - 7) : List.filled(7, 0);
    final op7 = opActivity.length >= 7 ? opActivity.sublist(opActivity.length - 7) : List.filled(7, 0);

    final maxVal = [...my7, ...op7].fold<int>(1, (a, b) => a > b ? a : b).toDouble();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'অ্যাক্টিভিটি গ্রাফ (গত ৭ দিন)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            height: 180,
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true, 
                  drawVerticalLine: false, 
                  getDrawingHorizontalLine: (val) => FlLine(color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5), strokeWidth: 1),
                ),
                titlesData: FlTitlesData(
                  show: true,
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 22,
                      getTitlesWidget: (value, meta) {
                        const days = ['-6', '-5', '-4', '-3', '-2', '-1', 'আজ'];
                        final int idx = value.toInt();
                        if (idx < 0 || idx > 6) return const SizedBox();
                        return Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(days[idx], style: const TextStyle(fontSize: 10, color: Color(0xFF737373))),
                        );
                      },
                    ),
                  ),
                ),
                borderData: FlBorderData(show: false),
                minX: 0,
                maxX: 6,
                minY: 0,
                maxY: maxVal == 0 ? 5 : maxVal + (maxVal * 0.2), // Avoid zero max
                lineBarsData: [
                  // Opponent line
                  LineChartBarData(
                    spots: List.generate(7, (i) => FlSpot(i.toDouble(), op7[i].toDouble())),
                    isCurved: true,
                    color: const Color(0xFF1E3A8A),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: const FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFF1E3A8A).withValues(alpha: 0.1),
                    ),
                  ),
                  // My line
                  LineChartBarData(
                    spots: List.generate(7, (i) => FlSpot(i.toDouble(), my7[i].toDouble())),
                    isCurved: true,
                    color: const Color(0xFF047857),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 4,
                          color: Colors.white,
                          strokeWidth: 2,
                          strokeColor: const Color(0xFF047857),
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: const Color(0xFF047857).withValues(alpha: 0.1),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Legend
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(width: 12, height: 12, decoration: const BoxDecoration(color: Color(0xFF047857), shape: BoxShape.circle)),
              const SizedBox(width: 8),
              const Text('তুমি', style: TextStyle(fontSize: 12, color: Color(0xFF737373))),
              const SizedBox(width: 24),
              Container(width: 12, height: 12, decoration: const BoxDecoration(color: Color(0xFF1E3A8A), shape: BoxShape.circle)),
              const SizedBox(width: 8),
              Text(opName.split(' ')[0], style: const TextStyle(fontSize: 12, color: Color(0xFF737373))),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Premium Compare Cell ──────────────────────────────────────────────────────────
class _UPCompareCell extends StatelessWidget {
  final String label, myValStr, opponentValStr, opponentName;
  final double myVal, opponentVal;
  final bool isDark;

  const _UPCompareCell({
    required this.label,
    required this.myValStr,
    required this.opponentValStr,
    required this.myVal,
    required this.opponentVal,
    required this.opponentName,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final double maxVal = myVal > opponentVal ? myVal : opponentVal;
    final double myPct = maxVal > 0 ? (myVal / maxVal) : 0.0;
    final double opPct = maxVal > 0 ? (opponentVal / maxVal) : 0.0;
    
    final bool iWon = myVal >= opponentVal;
    
    final Color myColor = iWon ? const Color(0xFF047857) : const Color(0xFFB91C1C);
    final Color opColor = !iWon ? const Color(0xFF047857) : const Color(0xFFB91C1C);
    
    final Color trackColor = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5);
    final Color textColor = isDark ? Colors.white : const Color(0xFF000000);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: Color(0xFFA3A3A3),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('তুমি', style: TextStyle(fontSize: 12, color: Color(0xFF737373))),
              Text(myValStr, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor)),
            ],
          ),
          const SizedBox(height: 6),
          Stack(
            children: [
              Container(height: 6, decoration: BoxDecoration(color: trackColor, borderRadius: BorderRadius.circular(3))),
              FractionallySizedBox(
                widthFactor: myPct,
                child: Container(height: 6, decoration: BoxDecoration(color: myColor, borderRadius: BorderRadius.circular(3))),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  opponentName.split(' ')[0],
                  style: const TextStyle(fontSize: 12, color: Color(0xFF737373)),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(opponentValStr, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: textColor)),
            ],
          ),
          const SizedBox(height: 6),
          Stack(
            children: [
              Container(height: 6, decoration: BoxDecoration(color: trackColor, borderRadius: BorderRadius.circular(3))),
              FractionallySizedBox(
                widthFactor: opPct,
                child: Container(height: 6, decoration: BoxDecoration(color: opColor, borderRadius: BorderRadius.circular(3))),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
