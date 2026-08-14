import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class AppPopups {
  static void show(
    BuildContext context, {
    required String message,
    bool isError = false,
  }) {
    // Strip "Exception: " if it exists
    final cleanMessage = message.replaceFirst(RegExp(r'^Exception:\s*'), '');

    final overlayState = Overlay.of(context);
    late OverlayEntry overlayEntry;

    overlayEntry = OverlayEntry(
      builder: (context) {
        return _TopAnimatedPopup(
          message: cleanMessage,
          isError: isError,
          onDismiss: () {
            overlayEntry.remove();
          },
        );
      },
    );

    overlayState.insert(overlayEntry);
  }
}

class _TopAnimatedPopup extends StatefulWidget {
  final String message;
  final bool isError;
  final VoidCallback onDismiss;

  const _TopAnimatedPopup({
    required this.message,
    required this.isError,
    required this.onDismiss,
  });

  @override
  State<_TopAnimatedPopup> createState() => _TopAnimatedPopupState();
}

class _TopAnimatedPopupState extends State<_TopAnimatedPopup>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0.0, -1.5),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.elasticOut, // Spring animation
      ),
    );

    _controller.forward();

    // Auto dismiss after 3 seconds
    _timer = Timer(const Duration(seconds: 3), _dismiss);
  }

  void _dismiss() {
    if (mounted) {
      _controller.reverse().then((_) {
        widget.onDismiss();
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Get screen properties to position it safely below the status bar
    final topPadding = MediaQuery.of(context).padding.top;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Solid Background Colors (Deep Green & Deep Red)
    final bgColor = widget.isError
        ? const Color(0xFFB91C1C) // Deep Red
        : const Color(0xFF047857); // Deep Green

    final icon = widget.isError ? LucideIcons.alertCircle : LucideIcons.checkCircle2;

    return Positioned(
      top: topPadding + 16,
      left: 16,
      right: 16,
      child: Material(
        color: Colors.transparent,
        child: SlideTransition(
          position: _offsetAnimation,
          child: GestureDetector(
            onTap: _dismiss, // Dismiss on tap
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.2),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Icon(icon, color: Colors.white, size: 24),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      widget.message,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'Anek Bangla',
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
