import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';
import 'package:student_app/pages/login_page.dart';
import 'package:student_app/pages/home_page.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

// ✅ GLOBAL THEME CONTROLLER
// Access this from ANY page: MyApp.themeNotifier.value = ThemeMode.dark;
class ThemeNotifier {
  static final ValueNotifier<ThemeMode> themeMode = ValueNotifier(
    ThemeMode.dark,
  );
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url:
        'https://ufeepgzheopyaefuyegg.supabase.co', // ⚠️ KEEP YOUR EXISTING URL
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmZWVwZ3poZW9weWFlZnV5ZWdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNTA0MDYsImV4cCI6MjA4NDcyNjQwNn0.39zdLZJDNw0RM2PeY1oM_RxvjtRd1DGqmEVFSqbw9fc', // ⚠️ KEEP YOUR EXISTING KEY
  );

  runApp(const MyApp());
}

final supabase = Supabase.instance.client;

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // Wrap MaterialApp in ValueListenableBuilder so it rebuilds when theme changes
    return ValueListenableBuilder<ThemeMode>(
      valueListenable: ThemeNotifier.themeMode,
      builder: (context, currentMode, child) {
        return MaterialApp(
          title: 'Better Chorcha',
          debugShowCheckedModeBanner: false,

          // 1. Define Light Theme
          theme: AppTheme.lightTheme,

          // 2. Define Dark Theme
          darkTheme: AppTheme.darkTheme,

          // 3. Tell Flutter which one to use right now
          themeMode: currentMode,

          home: StreamBuilder<AuthState>(
            stream: Supabase.instance.client.auth.onAuthStateChange,
            builder: (context, snapshot) {
              final session = snapshot.data?.session;
              // Keep checking session locally if stream is waiting, or use the stream data
              final hasSession =
                  session != null ||
                  Supabase.instance.client.auth.currentSession != null;

              if (hasSession) {
                return const HomePage();
              } else {
                return const LoginPage();
              }
            },
          ),
        );
      },
    );
  }
}
