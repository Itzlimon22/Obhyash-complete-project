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
        ? (spaceAbove >= 90 || spaceAbove > spaceBelow)
        : (spaceBelow < 90 && spaceAbove > spaceBelow);

    final double targetCenter = targetOffset.dx + (targetSize.width / 2);
    final bool isLeft = targetCenter < screenSize.width / 2;
    final Alignment animOrigin = showOnTop
        ? (isLeft ? Alignment.bottomLeft : Alignment.bottomRight)
        : (isLeft ? Alignment.topLeft : Alignment.topRight);

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

            // Snug & Tight Tooltip Box right next to the icon button
            CustomSingleChildLayout(
              delegate: _TooltipPositionDelegate(
                targetOffset: targetOffset,
                targetSize: targetSize,
                showOnTop: showOnTop,
                maxWidth: widget.maxWidth,
              ),
              child: Material(
                color: Colors.transparent,
                child: ScaleTransition(
                  scale: _scaleAnim,
                  alignment: animOrigin,
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
/// ACCURATE SINGLE-CHILD LAYOUT DELEGATE (HUGS THE ICON BUTTON)
/// ─────────────────────────────────────────────────────────────────────────────
class _TooltipPositionDelegate extends SingleChildLayoutDelegate {
  final Offset targetOffset;
  final Size targetSize;
  final bool showOnTop;
  final double maxWidth;

  _TooltipPositionDelegate({
    required this.targetOffset,
    required this.targetSize,
    required this.showOnTop,
    required this.maxWidth,
  });

  @override
  BoxConstraints getConstraintsForChild(BoxConstraints constraints) {
    return BoxConstraints(
      maxWidth: maxWidth.clamp(0.0, constraints.maxWidth - 24.0),
      maxHeight: constraints.maxHeight,
    );
  }

  @override
  Offset getPositionForChild(Size size, Size childSize) {
    final double targetCenter = targetOffset.dx + (targetSize.width / 2);
    final double screenMid = size.width / 2;

    double x;
    if (targetCenter < screenMid) {
      // Left side: start the bubble right at the icon button (16px to left of icon center)
      x = targetCenter - 16.0;
    } else {
      // Right side: end the bubble right at the icon button (16px to right of icon center)
      x = targetCenter - childSize.width + 16.0;
    }

    // Keep 12px margin from screen edges
    x = x.clamp(12.0, (size.width - childSize.width - 12.0).clamp(12.0, double.infinity));

    // Tight 2px vertical gap right next to the button
    double y;
    if (showOnTop) {
      y = targetOffset.dy - childSize.height - 2.0;
    } else {
      y = targetOffset.dy + targetSize.height + 2.0;
    }

    return Offset(x, y);
  }

  @override
  bool shouldRelayout(_TooltipPositionDelegate oldDelegate) {
    return targetOffset != oldDelegate.targetOffset ||
        targetSize != oldDelegate.targetSize ||
        showOnTop != oldDelegate.showOnTop ||
        maxWidth != oldDelegate.maxWidth;
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
    final bgColor = isDark ? const Color(0xFF1E1E22) : Colors.white;
    final borderColor = isDark ? const Color(0xFF333338) : const Color(0xFFCBD5E1);
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
            color: Colors.black.withValues(alpha: isDark ? 0.5 : 0.12),
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
