import 'package:flutter/material.dart';
import '../../../../core/presentation/widgets/obhyash_tooltip.dart';

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
  });

  String _formatDuration(int seconds) {
    final m = (seconds / 60).floor();
    final s = seconds % 60;
    return '${m}m ${s}s';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // 3 Cards top row
        Row(
          children: [
            // Accuracy
            Expanded(
              child: ObhyashTooltip(
                message: 'আপনার উত্তরের নির্ভুলতার হার (সঠিক উত্তর / দেওয়া মোট উত্তর)',
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
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF202024)
                      : const Color(0xFFF8FAFC),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
                  border: Border(
                    bottom: BorderSide(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Text(
                      'ফলাফল বিস্তারিত',
                      style: TextStyle(
                        fontSize: 16.5,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
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

              // Footer
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF202024)
                      : const Color(0xFFF8FAFC),
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(16),
                  ),
                  border: Border(
                    top: BorderSide(
                      color: isDark
                          ? const Color(0xFF27272A)
                          : const Color(0xFFE2E8F0),
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'মোট প্রাপ্ত নম্বর',
                      style: TextStyle(
                        fontSize: 15.5,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'HindSiliguri',
                        color: isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    Text(
                      '${finalScore.toStringAsFixed(2)} / $totalPoints',
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w900,
                        fontFamily: 'HindSiliguri',
                        color: Color(0xFF10B981),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
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
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: isDark ? 0.16 : 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 10),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              fontFamily: 'HindSiliguri',
              color: isDark ? Colors.white : const Color(0xFF0F172A),
            ),
          ),
          if (subtitle != null)
            Text(
              subtitle!,
              style: TextStyle(
                fontSize: 12,
                fontFamily: 'HindSiliguri',
                color: isDark ? const Color(0xFF71717A) : const Color(0xFF94A3B8),
              ),
            ),
          const SizedBox(height: 2),
          Text(
            title,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.bold,
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
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                fontSize: 13,
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
              fontSize: 13.5,
              fontWeight: FontWeight.bold,
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
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
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
            width: 52,
            height: 52,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: percentage / 100,
                  strokeWidth: 5.5,
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
                      fontSize: 14.5,
                      fontWeight: FontWeight.w900,
                      fontFamily: 'HindSiliguri',
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Text(
            title,
            style: TextStyle(
              fontSize: 12.5,
              fontWeight: FontWeight.bold,
              fontFamily: 'HindSiliguri',
              color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B),
            ),
          ),
        ],
      ),
    );
  }
}
