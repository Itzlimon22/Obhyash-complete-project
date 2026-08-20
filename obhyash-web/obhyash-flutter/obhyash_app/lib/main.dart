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

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize SharedPreferences
  final prefs = await SharedPreferences.getInstance();

  // Initialize Download Notifications
  await DownloadNotificationService().init();

  // Initialize Notification Service
  final notifService = NotificationService();
  await notifService.initialize();
  await notifService.requestPermission();

  // Initialize Supabase with real keys
  await Supabase.initialize(
    url: 'https://ufeepgzheopyaefuyegg.supabase.co',
    anonKey:
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

class ObhyashApp extends ConsumerWidget {
  const ObhyashApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    NotificationService.onNotificationTapped = (route) {
      router.push(route);
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

        return OfflineBannerWrapper(
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
