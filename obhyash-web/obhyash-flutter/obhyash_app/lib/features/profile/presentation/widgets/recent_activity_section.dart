import 'package:flutter/material.dart';

import '../../../dashboard/domain/models.dart';

class RecentActivitySection extends StatelessWidget {
  final List<ExamResult> history;

  const RecentActivitySection({super.key, required this.history});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(24), // rounded-3xl
        border: Border.all(
          color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000), // shadow-sm
            blurRadius: 2,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: isDark
                      ? const Color(0xFF262626)
                      : const Color(0xFFF5F5F5), // neutral-800 : neutral-100
                ),
              ),
            ),
            child: Text(
              'সর্বশেষ কার্যক্রম',
              style: TextStyle(
                fontSize: 24, // text-2xl
                fontWeight: FontWeight.bold,
                color: isDark
                    ? Colors.white
                    : const Color(0xFF262626), // neutral-800
                fontFamily: 'HindSiliguri',
              ),
            ),
          ),
          if (history.isEmpty)
            Padding(
              padding: const EdgeInsets.all(48), // p-12
              child: Text(
                'এখনও কোনো পরীক্ষা দেওয়া হয়নি।',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 18, // text-lg
                  fontWeight: FontWeight.w500,
                  color: isDark
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF737373), // neutral-400 : neutral-500
                  fontFamily: 'HindSiliguri',
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: history.take(5).length,
              separatorBuilder: (context, index) => Divider(
                height: 1,
                color: isDark
                    ? const Color(0xFF262626)
                    : const Color(0xFFF5F5F5),
              ),
              itemBuilder: (context, index) {
                final exam = history[index];

                // Assuming ExamResult doesn't have score/totalMarks right now, mocking based on correct counts
                final double percentage = exam.totalQuestions > 0
                    ? exam.correctCount / exam.totalQuestions
                    : 0.0;

                Color badgeColor = const Color(0xFF10B981); // emerald-500
                if (percentage < 0.8 && percentage >= 0.5) {
                  badgeColor = const Color(0xFFF59E0B); // amber-500
                } else if (percentage < 0.5) {
                  badgeColor = const Color(0xFFEF4444); // red-500
                }

                return InkWell(
                  onTap: () {},
                  child: Padding(
                    padding: const EdgeInsets.all(24), // p-6
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: badgeColor,
                                borderRadius: BorderRadius.circular(
                                  16,
                                ), // rounded-2xl
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x1a000000), // shadow-sm
                                    blurRadius: 2,
                                    offset: Offset(0, 1),
                                  ),
                                ],
                              ),
                              child: Center(
                                child: Text(
                                  '${(percentage * 100).round()}%',
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 20), // gap-5
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  exam.subjectLabel ?? exam.subject,
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: isDark
                                        ? Colors.white
                                        : const Color(0xFF171717),
                                    fontFamily: 'HindSiliguri',
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${exam.totalQuestions} প্রশ্ন', // Need to add date to ExamResult model later if we want the actual date formatting
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                    color: isDark
                                        ? const Color(0xFFA3A3A3)
                                        : const Color(0xFF737373),
                                    fontFamily: 'HindSiliguri',
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: isDark
                                ? const Color(0xFF262626)
                                : const Color(
                                    0xFFF5F5F5,
                                  ), // neutral-800 : neutral-100
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'Practice', // Mocked as ExamType isn't in model yet
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isDark
                                  ? const Color(0xFFA3A3A3)
                                  : const Color(0xFF737373),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }
}
