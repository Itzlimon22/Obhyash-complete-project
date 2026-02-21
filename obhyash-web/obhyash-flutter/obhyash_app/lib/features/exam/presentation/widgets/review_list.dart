import 'package:flutter/material.dart';
import '../../../../core/presentation/widgets/latex_text.dart';
import '../../domain/exam_models.dart';
import 'question_card.dart';

class ReviewList extends StatelessWidget {
  final List<Question> questions;
  final Map<String, int> userAnswers;
  final Set<String> bookmarked;
  final ValueChanged<String> onToggleBookmark;
  final ValueChanged<String> onReport;

  const ReviewList({
    super.key,
    required this.questions,
    required this.userAnswers,
    required this.bookmarked,
    required this.onToggleBookmark,
    required this.onReport,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 16, top: 24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'উত্তরপত্র পর্যালোচনা',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF171717),
                ),
              ),
              Row(
                children: [
                  _LegendItem(
                    color: Colors.green,
                    label: 'সঠিক',
                    isDark: isDark,
                  ),
                  const SizedBox(width: 12),
                  _LegendItem(color: Colors.red, label: 'ভুল', isDark: isDark),
                ],
              ),
            ],
          ),
        ),

        // Reusing QuestionCard in review mode
        ...List.generate(questions.length, (index) {
          final q = questions[index];
          return QuestionCard(
            question: q,
            serialNumber: index + 1,
            selectedOptionIndex: userAnswers[q.id],
            isFlagged: false, // Don't show exam flags here
            isBookmarked: bookmarked.contains(q.id),
            onToggleBookmark: () => onToggleBookmark(q.id),
            onReport: () => onReport(q.id),
            onSelectOption: (_) {}, // Read only
            onToggleFlag: () {}, // Read only
            showFeedback:
                true, // This enables the green/red coloring and explanations
            readOnly: true,
          );
        }),
      ],
    );
  }
}

class _LegendItem extends StatelessWidget {
  final Color color;
  final String label;
  final bool isDark;

  const _LegendItem({
    required this.color,
    required this.label,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF737373),
          ),
        ),
      ],
    );
  }
}
