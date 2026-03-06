import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  const _UPAnalytics({
    required this.totalExams,
    required this.totalCorrect,
    required this.avgScore,
    required this.subjects,
  });

  static const empty = _UPAnalytics(
    totalExams: 0,
    totalCorrect: 0,
    avgScore: 0,
    subjects: [],
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
    'Legend': Color(0xFFE11D48),
    'Titan': Color(0xFFF59E0B),
    'Warrior': Color(0xFFF43F5E),
    'Scout': Color(0xFF10B981),
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
                    'আবার চেষ্টা করুন',
                    style: TextStyle(
                      fontSize: 14,
                      color: isDark
                          ? const Color(0xFF60A5FA)
                          : const Color(0xFF2563EB),
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
                    color: isDark ? const Color(0xFF171717) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF262626)
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
                                              : const Color(0xFF171717),
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
                                          color: const Color(0xFFFFE4E6),
                                          borderRadius: BorderRadius.circular(
                                            100,
                                          ),
                                        ),
                                        child: const Text(
                                          'তুমি',
                                          style: TextStyle(
                                            fontSize: 10,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFFE11D48),
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
                            color: const Color(0xFFF59E0B),
                            isDark: isDark,
                          ),
                          _UPStatBox(
                            label: 'র‍্যাংক',
                            value: '#$_rank',
                            icon: LucideIcons.mapPin,
                            color: const Color(0xFF10B981),
                            isDark: isDark,
                          ),
                          _UPStatBox(
                            label: 'পরীক্ষা',
                            value: user.examsTaken.toString(),
                            icon: LucideIcons.fileText,
                            color: const Color(0xFFE11D48),
                            isDark: isDark,
                          ),
                          _UPStatBox(
                            label: 'স্ট্রিক',
                            value: user.streakCount.toString(),
                            icon: LucideIcons.flame,
                            color: const Color(0xFFF97316),
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // ── Correct answers badge ──────────────────────────────────
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF052E16)
                        : const Color(0xFFECFDF5),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: isDark
                          ? const Color(0xFF064E3B)
                          : const Color(0xFFD1FAE5),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF064E3B)
                              : Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFF059669,
                              ).withValues(alpha: 0.2),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                        child: const Icon(
                          LucideIcons.checkCircle2,
                          size: 26,
                          color: Color(0xFF059669),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _upFmt.format(analytics.totalCorrect),
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: isDark
                                  ? const Color(0xFF34D399)
                                  : const Color(0xFF065F46),
                            ),
                          ),
                          const Text(
                            'সঠিক উত্তর',
                            style: TextStyle(
                              fontSize: 13,
                              color: Color(0xFF059669),
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                      const Spacer(),
                      if (analytics.totalExams > 0)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              '${analytics.avgScore}%',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: isDark
                                    ? const Color(0xFF34D399)
                                    : const Color(0xFF059669),
                              ),
                            ),
                            const Text(
                              'গড় স্কোর',
                              style: TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6EE7B7),
                              ),
                            ),
                          ],
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
                      color: isDark ? const Color(0xFF171717) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF262626)
                            : const Color(0xFFE5E5E5),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'তুলনা: আপনি vs ${user.name.split(' ').first}',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF171717),
                          ),
                        ),
                        const SizedBox(height: 16),
                        _UPXPBar(
                          label: 'আপনি',
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
                          color: const Color(0xFF059669),
                          isDark: isDark,
                        ),
                        const SizedBox(height: 16),
                        GridView.count(
                          crossAxisCount: 2,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 8,
                          childAspectRatio: 2.4,
                          children: [
                            _UPCompareCell(
                              label: 'পরীক্ষা',
                              myVal: _myA.totalExams.toString(),
                              opponentVal: user.examsTaken.toString(),
                              opponentName: user.name.split(' ').first,
                              isDark: isDark,
                            ),
                            _UPCompareCell(
                              label: 'স্ট্রিক',
                              myVal: myProfile.streakCount.toString(),
                              opponentVal: user.streakCount.toString(),
                              opponentName: user.name.split(' ').first,
                              isDark: isDark,
                            ),
                            _UPCompareCell(
                              label: 'গড় স্কোর',
                              myVal: '${_myA.avgScore}%',
                              opponentVal: '${analytics.avgScore}%',
                              opponentName: user.name.split(' ').first,
                              isDark: isDark,
                            ),
                            _UPCompareCell(
                              label: 'সঠিক উত্তর',
                              myVal: _upFmt.format(_myA.totalCorrect),
                              opponentVal: _upFmt.format(
                                analytics.totalCorrect,
                              ),
                              opponentName: user.name.split(' ').first,
                              isDark: isDark,
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
                      color: isDark ? const Color(0xFF171717) : Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF262626)
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
                                color: Color(0xFF059669),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'বিষয়ভিত্তিক পারফরম্যান্স',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF171717),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Divider(
                          height: 1,
                          color: isDark
                              ? const Color(0xFF262626)
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
      color: const Color(0xFFE11D48),
      shape: BoxShape.circle,
      border: Border.all(color: const Color(0xFFFFE4E6), width: 3),
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
            color: isDark ? Colors.white : const Color(0xFF171717),
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
                ? const Color(0xFF262626)
                : const Color(0xFFF5F5F5),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}

// ─── Compare Cell ────────────────────────────────────────────────────────────────
class _UPCompareCell extends StatelessWidget {
  final String label, myVal, opponentVal, opponentName;
  final bool isDark;

  const _UPCompareCell({
    required this.label,
    required this.myVal,
    required this.opponentVal,
    required this.opponentName,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    decoration: BoxDecoration(
      color: isDark
          ? const Color(0xFF262626).withValues(alpha: 0.5)
          : const Color(0xFFF5F5F5),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            fontWeight: FontWeight.w900,
            color: Color(0xFFA3A3A3),
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              myVal,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: isDark
                    ? const Color(0xFFD4D4D4)
                    : const Color(0xFF404040),
              ),
            ),
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 6),
              width: 1,
              height: 16,
              color: isDark ? const Color(0xFF404040) : const Color(0xFFD4D4D4),
            ),
            Text(
              opponentVal,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Color(0xFF059669),
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'আপনি',
              style: TextStyle(fontSize: 9, color: Color(0xFFA3A3A3)),
            ),
            const SizedBox(width: 16),
            Flexible(
              child: Text(
                opponentName,
                style: const TextStyle(fontSize: 9, color: Color(0xFF059669)),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ],
    ),
  );
}

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
        ? const Color(0xFF059669)
        : accuracy >= 50
        ? const Color(0xFFE11D48)
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
                        ? const Color(0xFFE11D48)
                        : (isDark
                              ? const Color(0xFF404040)
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
                                ? const Color(0xFFFB7185)
                                : const Color(0xFFE11D48))
                          : (isDark ? Colors.white : const Color(0xFF262626)),
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
                            const Color(0xFF059669),
                            isDark,
                          ),
                          _UPMini(
                            'ভুল',
                            s.wrong,
                            const Color(0xFFE11D48),
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
                                    color: const Color(0xFF059669),
                                  ),
                                ),
                                if (s.wrong > 0)
                                  Flexible(
                                    flex: s.wrong,
                                    child: Container(
                                      color: const Color(0xFFE11D48),
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
            color: isDark ? const Color(0xFF262626) : const Color(0xFFF0F0F0),
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
