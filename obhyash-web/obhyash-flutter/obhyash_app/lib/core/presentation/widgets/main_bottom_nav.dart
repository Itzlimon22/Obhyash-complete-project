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

    return Container(
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0A0A0A) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark
                ? const Color(0xFF262626)
                : const Color(0xFFE5E5E5).withValues(alpha: 0.8),
            width: 1,
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: isDark ? const Color(0x40000000) : const Color(0x10000000),
            blurRadius: 16,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 58,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            crossAxisAlignment: CrossAxisAlignment.center,
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

              final activeColor = isDark
                  ? const Color(0xFF10B981)
                  : const Color(0xFF047857);
              final inactiveColor = isDark
                  ? const Color(0xFF525252)
                  : const Color(0xFF9CA3AF);

              /* ── Center "Exam" button — small filled box, same height ── */
              if (isCenter) {
                return Expanded(
                  child: GestureDetector(
                    onTap: handleTap,
                    behavior: HitTestBehavior.opaque,
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          width: 40,
                          height: 32,
                          decoration: BoxDecoration(
                            color: isActive
                                ? const Color(0xFF047857)
                                : (isDark
                                      ? const Color(0xFF1F1F1F)
                                      : const Color(0xFF171717)),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: isActive
                                ? [
                                    const BoxShadow(
                                      color: Color(0x4D047857),
                                      blurRadius: 8,
                                      offset: Offset(0, 2),
                                    ),
                                  ]
                                : [],
                          ),
                          child: Icon(icon, size: 18, color: Colors.white),
                        ),
                        const SizedBox(height: 3),
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: 10,
                            fontFamily: 'HindSiliguri',
                            fontWeight: FontWeight.bold,
                            color: isActive ? activeColor : inactiveColor,
                          ),
                        ),
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
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Active indicator pill at top
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: isRealActive ? 28 : 0,
                        height: 2,
                        margin: const EdgeInsets.only(bottom: 2),
                        decoration: BoxDecoration(
                          color: activeColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      Icon(
                        icon,
                        size: 21,
                        color: isRealActive ? activeColor : inactiveColor,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        label,
                        style: TextStyle(
                          fontSize: 10,
                          fontFamily: 'HindSiliguri',
                          fontWeight: isRealActive
                              ? FontWeight.bold
                              : FontWeight.w500,
                          color: isRealActive ? activeColor : inactiveColor,
                        ),
                      ),
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
