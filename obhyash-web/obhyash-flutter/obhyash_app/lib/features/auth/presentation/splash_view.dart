import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../core/router.dart';

class SplashView extends StatefulWidget {
  const SplashView({super.key});

  @override
  State<SplashView> createState() => _SplashViewState();
}

class _SplashViewState extends State<SplashView>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  // Phase 1: Bounce 2 parts into place (0.0 to 0.44)
  late final Animation<Offset> _arrow1Offset;
  late final Animation<Offset> _arrow2Offset;
  late final Animation<double> _scaleAnimation;
  late final Animation<double> _fadeAnimation;

  // Phase 2: Full 360 degree rotation (0.44 to 0.88)
  late final Animation<double> _spinAnimation;

  Timer? _navigationTimer;
  bool _hasTriggeredHaptic = false;

  // Solid Deepest Green, no gradient
  static const Color _deepestGreen = Color(0xFF071500);

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1450),
    );

    // Phase 1: 0.0 - 0.44 (~640ms) -> 2 parts bounce into place
    const bounceCurve = Interval(0.0, 0.44, curve: Curves.easeOutBack);
    const fadeCurve = Interval(0.0, 0.22, curve: Curves.easeOut);

    _arrow1Offset = Tween<Offset>(
      begin: const Offset(-70, -70),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: bounceCurve));

    _arrow2Offset = Tween<Offset>(
      begin: const Offset(70, 70),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: bounceCurve));

    _scaleAnimation = Tween<double>(
      begin: 0.6,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: bounceCurve));

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(parent: _controller, curve: fadeCurve));

    // Phase 2: 0.44 - 0.88 (~640ms) -> Assembled mark rotates 360 degrees
    _spinAnimation = Tween<double>(
      begin: 0.0,
      end: 2 * math.pi,
    ).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.44, 0.88, curve: Curves.easeInOutCubic),
      ),
    );

    // Tactile haptic feedback when parts lock together
    _controller.addListener(() {
      if (!_hasTriggeredHaptic && _controller.value >= 0.44) {
        _hasTriggeredHaptic = true;
        HapticFeedback.lightImpact();
      }
    });

    // Start animation
    _controller.forward();

    // Schedule navigation after animation finishes
    _scheduleNavigation();
  }

  void _scheduleNavigation() {
    _navigationTimer = Timer(const Duration(milliseconds: 1650), () {
      if (!mounted) return;
      _proceedToApp();
    });
  }

  void _proceedToApp() {
    // Mark cold launch as completed so splash is never shown when resumed from background
    AppLaunchTracker.hasCompletedColdLaunch = true;

    final session = Supabase.instance.client.auth.currentSession;
    if (session != null) {
      context.go('/');
    } else {
      context.go('/welcome');
    }
  }

  @override
  void dispose() {
    _navigationTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: Colors.transparent,
        systemNavigationBarColor: _deepestGreen,
      ),
      child: Scaffold(
        backgroundColor: _deepestGreen, // Solid deepest green, no gradient
        body: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, child) {
              return Opacity(
                opacity: _fadeAnimation.value,
                child: Transform.rotate(
                  angle: _spinAnimation.value,
                  child: Transform.scale(
                    scale: _scaleAnimation.value,
                    child: SizedBox(
                      width: 280,
                      height: 280,
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          // Part 1 (White & Red): Bottom-left wing bounces into place
                          Transform.translate(
                            offset: _arrow1Offset.value,
                            child: SvgPicture.asset(
                              'assets/images/obhyash_arrow_part1.svg',
                              width: 280,
                              height: 280,
                              fit: BoxFit.contain,
                            ),
                          ),

                          // Part 2 (White & Red): Top-right wing bounces into place
                          Transform.translate(
                            offset: _arrow2Offset.value,
                            child: SvgPicture.asset(
                              'assets/images/obhyash_arrow_part2.svg',
                              width: 280,
                              height: 280,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
