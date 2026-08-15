import 'package:flutter/material.dart';
import '../../domain/exam_models.dart';
import 'question_card.dart';

class ReviewList extends StatefulWidget {
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
  State<ReviewList> createState() => _ReviewListState();
}

class _ReviewListState extends State<ReviewList> {
  String _reviewFilter = 'all'; // 'all', 'correct', 'wrong', 'skipped'

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Calculate counts for filters
    int correctCount = 0;
    int wrongCount = 0;
    int skippedCount = 0;

    for (var q in widget.questions) {
      final ua = widget.userAnswers[q.id];
      if (ua == null) {
        skippedCount++;
      } else if (ua == q.correctAnswerIndex) {
        correctCount++;
      } else {
        wrongCount++;
      }
    }

    final filteredQuestions = widget.questions.where((q) {
      final ua = widget.userAnswers[q.id];
      final isSkipped = ua == null;
      final isCorrect = !isSkipped && (ua == q.correctAnswerIndex);
      final isWrong = !isSkipped && !isCorrect;

      if (_reviewFilter == 'correct' && !isCorrect) return false;
      if (_reviewFilter == 'wrong' && !isWrong) return false;
      if (_reviewFilter == 'skipped' && !isSkipped) return false;
      return true;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 16, top: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'উত্তরপত্র পর্যালোচনা',
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : const Color(0xFF000000),
                ),
              ),
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _FilterButton(
                    label: 'সব (${widget.questions.length})',
                    isSelected: _reviewFilter == 'all',
                    color: isDark ? Colors.white : Colors.black87,
                    onTap: () => setState(() => _reviewFilter = 'all'),
                    isDark: isDark,
                  ),
                  _FilterButton(
                    label: 'সঠিক ($correctCount)',
                    isSelected: _reviewFilter == 'correct',
                    color: Colors.green,
                    onTap: () => setState(() => _reviewFilter = 'correct'),
                    isDark: isDark,
                  ),
                  _FilterButton(
                    label: 'ভুল ($wrongCount)',
                    isSelected: _reviewFilter == 'wrong',
                    color: Colors.red,
                    onTap: () => setState(() => _reviewFilter = 'wrong'),
                    isDark: isDark,
                  ),
                  _FilterButton(
                    label: 'স্কিপ ($skippedCount)',
                    isSelected: _reviewFilter == 'skipped',
                    color: Colors.grey,
                    onTap: () => setState(() => _reviewFilter = 'skipped'),
                    isDark: isDark,
                  ),
                ],
              ),
            ],
          ),
        ),

        // Optimized Virtualized QuestionCards in review mode (Lag-Free for 100+ questions)
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: filteredQuestions.length,
          addAutomaticKeepAlives: false,
          addRepaintBoundaries: true,
          itemBuilder: (context, index) {
            final q = filteredQuestions[index];
            final originalIndex = widget.questions.indexOf(q);
            return RepaintBoundary(
              child: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: QuestionCard(
                  key: ValueKey(q.id),
                  question: q,
                  serialNumber: originalIndex + 1,
                  selectedOptionIndex: widget.userAnswers[q.id],
                  isFlagged: false,
                  isBookmarked: widget.bookmarked.contains(q.id),
                  onToggleBookmark: () => widget.onToggleBookmark(q.id),
                  onReport: () => widget.onReport(q.id),
                  onSelectOption: (_) {},
                  onToggleFlag: () {},
                  showFeedback: true,
                  readOnly: true,
                  initiallyExpanded: false,
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

class _FilterButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final Color color;
  final VoidCallback onTap;
  final bool isDark;

  const _FilterButton({
    required this.label,
    required this.isSelected,
    required this.color,
    required this.onTap,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? color.withValues(alpha: 0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected
                ? color
                : (isDark ? Colors.grey[800]! : Colors.grey[300]!),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (label != 'সব' && !label.startsWith('সব')) ...[
              Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
              ),
              const SizedBox(width: 6),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: isSelected
                    ? color
                    : (isDark ? Colors.grey[400] : Colors.grey[600]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
