import 'package:flutter/material.dart';
import '../../domain/exam_models.dart';

class ExamGridSheet extends StatelessWidget {
  final List<Question> questions;
  final Map<String, int> userAnswers;
  final Set<String> flaggedQuestions;
  final ValueChanged<int> onJumpToQuestion;

  const ExamGridSheet({
    super.key,
    required this.questions,
    required this.userAnswers,
    required this.flaggedQuestions,
    required this.onJumpToQuestion,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final answeredCount = userAnswers.length;
    final totalCount = questions.length;
    final reviewCount = flaggedQuestions.length;
    final notAnsweredCount = totalCount - answeredCount;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: const [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Handle bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF525252)
                      : const Color(0xFFD4D4D4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header stats
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: _StatChip(
                      label: 'Answered',
                      count: answeredCount,
                      color: const Color(0xFF10B981),
                      isDark: isDark,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _StatChip(
                      label: 'Unanswered',
                      count: notAnsweredCount,
                      color: const Color(0xFF94A3B8), // slate-400
                      isDark: isDark,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _StatChip(
                      label: 'Review',
                      count: reviewCount,
                      color: const Color(0xFFF59E0B), // amber-500
                      isDark: isDark,
                    ),
                  ),
                ],
              ),
            ),

            const Divider(),

            // Grid scrollable
            Flexible(
              child: GridView.builder(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
                shrinkWrap: true,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 5,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                ),
                itemCount: questions.length,
                itemBuilder: (context, index) {
                  final qId = questions[index].id;
                  final isAnswered = userAnswers.containsKey(qId);
                  final isFlagged = flaggedQuestions.contains(qId);

                  Color getBgColor() {
                    if (isAnswered) return const Color(0xFF10B981);
                    if (isFlagged) return const Color(0xFFF59E0B);
                    return isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFF1F5F9); // neutral-800 : slate-100
                  }

                  Color getTextColor() {
                    if (isAnswered || isFlagged) return Colors.white;
                    return isDark
                        ? const Color(0xFFD4D4D4)
                        : const Color(0xFF475569);
                  }

                  return InkWell(
                    onTap: () => onJumpToQuestion(index),
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      decoration: BoxDecoration(
                        color: getBgColor(),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: isFlagged && isAnswered
                              ? const Color(0xFFF59E0B)
                              : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${index + 1}',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: getTextColor(),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final bool isDark;

  const _StatChip({
    required this.label,
    required this.count,
    required this.color,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Text(
            count.toString(),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: isDark ? const Color(0xFFA3A3A3) : const Color(0xFF64748B),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
