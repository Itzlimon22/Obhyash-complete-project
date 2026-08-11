import os

content = """import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../features/dashboard/presentation/dashboard_view.dart';
import '../features/auth/presentation/login_view.dart';
import '../features/auth/presentation/signup_view.dart';
import '../features/profile/presentation/profile_route_view.dart';
import '../features/subscription/presentation/subscription_view.dart';
import '../features/subscription/presentation/my_subscription_view.dart';
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
import '../features/notifications/presentation/notifications_view.dart';
import '../features/blog/presentation/blog_view.dart';
import '../features/referral/presentation/referral_view.dart';
import '../features/live_exam/presentation/live_exam_category_view.dart';
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

// Global navigator keys
final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final authStateStream = Supabase.instance.client.auth.onAuthStateChange;

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
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
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeRoute(const LoginView(), state),
      ),
      GoRoute(
        path: '/signup',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeRoute(const SignupView(), state),
      ),
      GoRoute(
        path: '/exam',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) =>
            _fadeRoute(const ExamRunnerView(), state),
      ),
      GoRoute(
        path: '/notifications',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) =>
            _fadeRoute(const NotificationsView(), state),
      ),
      
      // Stateful shell route for bottom tabs and drawer items
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainLayout(navigationShell: navigationShell);
        },
        branches: [
          // Branch 0: Dashboard (Home tab)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/',
                pageBuilder: (context, state) => _fadeRoute(const DashboardView(), state),
                routes: [
                  GoRoute(
                    path: 'practice',
                    builder: (context, state) => const PracticeDashboard(),
                  ),
                  GoRoute(
                    path: 'analysis',
                    builder: (context, state) => const AnalysisView(),
                  ),
                  GoRoute(
                    path: 'my-reports',
                    builder: (context, state) => const StudentReportView(),
                  ),
                  GoRoute(
                    path: 'subject/:subject',
                    builder: (context, state) {
                      final subject = state.pathParameters['subject']!;
                      return SubjectReportView(subject: subject);
                    },
                  ),
                  GoRoute(
                    path: 'live_exam/:category',
                    builder: (context, state) {
                      final category = state.pathParameters['category']!;
                      return LiveExamCategoryView(category: category);
                    },
                  ),
                ]
              ),
            ],
          ),
          
          // Branch 1: History tab
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/history',
                pageBuilder: (context, state) => _fadeRoute(const ExamHistoryView(), state),
              ),
            ],
          ),
          
          // Branch 2: Setup (Mock Exam tab)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/setup',
                pageBuilder: (context, state) => _fadeRoute(const ExamSetupView(), state),
              ),
            ],
          ),
          
          // Branch 3: Leaderboard tab
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/leaderboard',
                pageBuilder: (context, state) => _fadeRoute(const LeaderboardView(), state),
                routes: [
                  GoRoute(
                    path: 'user-profile/:userId',
                    builder: (context, state) {
                      final userId = state.pathParameters['userId']!;
                      return UserProfileView(userId: userId);
                    },
                  ),
                ]
              ),
            ],
          ),
          
          // Branch 4: Profile / Drawer items (Hidden from bottom nav, accessible via menu)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                pageBuilder: (context, state) => _fadeRoute(const ProfileRouteView(), state),
                routes: [
                  GoRoute(
                    path: 'subscription',
                    builder: (context, state) => const SubscriptionView(),
                  ),
                  GoRoute(
                    path: 'my-subscription',
                    builder: (context, state) => const MySubscriptionView(),
                  ),
                  GoRoute(
                    path: 'complaint',
                    builder: (context, state) => const ComplaintView(),
                  ),
                  GoRoute(
                    path: 'about',
                    builder: (context, state) => const AboutUsView(),
                  ),
                  GoRoute(
                    path: 'blog',
                    builder: (context, state) => const BlogView(),
                  ),
                  GoRoute(
                    path: 'referral',
                    builder: (context, state) => const ReferralView(),
                  ),
                ]
              ),
            ]
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
"""

with open("lib/core/router.dart", "w") as f:
    f.write(content)
