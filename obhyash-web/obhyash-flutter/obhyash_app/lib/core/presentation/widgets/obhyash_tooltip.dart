import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';

/// ─────────────────────────────────────────────────────────────────────────────
/// OBHYASH PREMIUM ANIMATED TOOLTIP
/// ─────────────────────────────────────────────────────────────────────────────
class ObhyashTooltip extends StatefulWidget {
  final Widget child;
  final String message;
  final Widget? customContent;
  final TooltipPosition preferredPosition;
  final Duration autoDismissDuration;
  final bool enableTap;
  final bool enableLongPress;
  final double maxWidth;

  const ObhyashTooltip({
    super.key,
    required this.child,
    required this.message,
    this.customContent,
    this.preferredPosition = TooltipPosition.top,
    this.autoDismissDuration = const Duration(milliseconds: 3200),
    this.enableTap = true,
    this.enableLongPress = false,
    this.maxWidth = 260,
  });

  @override
  State<ObhyashTooltip> createState() => _ObhyashTooltipState();
}

enum TooltipPosition { top, bottom }

class _ObhyashTooltipState extends State<ObhyashTooltip>
    with SingleTickerProviderStateMixin {
  OverlayEntry? _overlayEntry;
  late AnimationController _animCtrl;
  late Animation<double> _scaleAnim;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
      reverseDuration: const Duration(milliseconds: 150),
    );

    _scaleAnim = CurvedAnimation(
      parent: _animCtrl,
      curve: Curves.easeOutBack,
      reverseCurve: Curves.easeInCubic,
    );

    _fadeAnim = CurvedAnimation(
      parent: _animCtrl,
      curve: Curves.easeOut,
      reverseCurve: Curves.easeIn,
    );
  }

  @override
  void dispose() {
    _hideTooltip(immediate: true);
    _animCtrl.dispose();
    super.dispose();
  }

  void _showTooltip() {
    if (_overlayEntry != null) {
      _hideTooltip(immediate: true);
      return;
    }

    HapticFeedback.selectionClick();

    final renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null || !renderBox.hasSize) return;

    final targetOffset = renderBox.localToGlobal(Offset.zero);
    final targetSize = renderBox.size;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final screenSize = MediaQuery.of(context).size;

    // Smart placement calculation: keep tight (4px) to target
    final double spaceAbove = targetOffset.dy;
    final double spaceBelow = screenSize.height - (targetOffset.dy + targetSize.height);

    final bool showOnTop = widget.preferredPosition == TooltipPosition.top
        ? (spaceAbove >= 80 || spaceAbove > spaceBelow)
        : (spaceBelow < 80 && spaceAbove > spaceBelow);

    final double targetCenter = targetOffset.dx + (targetSize.width / 2);
    final double leftPos = (targetCenter - (widget.maxWidth / 2))
        .clamp(12.0, (screenSize.width - widget.maxWidth - 12.0).clamp(12.0, double.infinity));

    _overlayEntry = OverlayEntry(
      builder: (overlayContext) {
        return Stack(
          children: [
            // Tap outside to dismiss
            Positioned.fill(
              child: GestureDetector(
                behavior: HitTestBehavior.translucent,
                onTap: _hideTooltip,
                child: const ColoredBox(color: Colors.transparent),
              ),
            ),

            // Animated Tooltip Box (tightly positioned 4px from icon)
            Positioned(
              top: showOnTop ? null : targetOffset.dy + targetSize.height + 4,
              bottom: showOnTop
                  ? screenSize.height - targetOffset.dy + 4
                  : null,
              left: leftPos,
              child: Material(
                color: Colors.transparent,
                child: ScaleTransition(
                  scale: _scaleAnim,
                  alignment: showOnTop ? Alignment.bottomCenter : Alignment.topCenter,
                  child: FadeTransition(
                    opacity: _fadeAnim,
                    child: _TooltipBubble(
                      message: widget.message,
                      customContent: widget.customContent,
                      isDark: isDark,
                      maxWidth: widget.maxWidth,
                      showOnTop: showOnTop,
                      targetCenterDx: targetCenter,
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );

    Overlay.of(context).insert(_overlayEntry!);
    _animCtrl.forward();

    // Auto-dismiss timer
    Future.delayed(widget.autoDismissDuration, () {
      if (mounted && _overlayEntry != null) {
        _hideTooltip();
      }
    });
  }

  void _hideTooltip({bool immediate = false}) {
    if (_overlayEntry == null) return;

    if (immediate) {
      _overlayEntry?.remove();
      _overlayEntry = null;
      return;
    }

    _animCtrl.reverse().then((_) {
      if (mounted) {
        _overlayEntry?.remove();
        _overlayEntry = null;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: widget.enableTap ? _showTooltip : null,
      onLongPress: widget.enableLongPress ? _showTooltip : null,
      child: MouseRegion(
        onEnter: (_) => _showTooltip(),
        onExit: (_) => _hideTooltip(),
        child: widget.child,
      ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────────
/// TOOLTIP BUBBLE & ARROW
/// ─────────────────────────────────────────────────────────────────────────────
class _TooltipBubble extends StatelessWidget {
  final String message;
  final Widget? customContent;
  final bool isDark;
  final double maxWidth;
  final bool showOnTop;
  final double targetCenterDx;

  const _TooltipBubble({
    required this.message,
    this.customContent,
    required this.isDark,
    required this.maxWidth,
    required this.showOnTop,
    required this.targetCenterDx,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = isDark ? const Color(0xFF141416) : Colors.white;
    final borderColor = isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0);
    final textColor = isDark ? const Color(0xFFF4F4F5) : const Color(0xFF0F172A);

    return Container(
      constraints: BoxConstraints(maxWidth: maxWidth),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor, width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.45 : 0.12),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: customContent ??
          Text(
            message,
            textAlign: TextAlign.start,
            style: TextStyle(
              fontSize: 12.5,
              height: 1.45,
              fontFamily: 'HindSiliguri',
              fontWeight: FontWeight.w600,
              color: textColor,
            ),
          ),
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────────
/// HELPER ICON: ObhyashTooltipIcon
/// ─────────────────────────────────────────────────────────────────────────────
class ObhyashTooltipIcon extends StatelessWidget {
  final String message;
  final Widget? customContent;
  final IconData icon;
  final double size;
  final Color? color;
  final TooltipPosition preferredPosition;

  const ObhyashTooltipIcon({
    super.key,
    required this.message,
    this.customContent,
    this.icon = LucideIcons.helpCircle,
    this.size = 15,
    this.color,
    this.preferredPosition = TooltipPosition.top,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final defaultColor = isDark ? const Color(0xFFA1A1AA) : const Color(0xFF94A3B8);

    return ObhyashTooltip(
      message: message,
      customContent: customContent,
      preferredPosition: preferredPosition,
      child: Padding(
        padding: const EdgeInsets.all(4),
        child: Icon(
          icon,
          size: size,
          color: color ?? defaultColor,
        ),
      ),
    );
  }
}
