import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../constants/app_icons.dart';
import 'app_icon.dart';

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
      {
        'id': 'dashboard',
        'label': 'হোম',
        'icon': AppIcons.navHome,
        'iconFilled': AppIcons.navHomeFilled,
      },
      {
        'id': 'question_bank',
        'label': 'প্রশ্নব্যাংক',
        'icon': AppIcons.navQuestionBank,
        'iconFilled': AppIcons.navQuestionBankFilled,
      },
      {
        'id': 'setup',
        'label': 'পরীক্ষা',
        'icon': AppIcons.navExam,
        'iconFilled': AppIcons.navExamFilled,
      },
      {
        'id': 'leaderboard',
        'label': 'র‍্যাংক',
        'icon': AppIcons.navRank,
        'iconFilled': AppIcons.navRankFilled,
      },
      {
        'id': 'menu',
        'label': 'মেনু',
        'icon': AppIcons.navMenu,
        'iconFilled': AppIcons.navMenuFilled,
        'action': 'menu',
      },
    ];

    // High-contrast emerald active color (Chorcha brand aesthetic)
    final activeColor = isDark
        ? const Color(0xFF34D399) // Vibrant emerald on dark
        : const Color(0xFF047857); // Deep emerald forest on light

    final inactiveColor = isDark
        ? const Color(0xFF8E8E93) // Apple muted grey
        : const Color(0xFF71717A); // Zinc neutral

    final bgColor = isDark
        ? const Color(0xFF000000).withValues(alpha: 0.88)
        : Colors.white.withValues(alpha: 0.92);

    final borderColor = isDark
        ? const Color(0xFF22252A)
        : const Color(0xFFE5E7EB);

    final bottomInset = MediaQuery.of(context).padding.bottom;
    final safeBottom = bottomInset > 0 ? (bottomInset * 0.4).clamp(6.0, 12.0) : 4.0;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
        child: Container(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            border: Border(
              top: BorderSide(color: borderColor, width: 1.0),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.05),
                blurRadius: 16,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.only(bottom: safeBottom),
            child: SizedBox(
              height: 56,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: items.map((item) {
                  final id = item['id'] as String;
                  final icon = item['icon'] as String;
                  final iconFilled = item['iconFilled'] as String;
                  final label = item['label'] as String;
                  final action = item['action'];
                  final isActive = activeTab == id ||
                      (id == 'question_bank' &&
                          (activeTab == 'question-bank' ||
                              activeTab == 'question_bank'));
                  final isRealActive = isActive && action != 'menu';

                  void handleTap() {
                    HapticFeedback.lightImpact();
                    if (action == 'menu') {
                      onMenuClick();
                    } else {
                      onTabChange(id);
                    }
                  }

                  return Expanded(
                    child: GestureDetector(
                      onTap: handleTap,
                      behavior: HitTestBehavior.opaque,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Top indicator glowing line
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 220),
                            curve: Curves.easeOutCubic,
                            width: isRealActive ? 26 : 0,
                            height: 2.5,
                            decoration: BoxDecoration(
                              color: isRealActive ? activeColor : Colors.transparent,
                              borderRadius: const BorderRadius.only(
                                bottomLeft: Radius.circular(4),
                                bottomRight: Radius.circular(4),
                              ),
                              boxShadow: isRealActive
                                  ? [
                                      BoxShadow(
                                        color: activeColor.withValues(alpha: 0.5),
                                        blurRadius: 6,
                                        offset: const Offset(0, 1),
                                      ),
                                    ]
                                  : null,
                            ),
                          ),
                          const Spacer(),

                          // Custom Icon with animated pill capsule container
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 220),
                            curve: Curves.easeOutCubic,
                            padding: EdgeInsets.symmetric(
                              horizontal: isRealActive ? 14 : 6,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: isRealActive
                                  ? (isDark
                                      ? activeColor.withValues(alpha: 0.15)
                                      : activeColor.withValues(alpha: 0.10))
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: AnimatedScale(
                              duration: const Duration(milliseconds: 200),
                              scale: isRealActive ? 1.06 : 1.0,
                              child: AppIcon(
                                isRealActive ? iconFilled : icon,
                                size: 21,
                                color: isRealActive ? activeColor : inactiveColor,
                              ),
                            ),
                          ),
                          const SizedBox(height: 2),

                          // Bengali Label
                          Text(
                            label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 11.2,
                              fontFamily: 'HindSiliguri',
                              fontWeight: isRealActive
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: isRealActive ? activeColor : inactiveColor,
                              letterSpacing: 0.1,
                            ),
                          ),
                          const SizedBox(height: 3),
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
