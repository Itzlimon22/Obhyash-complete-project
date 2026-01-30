// File: lib/pages/home_page.dart
import 'package:flutter/material.dart';
import 'package:student_app/layout/responsive_layout.dart';
import 'package:student_app/theme.dart';
import 'package:student_app/widgets/app_drawer.dart';
import 'package:student_app/widgets/dashboard_content.dart';
import 'package:student_app/widgets/custom_bottom_nav.dart';
import 'package:student_app/main.dart';
import 'package:student_app/widgets/dashboard_layout.dart'; // ✅ The Master Layout

// ✅ Import your real pages
import 'exam_history_page.dart';
import 'exam/script_uploader_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  // Mobile specific state
  int _mobileSelectedIndex = 0;

  // ✅ Define the pages for Mobile Bottom Nav
  // (Order must match your CustomBottomNav items)
  final List<Widget> _mobilePages = [
    const DashboardContent(), // Index 0: Home
    const ExamHistoryPage(), // Index 1: History / Exams
    const ScriptUploaderPage(), // Index 2: OMR Upload
    const Center(child: Text("Profile Page")), // Index 3: Profile (Placeholder)
  ];

  void _onMobileItemTapped(int index) {
    setState(() {
      _mobileSelectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return ResponsiveLayout(
      // -----------------------------------------------------------------------
      // 📱 MOBILE LAYOUT
      // -----------------------------------------------------------------------
      mobileBody: Scaffold(
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        drawer: const AppDrawer(isMobile: true),

        appBar: AppBar(
          backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
          elevation: 0,
          title: Text(
            // ✅ Dynamic Title based on selected page
            _mobileSelectedIndex == 0
                ? "Home"
                : _mobileSelectedIndex == 1
                ? "History"
                : _mobileSelectedIndex == 2
                ? "Upload OMR"
                : "Profile",
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          actions: _buildAppBarActions(context),
        ),

        // ✅ Page Switching Logic
        // If the index is valid, show the page, else show a fallback
        body: _mobileSelectedIndex < _mobilePages.length
            ? _mobilePages[_mobileSelectedIndex]
            : const Center(child: Text("Page Not Found")),

        bottomNavigationBar: CustomBottomNav(
          selectedIndex: _mobileSelectedIndex,
          onItemTapped: _onMobileItemTapped,
        ),
      ),

      // -----------------------------------------------------------------------
      // 💻 DESKTOP LAYOUT
      // -----------------------------------------------------------------------
      // ✅ Uses the Master DashboardLayout we created earlier
      desktopBody: const DashboardLayout(),
    );
  }

  List<Widget> _buildAppBarActions(BuildContext context) {
    return [
      IconButton(
        icon: Icon(
          Theme.of(context).brightness == Brightness.dark
              ? Icons.light_mode
              : Icons.dark_mode,
        ),
        onPressed: () {
          final current = ThemeNotifier.themeMode.value;
          ThemeNotifier.themeMode.value = current == ThemeMode.light
              ? ThemeMode.dark
              : ThemeMode.light;
        },
      ),
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
      const SizedBox(width: 8),
    ];
  }
}
