import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'package:shared_preferences/shared_preferences.dart';

import 'core/services/download_notification_service.dart';
import 'core/theme/app_theme.dart';
import 'core/router.dart';
import 'core/providers/shared_prefs_provider.dart';
import 'core/providers/theme_provider.dart';
import 'core/providers/app_config_provider.dart';
import 'core/presentation/screens/force_update_screen.dart';
import 'core/presentation/screens/maintenance_screen.dart';
import 'core/presentation/widgets/offline_banner_wrapper.dart';
import 'features/notifications/services/notification_service.dart';
import 'core/providers/auth_provider.dart';
import 'services/session_monitor_service.dart';
import 'services/anti_piracy_service.dart';
import 'core/services/shake_feedback_service.dart';
import 'core/services/device_security_service.dart';
import 'core/presentation/screens/device_blocked_screen.dart';

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
    return Material(
      color: Colors.transparent,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.warning_amber_rounded, color: Colors.amber, size: 36),
              const SizedBox(height: 8),
              const Text(
                'একটি অপ্রত্যাশিত ত্রুটি হয়েছে। পেজটি পুনরায় লোড করুন।',
                style: TextStyle(fontSize: 13, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
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

  runApp(
    ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
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
    ShakeFeedbackService().initialize();
    WidgetsBinding.instance.addPostFrameCallback((_) {
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
    ShakeFeedbackService().stop();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      ShakeFeedbackService().initialize();
      final user = Supabase.instance.client.auth.currentUser;
      if (user != null) {
        SessionMonitorService.checkSessionSync(
          user.id,
          () async => ref.read(authProvider.notifier).signOut(),
        );
      }
      final isSecureEnabled = ref.read(isScreenshotProtectionEnabledProvider);
      AntiPiracyService.setProtection(isSecureEnabled);
    } else if (state == AppLifecycleState.paused) {
      ShakeFeedbackService().stop();
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
              fontFamily: 'HindSiliguri',
              fontFamilyFallback: ['HindSiliguri', 'sans-serif'],
            ),
            child: OfflineBannerWrapper(
              child: child ?? const SizedBox.shrink(),
            ),
          ),
        );
      },
    );
  }
}
