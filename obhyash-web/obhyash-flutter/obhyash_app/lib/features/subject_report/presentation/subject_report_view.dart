import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';

// ─── Models ────────────────────────────────────────────────────────────────────
class _Chapter {
  final String name;
  final int total, correct, accuracy;

  const _Chapter({
    required this.name,
    required this.total,
    required this.correct,
    required this.accuracy,
  });
}

class _SRStats {
  final int totalQuestions, correct, wrong, skipped, accuracy, averageTime;
  final List<_Chapter> chapters;

  const _SRStats({
    required this.totalQuestions,
    required this.correct,
    required this.wrong,
    required this.skipped,
    required this.accuracy,
    required this.averageTime,
    required this.chapters,
  });

  static const empty = _SRStats(
    totalQuestions: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    accuracy: 0,
    averageTime: 0,
    chapters: [],
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
String _srSubjName(String key) {
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

bool _srSubjMatches(String stored, String target) {
  if (stored.toLowerCase() == target.toLowerCase()) return true;
  final s = _srSubjName(stored).toLowerCase();
  final t = _srSubjName(target).toLowerCase();
  return s == t || s.contains(t) || t.contains(s);
}

// ─── View ──────────────────────────────────────────────────────────────────────
class SubjectReportView extends ConsumerStatefulWidget {
  final String subject;
  const SubjectReportView({super.key, required this.subject});

  @override
  ConsumerState<SubjectReportView> createState() => _SubjectReportViewState();
}

class _SubjectReportViewState extends ConsumerState<SubjectReportView> {
  String _filter = 'all';
  _SRStats? _stats;
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
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) {
        if (mounted) {
          setState(() {
            _stats = _SRStats.empty;
            _isLoading = false;
          });
        }
        return;
      }

      var query = supabase
          .from('exam_results')
          .select(
            'total_questions, correct_count, wrong_count, time_taken, subject, date, chapters, questions, user_answers',
          )
          .eq('user_id', userId)
          .eq('status', 'evaluated');

      if (_filter == 'week') {
        final ago = DateTime.now().subtract(const Duration(days: 7));
        query = query.gte('date', ago.toIso8601String());
      } else if (_filter == 'month') {
        final ago = DateTime.now().subtract(const Duration(days: 30));
        query = query.gte('date', ago.toIso8601String());
      }

      final raw = (await query) as List;
      final rows = raw
          .where(
            (r) =>
                _srSubjMatches((r['subject'] as String?) ?? '', widget.subject),
          )
          .toList();

      if (rows.isEmpty) {
        if (mounted) {
          setState(() {
            _stats = _SRStats.empty;
            _isLoading = false;
          });
        }
        return;
      }

      int totalQ = 0, correct = 0, wrong = 0, totalTime = 0;
      final Map<String, ({int total, int correct})> chapMap = {};

      for (final row in rows) {
        final total = (row['total_questions'] as num?)?.toInt() ?? 0;
        final c = (row['correct_count'] as num?)?.toInt() ?? 0;
        final w = (row['wrong_count'] as num?)?.toInt() ?? 0;
        final time = (row['time_taken'] as num?)?.toInt() ?? 0;
        totalQ += total;
        correct += c;
        wrong += w;
        totalTime += time;

        final questions = row['questions'];
        final userAnswers = row['user_answers'];
        if (questions is List && questions.isNotEmpty) {
          final answersMap = userAnswers is Map
              ? Map<String, dynamic>.from(userAnswers)
              : <String, dynamic>{};
          for (final q in questions) {
            if (q is! Map) continue;
            final cName =
                ((q['topic'] ?? q['chapter'] ?? 'General') as Object?)
                    ?.toString() ??
                'General';
            final prev = chapMap[cName];
            final qId = q['id']?.toString() ?? '';
            final userAns = answersMap[qId];
            final correctAns =
                (q['correct_answer_index'] ?? q['correctAnswerIndex'])
                    ?.toString();
            final isCorrect =
                userAns != null &&
                correctAns != null &&
                userAns.toString() == correctAns.toString();
            chapMap[cName] = (
              total: (prev?.total ?? 0) + 1,
              correct: (prev?.correct ?? 0) + (isCorrect ? 1 : 0),
            );
          }
        } else {
          // Fallback: derive chapter breakdown from the 'chapters' text column (legacy exams)
          final chapText = (row['chapters'] as String?) ?? 'General';
          for (final ch
              in chapText
                  .split(',')
                  .map((s) => s.trim())
                  .where((s) => s.isNotEmpty)) {
            final prev = chapMap[ch];
            chapMap[ch] = (
              total: (prev?.total ?? 0) + (total > 0 ? 1 : 0),
              correct: prev?.correct ?? 0,
            );
          }
        }
      }

      final skipped = (totalQ - correct - wrong).clamp(0, totalQ);
      final accuracy = totalQ > 0 ? (correct / totalQ * 100).round() : 0;
      final avgTime = totalQ > 0 ? (totalTime / totalQ).round() : 0;

      final chapters =
          chapMap.entries
              .map(
                (e) => _Chapter(
                  name: e.key,
                  total: e.value.total,
                  correct: e.value.correct,
                  accuracy: e.value.total > 0
                      ? (e.value.correct / e.value.total * 100).round()
                      : 0,
                ),
              )
              .toList()
            ..sort((a, b) => b.total.compareTo(a.total));

      if (mounted) {
        setState(() {
          _stats = _SRStats(
            totalQuestions: totalQ,
            correct: correct,
            wrong: wrong,
            skipped: skipped,
            accuracy: accuracy,
            averageTime: avgTime,
            chapters: chapters,
          );
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('[SubjectReportView] _fetch error: $e');
      if (mounted) {
        setState(() {
          _stats = _SRStats.empty;
          _isLoading = false;
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

    return Column(
      children: [
        // ── Time Filter ───────────────────────────────────────────────────
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isDark
                    ? const Color(0xFF1C1C1E)
                    : const Color(0xFFE5E5E5),
              ),
            ),
          ),
          child: Row(
            children: [
              for (final f in [
                ('all', 'সব সময়'),
                ('month', 'এই মাস'),
                ('week', 'এই সপ্তাহ'),
              ])
                Expanded(
                  child: GestureDetector(
                    onTap: () {
                      if (_filter != f.$1) {
                        setState(() => _filter = f.$1);
                        _fetch();
                      }
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      decoration: BoxDecoration(
                        color: _filter == f.$1
                            ? const Color(0xFFB91C1C)
                            : (isDark
                                  ? const Color(0xFF1C1C1E)
                                  : const Color(0xFFF5F5F5)),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        f.$2,
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: _filter == f.$1
                              ? Colors.white
                              : (isDark
                                    ? const Color(0xFFA3A3A3)
                                    : const Color(0xFF525252)),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),

        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (_stats == null || _stats!.totalQuestions == 0)
                        _SREmpty(isDark: isDark)
                      else ...[
                        // ── KPI Cards ──────────────────────────────────────
                        Row(
                          children: [
                            _SRKpi(
                              label: 'মোট প্রশ্ন',
                              value: _stats!.totalQuestions.toString(),
                              icon: LucideIcons.clipboardList,
                              color: const Color(0xFFB91C1C),
                              isDark: isDark,
                            ),
                            _SRKpi(
                              label: 'নির্ভুলতা',
                              value: '${_stats!.accuracy}%',
                              icon: LucideIcons.checkCircle2,
                              color: const Color(0xFF047857),
                              isDark: isDark,
                            ),
                            _SRKpi(
                              label: 'গড় সময়',
                              value: '${_stats!.averageTime}s',
                              icon: LucideIcons.clock,
                              color: const Color(0xFFB91C1C),
                              isDark: isDark,
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        // ── Donut Chart ────────────────────────────────────
                        _SRDonut(stats: _stats!, isDark: isDark),
                        const SizedBox(height: 14),

                        // ── Chapters ───────────────────────────────────────
                        if (_stats!.chapters.isNotEmpty) ...[
                          _SRChapterList(
                            chapters: _stats!.chapters,
                            isDark: isDark,
                          ),
                          const SizedBox(height: 14),
                        ],

                        // ── Weakness ───────────────────────────────────────
                        _SRWeakness(stats: _stats!, isDark: isDark),
                      ],
                    ],
                  ),
                ),
        ),
      ],
    );
  }
}

// ─── KPI Card ────────────────────────────────────────────────────────────────────
class _SRKpi extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _SRKpi({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      margin: const EdgeInsets.symmetric(horizontal: 3),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : const Color(0xFF000000),
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 13, color: Color(0xFFA3A3A3)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}

// ─── Donut Chart ────────────────────────────────────────────────────────────────
class _SRDonut extends StatelessWidget {
  final _SRStats stats;
  final bool isDark;

  const _SRDonut({required this.stats, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final sections = [
      PieChartSectionData(
        value: stats.correct.toDouble().clamp(0.001, double.infinity),
        color: const Color(0xFF047857),
        title: '',
        radius: 20,
      ),
      PieChartSectionData(
        value: stats.wrong.toDouble().clamp(0.001, double.infinity),
        color: const Color(0xFFB91C1C),
        title: '',
        radius: 20,
      ),
      PieChartSectionData(
        value: stats.skipped.toDouble().clamp(0.001, double.infinity),
        color: const Color(0xFF1E3A8A),
        title: '',
        radius: 20,
      ),
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ফলাফল বিশ্লেষণ',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF000000),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              SizedBox(
                width: 140,
                height: 140,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    PieChart(
                      PieChartData(
                        sections: sections,
                        centerSpaceRadius: 42,
                        sectionsSpace: 4,
                      ),
                    ),
                    Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${stats.accuracy}%',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'Anek Bangla',
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF000000),
                          ),
                        ),
                        const Text(
                          'সঠিকতা',
                          style: TextStyle(
                            fontSize: 13,
                            fontFamily: 'Anek Bangla',
                            fontWeight: FontWeight.w600,
                            color: Color(0xFFA3A3A3),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  children: [
                    _SRLegend(
                      'সঠিক',
                      stats.correct,
                      const Color(0xFF047857),
                      isDark,
                    ),
                    const SizedBox(height: 8),
                    _SRLegend(
                      'ভুল',
                      stats.wrong,
                      const Color(0xFFB91C1C),
                      isDark,
                    ),
                    const SizedBox(height: 8),
                    _SRLegend(
                      'স্কিপড',
                      stats.skipped,
                      const Color(0xFF1E3A8A),
                      isDark,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SRLegend extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final bool isDark;

  const _SRLegend(this.label, this.value, this.color, this.isDark);

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isDark
              ? color.withValues(alpha: 0.1)
              : color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: color.withValues(alpha: 0.2),
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: color.withValues(alpha: 0.4),
                    blurRadius: 4,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 16,
                  fontFamily: 'Anek Bangla',
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? const Color(0xFFD4D4D4)
                      : const Color(0xFF27272A),
                ),
              ),
            ),
            Text(
              value.toString(),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : const Color(0xFF000000),
              ),
            ),
          ],
        ),
      );
}

// ─── Chapter List ────────────────────────────────────────────────────────────────
class _SRChapterList extends StatelessWidget {
  final List<_Chapter> chapters;
  final bool isDark;

  const _SRChapterList({required this.chapters, required this.isDark});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: isDark ? const Color(0xFF000000) : Colors.white,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(
        color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
      ),
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'অধ্যায়ভিত্তিক দক্ষতা',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : const Color(0xFF000000),
          ),
        ),
        const SizedBox(height: 14),
        ...chapters.map(
          (c) => Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _SRChapterRow(chapter: c, isDark: isDark),
          ),
        ),
      ],
    ),
  );
}

class _SRChapterRow extends StatelessWidget {
  final _Chapter chapter;
  final bool isDark;

  const _SRChapterRow({required this.chapter, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final c = chapter;
    final Color bar = c.accuracy >= 80
        ? const Color(0xFF047857)
        : c.accuracy >= 50
        ? const Color(0xFF1E3A8A)
        : const Color(0xFFB91C1C);
    final pct = c.total > 0 ? (c.accuracy / 100.0).clamp(0.0, 1.0) : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                c.name,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? const Color(0xFFD4D4D4)
                      : const Color(0xFF27272A),
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '${c.accuracy}%',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: bar,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: pct,
            minHeight: 8,
            backgroundColor: isDark
                ? const Color(0xFF1C1C1E)
                : const Color(0xFFF0F0F0),
            valueColor: AlwaysStoppedAnimation<Color>(bar),
          ),
        ),
        Text(
          '${c.total} প্রশ্ন',
          style: const TextStyle(fontSize: 13, color: Color(0xFFA3A3A3)),
        ),
      ],
    );
  }
}

// ─── Weakness Section ────────────────────────────────────────────────────────────
class _Weak {
  final String name;
  final int wrong, accuracy;
  const _Weak(this.name, this.wrong, this.accuracy);
}

class _SRWeakness extends StatelessWidget {
  final _SRStats stats;
  final bool isDark;

  const _SRWeakness({required this.stats, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final weak =
        stats.chapters
            .where((c) => c.total - c.correct > 0)
            .map((c) => _Weak(c.name, c.total - c.correct, c.accuracy))
            .toList()
          ..sort((a, b) => b.wrong.compareTo(a.wrong));

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF000000) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: isDark
                  ? const Color(0xFF1C1C1E).withValues(alpha: 0.3)
                  : const Color(0xFFFAFAFA),
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(20),
              ),
              border: Border(
                bottom: BorderSide(
                  color: isDark
                      ? const Color(0xFF1C1C1E)
                      : const Color(0xFFF0F0F0),
                ),
              ),
            ),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0x1AE11D48)
                        : const Color(0xFFFFF1F2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(
                    LucideIcons.xCircle,
                    size: 16,
                    color: Color(0xFFB91C1C),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  'দুর্বলতা ও ভুলের ধরণ',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF000000),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: weak.isEmpty
                ? Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF047857)
                          : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF047857)
                            : const Color(0xFFECFDF5),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          LucideIcons.checkCircle2,
                          size: 18,
                          color: Color(0xFF047857),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'কোনো দুর্বলতা নেই! চমৎকার।',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF047857),
                          ),
                        ),
                      ],
                    ),
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: isDark
                                ? [const Color(0xFF4C0519), const Color(0xFF22030B)]
                                : [const Color(0xFFFFF1F2), const Color(0xFFFEF2F2)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isDark ? const Color(0xFF881337) : const Color(0xFFFECDD3),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: isDark ? const Color(0x33E11D48) : const Color(0x33F43F5E),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: isDark ? const Color(0x33E11D48) : const Color(0xFFFFE4E6),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(LucideIcons.target, size: 18, color: Color(0xFFE11D48)),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'সর্বাধিক ভুল',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFFE11D48),
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      Text(
                                        weak.first.name == 'General' ? 'সাধারণ প্রশ্ন' : weak.first.name,
                                        style: TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: isDark ? Colors.white : const Color(0xFF000000),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE11D48),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    '${weak.first.wrong}টি ভুল',
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isDark ? const Color(0x33000000) : Colors.white,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(LucideIcons.lightbulb, size: 16, color: Color(0xFF1E3A8A)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      '"${weak.first.name == 'General' ? 'সাধারণ প্রশ্ন' : weak.first.name}" অধ্যায়টি পুনরায় রিভিশন ও অনুশীলন করলে তোমার স্কোর উল্লেখযোগ্যভাবে বাড়বে।',
                                      style: TextStyle(
                                        fontSize: 15,
                                        color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A),
                                        height: 1.4,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: () {
                                  context.go('/setup');
                                },
                                icon: const Icon(LucideIcons.playCircle, size: 18),
                                label: const Text('এখনই অনুশীলন করো'),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFE11D48),
                                  foregroundColor: Colors.white,
                                  elevation: 0,
                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  textStyle: const TextStyle(fontSize: 16, fontFamily: 'Anek Bangla', fontWeight: FontWeight.bold),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (weak.length > 1) ...[
                        const SizedBox(height: 24),
                        Text(
                          'অন্যান্য দুর্বল বিষয়সমূহ',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
                          ),
                        ),
                        const SizedBox(height: 16),
                        ...weak.skip(1).take(5).map((w) {
                          final double ratio = weak.first.wrong > 0 ? (w.wrong / weak.first.wrong).clamp(0.0, 1.0) : 0.0;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Text(
                                        w.name == 'General' ? 'সাধারণ প্রশ্ন' : w.name,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A),
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Text(
                                      '${w.wrong}টি ভুল',
                                      style: const TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFFE11D48),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: LinearProgressIndicator(
                                    value: ratio,
                                    backgroundColor: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5),
                                    valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFE11D48)),
                                    minHeight: 6,
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                      ],
                    ],
                  ),
          ),
        ],
      ),
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────────
class _SREmpty extends StatelessWidget {
  final bool isDark;
  const _SREmpty({required this.isDark});

  @override
  Widget build(BuildContext context) => Center(
    child: Padding(
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1A0508) : const Color(0xFFFFF1F2),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Icon(
              LucideIcons.fileBarChart,
              size: 32,
              color: Color(0xFFB91C1C),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'এখনও পর্যাপ্ত ডাটা নেই',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF000000),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'এই বিষয়ে পরীক্ষা দিলে বিস্তারিত রিপোর্ট দেখা যাবে।',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 15, color: Color(0xFFA3A3A3)),
          ),
        ],
      ),
    ),
  );
}
