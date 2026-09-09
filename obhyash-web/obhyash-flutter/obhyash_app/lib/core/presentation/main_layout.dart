import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'widgets/main_sidebar.dart';
import 'widgets/app_icon.dart';
import '../constants/app_icons.dart';
import '../utils/global_refresh.dart';
import '../utils/app_popups.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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
import '../../features/practice/providers/practice_providers.dart';
import '../../features/notifications/domain/notification_model.dart';
import '../../features/notifications/providers/notification_providers.dart';
import '../../features/notifications/presentation/widgets/in_app_notification_banner.dart';
import '../../features/notifications/services/notification_service.dart';
import '../../features/notifications/services/notification_permission_manager.dart';
import '../../features/history/presentation/exam_history_view.dart';
import '../../features/exam/providers/exam_provider.dart';
import '../../features/question_bank/presentation/question_bank_tab_provider.dart';

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
            ref
                .read(userProfileProvider.notifier)
                .updateStreak(data.streakCount);
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
      builder: (ctx) =>
          StreakDialog(currentStreak: currentStreak, userId: userId),
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
    if (location.contains('legends-league')) return 'legends-league';
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
    if (location.startsWith('/profile/bookmarks') ||
        location.startsWith('/bookmarks'))
      return 'bookmarks';
    if (location.startsWith('/profile/feature-requests'))
      return 'feature-requests';
    if (location.startsWith('/profile/account-linking'))
      return 'account-linking';
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
    if (location.contains('/formulas/') && location.split('/').length >= 5)
      return 'formula_detail';
    if (location.contains('/formulas/') && location.split('/').length >= 4)
      return 'formula_chapters';
    if (location.startsWith('/live_exam/')) {
      final segs = location.split('/');
      if (segs.length >= 3 && segs[2].isNotEmpty) {
        return 'live_exam_${segs[2]}';
      }
    }
    if (location.startsWith('/live_exam')) return 'live_exam';
    if (location.startsWith('/question-bank') ||
        location.startsWith('/question_bank')) {
      return 'question_bank';
    }
    if (location.startsWith('/formulas')) return 'formulas';
    return 'dashboard';
  }

  bool _shouldShowBottomNav(String location) {
    try {
      if (location == '/question-bank' ||
          location == '/question_bank') {
        return true;
      }
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
      if (segs.contains('live_exam') ||
          segs.contains('live-exams') ||
          segs.contains('live-exam')) {
        final idx = segs.indexWhere((s) => s.startsWith('live'));
        if (idx != -1 && segs.length - idx >= 2) {
          return false;
        }
        return true;
      }

      // 3. Detail sub-routes that hide bottom nav
      if (location.startsWith('/notifications')) return false;
      if (location.startsWith('/bookmarks') || location.contains('/bookmarks'))
        return false;
      if (location.startsWith('/subject') || location.contains('/subject/'))
        return false;
      if (location.startsWith('/my-reports'))
        return false;
      if (location.startsWith('/analysis/') && location != '/analysis')
        return false;
      if (location.startsWith('/profile/') && location != '/profile')
        return false;
      if (location.startsWith('/history/') && location != '/history')
        return false;
      if (location.contains('legends-league')) return false;
      if (location.startsWith('/leaderboard/') && location != '/leaderboard')
        return false;
      if (location.startsWith('/exam')) return false;
      if (location.contains('/user-profile')) return false;

      // Primary root tabs
      return location == '/' ||
          location.isEmpty ||
          location == '/history' ||
          location == '/analysis' ||
          location == '/setup' ||
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
        'engineering': 'ইঞ্জিনিয়ারিং লাইভ এক্সাম',
        'medical': 'মেডিকেল লাইভ এক্সাম',
        'varsity': 'ভার্সিটি লাইভ এক্সাম',
        'varsity_a': 'ভার্সিটি লাইভ এক্সাম',
        'hsc': 'এইচএসসি লাইভ এক্সাম',
        'ssc_board': 'এসএসসি বোর্ড মডেল টেস্ট',
        'ssc_school': 'শীর্ষ স্কুল ও ক্যাডেট টেস্ট',
        'ssc_science': 'এসএসসি বিজ্ঞান লাইভ টেস্ট',
        'ssc_business': 'এসএসসি বাণিজ্য লাইভ টেস্ট',
        'ssc_humanities': 'এসএসসি মানবিক লাইভ টেস্ট',
        'ssc_compulsory': 'এসএসসি আবশ্যিক লাইভ টেস্ট',
        'ssc': 'এসএসসি লাইভ এক্সাম',
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
      case 'question_bank':
      case 'question-bank':
        return 'প্রশ্ন ব্যাংক';
      case 'history':
        return 'ইতিহাস';
      case 'practice':
        return 'অনুশীলন';
      case 'leaderboard':
        return 'লিডারবোর্ড';
      case 'legends-league':
        return 'লেজেন্ডস লিগ';
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

    if (tab == 'history') {
      final currentLoc = GoRouterState.of(context).uri.toString();
      if (currentLoc != '/history') {
        widget.navigationShell.goBranch(0);
        context.go('/history');
      }
      return;
    }

    if (tab == 'analysis' || tab == 'progress') {
      final currentLoc = GoRouterState.of(context).uri.toString();
      if (currentLoc != '/analysis') {
        widget.navigationShell.goBranch(0);
        context.go('/analysis');
      }
      return;
    }

    if (tab == 'practice' || tab == 'my-reports') {
      widget.navigationShell.goBranch(0);
      context.push('/$tab');
      return;
    }

    int index = 0;
    switch (tab) {
      case 'dashboard':
        index = 0;
        break;
      case 'question_bank':
      case 'question-bank':
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
      context.go(tab == 'dashboard'
          ? '/'
          : (tab == 'question_bank' || tab == 'question-bank'
              ? '/question-bank'
              : '/$tab'));
    } else {
      widget.navigationShell.goBranch(
        index,
        initialLocation: index == widget.navigationShell.currentIndex,
      );
    }
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
    ref.listen<AsyncValue<NetworkStatus>>(connectivityStreamProvider, (
      prev,
      next,
    ) {
      if (next.value == NetworkStatus.online &&
          prev?.value == NetworkStatus.offline) {
        globalRefresh(ref);
      }
    });

    // Schedule local witty daily streak saver reminder (Chorcha style) + morning challenge + sync FCM
    ref.listen(userProfileProvider, (prev, next) {
      final u = next.value;
      if (u != null) {
        // ── Instant Administrative Kickout for Blocked/Suspended Users ──
        if (u.isBlocked) {
          WidgetsBinding.instance.addPostFrameCallback((_) async {
            if (mounted) {
              try {
                await Supabase.instance.client.auth.signOut();
              } catch (_) {}
              if (mounted) {
                AppPopups.show(
                  context,
                  message: 'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Suspended) করা হয়েছে। সহায়তার জন্য সাপোর্টে যোগাযোগ করুন।',
                  isError: true,
                );
                context.go('/login');
              }
            }
          });
          return;
        }

        NotificationService().scheduleDailyStreakReminders(
          userName: u.name,
          currentStreak: u.streakCount,
        );
        NotificationService().scheduleDailyMorningChallenge(
          userName: u.name,
        );
        NotificationService().syncFCMToken(u.id);

        if (prev?.value == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) {
              NotificationPermissionManager.maybeShowPrompt(context);
            }
          });
        }
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
    final isAtDashboardRoot =
        widget.navigationShell.currentIndex == 0 &&
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
        } else if (widget.navigationShell.currentIndex != 0 ||
            location != '/') {
          widget.navigationShell.goBranch(0);
          context.go('/');
        }
      },
      child: Scaffold(
        key: _scaffoldKey,
        backgroundColor: isDark
            ? const Color(0xFF000000)
            : const Color(0xFFFAFAF9),
        appBar: PreferredSize(
          preferredSize: const Size.fromHeight(52),
          child: ClipRect(
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
              child: Container(
                decoration: BoxDecoration(
                  color: isDark
                      ? const Color(0xFF000000).withValues(alpha: 0.85)
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
                    height: 52,
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
                                final currentLoc = GoRouterState.of(
                                  context,
                                ).uri.toString();
                                final dynamicTitle = ref.watch(
                                  locationTitleProvider,
                                )[currentLoc];
                                final titleText =
                                    dynamicTitle ?? _getTitle(activeTab);
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

                                final isSettingsSubPage =
                                    settingsSubTabs.contains(activeTab) ||
                                    (currentLoc.startsWith('/profile/') &&
                                        currentLoc != '/profile') ||
                                    currentLoc.startsWith('/bookmarks') ||
                                    currentLoc.startsWith('/my-reports') ||
                                    currentLoc.startsWith('/notifications');

                                final showBackButton =
                                    activeTab != 'setup' &&
                                    (isSettingsSubPage ||
                                        activeTab == 'legends-league' ||
                                        activeTab == 'practice' ||
                                        activeTab == 'analysis' ||
                                        activeTab == 'live_exam' ||
                                        activeTab.startsWith('subject_') ||
                                        isSubRoute ||
                                        context.canPop());

                                if (activeTab == 'setup') {
                                  final currentSetupTab = ref.watch(
                                    examSetupTabProvider,
                                  );
                                  return Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      _HeaderUnderlineTab(
                                        label: 'মক পরীক্ষা',
                                        isActive: currentSetupTab == 'mock',
                                        isDark: isDark,
                                        fontSize: 15.5,
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          ref
                                              .read(
                                                examSetupTabProvider.notifier,
                                              )
                                              .setTab('mock');
                                        },
                                      ),
                                      const SizedBox(width: 24),
                                      _HeaderUnderlineTab(
                                        label: 'প্রিসেট পরীক্ষা',
                                        isActive: currentSetupTab == 'preset',
                                        isDark: isDark,
                                        fontSize: 15.5,
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          ref
                                              .read(
                                                examSetupTabProvider.notifier,
                                              )
                                              .setTab('preset');
                                        },
                                      ),
                                    ],
                                  );
                                }

                                if (activeTab == 'question_bank') {
                                  final currentQbTab = ref.watch(
                                    questionBankTabProvider,
                                  );
                                  return Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      _HeaderUnderlineTab(
                                        label: 'প্রতিষ্ঠান ভিত্তিক',
                                        isActive: currentQbTab ==
                                            QuestionBankTab.institution,
                                        isDark: isDark,
                                        fontSize: 15.5,
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          ref
                                              .read(
                                                questionBankTabProvider
                                                    .notifier,
                                              )
                                              .setTab(
                                                QuestionBankTab.institution,
                                              );
                                        },
                                      ),
                                      const SizedBox(width: 24),
                                      _HeaderUnderlineTab(
                                        label: 'বিষয় ভিত্তিক',
                                        isActive: currentQbTab ==
                                            QuestionBankTab.subject,
                                        isDark: isDark,
                                        fontSize: 15.5,
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          ref
                                              .read(
                                                questionBankTabProvider
                                                    .notifier,
                                              )
                                              .setTab(QuestionBankTab.subject);
                                        },
                                      ),
                                    ],
                                  );
                                }

                                return Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (showBackButton) ...[
                                      GestureDetector(
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          if (context.canPop()) {
                                            context.pop();
                                          } else if (activeTab ==
                                              'legends-league') {
                                            widget.navigationShell.goBranch(3);
                                            context.go('/leaderboard');
                                          } else if (isSettingsSubPage) {
                                            widget.navigationShell.goBranch(4);
                                            context.go('/profile');
                                          } else {
                                            widget.navigationShell.goBranch(0);
                                            context.go('/');
                                          }
                                        },
                                        behavior: HitTestBehavior.opaque,
                                        child: Padding(
                                          padding: const EdgeInsets.only(
                                            right: 8,
                                            top: 4,
                                            bottom: 4,
                                          ),
                                          child: AppIcon(
                                            AppIcons.arrowLeft,
                                            size: 22,
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
                                            fontSize: isSubRoute ? 16.5 : 19.5,
                                            fontWeight: FontWeight.w700,
                                            fontFamily: 'HindSiliguri',
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
                                  message:
                                      'দৈনিক স্ট্রাইক: টানা পরীক্ষার দিনগুলো',
                                  preferredPosition: TooltipPosition.bottom,
                                  child: GestureDetector(
                                    onTap: user != null
                                        ? () => _triggerStreakAnimation(
                                            streak,
                                            user.id,
                                          )
                                        : null,
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
                                                    curve: Curves.easeOutBack,
                                                  ),
                                                  ShakeEffect(
                                                    hz: 4,
                                                    duration: 400.ms,
                                                    delay: 200.ms,
                                                  ),
                                                  ScaleEffect(
                                                    begin: const Offset(
                                                      1.4,
                                                      1.4,
                                                    ),
                                                    end: const Offset(1, 1),
                                                    duration: 250.ms,
                                                    delay: 600.ms,
                                                    curve: Curves.easeIn,
                                                  ),
                                                ]
                                              : [],
                                          child: const Icon(
                                            Icons.local_fire_department_rounded,
                                            color: Color(0xFFEF4444),
                                            size: 24,
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        isLoading
                                            ? Container(
                                                width: 16,
                                                height: 12,
                                                decoration: BoxDecoration(
                                                  color: isDark
                                                      ? const Color(0xFF3F3F46)
                                                      : const Color(0xFFE5E7EB),
                                                  borderRadius:
                                                      BorderRadius.circular(4),
                                                ),
                                              )
                                            : Animate(
                                                key: ValueKey(
                                                  'text_$_streakAnimKey',
                                                ),
                                                effects: _streakAnimKey > 0
                                                    ? [
                                                        ShimmerEffect(
                                                          color: const Color(
                                                            0xFFFDE047,
                                                          ),
                                                          duration: 600.ms,
                                                        ),
                                                      ]
                                                    : [],
                                                child: Text(
                                                  streak.toString(),
                                                  style: const TextStyle(
                                                    fontSize: 18.5,
                                                    fontWeight: FontWeight.bold,
                                                    color: Color(0xFFDC2626),
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
                                    final unread = ref.watch(
                                      unreadNotificationCountProvider,
                                    );
                                    return ObhyashTooltip(
                                      message: 'নতুন নোটিফিকেশন ও আপডেট',
                                      preferredPosition: TooltipPosition.bottom,
                                      child: GestureDetector(
                                        onTap: () =>
                                            context.push('/notifications'),
                                        behavior: HitTestBehavior.opaque,
                                        child: Stack(
                                          clipBehavior: Clip.none,
                                          alignment: Alignment.center,
                                          children: [
                                            Padding(
                                              padding:
                                                  const EdgeInsets.symmetric(
                                                    horizontal: 4.0,
                                                  ),
                                              child: AppIcon(
                                                AppIcons.bell,
                                                size: 24,
                                                color: isDark
                                                    ? const Color(0xFFD4D4D4)
                                                    : const Color(0xFF4B5563),
                                              ),
                                            ),
                                            if (unread > 0)
                                              Positioned(
                                                top: -4,
                                                right: -2,
                                                child: Container(
                                                  padding: const EdgeInsets.all(
                                                    4,
                                                  ),
                                                  decoration: BoxDecoration(
                                                    color: const Color(
                                                      0xFFEF4444,
                                                    ),
                                                    shape: BoxShape.circle,
                                                    border: Border.all(
                                                      color: isDark
                                                          ? const Color(
                                                              0xFF000000,
                                                            )
                                                          : Colors.white,
                                                      width: 1.5,
                                                    ),
                                                  ),
                                                  child: Text(
                                                    unread > 99
                                                        ? '99+'
                                                        : unread.toString(),
                                                    style: const TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 12.5,
                                                      fontWeight:
                                                          FontWeight.w900,
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
                                  margin: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                  ),
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
                                      isPro: user?.isPro ?? false,
                                      showBorder: !(user?.isPro ?? false),
                                      borderColor: isDark
                                          ? const Color(0xFF1C1C1E)
                                          : Colors.white,
                                      borderWidth: 1.5,
                                    ),
                                  ),
                                ),
                              ],
                            )
                          else if (activeTab == 'practice')
                            Consumer(
                              builder: (context, ref, _) {
                                final currentPracticeTab = ref.watch(
                                  practiceTabProvider,
                                );
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
                                        active:
                                            currentPracticeTab == 'mistakes',
                                        isDark: isDark,
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          ref
                                              .read(
                                                practiceTabProvider.notifier,
                                              )
                                              .setTab('mistakes');
                                        },
                                      ),
                                      _HeaderTabBtn(
                                        label: 'বুকমার্ক',
                                        active:
                                            currentPracticeTab == 'bookmarks',
                                        isDark: isDark,
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          ref
                                              .read(
                                                practiceTabProvider.notifier,
                                              )
                                              .setTab('bookmarks');
                                        },
                                      ),
                                    ],
                                  ),
                                );
                              },
                            )
                          else if (activeTab == 'history')
                            Consumer(
                              builder: (context, ref, _) {
                                final currentHistoryTab = ref.watch(
                                  examHistoryActiveTabProvider,
                                );
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
                                        label: 'পরীক্ষা',
                                        active: currentHistoryTab == 0,
                                        isDark: isDark,
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          ref
                                              .read(
                                                examHistoryActiveTabProvider
                                                    .notifier,
                                              )
                                              .setTab(0);
                                        },
                                      ),
                                      _HeaderTabBtn(
                                        label: 'প্রশ্ন',
                                        active: currentHistoryTab == 1,
                                        isDark: isDark,
                                        onTap: () {
                                          HapticFeedback.lightImpact();
                                          ref
                                              .read(
                                                examHistoryActiveTabProvider
                                                    .notifier,
                                              )
                                              .setTab(1);
                                        },
                                      ),
                                    ],
                                  ),
                                );
                              },
                            )
                          else if (activeTab == 'leaderboard')
                            Animate(
                              onPlay: (controller) =>
                                  controller.repeat(reverse: true),
                              effects: [
                                ScaleEffect(
                                  begin: const Offset(0.94, 0.94),
                                  end: const Offset(1.08, 1.08),
                                  duration: 900.ms,
                                  curve: Curves.easeInOut,
                                ),
                              ],
                              child: GestureDetector(
                                onTap: () {
                                  HapticFeedback.lightImpact();
                                  context.push('/legends-league');
                                },
                                behavior: HitTestBehavior.opaque,
                                child: const Padding(
                                  padding: EdgeInsets.symmetric(
                                    vertical: 6,
                                    horizontal: 4,
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      AppIcon(
                                        AppIcons.crown,
                                        size: 16,
                                        color: Color(0xFFEF4444),
                                      ),
                                      SizedBox(width: 5),
                                      Text(
                                        'লেজেন্ডস লিগ',
                                        style: TextStyle(
                                          fontFamily: 'HindSiliguri',
                                          fontSize: 15.5,
                                          fontWeight: FontWeight.w900,
                                          color: Color(0xFFEF4444),
                                          letterSpacing: -0.2,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
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
          gender: user?.gender,
          id: user?.id,
          isPro: user?.isPro ?? false,
        ),

        body: widget.navigationShell,

        bottomNavigationBar: _shouldShowBottomNav(location)
            ? MainBottomNav(
                activeTab:
                    (activeTab == 'question_bank' ||
                        activeTab == 'question-bank' ||
                        activeTab == 'history' ||
                        activeTab == 'setup' ||
                        activeTab == 'analysis' ||
                        activeTab == 'leaderboard' ||
                        activeTab == 'settings')
                    ? activeTab
                    : 'dashboard',
                onTabChange: _onTabChange,
                onMenuClick: () {
                  if (_scaffoldKey.currentState?.isDrawerOpen == true) {
                    _scaffoldKey.currentState?.closeDrawer();
                  } else {
                    _scaffoldKey.currentState?.openDrawer();
                  }
                },
              )
            : null,
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
          color: active ? const Color(0xFF12544F) : Colors.transparent,
          borderRadius: BorderRadius.circular(9),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: active
                ? Colors.white
                : (isDark ? const Color(0xFFA1A1AA) : const Color(0xFF71717A)),
            fontSize: 13.0,
            fontWeight: active ? FontWeight.w600 : FontWeight.normal,
            fontFamily: 'HindSiliguri',
          ),
        ),
      ),
    );
  }
}

class _HeaderUnderlineTab extends StatelessWidget {
  final String label;
  final bool isActive;
  final bool isDark;
  final double fontSize;
  final VoidCallback onTap;

  const _HeaderUnderlineTab({
    required this.label,
    required this.isActive,
    required this.isDark,
    this.fontSize = 15.5,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final activeColor = isDark ? Colors.white : const Color(0xFF0F172A);
    final inactiveColor =
        isDark ? const Color(0xFFA1A1AA) : const Color(0xFF64748B);
    final indicatorColor =
        isDark ? const Color(0xFF10B981) : const Color(0xFF004633);

    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: IntrinsicWidth(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: fontSize,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
                fontFamily: 'HindSiliguri',
                letterSpacing: -0.2,
                color: isActive ? activeColor : inactiveColor,
              ),
            ),
            const SizedBox(height: 3),
            Container(
              height: 3,
              decoration: BoxDecoration(
                color: isActive ? indicatorColor : Colors.transparent,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
