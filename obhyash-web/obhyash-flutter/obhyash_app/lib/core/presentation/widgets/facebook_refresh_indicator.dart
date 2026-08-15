import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

// ─── Spinning arc painter ──────────────────────────────────────────────────────

class _SpinnerPainter extends CustomPainter {
  final double progress;   // 0→1 during pull
  final double spinAngle;  // radians, animates while refreshing
  final bool isRefreshing;
  final Color color;

  const _SpinnerPainter({
    required this.progress,
    required this.spinAngle,
    required this.isRefreshing,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - 2.5;

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;

    if (isRefreshing) {
      // Spinning arc — 270° sweep rotating continuously
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        spinAngle,
        3 * math.pi / 2,
        false,
        paint,
      );
    } else {
      // Pull arc — grows from 0° to 270° as user drags
      final sweep = (3 * math.pi / 2) * progress;
      final start = -math.pi / 2 + (2 * math.pi * progress * 0.35);
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        start,
        sweep,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_SpinnerPainter old) =>
      old.progress != progress ||
      old.spinAngle != spinAngle ||
      old.isRefreshing != isRefreshing ||
      old.color != color;
}

// ─── Main Widget ───────────────────────────────────────────────────────────────

/// A Facebook-style pull-to-refresh.
/// Shows only a spinning circle — no text, no pill, just the arc spinner.
class FacebookRefreshIndicator extends StatefulWidget {
  final Widget child;
  final Future<void> Function() onRefresh;
  final double triggerDistance;
  final double maxDragDistance;

  const FacebookRefreshIndicator({
    super.key,
    required this.child,
    required this.onRefresh,
    this.triggerDistance = 72.0,
    this.maxDragDistance = 100.0,
  });

  @override
  State<FacebookRefreshIndicator> createState() =>
      _FacebookRefreshIndicatorState();
}

class _FacebookRefreshIndicatorState extends State<FacebookRefreshIndicator>
    with TickerProviderStateMixin {
  double _dragOffset = 0.0;
  bool _isRefreshing = false;
  bool _hapticFired = false;

  late final AnimationController _spinCtrl;
  late final AnimationController _returnCtrl;
  Animation<double>? _returnAnim;

  // Settle height while refreshing (circle stays visible at top)
  static const double _settledOffset = 56.0;

  @override
  void initState() {
    super.initState();
    _spinCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _returnCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 260),
    )..addListener(() {
        if (_returnAnim != null && mounted) {
          setState(() {
            _dragOffset = _returnAnim!.value;
          });
        }
      });
  }

  @override
  void dispose() {
    _spinCtrl.dispose();
    _returnCtrl.dispose();
    super.dispose();
  }

  // Logarithmic rubber-band — fast start, natural resistance
  double _dampen(double raw) {
    if (raw <= 0) return 0;
    return widget.maxDragDistance *
        (1 - math.exp(-raw / (widget.maxDragDistance * 1.4)));
  }

  bool _handleScroll(ScrollNotification n) {
    // Only handle top-level vertical scroll notifications
    if (n.metrics.axis != Axis.vertical) return false;
    if (n.depth != 0) return false;
    if (_isRefreshing) return false;

    if (n is OverscrollNotification && n.overscroll < 0) {
      if (_returnCtrl.isAnimating) _returnCtrl.stop();
      final damped = _dampen(-n.overscroll + (_dragOffset * 1.6));
      if (mounted) {
        setState(() => _dragOffset = damped);
        if (_dragOffset >= widget.triggerDistance && !_hapticFired) {
          _hapticFired = true;
          HapticFeedback.mediumImpact();
        }
      }
    }

    if (n is ScrollEndNotification) _onRelease();
    return false;
  }

  void _onRelease() {
    if (_isRefreshing) return;
    _hapticFired = false;
    if (_dragOffset >= widget.triggerDistance) {
      _triggerRefresh();
    } else {
      _animateBack();
    }
  }

  Future<void> _triggerRefresh() async {
    setState(() {
      _isRefreshing = true;
      _dragOffset = _settledOffset;
    });
    _spinCtrl.repeat();
    try {
      await widget.onRefresh();
    } finally {
      if (mounted) {
        _spinCtrl.stop();
        _spinCtrl.reset();
        setState(() => _isRefreshing = false);
        _animateBack();
      }
    }
  }

  void _animateBack() {
    final start = _dragOffset;
    if (start == 0) return;
    _returnAnim = Tween<double>(begin: start, end: 0.0).animate(
      CurvedAnimation(parent: _returnCtrl, curve: Curves.easeOutCubic),
    );
    _returnCtrl.forward(from: 0.0);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Circle colours — match Facebook exactly
    final circleBg = isDark ? const Color(0xFF1C1C1E) : Colors.white;
    final arcColor = isDark ? const Color(0xFF60A5FA) : const Color(0xFF1877F2);

    final progress = (_dragOffset / widget.triggerDistance).clamp(0.0, 1.0);
    final circleSize = 36.0;

    // Circle slides down from -circleSize to _dragOffset - (circleSize/2)
    final circleTop = _dragOffset - circleSize / 2;

    return Stack(
      clipBehavior: Clip.hardEdge,
      children: [
        // ── Scrollable content ───────────────────────────────────────────────
        NotificationListener<ScrollNotification>(
          onNotification: _handleScroll,
          child: widget.child,
        ),

        // ── Floating spinner circle ──────────────────────────────────────────
        if (_dragOffset > 2)
          Positioned(
            top: circleTop,
            left: 0,
            right: 0,
            child: Center(
              child: AnimatedBuilder(
                animation: _spinCtrl,
                builder: (context, _) {
                  return Opacity(
                    opacity: progress.clamp(0.2, 1.0),
                    child: Container(
                      width: circleSize,
                      height: circleSize,
                      decoration: BoxDecoration(
                        color: circleBg,
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.14),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(7),
                        child: CustomPaint(
                          painter: _SpinnerPainter(
                            progress: progress,
                            spinAngle: _spinCtrl.value * 2 * math.pi,
                            isRefreshing: _isRefreshing,
                            color: arcColor,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
      ],
    );
  }
}
