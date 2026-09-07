import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/utils/bangla_name_helper.dart';
import '../../../core/presentation/widgets/skeleton_loading.dart';
import '../../../core/presentation/widgets/app_refresh_indicator.dart';
import '../../exam/services/local_exam_cache_service.dart';

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
enum _SubjectDomain {
  physics,
  chemistry,
  higherMath,
  generalMath,
  biology,
  bangla,
  english,
  ict,
  generalKnowledge,
  generalScience,
  accounting,
  finance,
  management,
  unknown,
}

_SubjectDomain _extractDomain(String text) {
  final s = text.toLowerCase().replaceAll('-', '_').replaceAll(' ', '_');
  if (s.contains('physics') || s.contains('পদার্থ') || s.contains('phys')) {
    return _SubjectDomain.physics;
  }
  if (s.contains('chem') || s.contains('রসায়ন') || s.contains('রসায়ন')) {
    return _SubjectDomain.chemistry;
  }
  if (s.contains('higher_math') ||
      s.contains('highermath') ||
      s.contains('h_math') ||
      s.contains('উচ্চতর_গণিত') ||
      s.contains('উচ্চতর')) {
    return _SubjectDomain.higherMath;
  }
  if (s.contains('general_math') ||
      s.contains('সাধারণ_গণিত') ||
      s.contains('ssc_math')) {
    return _SubjectDomain.generalMath;
  }
  if (s.contains('math') || s.contains('গণিত')) {
    return _SubjectDomain.higherMath;
  }
  if (s.contains('bio') ||
      s.contains('উদ্ভিদ') ||
      s.contains('প্রাণি') ||
      s.contains('botany') ||
      s.contains('zoology') ||
      s.contains('জীববিজ্ঞান') ||
      s.contains('জীব')) {
    return _SubjectDomain.biology;
  }
  if (s.contains('bangla') || s.contains('বাংলা') || s.contains('bengali')) {
    return _SubjectDomain.bangla;
  }
  if (s.contains('english') || s.contains('ইংরেজি') || s.contains('ইংরেজী')) {
    return _SubjectDomain.english;
  }
  if (s.contains('ict') ||
      s.contains('তথ্য') ||
      s.contains('যোগাযোগ') ||
      s.contains('আইসিটি')) {
    return _SubjectDomain.ict;
  }
  if (s.contains('gk') || s.contains('সাধারণ_জ্ঞান')) {
    return _SubjectDomain.generalKnowledge;
  }
  if (s.contains('accounting') || s.contains('হিসাব')) {
    return _SubjectDomain.accounting;
  }
  if (s.contains('finance') || s.contains('ফিন্যান্স')) {
    return _SubjectDomain.finance;
  }
  if (s.contains('management') || s.contains('ব্যবস্থাপনা')) {
    return _SubjectDomain.management;
  }
  if (s.contains('general_science') || s == 'science') {
    return _SubjectDomain.generalScience;
  }
  return _SubjectDomain.unknown;
}

int? _extractPaper(String text) {
  final s = text.toLowerCase().replaceAll('-', '_');
  if (s.contains('1st') ||
      s.contains('১ম') ||
      s.contains('প্রথম') ||
      s.contains('_1') ||
      s.contains(' 1') ||
      s.endsWith('1') ||
      s.contains('botany') ||
      s.contains('উদ্ভিদ')) {
    return 1;
  }
  if (s.contains('2nd') ||
      s.contains('২য়') ||
      s.contains('২য়') ||
      s.contains('দ্বিতীয়') ||
      s.contains('দ্বিতীয়') ||
      s.contains('_2') ||
      s.contains(' 2') ||
      s.endsWith('2') ||
      s.contains('zoology') ||
      s.contains('প্রাণি')) {
    return 2;
  }
  return null;
}

bool _matchesSubject({
  String? candidateSub,
  String? candidateSubLabel,
  required String target,
}) {
  final cSub = (candidateSub ?? '').trim();
  final cLabel = (candidateSubLabel ?? '').trim();
  final t = target.trim();
  if (t.isEmpty) return false;

  // 1. Exact or lowercase match
  if (cSub.toLowerCase() == t.toLowerCase() ||
      cLabel.toLowerCase() == t.toLowerCase()) {
    return true;
  }

  // 2. BanglaNameHelper formatted match
  final tBangla = BanglaNameHelper.formatSubject(t).toLowerCase();
  if (cSub.isNotEmpty &&
      BanglaNameHelper.formatSubject(cSub).toLowerCase() == tBangla) {
    return true;
  }
  if (cLabel.isNotEmpty &&
      BanglaNameHelper.formatSubject(cLabel).toLowerCase() == tBangla) {
    return true;
  }

  // 3. Substring check
  if (cSub.isNotEmpty &&
      (cSub.toLowerCase().contains(t.toLowerCase()) ||
          t.toLowerCase().contains(cSub.toLowerCase()))) {
    return true;
  }

  // 4. Domain & Paper match
  final targetDomain = _extractDomain(t);
  if (targetDomain != _SubjectDomain.unknown) {
    final candidateDomain = _extractDomain('$cSub $cLabel');
    if (candidateDomain == targetDomain) {
      final targetPaper = _extractPaper(t);
      final candidatePaper = _extractPaper('$cSub $cLabel');
      if (targetPaper == null ||
          candidatePaper == null ||
          targetPaper == candidatePaper) {
        return true;
      }
    }
  }

  return false;
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

  @override
  void didUpdateWidget(covariant SubjectReportView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.subject != widget.subject) {
      _fetch();
    }
  }

  Future<void> _fetch() async {
    setState(() => _isLoading = true);
    try {
      final supabase = Supabase.instance.client;
      final userId = supabase.auth.currentUser?.id;

      // 1. Fetch from LocalExamCacheService for immediate zero-latency offline support
      final localResults = await LocalExamCacheService.getAllCachedExamResults();
      final List<Map<String, dynamic>> combined = [];
      final Set<String> seenIds = {};

      for (final res in localResults) {
        if (res.id.isNotEmpty) {
          seenIds.add(res.id);
        }
        combined.add({
          'id': res.id,
          'subject': res.subject,
          'subject_label': res.subjectLabel,
          'total_questions': res.totalQuestions,
          'correct_count': res.correctCount,
          'wrong_count': res.wrongCount,
          'time_taken': res.timeTaken,
          'date': res.date,
          'created_at': res.date,
          'chapters': res.questions
              .map((q) => q.chapter)
              .where((c) => c.isNotEmpty)
              .toSet()
              .join(', '),
          'questions': res.questions
              .map(
                (q) => {
                  'id': q.id,
                  'subject': q.subject,
                  'subject_label': q.subjectLabel,
                  'chapter': q.chapter,
                  'topic': q.topic,
                  'correct_answer_index': q.correctAnswerIndex,
                  'correct_answer_indices': q.correctAnswerIndices,
                },
              )
              .toList(),
          'user_answers': res.userAnswers,
          'status': res.status,
        });
      }

      // 2. Fetch from Supabase (if online & authenticated)
      if (userId != null) {
        try {
          final query = supabase
              .from('exam_results')
              .select(
                'id, total_questions, correct_count, wrong_count, time_taken, subject, subject_label, date, created_at, chapters, questions, user_answers, status',
              )
              .eq('user_id', userId)
              .neq('status', 'cancelled')
              .order('created_at', ascending: false)
              .limit(100);

          final raw = (await query) as List;
          for (final item in raw) {
            if (item is Map) {
              final row = Map<String, dynamic>.from(item);
              final id = row['id']?.toString() ?? '';
              if (id.isNotEmpty && seenIds.contains(id)) {
                continue;
              }
              if (id.isNotEmpty) seenIds.add(id);
              combined.add(row);
            }
          }
        } catch (dbErr) {
          debugPrint('[SubjectReportView] Remote fetch warning: $dbErr');
        }
      }

      if (combined.isEmpty) {
        if (mounted) {
          setState(() {
            _stats = _SRStats.empty;
            _isLoading = false;
          });
        }
        return;
      }

      final now = DateTime.now();
      final weekAgo = now.subtract(const Duration(days: 7));
      final monthAgo = now.subtract(const Duration(days: 30));

      int totalQ = 0, correct = 0, wrong = 0, totalTime = 0;
      final Map<String, ({int total, int correct})> chapMap = {};

      for (final row in combined) {
        // Date filter
        final dateStr = (row['date'] ?? row['created_at'])?.toString();
        if (dateStr != null) {
          final examDate = DateTime.tryParse(dateStr);
          if (examDate != null) {
            if (_filter == 'week' && examDate.isBefore(weekAgo)) continue;
            if (_filter == 'month' && examDate.isBefore(monthAgo)) continue;
          }
        }

        final examSub = (row['subject'] as String?) ?? '';
        final examSubLabel = (row['subject_label'] as String?) ?? '';
        final isDedicatedExam = _matchesSubject(
          candidateSub: examSub,
          candidateSubLabel: examSubLabel,
          target: widget.subject,
        );

        final questions = row['questions'];
        final userAnswers = row['user_answers'];
        final answersMap = userAnswers is Map
            ? Map<String, dynamic>.from(userAnswers)
            : <String, dynamic>{};

        if (questions is List && questions.isNotEmpty) {
          int matchedQInExam = 0;
          int examCorrectInSubject = 0;
          int examWrongInSubject = 0;

          for (final q in questions) {
            if (q is! Map) continue;
            final qSub = (q['subject'] ?? '').toString();
            final qSubLabel = (q['subject_label'] ?? '').toString();

            final bool qMatches = isDedicatedExam ||
                _matchesSubject(
                  candidateSub: qSub,
                  candidateSubLabel: qSubLabel,
                  target: widget.subject,
                );

            if (!qMatches) continue;

            matchedQInExam++;
            final qId = q['id']?.toString() ?? '';
            final userAns = answersMap[qId];
            final correctAns =
                (q['correct_answer_index'] ?? q['correctAnswerIndex'])
                    ?.toString();
            final correctIndices =
                (q['correct_answer_indices'] ?? q['correctAnswerIndices']);

            final isAnswered =
                userAns != null && userAns.toString().trim().isNotEmpty;
            bool isCorrect = false;

            if (isAnswered) {
              if (correctIndices is List && correctIndices.isNotEmpty) {
                isCorrect = correctIndices
                    .map((e) => e.toString())
                    .contains(userAns.toString());
              } else if (correctAns != null) {
                isCorrect = userAns.toString() == correctAns.toString();
              }
            }
            final isWrong = isAnswered && !isCorrect;

            if (isCorrect) {
              examCorrectInSubject++;
            } else if (isWrong) {
              examWrongInSubject++;
            }

            // Chapter aggregation
            final rawChap = q['chapter'] ?? q['topic'];
            final cName =
                (rawChap != null && rawChap.toString().trim().isNotEmpty)
                    ? rawChap.toString().trim()
                    : 'General';
            final prev = chapMap[cName];
            chapMap[cName] = (
              total: (prev?.total ?? 0) + 1,
              correct: (prev?.correct ?? 0) + (isCorrect ? 1 : 0),
            );
          }

          if (matchedQInExam > 0) {
            totalQ += matchedQInExam;
            correct += examCorrectInSubject;
            wrong += examWrongInSubject;

            final examTime = (row['time_taken'] as num?)?.toInt() ?? 0;
            final examTotalQ =
                (row['total_questions'] as num?)?.toInt() ?? questions.length;
            if (examTotalQ > 0) {
              totalTime += (examTime * (matchedQInExam / examTotalQ)).round();
            } else {
              totalTime += examTime;
            }
          }
        } else if (isDedicatedExam) {
          // Fallback when question details are not preserved
          final total = (row['total_questions'] as num?)?.toInt() ?? 0;
          final c = (row['correct_count'] as num?)?.toInt() ?? 0;
          final w = (row['wrong_count'] as num?)?.toInt() ?? 0;
          final time = (row['time_taken'] as num?)?.toInt() ?? 0;
          totalQ += total;
          correct += c;
          wrong += w;
          totalTime += time;

          final chapText = (row['chapters'] as String?) ?? 'General';
          for (final ch in chapText
              .split(',')
              .map((s) => s.trim())
              .where((s) => s.isNotEmpty)) {
            final prev = chapMap[ch];
            chapMap[ch] = (
              total: (prev?.total ?? 0) + (total > 0 ? 1 : 0),
              correct: (prev?.correct ?? 0) + (c > 0 ? 1 : 0),
            );
          }
        }
      }

      final skipped = (totalQ - correct - wrong).clamp(0, totalQ);
      final accuracy = totalQ > 0 ? (correct / totalQ * 100).round() : 0;
      final avgTime = totalQ > 0 ? (totalTime / totalQ).round() : 0;

      final chapters =
          chapMap.entries
              .where((e) {
                final k = e.key.trim().toLowerCase();
                return k.isNotEmpty &&
                    k != 'general' &&
                    k != 'সাধারণ' &&
                    k != 'সাধারণ প্রশ্ন' &&
                    k != 'null';
              })
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
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
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
                          fontSize: 13.5,
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
              ? const ExamHistorySkeleton()
              : AppRefreshIndicator(
                  onRefresh: _fetch,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.fromLTRB(10, 8, 10, 80),
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
                                color: const Color(0xFF059669),
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
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white : const Color(0xFF000000),
            ),
          ),
          Text(
            label,
            style: const TextStyle(fontSize: 11.5, color: Color(0xFFA3A3A3)),
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
        color: const Color(0xFF059669),
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
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
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
              fontSize: 15.5,
              fontWeight: FontWeight.w600,
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
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF000000),
                          ),
                        ),
                        const Text(
                          'সঠিকতা',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.normal,
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
                      const Color(0xFF059669),
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
                  fontSize: 14,
                  fontFamily: 'HindSiliguri',
                  fontWeight: FontWeight.w600,
                  color: isDark
                      ? const Color(0xFFD4D4D4)
                      : const Color(0xFF27272A),
                ),
               maxLines: 1, overflow: TextOverflow.ellipsis),
            ),
            Text(
              value.toString(),
              style: TextStyle(
                fontSize: 15,
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
    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
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
            fontSize: 15.5,
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
        ? const Color(0xFF059669)
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
                BanglaNameHelper.formatChapter(c.name),
                style: TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                  fontFamily: 'HindSiliguri',
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
                fontSize: 14,
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
                    fontSize: 15.5,
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
                          ? const Color(0xFF059669)
                          : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark
                            ? const Color(0xFF059669)
                            : const Color(0xFFECFDF5),
                      ),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          LucideIcons.checkCircle2,
                          size: 18,
                          color: Color(0xFF059669),
                        ),
                        SizedBox(width: 8),
                        Text(
                          'কোনো দুর্বলতা নেই! চমৎকার।',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF059669),
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
                                          fontSize: 12,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFFE11D48),
                                          letterSpacing: 0.5,
                                        ),
                                      ),
                                      Text(
                                        weak.first.name == 'General' ? 'সাধারণ প্রশ্ন' : weak.first.name,
                                        style: TextStyle(
                                          fontSize: 16,
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
                                      fontSize: 13,
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
                                        fontSize: 13.5,
                                        color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A),
                                        height: 1.35,
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
                                  textStyle: const TextStyle(fontSize: 14.5, fontFamily: 'HindSiliguri', fontWeight: FontWeight.bold),
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
                            fontSize: 14,
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
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF27272A),
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                    Text(
                                      '${w.wrong}টি ভুল',
                                      style: const TextStyle(
                                        fontSize: 13,
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
            style: TextStyle(fontSize: 16, color: Color(0xFFA3A3A3)),
          ),
        ],
      ),
    ),
  );
}
