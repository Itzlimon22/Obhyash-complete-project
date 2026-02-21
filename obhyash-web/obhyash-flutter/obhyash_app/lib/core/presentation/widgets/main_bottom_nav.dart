import 'package:flutter/material.dart';
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
                ? const Color(0xCC262626)
                : const Color(0xCCE5E5E5), // neutral-800/80 : neutral-200/80
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
            children: items.map((item) {
              final id = item['id'] as String;
              final icon = item['icon'] as IconData;
              final action = item['action'] as String?;
              final isActive = activeTab == id;

              return Expanded(
                child: InkWell(
                  onTap: () {
                    if (action == 'menu') {
                      onMenuClick();
                    } else {
                      onTabChange(id);
                    }
                  },
                  splashColor: Colors.transparent,
                  highlightColor: Colors.transparent,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    child: Stack(
                      alignment: Alignment.center,
                      clipBehavior: Clip.none,
                      children: [
                        if (isActive && action != 'menu')
                          Positioned(
                            top:
                                -16, // to touch the top border like in React mapping
                            child: Container(
                              width: 32,
                              height: 2.5,
                              decoration: BoxDecoration(
                                color: isDark
                                    ? const Color(0xFFFB7185)
                                    : const Color(
                                        0xFFF43F5E,
                                      ), // rose-400 : rose-500
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),
                        AnimatedScale(
                          scale: isActive ? 1.05 : 1.0,
                          duration: const Duration(milliseconds: 200),
                          curve: Curves.easeOutBack,
                          child: Icon(
                            icon,
                            size: 24,
                            color: isActive
                                ? (isDark
                                      ? const Color(0xFFFB7185)
                                      : const Color(
                                          0xFFE11D48,
                                        )) // rose-400 : rose-600
                                : (isDark
                                      ? const Color(0xFF737373)
                                      : const Color(
                                          0xFFA3A3A3,
                                        )), // neutral-500 : neutral-400
                          ),
                        ),
                      ],
                    ),
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
