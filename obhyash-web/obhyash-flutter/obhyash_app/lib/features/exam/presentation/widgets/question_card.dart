import 'package:flutter/material.dart';
import '../../../../core/presentation/widgets/latex_text.dart';
import '../../domain/exam_models.dart';

class QuestionCard extends StatelessWidget {
  final Question question;
  final int serialNumber;
  final int? selectedOptionIndex;
  final bool isFlagged;
  final ValueChanged<int> onSelectOption;
  final VoidCallback onToggleFlag;
  final VoidCallback onReport;
  final bool isOmrMode;
  final bool showFeedback;
  final bool readOnly;
  final bool showAnswer;
  final bool isBookmarked;
  final VoidCallback? onToggleBookmark;

  const QuestionCard({
    super.key,
    required this.question,
    required this.serialNumber,
    this.selectedOptionIndex,
    required this.isFlagged,
    required this.onSelectOption,
    required this.onToggleFlag,
    required this.onReport,
    this.isOmrMode = false,
    this.showFeedback = false,
    this.readOnly = false,
    this.showAnswer = false,
    this.isBookmarked = false,
    this.onToggleBookmark,
  });

  String _toBengaliNumeral(int number) {
    const englishToBengali = {
      '0': '০',
      '1': '১',
      '2': '২',
      '3': '৩',
      '4': '৪',
      '5': '৫',
      '6': '৬',
      '7': '৭',
      '8': '৮',
      '9': '৯',
    };
    return number
        .toString()
        .split('')
        .map((c) => englishToBengali[c] ?? c)
        .join();
  }

  static const _banglaIndices = [
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

    Color borderColor = isDark
        ? const Color(0xFF262626)
        : const Color(0xFFE5E5E5);
    if (isFlagged) {
      borderColor = const Color(0xFFFBBF24).withOpacity(0.5); // amber-400
    } else if (isAnswered) {
      borderColor = const Color(0xFF10B981).withOpacity(0.3); // emerald-500
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF171717) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: borderColor,
          width: isFlagged || isAnswered ? 2 : 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 4,
            offset: Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header / Meta
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'প্রশ্ন ${_toBengaliNumeral(serialNumber)}',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? const Color(0xFF737373)
                            : const Color(0xFFA3A3A3),
                        letterSpacing: 1.0,
                      ),
                    ),
                    if (isFlagged)
                      Container(
                        margin: const EdgeInsets.only(left: 8),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0x4D78350F)
                              : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          'Marked',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? const Color(0xFFFBBF24)
                                : const Color(0xFFD97706),
                          ),
                        ),
                      ),
                  ],
                ),
                Row(
                  children: [
                    Text(
                      '${question.points} Marks',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isDark
                            ? const Color(0xFF737373)
                            : const Color(0xFFA3A3A3),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Report Button
                    IconButton(
                      onPressed: onReport,
                      iconSize: 20,
                      color: isDark
                          ? const Color(0x80EF4444)
                          : const Color(0xFFF87171),
                      icon: const Icon(Icons.flag_outlined),
                      tooltip: 'Report Issue',
                      constraints: const BoxConstraints(),
                      padding: const EdgeInsets.all(8),
                    ),
                    // Bookmark Button
                    IconButton(
                      onPressed: onToggleBookmark,
                      iconSize: 20,
                      color: isBookmarked
                          ? const Color(0xFF10B981)
                          : (isDark
                                ? const Color(0xFF525252)
                                : const Color(0xFFD4D4D4)),
                      icon: Icon(
                        isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                      ),
                      tooltip: isBookmarked ? 'বুকমার্ক সরাও' : 'বুকমার্ক করো',
                      constraints: const BoxConstraints(),
                      padding: const EdgeInsets.all(8),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Question Text
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: LatexText(
              text: question.question,
              style: TextStyle(
                fontSize: 18,
                color: isDark
                    ? const Color(0xFFF5F5F5)
                    : const Color(0xFF171717),
                fontFamily: 'HindSiliguri',
                height: 1.6,
              ),
            ),
          ),

          // Options Grid
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: Wrap(
              runSpacing: 12,
              children: List.generate(question.options.length, (idx) {
                final option = question.options[idx];
                final isSelected = selectedOptionIndex == idx;
                final isCorrect = idx == question.correctAnswerIndex;
                final banglaIndex = _banglaIndices.length > idx
                    ? _banglaIndices[idx]
                    : (idx + 1).toString();

                Color bgClass = isDark
                    ? const Color(0x66262626)
                    : const Color(0xFFFAFAFA);
                Color borderClass = Colors.transparent;
                Color iconBorder = isDark
                    ? const Color(0xFF525252)
                    : const Color(0xFFD4D4D4);
                Color iconTextCol = isDark
                    ? const Color(0xFFA3A3A3)
                    : const Color(0xFF737373);
                String iconText = banglaIndex;

                if (showFeedback) {
                  if (isCorrect) {
                    bgClass = isDark
                        ? const Color(0x33064E3B)
                        : const Color(0xFFECFDF5);
                    borderClass = const Color(0xFF10B981);
                    iconBorder = const Color(0xFF059669);
                    iconTextCol = Colors.white;
                    iconText = '✓';
                  } else if (isSelected) {
                    bgClass = isDark
                        ? const Color(0x337F1D1D)
                        : const Color(0xFFFEF2F2);
                    borderClass = const Color(0xFFEF4444);
                    iconBorder = const Color(0xFFDC2626);
                    iconTextCol = Colors.white;
                    iconText = '✕';
                  } else {
                    bgClass =
                        (isDark
                                ? const Color(0x66262626)
                                : const Color(0xFFFAFAFA))
                            .withOpacity(0.7);
                  }
                } else if (showAnswer && isCorrect) {
                  bgClass = isDark
                      ? const Color(0x1A064E3B)
                      : const Color(0xFFECFDF5);
                  borderClass = const Color(0x8010B981);
                  iconBorder = const Color(0xFF10B981);
                  iconTextCol = const Color(0xFF059669);
                  iconText = '✓';
                } else if (isSelected) {
                  bgClass = isDark
                      ? const Color(0x33064E3B)
                      : const Color(0xFFECFDF5);
                  borderClass = const Color(0xFF10B981);
                  iconBorder = const Color(0xFF059669);
                  iconTextCol = Colors.white;
                  iconText = '✓';
                }

                return GestureDetector(
                  onTap: () {
                    if (!isAnswered && !isOmrMode && !readOnly) {
                      onSelectOption(idx);
                    }
                  },
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                    decoration: BoxDecoration(
                      color: bgClass,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: borderClass),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 24,
                          height: 24,
                          margin: const EdgeInsets.only(top: 2, right: 12),
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: iconBorder, width: 2),
                            color: iconTextCol == Colors.white
                                ? iconBorder
                                : Colors.transparent,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            iconText,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: iconTextCol == Colors.white
                                  ? Colors.white
                                  : iconTextCol,
                            ),
                          ),
                        ),
                        Expanded(
                          child: LatexText(
                            text: option,
                            style: TextStyle(
                              fontSize: 16,
                              fontFamily: 'HindSiliguri',
                              color: isSelected || (showFeedback && isCorrect)
                                  ? (isDark
                                        ? const Color(0xFFF5F5F5)
                                        : const Color(0xFF171717))
                                  : (isDark
                                        ? const Color(0xFFD4D4D4)
                                        : const Color(0xFF404040)),
                              height: 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }),
            ),
          ),

          // Explanation Section
          if (showFeedback &&
              question.explanation != null &&
              question.explanation!.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(
                    color: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFF5F5F5),
                  ),
                ),
              ),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0x1A064E3B)
                      : const Color(0xFFECFDF5),
                  border: Border.all(
                    color: isDark
                        ? const Color(0x4D065F46)
                        : const Color(0xFFD1FAE5),
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.lightbulb,
                          size: 16,
                          color: isDark
                              ? const Color(0xFF34D399)
                              : const Color(0xFF059669),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'ব্যাখ্যা (EXPLANATION)',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? const Color(0xFF34D399)
                                : const Color(0xFF059669),
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    LatexText(
                      text: question.explanation!,
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'HindSiliguri',
                        color: isDark
                            ? const Color(0xFFD4D4D4)
                            : const Color(0xFF404040),
                        height: 1.6,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
