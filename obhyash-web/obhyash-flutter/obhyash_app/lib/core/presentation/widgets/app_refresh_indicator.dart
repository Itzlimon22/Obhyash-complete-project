import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Production-grade unified RefreshIndicator for the entire application.
/// Ensures consistent brand styling, smooth 60/120fps scrolling physics,
/// theme-aware background, and subtle haptic feedback on pull.
class AppRefreshIndicator extends StatelessWidget {
  final Widget child;
  final Future<void> Function() onRefresh;
  final Color? color;
  final Color? backgroundColor;
  final double displacement;
  final double edgeOffset;

  const AppRefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
    this.color,
    this.backgroundColor,
    this.displacement = 40.0,
    this.edgeOffset = 0.0,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = color ?? (isDark ? const Color(0xFF10B981) : const Color(0xFF059669));
    final bgColor = backgroundColor ?? (isDark ? const Color(0xFF1C1C1E) : Colors.white);

    return RefreshIndicator(
      color: primaryColor,
      backgroundColor: bgColor,
      strokeWidth: 2.5,
      displacement: displacement,
      edgeOffset: edgeOffset,
      onRefresh: () async {
        HapticFeedback.lightImpact();
        try {
          await onRefresh();
        } catch (e) {
          debugPrint('[AppRefreshIndicator] onRefresh error: $e');
        }
      },
      child: child,
    );
  }
}
