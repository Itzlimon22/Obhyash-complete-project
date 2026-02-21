import 'package:flutter/material.dart';

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
              child: _StatCard(
                title: 'সঠিকতা',
                value: '${percentage.round()}%',
                icon: Icons.pie_chart_outline,
                color: percentage >= 70
                    ? Colors.green
                    : percentage >= 40
                    ? Colors.orange
                    : Colors.red,
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            // Score
            Expanded(
              child: _StatCard(
                title: 'প্রাপ্ত নম্বর',
                value: finalScore.toStringAsFixed(2),
                subtitle: '/ $totalPoints',
                icon: Icons.emoji_events_outlined,
                color: Colors.redAccent,
                isDark: isDark,
              ),
            ),
            const SizedBox(width: 12),
            // Time
            Expanded(
              child: _StatCard(
                title: 'সময় লেগেছে',
                value: _formatDuration(timeTaken),
                icon: Icons.timer_outlined,
                color: Colors.teal,
                isDark: isDark,
              ),
            ),
          ],
        ),

        const SizedBox(height: 24),

        // Summary Table
        Container(
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF171717) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
            ),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF262626).withOpacity(0.5)
                      : const Color(0xFFF9FAFB),
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(16),
                  ),
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
                    Text(
                      'ফলাফল বিস্তারিত',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
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
                    const Divider(),
                    _TableRow(
                      label: 'সঠিক উত্তর',
                      value: correctCount.toString(),
                      isDark: isDark,
                      valueColor: Colors.green,
                    ),
                    _TableRow(
                      label: 'ভুল উত্তর',
                      value: wrongCount.toString(),
                      isDark: isDark,
                      valueColor: Colors.red,
                    ),
                    _TableRow(
                      label: 'নেগেটিভ মার্কিং (${negativeMarking}x)',
                      value: '-${negativeMarksDeduction.toStringAsFixed(2)}',
                      isDark: isDark,
                      valueColor: Colors.red,
                      bgColor: Colors.red.withOpacity(0.05),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF262626).withOpacity(0.5)
                      : const Color(0xFFF9FAFB),
                  borderRadius: const BorderRadius.vertical(
                    bottom: Radius.circular(16),
                  ),
                  border: Border(
                    top: BorderSide(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFE5E5E5),
                    ),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'মোট প্রাপ্ত নম্বর',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                    Text(
                      '${finalScore.toStringAsFixed(2)} / $totalPoints',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
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
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF171717),
            ),
          ),
          if (subtitle != null)
            Text(
              subtitle!,
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          const SizedBox(height: 4),
          Text(
            title,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF737373),
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
      padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF404040),
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: valueColor ?? (isDark ? Colors.white : Colors.black),
            ),
          ),
        ],
      ),
    );
  }
}
