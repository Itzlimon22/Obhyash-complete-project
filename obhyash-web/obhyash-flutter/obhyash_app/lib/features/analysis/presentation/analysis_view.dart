import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// ─── Domain Models ──────────────────────────────────────────────────────────────
class OverallAnalytics {
  final int totalExams;
  final int avgScore;
  final int avgAccuracy;
  final int totalTime;
  final List<SubjectAnalytics> subjectData;
  final List<TimelinePoint> timelineData;

  const OverallAnalytics({
    required this.totalExams,
    required this.avgScore,
    required this.avgAccuracy,
    required this.totalTime,
    required this.subjectData,
    required this.timelineData,
  });
}

class SubjectAnalytics {
  final String name;
  final int total;
  final int correct;
  final int wrong;
  final int skipped;
  final double accuracy;

  const SubjectAnalytics({
    required this.name,
    required this.total,
    required this.correct,
    required this.wrong,
    required this.skipped,
    required this.accuracy,
  });
}

class TimelinePoint {
  final String label;
  final double score;

  const TimelinePoint({required this.label, required this.score});
}

// ─── Helpers ────────────────────────────────────────────────────────────────────
String _subjectDisplayName(String key) {
  const names = {
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
  return names[key.toLowerCase()] ?? key;
}

String _formatTime(int seconds) {
  final hrs = seconds ~/ 3600;
  final mins = (seconds % 3600) ~/ 60;
  if (hrs > 0) return '${hrs}h ${mins}m';
  return '${mins}m';
}

// ─── View ────────────────────────────────────────────────────────────────────────
class AnalysisView extends ConsumerStatefulWidget {
  const AnalysisView({super.key});

  @override
  ConsumerState<AnalysisView> createState() => _AnalysisViewState();
}

class _AnalysisViewState extends ConsumerState<AnalysisView> {
  String _timeFilter = 'all';
  OverallAnalytics? _analytics;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchAnalytics();
  }

  Future<void> _fetchAnalytics() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;
      if (userId == null) {
        setState(() => _isLoading = false);
        return;
      }

      var query = supabase
          .from('exam_results')
          .select(
            'score, total_questions, correct_count, wrong_count, time_taken, subject, created_at',
          )
          .eq('user_id', userId);

      if (_timeFilter == 'week') {
        final weekAgo = DateTime.now().subtract(const Duration(days: 7));
        query = query.gte('created_at', weekAgo.toIso8601String());
      } else if (_timeFilter == 'month') {
        final monthAgo = DateTime.now().subtract(const Duration(days: 30));
        query = query.gte('created_at', monthAgo.toIso8601String());
      }

      final data = await query.order('created_at', ascending: true);
      final rows = data as List;

      if (rows.isEmpty) {
        if (mounted) {
          setState(() {
            _analytics = const OverallAnalytics(
              totalExams: 0,
              avgScore: 0,
              avgAccuracy: 0,
              totalTime: 0,
              subjectData: [],
              timelineData: [],
            );
            _isLoading = false;
          });
        }
        return;
      }

      int totalExams = rows.length;
      int totalTime = 0;
      double scoreSum = 0;

      // subject key → accumulated totals
      final Map<String, ({int total, int correct, int wrong})> subjectMap = {};
      final List<TimelinePoint> timeline = [];

      for (final row in rows) {
        final total = (row['total_questions'] as num?)?.toInt() ?? 0;
        final correct = (row['correct_count'] as num?)?.toInt() ?? 0;
        final wrong = (row['wrong_count'] as num?)?.toInt() ?? 0;
        final time = (row['time_taken'] as num?)?.toInt() ?? 0;
        final score = total > 0 ? (correct / total * 100) : 0.0;
        final createdAt =
            DateTime.tryParse(row['created_at'] ?? '') ?? DateTime.now();
        final subject = (row['subject'] as String?) ?? 'general';

        totalTime += time;
        scoreSum += score;

        final prev = subjectMap[subject];
        if (prev == null) {
          subjectMap[subject] = (total: total, correct: correct, wrong: wrong);
        } else {
          subjectMap[subject] = (
            total: prev.total + total,
            correct: prev.correct + correct,
            wrong: prev.wrong + wrong,
          );
        }

        timeline.add(
          TimelinePoint(
            label: DateFormat('d/M').format(createdAt),
            score: score,
          ),
        );
      }

      final subjectData = subjectMap.entries.map((e) {
        final t = e.value.total;
        final c = e.value.correct;
        final w = e.value.wrong;
        final skipped = (t - c - w).clamp(0, t);
        final acc = t > 0 ? c / t * 100.0 : 0.0;
        return SubjectAnalytics(
          name: e.key,
          total: t,
          correct: c,
          wrong: w,
          skipped: skipped,
          accuracy: acc,
        );
      }).toList()..sort((a, b) => b.accuracy.compareTo(a.accuracy));

      if (mounted) {
        setState(() {
          _analytics = OverallAnalytics(
            totalExams: totalExams,
            avgScore: (scoreSum / totalExams).round(),
            avgAccuracy: (scoreSum / totalExams).round(),
            totalTime: totalTime,
            subjectData: subjectData,
            timelineData: timeline,
          );
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      children: [
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : (_analytics == null || _analytics!.totalExams == 0)
              ? _buildEmptyState(isDark)
              : SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // ── Time Filter row ─────────────────────────────
                      Align(
                        alignment: Alignment.centerRight,
                        child: _TimeFilterDropdown(
                          value: _timeFilter,
                          isDark: isDark,
                          onChanged: (val) {
                            setState(() => _timeFilter = val);
                            _fetchAnalytics();
                          },
                        ),
                      ),
                      const SizedBox(height: 16),

                      // ── 4 Stat Cards ─────────────────────────────────
                      GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 12,
                        crossAxisSpacing: 12,
                        childAspectRatio: 1.6,
                        children: [
                          _StatCard(
                            label: 'মোট পরীক্ষা',
                            value: '${_analytics!.totalExams}',
                            isDark: isDark,
                          ),
                          _StatCard(
                            label: 'গড় স্কোর',
                            value: '${_analytics!.avgScore}%',
                            isDark: isDark,
                            valueColor: isDark
                                ? const Color(0xFF34D399)
                                : const Color(0xFF059669),
                          ),
                          _StatCard(
                            label: 'সঠিকতা',
                            value: '${_analytics!.avgAccuracy}%',
                            isDark: isDark,
                            valueColor: isDark
                                ? const Color(0xFF34D399)
                                : const Color(0xFF059669),
                          ),
                          _StatCard(
                            label: 'মোট সময়',
                            value: _formatTime(_analytics!.totalTime),
                            isDark: isDark,
                            valueColor: isDark
                                ? const Color(0xFFF87171)
                                : const Color(0xFFE11D48),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // ── Score Chart ──────────────────────────────────
                      if (_analytics!.timelineData.isNotEmpty)
                        _ScoreChart(
                          timeline: _analytics!.timelineData,
                          isDark: isDark,
                        ),
                      if (_analytics!.timelineData.isNotEmpty)
                        const SizedBox(height: 20),

                      // ── Subject Breakdown ────────────────────────────
                      if (_analytics!.subjectData.isNotEmpty)
                        _SubjectStatCard(
                          subjects: _analytics!.subjectData,
                          isDark: isDark,
                          onSubjectTap: (key) => context.push('/subject/$key'),
                        ),
                    ],
                  ),
                ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(bool isDark) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFF5F5F5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                LucideIcons.barChart2,
                size: 40,
                color: Color(0xFFA3A3A3),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'কোনো ডাটা পাওয়া যায়নি',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: isDark ? Colors.white : const Color(0xFF171717),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'বিশ্লেষণ দেখতে অন্তত একটি পরীক্ষা সম্পন্ন করুন।\nঅথবা সময়সীমা পরিবর্তন করুন।',
              style: TextStyle(
                fontSize: 14,
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF737373),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            _TimeFilterDropdown(
              value: _timeFilter,
              isDark: isDark,
              onChanged: (val) {
                setState(() => _timeFilter = val);
                _fetchAnalytics();
              },
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Time Filter Dropdown ────────────────────────────────────────────────────────
class _TimeFilterDropdown extends StatelessWidget {
  final String value;
  final bool isDark;
  final void Function(String) onChanged;

  const _TimeFilterDropdown({
    required this.value,
    required this.isDark,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      child: DropdownButton<String>(
        value: value,
        isDense: true,
        underline: const SizedBox.shrink(),
        onChanged: (val) {
          if (val != null) onChanged(val);
        },
        style: TextStyle(
          fontWeight: FontWeight.bold,
          fontSize: 13,
          color: isDark ? Colors.white : const Color(0xFF171717),
        ),
        dropdownColor: isDark ? const Color(0xFF262626) : Colors.white,
        items: const [
          DropdownMenuItem(value: 'all', child: Text('সব সময় (All Time)')),
          DropdownMenuItem(value: 'month', child: Text('এই মাস (This Month)')),
          DropdownMenuItem(value: 'week', child: Text('এই সপ্তাহ (This Week)')),
        ],
      ),
    );
  }
}

// ─── Stat Card ───────────────────────────────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String label, value;
  final bool isDark;
  final Color? valueColor;

  const _StatCard({
    required this.label,
    required this.value,
    required this.isDark,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [
                const BoxShadow(
                  color: Color(0x0A000000),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Color(0xFFA3A3A3),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 26,
              fontWeight: FontWeight.w900,
              color:
                  valueColor ??
                  (isDark ? Colors.white : const Color(0xFF171717)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Score Chart ─────────────────────────────────────────────────────────────────
class _ScoreChart extends StatelessWidget {
  final List<TimelinePoint> timeline;
  final bool isDark;

  const _ScoreChart({required this.timeline, required this.isDark});

  @override
  Widget build(BuildContext context) {
    // Build spots — sample at most 20 evenly for readability
    final step = (timeline.length / 20).ceil().clamp(1, timeline.length);
    final sampled = <TimelinePoint>[];
    for (var i = 0; i < timeline.length; i += step) {
      sampled.add(timeline[i]);
    }

    final spots = sampled.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value.score.clamp(0, 100));
    }).toList();

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [const BoxShadow(color: Color(0x08000000), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ফলাফলের গ্রাফ',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF171717),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF064E3B)
                      : const Color(0xFFECFDF5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'Score %',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF059669),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 200,
            child: LineChart(
              LineChartData(
                minY: 0,
                maxY: 100,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (_) => FlLine(
                    color: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFE2E8F0),
                    strokeWidth: 1,
                    dashArray: [4, 4],
                  ),
                ),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: (sampled.length / 5).ceilToDouble().clamp(
                        1,
                        sampled.length.toDouble(),
                      ),
                      getTitlesWidget: (val, meta) {
                        final idx = val.toInt();
                        if (idx < 0 || idx >= sampled.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            sampled[idx].label,
                            style: const TextStyle(
                              fontSize: 10,
                              color: Color(0xFF94A3B8),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    getTooltipColor: (_) =>
                        isDark ? const Color(0xFF262626) : Colors.white,
                    tooltipBorderRadius: BorderRadius.circular(10),
                    getTooltipItems: (spots) => spots
                        .map(
                          (s) => LineTooltipItem(
                            '${s.y.round()}%',
                            const TextStyle(
                              color: Color(0xFF059669),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        )
                        .toList(),
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: spots,
                    isCurved: true,
                    preventCurveOverShooting: true,
                    color: const Color(0xFF059669),
                    barWidth: 3,
                    dotData: FlDotData(
                      show: spots.length <= 10,
                      getDotPainter: (_, _, _, _) => FlDotCirclePainter(
                        radius: 3,
                        color: const Color(0xFF059669),
                        strokeWidth: 2,
                        strokeColor: Colors.white,
                      ),
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          const Color(0xFF059669).withValues(alpha: 0.3),
                          const Color(0xFF059669).withValues(alpha: 0.0),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Subject Stat Card ───────────────────────────────────────────────────────────
class _SubjectStatCard extends StatelessWidget {
  final List<SubjectAnalytics> subjects;
  final bool isDark;
  final void Function(String)? onSubjectTap;

  const _SubjectStatCard({
    required this.subjects,
    required this.isDark,
    this.onSubjectTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: isDark
            ? []
            : [const BoxShadow(color: Color(0x08000000), blurRadius: 4)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'সাবজেক্ট ভিত্তিক রিপোর্ট',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF171717),
            ),
          ),
          const SizedBox(height: 16),
          ...subjects.map(
            (s) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _SubjectItem(
                subject: s,
                isDark: isDark,
                onNavigate: onSubjectTap != null
                    ? () => onSubjectTap!(s.name)
                    : null,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Subject Item (collapsible) ──────────────────────────────────────────────────
class _SubjectItem extends StatefulWidget {
  final SubjectAnalytics subject;
  final bool isDark;
  final VoidCallback? onNavigate;

  const _SubjectItem({
    required this.subject,
    required this.isDark,
    this.onNavigate,
  });

  @override
  State<_SubjectItem> createState() => _SubjectItemState();
}

class _SubjectItemState extends State<_SubjectItem> {
  bool _isOpen = false;

  @override
  Widget build(BuildContext context) {
    final s = widget.subject;
    final isDark = widget.isDark;
    final accuracy = s.accuracy.round();
    final Color accColor;
    if (accuracy >= 80) {
      accColor = isDark ? const Color(0xFF34D399) : const Color(0xFF059669);
    } else if (accuracy >= 50) {
      accColor = isDark ? const Color(0xFFFB7185) : const Color(0xFFE11D48);
    } else {
      accColor = isDark ? const Color(0xFF737373) : const Color(0xFF737373);
    }
    final Color accBg;
    if (accuracy >= 80) {
      accBg = isDark ? const Color(0xFF064E3B) : const Color(0xFFECFDF5);
    } else if (accuracy >= 50) {
      accBg = isDark ? const Color(0xFF3F0F17) : const Color(0xFFFFF1F2);
    } else {
      accBg = isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5);
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1A1A1A) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isOpen
              ? (isDark ? const Color(0xFF7F1D2A) : const Color(0xFFFECDD3))
              : (isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5)),
        ),
        boxShadow: _isOpen && !isDark
            ? [
                const BoxShadow(
                  color: Color(0x0C000000),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ]
            : [],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => setState(() => _isOpen = !_isOpen),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── Header row ──────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.all(14),
                child: Row(
                  children: [
                    // Left accent bar
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 4,
                      height: 32,
                      decoration: BoxDecoration(
                        color: _isOpen
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
                        _subjectDisplayName(s.name),
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 15,
                          color: _isOpen
                              ? (isDark
                                    ? const Color(0xFFFB7185)
                                    : const Color(0xFFE11D48))
                              : (isDark
                                    ? const Color(0xFFE5E5E5)
                                    : const Color(0xFF262626)),
                        ),
                      ),
                    ),
                    // Accuracy badge
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: accBg,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '$accuracy%',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: accColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    if (widget.onNavigate != null) ...[
                      GestureDetector(
                        behavior: HitTestBehavior.opaque,
                        onTap: widget.onNavigate,
                        child: Container(
                          width: 28,
                          height: 28,
                          margin: const EdgeInsets.only(right: 4),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF1A3A2E)
                                : const Color(0xFFECFDF5),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            LucideIcons.externalLink,
                            size: 13,
                            color: Color(0xFF059669),
                          ),
                        ),
                      ),
                    ],
                    // Chevron
                    AnimatedRotation(
                      duration: const Duration(milliseconds: 200),
                      turns: _isOpen ? 0.5 : 0,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: _isOpen
                              ? (isDark
                                    ? const Color(0xFF3F0F17)
                                    : const Color(0xFFFFF1F2))
                              : (isDark
                                    ? const Color(0xFF262626)
                                    : const Color(0xFFF5F5F5)),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          LucideIcons.chevronDown,
                          size: 15,
                          color: _isOpen
                              ? (isDark
                                    ? const Color(0xFFFB7185)
                                    : const Color(0xFFE11D48))
                              : (isDark
                                    ? const Color(0xFF737373)
                                    : const Color(0xFFA3A3A3)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              // ── Expanded details ───────────────────────────────────
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeInOut,
                child: _isOpen
                    ? Column(
                        children: [
                          Divider(
                            height: 1,
                            color: isDark
                                ? const Color(0xFF262626)
                                : const Color(0xFFF5F5F5),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
                            child: Column(
                              children: [
                                // Stats grid
                                Row(
                                  children: [
                                    _MiniStat(
                                      label: 'সঠিক',
                                      value: '${s.correct}',
                                      color: isDark
                                          ? const Color(0xFF34D399)
                                          : const Color(0xFF059669),
                                      isDark: isDark,
                                    ),
                                    const SizedBox(width: 8),
                                    _MiniStat(
                                      label: 'ভুল',
                                      value: '${s.wrong}',
                                      color: isDark
                                          ? const Color(0xFFF87171)
                                          : const Color(0xFFE11D48),
                                      isDark: isDark,
                                    ),
                                    const SizedBox(width: 8),
                                    _MiniStat(
                                      label: 'স্কিপড',
                                      value: '${s.skipped}',
                                      color: isDark
                                          ? const Color(0xFFF87171)
                                          : const Color(0xFFE11D48),
                                      isDark: isDark,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                // Segmented progress bar
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: SizedBox(
                                    height: 10,
                                    child: Row(
                                      children: [
                                        if (s.total > 0) ...[
                                          Flexible(
                                            flex: s.correct,
                                            child: Container(
                                              decoration: const BoxDecoration(
                                                gradient: LinearGradient(
                                                  colors: [
                                                    Color(0xFF34D399),
                                                    Color(0xFF059669),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),
                                          Flexible(
                                            flex: s.wrong,
                                            child: Container(
                                              decoration: const BoxDecoration(
                                                gradient: LinearGradient(
                                                  colors: [
                                                    Color(0xFFF87171),
                                                    Color(0xFFE11D48),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ),
                                          if (s.skipped > 0)
                                            Flexible(
                                              flex: s.skipped,
                                              child: Container(
                                                color: isDark
                                                    ? const Color(0xFF404040)
                                                    : const Color(0xFFE5E5E5),
                                              ),
                                            ),
                                        ] else
                                          Expanded(
                                            child: Container(
                                              color: isDark
                                                  ? const Color(0xFF404040)
                                                  : const Color(0xFFE5E5E5),
                                            ),
                                          ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      )
                    : const SizedBox.shrink(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Mini Stat ───────────────────────────────────────────────────────────────────
class _MiniStat extends StatelessWidget {
  final String label, value;
  final Color color;
  final bool isDark;

  const _MiniStat({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFF9F9F9),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isDark ? const Color(0xFF404040) : const Color(0xFFF0F0F0),
          ),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: const TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.bold,
                color: Color(0xFFA3A3A3),
                letterSpacing: 0.5,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
