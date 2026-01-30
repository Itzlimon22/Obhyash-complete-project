import 'package:flutter/material.dart';
import '../../models/exam_types.dart';

class QuestionPalette extends StatelessWidget {
  final List<Question> questions;
  final Map<int, int> userAnswers;
  final Set<int> flaggedQuestions;
  final Function(int) onQuestionClick;

  const QuestionPalette({
    super.key,
    required this.questions,
    required this.userAnswers,
    required this.flaggedQuestions,
    required this.onQuestionClick,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 1. Header
        Container(
          padding: const EdgeInsets.only(bottom: 12),
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isDark ? Colors.white10 : Colors.grey.shade200,
              ),
            ),
          ),
          child: Text(
            "প্রশ্ন তালিকা", // Question List
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : const Color(0xFF1E293B),
            ),
          ),
        ),

        // 2. Grid Container (Scrollable)
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.only(right: 4), // pr-1 equivalent
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4, // grid-cols-4
              crossAxisSpacing: 10, // gap-2.5 (~10px)
              mainAxisSpacing: 10,
              childAspectRatio: 1.2, // Adjusts height vs width ratio
            ),
            itemCount: questions.length,
            itemBuilder: (context, index) {
              final q = questions[index];
              return _buildGridItem(context, q, index + 1, isDark);
            },
          ),
        ),

        // 3. Legend (Footer)
        Container(
          margin: const EdgeInsets.only(top: 24),
          padding: const EdgeInsets.only(top: 16),
          decoration: BoxDecoration(
            border: Border(
              top: BorderSide(
                color: isDark ? Colors.white10 : Colors.grey.shade200,
              ),
            ),
          ),
          child: Column(
            children: [
              _buildLegendItem(
                color: Colors.green, // emerald-500
                label: "উত্তর দেওয়া হয়েছে",
                isDark: isDark,
              ),
              const SizedBox(height: 12),
              _buildLegendItem(
                color: Colors.amber, // amber-400
                label: "রিভিউয়ের জন্য মার্ক করা",
                isDark: isDark,
              ),
              const SizedBox(height: 12),
              _buildLegendItem(
                color: isDark
                    ? const Color(0xFF1E293B)
                    : Colors.white, // slate-800 : white
                borderColor: isDark ? Colors.grey[700] : Colors.grey[300],
                label: "উত্তর দেওয়া হয়নি",
                isDark: isDark,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildGridItem(
    BuildContext context,
    Question q,
    int number,
    bool isDark,
  ) {
    final isAnswered = userAnswers.containsKey(q.id);
    final isFlagged = flaggedQuestions.contains(q.id);

    // Style Logic (Priority: Flagged > Answered > Default)
    Color bgColor;
    Color textColor;
    Border? border;
    BoxShadow? shadow;

    if (isFlagged) {
      // Flagged: Amber Style
      bgColor = Colors.amber.shade400;
      textColor = Colors.white;
      border = Border.all(color: Colors.amber.shade600, width: 1.5);
      shadow = BoxShadow(
        color: Colors.amber.withOpacity(0.2),
        blurRadius: 4,
        spreadRadius: 1,
      );
    } else if (isAnswered) {
      // Answered: Emerald/Green Style
      bgColor = Colors.green.shade500;
      textColor = Colors.white;
      border = Border.all(color: Colors.green.shade700, width: 1);
    } else {
      // Default: Slate/White Style
      bgColor = isDark ? const Color(0xFF1E293B) : Colors.white;
      textColor = isDark ? Colors.grey[300]! : Colors.grey[700]!;
      border = Border.all(
        color: isDark ? Colors.grey[700]! : Colors.grey[300]!,
      );
    }

    return InkWell(
      onTap: () => onQuestionClick(q.id),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8), // rounded-md
          border: border,
          boxShadow: shadow != null ? [shadow] : null,
        ),
        alignment: Alignment.center,
        child: Text(
          "$number",
          style: TextStyle(
            color: textColor,
            fontWeight: FontWeight.w600, // font-semibold
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildLegendItem({
    required Color color,
    required String label,
    required bool isDark,
    Color? borderColor,
  }) {
    return Row(
      children: [
        Container(
          width: 20,
          height: 20,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(
              color:
                  borderColor ??
                  color.withOpacity(0.5), // Default to self darker
            ),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: isDark ? Colors.grey[300] : Colors.grey[700],
          ),
        ),
      ],
    );
  }
}
