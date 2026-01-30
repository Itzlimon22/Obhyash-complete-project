// File: lib/widgets/exam/question_card.dart
import 'package:flutter/material.dart';
import '../../../models/exam_types.dart';
// We will create this 'LatexText' widget in the next step.
// For now, I have added a placeholder class at the bottom of this file so it works immediately.

class QuestionCard extends StatelessWidget {
  final Question question;
  final int? selectedOptionIndex;
  final bool isFlagged;
  final Function(int) onSelectOption;
  final VoidCallback onToggleFlag;
  final VoidCallback? onReport;

  const QuestionCard({
    super.key,
    required this.question,
    required this.selectedOptionIndex,
    required this.isFlagged,
    required this.onSelectOption,
    required this.onToggleFlag,
    this.onReport,
  });

  // Bangla indices for options (k, kh, g, gh...)
  static const List<String> _banglaIndices = [
    'ক',
    'খ',
    'গ',
    'ঘ',
    'ঙ',
    'চ',
    'ছ',
    'জ',
    'ঝ',
    'ঞ',
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isAnswered = selectedOptionIndex != null;

    final cardBg = isDark ? const Color(0xFF121212) : Colors.white;
    // Header text colors
    final headerSubColor = isDark ? Colors.grey[500] : Colors.grey[600];
    final headerMainColor = isDark ? Colors.white : Colors.black87;

    return Container(
      margin: const EdgeInsets.only(bottom: 24),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        // Minimal shadow or border mainly for dark mode separation
        border: Border.all(
          color: isDark ? Colors.white.withOpacity(0.08) : Colors.grey.shade200,
        ),
        boxShadow: isDark
            ? []
            : [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- HEADER: Question ID / Marks (Left) & Actions (Right) ---
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Left: "01 Question 1 / 1.0 Marks"
                Row(
                  children: [
                    // Circle ID
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: isDark ? Colors.grey[900] : Colors.grey[100],
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        question.id.toString(), // e.g. "1" or "01"
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                          color: headerSubColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "প্রশ্ন ${question.id}",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: headerSubColor,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          "${question.points} নম্বর",
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: headerMainColor,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                // Right: Icons
                Row(
                  children: [
                    if (onReport != null)
                      IconButton(
                        onPressed: onReport,
                        icon: const Icon(Icons.warning_amber_rounded),
                        color: headerSubColor,
                        tooltip: "Report",
                        constraints: const BoxConstraints(), // Compact
                        padding: const EdgeInsets.all(8),
                      ),
                    const SizedBox(width: 8),
                    IconButton(
                      onPressed: onToggleFlag,
                      icon: Icon(
                        isFlagged ? Icons.bookmark : Icons.bookmark_border,
                      ),
                      color: isFlagged ? Colors.amber : headerSubColor,
                      tooltip: "Bookmark",
                      constraints: const BoxConstraints(),
                      padding: const EdgeInsets.all(8),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Divider (optional, or just spacing)
          const SizedBox(height: 8),

          // --- BODY: Question Text & Options ---
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Question Text
                Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: LatexText(
                    text: question.text,
                    style: TextStyle(
                      fontSize: 17, // Slightly larger for readability
                      fontWeight:
                          FontWeight.bold, // Chorcha uses bold questions
                      color: headerMainColor,
                      height: 1.5,
                    ),
                  ),
                ),

                // Options List
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: question.options.length,
                  separatorBuilder: (c, i) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final isSelected = selectedOptionIndex == index;
                    final banglaIndex = index < _banglaIndices.length
                        ? _banglaIndices[index]
                        : (index + 1).toString();

                    return _buildOptionTile(
                      index: index,
                      text: question.options[index],
                      banglaIndex: banglaIndex,
                      isSelected: isSelected,
                      isAnswered: isAnswered,
                      isDark: isDark,
                    );
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionTile({
    required int index,
    required String text,
    required String banglaIndex,
    required bool isSelected,
    required bool isAnswered,
    required bool isDark,
  }) {
    // Colors
    final baseBorderColor = isDark
        ? Colors.grey[800]!
        : Colors.grey[300]!; // Default border
    final selectedBorderColor = isDark
        ? const Color(0xFF6366F1)
        : const Color(0xFF4F46E5); // Indigo
    final selectedBgColor = isDark
        ? const Color(0xFF1E1B4B)
        : const Color(0xFFF5F3FF); // Deep Indigo / Light Indigo

    return GestureDetector(
      onTap: isAnswered ? null : () => onSelectOption(index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? selectedBgColor : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? selectedBorderColor : baseBorderColor,
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            // 1. Index Circle (Left)
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isSelected
                    ? selectedBorderColor.withOpacity(0.1)
                    : (isDark ? Colors.grey[800] : Colors.grey[200]),
                shape: BoxShape.circle,
              ),
              child: Text(
                banglaIndex,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.grey[400] : Colors.grey[600],
                ),
              ),
            ),
            const SizedBox(width: 16),

            // 2. Option Text (Center)
            Expanded(
              child: LatexText(
                text: text,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w500,
                  color: isDark ? Colors.grey[300] : Colors.grey[800],
                ),
              ),
            ),
            const SizedBox(width: 12),

            // 3. Radio Button (Right)
            // Empty circle if not selected, Filled circle if selected
            _buildRadioCircle(isSelected, isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildRadioCircle(bool isSelected, bool isDark) {
    if (isSelected) {
      return Container(
        width: 24,
        height: 24,
        decoration: const BoxDecoration(
          color: Colors.transparent, // Outline style usually has ring
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Icons.radio_button_checked,
          color: Color(0xFF4F46E5), // Indigo
          size: 24,
        ),
      );
    } else {
      return Icon(
        Icons.radio_button_unchecked,
        color: isDark ? Colors.grey[600] : Colors.grey[400],
        size: 24,
      );
    }
  }
}

// -------------------------------------------------------------
// PLACEHOLDER for LatexText (So this file runs immediately)
// We will replace this with the real implementation next.
// -------------------------------------------------------------
class LatexText extends StatelessWidget {
  final String text;
  final TextStyle? style;

  const LatexText({super.key, required this.text, this.style});

  @override
  Widget build(BuildContext context) {
    // Basic Text fallback until you implement the full flutter_tex widget
    return Text(text, style: style);
  }
}
