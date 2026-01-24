import 'package:flutter/material.dart';
import 'package:student_app/theme.dart'; // Import your theme file

/// A reusable card component to display Exam details.
/// Usage: ExamCard(title: "Physics", subject: "Science", duration: 30, onTap: () {})
class ExamCard extends StatelessWidget {
  final String title;
  final String subject;
  final int durationMinutes;
  final VoidCallback onTap;

  const ExamCard({
    super.key,
    required this.title,
    required this.subject,
    required this.durationMinutes,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // Container provides the white background and rounded corners from AppTheme
    return Container(
      margin: const EdgeInsets.only(bottom: 16), // Space between cards
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05), // Very subtle shadow
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap, // Handle the click
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                // 1. Icon Container (Visual Flair)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1), // Light blue bg
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.school_rounded, // or Icons.quiz
                    color: AppTheme.primary,
                    size: 24,
                  ),
                ),

                const SizedBox(width: 16), // Spacing
                // 2. Text Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textMain,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "$subject • $durationMinutes mins",
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppTheme.textLight,
                        ),
                      ),
                    ],
                  ),
                ),

                // 3. Arrow Icon
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: AppTheme.textLight,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
