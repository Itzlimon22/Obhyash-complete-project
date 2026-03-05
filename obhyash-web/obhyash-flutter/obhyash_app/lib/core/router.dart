import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../features/dashboard/presentation/dashboard_view.dart';
import '../features/auth/presentation/login_view.dart';
import '../features/auth/presentation/signup_view.dart';
import '../features/profile/presentation/profile_route_view.dart';
import '../features/subscription/presentation/subscription_view.dart';
import '../features/complaint/presentation/complaint_view.dart';
import '../features/reports/presentation/student_report_view.dart';
import '../features/user_profile/presentation/user_profile_view.dart';
import '../features/subject_report/presentation/subject_report_view.dart';
import '../features/profile/presentation/about_us_view.dart';
import '../features/leaderboard/presentation/leaderboard_view.dart';
import '../features/analysis/presentation/analysis_view.dart';
import '../features/history/presentation/exam_history_view.dart';
import '../features/practice/presentation/practice_dashboard.dart';
import '../features/exam/presentation/exam_setup_view.dart';
import '../features/exam/presentation/exam_runner_view.dart';
import 'presentation/main_layout.dart';

CustomTransitionPage _fadeRoute(Widget child, GoRouterState state) {
  return CustomTransitionPage(
    key: state.pageKey,
    child: child,
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: CurveTween(curve: Curves.easeOut).animate(animation),
        child: child,
      );
    },
  );
}

final routerProvider = Provider<GoRouter>((ref) {
  final rootNavigatorKey = GlobalKey<NavigatorState>();
  final shellNavigatorKey = GlobalKey<NavigatorState>();

  final authStateStream = Supabase.instance.client.auth.onAuthStateChange;

  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: _GoRouterRefreshStream(authStateStream),
    redirect: (context, state) {
      final session = Supabase.instance.client.auth.currentSession;
      final isAuth = session != null;
      final isLoggingIn =
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/signup';

      if (!isAuth && !isLoggingIn) {
        return '/login';
      }
      if (isAuth && isLoggingIn) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        pageBuilder: (context, state) => _fadeRoute(const LoginView(), state),
      ),
      GoRoute(
        path: '/signup',
        pageBuilder: (context, state) => _fadeRoute(const SignupView(), state),
      ),
      GoRoute(
        path: '/exam',
        pageBuilder: (context, state) =>
            _fadeRoute(const ExamRunnerView(), state),
      ),
      ShellRoute(
        navigatorKey: shellNavigatorKey,
        builder: (context, state, child) {
          return MainLayout(child: child);
        },
        routes: [
          GoRoute(
            path: '/',
            pageBuilder: (context, state) =>
                _fadeRoute(const DashboardView(), state),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) =>
                _fadeRoute(const ProfileRouteView(), state),
          ),
          GoRoute(
            path: '/subscription',
            pageBuilder: (context, state) =>
                _fadeRoute(const SubscriptionView(), state),
          ),
          GoRoute(
            path: '/history',
            pageBuilder: (context, state) =>
                _fadeRoute(const ExamHistoryView(), state),
          ),
          GoRoute(
            path: '/setup',
            pageBuilder: (context, state) =>
                _fadeRoute(const ExamSetupView(), state),
          ),
          GoRoute(
            path: '/practice',
            pageBuilder: (context, state) =>
                _fadeRoute(const PracticeDashboard(), state),
          ),
          GoRoute(
            path: '/leaderboard',
            pageBuilder: (context, state) =>
                _fadeRoute(const LeaderboardView(), state),
          ),
          GoRoute(
            path: '/analysis',
            pageBuilder: (context, state) =>
                _fadeRoute(const AnalysisView(), state),
          ),
          GoRoute(
            path: '/my-reports',
            pageBuilder: (context, state) =>
                _fadeRoute(const StudentReportView(), state),
          ),
          GoRoute(
            path: '/complaint',
            pageBuilder: (context, state) =>
                _fadeRoute(const ComplaintView(), state),
          ),
          GoRoute(
            path: '/about',
            pageBuilder: (context, state) =>
                _fadeRoute(const AboutUsView(), state),
          ),
          GoRoute(
            path: '/user-profile/:userId',
            pageBuilder: (context, state) {
              final userId = state.pathParameters['userId']!;
              return _fadeRoute(UserProfileView(userId: userId), state);
            },
          ),
          GoRoute(
            path: '/subject/:subject',
            pageBuilder: (context, state) {
              final subject = state.pathParameters['subject']!;
              return _fadeRoute(SubjectReportView(subject: subject), state);
            },
          ),
        ],
      ),
    ],
  );
});

class _GoRouterRefreshStream extends ChangeNotifier {
  _GoRouterRefreshStream(Stream<AuthState> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen(
      (AuthState _) => notifyListeners(),
    );
  }

  late final StreamSubscription<AuthState> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}

// Temporary scaffold while we build out the views
class PlaceholderScaffold extends StatelessWidget {
  final String title;
  const PlaceholderScaffold({super.key, required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(
          'Coming Soon: $title',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
      ),
    );
  }
}
