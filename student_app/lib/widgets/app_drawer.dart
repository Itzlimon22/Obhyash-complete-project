import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';

import '../widgets/exam/mock_exam_setup_page.dart';

class AppDrawer extends StatelessWidget {
  final bool isMobile;

  const AppDrawer({super.key, this.isMobile = true});

  @override
  Widget build(BuildContext context) {
    final content = Column(
      children: [
        // 1. Logo Area
        Container(
          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(color: Colors.white.withOpacity(0.05)),
            ),
          ),
          child: Row(
            children: [
              const Icon(Icons.auto_awesome, color: Colors.white, size: 28),
              const SizedBox(width: 12),
              const Text(
                "অভ্যাস",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 1.0,
                ),
              ),
              const Spacer(),
              if (isMobile)
                Icon(
                  Icons.menu_open,
                  color: AppTheme.textLight.withOpacity(0.5),
                ),
            ],
          ),
        ),

        // 2. Menu Items
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(vertical: 10),
            children: [
              _buildMenuItem(context, Icons.home_filled, "হোম", true),
              _buildMenuItem(
                context,
                Icons.menu_book_rounded,
                "আমার পড়ালেখা",
                false,
              ),

              // ✅ UPDATED: Mock Exam Button with Navigation Logic
              _buildMenuItem(
                context,
                Icons.edit_document,
                "মক এক্সাম",
                false,
                onTap: () {
                  // 1. Close Drawer (if mobile)
                  if (isMobile) Navigator.pop(context);

                  // 2. Navigate to the Setup Page
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const MockExamSetupPage(),
                    ), // ✅ Points to the new page import
                  );
                },
              ),

              _buildMenuItem(
                context,
                Icons.sports_kabaddi,
                "Challenges",
                false,
              ),
              _buildMenuItem(
                context,
                Icons.assignment_outlined,
                "Live Exam",
                false,
              ),
              _buildMenuItem(context, Icons.bolt_rounded, "প্র্যাকটিস", false),
              _buildMenuItem(
                context,
                Icons.inventory_2_outlined,
                "আর্কাইভ",
                false,
              ),
              _buildMenuItem(
                context,
                Icons.calendar_month_outlined,
                "Admission",
                false,
              ),
              _buildMenuItem(
                context,
                Icons.smart_toy_outlined,
                "AI Chat",
                false,
              ),
              _buildMenuItem(
                context,
                Icons.bar_chart_rounded,
                "অ্যানালিটিক্স",
                false,
              ),
              _buildMenuItem(
                context,
                Icons.emoji_events_outlined,
                "লিডারবোর্ড",
                false,
              ),
              _buildMenuItem(context, Icons.history, "হিস্টরি", false),

              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8.0),
                child: Divider(color: Colors.white10),
              ),

              _buildMenuItem(
                context,
                Icons.admin_panel_settings_outlined,
                "Admin",
                false,
              ),
            ],
          ),
        ),
      ],
    );

    if (!isMobile) {
      return Container(width: 280, color: AppTheme.background, child: content);
    }

    return Drawer(
      backgroundColor: AppTheme.background,
      elevation: 0,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(0),
          bottomRight: Radius.circular(0),
        ),
      ),
      child: content,
    );
  }

  // ✅ UPDATED: Modern Pill-Shaped Menu Item
  Widget _buildMenuItem(
    BuildContext context,
    IconData icon,
    String title,
    bool isSelected, {
    VoidCallback? onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      margin: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 4,
      ), // Increased side margin
      decoration: BoxDecoration(
        color: isSelected
            // Active: Indigo Tint (Light) / Darker Indigo (Dark)
            ? (isDark ? const Color(0xFF1E1B4B) : const Color(0xFFEEF2FF))
            : Colors.transparent,
        borderRadius: BorderRadius.circular(12), // Softer corners
        border: isSelected
            ? Border.all(
                color: isDark
                    ? const Color(0xFF4338CA)
                    : const Color(0xFFC7D2FE),
              )
            : Border.all(color: Colors.transparent),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
        dense: true,
        leading: Icon(
          icon,
          color: isSelected
              ? (isDark
                    ? const Color(0xFF818CF8)
                    : const Color(0xFF4F46E5)) // Indigo-400 : Indigo-600
              : (isDark ? Colors.grey[400] : Colors.grey[600]),
          size: 22,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected
                ? (isDark ? Colors.white : const Color(0xFF312E81))
                : (isDark ? Colors.grey[300] : Colors.grey[700]),
            fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
            fontSize: 14,
            letterSpacing: 0.3,
          ),
        ),
        // Use the passed onTap if exists, otherwise use default close logic
        onTap:
            onTap ??
            () {
              if (isMobile) {
                Navigator.pop(context);
              }
            },
      ),
    );
  }
}
