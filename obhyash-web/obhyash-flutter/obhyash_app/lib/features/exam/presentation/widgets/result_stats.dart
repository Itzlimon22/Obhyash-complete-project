import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/presentation/widgets/obhyash_tooltip.dart';
import '../../../../core/utils/bangla_name_helper.dart';
import '../../domain/exam_models.dart';

class _SubjectBreakdown {
  final String subjectName;
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final int skippedCount;
  final double negativeMarksDeduction;
  final double finalScore;
  final double totalPoints;

  const _SubjectBreakdown({
    required this.subjectName,
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    required this.skippedCount,
    required this.negativeMarksDeduction,
    required this.finalScore,
    required this.totalPoints,
  });
}

class ResultStats extends StatelessWidget {
  final double percentage;
  final double finalScore;
  final int totalPoints;
  final int timeTaken;
  final int totalQuestions;
  final int correctCount;
  final int wrongCount;
  final int skippedCount;
  final double negativeMarking;
  final double negativeMarksDeduction;
  final List<Question>? questions;
  final Map<String, int>? userAnswers;

  const ResultStats({
    super.key,
    required this.percentage,
    required this.finalScore,
    required this.totalPoints,
    required this.timeTaken,
    required this.totalQuestions,
    required this.correctCount,
    required this.wrongCount,
    required this.skippedCount,
    required this.negativeMarking,
    required this.negativeMarksDeduction,
    this.questions,
    this.userAnswers,
  });

  String _formatDuration(int seconds) {
    final m = (seconds / 60).floor();
    final s = seconds % 60;
    return '${m}m ${s}s';
  }

  List<_SubjectBreakdown> _calculateSubjectBreakdowns() {
    if (questions == null || questions!.isEmpty) return [];

    final orderedSubjects = <String>[];
    final grouped = <String, List<Question>>{};

    for (final q in questions!) {
      final mainSub = BanglaNameHelper.getMainSubjectName(q.subject);
      if (!grouped.containsKey(mainSub)) {
        orderedSubjects.add(mainSub);
        grouped[mainSub] = [];
      }
      grouped[mainSub]!.add(q);
    }

    // Only show if there are multiple subjects in the exam
    if (orderedSubjects.length <= 1) return [];

    final list = <_SubjectBreakdown>[];
    final uAnswers = userAnswers ?? const {};

    for (final sub in orderedSubjects) {
      final qList = grouped[sub]!;
      int correct = 0;
      int wrong = 0;
      int skipped = 0;
      double points = 0;

      for (final q in qList) {
        points += (q.points > 0 ? q.points : 1);
        final ua = uAnswers[q.id];
        if (ua == null) {
          skipped++;
        } else if (ua == q.correctAnswerIndex) {
          correct++;
        } else {
          wrong++;
        }
      }

      final negDeduction = wrong * negativeMarking;
      final score = (correct * 1.0) - negDeduction;

      list.add(_SubjectBreakdown(
        subjectName: sub,
        totalQuestions: qList.length,
        correctCount: correct,
        wrongCount: wrong,
        skippedCount: skipped,
        negativeMarksDeduction: negDeduction,
        finalScore: score < 0 ? 0.0 : score,
        totalPoints: points,
      ));
    }

    return list;
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final subjectBreakdowns = _calculateSubjectBreakdowns();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 3 Cards top row
        Row(
          children: [
            // Accuracy
            Expanded(
              child: ObhyashTooltip(
                message: 'তোমার উত্তরের নির্ভুলতার হার (সঠিক উত্তর / দেওয়া মোট উত্তর)',
                preferredPosition: TooltipPosition.top,
                child: _CircularAccuracyCard(
                  title: 'সঠিকতা',
                  percentage: percentage,
                  isDark: isDark,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Score
            Expanded(
              child: ObhyashTooltip(
                message: 'নেগেটিভ মার্কিং হিসাবের পর মোট প্রাপ্ত চূড়ান্ত নম্বর',
                preferredPosition: TooltipPosition.top,
                child: _StatCard(
                  title: 'প্রাপ্ত নম্বর',
                  value: finalScore.toStringAsFixed(2),
                  subtitle: '/ $totalPoints',
                  icon: Icons.emoji_events_outlined,
                  color: const Color(0xFFEF4444),
                  isDark: isDark,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Time
            Expanded(
              child: ObhyashTooltip(
                message: 'পরীক্ষা শেষ করতে নেওয়া মোট সময়',
                preferredPosition: TooltipPosition.top,
                child: _StatCard(
                  title: 'সময় লেগেছে',
                  value: _formatDuration(timeTaken),
                  icon: Icons.timer_outlined,
                  color: const Color(0xFF14B8A6),
                  isDark: isDark,
                ),
              ),
            ),
          ],
        ),

        const SizedBox(height: 20),

        // Summary Table Card
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF18181B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              // Header
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF202024)
                      : const Color(0xFFF8FAFC),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                ),
                child: Row(
                  children: [
                    Text(
                      'সার্বিক ফলাফল বিস্তারিত',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
              ),
              Divider(
                height: 1,
                thickness: 1,
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
              ),

              // Rows Content
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Left Column
                    Expanded(
                      child: Column(
                        children: [
                          _TableRow(
                            label: 'মোট প্রশ্ন',
                            value: totalQuestions.toString(),
                            isDark: isDark,
                          ),
                          _TableRow(
                            label: 'উত্তর দেওয়া হয়েছে',
                            value: (correctCount + wrongCount).toString(),
                            isDark: isDark,
                          ),
                          _TableRow(
                            label: 'উত্তর দেওয়া হয়নি',
                            value: skippedCount.toString(),
                            isDark: isDark,
                          ),
                        ],
                      ),
                    ),
                    VerticalDivider(
                      width: 1,
                      thickness: 1,
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE2E8F0),
                    ),
                    // Right Column
                    Expanded(
                      child: Column(
                        children: [
                          _TableRow(
                            label: 'সঠিক উত্তর',
                            value: correctCount.toString(),
                            isDark: isDark,
                            valueColor: const Color(0xFF10B981),
                          ),
                          _TableRow(
                            label: 'ভুল উত্তর',
                            value: wrongCount.toString(),
                            isDark: isDark,
                            valueColor: const Color(0xFFEF4444),
                          ),
                          _TableRow(
                            label: 'নেগেটিভ (${negativeMarking}x)',
                            value:
                                '-${negativeMarksDeduction.toStringAsFixed(2)}',
                            isDark: isDark,
                            valueColor: const Color(0xFFEF4444),
                            bgColor: isDark
                                ? const Color(0x227F1D1D)
                                : const Color(0xFFFEF2F2),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              Divider(
                height: 1,
                thickness: 1,
                color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
              ),
              // Footer
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF202024)
                      : const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.vertical(
                    bottom: Radius.circular(subjectBreakdowns.isEmpty ? 16 : 0),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'মোট প্রাপ্ত নম্বর',
                      style: TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      '${finalScore.toStringAsFixed(2)} / $totalPoints',
                      style: const TextStyle(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'HindSiliguri',
                        color: Color(0xFF10B981),
                      ),
                    ),
                  ],
                ),
              ),

              // Subject-wise Breakdown Section for Presets / Multi-subject Exams
              if (subjectBreakdowns.isNotEmpty) ...[
                Divider(
                  height: 1,
                  thickness: 1,
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFF1C1C20)
                        : const Color(0xFFF1F5F9),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        LucideIcons.layers,
                        size: 14,
                        color: isDark ? const Color(0xFF34D399) : const Color(0xFF047857),
                      ),
                      const SizedBox(width: 7),
                      Text(
                        'বিষয়ভিত্তিক ফলাফল বিশ্লেষণ',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'HindSiliguri',
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                    ],
                  ),
                ),
                Divider(
                  height: 1,
                  thickness: 1,
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                ),
                // Subject-wise table header
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 0),
                  child: Row(
                    children: [
                      Expanded(
                        flex: 5,
                        child: Text(
                          'বিষয়',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          'সঠিক',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            color: const Color(0xFF10B981),
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 2,
                        child: Text(
                          'ভুল',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            color: const Color(0xFFEF4444),
                          ),
                        ),
                      ),
                      Expanded(
                        flex: 3,
                        child: Text(
                          'নম্বর',
                          textAlign: TextAlign.end,
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.w600,
                            fontFamily: 'HindSiliguri',
                            color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Divider(
                  height: 8,
                  thickness: 1,
                  indent: 16,
                  endIndent: 16,
                  color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                ),
                // Subject rows
                ...subjectBreakdowns.asMap().entries.map((entry) {
                  final i = entry.key;
                  final sub = entry.value;
                  final isLast = i == subjectBreakdowns.length - 1;
                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
                        child: Row(
                          children: [
                            // Subject name
                            Expanded(
                              flex: 5,
                              child: Row(
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF10B981),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Flexible(
                                    child: Text(
                                      sub.subjectName,
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        fontFamily: 'HindSiliguri',
                                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Correct
                            Expanded(
                              flex: 2,
                              child: Text(
                                BanglaNameHelper.toBanglaNumeral(sub.correctCount),
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'HindSiliguri',
                                  color: Color(0xFF10B981),
                                ),
                              ),
                            ),
                            // Wrong
                            Expanded(
                              flex: 2,
                              child: Text(
                                BanglaNameHelper.toBanglaNumeral(sub.wrongCount),
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13.5,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'HindSiliguri',
                                  color: sub.wrongCount > 0
                                      ? const Color(0xFFEF4444)
                                      : (isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8)),
                                ),
                              ),
                            ),
                            // Marks
                            Expanded(
                              flex: 3,
                              child: Text(
                                '${sub.finalScore.toStringAsFixed(2)} / ${sub.totalPoints.toInt()}',
                                textAlign: TextAlign.end,
                                style: TextStyle(
                                  fontSize: 12.5,
                                  fontWeight: FontWeight.w600,
                                  fontFamily: 'HindSiliguri',
                                  color: sub.finalScore > 0
                                      ? const Color(0xFF10B981)
                                      : (isDark ? Colors.white54 : const Color(0xFF94A3B8)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (!isLast)
                        Divider(
                          height: 1,
                          thickness: 1,
                          indent: 16,
                          endIndent: 16,
                          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                        ),
                    ],
                  );
                }),
                const SizedBox(height: 8),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _MiniStatBadge extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final bool isDark;

  const _MiniStatBadge({
    required this.label,
    required this.value,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: isDark ? 0.14 : 0.08),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(
          color: color.withValues(alpha: isDark ? 0.25 : 0.18),
          width: 0.8,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '$label: ',
            style: TextStyle(
              fontSize: 11,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final IconData icon;
  final Color color;
  final bool isDark;

  const _StatCard({
    required this.title,
    required this.value,
    this.subtitle,
    required this.icon,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: color.withValues(alpha: isDark ? 0.16 : 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 19),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 15.5,
              fontWeight: FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          if (subtitle != null)
            Text(
              subtitle!,
              style: TextStyle(
                fontSize: 11.5,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
              ),
            ),
          const SizedBox(height: 2),
          Text(
            title,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w500,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }
}

class _TableRow extends StatelessWidget {
  final String label;
  final String value;
  final bool isDark;
  final Color? valueColor;
  final Color? bgColor;

  const _TableRow({
    required this.label,
    required this.value,
    required this.isDark,
    this.valueColor,
    this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: bgColor ?? Colors.transparent,
      padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 12.5,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFFD4D4D8) : const Color(0xFF334155),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(width: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.w600,
              fontFamily: 'HindSiliguri',
              color: valueColor ?? (isDark ? Colors.white : const Color(0xFF0F172A)),
            ),
          ),
        ],
      ),
    );
  }
}

class _CircularAccuracyCard extends StatelessWidget {
  final String title;
  final double percentage;
  final bool isDark;

  const _CircularAccuracyCard({
    required this.title,
    required this.percentage,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final color = percentage >= 70
        ? const Color(0xFF10B981)
        : percentage >= 40
            ? const Color(0xFFF59E0B)
            : const Color(0xFFEF4444);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18181B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          SizedBox(
            width: 48,
            height: 48,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: percentage / 100,
                  strokeWidth: 5,
                  color: color,
                  backgroundColor: isDark
                      ? const Color(0xFF27272A)
                      : const Color(0xFFF1F5F9),
                  strokeCap: StrokeCap.round,
                ),
                Center(
                  child: Text(
                    '${percentage.round()}%',
                    style: TextStyle(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w500,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }
}
