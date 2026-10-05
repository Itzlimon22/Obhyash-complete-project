import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/theme_provider.dart';
import 'obhyash_tooltip.dart';

/// An animated theme toggle button featuring a rotating and scaling
/// sun/moon transition, smooth container colors, and tooltip.
class ThemeToggleButton extends ConsumerWidget {
  final double size;
  final EdgeInsetsGeometry padding;
  final TooltipPosition tooltipPosition;
  final BorderRadius? borderRadius;

  const ThemeToggleButton({
    super.key,
    this.size = 16,
    this.padding = const EdgeInsets.all(6),
    this.tooltipPosition = TooltipPosition.bottom,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final r = borderRadius ?? BorderRadius.circular(6);

    return ObhyashTooltip(
      message: isDark ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো',
      preferredPosition: tooltipPosition,
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          ref.read(themeModeProvider.notifier).toggle();
        },
        borderRadius: r,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeInOut,
          padding: padding,
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF1F5F9),
            borderRadius: r,
            border: Border.all(
              color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
              width: 0.8,
            ),
          ),
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 320),
            transitionBuilder: (child, animation) {
              return RotationTransition(
                turns: Tween<double>(begin: 0.75, end: 1.0).animate(
                  CurvedAnimation(
                    parent: animation,
                    curve: Curves.easeOutBack,
                  ),
                ),
                child: ScaleTransition(
                  scale: Tween<double>(begin: 0.6, end: 1.0).animate(
                    CurvedAnimation(
                      parent: animation,
                      curve: Curves.easeOutBack,
                    ),
                  ),
                  child: FadeTransition(
                    opacity: animation,
                    child: child,
                  ),
                ),
              );
            },
            child: Icon(
              isDark ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
              key: ValueKey(isDark),
              size: size,
              color: isDark ? const Color(0xFFFCD34D) : const Color(0xFF0F172A),
            ),
          ),
        ),
      ),
    );
  }
}
