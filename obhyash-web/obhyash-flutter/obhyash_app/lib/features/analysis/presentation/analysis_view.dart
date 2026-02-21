import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

// --- Domain Models ---
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
  final int totalQuestions;
  final int correct;
  final double accuracy;

  const SubjectAnalytics({
    required this.name,
    required this.totalQuestions,
    required this.correct,
    required this.accuracy,
  });
}

class TimelinePoint {
  final String name;
  final double score;

  const TimelinePoint({required this.name, required this.score});
}

// --- Helpers ---
String _subjectDisplayName(String key) {
  final names = {
    'physics': 'পদার্থবিজ্ঞান',
    'chemistry': 'রসায়ন',
    'biology': 'জীববিজ্ঞান',
    'math': 'গণিত',
    'bangla': 'বাংলা',
    'english': 'ইংরেজি',
    'ict': 'আইসিটি',
    'general_knowledge': 'সাধারণ জ্ঞান',
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

// --- View ---
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
            'score, total_questions, correct_count, time_taken, subject, created_at',
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
      double accuracySum = 0;

      final Map<String, List<double>> subjectAccuracies = {};
      final List<TimelinePoint> timeline = [];

      for (final row in rows) {
        final total = (row['total_questions'] as num?)?.toInt() ?? 0;
        final correct = (row['correct_count'] as num?)?.toInt() ?? 0;
        final time = (row['time_taken'] as num?)?.toInt() ?? 0;
        final score = total > 0 ? (correct / total * 100) : 0.0;
        final createdAt =
            DateTime.tryParse(row['created_at'] ?? '') ?? DateTime.now();
        final subject = row['subject'] ?? 'general';

        totalTime += time;
        scoreSum += score;
        accuracySum += score;

        subjectAccuracies.putIfAbsent(subject, () => []).add(score);
        timeline.add(
          TimelinePoint(
            name: DateFormat('d/M').format(createdAt),
            score: score,
          ),
        );
      }

      final subjectData = subjectAccuracies.entries.map((e) {
        final avg = e.value.reduce((a, b) => a + b) / e.value.length;
        return SubjectAnalytics(
          name: e.key,
          totalQuestions: e.value.length,
          correct: (avg / 100 * e.value.length).round(),
          accuracy: avg,
        );
      }).toList()..sort((a, b) => b.accuracy.compareTo(a.accuracy));

      if (mounted) {
        setState(() {
          _analytics = OverallAnalytics(
            totalExams: totalExams,
            avgScore: (scoreSum / totalExams).round(),
            avgAccuracy: (accuracySum / totalExams).round(),
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
        // Mobile Header (matching the web app)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF171717) : Colors.white,
            border: Border(
              bottom: BorderSide(
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFE5E5E5),
              ),
            ),
          ),
          child: Row(
            children: [
              IconButton(
                icon: const Icon(LucideIcons.arrowLeft),
                onPressed: () {
                  if (Navigator.canPop(context)) Navigator.pop(context);
                },
                color: isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF737373),
              ),
              const SizedBox(width: 8),
              Text(
                'বিশ্লেষণ (Analysis)',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF171717),
                ),
              ),
            ],
          ),
        ),

        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : (_analytics == null || _analytics!.totalExams == 0)
              ? _buildEmptyState(isDark)
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      // Time Filter
                      Align(
                        alignment: Alignment.centerRight,
                        child: Container(
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF171717)
                                : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark
                                  ? const Color(0xFF262626)
                                  : const Color(0xFFE5E5E5),
                            ),
                          ),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 4,
                          ),
                          child: DropdownButton<String>(
                            value: _timeFilter,
                            isDense: true,
                            underline: const SizedBox.shrink(),
                            onChanged: (val) {
                              if (val != null) {
                                setState(() => _timeFilter = val);
                                _fetchAnalytics();
                              }
                            },
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                              color: isDark
                                  ? Colors.white
                                  : const Color(0xFF171717),
                            ),
                            dropdownColor: isDark
                                ? const Color(0xFF262626)
                                : Colors.white,
                            items: const [
                              DropdownMenuItem(
                                value: 'all',
                                child: Text('সব সময় (All Time)'),
                              ),
                              DropdownMenuItem(
                                value: 'month',
                                child: Text('এই মাস (This Month)'),
                              ),
                              DropdownMenuItem(
                                value: 'week',
                                child: Text('এই সপ্তাহ (This Week)'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // 4 Stat Cards Grid
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
                            valueColor: const Color(0xFF059669),
                          ),
                          _StatCard(
                            label: 'সঠিকতা',
                            value: '${_analytics!.avgAccuracy}%',
                            isDark: isDark,
                            valueColor: const Color(0xFF059669),
                          ),
                          _StatCard(
                            label: 'মোট সময়',
                            value: _formatTime(_analytics!.totalTime),
                            isDark: isDark,
                            valueColor: const Color(0xFFD97706),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),

                      // Subject Breakdown
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0xFF171717)
                              : Colors.white,
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
                              'বিষয়ভিত্তিক ফলাফল',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF171717),
                              ),
                            ),
                            const SizedBox(height: 16),
                            ..._analytics!.subjectData.map(
                              (s) => _SubjectBar(subject: s, isDark: isDark),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),
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
            Container(
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF262626) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: isDark
                      ? const Color(0xFF404040)
                      : const Color(0xFFE5E5E5),
                ),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: DropdownButton<String>(
                value: _timeFilter,
                isDense: true,
                underline: const SizedBox.shrink(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _timeFilter = val);
                    _fetchAnalytics();
                  }
                },
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: isDark ? Colors.white : const Color(0xFF171717),
                ),
                dropdownColor: isDark ? const Color(0xFF262626) : Colors.white,
                items: const [
                  DropdownMenuItem(
                    value: 'all',
                    child: Text('সব সময় (All Time)'),
                  ),
                  DropdownMenuItem(
                    value: 'month',
                    child: Text('এই মাস (This Month)'),
                  ),
                  DropdownMenuItem(
                    value: 'week',
                    child: Text('এই সপ্তাহ (This Week)'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

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

class _SubjectBar extends StatelessWidget {
  final SubjectAnalytics subject;
  final bool isDark;

  const _SubjectBar({required this.subject, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final accuracy = subject.accuracy.clamp(0, 100) / 100;
    Color barColor = const Color(0xFFEF4444); // red
    if (accuracy >= 0.7)
      barColor = const Color(0xFF059669); // emerald
    else if (accuracy >= 0.4)
      barColor = const Color(0xFFF59E0B); // amber

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _subjectDisplayName(subject.name),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF171717),
                ),
              ),
              Text(
                '${subject.accuracy.round()}%',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w900,
                  color: barColor,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: Container(
              height: 8,
              width: double.infinity,
              color: isDark ? const Color(0xFF404040) : const Color(0xFFF5F5F5),
              child: FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: accuracy.isNaN ? 0 : accuracy,
                child: Container(
                  decoration: BoxDecoration(
                    color: barColor,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
