import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum PopupType { success, error, warning, info }

class AppPopups {
  /// General popup method (backward-compatible)
  static void show(
    BuildContext context, {
    required String message,
    bool isError = false,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(
      context,
      message: message,
      type: isError ? PopupType.error : PopupType.success,
      duration: duration,
    );
  }

  /// Success message (Green banner)
  static void success(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(context, message: message, type: PopupType.success, duration: duration);
  }

  /// Error message (Red banner) with intelligent backend error translation
  static void error(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 4),
  }) {
    showTyped(context, message: message, type: PopupType.error, duration: duration);
  }

  /// Warning / Alert message (Amber banner)
  static void warning(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(context, message: message, type: PopupType.warning, duration: duration);
  }

  /// Information message (Blue banner)
  static void info(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(context, message: message, type: PopupType.info, duration: duration);
  }

  /// Internal typed popup launcher
  static void showTyped(
    BuildContext context, {
    required String message,
    required PopupType type,
    Duration duration = const Duration(seconds: 3),
  }) {
    final cleanMessage = _sanitizeMessage(message, type);

    final overlayState =
        Overlay.maybeOf(context, rootOverlay: true) ?? Overlay.maybeOf(context);
    if (overlayState == null) return;

    // Haptic feedback according to type
    if (type == PopupType.error) {
      HapticFeedback.heavyImpact();
    } else if (type == PopupType.warning) {
      HapticFeedback.mediumImpact();
    } else {
      HapticFeedback.lightImpact();
    }

    late OverlayEntry overlayEntry;
    bool isRemoved = false;

    void safeRemove() {
      if (!isRemoved && overlayEntry.mounted) {
        isRemoved = true;
        try {
          overlayEntry.remove();
        } catch (_) {}
      }
    }

    overlayEntry = OverlayEntry(
      builder: (context) {
        return _TopAnimatedPopup(
          message: cleanMessage,
          type: type,
          duration: duration,
          onDismiss: safeRemove,
        );
      },
    );

    try {
      overlayState.insert(overlayEntry);
    } catch (_) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!isRemoved) {
          try {
            overlayState.insert(overlayEntry);
          } catch (_) {}
        }
      });
    }
  }

  /// Translates raw machine exceptions and strings into polite, user-friendly Bengali
  static String _sanitizeMessage(String raw, PopupType type) {
    String msg = raw.replaceFirst(RegExp(r'^Exception:\s*'), '').trim();

    final l = msg.toLowerCase();

    if (l.contains('socketexception') ||
        l.contains('failed host lookup') ||
        l.contains('network is unreachable') ||
        l.contains('clientexception') ||
        l.contains('connection refused') ||
        l.contains('timeoutexception') ||
        l.contains('future not completed') ||
        l.contains('connection timed out') ||
        l.contains('timed out') ||
        l.contains('deadline exceeded')) {
      return 'ইন্টারনেট সংযোগ ধীরগতির বা সার্ভার সাড়া দিতে দেরি করছে। আবার চেষ্টা করো।';
    }

    if (l.contains('invalid login credentials') ||
        l.contains('invalid_grant') ||
        l.contains('wrong password')) {
      return 'ইমেইল বা পাসওয়ার্ড সঠিক নয়। পুনরায় মিলিয়ে দেখো।';
    }

    if (l.contains('user already registered') ||
        l.contains('email already in use')) {
      return 'এই ইমেইল দিয়ে ইতোমধ্যে একটি অ্যাকাউন্ট খোলা রয়েছে।';
    }

    if (l.contains('password should be at least')) {
      return 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে।';
    }

    if (l.contains('no questions') || l.contains('empty questions') || l.contains('zero questions')) {
      return 'পর্যাপ্ত প্রশ্ন পাওয়া যায়নি। অন্য বিষয় বা অধ্যায় নির্বাচন করো।';
    }

    if (l.contains('jwt expired') || l.contains('token expired')) {
      return 'সেশনের মেয়াদ শেষ হয়েছে। আবার লগইন করো।';
    }

    if (l.contains('bookmark') && l.contains('login')) {
      return 'বুকমার্ক করতে প্রথমে লগইন করো।';
    }

    return msg;
  }
}

class _TopAnimatedPopup extends StatefulWidget {
  final String message;
  final PopupType type;
  final Duration duration;
  final VoidCallback onDismiss;

  const _TopAnimatedPopup({
    required this.message,
    required this.type,
    required this.duration,
    required this.onDismiss,
  });

  @override
  State<_TopAnimatedPopup> createState() => _TopAnimatedPopupState();
}

class _TopAnimatedPopupState extends State<_TopAnimatedPopup>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _fadeAnimation;
  Timer? _timer;
  bool _isDismissed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
      reverseDuration: const Duration(milliseconds: 240),
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0.0, -1.2),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutCubic,
        reverseCurve: Curves.easeInCubic,
      ),
    );

    _fadeAnimation = CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
      reverseCurve: Curves.easeIn,
    );

    _controller.forward();

    // Auto dismiss after specified duration
    _timer = Timer(widget.duration, _dismissWithAnimation);
  }

  void _safeDismissImmediately() {
    if (_isDismissed) return;
    _isDismissed = true;
    _timer?.cancel();
    widget.onDismiss();
  }

  void _dismissWithAnimation() {
    if (_isDismissed) return;
    _isDismissed = true;
    _timer?.cancel();

    if (mounted) {
      _controller.reverse().then((_) {
        widget.onDismiss();
      }).catchError((_) {
        widget.onDismiss();
      });
    } else {
      widget.onDismiss();
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
    final topPadding = MediaQuery.of(context).padding.top;

    // Deep rich colors according to popup type
    final Color bgColor;
    final Color borderColor;

    switch (widget.type) {
      case PopupType.success:
        bgColor = const Color(0xFF064E3B); // Deep Rich Forest Green
        borderColor = const Color(0xFF10B981).withValues(alpha: 0.35);
        break;
      case PopupType.error:
        bgColor = const Color(0xFF7F1D1D); // Deep Rich Crimson Red
        borderColor = const Color(0xFFEF4444).withValues(alpha: 0.35);
        break;
      case PopupType.warning:
        bgColor = const Color(0xFF78350F); // Deep Rich Amber
        borderColor = const Color(0xFFF59E0B).withValues(alpha: 0.35);
        break;
      case PopupType.info:
        bgColor = const Color(0xFF1E3A8A); // Deep Rich Midnight Blue
        borderColor = const Color(0xFF3B82F6).withValues(alpha: 0.35);
        break;
    }

    return Positioned(
      top: topPadding + 8,
      left: 16,
      right: 16,
      child: Align(
        alignment: Alignment.topCenter,
        child: Material(
          color: Colors.transparent,
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _offsetAnimation,
              child: Dismissible(
                key: const ValueKey('app_popup_dismiss_horizontal'),
                direction: DismissDirection.horizontal,
                onDismissed: (_) => _safeDismissImmediately(),
                child: Dismissible(
                  key: const ValueKey('app_popup_dismiss_up'),
                  direction: DismissDirection.up,
                  onDismissed: (_) => _safeDismissImmediately(),
                  child: GestureDetector(
                    onTap: _dismissWithAnimation,
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      constraints: BoxConstraints(
                        maxWidth: MediaQuery.of(context).size.width - 48,
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 8.5,
                      ),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: borderColor, width: 1),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.35),
                            blurRadius: 14,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Text(
                        widget.message,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'HindSiliguri',
                          height: 1.25,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
