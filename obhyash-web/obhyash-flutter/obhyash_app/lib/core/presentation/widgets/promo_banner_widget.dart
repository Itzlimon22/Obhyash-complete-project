import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../providers/app_config_provider.dart';
import '../../providers/shared_prefs_provider.dart';
import '../../../features/dashboard/providers/dashboard_providers.dart';
import '../../../features/dashboard/domain/models.dart';

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

    // User Pro status check - strictly show ONLY to free users, never to any pro/premium user
    final userProfileAsync = ref.watch(userProfileProvider);
    bool isPro = userProfileAsync.value?.isPro ?? false;
    if (!isPro) {
      try {
        final prefs = ref.watch(sharedPreferencesProvider);
        final uid = Supabase.instance.client.auth.currentUser?.id;
        if (uid != null) {
          final cached = prefs.getString('profile_$uid');
          if (cached != null) {
            final decoded = jsonDecode(cached) as Map<String, dynamic>;
            if (UserProfile.fromJson(decoded).isPro) isPro = true;
          }
        }
      } catch (_) {}
    }

    // Pro users must NEVER see this banner
    if (isPro) {
      return const SizedBox.shrink();
    }

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

    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Theme adaptive colors - Reddish / Crimson Rose Premium Theme
    final List<Color> bgGradient = isDark
        ? const [Color(0xFF261014), Color(0xFF180A0D)]
        : const [Color(0xFFFFF1F2), Color(0xFFFFE4E6)];

    final Color borderColor = isDark
        ? const Color(0xFFFB7185).withValues(alpha: 0.35)
        : const Color(0xFFFDA4AF).withValues(alpha: 0.75);

    final Color titleColor = isDark ? Colors.white : const Color(0xFF881337);
    final Color subtitleColor = isDark ? const Color(0xFFFDA4AF) : const Color(0xFFBE123C);

    final Color iconBg = isDark
        ? const Color(0xFFE11D48).withValues(alpha: 0.22)
        : const Color(0xFFFFE4E6);

    final Color iconBorder = isDark
        ? const Color(0xFFFB7185).withValues(alpha: 0.45)
        : const Color(0xFFFDA4AF);

    final Color iconColor = isDark
        ? const Color(0xFFFB7185)
        : const Color(0xFFE11D48);

    final Color actionBtnBg = isDark
        ? const Color(0xFFE11D48)
        : const Color(0xFFBE123C);

    final Color actionBtnTextColor = Colors.white;

    final Color dismissBg = isDark
        ? Colors.white.withValues(alpha: 0.12)
        : const Color(0xFFBE123C).withValues(alpha: 0.08);

    final Color dismissIconColor = isDark ? const Color(0xFFFDA4AF) : const Color(0xFFBE123C);

    return SizeTransition(
      sizeFactor: Tween<double>(begin: 1.0, end: 0.0).animate(_collapseAnimation),
      axisAlignment: -1.0,
      child: FadeTransition(
        opacity: Tween<double>(begin: 1.0, end: 0.0).animate(_collapseAnimation),
        child: Container(
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              colors: bgGradient,
            ),
            border: Border(
              top: BorderSide(
                color: borderColor,
                width: 1.1,
              ),
            ),
            boxShadow: [
              BoxShadow(
                color: isDark
                    ? Colors.black.withValues(alpha: 0.45)
                    : const Color(0xFFE11D48).withValues(alpha: 0.10),
                blurRadius: 8,
                offset: const Offset(0, -2),
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
                        // Left: Elegant Pro Crown or Gift Badge
                        Container(
                          width: 42,
                          height: 42,
                          decoration: BoxDecoration(
                            color: iconBg,
                            shape: BoxShape.circle,
                            border: Border.all(color: iconBorder, width: 1.1),
                          ),
                          child: Center(
                            child: Icon(
                              isSub ? LucideIcons.crown : LucideIcons.gift,
                              color: iconColor,
                              size: 20,
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
                                style: TextStyle(
                                  fontFamily: 'HindSiliguri',
                                  color: titleColor,
                                  fontSize: 14.0,
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
                                  color: subtitleColor,
                                  fontSize: 11.5,
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Right: Clean, native badge + button
                        const SizedBox(width: 8),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (isSub) ...[
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFFE11D48).withValues(alpha: 0.20)
                                      : const Color(0xFFFFE4E6),
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(
                                    color: isDark
                                        ? const Color(0xFFFB7185).withValues(alpha: 0.40)
                                        : const Color(0xFFFDA4AF),
                                    width: 0.7,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      LucideIcons.zap,
                                      size: 10,
                                      color: isDark
                                          ? const Color(0xFFFB7185)
                                          : const Color(0xFFE11D48),
                                    ),
                                    const SizedBox(width: 3),
                                    Text(
                                      'বাকি ${_toBengaliNumerals(_daysLeft)} দিন',
                                      style: TextStyle(
                                        fontFamily: 'HindSiliguri',
                                        fontSize: 9.5,
                                        fontWeight: FontWeight.w600,
                                        color: isDark
                                            ? const Color(0xFFFB7185)
                                            : const Color(0xFFE11D48),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 4),
                            ],
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: actionBtnBg,
                                borderRadius: BorderRadius.circular(14),
                                boxShadow: [
                                  BoxShadow(
                                    color: actionBtnBg.withValues(alpha: isDark ? 0.30 : 0.15),
                                    blurRadius: 5,
                                    offset: const Offset(0, 2),
                                  ),
                                ],
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    isSub ? 'প্রো দেখুন' : 'রেফার',
                                    style: TextStyle(
                                      fontFamily: 'HindSiliguri',
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: actionBtnTextColor,
                                    ),
                                  ),
                                  const SizedBox(width: 3),
                                  Icon(
                                    LucideIcons.arrowRight,
                                    size: 11,
                                    color: actionBtnTextColor,
                                  ),
                                ],
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
                top: 7,
                right: 8,
                child: GestureDetector(
                  onTap: _isClosing ? null : _handleDismiss,
                  behavior: HitTestBehavior.opaque,
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      color: dismissBg,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.close_rounded,
                      size: 13,
                      color: dismissIconColor,
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

