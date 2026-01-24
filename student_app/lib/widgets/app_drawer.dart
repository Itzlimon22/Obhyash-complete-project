import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';

class AppDrawer extends StatelessWidget {
  final bool isMobile; // ✅ Add this flag

  const AppDrawer({
    super.key,
    this.isMobile = true, // Default to mobile behavior
  });

  @override
  Widget build(BuildContext context) {
    // On Web, we want a plain Container. On Mobile, the standard Drawer look.
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
              if (isMobile) // Only show close icon on mobile
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
                "আমার পড়ালেখা",
                false,
              ),
              _buildMenuItem(context, Icons.edit_document, "মক এক্সাম", false),
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

    // If it's Web, return just the colored box. If Mobile, return the Drawer widget.
    if (!isMobile) {
      return Container(
        width: 280, // Fixed width for Sidebar
        color: AppTheme.background,
        child: content,
      );
    }

    return Drawer(backgroundColor: AppTheme.background, child: content);
  }

  Widget _buildMenuItem(
    BuildContext context,
    IconData icon,
    String title,
    bool isSelected,
  ) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: isSelected ? const Color(0xFF1F2937) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        visualDensity: const VisualDensity(vertical: -2),
        leading: Icon(
          icon,
          color: isSelected ? Colors.white : AppTheme.textLight,
          size: 22,
        ),
        title: Text(
          title,
          style: TextStyle(
            color: isSelected ? Colors.white : AppTheme.textLight,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
            fontSize: 14,
          ),
        ),
        onTap: () {
          // ✅ CRITICAL FIX: Only close drawer if we are on Mobile
          if (isMobile) {
            Navigator.pop(context);
          }
        },
      ),
    );
  }
}
