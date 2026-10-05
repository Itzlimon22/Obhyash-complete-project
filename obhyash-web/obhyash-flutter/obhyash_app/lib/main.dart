import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:shared_preferences/shared_preferences.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'core/services/download_notification_service.dart';
import 'core/services/in_app_update_service.dart';
import 'core/theme/app_theme.dart';
import 'core/router.dart';
import 'core/providers/shared_prefs_provider.dart';
import 'core/providers/theme_provider.dart';
import 'core/providers/app_config_provider.dart';
import 'core/presentation/screens/force_update_screen.dart';
import 'core/presentation/screens/maintenance_screen.dart';
import 'core/presentation/widgets/offline_banner_wrapper.dart';
import 'core/presentation/widgets/theme_animation_wrapper.dart';
import 'features/notifications/services/notification_service.dart';
import 'core/providers/auth_provider.dart';
import 'services/session_monitor_service.dart';
import 'services/anti_piracy_service.dart';
import 'core/services/device_security_service.dart';
import 'core/presentation/screens/device_blocked_screen.dart';
import 'features/subscription/services/in_app_purchase_service.dart';
import 'core/utils/global_refresh.dart';
import 'package:go_router/go_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ── Global Production Crash Guard ──
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint('[GlobalFlutterError] ${details.exceptionAsString()}');
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    debugPrint('[GlobalPlatformError] $error');
    // Return true to mark error as handled and avoid crashing app process in production
    return true;
  };

  ErrorWidget.builder = (FlutterErrorDetails details) {
    return _GlobalErrorRecoveryWidget(details: details);
  };

  // Initialize SharedPreferences
  final prefs = await SharedPreferences.getInstance();

  // Initialize Download Notifications
  await DownloadNotificationService().init();

  // Initialize Notification Service (Channels & Engine)
  final notifService = NotificationService();
  await notifService.initialize();

  // Initialize Supabase with real keys
  await Supabase.initialize(
    url: 'https://ufeepgzheopyaefuyegg.supabase.co',
    publishableKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZWVwZ3poZW9weWFlZnV5ZWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTA0MDYsImV4cCI6MjA4NDcyNjQwNn0.39zdLZJDNw0RM2PeY1oM_RxvjtRd1DGqmEVFSqbw9fc',

    authOptions: const FlutterAuthClientOptions(
      authFlowType: AuthFlowType.pkce,
    ),
  );

  // Initialize Google Play In-App Purchase
  unawaited(InAppPurchaseService().initialize());

  // Retrieve current app version details dynamically (with safe fallback)
  PackageInfo? packageInfo;
  try {
    packageInfo = await PackageInfo.fromPlatform();
  } catch (e) {
    debugPrint('[Main] packageInfo init skipped: $e');
  }

  runApp(
    ProviderScope(
      overrides: [
        sharedPreferencesProvider.overrideWithValue(prefs),
        if (packageInfo != null)
          packageInfoProvider.overrideWithValue(packageInfo),
      ],
      child: const ObhyashApp(),
    ),
  );
}

class ObhyashApp extends ConsumerStatefulWidget {
  const ObhyashApp({super.key});

  @override
  ConsumerState<ObhyashApp> createState() => _ObhyashAppState();
}

class _ObhyashAppState extends ConsumerState<ObhyashApp> with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // 1. Google Play Immediate / In-App Update Check
      InAppUpdateService.checkForImmediateUpdate();

      final isEnabled = ref.read(isScreenshotProtectionEnabledProvider);
      AntiPiracyService.setProtection(isEnabled);

      // Handle cold start notification tap: opens app and takes user to dashboard / target
      final pending = NotificationService.initialPendingRoute;
      if (pending != null && pending.isNotEmpty) {
        NotificationService.initialPendingRoute = null;
        Future.delayed(const Duration(milliseconds: 600), () {
          if (!mounted) return;
          final target = (pending != '/') ? pending : '/dashboard';
          try {
            ref.read(routerProvider).go(target);
          } catch (_) {
            ref.read(routerProvider).push(target);
          }
        });
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // 1. Re-check or resume in-app update if user switched apps
      InAppUpdateService.checkForImmediateUpdate();

      // 2. Safe background-to-foreground session & state recovery
      _handleAppResume();

      // 3. Screen protection
      final isSecureEnabled = ref.read(isScreenshotProtectionEnabledProvider);
      AntiPiracyService.setProtection(isSecureEnabled);
    }
  }

  Future<void> _handleAppResume() async {
    try {
      final auth = Supabase.instance.client.auth;
      final session = auth.currentSession;
      if (session != null) {
        final now = DateTime.now().toUtc();
        final expiresAt = session.expiresAt != null
            ? DateTime.fromMillisecondsSinceEpoch(session.expiresAt! * 1000, isUtc: true)
            : null;
        final isNearExpiry = expiresAt == null || expiresAt.isBefore(now.add(const Duration(minutes: 5)));

        if (isNearExpiry || session.isExpired) {
          debugPrint('[Main] 🔄 Session expired or near expiry on resume. Refreshing session...');
          try {
            await auth.refreshSession();
            debugPrint('[Main] ✅ Session successfully refreshed on resume.');
          } catch (e) {
            debugPrint('[Main] ⚠️ Session refresh error on resume: $e');
          }
        }

        // Verify single device session lock
        SessionMonitorService.checkSessionSync(
          session.user.id,
          () async => ref.read(authProvider.notifier).signOut(),
        );

        // Auto-refresh stale dashboard & user providers seamlessly
        try {
          globalRefresh(ref);
        } catch (e) {
          debugPrint('[Main] globalRefresh on resume error: $e');
        }
      }
    } catch (e) {
      debugPrint('[Main] _handleAppResume error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    // Dynamically sync FLAG_SECURE on native window when admin toggles it in real-time
    ref.listen<bool>(isScreenshotProtectionEnabledProvider, (prev, isEnabled) {
      AntiPiracyService.setProtection(isEnabled);
    });

    final router = ref.watch(routerProvider);
    NotificationService.onNotificationTapped = (route) {
      final target = (route.isNotEmpty && route != '/') ? route : '/dashboard';
      try {
        router.go(target);
      } catch (_) {
        router.push(target);
      }
    };
    final themeMode = ref.watch(themeModeProvider);
    final configAsync = ref.watch(appConfigStreamProvider);
    final isForceUpdate = ref.watch(isForceUpdateRequiredProvider);

    return MaterialApp.router(
      title: 'Obhyash',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      themeAnimationDuration: const Duration(milliseconds: 380),
      themeAnimationCurve: Curves.easeInOutCubic,
      routerConfig: router,
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        // 0. Hardware / Persistent Device Block Screen
        final deviceBlockAsync = ref.watch(deviceBlockStreamProvider);
        if (deviceBlockAsync.value?.isBlocked == true) {
          return DeviceBlockedScreen(
            deviceId: deviceBlockAsync.value?.deviceId,
            reason: deviceBlockAsync.value?.reason,
          );
        }

        // 1. Force Update Screen
        if (isForceUpdate) {
          final minVersion = configAsync.value?.minAppVersion ?? '1.0.0';
          final updateUrl = configAsync.value?.updateUrl ??
              'https://play.google.com/store/apps/details?id=com.obhyash.app';
          return ForceUpdateScreen(
            minVersion: minVersion,
            updateUrl: updateUrl,
          );
        }

        // 2. Server Maintenance Screen
        final isMaintenance = configAsync.value?.maintenanceMode ?? false;
        if (isMaintenance) {
          final message = configAsync.value?.maintenanceMessage ??
              'অভ্যাস প্ল্যাটফর্মের নিয়মিত রক্ষণাবেক্ষণ চলছে। শীঘ্রই আমরা ফিরে আসছি।';
          return MaintenanceScreen(
            message: message,
            onRetry: () => ref.refresh(appConfigStreamProvider),
          );
        }

        final mediaQuery = MediaQuery.of(context);
        return MediaQuery(
          data: mediaQuery.copyWith(
            textScaler: mediaQuery.textScaler.clamp(
              maxScaleFactor: 2.0,
            ),
          ),
          child: DefaultTextStyle.merge(
            style: const TextStyle(
              fontFamilyFallback: ['HindSiliguri', 'sans-serif'],
            ),
            child: ThemeAnimationWrapper(
              child: OfflineBannerWrapper(
                child: child ?? const SizedBox.shrink(),
              ),
            ),
          ),
        );
      },
    );
  }
}

/// Robust Production Crash Recovery Screen with Actionable Reload Button
class _GlobalErrorRecoveryWidget extends StatelessWidget {
  final FlutterErrorDetails details;

  const _GlobalErrorRecoveryWidget({required this.details});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: const Color(0xFF0F172A),
      child: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(
                    color: Colors.amber.withValues(alpha: 0.15),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.warning_amber_rounded,
                    color: Colors.amber,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'একটি অপ্রত্যাশিত ত্রুটি হয়েছে',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'অ্যাপটি দীর্ঘক্ষণ ব্যাকগ্রাউন্ডে থাকার কারণে সেশন রিসেট প্রয়োজন হতে পারে। অনুগ্রহ করে নিচের বাটনে চাপ দিন।',
                  style: TextStyle(
                    fontSize: 12.5,
                    color: Color(0xFF94A3B8),
                    height: 1.4,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),
                ElevatedButton.icon(
                  onPressed: () async {
                    try {
                      final auth = Supabase.instance.client.auth;
                      await auth.refreshSession();
                    } catch (_) {}

                    final ctx = rootNavigatorKey.currentContext;
                    if (ctx != null && ctx.mounted) {
                      try {
                        GoRouter.of(ctx).go('/');
                      } catch (_) {
                        Navigator.of(ctx).pushNamedAndRemoveUntil('/', (route) => false);
                      }
                    }
                  },
                  icon: const Icon(Icons.refresh_rounded, size: 18),
                  label: const Text(
                    'পেজটি পুনরায় লোড করুন',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF3B82F6),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
