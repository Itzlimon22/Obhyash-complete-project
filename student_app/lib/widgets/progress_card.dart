import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';

class ProgressCard extends StatefulWidget {
  final String subject;
  final double progress;
  final String correct;
  final String wrong;
  final String skipped;

  const ProgressCard({
    super.key,
    required this.subject,
    this.progress = 0,
    this.correct = "0",
    this.wrong = "0",
    this.skipped = "0",
  });

  @override
  State<ProgressCard> createState() => _ProgressCardState();
}

class _ProgressCardState extends State<ProgressCard> {
  // ✅ State to track if card is open
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cardColor = Theme.of(context).cardTheme.color;
    final textColor = isDark ? Colors.white : AppTheme.textMain;

    return GestureDetector(
      // ✅ Toggle expand on tap
      onTap: () {
        setState(() {
          _isExpanded = !_isExpanded;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200), // Smooth animation
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: cardColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            // Highlight border when expanded
            color: _isExpanded 
                ? AppTheme.primary.withOpacity(0.5) 
                : Colors.white.withOpacity(0.05),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // 1. Header Row (Always Visible)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    widget.subject,
                    style: TextStyle(
                      color: textColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Row(
                  children: [
                    Text(
                      "${(widget.progress * 100).toInt()}%",
                      style: TextStyle(color: AppTheme.textLight, fontSize: 12),
                    ),
                    const SizedBox(width: 4),
                    // ✅ Rotate arrow based on state
                    AnimatedRotation(
                      turns: _isExpanded ? 0.5 : 0, // 180 degree flip
                      duration: const Duration(milliseconds: 200),
                      child: Icon(Icons.keyboard_arrow_down, color: AppTheme.textLight, size: 16),
                    ),
                  ],
                )
              ],
            ),

            // ✅ Only show details if expanded
            if (_isExpanded) ...[
              const SizedBox(height: 12),
              Divider(height: 1, color: Colors.white.withOpacity(0.1)),
              const SizedBox(height: 12),

              // 2. Stats Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildStat(context, AppTheme.success, "সঠিক", widget.correct),
                  _buildStat(context, AppTheme.error, "ভুল", widget.wrong),
                  _buildStat(context, AppTheme.secondary, "স্কিপড", widget.skipped),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStat(BuildContext context, Color color, String label, String value) {
    return Row(
      children: [
        Container(
          width: 8, height: 8,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(
          "$value $label",
          style: const TextStyle(
            color: AppTheme.textLight, 
            fontSize: 11, 
            fontWeight: FontWeight.w500
          ),
        ),
      ],
    );
  }
}