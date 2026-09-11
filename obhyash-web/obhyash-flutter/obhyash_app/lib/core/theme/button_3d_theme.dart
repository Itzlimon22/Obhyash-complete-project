import 'package:flutter/material.dart';

/// Custom 3D ShapeBorder for ElevatedButton across Flutter.
/// Renders a crisp 3D extrusion bevel at the bottom (Duolingo style)
/// with matching rounded corners and dynamic press depth.
class Button3DShapeBorder extends OutlinedBorder {
  final double borderRadius;
  final Color? shadowColor;
  final double depth;

  const Button3DShapeBorder({
    this.borderRadius = 14.0,
    this.shadowColor,
    this.depth = 4.5,
    super.side = BorderSide.none,
  });

  @override
  OutlinedBorder copyWith({BorderSide? side, double? borderRadius, Color? shadowColor, double? depth}) {
    return Button3DShapeBorder(
      side: side ?? this.side,
      borderRadius: borderRadius ?? this.borderRadius,
      shadowColor: shadowColor ?? this.shadowColor,
      depth: depth ?? this.depth,
    );
  }

  @override
  EdgeInsetsGeometry get dimensions => EdgeInsets.only(bottom: depth);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTRB(rect.left, rect.top, rect.right, rect.bottom - depth),
          Radius.circular(borderRadius),
        ),
      );
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..addRRect(
        RRect.fromRectAndRadius(rect, Radius.circular(borderRadius)),
      );
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    if (depth <= 0) return;

    final fullRRect = RRect.fromRectAndRadius(rect, Radius.circular(borderRadius));
    canvas.save();
    canvas.clipRRect(fullRRect);

    final Paint paint;
    if (shadowColor != null) {
      paint = Paint()
        ..color = shadowColor!
        ..style = PaintingStyle.fill;
    } else {
      // Auto-deepen the underlying background color by 42% opacity overlay
      // Perfect for any background color (green becomes deepest green, red becomes deepest red)
      paint = Paint()
        ..color = const Color(0xFF000000).withValues(alpha: 0.42)
        ..style = PaintingStyle.fill;
    }

    canvas.drawRect(
      Rect.fromLTRB(rect.left, rect.bottom - depth, rect.right, rect.bottom),
      paint,
    );
    canvas.restore();
  }

  @override
  ShapeBorder scale(double t) {
    return Button3DShapeBorder(
      side: side.scale(t),
      borderRadius: borderRadius * t,
      shadowColor: shadowColor,
      depth: depth * t,
    );
  }
}
