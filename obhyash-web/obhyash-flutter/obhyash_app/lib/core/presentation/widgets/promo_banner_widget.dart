import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../providers/app_config_provider.dart';
import '../../../features/dashboard/providers/dashboard_providers.dart';

/// In-memory session state: when dismissed, remains hidden while the app is alive.
/// When the app is closed from background/killed and reopened, it resets to false.
final promoBannerSessionDismissedProvider =
    NotifierProvider<PromoBannerDismissedNotifier, bool>(
  PromoBannerDismissedNotifier.new,
);

class PromoBannerDismissedNotifier extends Notifier<bool> {
  @override
  bool build() => false;

  void dismiss() {
    state = true;
  }
}

enum PromoBannerType { auto, subscription, referral }

class PromoBannerWidget extends ConsumerStatefulWidget {
  final PromoBannerType type;
  final String? title;
  final String? subtitle;
  final String? targetRoute;

  const PromoBannerWidget({
    super.key,
    this.type = PromoBannerType.auto,
    this.title,
    this.subtitle,
    this.targetRoute,
  });

  @override
  ConsumerState<PromoBannerWidget> createState() => _PromoBannerWidgetState();
}

class _PromoBannerWidgetState extends ConsumerState<PromoBannerWidget>
    with SingleTickerProviderStateMixin {
  int _daysLeft = 5;
  bool _isInitialized = false;
  bool _isClosing = false;
  late final AnimationController _animController;
  late final Animation<double> _collapseAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
    );
    _collapseAnimation = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeInOutCubic,
    );
    _initCountdown();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  /// Manages a looping random countdown cycle.
  /// Generates a random period between 3 and 8 days.
  /// When the period expires, it automatically starts a new countdown cycle.
  Future<void> _initCountdown() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final now = DateTime.now();
      final targetMs = prefs.getInt('promo_countdown_target_epoch_ms');

      if (targetMs == null || now.millisecondsSinceEpoch >= targetMs) {
        // Pick random days between 3 and 8
        final randomDays = 3 + Random().nextInt(6);
        final newTarget = now.add(Duration(days: randomDays));
        await prefs.setInt(
          'promo_countdown_target_epoch_ms',
          newTarget.millisecondsSinceEpoch,
        );
        if (mounted) {
          setState(() {
            _daysLeft = randomDays;
            _isInitialized = true;
          });
        }
      } else {
        final target = DateTime.fromMillisecondsSinceEpoch(targetMs);
        final diff = target.difference(now);
        int remaining = (diff.inHours / 24).ceil();
        if (remaining <= 0) remaining = 1;
        if (mounted) {
          setState(() {
            _daysLeft = remaining;
            _isInitialized = true;
          });
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _daysLeft = 4;
          _isInitialized = true;
        });
      }
    }
  }

  void _handleDismiss() async {
    HapticFeedback.lightImpact();
    setState(() => _isClosing = true);
    await _animController.forward();
    if (mounted) {
      ref.read(promoBannerSessionDismissedProvider.notifier).dismiss();
    }
  }

  String _toBengaliNumerals(int number) {
    const bn = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return number.toString().split('').map((d) {
      final idx = int.tryParse(d);
      return idx != null ? bn[idx] : d;
    }).join();
  }

  @override
  Widget build(BuildContext context) {
    final isDismissedThisSession = ref.watch(
      promoBannerSessionDismissedProvider,
    );

    if (isDismissedThisSession || !_isInitialized) {
      return const SizedBox.shrink();
    }

    // Remote Admin Config Listener
    final configAsync = ref.watch(appConfigStreamProvider);
    final config = configAsync.value;

    // If disabled remotely by admin, hide completely
    if (config != null && !config.promoBannerEnabled) {
      return const SizedBox.shrink();
    }

    // User Pro status check
    final userProfileAsync = ref.watch(userProfileProvider);
    final isPro = userProfileAsync.value?.isPro ?? false;

    // Resolve effective banner type (subscription vs referral)
    final bool isSub;
    if (widget.type == PromoBannerType.subscription) {
      isSub = true;
    } else if (widget.type == PromoBannerType.referral) {
      isSub = false;
    } else {
      // Auto mode: follow remote config if set, otherwise smart logic (free -> sub, pro -> referral)
      final remoteType = config?.promoBannerType ?? 'auto';
      if (remoteType == 'subscription') {
        isSub = true;
      } else if (remoteType == 'referral') {
        isSub = false;
      } else {
        isSub = !isPro;
      }
    }

    // Dynamic Title
    final displayTitle = widget.title ??
        ((config != null && config.promoBannerTitle.trim().isNotEmpty)
            ? config.promoBannerTitle.trim()
            : (isSub
                ? 'প্রো সাবস্ক্রিপশনে বিশেষ ছাড়!'
                : 'বন্ধুকে রেফার করো, ফ্রি প্রো পাও!'));

    // Dynamic Subtitle
    final displaySubtitle = widget.subtitle ??
        ((config != null && config.promoBannerSubtitle.trim().isNotEmpty)
            ? config.promoBannerSubtitle.trim()
            : (isSub
                ? 'আনলক করতে ট্যাপ করো এখানে →'
                : 'লিংক শেয়ার করতে ট্যাপ করো →'));

    // Navigation Route Target
    final route = widget.targetRoute ??
        ((config != null && config.promoBannerTarget.trim().isNotEmpty)
            ? config.promoBannerTarget.trim()
            : (isSub ? '/profile/subscription' : '/profile/referral'));

    final countdownString = '${_toBengaliNumerals(_daysLeft)} দিন';

    return SizeTransition(
      sizeFactor: Tween<double>(begin: 1.0, end: 0.0).animate(_collapseAnimation),
      axisAlignment: -1.0,
      child: FadeTransition(
        opacity: Tween<double>(begin: 1.0, end: 0.0).animate(_collapseAnimation),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            // Luxury dark gradient matching Obhyash Midnight Teal design language
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: isSub
                  ? const [
                      Color(0xFF141F23), // Deep Obsidian Teal
                      Color(0xFF0A1518),
                      Color(0xFF101C20),
                    ]
                  : const [
                      Color(0xFF0F2623), // Emerald Tinted Dark
                      Color(0xFF081917),
                      Color(0xFF0C1F1D),
                    ],
            ),
            border: Border(
              top: BorderSide(
                color: isSub
                    ? const Color(0xFFF59E0B).withValues(alpha: 0.6) // Warm Amber top rim
                    : const Color(0xFF10B981).withValues(alpha: 0.6), // Emerald top rim
                width: 1.2,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.4),
                blurRadius: 10,
                offset: const Offset(0, -3),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Tappable Banner Body
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.push(route);
                  },
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(14, 10, 36, 10),
                    child: Row(
                      children: [
                        // Left: Glowing Replica Icon Badge
                        Container(
                          width: 44,
                          height: 44,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: isSub
                                  ? const [
                                      Color(0xFFEF4444), // Crimson to Red (Alarm/Offer clock style)
                                      Color(0xFFDC2626),
                                    ]
                                  : const [
                                      Color(0xFF10B981), // Emerald to Teal
                                      Color(0xFF059669),
                                    ],
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: (isSub
                                        ? const Color(0xFFEF4444)
                                        : const Color(0xFF10B981))
                                    .withValues(alpha: 0.4),
                                blurRadius: 10,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Icon(
                              isSub
                                  ? Icons.alarm_rounded
                                  : Icons.card_giftcard_rounded,
                              color: Colors.white,
                              size: 24,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Middle: Title & Subtitle with Hind Siliguri typography
                        Expanded(
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                displayTitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  color: Colors.white,
                                  fontSize: 14.5,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -0.2,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                displaySubtitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  color: Colors.white.withValues(alpha: 0.85),
                                  fontSize: 12.0,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Right: Countdown Pill Replica
                        const SizedBox(width: 8),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Text(
                              'বাকি মাত্র',
                              style: TextStyle(
                                fontFamily: 'HindSiliguri',
                                color: Colors.white.withValues(alpha: 0.85),
                                fontSize: 10.5,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 5,
                              ),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    Color(0xFFFF9800), // Vibrant Orange
                                    Color(0xFFF57C00),
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFFF9800).withValues(alpha: 0.4),
                                    blurRadius: 8,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Text(
                                countdownString,
                                style: const TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  color: Colors.white,
                                  fontSize: 13.0,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // Top-Right: Translucent Circular Dismiss Button
              Positioned(
                top: 6,
                right: 8,
                child: GestureDetector(
                  onTap: _isClosing ? null : _handleDismiss,
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.close_rounded,
                      size: 14,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
