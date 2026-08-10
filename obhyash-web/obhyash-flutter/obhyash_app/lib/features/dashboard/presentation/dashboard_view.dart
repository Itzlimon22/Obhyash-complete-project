import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:url_launcher/url_launcher.dart';

import 'widgets/dashboard_action_card.dart';
import 'widgets/dashboard_leaderboard_card.dart';
import 'widgets/subject_stat_card.dart';
import 'widgets/exam_target_modal.dart';
import '../providers/dashboard_providers.dart';
import '../domain/models.dart';

class DashboardView extends ConsumerStatefulWidget {
  const DashboardView({super.key});

  @override
  ConsumerState<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends ConsumerState<DashboardView> {
  bool _hasCheckedExamTarget = false;

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

  @override
  Widget build(BuildContext context) {
    final subjectStatsAsync = ref.watch(dashboardSubjectStatsProvider);
    final leaderboardAsync = ref.watch(leaderboardProvider);
    final userProfileAsync = ref.watch(userProfileProvider);

    final userProfile = userProfileAsync.value;
    _checkExamTarget(userProfile);

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
        // 1. Clean Minimalist Header
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "আজকের দিনটি শুভ হোক,",
                  style: TextStyle(
                    color: isDark ? Colors.grey[400] : Colors.grey[600],
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'HindSiliguri',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'স্বাগতম, ${currentUser.name.split(' ').first}! 👋',
                  style: TextStyle(
                    color: isDark ? Colors.white : const Color(0xFF111827),
                    fontWeight: FontWeight.w900,
                    fontSize: 28,
                    letterSpacing: -0.5,
                    fontFamily: 'HindSiliguri',
                  ),
                ),
              ],
            ),
          ),
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
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 0.92,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    DashboardActionCard(
                      title: 'মক পরীক্ষা',
                      icon: LucideIcons.fileEdit,
                      primaryColor: const Color(0xFF047857),
                      lightColor: isDark
                          ? const Color(0x33047857)
                          : const Color(0xFFECFDF5),
                      onTap: () => context.go('/setup'),
                    ),
                    DashboardActionCard(
                      title: 'অনুশীলন',
                      icon: LucideIcons.bookOpen,
                      primaryColor: const Color(0xFF047857),
                      lightColor: isDark
                          ? const Color(0x33047857)
                          : const Color(0xFFECFDF5),
                      onTap: () => context.go('/practice'),
                    ),
                    DashboardActionCard(
                      title: 'ইতিহাস',
                      icon: LucideIcons.clock,
                      primaryColor: const Color(0xFF525252),
                      lightColor: isDark
                          ? const Color(0x33525252)
                          : const Color(0xFFF5F5F5),
                      onTap: () => context.go('/history'),
                    ),
                    DashboardActionCard(
                      title: 'লিডারবোর্ড',
                      icon: LucideIcons.trophy,
                      primaryColor: const Color(0xFF047857),
                      lightColor: isDark
                          ? const Color(0x33047857)
                          : const Color(0xFFECFDF5),
                      onTap: () => context.go('/leaderboard'),
                    ),
                    DashboardActionCard(
                      title: 'এনালাইসিস',
                      icon: LucideIcons.pieChart,
                      primaryColor: const Color(0xFF047857),
                      lightColor: isDark
                          ? const Color(0x33047857)
                          : const Color(0xFFECFDF5),
                      onTap: () => context.go('/analysis'),
                    ),
                    DashboardActionCard(
                      title: 'ব্লগ',
                      icon: LucideIcons.newspaper,
                      primaryColor: const Color(0xFF047857),
                      lightColor: isDark
                          ? const Color(0x33047857)
                          : const Color(0xFFECFDF5),
                      onTap: () => launchUrl(
                        Uri.parse('https://obhyash.com/blog'),
                        mode: LaunchMode.externalApplication,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Subject Stats List
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
          ),
        ),
      ],
    );
  }
}
