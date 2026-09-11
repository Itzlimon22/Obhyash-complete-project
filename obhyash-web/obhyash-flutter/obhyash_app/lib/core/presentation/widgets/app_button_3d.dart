import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_theme.dart';
export '../../theme/button_3d_theme.dart';

/// A premium 3D tactile button (Duolingo / physical button style)
/// with realistic press-down mechanics, crisp depth edge in deepest green,
/// and smooth haptic feedback.
class AppButton3D extends StatefulWidget {
  final String? text;
  final Widget? child;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final VoidCallback? onPressed;
  final Color? baseColor;
  final Color? shadowColor;
  final Color textColor;
  final double height;
  final double? width;
  final double borderRadius;
  final double depth;
  final double fontSize;
  final FontWeight fontWeight;
  final bool isLoading;
  final bool isFullWidth;
  final EdgeInsetsGeometry? padding;
  final Border? border;

  const AppButton3D({
    super.key,
    this.text,
    this.child,
    this.prefixIcon,
    this.suffixIcon,
    required this.onPressed,
    this.baseColor,
    this.shadowColor,
    this.textColor = Colors.white,
    this.height = 50.0,
    this.width,
    this.borderRadius = 16.0,
    this.depth = 5.0,
    this.fontSize = 16.0,
    this.fontWeight = FontWeight.w700,
    this.isLoading = false,
    this.isFullWidth = true,
    this.padding,
    this.border,
  }) : assert(text != null || child != null, 'Either text or child must be provided');

  @override
  State<AppButton3D> createState() => _AppButton3DState();
}

class _AppButton3DState extends State<AppButton3D> {
  bool _isPressed = false;

  Color _getEffectiveBaseColor(BuildContext context) {
    if (widget.baseColor != null) return widget.baseColor!;
    return AppColors.viridianForest; // #12544F
  }

  Color _getEffectiveShadowColor(Color base) {
    if (widget.shadowColor != null) return widget.shadowColor!;
    // Calculate deepest dark green tone
    final hsl = HSLColor.fromColor(base);
    // Darken by 30% and boost saturation for a rich deep edge
    return hsl
        .withLightness((hsl.lightness - 0.22).clamp(0.05, 0.9))
        .withSaturation((hsl.saturation + 0.1).clamp(0.0, 1.0))
        .toColor();
  }

  @override
  Widget build(BuildContext context) {
    final bool isEnabled = widget.onPressed != null && !widget.isLoading;
    final Color effectiveBaseColor = isEnabled
        ? _getEffectiveBaseColor(context)
        : const Color(0xFF3F3F46); // disabled gray
    final Color effectiveShadowColor = isEnabled
        ? _getEffectiveShadowColor(effectiveBaseColor)
        : const Color(0xFF27272A);

    final double effectiveDepth = isEnabled ? widget.depth : 2.0;
    final double pressOffset = _isPressed && isEnabled ? effectiveDepth - 1.0 : 0.0;
    final double currentShadowHeight = _isPressed && isEnabled ? 1.0 : effectiveDepth;

    Widget content = widget.child ??
        Row(
          mainAxisSize: widget.isFullWidth ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            if (widget.isLoading) ...[
              SizedBox(
                height: 18,
                width: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2.2,
                  valueColor: AlwaysStoppedAnimation<Color>(widget.textColor),
                ),
              ),
              const SizedBox(width: 8),
            ] else if (widget.prefixIcon != null) ...[
              widget.prefixIcon!,
              const SizedBox(width: 8),
            ],
            if (widget.text != null)
              Text(
                widget.text!,
                style: TextStyle(
                  color: widget.textColor,
                  fontSize: widget.fontSize,
                  fontWeight: widget.fontWeight,
                  fontFamily: GoogleFonts.inter().fontFamily,
                  fontFamilyFallback: const ['HindSiliguri', 'sans-serif'],
                  letterSpacing: 0.2,
                ),
              ),
            if (widget.suffixIcon != null && !widget.isLoading) ...[
              const SizedBox(width: 8),
              widget.suffixIcon!,
            ],
          ],
        );

    return SizedBox(
      width: widget.isFullWidth ? (widget.width ?? double.infinity) : widget.width,
      height: widget.height + effectiveDepth,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: isEnabled
            ? (_) {
                HapticFeedback.lightImpact();
                setState(() => _isPressed = true);
              }
            : null,
        onTapUp: isEnabled
            ? (_) {
                setState(() => _isPressed = false);
                widget.onPressed?.call();
              }
            : null,
        onTapCancel: isEnabled
            ? () {
                setState(() => _isPressed = false);
              }
            : null,
        child: Stack(
          alignment: Alignment.topCenter,
          children: [
            // 3D Bottom Base Layer (Deepest Green)
            Positioned(
              top: effectiveDepth,
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
                height: widget.height,
                decoration: BoxDecoration(
                  color: effectiveShadowColor,
                  borderRadius: BorderRadius.circular(widget.borderRadius),
                ),
              ),
            ),

            // 3D Top Cap Layer (Moves down when pressed)
            AnimatedPositioned(
              duration: const Duration(milliseconds: 60),
              curve: Curves.easeOutQuad,
              top: pressOffset,
              left: 0,
              right: 0,
              child: Container(
                height: widget.height,
                padding: widget.padding ?? const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: effectiveBaseColor,
                  borderRadius: BorderRadius.circular(widget.borderRadius),
                  border: widget.border,
                  boxShadow: [
                    BoxShadow(
                      color: effectiveShadowColor,
                      offset: Offset(0, currentShadowHeight),
                      blurRadius: 0, // Sharp 3D tactile appearance
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: content,
              ),
            ),
          ],
        ),
      ),
    );
  }
}


