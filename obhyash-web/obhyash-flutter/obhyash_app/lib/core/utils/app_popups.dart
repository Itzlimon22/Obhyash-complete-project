import 'dart:async';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum PopupType { success, error, warning, info }

class AppPopups {
  static OverlayEntry? _activeEntry;

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

  /// Success message (Emerald badge & glow)
  static void success(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(context, message: message, type: PopupType.success, duration: duration);
  }

  /// Error message (Rose/Crimson badge & glow) with intelligent backend error translation
  static void error(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 4),
  }) {
    showTyped(context, message: message, type: PopupType.error, duration: duration);
  }

  /// Warning / Alert message (Amber badge & glow)
  static void warning(
    BuildContext context, {
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(context, message: message, type: PopupType.warning, duration: duration);
  }

  /// Information message (Sky blue badge & glow)
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
    } else if (type == PopupType.success) {
      HapticFeedback.lightImpact();
    } else {
      HapticFeedback.selectionClick();
    }

    // Dismiss active toast before displaying a new one
    if (_activeEntry != null && _activeEntry!.mounted) {
      try {
        _activeEntry!.remove();
      } catch (_) {}
      _activeEntry = null;
    }

    late OverlayEntry overlayEntry;
    bool isRemoved = false;

    void safeRemove() {
      if (!isRemoved && overlayEntry.mounted) {
        isRemoved = true;
        if (_activeEntry == overlayEntry) {
          _activeEntry = null;
        }
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

    _activeEntry = overlayEntry;

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
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  Timer? _timer;
  bool _isDismissed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 380),
      reverseDuration: const Duration(milliseconds: 220),
    );

    _offsetAnimation = Tween<Offset>(
      begin: const Offset(0.0, -0.9),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutBack,
        reverseCurve: Curves.easeInCubic,
      ),
    );

    _scaleAnimation = Tween<double>(
      begin: 0.88,
      end: 1.0,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeOutBack,
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

    final Color accentColor;
    final IconData iconData;

    switch (widget.type) {
      case PopupType.success:
        accentColor = const Color(0xFF10B981); // Emerald Green
        iconData = Icons.check_rounded;
        break;
      case PopupType.error:
        accentColor = const Color(0xFFF43F5E); // Rose Crimson
        iconData = Icons.priority_high_rounded;
        break;
      case PopupType.warning:
        accentColor = const Color(0xFFF59E0B); // Amber
        iconData = Icons.warning_amber_rounded;
        break;
      case PopupType.info:
        accentColor = const Color(0xFF38BDF8); // Sky Blue
        iconData = Icons.info_outline_rounded;
        break;
    }

    return Positioned(
      top: topPadding + 10,
      left: 16,
      right: 16,
      child: Align(
        alignment: Alignment.topCenter,
        child: Material(
          color: Colors.transparent,
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: ScaleTransition(
              scale: _scaleAnimation,
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
                          maxWidth: math.min(
                            MediaQuery.of(context).size.width - 32,
                            440,
                          ),
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xF2121318), // Deep Obsidian Glass
                          borderRadius: BorderRadius.circular(28),
                          border: Border.all(
                            color: accentColor.withValues(alpha: 0.38),
                            width: 1.2,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: accentColor.withValues(alpha: 0.22),
                              blurRadius: 20,
                              spreadRadius: -2,
                              offset: const Offset(0, 6),
                            ),
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.55),
                              blurRadius: 28,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(28),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                            child: Padding(
                              padding: const EdgeInsets.fromLTRB(10, 8, 12, 8),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  // Circular Glowing Status Icon Badge
                                  Container(
                                    width: 32,
                                    height: 32,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: accentColor.withValues(alpha: 0.16),
                                      border: Border.all(
                                        color: accentColor.withValues(alpha: 0.42),
                                        width: 1,
                                      ),
                                    ),
                                    child: Center(
                                      child: Icon(
                                        iconData,
                                        color: accentColor,
                                        size: 17,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  // Clean Message Text
                                  Flexible(
                                    child: Text(
                                      widget.message,
                                      style: const TextStyle(
                                        color: Color(0xFFF8FAFC),
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                        height: 1.32,
                                        letterSpacing: 0.1,
                                      ),
                                      maxLines: 3,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  // Subtle Dismiss Close Button
                                  GestureDetector(
                                    onTap: _dismissWithAnimation,
                                    behavior: HitTestBehavior.opaque,
                                    child: Padding(
                                      padding: const EdgeInsets.all(4),
                                      child: Icon(
                                        Icons.close_rounded,
                                        color: Colors.white.withValues(alpha: 0.42),
                                        size: 16,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
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
