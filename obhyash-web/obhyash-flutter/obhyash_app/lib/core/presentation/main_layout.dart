import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'widgets/main_sidebar.dart';
import 'widgets/main_bottom_nav.dart';
import '../../features/dashboard/presentation/dashboard_view.dart';
import '../../features/dashboard/services/streak_service.dart';
import '../../features/dashboard/providers/dashboard_providers.dart';
import '../../features/auth/providers/auth_controller.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../../features/dashboard/presentation/widgets/countdown_banner.dart';
import '../../features/notifications/presentation/notifications_view.dart';

final _unreadNotifCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final user = ref.watch(authProvider);
  if (user == null) return 0;
  try {
    final result = await Supabase.instance.client
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false);
    return (result as List).length;
  } catch (_) {
    return 0;
  }
});

class MainLayout extends ConsumerStatefulWidget {
  final StatefulNavigationShell navigationShell;

  const MainLayout({super.key, required this.navigationShell});

  @override
  ConsumerState<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends ConsumerState<MainLayout> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _streakAnimKey = 0;

  void _triggerStreakAnimation() {
    setState(() {
      _streakAnimKey++;
    });
  }

  String _getActiveTab(String location) {
    if (location.startsWith('/history')) return 'history';
    if (location.startsWith('/setup')) return 'setup';
    if (location.startsWith('/practice')) return 'practice';
    if (location.contains('/user-profile')) return 'user_profile';
    if (location.startsWith('/leaderboard')) return 'leaderboard';
    if (location.startsWith('/analysis')) return 'analysis';
    if (location.startsWith('/my-reports')) return 'my-reports';
    if (location.startsWith('/profile/my-subscription'))
      return 'my-subscription';
    if (location.startsWith('/profile/subscription')) return 'subscription';
    if (location.startsWith('/profile/complaint')) return 'complaint';
    if (location.startsWith('/profile/about')) return 'about';
    if (location.startsWith('/profile/privacy')) return 'privacy';
    if (location.startsWith('/profile/terms')) return 'terms';
    if (location.startsWith('/profile/faq')) return 'faq';
    if (location.startsWith('/profile/blog')) return 'blog';
    if (location.startsWith('/profile/referral')) return 'referral';
    if (location.startsWith('/profile/stats')) return 'stats';
    if (location.startsWith('/profile')) return 'settings';
    if (location.startsWith('/subject') || location.contains('/subject')) {
      try {
        final uri = Uri.parse(location);
        final idx = uri.pathSegments.indexOf('subject');
        if (idx != -1 && idx + 1 < uri.pathSegments.length) {
          return 'subject_${uri.pathSegments[idx + 1]}';
        }
        final user = ref.read(authProvider);
        if (user != null && mounted) {
          StreakService.checkAndUpdateStreak(user.id);
          ref.invalidate(userProfileProvider);
        }
      } catch (e) {}
      return 'subject_report';
    }
    if (location.startsWith('/notifications')) return 'notifications';
    if (location.startsWith('/bookmarks')) return 'bookmarks';
    return 'dashboard';
  }

  String _getTitle(String tab) {
    if (tab.startsWith('subject_') && tab != 'subject_report') {
      final subj = tab.replaceFirst('subject_', '');
      const names = {
        'physics': 'পদার্থবিজ্ঞান',
        'chemistry': 'রসায়ন',
        'biology': 'জীববিজ্ঞান',
        'math': 'গণিত',
        'bangla': 'বাংলা',
        'english': 'ইংরেজি',
        'ict': 'আইসিটি',
        'general_knowledge': 'সাধারণ জ্ঞান',
        'gk': 'সাধারণ জ্ঞান',
        'general': 'সাধারণ',
        'hsc_bangla_1': 'বাংলা ১ম পত্র',
        'hsc_bangla_2': 'বাংলা ২য় পত্র',
        'hsc_english_1': 'English 1st Paper',
        'hsc_english_2': 'English 2nd Paper',
        'hsc_ict': 'তথ্য ও যোগাযোগ প্রযুক্তি',
        'hsc_physics_1': 'পদার্থবিজ্ঞান ১ম পত্র',
        'hsc_physics_2': 'পদার্থবিজ্ঞান ২য় পত্র',
        'hsc_chemistry_1': 'রসায়ন ১ম পত্র',
        'hsc_chemistry_2': 'রসায়ন ২য় পত্র',
        'hsc_biology_1': 'জীববিজ্ঞান ১ম পত্র',
        'hsc_biology_2': 'জীববিজ্ঞান ২য় পত্র',
        'hsc_math_1': 'উচ্চতর গণিত ১ম পত্র',
        'hsc_math_2': 'উচ্চতর গণিত ২য় পত্র',
      };
      return names[subj.toLowerCase()] ?? 'বিষয় রিপোর্ট';
    }

    switch (tab) {
      case 'notifications':
        return 'নোটিফিকেশন';
      case 'bookmarks':
        return 'আমার বুকমার্কস';
      case 'dashboard':
        return 'ড্যাশবোর্ড';
      case 'setup':
        return 'মক পরীক্ষা শুরু';
      case 'history':
        return 'পূর্বের পরীক্ষা সমূহ';
      case 'practice':
        return 'অনুশীলন বোর্ড';
      case 'leaderboard':
        return 'লিডারবোর্ড';
      case 'analysis':
        return 'এনালাইসিস';
      case 'my-reports':
        return 'আমার রিপোর্ট';
      case 'stats':
        return 'আমার প্রোফাইল';
      case 'settings':
        return 'সেটিংস';
      case 'subscription':
        return 'আপগ্রেড';
      case 'my-subscription':
        return 'সাবস্ক্রিপশন';
      case 'complaint':
        return 'অভিযোগ ও পরামর্শ';
      case 'about':
        return 'আমাদের সম্পর্কে';
      case 'privacy':
        return 'প্রাইভেসি পলিসি';
      case 'terms':
        return 'ব্যবহারের নিয়মাবলী';
      case 'faq':
        return 'সাহায্য ও FAQ';
      case 'user_profile':
        return 'প্রোফাইল';
      case 'subject_report':
        return 'বিষয় রিপোর্ট';
      case 'blog':
        return 'ব্লগ';
      case 'referral':
        return 'রেফারেল প্রোগ্রাম';
      default:
        return 'Obhyash';
    }
  }

  void _onTabChange(String tab) {
    if (tab == 'blog') {
      widget.navigationShell.goBranch(4);
      context.go('/profile/blog');
      return;
    }

    int index = 0;
    switch (tab) {
      case 'dashboard':
        index = 0;
        break;
      case 'history':
        index = 1;
        break;
      case 'setup':
        index = 2;
        break;
      case 'leaderboard':
        index = 3;
        break;
      default:
        index = 0;
    }

    // Check if we are already on this branch. If so, pop back to its root.
    if (widget.navigationShell.currentIndex == index) {
      context.go(tab == 'dashboard' ? '/' : '/$tab');
    } else {
      widget.navigationShell.goBranch(
        index,
        initialLocation: index == widget.navigationShell.currentIndex,
      );
    }
  }

  Widget _buildCountdownBadge(String examTarget, bool isDark) {
    final examDate = examDates[examTarget];
    if (examDate == null) return const SizedBox.shrink();
    final now = DateTime.now();
    final days = examDate
        .difference(DateTime(now.year, now.month, now.day))
        .inDays;
    if (days < 0) return const SizedBox.shrink();

    final Color bg, border, textColor;
    if (days <= 30) {
      bg = isDark
          ? const Color(0xFFB91C1C).withValues(alpha: 0.15)
          : const Color(0xFFFEF2F2);
      border = isDark
          ? const Color(0xFFB91C1C).withValues(alpha: 0.3)
          : const Color(0xFFFECACA);
      textColor = isDark ? const Color(0xFFF87171) : const Color(0xFFB91C1C);
    } else if (days <= 90) {
      bg = isDark
          ? const Color(0xFFD97706).withValues(alpha: 0.15)
          : const Color(0xFFFFFBEB);
      border = isDark
          ? const Color(0xFFD97706).withValues(alpha: 0.3)
          : const Color(0xFFFDE68A);
      textColor = isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706);
    } else {
      bg = isDark
          ? const Color(0xFF059669).withValues(alpha: 0.15)
          : const Color(0xFFF0FDF4);
      border = isDark
          ? const Color(0xFF059669).withValues(alpha: 0.3)
          : const Color(0xFFBBF7D0);
      textColor = isDark ? const Color(0xFF059669) : const Color(0xFF059669);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: border),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('🎯', style: TextStyle(fontSize: 13)),
          const SizedBox(width: 3),
          Text(
            '$days দিন',
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.bold,
              color: textColor,
              fontFamily: 'Anek Bangla',
            ),
          ),
        ],
      ),
    );
  }

  void _showProfileSheet(BuildContext ctx, dynamic user) {
    final isDark = Theme.of(ctx).brightness == Brightness.dark;
    showModalBottomSheet(
      context: ctx,
      useRootNavigator: true,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ProfileSheet(
        userName: user?.name ?? '',
        userEmail: user?.email ?? '',
        userInstitute: user?.institute ?? '',
        xp: user?.xp ?? 0,
        isDark: isDark,
        onNavigate: (route) {
          Navigator.pop(ctx);
          widget.navigationShell.goBranch(4);
          // Small delay to allow branch switch before pushing
          Future.delayed(const Duration(milliseconds: 50), () {
            if (mounted) context.push(route);
          });
        },
        onToggleTheme: () {
          ref.read(themeModeProvider.notifier).toggle();
        },
        onLogout: () {
          Navigator.pop(ctx);
          ref.read(authControllerProvider.notifier).logout();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final activeTab = _getActiveTab(location);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final userProfileAsync = ref.watch(userProfileProvider);
    final user = userProfileAsync.whenOrNull(data: (data) => data);
    final userName = user?.name ?? '';
    final userInst = user?.institute ?? '';
    final streak = user?.streakCount ?? 0;
    final isLoading = userProfileAsync.isLoading;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: isDark
          ? const Color(0xFF0C0A09)
          : const Color(0xFFFAFAF9),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(68),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
            child: Container(
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF0C0A09).withValues(alpha: 0.85)
                    : Colors.white.withValues(alpha: 0.9),
                border: Border(
                  bottom: BorderSide(
                    color: isDark
                        ? const Color(0xFF1C1C1E).withValues(alpha: 0.8)
                        : const Color(0xFFF3F4F6),
                    width: 1,
                  ),
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: SizedBox(
                  height: 68,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        // Left: Logo + back button + title
                        Expanded(
                          child: Row(
                            children: [
                              if (activeTab != 'dashboard' &&
                                  activeTab != 'history' &&
                                  activeTab != 'setup' &&
                                  activeTab != 'leaderboard') ...[
                                GestureDetector(
                                  onTap: () {
                                    if (context.canPop()) {
                                      context.pop();
                                    } else {
                                      context.go('/');
                                    }
                                  },
                                  child: Container(
                                    width: 40,
                                    height: 40,
                                    margin: const EdgeInsets.only(right: 12),
                                    decoration: BoxDecoration(
                                      color: isDark
                                          ? const Color(0xFF1C1C1E)
                                          : const Color(0xFFF3F4F6),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      LucideIcons.arrowLeft,
                                      size: 20,
                                      color: isDark
                                          ? const Color(0xFFE5E5E5)
                                          : const Color(0xFF1F2937),
                                    ),
                                  ),
                                ),
                              ],
                              Expanded(
                                child: Text(
                                  _getTitle(activeTab),
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'Anek Bangla',
                                    color: isDark
                                        ? Colors.white
                                        : const Color(0xFF111827),
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Right: Streak + Notification + Divider + Avatar
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Streak Badge (No background, slightly bigger, with animation)
                            GestureDetector(
                              onTap: _triggerStreakAnimation,
                              behavior: HitTestBehavior.opaque,
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Animate(
                                    key: ValueKey(_streakAnimKey),
                                    effects: _streakAnimKey > 0
                                        ? [
                                            ScaleEffect(
                                                begin: const Offset(1, 1),
                                                end: const Offset(1.4, 1.4),
                                                duration: 250.ms,
                                                curve: Curves.easeOutBack),
                                            ShakeEffect(
                                              hz: 4,
                                              duration: 400.ms,
                                              delay: 200.ms,
                                            ),
                                            ScaleEffect(
                                                begin: const Offset(1.4, 1.4),
                                                end: const Offset(1, 1),
                                                duration: 250.ms,
                                                delay: 600.ms,
                                                curve: Curves.easeIn),
                                          ]
                                        : [],
                                    child: const Icon(
                                      Icons.local_fire_department_rounded,
                                      color: Color(0xFFF97316),
                                      size: 24,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  isLoading
                                      ? Container(
                                          width: 16,
                                          height: 12,
                                          decoration: BoxDecoration(
                                            color: isDark ? const Color(0xFF3F3F46) : const Color(0xFFE5E7EB),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                        )
                                      : Animate(
                                          key: ValueKey('text_$_streakAnimKey'),
                                          effects: _streakAnimKey > 0
                                              ? [
                                                  ShimmerEffect(
                                                    color: const Color(0xFFFDE047),
                                                    duration: 600.ms,
                                                  ),
                                                ]
                                              : [],
                                          child: Text(
                                            streak.toString(),
                                            style: const TextStyle(
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFFEA580C),
                                            ),
                                          ),
                                        ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 12),

                            // Notification Bell (No background, slightly bigger)
                            Builder(
                              builder: (context) {
                                final unreadAsync = ref.watch(_unreadNotifCountProvider);
                                final unread = unreadAsync.whenOrNull(data: (c) => c) ?? 0;
                                return GestureDetector(
                                  onTap: () => context.push('/notifications'),
                                  behavior: HitTestBehavior.opaque,
                                  child: Stack(
                                    clipBehavior: Clip.none,
                                    alignment: Alignment.center,
                                    children: [
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 4.0),
                                        child: Icon(
                                          LucideIcons.bell,
                                          size: 24,
                                          color: isDark ? const Color(0xFFD4D4D4) : const Color(0xFF4B5563),
                                        ),
                                      ),
                                      if (unread > 0)
                                        Positioned(
                                          top: -4,
                                          right: -2,
                                          child: Container(
                                            padding: const EdgeInsets.all(4),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFEF4444),
                                              shape: BoxShape.circle,
                                              border: Border.all(
                                                color: isDark ? const Color(0xFF0C0A09) : Colors.white,
                                                width: 1.5,
                                              ),
                                            ),
                                            child: Text(
                                              unread > 99 ? '99+' : unread.toString(),
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 12,
                                                fontWeight: FontWeight.w900,
                                              ),
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                );
                              },
                            ),

                            // Divider
                            Container(
                              width: 1,
                              height: 24,
                              margin: const EdgeInsets.symmetric(horizontal: 10),
                              color: isDark
                                  ? const Color(0xFF27272A)
                                  : const Color(0xFFE5E5E5),
                            ),

                            // Profile Avatar
                            GestureDetector(
                              onTap: () => context.go('/profile'),
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFF059669), 
                                      Color(0xFF065F46)
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF059669).withValues(alpha: 0.3),
                                      blurRadius: 6,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                  border: Border.all(
                                    color: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                                    width: 1.5,
                                  ),
                                  image: user?.avatarUrl != null
                                      ? DecorationImage(
                                          image: NetworkImage(user!.avatarUrl!),
                                          fit: BoxFit.cover,
                                        )
                                      : null,
                                ),
                                child: user?.avatarUrl == null
                                    ? Center(
                                        child: Text(
                                          userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 18,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      )
                                    : null,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),

      drawer: MainSidebar(
        activeTab: activeTab,
        onTabChange: _onTabChange,
        onLogout: () {
          ref.read(authControllerProvider.notifier).logout();
        },
        toggleTheme: () {
          ref.read(themeModeProvider.notifier).toggle();
        },
        userName: userName,
        userInstitute: userInst,
        avatarUrl: user?.avatarUrl,
      ),

      body: widget.navigationShell,

      bottomNavigationBar: MainBottomNav(
        activeTab: activeTab,
        onTabChange: _onTabChange,
        onMenuClick: () {
          _scaffoldKey.currentState?.openDrawer();
        },
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Profile Bottom Sheet
// ---------------------------------------------------------------------------

class _ProfileSheet extends StatelessWidget {
  final String userName;
  final String userEmail;
  final String userInstitute;
  final int xp;
  final bool isDark;
  final void Function(String route) onNavigate;
  final VoidCallback onToggleTheme;
  final VoidCallback onLogout;

  const _ProfileSheet({
    required this.userName,
    required this.userEmail,
    required this.userInstitute,
    required this.xp,
    required this.isDark,
    required this.onNavigate,
    required this.onToggleTheme,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    final bg = isDark ? const Color(0xFF000000) : Colors.white;
    final surface = isDark ? const Color(0xFF1C1C1E) : const Color(0xFFF5F5F5);
    final border = isDark ? const Color(0xFF27272A) : const Color(0xFFE5E5E5);
    final textPrimary = isDark ? Colors.white : const Color(0xFF000000);
    final textSecondary = isDark
        ? const Color(0xFFA3A3A3)
        : const Color(0xFF737373);

    final menuItems = [
      {
        'label':
            '\u0986\u09ae\u09be\u09b0 \u09aa\u09cd\u09b0\u09cb\u09ab\u09be\u0987\u09b2',
        'icon': LucideIcons.user,
        'route': '/profile',
      },
      {
        'label':
            '\u0986\u09ae\u09be\u09b0 \u09b8\u09be\u09ac\u09b8\u09cd\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8',
        'icon': LucideIcons.crown,
        'route': '/my-subscription',
      },
      {
        'label':
            '\u0986\u09aa\u0997\u09cd\u09b0\u09c7\u09a1 \u0995\u09b0\u09c1\u09a8',
        'icon': LucideIcons.creditCard,
        'route': '/subscription',
      },
      {
        'label':
            '\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u09b8\u09ae\u09cd\u09aa\u09b0\u09cd\u0995\u09c7',
        'icon': LucideIcons.info,
        'route': '/about',
      },
      {
        'label':
            '\u09b0\u09c7\u09ab\u09be\u09b0\u09c7\u09b2 \u09aa\u09cd\u09b0\u09cb\u0997\u09cd\u09b0\u09be\u09ae',
        'icon': LucideIcons.gift,
        'route': '/referral',
      },
      {
        'label':
            '\u0985\u09ad\u09bf\u09af\u09cb\u0997 \u0993 \u09aa\u09b0\u09be\u09ae\u09b0\u09cd\u09b6',
        'icon': LucideIcons.messageSquare,
        'route': '/complaint',
      },
    ];

    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Drag Handle
            const SizedBox(height: 12),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF27272A)
                    : const Color(0xFFD4D4D4),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),

            // Profile Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: const BoxDecoration(
                      color: Color(0xFFB91C1C),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          userName.isNotEmpty
                              ? userName
                              : '\u09b2\u09cb\u09a1 \u09b9\u099a\u09cd\u099b\u09c7...',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'Anek Bangla',
                            color: textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (userEmail.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            userEmail,
                            style: TextStyle(
                              fontSize: 15,
                              color: textSecondary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                        if (userInstitute.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            userInstitute,
                            style: TextStyle(
                              fontSize: 14,
                              color: textSecondary,
                              fontFamily: 'Anek Bangla',
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: isDark
                          ? const Color(0xFF059669)
                          : const Color(0xFFECFDF5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$xp XP',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF059669),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            Divider(height: 1, color: border),
            const SizedBox(height: 8),

            // Menu Items
            ...menuItems.map(
              (item) => InkWell(
                onTap: () => onNavigate(item['route'] as String),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 12,
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 36,
                        height: 36,
                        decoration: BoxDecoration(
                          color: surface,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          item['icon'] as IconData,
                          size: 18,
                          color: isDark
                              ? const Color(0xFFA3A3A3)
                              : const Color(0xFF525252),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Text(
                        item['label'] as String,
                        style: TextStyle(
                          fontSize: 16,
                          fontFamily: 'Anek Bangla',
                          fontWeight: FontWeight.w600,
                          color: textPrimary,
                        ),
                      ),
                      const Spacer(),
                      Icon(
                        LucideIcons.chevronRight,
                        size: 16,
                        color: textSecondary,
                      ),
                    ],
                  ),
                ),
              ),
            ),

            const SizedBox(height: 4),
            Divider(height: 1, color: border),

            // Theme Toggle
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: surface,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      isDark ? LucideIcons.sun : LucideIcons.moon,
                      size: 18,
                      color: isDark
                          ? const Color(0xFFA3A3A3)
                          : const Color(0xFF525252),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Text(
                      isDark
                          ? '\u09b2\u09be\u0987\u099f \u09ae\u09cb\u09a1'
                          : '\u09a1\u09be\u09b0\u09cd\u0995 \u09ae\u09cb\u09a1',
                      style: TextStyle(
                        fontSize: 16,
                        fontFamily: 'Anek Bangla',
                        fontWeight: FontWeight.w600,
                        color: textPrimary,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: onToggleTheme,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 44,
                      height: 24,
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF059669)
                            : const Color(0xFFD4D4D4),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: AnimatedAlign(
                        duration: const Duration(milliseconds: 200),
                        alignment: isDark
                            ? Alignment.centerRight
                            : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.all(2),
                          width: 20,
                          height: 20,
                          decoration: const BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            Divider(height: 1, color: border),
            const SizedBox(height: 8),

            // Logout
            InkWell(
              onTap: onLogout,
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 12,
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF3F0F1A)
                            : const Color(0xFFFFF1F2),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        LucideIcons.logOut,
                        size: 18,
                        color: Color(0xFFB91C1C),
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Text(
                      '\u09b2\u0997\u0986\u0989\u099f',
                      style: TextStyle(
                        fontSize: 16,
                        fontFamily: 'Anek Bangla',
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFB91C1C),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}
