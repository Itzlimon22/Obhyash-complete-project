import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import 'widgets/dashboard_action_card.dart';
import 'widgets/daily_streak_card.dart';
import 'widgets/dashboard_leaderboard_card.dart';
import 'widgets/subject_stat_card.dart';
import 'widgets/exam_target_modal.dart';
import 'widgets/live_exam_slider.dart';
import '../providers/dashboard_providers.dart';
import '../domain/models.dart';
import '../services/streak_service.dart';

class DashboardView extends ConsumerStatefulWidget {
  const DashboardView({super.key});

  @override
  ConsumerState<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends ConsumerState<DashboardView> {
  bool _hasCheckedExamTarget = false;
  bool _hasCheckedStreak = false;

  @override
  void initState() {
    super.initState();
  }

  void _checkExamTarget(UserProfile? user) {
    if (_hasCheckedExamTarget || user == null) return;
    _hasCheckedExamTarget = true;
    if (user.examTarget == null) {
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        if (!mounted) return;
        final result = await showExamTargetModal(context);
        if (result != null && mounted) {
          ref.invalidate(userProfileProvider);
        }
      });
    }
  }

  void _checkStreak(UserProfile? user) {
    if (_hasCheckedStreak || user == null) return;
    _hasCheckedStreak = true;
    StreakService.checkAndUpdateStreak(user.id).then((_) {
      if (mounted) {
        ref.invalidate(userProfileProvider);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final subjectStatsAsync = ref.watch(dashboardSubjectStatsProvider);
    final leaderboardAsync = ref.watch(leaderboardProvider);
    final userProfileAsync = ref.watch(userProfileProvider);

    final userProfile = userProfileAsync.value;
    _checkExamTarget(userProfile);
    _checkStreak(userProfile);

    final subjects = subjectStatsAsync.when(
      data: (data) => data,
      loading: () => <SubjectStats>[],
      error: (_, _) => <SubjectStats>[],
    );

    final leaderboard = leaderboardAsync.when(
      data: (data) => data,
      loading: () => <LeaderboardUser>[],
      error: (_, _) => <LeaderboardUser>[],
    );

    final currentUser = userProfileAsync.when(
      data: (user) => LeaderboardUser(
        id: user?.id ?? '',
        name: user?.name ?? 'Loading...',
        xp: user?.xp ?? 0,
      ),
      loading: () => LeaderboardUser(id: '', name: 'Loading...', xp: 0),
      error: (_, _) => LeaderboardUser(id: '', name: 'Error', xp: 0),
    );

    int userRank = 0;
    if (leaderboard.isNotEmpty && currentUser.id.isNotEmpty) {
      userRank = leaderboard.indexWhere((u) => u.id == currentUser.id) + 1;
    }

    LeaderboardUser? topUser = leaderboard.isNotEmpty
        ? leaderboard.first
        : null;
    int xpDiff = topUser != null
        ? (topUser.xp - currentUser.xp).clamp(0, 999999)
        : 0;
    final isLoading = subjectStatsAsync.isLoading;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return CustomScrollView(
      slivers: [
        // 1. Clean Minimalist Header (Live Exam Slider)
        const SliverToBoxAdapter(
          child: LiveExamSlider(),
        ),

        // 2. Main Content inside SliverToBoxAdapter
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Actions Grid
                GridView.count(
                  crossAxisCount: 3,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.15, // Increased aspect ratio to reduce box height
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children:
                      [
                            DashboardActionCard(
                              title: 'মক পরীক্ষা',
                              icon: LucideIcons.fileEdit,
                              primaryColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF27272A),
                              lightColor: isDark
                                  ? const Color(0x3327272A)
                                  : const Color(0xFFF4F4F5),
                              onTap: () => context.go('/setup'),
                            ),
                            DashboardActionCard(
                              title: 'অনুশীলন',
                              icon: LucideIcons.bookOpen,
                              primaryColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF27272A),
                              lightColor: isDark
                                  ? const Color(0x3327272A)
                                  : const Color(0xFFF4F4F5),
                              onTap: () => context.go('/practice'),
                            ),
                            DashboardActionCard(
                              title: 'ইতিহাস',
                              icon: LucideIcons.clock,
                              primaryColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF27272A),
                              lightColor: isDark
                                  ? const Color(0x3327272A)
                                  : const Color(0xFFF4F4F5),
                              onTap: () => context.go('/history'),
                            ),
                            DashboardActionCard(
                              title: 'লিডারবোর্ড',
                              icon: LucideIcons.trophy,
                              primaryColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF27272A),
                              lightColor: isDark
                                  ? const Color(0x3327272A)
                                  : const Color(0xFFF4F4F5),
                              onTap: () => context.go('/leaderboard'),
                            ),
                            DashboardActionCard(
                              title: 'এনালাইসিস',
                              icon: LucideIcons.pieChart,
                              primaryColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF27272A),
                              lightColor: isDark
                                  ? const Color(0x3327272A)
                                  : const Color(0xFFF4F4F5),
                              onTap: () => context.go('/analysis'),
                            ),
                            DashboardActionCard(
                              title: 'বুকমার্কস',
                              icon: LucideIcons.bookmark,
                              primaryColor: isDark ? const Color(0xFFE4E4E7) : const Color(0xFF27272A),
                              lightColor: isDark
                                  ? const Color(0x3327272A)
                                  : const Color(0xFFF4F4F5),
                              onTap: () => context.go('/bookmarks'),
                            ),
                          ]
                          .animate(interval: 50.ms)
                          .fadeIn(duration: 400.ms)
                          .slideY(
                            begin: 0.1,
                            duration: 400.ms,
                            curve: Curves.easeOut,
                          ),
                ),
                const SizedBox(height: 24),

                DailyStreakCard(userStreak: userProfile?.streakCount ?? 0)
                    .animate(delay: 150.ms)
                    .fadeIn(duration: 400.ms)
                    .slideY(
                      begin: 0.05,
                      duration: 400.ms,
                      curve: Curves.easeOut,
                    ),

                const SizedBox(height: 24),

                // Subject Stats List
                SubjectStatCard(
                      data: subjects,
                      isLoading: isLoading,
                      onSubjectClick: (subjectId) {
                        context.go('/subject/$subjectId');
                      },
                    )
                    .animate(delay: 200.ms)
                    .fadeIn(duration: 400.ms)
                    .slideY(
                      begin: 0.05,
                      duration: 400.ms,
                      curve: Curves.easeOut,
                    ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
