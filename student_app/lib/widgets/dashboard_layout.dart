import 'package:flutter/material.dart';
import '../widgets/dashboard_content.dart';
import '../pages/exam_page.dart'; // ✅ Import Exam Page
import '../pages/exam_history_page.dart'; // ✅ Import History Page
import '../main.dart';
import '../theme.dart';

class DashboardLayout extends StatefulWidget {
  const DashboardLayout({super.key});

  @override
  State<DashboardLayout> createState() => _DashboardLayoutState();
}

class _DashboardLayoutState extends State<DashboardLayout> {
  bool _isSidebarOpen = true;
  int _selectedIndex = 0;

  // ✅ Updated Pages List
  final List<Widget> _pages = [
    const DashboardContent(), // 0. Overview
    const ExamPage(), // 1. Create Exam (Mock Exam)
    const ExamHistoryPage(), // 2. History / OMR Center (Results)
    const Center(child: Text("Students List Page")), // 3. Placeholder
    const Center(child: Text("Settings Page")), // 4. Placeholder
  ];

  final List<String> _titles = [
    "Overview",
    "Create Exam", // Updated Title
    "Exam History", // Updated Title
    "Students",
    "Settings",
  ];

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isDesktop = width > 900;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF0F172A)
          : const Color(0xFFF1F5F9),

      // 1. Sticky Header
      appBar: AppBar(
        title: Text(_titles[_selectedIndex]),
        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        foregroundColor: isDark ? Colors.white : Colors.black87,
        elevation: 0,
        leading: isDesktop
            ? IconButton(
                icon: Icon(_isSidebarOpen ? Icons.menu_open : Icons.menu),
                onPressed: () =>
                    setState(() => _isSidebarOpen = !_isSidebarOpen),
              )
            : null, // Mobile uses Drawer auto-icon
        actions: [
          // Theme Toggle
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () {
              final current = ThemeNotifier.themeMode.value;
              ThemeNotifier.themeMode.value = current == ThemeMode.light
                  ? ThemeMode.dark
                  : ThemeMode.light;
            },
          ),
          // Notification
          Stack(
            alignment: Alignment.topRight,
            children: [
              IconButton(
                onPressed: () {},
                icon: const Icon(Icons.notifications_outlined),
              ),
              Positioned(
                right: 12,
                top: 12,
                child: CircleAvatar(radius: 4, backgroundColor: AppTheme.error),
              ),
            ],
          ),
          const SizedBox(width: 16),
        ],
      ),

      // 2. Mobile Drawer
      drawer: isDesktop
          ? null
          : Drawer(
              child: _SidebarContent(
                selectedIndex: _selectedIndex,
                onItemTapped: (index) {
                  setState(() => _selectedIndex = index);
                  Navigator.pop(context);
                },
              ),
            ),

      // 3. Body
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Desktop Sidebar
          if (isDesktop)
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              width: _isSidebarOpen ? 260 : 0,
              child: ClipRect(
                child: Container(
                  color: isDark ? const Color(0xFF1E293B) : Colors.white,
                  child: OverflowBox(
                    minWidth: 260,
                    maxWidth: 260,
                    alignment: Alignment.topLeft,
                    child: _SidebarContent(
                      selectedIndex: _selectedIndex,
                      onItemTapped: (index) =>
                          setState(() => _selectedIndex = index),
                    ),
                  ),
                ),
              ),
            ),

          // Main Content
          Expanded(child: _pages[_selectedIndex]),
        ],
      ),
    );
  }
}

// --- Reusable Sidebar Content ---
class _SidebarContent extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemTapped;

  const _SidebarContent({
    required this.selectedIndex,
    required this.onItemTapped,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          height: 60,
          alignment: Alignment.centerLeft,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            "MENU",
            style: TextStyle(
              color: Colors.grey[500],
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(12),
            children: [
              _SidebarItem(
                icon: Icons.dashboard_outlined,
                label: "Overview",
                isActive: selectedIndex == 0,
                onTap: () => onItemTapped(0),
              ),
              _SidebarItem(
                icon: Icons.edit_note, // Changed Icon for Exam
                label: "Create Exam",
                isActive: selectedIndex == 1,
                onTap: () => onItemTapped(1),
              ),
              _SidebarItem(
                icon: Icons.history, // Changed Icon for History
                label: "History & Results",
                isActive: selectedIndex == 2,
                onTap: () => onItemTapped(2),
              ),
              _SidebarItem(
                icon: Icons.people_outline,
                label: "Students",
                isActive: selectedIndex == 3,
                onTap: () => onItemTapped(3),
              ),
              const Divider(height: 32),
              _SidebarItem(
                icon: Icons.settings_outlined,
                label: "Settings",
                isActive: selectedIndex == 4,
                onTap: () => onItemTapped(4),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _SidebarItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool isActive;

  const _SidebarItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.isActive = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final activeColor = Colors.indigo;

    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isActive ? activeColor.withOpacity(0.1) : Colors.transparent,
        borderRadius: BorderRadius.circular(8),
      ),
      child: ListTile(
        leading: Icon(
          icon,
          color: isActive
              ? activeColor
              : (isDark ? Colors.grey[400] : Colors.grey[600]),
        ),
        title: Text(
          label,
          style: TextStyle(
            color: isActive
                ? activeColor
                : (isDark ? Colors.grey[200] : Colors.grey[800]),
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
          ),
        ),
        onTap: onTap,
      ),
    );
  }
}
