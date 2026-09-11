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
        'id': 'history',
        'label': 'হিস্ট্রি',
        'icon': AppIcons.navHistory,
        'iconFilled': AppIcons.navHistoryFilled,
      },
      {
        'id': 'setup',
        'label': 'পরীক্ষা',
        'icon': AppIcons.navExam,
        'iconFilled': AppIcons.navExamFilled,
      },
      {
        'id': 'question_bank',
        'label': 'প্রশ্নব্যাংক',
        'icon': AppIcons.navQuestionBank,
        'iconFilled': AppIcons.navQuestionBankFilled,
      },
      {
        'id': 'menu',
        'label': 'মেনু',
        'icon': AppIcons.navMenu,
        'iconFilled': AppIcons.navMenuFilled,
        'action': 'menu',
      },
    ];

    // Deep green active color
    final activeColor = isDark
        ? const Color(0xFF059669) // Deep green on dark
        : const Color(0xFF047857); // Deep green on light

    final inactiveColor = isDark
        ? const Color(0xFF9CA3AF) // Cool slate grey
        : const Color(0xFF6B7280); // Medium cool grey

    final bgColor = isDark
        ? const Color(0xFF0A0D10).withValues(alpha: 0.94)
        : Colors.white.withValues(alpha: 0.95);

    final borderColor = isDark
        ? const Color(0xFF1E232B)
        : const Color(0xFFE5E7EB);

    final bottomInset = MediaQuery.of(context).padding.bottom;
    final safeBottom = bottomInset > 0
        ? (bottomInset * 0.6).clamp(8.0, 22.0)
        : 6.0;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
            border: Border(top: BorderSide(color: borderColor, width: 1.0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.40 : 0.08),
                blurRadius: 20,
                offset: const Offset(0, -5),
              ),
            ],
          ),
          child: Padding(
            padding: EdgeInsets.only(bottom: safeBottom, top: 4),
            child: SizedBox(
              height: 58,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: items.map((item) {
                  final id = item['id'] as String;
                  final icon = item['icon'] as String;
                  final iconFilled = item['iconFilled'] as String;
                  final label = item['label'] as String;
                  final action = item['action'];
                  final isAction = action == 'menu';
                  final isActive =
                      !isAction &&
                      (activeTab == id ||
                          (id == 'question_bank' &&
                              (activeTab == 'question-bank' ||
                                  activeTab == 'question_bank')) ||
                          (id == 'history' && activeTab == 'history'));

                  void handleTap() {
                    HapticFeedback.lightImpact();
                    if (isAction) {
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
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          AnimatedScale(
                            duration: const Duration(milliseconds: 200),
                            scale: isActive ? 1.08 : 1.0,
                            child: AppIcon(
                              isActive ? iconFilled : icon,
                              size: 24,
                              color: isActive ? activeColor : inactiveColor,
                            ),
                          ),
                          const SizedBox(height: 3),

                          // Bengali Label
                          Text(
                            label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isActive
                                  ? FontWeight.w700
                                  : FontWeight.w500,
                              color: isActive ? activeColor : inactiveColor,
                              letterSpacing: 0.1,
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
        ),
      ),
    );
  }
}
