import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class MainSidebar extends StatelessWidget {
  final String activeTab;
  final Function(String) onTabChange;
  final VoidCallback onLogout;
  final VoidCallback toggleTheme;
  final String userName;
  final String userInstitute;

  const MainSidebar({
    super.key,
    required this.activeTab,
    required this.onTabChange,
    required this.onLogout,
    required this.toggleTheme,
    required this.userName,
    required this.userInstitute,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final menuItems = [
      {
        'id': 'dashboard',
        'label': 'ড্যাশবোর্ড',
        'icon': LucideIcons.layoutDashboard,
      },
      {'id': 'setup', 'label': 'মক পরীক্ষা', 'icon': LucideIcons.fileEdit},
      {'id': 'history', 'label': 'ইতিহাস', 'icon': LucideIcons.history},
      {'id': 'practice', 'label': 'অনুশীলন', 'icon': LucideIcons.penTool},
      {'id': 'leaderboard', 'label': 'লিডারবোর্ড', 'icon': LucideIcons.trophy},
      {'id': 'analysis', 'label': 'এনালাইসিস', 'icon': LucideIcons.barChart2},
      {
        'id': 'my-reports',
        'label': 'আমার রিপোর্ট',
        'icon': LucideIcons.clipboardList,
      },
      {'id': 'blog', 'label': 'ব্লগ', 'icon': LucideIcons.newspaper},
    ];

    return Drawer(
      backgroundColor: isDark
          ? const Color(0xFF171717)
          : Colors.white, // neutral-900 : white
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
                          ? const Color(0xFF262626)
                          : const Color(
                              0xFFF5F5F5,
                            ), // neutral-800 : neutral-100
                    ),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: const Color(0xFF047857), // emerald-700
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x33059669),
                            blurRadius: 4,
                            offset: Offset(0, 2),
                          ), // shadow-emerald-600/20
                        ],
                      ),
                      child: const Center(
                        child: Icon(
                          LucideIcons.bookOpen,
                          color: Colors.white,
                          size: 20,
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
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? const Color(0xFF737373)
                                : const Color(
                                    0xFFA3A3A3,
                                  ), // neutral-500 : neutral-400
                            letterSpacing: 2,
                          ),
                        ),
                        Text(
                          'অভ্যাস',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: isDark
                                ? Colors.white
                                : const Color(0xFF171717),
                            fontFamily: 'HindSiliguri',
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
                  vertical: 24,
                ),
                itemCount: menuItems.length,
                itemBuilder: (context, index) {
                  final item = menuItems[index];
                  final id = item['id'] as String;
                  final label = item['label'] as String;
                  final icon = item['icon'] as IconData;
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
                          horizontal: 14,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: isActive
                              ? const Color(0xFF047857) // emerald-700
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: isActive
                              ? const [
                                  BoxShadow(
                                    color: Color(0x40059669),
                                    blurRadius: 6,
                                    offset: Offset(0, 2),
                                  ),
                                ]
                              : null,
                        ),
                        child: Row(
                          children: [
                            Icon(
                              icon,
                              size: 20,
                              color: isActive
                                  ? Colors.white
                                  : (isDark
                                        ? const Color(0xFFA3A3A3)
                                        : const Color(
                                            0xFF525252,
                                          )), // neutral-400 : neutral-600
                            ),
                            const SizedBox(width: 12),
                            Text(
                              label,
                              style: TextStyle(
                                fontSize: 14,
                                fontFamily: 'HindSiliguri',
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.2,
                                color: isActive
                                    ? Colors.white
                                    : (isDark
                                          ? const Color(0xFFE5E5E5)
                                          : const Color(
                                              0xFF525252,
                                            )), // neutral-200 : neutral-600
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
                    ? const Color(0x80171717)
                    : const Color(0x80FAFAFA), // neutral-900/50 : neutral-50/50
                border: Border(
                  top: BorderSide(
                    color: isDark
                        ? const Color(0xFF262626)
                        : const Color(0xFFF5F5F5),
                  ), // neutral-800 : neutral-100
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
                            ? const Color(0xFF262626)
                            : Colors.white, // neutral-800
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark
                              ? const Color(0xFF404040)
                              : const Color(0xFFE5E5E5),
                        ), // neutral-700 : neutral-200
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x0a000000),
                            blurRadius: 2,
                            offset: Offset(0, 1),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 16,
                            backgroundColor: const Color(
                              0xFFE11D48,
                            ), // rose-600
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
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  userName,
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: isDark
                                        ? Colors.white
                                        : const Color(0xFF171717),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  'Settings & Profile',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w500,
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
                      IconButton(
                        onPressed: toggleTheme,
                        icon: Icon(
                          isDark ? LucideIcons.sun : LucideIcons.moon,
                          size: 20,
                        ),
                        color: const Color(0xFF737373),
                        tooltip: isDark ? 'Light Mode' : 'Dark Mode',
                        style: IconButton.styleFrom(
                          backgroundColor: isDark
                              ? const Color(0xFF262626)
                              : Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          onLogout();
                          Navigator.pop(context);
                        },
                        icon: const Icon(LucideIcons.logOut, size: 20),
                        color: const Color(0xFF737373),
                        tooltip: 'Logout',
                        style:
                            IconButton.styleFrom(
                              hoverColor: const Color(
                                0x33E11D48,
                              ), // rose-600/20
                              backgroundColor: isDark
                                  ? const Color(0xFF262626)
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
                                    0xFFE11D48,
                                  ); // hover:text-rose-600
                                }
                                return null;
                              }),
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
