import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import 'widgets/dashboard_action_card.dart';
import 'widgets/dashboard_leaderboard_card.dart';
import 'widgets/subject_stat_card.dart';
import 'widgets/countdown_banner.dart';
import 'widgets/daily_goal_card.dart';
import 'widgets/exam_target_modal.dart';
import '../providers/dashboard_providers.dart';
import '../domain/models.dart';

class DashboardView extends ConsumerStatefulWidget {
  const DashboardView({super.key});

  @override
  ConsumerState<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends ConsumerState<DashboardView> {
  int _dailyCompletions = 0;
  bool _hasCheckedExamTarget = false;

  @override
  void initState() {
    super.initState();
    _loadDailyCompletions();
  }

  Future<void> _loadDailyCompletions() async {
    final userAsync = ref.read(userProfileProvider);
    final userId = userAsync.valueOrNull?.id;
    if (userId != null) {
      final count = await getDailyCompletions(userId);
      if (mounted) setState(() => _dailyCompletions = count);
    }
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

    final userProfile = userProfileAsync.valueOrNull;
    _checkExamTarget(userProfile);

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
          // 0. Countdown Banner (if exam target set)
          if (userProfile?.examTarget != null) ...[
            CountdownBanner(
              examTarget: userProfile!.examTarget!,
              onChangeTarget: () async {
                final result = await showExamTargetModal(context);
                if (result != null && mounted) {
                  ref.invalidate(userProfileProvider);
                }
              },
            ),
            const SizedBox(height: 10),
          ],

          // 0b. Daily Goal Card
          DailyGoalCard(
            completedToday: _dailyCompletions,
            goal: userProfile?.dailyExamsGoal ?? 3,
            onStartExam: () => context.go('/setup'),
          ),
          const SizedBox(height: 12),

          // 0c. Admission Track CTA (hidden once registered)
          if (userProfile != null && !userProfile.admissionTrackInterest)
            _AdmissionTrackCard(
              userId: userProfile.id,
              onRegistered: () => ref.invalidate(userProfileProvider),
            ),
          if (userProfile != null && !userProfile.admissionTrackInterest)
            const SizedBox(height: 16),
          if (userProfile == null || userProfile.admissionTrackInterest)
            const SizedBox(height: 4),

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

// ── Admission Track pre-registration card ────────────────────────────────────
class _AdmissionTrackCard extends StatefulWidget {
  const _AdmissionTrackCard({required this.userId, required this.onRegistered});

  final String userId;
  final VoidCallback onRegistered;

  @override
  State<_AdmissionTrackCard> createState() => _AdmissionTrackCardState();
}

class _AdmissionTrackCardState extends State<_AdmissionTrackCard> {
  bool _loading = false;
  bool _registered = false;

  Future<void> _register() async {
    setState(() => _loading = true);
    try {
      await Supabase.instance.client
          .from('users')
          .update({'admission_track_interest': true})
          .eq('id', widget.userId);
      if (mounted) {
        setState(() {
          _loading = false;
          _registered = true;
        });
        // Brief delay so the success state is visible, then refresh provider
        await Future.delayed(const Duration(milliseconds: 1200));
        widget.onRegistered();
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Text('🎓 ', style: TextStyle(fontSize: 16)),
                    const Text(
                      'অ্যাডমিশন ট্র্যাক আসছে!',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(99),
                      ),
                      child: const Text(
                        'শীঘ্রই',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'MBBS · BUET · ঢাবি — আর্লি এক্সেস পেতে রেজিস্টার করো।',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.85),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: _loading || _registered ? null : _register,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _registered ? const Color(0xFF059669) : Colors.white,
                borderRadius: BorderRadius.circular(10),
              ),
              child: _loading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          Color(0xFF4F46E5),
                        ),
                      ),
                    )
                  : Text(
                      _registered ? '✓ নিবন্ধিত!' : 'আর্লি এক্সেস নিন',
                      style: TextStyle(
                        color: _registered
                            ? Colors.white
                            : const Color(0xFF4F46E5),
                        fontWeight: FontWeight.w600,
                        fontSize: 12,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
