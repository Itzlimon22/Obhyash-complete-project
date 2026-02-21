import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import 'widgets/main_sidebar.dart';
import 'widgets/main_bottom_nav.dart';
import '../../features/dashboard/providers/dashboard_providers.dart';
import '../../features/auth/providers/auth_controller.dart';

class MainLayout extends ConsumerStatefulWidget {
  final Widget child;

  const MainLayout({super.key, required this.child});

  @override
  ConsumerState<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends ConsumerState<MainLayout> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  String _getActiveTab(String location) {
    if (location.startsWith('/history')) return 'history';
    if (location.startsWith('/setup')) return 'setup';
    if (location.startsWith('/practice')) return 'practice';
    if (location.startsWith('/leaderboard')) return 'leaderboard';
    if (location.startsWith('/analysis')) return 'analysis';
    if (location.startsWith('/my-reports')) return 'my-reports';
    if (location.startsWith('/complaint')) return 'complaint';
    if (location.startsWith('/about')) return 'about';
    return 'dashboard';
  }

  String _getTitle(String tab) {
    switch (tab) {
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
        return 'বিষয়ভিত্তিক এনালাইসিস';
      case 'my-reports':
        return 'আমার রিপোর্ট';
      case 'complaint':
        return 'অভিযোগ ও পরামর্শ';
      case 'about':
        return 'আমাদের সম্পর্কে';
      default:
        return 'ড্যাশবোর্ড';
    }
  }

  void _onTabChange(String tab) {
    if (tab == 'dashboard') {
      context.go('/');
    } else {
      context.go('/$tab');
    }
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.toString();
    final activeTab = _getActiveTab(location);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // We can fetch user explicitly or read from Provider.
    final userProfileAsync = ref.watch(userProfileProvider);
    final user = userProfileAsync.whenOrNull(data: (data) => data);
    final userName = user?.name ?? 'Loading...';
    final userInst = user?.institute ?? 'Unknown Sub';
    final streak = user?.streakCount ?? 0;

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: isDark
          ? const Color(0xFF0C0A09)
          : const Color(0xFFFAFAF9), // neutral-950 : neutral-50
      // Header
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(56), // h-14
        child: Container(
          decoration: BoxDecoration(
            color: isDark
                ? const Color(0xCC0C0A09)
                : const Color(0xCCFFFFFF), // bg-white/80
            border: Border(
              bottom: BorderSide(
                color: isDark
                    ? const Color(0x99262626)
                    : const Color(0x99E5E5E5), // neutral-800/60
                width: 1,
              ),
            ),
          ),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    _getTitle(activeTab),
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'HindSiliguri',
                      color: isDark
                          ? Colors.white
                          : const Color(0xFF262626), // neutral-800
                    ),
                  ),
                  Row(
                    children: [
                      // Streak Badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isDark
                              ? const Color(0x1a7c2d12)
                              : const Color(
                                  0xFFFFF7ED,
                                ), // orange-900/10 : orange-50
                          border: Border.all(
                            color: isDark
                                ? const Color(0x337c2d12)
                                : const Color(
                                    0xFFFFEDD5,
                                  ), // orange-900/20 : orange-100
                          ),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.local_fire_department_rounded,
                              color: Color(0xFFF97316),
                              size: 18,
                            ), // orange-500
                            const SizedBox(width: 4),
                            Text(
                              streak.toString(),
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFFEA580C), // orange-600
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Notification Bell
                      IconButton(
                        icon: const Icon(LucideIcons.bell, size: 22),
                        color: isDark
                            ? const Color(0xFFA3A3A3)
                            : const Color(0xFF525252), // neutral-400 : 600
                        onPressed: () {}, // Notifications not implemented yet
                      ),

                      // Profile Avatar
                      const SizedBox(width: 8),
                      Container(
                        width: 32,
                        height: 32,
                        decoration: const BoxDecoration(
                          color: Color(0xFFE11D48), // rose-600
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            userName.isNotEmpty
                                ? userName[0].toUpperCase()
                                : 'U',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
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

      // Sidebar
      drawer: MainSidebar(
        activeTab: activeTab,
        onTabChange: _onTabChange,
        onLogout: () {
          ref.read(authControllerProvider.notifier).logout();
        },
        toggleTheme: () {
          // Handle theme toggle inside App
        },
        userName: userName,
        userInstitute: userInst,
      ),

      // Content
      body: widget.child,

      // Mobile Bottom Nav
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
