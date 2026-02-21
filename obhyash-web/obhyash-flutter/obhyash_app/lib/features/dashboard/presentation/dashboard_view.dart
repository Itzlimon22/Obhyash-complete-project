import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'widgets/dashboard_action_card.dart';
import 'widgets/dashboard_leaderboard_card.dart';
import 'widgets/subject_stat_card.dart';
import '../providers/dashboard_providers.dart';
import '../domain/models.dart';

class DashboardView extends ConsumerWidget {
  const DashboardView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final subjectStatsAsync = ref.watch(dashboardSubjectStatsProvider);
    final leaderboardAsync = ref.watch(leaderboardProvider);
    final userProfileAsync = ref.watch(userProfileProvider);

    final subjects = subjectStatsAsync.when(
      data: (data) => data,
      loading: () => <SubjectStats>[],
      error: (_, __) => <SubjectStats>[],
    );

    final leaderboard = leaderboardAsync.when(
      data: (data) => data,
      loading: () => <LeaderboardUser>[],
      error: (_, __) => <LeaderboardUser>[],
    );

    final currentUser = userProfileAsync.when(
      data: (user) => LeaderboardUser(
        id: user?.id ?? '',
        name: user?.name ?? 'Loading...',
        xp: user?.xp ?? 0,
      ),
      loading: () => LeaderboardUser(id: '', name: 'Loading...', xp: 0),
      error: (_, __) => LeaderboardUser(id: '', name: 'Error', xp: 0),
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

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Actions Grid (Mock Exam, History, Leaderboard, Analysis)
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              DashboardActionCard(
                title: 'মক পরীক্ষা',
                icon: LucideIcons.fileEdit,
                primaryColor: const Color(0xFFE11D48), // rose-600
                lightColor: const Color(0xFFFFE4E6), // rose-100
                onTap: () => context.go('/setup'),
              ),
              DashboardActionCard(
                title: 'ইতিহাস',
                icon: LucideIcons.clock,
                primaryColor: const Color(0xFF525252), // neutral-600
                lightColor: const Color(0xFFF5F5F5), // neutral-100
                onTap: () => context.go('/history'),
              ),
              DashboardActionCard(
                title: 'লিডারবোর্ড',
                icon: LucideIcons.trophy,
                primaryColor: const Color(0xFFD97706), // amber-600
                lightColor: const Color(0xFFFEF3C7), // amber-100
                onTap: () => context.go('/leaderboard'),
              ),
              DashboardActionCard(
                title: 'এনালাইসিস',
                icon: LucideIcons.pieChart,
                primaryColor: const Color(0xFF059669), // emerald-600
                lightColor: const Color(0xFFD1FAE5), // emerald-100
                onTap: () => context.go('/analysis'),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // 2. Leaderboard Card
          DashboardLeaderboardCard(
            currentUser: currentUser,
            userRank: userRank,
            topUser: topUser,
            xpDiff: xpDiff,
            onLeaderboardClick: () => context.go('/leaderboard'),
          ),
          const SizedBox(height: 24),

          // 3. Subject Stats List
          SubjectStatCard(
            data: subjects,
            isLoading: isLoading,
            onSubjectClick: (subjectId) {
              context.go('/analysis');
            },
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
