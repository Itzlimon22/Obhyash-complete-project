import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'widgets/main_sidebar.dart';
import 'widgets/main_bottom_nav.dart';
import '../../features/dashboard/providers/dashboard_providers.dart';
import '../../features/auth/providers/auth_controller.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';

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
    if (location.startsWith('/profile')) return 'profile';
    if (location.startsWith('/subscription')) return 'subscription';
    if (location.startsWith('/complaint')) return 'complaint';
    if (location.startsWith('/about')) return 'about';
    if (location.startsWith('/user-profile')) return 'user_profile';
    if (location.startsWith('/subject')) return 'subject_report';
    if (location.startsWith('/blog')) return 'blog';
    if (location.startsWith('/referral')) return 'referral';
    return 'dashboard';
  }

  String _getTitle(String tab) {
    switch (tab) {
      case 'dashboard':
        return '\u09a1\u09cd\u09af\u09be\u09b6\u09ac\u09cb\u09b0\u09cd\u09a1';
      case 'setup':
        return '\u09ae\u0995 \u09aa\u09b0\u09c0\u0995\u09cd\u09b7\u09be \u09b6\u09c1\u09b0\u09c1';
      case 'history':
        return '\u09aa\u09c2\u09b0\u09cd\u09ac\u09c7\u09b0 \u09aa\u09b0\u09c0\u0995\u09cd\u09b7\u09be \u09b8\u09ae\u09c2\u09b9';
      case 'practice':
        return '\u0985\u09a8\u09c1\u09b6\u09c0\u09b2\u09a8 \u09ac\u09cb\u09b0\u09cd\u09a1';
      case 'leaderboard':
        return '\u09b2\u09bf\u09a1\u09be\u09b0\u09ac\u09cb\u09b0\u09cd\u09a1';
      case 'analysis':
        return '\u09ac\u09bf\u09b7\u09af\u09bc\u09ad\u09bf\u09a4\u09cd\u09a4\u09bf\u0995 \u098f\u09a8\u09be\u09b2\u09be\u0987\u09b8\u09bf\u09b8';
      case 'my-reports':
        return '\u0986\u09ae\u09be\u09b0 \u09b0\u09bf\u09aa\u09cb\u09b0\u09cd\u099f';
      case 'profile':
        return '\u0986\u09ae\u09be\u09b0 \u09aa\u09cd\u09b0\u09cb\u09ab\u09be\u0987\u09b2';
      case 'subscription':
        return '\u09b8\u09be\u09ac\u09b8\u09cd\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u0993 \u09ac\u09bf\u09b2\u09bf\u0982';
      case 'complaint':
        return '\u0985\u09ad\u09bf\u09af\u09cb\u0997 \u0993 \u09aa\u09b0\u09be\u09ae\u09b0\u09cd\u09b6';
      case 'about':
        return '\u0986\u09ae\u09be\u09a6\u09c7\u09b0 \u09b8\u09ae\u09cd\u09aa\u09b0\u09cd\u0995\u09c7';
      case 'user_profile':
        return '\u09aa\u09cd\u09b0\u09cb\u09ab\u09be\u0987\u09b2';
      case 'subject_report':
        return '\u09ac\u09bf\u09b7\u09af\u09bc \u09b0\u09bf\u09aa\u09cb\u09b0\u09cd\u099f';
      case 'blog':
        return '\u09ac\u09cd\u09b2\u0997';
      case 'referral':
        return '\u09b0\u09c7\u09ab\u09be\u09b0\u09c7\u09b2 \u09aa\u09cd\u09b0\u09cb\u0997\u09cd\u09b0\u09be\u09ae';
      default:
        return '\u09a1\u09cd\u09af\u09be\u09b6\u09ac\u09cb\u09b0\u09cd\u09a1';
    }
  }

  void _onTabChange(String tab) {
    if (tab == 'blog') {
      context.go('/blog');
      return;
    }
    if (tab == 'dashboard') {
      context.go('/');
    } else {
      context.go('/$tab');
    }
  }

  void _showProfileSheet(BuildContext ctx, dynamic user) {
    final isDark = Theme.of(ctx).brightness == Brightness.dark;
    showModalBottomSheet(
      context: ctx,
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
          context.go(route);
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
        preferredSize: const Size.fromHeight(56),
        child: ClipRect(
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF0C0A09).withValues(alpha: 0.85)
                    : Colors.white.withValues(alpha: 0.85),
                border: Border(
                  bottom: BorderSide(
                    color: isDark
                        ? const Color(0xFF262626).withValues(alpha: 0.6)
                        : const Color(0xFFE5E5E5).withValues(alpha: 0.6),
                    width: 1,
                  ),
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: SizedBox(
                  height: 56,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Left: Logo + back button + title
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (activeTab == 'user_profile' ||
                                activeTab == 'subject_report') ...[
                              GestureDetector(
                                onTap: () => context.pop(),
                                child: Container(
                                  width: 32,
                                  height: 32,
                                  margin: const EdgeInsets.only(right: 8),
                                  decoration: BoxDecoration(
                                    color: isDark
                                        ? const Color(0xFF262626)
                                        : const Color(0xFFF5F5F5),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Icon(
                                    LucideIcons.chevronLeft,
                                    size: 18,
                                    color: isDark
                                        ? const Color(0xFFD4D4D4)
                                        : const Color(0xFF404040),
                                  ),
                                ),
                              ),
                            ] else ...[
                              // Brand logo — always shown except sub-pages
                              Container(
                                width: 30,
                                height: 30,
                                margin: const EdgeInsets.only(right: 8),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFFDC2626),
                                      Color(0xFFB91C1C),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(9),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(
                                        0xFFDC2626,
                                      ).withValues(alpha: 0.3),
                                      blurRadius: 8,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: const Center(
                                  child: Text(
                                    'O',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w900,
                                      height: 1,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                            Text(
                              _getTitle(activeTab),
                              style: TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w800,
                                fontFamily: 'HindSiliguri',
                                color: isDark
                                    ? Colors.white
                                    : const Color(0xFF171717),
                              ),
                            ),
                          ],
                        ),

                        // Right: Streak + Bell + divider + Avatar
                        Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            // Streak Badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 9,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(
                                        0xFF7C2D12,
                                      ).withValues(alpha: 0.15)
                                    : const Color(0xFFFFF7ED),
                                border: Border.all(
                                  color: isDark
                                      ? const Color(
                                          0xFF7C2D12,
                                        ).withValues(alpha: 0.3)
                                      : const Color(0xFFFFEDD5),
                                ),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.local_fire_department_rounded,
                                    color: Color(0xFFF97316),
                                    size: 16,
                                  ),
                                  const SizedBox(width: 3),
                                  isLoading
                                      ? Container(
                                          width: 14,
                                          height: 10,
                                          decoration: BoxDecoration(
                                            color: isDark
                                                ? const Color(0xFF3F3F46)
                                                : const Color(0xFFE5E7EB),
                                            borderRadius: BorderRadius.circular(
                                              3,
                                            ),
                                          ),
                                        )
                                      : Text(
                                          streak.toString(),
                                          style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: Color(0xFFEA580C),
                                          ),
                                        ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),

                            // Notification Bell
                            Builder(
                              builder: (context) {
                                final unreadAsync = ref.watch(
                                  _unreadNotifCountProvider,
                                );
                                final unread =
                                    unreadAsync.whenOrNull(data: (c) => c) ?? 0;
                                return GestureDetector(
                                  onTap: () => context.push('/notifications'),
                                  child: Stack(
                                    clipBehavior: Clip.none,
                                    children: [
                                      Container(
                                        width: 34,
                                        height: 34,
                                        decoration: BoxDecoration(
                                          color: isDark
                                              ? const Color(0xFF262626)
                                              : const Color(0xFFF5F5F5),
                                          borderRadius: BorderRadius.circular(
                                            10,
                                          ),
                                        ),
                                        child: Icon(
                                          LucideIcons.bell,
                                          size: 16,
                                          color: isDark
                                              ? const Color(0xFFA3A3A3)
                                              : const Color(0xFF525252),
                                        ),
                                      ),
                                      if (unread > 0)
                                        Positioned(
                                          top: -3,
                                          right: -3,
                                          child: Container(
                                            padding: const EdgeInsets.all(2),
                                            constraints: const BoxConstraints(
                                              minWidth: 14,
                                              minHeight: 14,
                                            ),
                                            decoration: const BoxDecoration(
                                              color: Color(0xFFF43F5E),
                                              shape: BoxShape.circle,
                                            ),
                                            child: Text(
                                              unread > 99
                                                  ? '99+'
                                                  : unread.toString(),
                                              textAlign: TextAlign.center,
                                              style: const TextStyle(
                                                color: Colors.white,
                                                fontSize: 8,
                                                fontWeight: FontWeight.bold,
                                                height: 1.2,
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
                              height: 20,
                              margin: const EdgeInsets.symmetric(horizontal: 8),
                              color: isDark
                                  ? const Color(0xFF404040)
                                  : const Color(0xFFE5E5E5),
                            ),

                            // Profile Avatar
                            GestureDetector(
                              onTap: () => _showProfileSheet(context, user),
                              child: Container(
                                width: 34,
                                height: 34,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFFF43F5E),
                                      Color(0xFFE11D48),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  shape: BoxShape.circle,
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(
                                        0xFFE11D48,
                                      ).withValues(alpha: 0.3),
                                      blurRadius: 6,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
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
      ),

      body: widget.child,

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
    final bg = isDark ? const Color(0xFF171717) : Colors.white;
    final surface = isDark ? const Color(0xFF262626) : const Color(0xFFF5F5F5);
    final border = isDark ? const Color(0xFF404040) : const Color(0xFFE5E5E5);
    final textPrimary = isDark ? Colors.white : const Color(0xFF171717);
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
            '\u09b8\u09be\u09ac\u09b8\u09cd\u0995\u09cd\u09b0\u09bf\u09aa\u09b6\u09a8 \u0993 \u09ac\u09bf\u09b2\u09bf\u0982',
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
                    ? const Color(0xFF404040)
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
                      color: Color(0xFFE11D48),
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: Text(
                        userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 20,
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
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            fontFamily: 'HindSiliguri',
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
                              fontSize: 12,
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
                              fontSize: 11,
                              color: textSecondary,
                              fontFamily: 'HindSiliguri',
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
                          ? const Color(0xFF052E16)
                          : const Color(0xFFD1FAE5),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '$xp XP',
                      style: const TextStyle(
                        fontSize: 12,
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
                          fontSize: 14,
                          fontFamily: 'HindSiliguri',
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
                        fontSize: 14,
                        fontFamily: 'HindSiliguri',
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
                            ? const Color(0xFF047857)
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
                        color: Color(0xFFE11D48),
                      ),
                    ),
                    const SizedBox(width: 14),
                    const Text(
                      '\u09b2\u0997\u0986\u0989\u099f',
                      style: TextStyle(
                        fontSize: 14,
                        fontFamily: 'HindSiliguri',
                        fontWeight: FontWeight.w600,
                        color: Color(0xFFE11D48),
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
