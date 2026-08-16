import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';

// ─── Domain Models ──────────────────────────────────────────────────────────────
class OverallAnalytics {
  final int totalExams;
  final int avgScore;
  final int avgAccuracy;
  final int totalTime;
  final int totalQuestions;
  final int totalCorrect;
  final int totalWrong;
  final double avgTimePerQuestion;
  final List<SubjectAnalytics> subjectData;
  final List<TimelinePoint> timelineData;

  const OverallAnalytics({
    required this.totalExams,
    required this.avgScore,
    required this.avgAccuracy,
    required this.totalTime,
    required this.totalQuestions,
    required this.totalCorrect,
    required this.totalWrong,
    required this.avgTimePerQuestion,
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
    'hsc_bangla_1': 'বাংলা ১ম পত্র',
    'hsc_bangla_2': 'বাংলা ২য় পত্র',
    'hsc_english_1': 'English 1st Paper',
    'hsc_english_2': 'English 2nd Paper',
    'hsc_ict': 'তথ্য ও যোগাযোগ প্রযুক্তি',
    'hsc_physics_1': 'পদার্থবিজ্ঞান ১ম পত্র',
    'hsc_physics_2': 'পদার্থবিজ্ঞান ২য় পত্র',
    'hsc_chemistry_1': 'রসায়ন ১ম পত্র',
    'hsc_chemistry_2': 'রসায়ন ২য় পত্র',
    'hsc_biology_1': 'জীববিজ্ঞান ১ম পত্র',
    'hsc_biology_2': 'জীববিজ্ঞান ২য় পত্র',
    'hsc_math_1': 'উচ্চতর গণিত ১ম পত্র',
    'hsc_math_2': 'উচ্চতর গণিত ২য় পত্র',
  };
  return names[key.toLowerCase()] ?? key;
}

String _formatTime(int seconds) {
  final hrs = seconds ~/ 3600;
  final mins = (seconds % 3600) ~/ 60;
  final secs = seconds % 60;
  if (hrs > 0) return '${hrs}h ${mins}m';
  if (mins > 0) return '${mins}m ${secs}s';
  return '${secs}s';
}

// ─── Theme Constants ─────────────────────────────────────────────────────────────
class AppColors {
  static const primaryAccent = Color(0xFF6366F1); // Indigo 500
  static const secondaryAccent = Color(0xFF8B5CF6); // Violet 500
  
  static const darkBg = Color(0xFF0C0A09); // Deep Pure Black (matches app theme)
  static const darkSurface = Color(0xFF141416); // Clean dark card surface
  static const darkBorder = Color(0xFF262626); // Subtle dark border
  
  static const lightBg = Color(0xFFF8FAFC); // Slate 50
  static const lightSurface = Color(0xFFFFFFFF);
  static const lightBorder = Color(0xFFE2E8F0); // Slate 200
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
          .select('score, total_questions, correct_count, wrong_count, time_taken, subject, date, created_at')
          .eq('user_id', userId);

      if (_timeFilter == 'week') {
        final weekAgo = DateTime.now().subtract(const Duration(days: 7));
        query = query.gte('date', weekAgo.toIso8601String());
      } else if (_timeFilter == 'month') {
        final monthAgo = DateTime.now().subtract(const Duration(days: 30));
        query = query.gte('date', monthAgo.toIso8601String());
      }

      final data = await query.order('date', ascending: true);
      final rows = data as List;

      if (rows.isEmpty) {
        if (mounted) {
          setState(() {
            _analytics = const OverallAnalytics(
              totalExams: 0,
              avgScore: 0,
              avgAccuracy: 0,
              totalTime: 0,
              totalQuestions: 0,
              totalCorrect: 0,
              totalWrong: 0,
              avgTimePerQuestion: 0,
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
      int totalQuestions = 0;
      int totalCorrect = 0;
      int totalWrong = 0;

      final Map<String, ({int total, int correct, int wrong})> subjectMap = {};
      final List<TimelinePoint> timeline = [];

      for (final row in rows) {
        final total = (row['total_questions'] as num?)?.toInt() ?? 0;
        final correct = (row['correct_count'] as num?)?.toInt() ?? 0;
        final wrong = (row['wrong_count'] as num?)?.toInt() ?? 0;
        final time = (row['time_taken'] as num?)?.toInt() ?? 0;
        final score = total > 0 ? (correct / total * 100) : 0.0;
        final createdAt = DateTime.tryParse(row['created_at'] ?? '') ?? DateTime.now();
        final subject = (row['subject'] as String?) ?? 'general';

        totalTime += time;
        scoreSum += score;
        totalQuestions += total;
        totalCorrect += correct;
        totalWrong += wrong;

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

        timeline.add(TimelinePoint(label: DateFormat('d/M').format(createdAt), score: score));
      }

      final subjectData = subjectMap.entries.map((e) {
        final t = e.value.total;
        final c = e.value.correct;
        final w = e.value.wrong;
        final skipped = (t - c - w).clamp(0, t);
        final acc = t > 0 ? c / t * 100.0 : 0.0;
        return SubjectAnalytics(name: e.key, total: t, correct: c, wrong: w, skipped: skipped, accuracy: acc);
      }).toList()..sort((a, b) => b.accuracy.compareTo(a.accuracy));

      if (mounted) {
        setState(() {
          _analytics = OverallAnalytics(
            totalExams: totalExams,
            avgScore: (scoreSum / totalExams).round(),
            avgAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions * 100).round() : 0,
            totalTime: totalTime,
            totalQuestions: totalQuestions,
            totalCorrect: totalCorrect,
            totalWrong: totalWrong,
            avgTimePerQuestion: totalQuestions > 0 ? totalTime / totalQuestions : 0,
            subjectData: subjectData,
            timelineData: timeline,
          );
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (prev, next) {
      if (next != null && prev == null) _fetchAnalytics();
    });

    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBg : AppColors.lightBg;
    
    if (_isLoading) {
      return Scaffold(
        backgroundColor: bgColor,
        body: const Center(
          child: CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryAccent),
          ),
        ),
      );
    }

    if (_analytics == null || _analytics!.totalExams == 0) {
      return Scaffold(
        backgroundColor: bgColor,
        body: _buildEmptyState(isDark),
      );
    }

    final a = _analytics!;
    SubjectAnalytics? bestSubj;
    SubjectAnalytics? worstSubj;

    final filtered = a.subjectData.where((s) => s.total >= 5).toList();
    if (filtered.isNotEmpty) {
      bestSubj = filtered.reduce((best, s) => s.accuracy > best.accuracy ? s : best);
      if (filtered.length >= 2) {
        final candidate = filtered.reduce((worst, s) => s.accuracy < worst.accuracy ? s : worst);
        if (candidate.name != bestSubj.name) worstSubj = candidate;
      }
    }

    final bScore = a.timelineData.isNotEmpty
        ? a.timelineData.map((t) => t.score).reduce((x, y) => x > y ? x : y)
        : null;

    final achievements = [
      (id: 'first', label: 'প্রথম পরীক্ষা', icon: LucideIcons.target, unlocked: a.totalExams >= 1),
      (id: 'ten', label: '১০ পরীক্ষা', icon: LucideIcons.bookOpen, unlocked: a.totalExams >= 10),
      (id: 'fifty', label: '৫০ পরীক্ষা', icon: LucideIcons.award, unlocked: a.totalExams >= 50),
      (id: 'score80', label: '৮০%+ স্কোর', icon: LucideIcons.star, unlocked: a.avgScore >= 80),
      (id: 'score90', label: '৯০%+ স্কোর', icon: LucideIcons.gem, unlocked: a.avgScore >= 90),
      (id: 'perfect', label: 'পারফেক্ট স্কোর', icon: LucideIcons.zap, unlocked: bScore == 100),
    ];

    return Scaffold(
      backgroundColor: bgColor,
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── 1. HERO BANNER
            Container(
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primaryAccent, AppColors.secondaryAccent],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryAccent.withValues(alpha: 0.25),
                    blurRadius: 20,
                    offset: const Offset(0, 10),
                  )
                ],
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: -60,
                    right: -20,
                    child: Container(
                      width: 180,
                      height: 180,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Positioned(
                    bottom: -40,
                    left: -40,
                    child: Container(
                      width: 120,
                      height: 120,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'পারফরম্যান্স ওভারভিউ',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.2,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                _timeFilter == 'all' ? 'সব সময়' : _timeFilter == 'month' ? 'এই মাস' : 'এই সপ্তাহ',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.baseline,
                          textBaseline: TextBaseline.alphabetic,
                          children: [
                            Text(
                              '${a.avgScore}%',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 52,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'গড় স্কোর',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.2),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(LucideIcons.trendingUp, color: Colors.white, size: 14),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              '${a.avgAccuracy}% সঠিকতা · ${a.totalExams} পরীক্ষা সম্পন্ন',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // ── TIME FILTER (Sleek Pills)
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (final filter in [('week', 'সপ্তাহ'), ('month', 'মাস'), ('all', 'সব')])
                  GestureDetector(
                    onTap: () {
                      setState(() => _timeFilter = filter.$1);
                      _fetchAnalytics();
                    },
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      decoration: BoxDecoration(
                        color: _timeFilter == filter.$1
                            ? (isDark ? Colors.white.withValues(alpha: 0.1) : AppColors.primaryAccent.withValues(alpha: 0.1))
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: _timeFilter == filter.$1
                              ? (isDark ? Colors.white30 : AppColors.primaryAccent.withValues(alpha: 0.3))
                              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                        ),
                      ),
                      child: Text(
                        filter.$2,
                        style: TextStyle(
                          color: _timeFilter == filter.$1
                              ? (isDark ? Colors.white : AppColors.primaryAccent)
                              : (isDark ? Colors.white54 : Colors.black54),
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  )
              ],
            ),
            const SizedBox(height: 24),

            // ── 2. KPI RING CARDS (Monochromatic Accent)
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
              children: [
                _buildPremiumRingCard(
                  label: 'গড় স্কোর',
                  value: '${a.avgScore}%',
                  pct: a.avgScore / 100.0,
                  isDark: isDark,
                ),
                _buildPremiumRingCard(
                  label: 'সঠিকতা',
                  value: '${a.avgAccuracy}%',
                  pct: a.avgAccuracy / 100.0,
                  isDark: isDark,
                ),
                _buildPremiumIconCard(
                  label: 'মোট পরীক্ষা',
                  value: '${a.totalExams}',
                  icon: LucideIcons.copy,
                  isDark: isDark,
                ),
                _buildPremiumIconCard(
                  label: 'মোট সময়',
                  value: _formatTime(a.totalTime),
                  icon: LucideIcons.clock,
                  isDark: isDark,
                ),
              ],
            ),
            const SizedBox(height: 16),

            // ── 3. SECONDARY STATS
            Row(
              children: [
                _buildPremiumStatColumn('মোট প্রশ্ন', '${a.totalQuestions}', isDark),
                const SizedBox(width: 12),
                _buildPremiumStatColumn('সঠিক', '${a.totalCorrect}', isDark),
                const SizedBox(width: 12),
                _buildPremiumStatColumn('ভুল', '${a.totalWrong}', isDark),
              ],
            ),
            const SizedBox(height: 24),

            // ── 4. INSIGHT STRIP
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              clipBehavior: Clip.none,
              child: Row(
                children: [
                  if (bestSubj != null)
                    _buildPremiumInsightCard(LucideIcons.medal, 'শক্তি', _subjectDisplayName(bestSubj.name), '${bestSubj.accuracy.round()}% সঠিকতা', isDark),
                  if (worstSubj != null)
                    _buildPremiumInsightCard(LucideIcons.alertCircle, 'মনোযোগ', _subjectDisplayName(worstSubj.name), '${worstSubj.accuracy.round()}% সঠিকতা', isDark),
                  _buildPremiumInsightCard(LucideIcons.target, 'লক্ষ্য', '৩০টি MCQ', 'গড় ${_formatTime(a.avgTimePerQuestion.round())}/প্রশ্ন', isDark),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ── 5. PERFORMANCE CHART
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                boxShadow: [
                  if (!isDark) BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(LucideIcons.activity, size: 20, color: isDark ? Colors.white70 : Colors.black87),
                          const SizedBox(width: 8),
                          Text(
                            'ট্রেন্ড',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: isDark ? Colors.white : Colors.black87,
                            ),
                          ),
                        ],
                      ),
                      if (bScore != null)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primaryAccent.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            'সর্বোচ্চ ${bScore.round()}%',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryAccent,
                            ),
                          ),
                        )
                    ],
                  ),
                  const SizedBox(height: 24),
                  if (a.timelineData.isEmpty)
                    const SizedBox(
                      height: 160,
                      child: Center(child: Text('কোনো ডাটা নেই')),
                    )
                  else
                    SizedBox(
                      height: 180,
                      child: LineChart(
                        LineChartData(
                          minY: 0,
                          maxY: 100,
                          gridData: const FlGridData(show: false),
                          borderData: FlBorderData(show: false),
                          titlesData: FlTitlesData(
                            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                interval: (a.timelineData.length / 5).ceilToDouble().clamp(1.0, a.timelineData.length.toDouble()),
                                getTitlesWidget: (val, meta) {
                                  final idx = val.toInt();
                                  if (idx < 0 || idx >= a.timelineData.length) {
                                    return const SizedBox.shrink();
                                  }
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 12),
                                    child: Text(
                                      a.timelineData[idx].label,
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: isDark ? Colors.white54 : Colors.black54,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                          lineBarsData: [
                            LineChartBarData(
                              spots: a.timelineData
                                  .asMap()
                                  .entries
                                  .map((e) => FlSpot(e.key.toDouble(), e.value.score))
                                  .toList(),
                              isCurved: true,
                              curveSmoothness: 0.35,
                              preventCurveOverShooting: true,
                              color: AppColors.primaryAccent,
                              barWidth: 3,
                              dotData: const FlDotData(show: false),
                              belowBarData: BarAreaData(
                                show: true,
                                gradient: LinearGradient(
                                  colors: [
                                    AppColors.primaryAccent.withValues(alpha: 0.3),
                                    AppColors.primaryAccent.withValues(alpha: 0.0),
                                  ],
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ── 6. SUBJECT BARS (Premium UI)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                boxShadow: [
                  if (!isDark) BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(LucideIcons.barChart2, size: 20, color: isDark ? Colors.white70 : Colors.black87),
                      const SizedBox(width: 8),
                      Text(
                        'বিষয়ভিত্তিক বিশ্লেষণ',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  if (a.subjectData.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Center(child: Text('কোনো পরীক্ষা দেওয়া হয়নি')),
                    )
                  else
                    ...a.subjectData.map((s) {
                      final pct = s.total > 0 ? (s.correct / s.total * 100).round() : 0;
                      return GestureDetector(
                        onTap: () => context.push('/subject/${s.name}'),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    _subjectDisplayName(s.name),
                                    style: TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w700,
                                      color: isDark ? Colors.white : Colors.black87,
                                    ),
                                  ),
                                  Row(
                                    children: [
                                      Text(
                                        '${s.total} প্রশ্ন',
                                        style: TextStyle(
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? Colors.white54 : Colors.black54,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Text(
                                        '$pct%',
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w900,
                                          color: isDark ? Colors.white : Colors.black87,
                                        ),
                                      ),
                                    ],
                                  )
                                ],
                              ),
                              const SizedBox(height: 12),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: LinearProgressIndicator(
                                  value: pct / 100.0,
                                  minHeight: 8,
                                  backgroundColor: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryAccent),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // ── 7. ACHIEVEMENT SHELF (Monochromatic)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
                boxShadow: [
                  if (!isDark) BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(LucideIcons.award, size: 20, color: isDark ? Colors.white70 : Colors.black87),
                      const SizedBox(width: 8),
                      Text(
                        'অর্জন',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: isDark ? Colors.white : Colors.black87,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 3,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.0,
                    ),
                    itemCount: achievements.length,
                    itemBuilder: (context, index) {
                      final ach = achievements[index];
                      final bool isUnlocked = ach.unlocked;
                      return Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: isUnlocked
                              ? AppColors.primaryAccent.withValues(alpha: 0.1)
                              : (isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF8FAFC)),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isUnlocked
                                ? AppColors.primaryAccent.withValues(alpha: 0.3)
                                : (isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              ach.icon,
                              size: 28,
                              color: isUnlocked
                                  ? AppColors.primaryAccent
                                  : (isDark ? const Color(0xFF2C2C2E) : Colors.black26),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              ach.label,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: isUnlocked
                                    ? (isDark ? Colors.white : Colors.black87)
                                    : (isDark ? Colors.white38 : Colors.black38),
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumRingCard({
    required String label,
    required String value,
    required double pct,
    required bool isDark,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        boxShadow: [
          if (!isDark) BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 60,
            height: 60,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: pct,
                  strokeWidth: 5,
                  backgroundColor: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                  valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryAccent),
                ),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w900,
                    color: isDark ? Colors.white : Colors.black87,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white54 : Colors.black54,
              letterSpacing: 0.5,
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPremiumIconCard({
    required String label,
    required String value,
    required IconData icon,
    required bool isDark,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        boxShadow: [
          if (!isDark) BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, size: 24, color: isDark ? Colors.white : Colors.black87),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : Colors.black87,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: isDark ? Colors.white54 : Colors.black54,
              letterSpacing: 0.5,
            ),
          )
        ],
      ),
    );
  }

  Widget _buildPremiumStatColumn(String label, String value, bool isDark) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
          boxShadow: [
            if (!isDark) BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 2))
          ],
        ),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w900,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white54 : Colors.black54,
              ),
            )
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumInsightCard(IconData icon, String tag, String title, String subtitle, bool isDark) {
    return Container(
      width: 200,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkSurface : AppColors.lightSurface,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: isDark ? AppColors.darkBorder : AppColors.lightBorder),
        boxShadow: [
          if (!isDark) BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 4))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.primaryAccent),
              const SizedBox(width: 8),
              Text(
                tag,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primaryAccent,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: isDark ? Colors.white : Colors.black87,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white54 : Colors.black54,
            ),
          )
        ],
      ),
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
                color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Icon(LucideIcons.barChart2, size: 36, color: isDark ? Colors.white30 : Colors.black26),
            ),
            const SizedBox(height: 24),
            Text(
              'কোনো ডাটা পাওয়া যায়নি',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'বিশ্লেষণ দেখতে অন্তত একটি পরীক্ষা সম্পন্ন করো।\nঅথবা সময়সীমা পরিবর্তন করো।',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: isDark ? Colors.white54 : Colors.black54,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Wrap(
              spacing: 8,
              children: [
                for (final filter in [('week', 'সপ্তাহ'), ('month', 'মাস'), ('all', 'সব')])
                  GestureDetector(
                    onTap: () {
                      setState(() => _timeFilter = filter.$1);
                      _fetchAnalytics();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      decoration: BoxDecoration(
                        color: _timeFilter == filter.$1
                            ? AppColors.primaryAccent
                            : (isDark ? AppColors.darkSurface : AppColors.lightSurface),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: _timeFilter == filter.$1
                              ? AppColors.primaryAccent
                              : (isDark ? AppColors.darkBorder : AppColors.lightBorder),
                        ),
                      ),
                      child: Text(
                        filter.$2,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: _timeFilter == filter.$1
                              ? Colors.white
                              : (isDark ? Colors.white54 : Colors.black54),
                        ),
                      ),
                    ),
                  )
              ],
            )
          ],
        ),
      ),
    );
  }
}
