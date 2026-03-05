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

    // 5 items: dashboard, history, [center FAB: setup], leaderboard, menu
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

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0A0A0A) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xCC262626) : const Color(0xCCE5E5E5),
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            // Bottom-align so center FAB naturally rises above others
            crossAxisAlignment: CrossAxisAlignment.end,
            children: items.map((item) {
              final id = item['id'] as String;
              final icon = item['icon'] as IconData;
              final label = item['label'] as String;
              final action = item['action'] as String?;
              final isCenter = item['isCenter'] as bool? ?? false;
              final isActive = activeTab == id;

              void handleTap() {
                HapticFeedback.lightImpact();
                if (action == 'menu') {
                  onMenuClick();
                } else {
                  onTabChange(id);
                }
              }

              /* ── Center FAB (পরীক্ষা) ─────────────────────────── */
              if (isCenter) {
                return Expanded(
                  child: GestureDetector(
                    onTap: handleTap,
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Raised FAB — extra top space lifts it above the bar
                        const SizedBox(height: 4),
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: isActive
                                ? const Color(0xFF047857) // emerald-700
                                : (isDark
                                      ? Colors.white
                                      : const Color(
                                          0xFF171717,
                                        )), // white dark / neutral-900 light
                            borderRadius: BorderRadius.circular(14),
                            boxShadow: [
                              BoxShadow(
                                color: isActive
                                    ? const Color(0x4D047857)
                                    : (isDark
                                          ? const Color(0x18FFFFFF)
                                          : const Color(0x22171717)),
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
                                      ? const Color(0xFF171717)
                                      : Colors.white),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: 10,
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.bold,
                            color: isActive
                                ? const Color(0xFF047857)
                                : (isDark
                                      ? const Color(0xFF737373)
                                      : const Color(0xFFA3A3A3)),
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                    ),
                  ),
                );
              }

              /* ── Regular Tab ──────────────────────────────────── */
              final activeColor = isDark
                  ? const Color(0xFF10B981) // emerald-500
                  : const Color(0xFF047857); // emerald-700
              final inactiveColor = isDark
                  ? const Color(0xFF737373) // neutral-500
                  : const Color(0xFFA3A3A3); // neutral-400
              final itemColor = (isActive && action != 'menu')
                  ? activeColor
                  : inactiveColor;

              return Expanded(
                child: GestureDetector(
                  onTap: handleTap,
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Active top indicator pill
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: (isActive && action != 'menu') ? 32 : 0,
                        height: 2.5,
                        decoration: BoxDecoration(
                          color: activeColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Icon(icon, size: 22, color: itemColor),
                      const SizedBox(height: 4),
                      Text(
                        label,
                        style: TextStyle(
                          fontSize: 10,
                          fontFamily: 'HindSiliguri',
                          fontWeight: (isActive && action != 'menu')
                              ? FontWeight.bold
                              : FontWeight.w500,
                          color: itemColor,
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}
