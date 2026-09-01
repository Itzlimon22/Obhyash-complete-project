import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'widgets/dashboard_action_card.dart';
// import 'widgets/daily_spaced_repetition_card.dart';
import 'widgets/daily_streak_card.dart';
import 'widgets/daily_quests_card.dart';
import 'widgets/subject_stat_card.dart';
import 'widgets/live_exam_slider.dart';
import '../providers/dashboard_providers.dart';
import '../domain/models.dart';
import '../services/streak_service.dart';
import '../../exam/services/offline_exam_sync_queue.dart';
import '../../exam/services/offline_question_bank_service.dart';

import '../../../core/utils/global_refresh.dart';
import '../../../core/presentation/widgets/global_announcement_banner.dart';
import '../../../core/presentation/widgets/app_refresh_indicator.dart';

class DashboardView extends ConsumerStatefulWidget {
  const DashboardView({super.key});

  @override
  ConsumerState<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends ConsumerState<DashboardView> {
  bool _hasCheckedStreak = false;

  @override
  void initState() {
    super.initState();
    // 1. Silently sync any pending offline exam results in background
    OfflineExamSyncQueueService.syncPendingExams();
    // 2. Silently pre-fetch questions in background so user always has questions offline
    WidgetsBinding.instance.addPostFrameCallback((_) {
      OfflineQuestionBankService.prefetchQuestionsInBackground('physics');
      OfflineQuestionBankService.prefetchQuestionsInBackground('chemistry');
      OfflineQuestionBankService.prefetchQuestionsInBackground('biology');
      OfflineQuestionBankService.prefetchQuestionsInBackground('higher_math');
    });
  }

  void _checkStreak(UserProfile? user) {
    if (_hasCheckedStreak || user == null) return;
    _hasCheckedStreak = true;
    StreakService.syncStreak(user.id).then((data) {
      if (mounted) {
        ref.read(userProfileProvider.notifier).updateStreak(data.streakCount);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final subjectStatsAsync = ref.watch(dashboardSubjectStatsProvider);
    final userProfileAsync = ref.watch(userProfileProvider);

    final userProfile = userProfileAsync.value;
    _checkStreak(userProfile);

    final subjects = subjectStatsAsync.when(
      data: (data) => data,
      loading: () => <SubjectStats>[],
      error: (_, _) => <SubjectStats>[],
    );

    final isLoading = subjectStatsAsync.isLoading;

    return AppRefreshIndicator(
      onRefresh: () => globalRefresh(ref),
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(
          parent: BouncingScrollPhysics(),
        ),
        slivers: [
        // 0. Live In-App Global Broadcast Announcement Banner
        const SliverToBoxAdapter(
          child: GlobalAnnouncementBanner(),
        ),

        // 1. Clean Minimalist Header (Live Exam Slider)
        const SliverToBoxAdapter(
          child: LiveExamSlider(),
        ),

        // 2. Main Content inside SliverToBoxAdapter
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Actions Grid
                GridView.count(
                  crossAxisCount: 3,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 1.05,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    DashboardActionCard(
                      title: 'পরীক্ষা',
                      icon: Icons.quiz_rounded,
                      svgAsset: 'assets/dashboard-icons/exam_pencil.svg',
                      primaryColor: const Color(0xFF059669),
                      lightColor: const Color(0xFFECFDF5),
                      onTap: () => context.go('/setup'),
                    ),
                    DashboardActionCard(
                      title: 'ফর্মুলা',
                      icon: Icons.functions_rounded,
                      svgAsset: 'assets/dashboard-icons/formulas.svg',
                      primaryColor: const Color(0xFF6366F1),
                      lightColor: const Color(0xFFEEF2FF),
                      onTap: () => context.push('/formulas'),
                    ),
                    DashboardActionCard(
                      title: 'ইতিহাস',
                      icon: Icons.history_rounded,
                      svgAsset: 'assets/dashboard-icons/history_clock.svg',
                      primaryColor: const Color(0xFF0284C7),
                      lightColor: const Color(0xFFF0F9FF),
                      onTap: () => context.go('/history'),
                    ),
                    DashboardActionCard(
                      title: 'লিডারবোর্ড',
                      icon: Icons.emoji_events_rounded,
                      svgAsset: 'assets/dashboard-icons/leaderboard_trophy.svg',
                      primaryColor: const Color(0xFFD97706),
                      lightColor: const Color(0xFFFFFBEB),
                      onTap: () => context.go('/leaderboard'),
                    ),
                    DashboardActionCard(
                      title: 'এনালাইসিস',
                      icon: Icons.insights_rounded,
                      svgAsset: 'assets/dashboard-icons/analytics.svg',
                      primaryColor: const Color(0xFF9333EA),
                      lightColor: const Color(0xFFFAF5FF),
                      onTap: () => context.go('/analysis'),
                    ),
                    DashboardActionCard(
                      title: 'লাইভ পরীক্ষা',
                      icon: LucideIcons.radio,
                      svgAsset: 'assets/dashboard-icons/live_exam.svg',
                      primaryColor: const Color(0xFFE11D48),
                      lightColor: const Color(0xFFFFF1F2),
                      onTap: () => context.go('/live_exam'),
                    ),
                  ],
                ),
                
                const SizedBox(height: 18),

                DailyStreakCard(userStreak: userProfile?.streakCount ?? 0)
                    .animate(delay: 150.ms)
                    .fadeIn(duration: 400.ms)
                    .slideY(
                      begin: 0.05,
                      duration: 400.ms,
                      curve: Curves.easeOut,
                    ),

                const SizedBox(height: 18),

                const DailyQuestsCard()
                    .animate(delay: 180.ms)
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
      ),
    );
  }
}
