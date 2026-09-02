import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'user_avatar.dart';
import 'obhyash_tooltip.dart';

class MainSidebar extends StatelessWidget {
  final String activeTab;
  final Function(String) onTabChange;
  final VoidCallback onLogout;
  final VoidCallback toggleTheme;
  final String userName;
  final String userInstitute;
  final String? avatarUrl;

  const MainSidebar({
    super.key,
    required this.activeTab,
    required this.onTabChange,
    required this.onLogout,
    required this.toggleTheme,
    required this.userName,
    required this.userInstitute,
    this.avatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final menuItems = [
      {
        'id': 'dashboard',
        'label': 'ড্যাশবোর্ড',
        'icon': LucideIcons.layoutDashboard,
        'svg': 'assets/dashboard-icons/dashboard_grid.svg',
      },
      {
        'id': 'setup',
        'label': 'পরীক্ষা',
        'icon': LucideIcons.fileEdit,
        'svg': 'assets/dashboard-icons/exam_pencil.svg',
      },
      {
        'id': 'live_exam',
        'label': 'লাইভ পরীক্ষা',
        'icon': LucideIcons.radio,
        'svg': 'assets/dashboard-icons/live_exam.svg',
      },
      {
        'id': 'history',
        'label': 'ইতিহাস',
        'icon': LucideIcons.history,
        'svg': 'assets/dashboard-icons/history_clock.svg',
      },
      {
        'id': 'practice',
        'label': 'অনুশীলন',
        'icon': LucideIcons.penTool,
        'svg': 'assets/dashboard-icons/practice_target.svg',
      },
      {
        'id': 'leaderboard',
        'label': 'লিডারবোর্ড',
        'icon': LucideIcons.trophy,
        'svg': 'assets/dashboard-icons/leaderboard_trophy.svg',
      },
      {
        'id': 'analysis',
        'label': 'এনালাইসিস',
        'icon': LucideIcons.barChart2,
        'svg': 'assets/dashboard-icons/analytics.svg',
      },
      {
        'id': 'formulas',
        'label': 'ফর্মুলা',
        'icon': LucideIcons.sigma,
        'svg': 'assets/dashboard-icons/formulas.svg',
      },
      {
        'id': 'blog',
        'label': 'ব্লগ',
        'icon': LucideIcons.newspaper,
        'svg': 'assets/dashboard-icons/blog_news.svg',
      },
    ];

    return Drawer(
      width: 250,
      backgroundColor: isDark
          ? const Color(0xFF000000) // OLED Black
          : Colors.white,
      elevation: 16,
      child: SafeArea(
        child: Column(
          children: [
            // Brand
            InkWell(
              onTap: () {
                onTabChange('dashboard');
                Navigator.pop(context); // Close drawer
              },
              child: Container(
                height: 64, // h-16
                padding: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  border: Border(
                    bottom: BorderSide(
                      color: isDark
                          ? const Color(0xFF2C2C2C)
                          : const Color(0xFFE5E7EB),
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(10),
                      child: SizedBox(
                        width: 38,
                        height: 38,
                        child: SvgPicture.asset(
                          'assets/images/obhyash_logo.svg',
                          fit: BoxFit.cover,
                          placeholderBuilder: (_) => Image.asset(
                            'assets/images/app_logo.png',
                            width: 38,
                            height: 38,
                            fit: BoxFit.cover,
                            errorBuilder: (ctx, err, stack) => Container(
                              color: const Color(0xFF059669),
                              child: const Icon(
                                LucideIcons.bookOpen,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'OBHYASH',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? const Color(0xFF737373)
                                : const Color(
                                    0xFFA3A3A3,
                                  ),
                            letterSpacing: 1.8,
                          ),
                        ),
                        Text(
                          'অভ্যাস',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w600,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF000000),
                            fontFamily: 'Anek Bangla',
                            height: 1.1,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Navigation
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 20,
                ),
                itemCount: menuItems.length,
                itemBuilder: (context, index) {
                  final item = menuItems[index];
                  final id = item['id'] as String;
                  final label = item['label'] as String;
                  final icon = item['icon'] as IconData;
                  final svgAsset = item['svg'] as String?;
                  final isActive = activeTab == id;

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: InkWell(
                      onTap: () {
                        onTabChange(id);
                        Navigator.pop(context); // Close drawer on mobile
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 9,
                        ),
                        decoration: BoxDecoration(
                          color: isActive
                              ? (isDark
                                  ? const Color(0xFF092328) // Deep Midnight Teal
                                  : const Color(0xFF12544F)) // Viridian Forest
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          border: isActive
                              ? Border.all(
                                  color: isDark
                                      ? const Color(0xFF2C2C2C)
                                      : const Color(0xFF12544F),
                                  width: 1,
                                )
                              : null,
                        ),
                        child: Row(
                          children: [
                            if (svgAsset != null)
                              SizedBox(
                                width: 28,
                                height: 28,
                                child: SvgPicture.asset(
                                  svgAsset,
                                  fit: BoxFit.contain,
                                  placeholderBuilder: (_) => Icon(
                                    icon,
                                    size: 20,
                                    color: isActive
                                        ? Colors.white
                                        : (isDark
                                            ? const Color(0xFFA3A3A3)
                                            : const Color(0xFF525252)),
                                  ),
                                ),
                              )
                            else
                              Icon(
                                icon,
                                size: 20,
                                color: isActive
                                    ? Colors.white
                                    : (isDark
                                        ? const Color(0xFFA3A3A3)
                                        : const Color(0xFF525252)),
                              ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                label,
                                style: TextStyle(
                                  fontSize: 14,
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: isActive
                                      ? FontWeight.w600
                                      : FontWeight.normal,
                                  letterSpacing: 0.2,
                                  color: isActive
                                      ? Colors.white
                                      : (isDark
                                          ? const Color(0xFFE5E5E5)
                                          : const Color(0xFF525252)),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),

            // Bottom Section
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isDark
                    ? const Color(0xFF000000)
                    : const Color(0xFFFAFAFA),
                border: Border(
                  top: BorderSide(
                    color: isDark
                        ? const Color(0xFF2C2C2C)
                        : const Color(0xFFE5E7EB),
                  ),
                ),
              ),
              child: Column(
                children: [
                  // User Button
                  InkWell(
                    onTap: () {
                      onTabChange('profile');
                      Navigator.pop(context);
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: isDark
                            ? const Color(0xFF092328)
                            : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF2C2C2C)
                              : const Color(0xFFE5E7EB),
                        ),
                      ),
                      child: Row(
                        children: [
                          UserAvatar(
                            name: userName,
                            avatarUrl: avatarUrl,
                            size: 36,
                            showBorder: true,
                            borderColor: Colors.white,
                            borderWidth: 1.5,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  userName,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                    color: isDark
                                        ? Colors.white
                                        : const Color(0xFF000000),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  'Settings & Profile',
                                  style: TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.normal,
                                    color: isDark
                                        ? const Color(0xFFA3A3A3)
                                        : const Color(0xFF737373),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Icon(
                            LucideIcons.chevronRight,
                            size: 16,
                            color: isDark
                                ? const Color(0xFFA3A3A3)
                                : const Color(0xFFA3A3A3),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Actions Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      ObhyashTooltip(
                        message: isDark ? 'লাইট মোড চালু করো' : 'ডার্ক মোড চালু করো',
                        preferredPosition: TooltipPosition.top,
                        child: IconButton(
                          onPressed: toggleTheme,
                          icon: Icon(
                            isDark ? LucideIcons.sun : LucideIcons.moon,
                            size: 20,
                          ),
                          color: const Color(0xFF737373),
                          style: IconButton.styleFrom(
                            backgroundColor: isDark
                                ? const Color(0xFF1C1C1E)
                                : Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ),
                      ),
                      ObhyashTooltip(
                        message: 'লগআউট করো',
                        preferredPosition: TooltipPosition.top,
                        child: IconButton(
                          onPressed: () {
                            Navigator.pop(context);
                            onLogout();
                          },
                          icon: const Icon(LucideIcons.logOut, size: 20),
                          color: const Color(0xFF737373),
                          style:
                              IconButton.styleFrom(
                                hoverColor: const Color(
                                  0x33E11D48,
                                ), // rose-600/20
                                backgroundColor: isDark
                                    ? const Color(0xFF1C1C1E)
                                    : Colors.white,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ).copyWith(
                                foregroundColor: WidgetStateProperty.resolveWith((
                                  states,
                                ) {
                                  if (states.contains(WidgetState.hovered)) {
                                    return const Color(
                                      0xFFB91C1C,
                                    ); // hover:text-rose-600
                                  }
                                  return null;
                                }),
                              ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
