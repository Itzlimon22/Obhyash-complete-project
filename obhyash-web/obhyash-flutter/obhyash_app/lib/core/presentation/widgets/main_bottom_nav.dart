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
        color: isDark ? const Color(0xFF0F0F0F) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: isDark ? const Color(0x40000000) : const Color(0x18000000),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
        border: Border(
          top: BorderSide(
            color: isDark ? const Color(0xFF262626) : const Color(0xFFE5E5E5),
            width: 1,
          ),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 6.0),
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
                        const SizedBox(height: 2),
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 62,
                          height: 62,
                          decoration: BoxDecoration(
                            gradient: isActive
                                ? const LinearGradient(
                                    colors: [
                                      Color(0xFF059669),
                                      Color(0xFF047857),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  )
                                : null,
                            color: isActive
                                ? null
                                : (isDark
                                      ? const Color(0xFF1A1A1A)
                                      : const Color(0xFF171717)),
                            borderRadius: BorderRadius.circular(18),
                            boxShadow: [
                              BoxShadow(
                                color: isActive
                                    ? const Color(0x5D047857)
                                    : (isDark
                                          ? const Color(0x25FFFFFF)
                                          : const Color(0x30171717)),
                                blurRadius: isActive ? 16 : 8,
                                spreadRadius: isActive ? 2 : 0,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Icon(icon, size: 26, color: Colors.white),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: 11,
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.bold,
                            color: isActive
                                ? const Color(0xFF047857)
                                : (isDark
                                      ? const Color(0xFF737373)
                                      : const Color(0xFFA3A3A3)),
                          ),
                        ),
                        const SizedBox(height: 6),
                      ],
                    ),
                  ),
                );
              }

              /* ── Regular Tab ──────────────────────────────────── */
              final activeColor = isDark
                  ? const Color(0xFF10B981)
                  : const Color(0xFF047857);
              final inactiveColor = isDark
                  ? const Color(0xFF737373)
                  : const Color(0xFFA3A3A3);
              final isRealActive = isActive && action != 'menu';
              final itemColor = isRealActive ? activeColor : inactiveColor;

              return Expanded(
                child: GestureDetector(
                  onTap: handleTap,
                  behavior: HitTestBehavior.opaque,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Active pill indicator
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: isRealActive ? 36 : 0,
                        height: 3,
                        decoration: BoxDecoration(
                          gradient: isRealActive
                              ? LinearGradient(
                                  colors: [
                                    activeColor.withValues(alpha: 0.5),
                                    activeColor,
                                  ],
                                )
                              : null,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Icon with active background pill
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: isRealActive ? 44 : 30,
                        height: 30,
                        decoration: BoxDecoration(
                          color: isRealActive
                              ? activeColor.withValues(
                                  alpha: isDark ? 0.2 : 0.12,
                                )
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Icon(icon, size: 22, color: itemColor),
                      ),
                      const SizedBox(height: 5),
                      Text(
                        label,
                        style: TextStyle(
                          fontSize: 11,
                          fontFamily: 'HindSiliguri',
                          fontWeight: isRealActive
                              ? FontWeight.bold
                              : FontWeight.w500,
                          color: itemColor,
                        ),
                      ),
                      const SizedBox(height: 6),
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
