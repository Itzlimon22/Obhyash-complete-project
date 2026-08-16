import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../features/dashboard/presentation/dashboard_view.dart';
import '../features/auth/presentation/login_view.dart';
import '../features/auth/presentation/update_password_view.dart';

import '../features/auth/presentation/signup_view.dart';
import '../features/auth/presentation/welcome_view.dart';
import '../features/profile/presentation/profile_route_view.dart';
import '../features/profile/presentation/profile_stats_page.dart';
import '../features/subscription/presentation/subscription_view.dart';
import '../features/subscription/presentation/my_subscription_view.dart';
import '../features/complaint/presentation/complaint_view.dart';
import '../features/reports/presentation/student_report_view.dart';
import '../features/user_profile/presentation/user_profile_view.dart';
import '../features/subject_report/presentation/subject_report_view.dart';
import '../features/profile/presentation/about_us_view.dart';
import '../features/profile/presentation/privacy_policy_view.dart';
import '../features/profile/presentation/terms_conditions_view.dart';
import '../features/profile/presentation/faq_view.dart';
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
import '../features/live_exam/presentation/live_exam_details_view.dart';
import '../features/live_exam/presentation/live_exam_session_view.dart';
import '../features/live_exam/presentation/live_exam_solution_view.dart';
import '../features/live_exam/presentation/live_exam_leaderboard_view.dart';
import '../features/live_exam/domain/models.dart';
import '../features/profile/presentation/bookmarks_view.dart';
import '../features/formulas/presentation/subjects/formula_subjects_view.dart';
import '../features/formulas/presentation/chapters/formula_chapters_view.dart';
import '../features/formulas/presentation/detail/formula_detail_view.dart';
import 'presentation/main_layout.dart';
import 'services/deep_link_service.dart';

CustomTransitionPage _fadeRoute(Widget child, GoRouterState state) {
  return CustomTransitionPage(
    key: state.pageKey,
    child: child,
    transitionDuration: const Duration(milliseconds: 300),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      return FadeTransition(
        opacity: CurveTween(curve: Curves.easeOut).animate(animation),
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.03, 0.0),
            end: Offset.zero,
          ).animate(CurvedAnimation(
            parent: animation,
            curve: Curves.easeOutCubic,
          )),
          child: child,
        ),
      );
    },
  );
}

// Global navigator keys
final _rootNavigatorKey = GlobalKey<NavigatorState>();

final routerProvider = Provider<GoRouter>((ref) {
  final authStateStream = Supabase.instance.client.auth.onAuthStateChange;
  late final GoRouter router;

  authStateStream.listen((data) {
    if (data.event == AuthChangeEvent.passwordRecovery) {
      // Delay slightly to ensure GoRouter is fully mounted
      Future.delayed(const Duration(milliseconds: 100), () {
        router.go('/update-password');
      });
    }
  });

  router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    refreshListenable: _GoRouterRefreshStream(authStateStream),
    redirect: (context, state) {
      final session = Supabase.instance.client.auth.currentSession;
      final isAuth = session != null;
      final isLoggingIn =
          state.matchedLocation == '/login' ||
          state.matchedLocation == '/signup' ||
          state.matchedLocation == '/welcome';
      final isUpdatingPassword = state.matchedLocation == '/update-password';

      if (!isAuth && !isLoggingIn && !isUpdatingPassword) {
        return '/welcome';
      }
      if (isAuth && isLoggingIn) {
        return '/';
      }
      return null;
    },
    routes: [
      GoRoute(
        path: '/welcome',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeRoute(const WelcomeView(), state),
      ),
      GoRoute(
        path: '/update-password',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) => _fadeRoute(const UpdatePasswordView(), state),
      ),
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
        path: '/live_exam_details/:id',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final examId = state.pathParameters['id']!;
          final exam = state.extra as LiveExam?;
          return _fadeRoute(
            LiveExamDetailsView(examId: examId, preloadedExam: exam),
            state,
          );
        },
      ),
      GoRoute(
        path: '/live_exam_session/:id',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final examId = state.pathParameters['id']!;
          final exam = state.extra as LiveExam?;
          return _fadeRoute(
            LiveExamSessionView(examId: examId, exam: exam),
            state,
          );
        },
      ),
      GoRoute(
        path: '/live_exam_solution/:id',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final examId = state.pathParameters['id']!;
          final exam = state.extra as LiveExam?;
          return _fadeRoute(
            LiveExamSolutionView(examId: examId, exam: exam),
            state,
          );
        },
      ),
      GoRoute(
        path: '/live_exam_leaderboard/:id',
        parentNavigatorKey: _rootNavigatorKey,
        pageBuilder: (context, state) {
          final examId = state.pathParameters['id']!;
          final exam = state.extra as LiveExam?;
          return _fadeRoute(
            LiveExamLeaderboardView(examId: examId, exam: exam),
            state,
          );
        },
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
                pageBuilder: (context, state) =>
                    _fadeRoute(const DashboardView(), state),
                routes: [
                  GoRoute(
                    path: 'notifications',
                    builder: (context, state) => const NotificationsView(),
                  ),
                  GoRoute(
                    path: 'bookmarks',
                    builder: (context, state) => const BookmarksView(),
                  ),
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
                    path: 'live_exam',
                    builder: (context, state) =>
                        const LiveExamCategoryView(category: 'hsc'),
                    routes: [
                      GoRoute(
                        path: ':category',
                        builder: (context, state) {
                          final category =
                              state.pathParameters['category'] ?? 'hsc';
                          return LiveExamCategoryView(category: category);
                        },
                      ),
                    ],
                  ),
                  GoRoute(
                    path: 'formulas',
                    builder: (context, state) => const FormulaSubjectsView(),
                    routes: [
                      GoRoute(
                        path: ':subjectId',
                        builder: (context, state) {
                          final subjectId = state.pathParameters['subjectId']!;
                          return FormulaChaptersView(subjectId: subjectId);
                        },
                        routes: [
                          GoRoute(
                            path: ':chapterId',
                            builder: (context, state) {
                              final subjectId = state.pathParameters['subjectId']!;
                              final chapterId = state.pathParameters['chapterId']!;
                              return FormulaDetailView(
                                subjectId: subjectId,
                                chapterId: chapterId,
                              );
                            },
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),

          // Branch 1: History tab
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/history',
                pageBuilder: (context, state) =>
                    _fadeRoute(const ExamHistoryView(), state),
              ),
            ],
          ),

          // Branch 2: Setup (Mock Exam tab)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/setup',
                pageBuilder: (context, state) =>
                    _fadeRoute(const ExamSetupView(), state),
              ),
            ],
          ),

          // Branch 3: Leaderboard tab
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/leaderboard',
                pageBuilder: (context, state) =>
                    _fadeRoute(const LeaderboardView(), state),
                routes: [
                  GoRoute(
                    path: 'user-profile/:userId',
                    builder: (context, state) {
                      final userId = state.pathParameters['userId']!;
                      return UserProfileView(userId: userId);
                    },
                  ),
                ],
              ),
            ],
          ),

          // Branch 4: Profile / Drawer items (Hidden from bottom nav, accessible via menu)
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/profile',
                pageBuilder: (context, state) =>
                    _fadeRoute(const ProfileRouteView(), state),
                routes: [
                  GoRoute(
                    path: 'stats',
                    builder: (context, state) => const ProfileStatsPage(),
                  ),
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
                    path: 'privacy',
                    builder: (context, state) => const PrivacyPolicyView(),
                  ),
                  GoRoute(
                    path: 'terms',
                    builder: (context, state) => const TermsConditionsView(),
                  ),
                  GoRoute(
                    path: 'faq',
                    builder: (context, state) => const FaqView(),
                  ),
                  GoRoute(
                    path: 'blog',
                    builder: (context, state) => const BlogView(),
                  ),
                  GoRoute(
                    path: 'referral',
                    builder: (context, state) => const ReferralView(),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

  // Initialize DeepLinkService after router is created
  DeepLinkService().init(router);

  return router;
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
