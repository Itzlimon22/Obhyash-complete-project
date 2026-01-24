import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';

class CustomBottomNav extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;

  const CustomBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onItemTapped,
  });

  @override
  Widget build(BuildContext context) {
    // 1. Detect if Dark Mode is active
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // 2. Set colors based on mode
    final backgroundColor = isDark ? AppTheme.surface : Colors.white;
    final unselectedColor = isDark ? Colors.grey : AppTheme.textLight;

    return Container(
      height: 70,
      decoration: BoxDecoration(
        color: backgroundColor, // ✅ Dynamic Background Color
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildNavItem(
            0,
            Icons.home,
            'Home',
            isCustom: true,
            isDark: isDark,
            unselectedColor: unselectedColor,
          ),
          _buildNavItem(
            1,
            Icons.menu_book_rounded,
            'My Study',
            isDark: isDark,
            unselectedColor: unselectedColor,
          ),
          _buildNavItem(
            2,
            Icons.edit_document,
            'Mock Exam',
            isDark: isDark,
            unselectedColor: unselectedColor,
          ),
          _buildNavItem(
            3,
            Icons.history,
            'History',
            isDark: isDark,
            unselectedColor: unselectedColor,
          ),
          _buildNavItem(
            4,
            Icons.menu,
            'More',
            isDark: isDark,
            unselectedColor: unselectedColor,
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(
    int index,
    IconData icon,
    String label, {
    bool isCustom = false,
    required bool isDark,
    required Color unselectedColor,
  }) {
    final isSelected = index == selectedIndex;

    // ✅ Dynamic Icon Color
    final color = isSelected ? AppTheme.primary : unselectedColor;

    return InkWell(
      onTap: () => onItemTapped(index),
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (isCustom) ...[
              // Custom "Home" Button Design
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isSelected ? AppTheme.error : Colors.transparent,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    'N',
                    style: TextStyle(
                      color: isSelected ? Colors.white : unselectedColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  ),
                ),
              ),
            ] else ...[
              // Standard Icon Design
              Icon(icon, color: color, size: 26),
            ],

            const SizedBox(height: 4),

            // Label Text
            Text(
              label,
              style: TextStyle(
                color: isCustom && isSelected ? AppTheme.error : color,
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
