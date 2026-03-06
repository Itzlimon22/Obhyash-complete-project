import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../dashboard/domain/models.dart';

class RecentActivitySection extends StatelessWidget {
  final List<ExamResult> history;

  const RecentActivitySection({super.key, required this.history});

  String _formatDate(DateTime? dt) {
    if (dt == null) return '';
    return DateFormat('d MMM, yyyy', 'bn').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final recent = history.take(5).toList();

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000),
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header row
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 16, 16),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0x33E11D48)
                        : const Color(0xFFFFF1F2),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text('⚡', style: TextStyle(fontSize: 16)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'সর্বশেষ কার্যক্রম',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : const Color(0xFF262626),
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                ),
                if (history.length > 5)
                  TextButton(
                    onPressed: () {},
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      backgroundColor: isDark
                          ? const Color(0x33E11D48)
                          : const Color(0xFFFFF1F2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Text(
                      'সব দেখুন',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? const Color(0xFFFB7185)
                            : const Color(0xFFE11D48),
                        fontFamily: 'HindSiliguri',
                      ),
                    ),
                  ),
              ],
            ),
          ),

          if (recent.isEmpty)
            Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF262626)
                          : const Color(0xFFF5F5F5),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.add,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'এখনও কোনো পরীক্ষা দেওয়া হয়নি।',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w500,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF737373),
                      fontFamily: 'HindSiliguri',
                    ),
                  ),
                ],
              ),
            )
          else
            Container(
              margin: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0x40262626)
                    : const Color(0xFFFAFAFA),
                borderRadius: BorderRadius.circular(16),
              ),
              child: ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: recent.length,
                separatorBuilder: (context, index) => Divider(
                  height: 1,
                  indent: 12,
                  endIndent: 12,
                  color: isDark
                      ? const Color(0xFF262626)
                      : const Color(0xFFE5E5E5),
                ),
                itemBuilder: (context, index) {
                  final exam = recent[index];
                  final double pct = exam.totalQuestions > 0
                      ? exam.correctCount / exam.totalQuestions
                      : 0.0;
                  final Color progressColor = pct >= 0.8
                      ? const Color(0xFF10B981)
                      : pct >= 0.5
                      ? const Color(0xFFF59E0B)
                      : const Color(0xFFEF4444);

                  return Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 12,
                    ),
                    child: Row(
                      children: [
                        // Circular progress
                        SizedBox(
                          width: 52,
                          height: 52,
                          child: Stack(
                            fit: StackFit.expand,
                            children: [
                              CircularProgressIndicator(
                                value: pct,
                                strokeWidth: 3.5,
                                backgroundColor: isDark
                                    ? const Color(0xFF404040)
                                    : const Color(0xFFE5E5E5),
                                valueColor: AlwaysStoppedAnimation(
                                  progressColor,
                                ),
                                strokeCap: StrokeCap.round,
                              ),
                              Center(
                                child: Text(
                                  '${(pct * 100).round()}%',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w900,
                                    color: progressColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                exam.subjectLabel ?? exam.subject,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: isDark
                                      ? Colors.white
                                      : const Color(0xFF171717),
                                  fontFamily: 'HindSiliguri',
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 3),
                              Wrap(
                                spacing: 8,
                                children: [
                                  if (exam.createdAt != null)
                                    Text(
                                      _formatDate(exam.createdAt),
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isDark
                                            ? const Color(0xFFA3A3A3)
                                            : const Color(0xFF737373),
                                      ),
                                    ),
                                  Text(
                                    '${exam.totalQuestions} প্রশ্ন',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: isDark
                                          ? const Color(0xFFA3A3A3)
                                          : const Color(0xFF737373),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF262626)
                                : const Color(0xFFF5F5F5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Practice',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF737373),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}
