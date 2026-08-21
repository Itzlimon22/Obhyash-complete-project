import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'widgets/main_sidebar.dart';
import '../utils/global_refresh.dart';
import 'widgets/main_bottom_nav.dart';
import 'widgets/user_avatar.dart';
import '../../features/dashboard/services/streak_service.dart';
import 'widgets/streak_dialog.dart';
import '../../features/dashboard/providers/dashboard_providers.dart';
import '../../features/auth/providers/auth_controller.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/title_provider.dart';
import 'widgets/obhyash_tooltip.dart';
import '../providers/connectivity_provider.dart';
import '../../features/dashboard/presentation/widgets/countdown_banner.dart';
import '../../features/practice/providers/practice_providers.dart';
import '../../features/notifications/domain/notification_model.dart';
import '../../features/notifications/providers/notification_providers.dart';
import '../../features/notifications/presentation/widgets/in_app_notification_banner.dart';
import '../../features/notifications/services/notification_service.dart';
import '../../features/notifications/services/notification_permission_manager.dart';

class MainLayout extends ConsumerStatefulWidget {
  final StatefulNavigationShell navigationShell;

  const MainLayout({super.key, required this.navigationShell});

  @override
  ConsumerState<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends ConsumerState<MainLayout> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  int _streakAnimKey = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(authProvider);
      if (user != null) {
        StreakService.syncStreak(user.id).then((data) {
          if (mounted) {
            ref.read(userProfileProvider.notifier).updateStreak(data.streakCount);
          }
        });
      }
    });
  }
  
  void _showStreakDialog(int currentStreak, String userId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StreakDialog(currentStreak: currentStreak, userId: userId),
    );
  }

  void _triggerStreakAnimation(int currentStreak, String userId) {
    setState(() {
      _streakAnimKey++;
    });
    _showStreakDialog(currentStreak, userId);
  }

  String _getActiveTab(String location) {
    if (location.startsWith('/history')) return 'history';
    if (location.startsWith('/setup')) return 'setup';
    if (location.startsWith('/practice')) return 'practice';
    if (location.contains('/user-profile')) return 'user_profile';
    if (location.startsWith('/leaderboard')) return 'leaderboard';
    if (location.startsWith('/analysis')) return 'analysis';
    if (location.startsWith('/my-reports')) return 'my-reports';
    if (location.startsWith('/profile/my-subscription')) return 'my-subscription';
    if (location.startsWith('/profile/subscription')) return 'subscription';
    if (location.startsWith('/profile/complaint')) return 'complaint';
    if (location.startsWith('/profile/about')) return 'about';
    if (location.startsWith('/profile/privacy')) return 'privacy';
    if (location.startsWith('/profile/terms')) return 'terms';
    if (location.startsWith('/profile/faq')) return 'faq';
    if (location.startsWith('/profile/blog')) return 'blog';
    if (location.startsWith('/profile/referral')) return 'referral';
    if (location.startsWith('/profile/stats')) return 'stats';
    if (location.startsWith('/profile/bookmarks') || location.startsWith('/bookmarks')) return 'bookmarks';
    if (location.startsWith('/profile/feature-requests')) return 'feature-requests';
    if (location.startsWith('/profile/account-linking')) return 'account-linking';
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
          StreakService.syncStreak(user.id);
          ref.invalidate(userProfileProvider);
        }
      } catch (e) {}
      return 'subject_report';
    }
    if (location.startsWith('/notifications')) return 'notifications';
    if (location.startsWith('/bookmarks')) return 'bookmarks';
    if (location.contains('/formulas/') && location.split('/').length >= 5) return 'formula_detail';
    if (location.contains('/formulas/') && location.split('/').length >= 4) return 'formula_chapters';
    if (location.startsWith('/live_exam/')) {
      final segs = location.split('/');
      if (segs.length >= 3 && segs[2].isNotEmpty) {
        return 'live_exam_${segs[2]}';
      }
    }
    if (location.startsWith('/live_exam')) return 'live_exam';
    if (location.startsWith('/formulas')) return 'formulas';
    return 'dashboard';
  }

  bool _shouldShowBottomNav(String location) {
    try {
      final uri = Uri.parse(location);
      final segs = uri.pathSegments;

      // 1. Formulas: Keep bottom nav on main hub (/formulas) and subject chapters list (/formulas/:subjectId),
      //    hide only inside specific chapter formula detail page (/formulas/:subjectId/:chapterId).
      if (segs.contains('formulas')) {
        final formulaIdx = segs.indexOf('formulas');
        final depth = segs.length - formulaIdx;
        if (depth >= 3) {
          return false; // Chapter formulas detail page -> Hide
        }
        return true; // Main formulas & Subject chapters -> Show
      }

      // 2. Live Exam: Keep bottom nav on main hub (/live_exam), hide on category/details/session
      if (segs.contains('live_exam') || segs.contains('live-exams') || segs.contains('live-exam')) {
        final idx = segs.indexWhere((s) => s.startsWith('live'));
        if (idx != -1 && segs.length - idx >= 2) {
          return false;
        }
        return true;
      }

      // 3. Detail sub-routes and setup form that hide bottom nav
      if (location.startsWith('/setup') || location.contains('/setup')) return false;
      if (location.startsWith('/notifications')) return false;
      if (location.startsWith('/bookmarks') || location.contains('/bookmarks')) return false;
      if (location.startsWith('/subject') || location.contains('/subject/')) return false;
      if (location.startsWith('/my-reports') || location.startsWith('/analysis')) return false;
      if (location.startsWith('/profile/') && location != '/profile') return false;
      if (location.startsWith('/history/') && location != '/history') return false;
      if (location.startsWith('/leaderboard/') && location != '/leaderboard') return false;
      if (location.startsWith('/exam')) return false;
      if (location.contains('/user-profile')) return false;

      // Primary root tabs
      return location == '/' ||
          location.isEmpty ||
          location == '/history' ||
          location == '/practice' ||
          location == '/leaderboard' ||
          location == '/profile' ||
          location == '/settings';
    } catch (_) {
      return true;
    }
  }

  String _getTitle(String tab) {
    if (tab.startsWith('live_exam_')) {
      final cat = tab.replaceFirst('live_exam_', '').toLowerCase();
      const liveNames = {
        'engineering': 'ইঞ্জিনিয়ারিং উইকলি',
        'medical': 'মেডিকেল উইকলি',
        'varsity': 'ভার্সিটি উইকলি',
        'varsity_a': 'ভার্সিটি উইকলি',
        'hsc': 'এইচএসসি উইকলি',
        'all': 'সকল লাইভ পরীক্ষা',
      };
      return liveNames[cat] ?? 'লাইভ পরীক্ষা';
    }

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
        return 'বুকমার্ক';
      case 'dashboard':
        return 'ড্যাশবোর্ড';
      case 'setup':
        return 'পরীক্ষা সেটআপ';
      case 'live_exam':
        return 'লাইভ পরীক্ষা';
      case 'history':
        return 'ইতিহাস';
      case 'practice':
        return 'অনুশীলন';
      case 'leaderboard':
        return 'লিডারবোর্ড';
      case 'analysis':
        return 'এনালাইসিস';
      case 'my-reports':
        return 'রিপোর্ট';
      case 'stats':
        return 'প্রোফাইল';
      case 'settings':
        return 'সেটিংস';
      case 'subscription':
        return 'আপগ্রেড';
      case 'my-subscription':
        return 'সাবস্ক্রিপশন';
      case 'complaint':
        return 'অভিযোগ';
      case 'feature-requests':
        return 'ফিচার রিকোয়েস্ট';
      case 'about':
        return 'পরিচিতি';
      case 'privacy':
        return 'প্রাইভেসি';
      case 'terms':
        return 'শর্তাবলী';
      case 'faq':
        return 'সাহায্য';
      case 'account-linking':
        return 'অ্যাকাউন্ট লিংকিং';
      case 'user_profile':
        return 'প্রোফাইল';
      case 'subject_report':
        return 'রিপোর্ট';
      case 'blog':
        return 'ব্লগ';
      case 'referral':
        return 'রেফারেল';
      case 'formulas':
        return 'ফর্মুলা';
      case 'formula_chapters':
        return 'অধ্যায়';
      case 'formula_detail':
        return 'সূত্র';
      default:
        return 'Obhyash';
    }
  }

  void _onTabChange(String tab) {
    if (tab == 'blog' || tab == 'profile/blog') {
      context.push('/blog');
      return;
    }

    if (tab == 'formulas') {
      widget.navigationShell.goBranch(0);
      context.push('/formulas');
      return;
    }

    if (tab == 'live_exam') {
      widget.navigationShell.goBranch(0);
      context.push('/live_exam');
      return;
    }

    if (tab == 'practice' || tab == 'analysis' || tab == 'my-reports') {
      widget.navigationShell.goBranch(0);
      context.push('/$tab');
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

    // Auto-refresh & sync whenever internet returns from offline to online
    ref.listen<AsyncValue<NetworkStatus>>(connectivityStreamProvider, (prev, next) {
      if (next.value == NetworkStatus.online && prev?.value == NetworkStatus.offline) {
        globalRefresh(ref);
      }
    });

    // Schedule local witty daily streak saver reminder (Chorcha style) + sync FCM + Smart Soft-Ask
    ref.listen(userProfileProvider, (prev, next) {
      final u = next.value;
      if (u != null) {
        NotificationService().scheduleDailyStreakReminders(
          userName: u.name,
          currentStreak: u.streakCount,
        );
        NotificationService().syncFCMToken(u.id);

        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            NotificationPermissionManager.maybeShowPrompt(context);
          }
        });
      }
    });

    // Realtime in-app notification luxury top-sliding floating banner listener
    ref.listen<AppNotification?>(latestNotificationEventProvider, (prev, next) {
      if (next != null && mounted) {
        final currentLoc = GoRouterState.of(context).uri.toString();
        if (!currentLoc.startsWith('/notifications')) {
          InAppNotificationBanner.show(context, next);
        }
      }
    });

    final isDrawerOpen = _scaffoldKey.currentState?.isDrawerOpen ?? false;
    final isAtDashboardRoot = widget.navigationShell.currentIndex == 0 &&
        (location == '/' || location.isEmpty) &&
        !context.canPop();

    return PopScope(
      canPop: isAtDashboardRoot && !isDrawerOpen,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (_scaffoldKey.currentState?.isDrawerOpen == true) {
          _scaffoldKey.currentState?.closeDrawer();
          return;
        }
        if (context.canPop()) {
          context.pop();
        } else if (widget.navigationShell.currentIndex != 0 || location != '/') {
          widget.navigationShell.goBranch(0);
          context.go('/');
        }
      },
      child: Scaffold(
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
                        // Left: Clean Title & Back Button
                        Expanded(
                          child: Consumer(
                            builder: (context, ref, child) {
                              final currentLoc = GoRouterState.of(context).uri.toString();
                              final dynamicTitle = ref.watch(locationTitleProvider)[currentLoc];
                              final titleText = dynamicTitle ?? _getTitle(activeTab);
                              final isSubRoute = dynamicTitle != null;

                              const settingsSubTabs = {
                                'stats',
                                'subscription',
                                'my-subscription',
                                'complaint',
                                'feature-requests',
                                'about',
                                'privacy',
                                'terms',
                                'faq',
                                'account-linking',
                                'referral',
                                'blog',
                                'bookmarks',
                                'my-reports',
                                'notifications',
                              };

                              final isSettingsSubPage = settingsSubTabs.contains(activeTab) ||
                                  (currentLoc.startsWith('/profile/') && currentLoc != '/profile') ||
                                  currentLoc.startsWith('/bookmarks') ||
                                  currentLoc.startsWith('/my-reports') ||
                                  currentLoc.startsWith('/notifications');

                              final showBackButton = isSettingsSubPage ||
                                  activeTab == 'setup' ||
                                  activeTab == 'practice' ||
                                  activeTab == 'analysis' ||
                                  activeTab == 'live_exam' ||
                                  activeTab.startsWith('subject_') ||
                                  isSubRoute ||
                                  context.canPop();

                              return Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  if (showBackButton) ...[
                                    GestureDetector(
                                      onTap: () {
                                        HapticFeedback.lightImpact();
                                        if (context.canPop()) {
                                          context.pop();
                                        } else if (isSettingsSubPage) {
                                          widget.navigationShell.goBranch(4);
                                          context.go('/profile');
                                        } else {
                                          widget.navigationShell.goBranch(0);
                                          context.go('/');
                                        }
                                      },
                                      behavior: HitTestBehavior.opaque,
                                      child: Container(
                                        padding: const EdgeInsets.all(7),
                                        margin: const EdgeInsets.only(right: 10),
                                        decoration: BoxDecoration(
                                          color: isDark
                                              ? const Color(0xFF1C1C1E)
                                              : const Color(0xFFF1F5F9),
                                          borderRadius: BorderRadius.circular(10),
                                          border: Border.all(
                                            color: isDark
                                                ? const Color(0xFF27272A)
                                                : const Color(0xFFE2E8F0),
                                          ),
                                        ),
                                        child: Icon(
                                          LucideIcons.arrowLeft,
                                          size: 18,
                                          color: isDark
                                              ? Colors.white
                                              : const Color(0xFF0F172A),
                                        ),
                                      ),
                                    ),
                                  ],
                                  Flexible(
                                    child: FittedBox(
                                      fit: BoxFit.scaleDown,
                                      alignment: Alignment.centerLeft,
                                      child: Text(
                                        titleText,
                                        maxLines: 1,
                                        style: TextStyle(
                                          fontSize: isSubRoute ? 18 : 21,
                                          fontWeight: FontWeight.w700,
                                          fontFamily: 'Anek Bangla',
                                          letterSpacing: -0.2,
                                          color: isDark
                                              ? Colors.white
                                              : const Color(0xFF111827),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                        ),

                        // Right: Streak + Notification + Divider + Avatar (Dashboard Only for Clean Look)
                        if (activeTab == 'dashboard')
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              // Streak Badge with Tooltip
                              ObhyashTooltip(
                                message: 'দৈনিক স্ট্রাইক: টানা পরীক্ষার দিনগুলো',
                                preferredPosition: TooltipPosition.bottom,
                                child: GestureDetector(
                                  onTap: user != null ? () => _triggerStreakAnimation(streak, user.id) : null,
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
                              ),
                              const SizedBox(width: 12),

                              // Notification Bell with Tooltip
                              Builder(
                                builder: (context) {
                                  final unread = ref.watch(unreadNotificationCountProvider);
                                  return ObhyashTooltip(
                                    message: 'নতুন নোটিফিকেশন ও আপডেট',
                                    preferredPosition: TooltipPosition.bottom,
                                    child: GestureDetector(
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

                              // Profile Avatar with Tooltip
                              ObhyashTooltip(
                                message: 'প্রোফাইল ও সেটিংস',
                                preferredPosition: TooltipPosition.bottom,
                                child: GestureDetector(
                                  onTap: () => context.go('/profile'),
                                  child: UserAvatar(
                                    name: userName,
                                    avatarUrl: user?.avatarUrl,
                                    gender: user?.gender,
                                    id: user?.id,
                                    size: 40,
                                    showBorder: true,
                                    borderColor: isDark ? const Color(0xFF1C1C1E) : Colors.white,
                                    borderWidth: 1.5,
                                  ),
                                ),
                              ),
                            ],
                          )
                        else if (activeTab == 'practice')
                          Consumer(
                            builder: (context, ref, _) {
                              final currentPracticeTab = ref.watch(practiceTabProvider);
                              return Container(
                                height: 36,
                                padding: const EdgeInsets.all(3),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? const Color(0xFF1E1E1E)
                                      : const Color(0xFFF3F4F6),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark
                                        ? const Color(0xFF2E2E2E)
                                        : const Color(0xFFE5E7EB),
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    _HeaderTabBtn(
                                      label: 'ভুলসমূহ',
                                      active: currentPracticeTab == 'mistakes',
                                      isDark: isDark,
                                      onTap: () {
                                        HapticFeedback.lightImpact();
                                        ref.read(practiceTabProvider.notifier).setTab('mistakes');
                                      },
                                    ),
                                    _HeaderTabBtn(
                                      label: 'বুকমার্ক',
                                      active: currentPracticeTab == 'bookmarks',
                                      isDark: isDark,
                                      onTap: () {
                                        HapticFeedback.lightImpact();
                                        ref.read(practiceTabProvider.notifier).setTab('bookmarks');
                                      },
                                    ),
                                  ],
                                ),
                              );
                            },
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

      bottomNavigationBar: _shouldShowBottomNav(location)
          ? MainBottomNav(
              activeTab: (activeTab == 'history' ||
                      activeTab == 'setup' ||
                      activeTab == 'leaderboard' ||
                      activeTab == 'settings')
                  ? activeTab
                  : 'dashboard',
              onTabChange: _onTabChange,
              onMenuClick: () {
                _scaffoldKey.currentState?.openDrawer();
              },
            )
          : null,
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
                              fontSize: 16,
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
                        fontSize: 16,
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
                     maxLines: 1, overflow: TextOverflow.ellipsis),
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

class _HeaderTabBtn extends StatelessWidget {
  final String label;
  final bool active;
  final bool isDark;
  final VoidCallback onTap;

  const _HeaderTabBtn({
    required this.label,
    required this.active,
    required this.isDark,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Container(
        height: 30,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: active
              ? const LinearGradient(
                  colors: [Color(0xFF004633), Color(0xFF00664B)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          borderRadius: BorderRadius.circular(9),
          boxShadow: active
              ? [
                  BoxShadow(
                    color: const Color(0xFF10B981).withValues(alpha: 0.25),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            fontFamily: 'HindSiliguri',
            color: active
                ? Colors.white
                : (isDark ? const Color(0xFFA3A3A3) : const Color(0xFF6B7280)),
          ),
        ),
      ),
    );
  }
}
