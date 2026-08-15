import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:lucide_icons/lucide_icons.dart';

class MainBottomNav extends StatelessWidget {
  final String activeTab;
  final Function(String) onTabChange;
  final VoidCallback onMenuClick;

  const MainBottomNav({
    super.key,
    required this.activeTab,
    required this.onTabChange,
    required this.onMenuClick,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final items = [
      {'id': 'dashboard', 'label': 'হোম', 'icon': LucideIcons.layoutDashboard},
      {'id': 'history', 'label': 'ইতিহাস', 'icon': LucideIcons.history},
      {
        'id': 'setup',
        'label': 'পরীক্ষা',
        'icon': LucideIcons.fileEdit,
        'isCenter': true,
      },
      {'id': 'leaderboard', 'label': 'র‍্যাংক', 'icon': LucideIcons.trophy},
      {
        'id': 'menu',
        'label': 'মেনু',
        'icon': LucideIcons.menu,
        'action': 'menu',
      },
    ];

    final activeColor = isDark
        ? const Color(0xFF10B981)
        : const Color(0xFF004633);
    final inactiveColor = isDark
        ? const Color(0xFF737373)
        : const Color(0xFF9CA3AF);
    final bgColor = isDark ? const Color(0xFF000000) : Colors.white;
    final borderColor = isDark
        ? const Color(0xFF1C1C1E)
        : const Color(0xFFE5E5E5);

    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Container(
      color: Colors.transparent, // Wrapper
      child: SizedBox(
        height:
            60 +
            bottomPadding, // Only the background height. Stack with Clip.none will let FAB overflow.
        child: Stack(
          clipBehavior: Clip.none,
          alignment: Alignment.bottomCenter,
          children: [
            // 1. The actual bottom bar background extending to the very bottom
            Container(
              height: 60 + bottomPadding,
              decoration: BoxDecoration(
                color: bgColor,
                border: Border(top: BorderSide(color: borderColor, width: 1)),
                boxShadow: [
                  BoxShadow(
                    color: isDark
                        ? const Color(0x40000000)
                        : const Color(0x10000000),
                    blurRadius: 16,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
            ),

            // 2. The Tabs inside a Row positioned above the safe area
            Positioned(
              bottom: bottomPadding,
              left: 0,
              right: 0,
              child: SizedBox(
                height: 85,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: items.map((item) {
                    final id = item['id'] as String;
                    final icon = item['icon'] as IconData;
                    final label = item['label'] as String;
                    final action = item['action'] as String?;
                    final isCenter = item['isCenter'] as bool? ?? false;
                    final isActive = activeTab == id;
                    final isRealActive = isActive && action != 'menu';

                    void handleTap() {
                      HapticFeedback.lightImpact();
                      if (action == 'menu') {
                        onMenuClick();
                      } else {
                        onTabChange(id);
                      }
                    }

                    /* ── Center FAB ("পরীক্ষা") ───────────────────────────── */
                    if (isCenter) {
                      return Expanded(
                        child: GestureDetector(
                          onTap: handleTap,
                          behavior: HitTestBehavior.opaque,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              // The FAB itself (sticks out of the bar)
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                width: 52,
                                height: 52,
                                decoration: BoxDecoration(
                                  color: isActive
                                      ? activeColor
                                      : (isDark
                                            ? Colors.white
                                            : const Color(0xFF000000)),
                                  borderRadius: BorderRadius.circular(
                                    16,
                                  ), // Web uses rounded-2xl
                                  boxShadow: [
                                    BoxShadow(
                                      color: isActive
                                          ? activeColor.withValues(alpha: 0.3)
                                          : (isDark
                                                ? Colors.white.withValues(
                                                    alpha: 0.1,
                                                  )
                                                : Colors.black.withValues(
                                                    alpha: 0.2,
                                                  )),
                                      blurRadius: 12,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Icon(
                                  icon,
                                  size: 22,
                                  color: isActive
                                      ? Colors.white
                                      : (isDark
                                            ? const Color(0xFF000000)
                                            : Colors.white),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                label,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: FontWeight.bold,
                                  color: isActive ? activeColor : inactiveColor,
                                ),
                              ),
                              const SizedBox(height: 4), // padding from bottom
                            ],
                          ),
                        ),
                      );
                    }

                    /* ── Regular Tab ──────────────────────────────────────── */
                    return Expanded(
                      child: GestureDetector(
                        onTap: handleTap,
                        behavior: HitTestBehavior.opaque,
                        child: SizedBox(
                          height: 60, // Match the bottom bar background height
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.start,
                            children: [
                              // Active indicator pill at top
                              AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                width: isRealActive ? 32 : 0,
                                height: 2.5,
                                decoration: BoxDecoration(
                                  color: activeColor,
                                  borderRadius: const BorderRadius.only(
                                    bottomLeft: Radius.circular(4),
                                    bottomRight: Radius.circular(4),
                                  ),
                                ),
                              ),
                              const Spacer(),
                              Icon(
                                icon,
                                size: 22,
                                color: isRealActive
                                    ? activeColor
                                    : inactiveColor,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                label,
                                style: TextStyle(
                                  fontSize: 15,
                                  fontFamily: 'Anek Bangla',
                                  fontWeight: isRealActive
                                      ? FontWeight.bold
                                      : FontWeight.w500,
                                  color: isRealActive
                                      ? activeColor
                                      : inactiveColor,
                                ),
                              ),
                              const SizedBox(height: 6), // padding from bottom
                            ],
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
