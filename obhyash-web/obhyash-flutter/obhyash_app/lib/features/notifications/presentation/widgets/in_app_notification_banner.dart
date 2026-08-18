import 'dart:async';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../../core/services/haptics_service.dart';
import '../../domain/notification_model.dart';
import '../../services/notification_router.dart';
import '../notifications_view.dart';

class InAppNotificationBanner {
  static OverlayEntry? _currentEntry;
  static Timer? _dismissTimer;

  /// Display a luxury top-sliding in-app floating banner
  static void show(BuildContext context, AppNotification notif) {
    // If a banner is already active, remove it cleanly
    dismiss();

    final overlay = Overlay.maybeOf(context, rootOverlay: true);
    if (overlay == null) return;

    AppHaptics.light();

    _currentEntry = OverlayEntry(
      builder: (context) => _InAppBannerWidget(
        notification: notif,
        onDismiss: dismiss,
        onTap: () {
          dismiss();
          NotificationRouter.handleTap(context, notif);
        },
      ),
    );

    overlay.insert(_currentEntry!);

    // Auto-dismiss after 4.5 seconds
    _dismissTimer = Timer(const Duration(milliseconds: 4500), () {
      dismiss();
    });
  }

  static void dismiss() {
    _dismissTimer?.cancel();
    _dismissTimer = null;
    if (_currentEntry != null) {
      _currentEntry?.remove();
      _currentEntry = null;
    }
  }
}

class _InAppBannerWidget extends StatefulWidget {
  final AppNotification notification;
  final VoidCallback onDismiss;
  final VoidCallback onTap;

  const _InAppBannerWidget({
    required this.notification,
    required this.onDismiss,
    required this.onTap,
  });

  @override
  State<_InAppBannerWidget> createState() => _InAppBannerWidgetState();
}

class _InAppBannerWidgetState extends State<_InAppBannerWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _slideAnimation;
  late final Animation<double> _fadeAnimation;
  late final Animation<double> _scaleAnimation;
  double _dragOffsetY = 0.0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
      reverseDuration: const Duration(milliseconds: 250),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -1.2),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutBack,
      reverseCurve: Curves.easeInCubic,
    ));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOut,
      reverseCurve: Curves.easeIn,
    ));

    _scaleAnimation = Tween<double>(
      begin: 0.92,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeOutBack,
      reverseCurve: Curves.easeIn,
    ));

    _controller.forward();
  }

  Future<void> _animateAndDismiss() async {
    if (mounted && _controller.status != AnimationStatus.dismissed) {
      await _controller.reverse();
    }
    widget.onDismiss();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final style = getNotificationStyle(widget.notification.type, isDark);

    return SafeArea(
      child: Align(
        alignment: Alignment.topCenter,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: SlideTransition(
            position: _slideAnimation,
            child: FadeTransition(
              opacity: _fadeAnimation,
              child: ScaleTransition(
                scale: _scaleAnimation,
                child: GestureDetector(
                  onTap: widget.onTap,
                  onVerticalDragUpdate: (details) {
                    if (details.primaryDelta != null && details.primaryDelta! < 0) {
                      setState(() {
                        _dragOffsetY += details.primaryDelta!;
                      });
                    }
                  },
                  onVerticalDragEnd: (details) {
                    if (_dragOffsetY < -15 || (details.primaryVelocity ?? 0) < -200) {
                      _animateAndDismiss();
                    } else {
                      setState(() {
                        _dragOffsetY = 0.0;
                      });
                    }
                  },
                  child: Transform.translate(
                    offset: Offset(0, _dragOffsetY),
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 440),
                      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF18181B) : Colors.white,
                        borderRadius: BorderRadius.circular(22),
                        border: Border.all(
                          color: isDark ? const Color(0xFF27272A) : const Color(0xFFE2E8F0),
                          width: 1.2,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: isDark
                                ? Colors.black.withValues(alpha: 0.5)
                                : const Color(0x24000000),
                            blurRadius: 22,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Material(
                        color: Colors.transparent,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Icon Badge
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: style['bg'],
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Icon(
                                style['icon'] as IconData,
                                color: style['color'] as Color,
                                size: 20,
                              ),
                            ),
                            const SizedBox(width: 12),

                            // Main Texts
                            Expanded(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        'অভ্যাস',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w700,
                                          color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A),
                                          letterSpacing: 0.3,
                                          fontFamily: 'HindSiliguri',
                                        ),
                                      ),
                                      const SizedBox(width: 5),
                                      Container(
                                        width: 3,
                                        height: 3,
                                        decoration: BoxDecoration(
                                          color: isDark ? Colors.white38 : Colors.black26,
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      const SizedBox(width: 5),
                                      Text(
                                        'এখনই',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: isDark ? const Color(0xFF71717A) : const Color(0xFFA1A1AA),
                                          fontFamily: 'HindSiliguri',
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    widget.notification.title,
                                    style: TextStyle(
                                      fontSize: 14.5,
                                      fontWeight: FontWeight.bold,
                                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                                      fontFamily: 'HindSiliguri',
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    widget.notification.message,
                                    style: TextStyle(
                                      fontSize: 12.5,
                                      height: 1.35,
                                      color: isDark ? const Color(0xFFA1A1AA) : const Color(0xFF475569),
                                      fontFamily: 'HindSiliguri',
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),

                            // Mini Action Indicator
                            Container(
                              margin: const EdgeInsets.only(top: 8),
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0x33004633)
                                    : const Color(0xFFE6F4EA),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: const [
                                  Text(
                                    'দেখুন',
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF004633),
                                      fontFamily: 'HindSiliguri',
                                    ),
                                  ),
                                  SizedBox(width: 2),
                                  Icon(
                                    LucideIcons.chevronRight,
                                    size: 14,
                                    color: Color(0xFF004633),
                                  ),
                                ],
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
    );
  }
}
