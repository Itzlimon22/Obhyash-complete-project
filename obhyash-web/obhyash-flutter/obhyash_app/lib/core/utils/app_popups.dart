import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum PopupType { success, error, warning, info }

class AppPopups {
  static OverlayEntry? _activeEntry;

  /// General popup method (backward-compatible)
  static void show(
    BuildContext context, {
    required String message,
    String? title,
    bool isError = false,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(
      context,
      message: message,
      title: title,
      type: isError ? PopupType.error : PopupType.success,
      duration: duration,
    );
  }

  /// Success message (Green pastel glow & outline check badge)
  static void success(
    BuildContext context, {
    required String message,
    String? title,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(context, message: message, title: title, type: PopupType.success, duration: duration);
  }

  /// Error message (Rose pastel glow & outline error badge) with intelligent backend error translation
  static void error(
    BuildContext context, {
    required String message,
    String? title,
    Duration duration = const Duration(seconds: 4),
  }) {
    showTyped(context, message: message, title: title, type: PopupType.error, duration: duration);
  }

  /// Warning / Alert message (Amber pastel glow & outline warning badge)
  static void warning(
    BuildContext context, {
    required String message,
    String? title,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(context, message: message, title: title, type: PopupType.warning, duration: duration);
  }

  /// Information message (Sky blue pastel glow & outline info badge)
  static void info(
    BuildContext context, {
    required String message,
    String? title,
    Duration duration = const Duration(seconds: 3),
  }) {
    showTyped(context, message: message, title: title, type: PopupType.info, duration: duration);
  }

  /// Internal typed popup launcher
  static void showTyped(
    BuildContext context, {
    required String message,
    String? title,
    required PopupType type,
    Duration duration = const Duration(seconds: 3),
  }) {
    final cleanMessage = _sanitizeMessage(message, type);

    final overlayState =
        Overlay.maybeOf(context, rootOverlay: true) ?? Overlay.maybeOf(context);
    if (overlayState == null) return;

    // Detect app theme brightness from caller context
    final isDark = Theme.of(context).brightness == Brightness.dark;

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

    // Enforce minimum 3.5 seconds stay time (4.0s for errors) so users always have plenty of time to read
    final effectiveDuration = duration < const Duration(seconds: 3, milliseconds: 500)
        ? (type == PopupType.error
            ? const Duration(seconds: 4)
            : const Duration(seconds: 3, milliseconds: 500))
        : duration;

    overlayEntry = OverlayEntry(
      builder: (context) {
        return _TopAnimatedPopup(
          message: cleanMessage,
          title: title,
          type: type,
          duration: effectiveDuration,
          isDark: isDark,
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
  final String? title;
  final PopupType type;
  final Duration duration;
  final bool? isDark;
  final VoidCallback onDismiss;

  const _TopAnimatedPopup({
    required this.message,
    this.title,
    required this.type,
    required this.duration,
    this.isDark,
    required this.onDismiss,
  });

  @override
  State<_TopAnimatedPopup> createState() => _TopAnimatedPopupState();
}

class _TopAnimatedPopupState extends State<_TopAnimatedPopup>
    with TickerProviderStateMixin {
  late AnimationController _controller;
  late AnimationController _progressController;
  late Animation<Offset> _offsetAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;
  bool _isDismissed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 360),
      reverseDuration: const Duration(milliseconds: 220),
    );

    _progressController = AnimationController(
      vsync: this,
      duration: widget.duration,
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
    _progressController.reverse(from: 1.0);

    _progressController.addStatusListener((status) {
      if (status == AnimationStatus.dismissed) {
        _dismissWithAnimation();
      }
    });
  }

  void _safeDismissImmediately() {
    if (_isDismissed) return;
    _isDismissed = true;
    _progressController.stop();
    widget.onDismiss();
  }

  void _dismissWithAnimation() {
    if (_isDismissed) return;
    _isDismissed = true;
    _progressController.stop();

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
    _progressController.dispose();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    final isDark = widget.isDark ?? (Theme.of(context).brightness == Brightness.dark);

    final Color accentColor;
    final Color gradientStart;
    final Color gradientMid;
    final Color gradientEnd;
    final Color cardBackground;
    final Color cardBorder;
    final Color badgeBackground;
    final Color badgeBorder;
    final Color titleColor;
    final Color messageColor;
    final Color closeIconColor;
    final List<BoxShadow> cardShadows;
    final IconData iconData;

    if (isDark) {
      // --- DARK THEME TOAST ---
      cardBackground = const Color(0xFF111827); // Solid deep slate surface
      cardBorder = const Color(0xFF1F2937);
      badgeBackground = const Color(0xFF1F2937);
      titleColor = const Color(0xFFF8FAFC);
      messageColor = const Color(0xFF94A3B8);
      closeIconColor = const Color(0xFF94A3B8);
      gradientEnd = const Color(0xFF111827);

      switch (widget.type) {
        case PopupType.info:
          accentColor = const Color(0xFF38BDF8); // Vibrant Sky 400
          gradientStart = const Color(0xFF0C2A44); // Deep Sky Midnight
          gradientMid = const Color(0xFF101E30);
          badgeBorder = const Color(0xFF0284C7).withValues(alpha: 0.4);
          iconData = Icons.info_outline_rounded;
          break;
        case PopupType.success:
          accentColor = const Color(0xFF34D399); // Vibrant Emerald 400
          gradientStart = const Color(0xFF063321); // Deep Mint Midnight
          gradientMid = const Color(0xFF0B241A);
          badgeBorder = const Color(0xFF059669).withValues(alpha: 0.4);
          iconData = Icons.check_circle_outline_rounded;
          break;
        case PopupType.warning:
          accentColor = const Color(0xFFFBBF24); // Vibrant Amber 400
          gradientStart = const Color(0xFF382306); // Deep Amber Midnight
          gradientMid = const Color(0xFF241909);
          badgeBorder = const Color(0xFFD97706).withValues(alpha: 0.4);
          iconData = Icons.warning_amber_rounded;
          break;
        case PopupType.error:
          accentColor = const Color(0xFFFB7185); // Vibrant Rose 400
          gradientStart = const Color(0xFF3B101A); // Deep Rose Midnight
          gradientMid = const Color(0xFF280F16);
          badgeBorder = const Color(0xFFE11D48).withValues(alpha: 0.4);
          iconData = Icons.error_outline_rounded;
          break;
      }

      cardShadows = [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.60),
          blurRadius: 32,
          spreadRadius: 0,
          offset: const Offset(0, 12),
        ),
        BoxShadow(
          color: accentColor.withValues(alpha: 0.14),
          blurRadius: 18,
          spreadRadius: -2,
          offset: const Offset(0, 4),
        ),
      ];
    } else {
      // --- LIGHT THEME TOAST (Reference Design) ---
      cardBackground = Colors.white;
      cardBorder = const Color(0xFFE2E8F0);
      badgeBackground = Colors.white;
      badgeBorder = const Color(0xFFE2E8F0);
      titleColor = const Color(0xFF0F172A);
      messageColor = const Color(0xFF64748B);
      closeIconColor = const Color(0xFF94A3B8);
      gradientEnd = Colors.white;

      switch (widget.type) {
        case PopupType.info:
          accentColor = const Color(0xFF0284C7); // Sky 600
          gradientStart = const Color(0xFFE0F2FE); // 100% solid light sky
          gradientMid = const Color(0xFFF0F9FF);   // 100% solid pale sky
          iconData = Icons.info_outline_rounded;
          break;
        case PopupType.success:
          accentColor = const Color(0xFF16A34A); // Green 600
          gradientStart = const Color(0xFFDCFCE7); // 100% solid light mint
          gradientMid = const Color(0xFFF0FDF4);   // 100% solid pale mint
          iconData = Icons.check_circle_outline_rounded;
          break;
        case PopupType.warning:
          accentColor = const Color(0xFFD97706); // Amber 600
          gradientStart = const Color(0xFFFEF3C7); // 100% solid light amber
          gradientMid = const Color(0xFFFFFBEB);   // 100% solid pale amber
          iconData = Icons.warning_amber_rounded;
          break;
        case PopupType.error:
          accentColor = const Color(0xFFE11D48); // Rose 600
          gradientStart = const Color(0xFFFFE4E6); // 100% solid light rose
          gradientMid = const Color(0xFFFFF1F2);   // 100% solid pale rose
          iconData = Icons.error_outline_rounded;
          break;
      }

      cardShadows = [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.14),
          blurRadius: 28,
          spreadRadius: 0,
          offset: const Offset(0, 10),
        ),
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.05),
          blurRadius: 10,
          spreadRadius: 0,
          offset: const Offset(0, 2),
        ),
      ];
    }

    final hasTitle = widget.title != null && widget.title!.trim().isNotEmpty;

    return Positioned(
      top: math.max(topPadding, 16) + 12,
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
                          color: cardBackground,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: cardBorder,
                            width: 1.0,
                          ),
                          boxShadow: cardShadows,
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [
                                  gradientStart,
                                  gradientMid,
                                  gradientEnd,
                                  gradientEnd,
                                ],
                                stops: const [0.0, 0.28, 0.58, 1.0],
                              ),
                            ),
                            child: Stack(
                              children: [
                                Padding(
                                  padding: const EdgeInsets.fromLTRB(14, 13, 38, 13),
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.center,
                                    children: [
                                      // Squircle Outline Icon Badge
                                      Container(
                                        width: 40,
                                        height: 40,
                                        decoration: BoxDecoration(
                                          color: badgeBackground,
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(
                                            color: badgeBorder,
                                            width: 1.0,
                                          ),
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withValues(
                                                alpha: isDark ? 0.25 : 0.04,
                                              ),
                                              blurRadius: 4,
                                              offset: const Offset(0, 1),
                                            ),
                                          ],
                                        ),
                                        child: Center(
                                          child: Icon(
                                            iconData,
                                            color: accentColor,
                                            size: 21,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      // Title & Message Content
                                      Expanded(
                                        child: hasTitle
                                            ? Column(
                                                mainAxisSize: MainAxisSize.min,
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    widget.title!.trim(),
                                                    style: TextStyle(
                                                      fontFamily: 'HindSiliguri',
                                                      color: titleColor,
                                                      fontSize: 15,
                                                      fontWeight: FontWeight.w600,
                                                      letterSpacing: -0.2,
                                                      height: 1.2,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 2),
                                                  Text(
                                                    widget.message,
                                                    style: TextStyle(
                                                      fontFamily: 'HindSiliguri',
                                                      color: messageColor,
                                                      fontSize: 13,
                                                      fontWeight: FontWeight.w400,
                                                      height: 1.35,
                                                    ),
                                                    maxLines: 3,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ],
                                              )
                                            : Text(
                                                widget.message,
                                                style: TextStyle(
                                                  fontFamily: 'HindSiliguri',
                                                  color: titleColor,
                                                  fontSize: 14,
                                                  fontWeight: FontWeight.w500,
                                                  letterSpacing: -0.1,
                                                  height: 1.35,
                                                ),
                                                maxLines: 3,
                                                overflow: TextOverflow.ellipsis,
                                              ),
                                      ),
                                    ],
                                  ),
                                ),
                                // Minimalist Slate Close Icon
                                Positioned(
                                  top: 10,
                                  right: 10,
                                  child: GestureDetector(
                                    onTap: _dismissWithAnimation,
                                    behavior: HitTestBehavior.opaque,
                                    child: Padding(
                                      padding: const EdgeInsets.all(4),
                                      child: Icon(
                                        Icons.close_rounded,
                                        color: closeIconColor,
                                        size: 18,
                                      ),
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
    );
  }
}
