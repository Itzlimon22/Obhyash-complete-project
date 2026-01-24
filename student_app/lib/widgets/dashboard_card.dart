import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';

class DashboardCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const DashboardCard({
    super.key,
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    // 1. Determine if we are in Dark Mode (to adjust glow)
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          // 2. The Card Container
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            // Use the Surface color (Dark Grey or White)
            color: Theme.of(context).cardTheme.color,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              // Subtle colored border in dark mode, grey in light mode
              color: isDark ? color.withOpacity(0.2) : Colors.grey.shade200,
              width: 1,
            ),
            boxShadow: [
              if (!isDark) // Soft shadow for Light Mode
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // 3. The Icon Circle
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  // The background is a soft transparent version of the main color
                  color: color.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  color: color, // The icon takes the main color
                  size: 28,
                ),
              ),
              const SizedBox(height: AppSpacing.md),

              // 4. The Title
              Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
