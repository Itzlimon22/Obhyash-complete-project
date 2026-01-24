import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';

/// A selectable card for exam options.
/// It handles 3 states:
/// 1. Neutral (White)
/// 2. Selected (Blue Border)
/// 3. Result (Green for Correct, Red for Wrong)
class OptionCard extends StatelessWidget {
  final String text;
  final bool isSelected;
  final bool isCorrect;
  final bool isWrong;
  final bool showResult; // If true, reveal colors
  final VoidCallback onTap;

  const OptionCard({
    super.key,
    required this.text,
    required this.isSelected,
    this.isCorrect = false,
    this.isWrong = false,
    required this.showResult,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // 1. Determine Colors based on State
    Color borderColor = Colors.transparent;
    Color bgColor = AppTheme.surface;
    IconData? icon;
    Color iconColor = Colors.transparent;

    if (showResult) {
      if (isCorrect) {
        borderColor = AppTheme.success;
        bgColor = AppTheme.success.withOpacity(0.1);
        icon = Icons.check_circle;
        iconColor = AppTheme.success;
      } else if (isWrong) {
        borderColor = AppTheme.error;
        bgColor = AppTheme.error.withOpacity(0.1);
        icon = Icons.cancel;
        iconColor = AppTheme.error;
      } else {
        // Not selected, not correct (neutral)
        borderColor = Colors.grey.shade200;
      }
    } else {
      // Exam in progress
      if (isSelected) {
        borderColor = AppTheme.primary;
        bgColor = AppTheme.primary.withOpacity(0.05);
        icon = Icons.radio_button_checked;
        iconColor = AppTheme.primary;
      } else {
        borderColor = Colors.grey.shade200;
        icon = Icons.radio_button_unchecked;
        iconColor = Colors.grey.shade400;
      }
    }

    // 2. The UI
    return GestureDetector(
      onTap: showResult ? null : onTap, // Disable clicking after submit
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: AppSpacing.md),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: bgColor,
          border: Border.all(color: borderColor, width: 2),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            // Text takes up most space
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  fontSize: 16,
                  color: AppTheme.textMain,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
            // The Icon (Checkmark, X, or Radio)
            if (icon != null) ...[
              const SizedBox(width: AppSpacing.sm),
              Icon(icon, color: iconColor, size: 24),
            ],
          ],
        ),
      ),
    );
  }
}
