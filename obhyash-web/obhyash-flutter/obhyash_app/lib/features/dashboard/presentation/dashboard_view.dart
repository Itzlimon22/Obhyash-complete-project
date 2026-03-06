import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

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
          // 1. Actions Grid — 6 cards, 3-column (matches web)
          GridView.count(
            crossAxisCount: 3,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.92,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            children: [
              DashboardActionCard(
                title: 'মক পরীক্ষা',
                icon: LucideIcons.fileEdit,
                primaryColor: const Color(0xFF047857), // emerald-700
                lightColor: const Color(0xFFECFDF5), // emerald-50
                onTap: () => context.go('/setup'),
              ),
              DashboardActionCard(
                title: 'অনুশীলন',
                icon: LucideIcons.bookOpen,
                primaryColor: const Color(0xFF047857), // emerald-700
                lightColor: const Color(0xFFECFDF5), // emerald-50
                onTap: () => context.go('/practice'),
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
                primaryColor: const Color(0xFF047857), // emerald-700
                lightColor: const Color(0xFFECFDF5), // emerald-50
                onTap: () => context.go('/leaderboard'),
              ),
              DashboardActionCard(
                title: 'এনালাইসিস',
                icon: LucideIcons.pieChart,
                primaryColor: const Color(0xFF047857), // emerald-700
                lightColor: const Color(0xFFECFDF5), // emerald-50
                onTap: () => context.go('/analysis'),
              ),
              DashboardActionCard(
                title: 'ব্লগ',
                icon: LucideIcons.newspaper,
                primaryColor: const Color(0xFF047857), // emerald-700
                lightColor: const Color(0xFFECFDF5), // emerald-50
                onTap: () => launchUrl(
                  Uri.parse('https://obhyash.com/blog'),
                  mode: LaunchMode.externalApplication,
                ),
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
              context.go('/subject/$subjectId');
            },
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
