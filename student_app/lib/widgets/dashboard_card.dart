import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:student_app/theme.dart';

class DashboardCard extends StatelessWidget {
  final String title;
  final String svgAsset;
  final Color color;
  final VoidCallback onTap;

  const DashboardCard({
    super.key,
    required this.title,
    required this.svgAsset,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            color: isDark 
              ? color.withOpacity(0.08) 
              : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? color.withOpacity(0.3) : color.withOpacity(0.15),
              width: 1,
            ),
            boxShadow: [
              if (!isDark)
                BoxShadow(
                  color: color.withOpacity(0.08),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: SvgPicture.asset(
                  svgAsset,
                  colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
                  width: 28,
                  height: 28,
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Text(
                title,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: isDark ? Colors.white : AppTheme.textSecondaryLight,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
