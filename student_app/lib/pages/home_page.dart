import 'package:flutter/material.dart';
import 'package:student_app/layout/responsive_layout.dart';
import 'package:student_app/theme.dart';
import 'package:student_app/widgets/app_drawer.dart';
import 'package:student_app/widgets/dashboard_content.dart';
import 'package:student_app/widgets/custom_bottom_nav.dart';
import 'package:student_app/main.dart'; // Import to access ThemeNotifier

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Helper to check current theme mode
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ResponsiveLayout(
      // -----------------------------------------------------------------------
      // 📱 MOBILE LAYOUT
      // -----------------------------------------------------------------------
      mobileBody: Scaffold(
        // ✅ FIX 1: Use Theme colors instead of hard-coded Hex codes
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,

        drawer: const AppDrawer(isMobile: true),

        appBar: AppBar(
          // ✅ FIX 2: Let the Theme handle the colors (defined in theme.dart)
          backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
          elevation: 0,
          title: Text(
            "Home",
            // ✅ FIX 3: Dynamic text color
            style: TextStyle(
              color: isDark ? Colors.white : const Color(0xFF1F2937),
              fontWeight: FontWeight.bold,
            ),
          ),
          iconTheme: IconThemeData(
            color: isDark ? Colors.white : const Color(0xFF1F2937),
          ),
          actions: _buildAppBarActions(),
        ),

        body: _selectedIndex == 0
            ? const DashboardContent()
            : Center(
                child: Text(
                  "Page Index: $_selectedIndex",
                  style: TextStyle(color: isDark ? Colors.white : Colors.black),
                ),
              ),

        bottomNavigationBar: CustomBottomNav(
          selectedIndex: _selectedIndex,
          onItemTapped: _onItemTapped,
        ),
      ),

      // -----------------------------------------------------------------------
      // 💻 WEB LAYOUT
      // -----------------------------------------------------------------------
      desktopBody: Scaffold(
        body: Row(
          children: [
            const AppDrawer(isMobile: false),
            VerticalDivider(
              width: 1,
              color: isDark
                  ? Colors.white.withOpacity(0.1)
                  : Colors.grey.shade300,
            ),
            Expanded(
              child: Scaffold(
                appBar: AppBar(
                  automaticallyImplyLeading: false,
                  title: const Text("Home"),
                  actions: _buildAppBarActions(),
                ),
                body: const DashboardContent(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildAppBarActions() {
    return [
      // ✅ Toggle Button (Temporary, to test the switch)
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

      IconButton(
        onPressed: () {},
        icon: const Icon(
          Icons.local_fire_department,
          color: AppTheme.cardArchive,
        ),
      ),
      Stack(
        alignment: Alignment.topRight,
        children: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.notifications_outlined),
          ),
          const Positioned(
            right: 12,
            top: 12,
            child: CircleAvatar(radius: 4, backgroundColor: AppTheme.error),
          ),
        ],
      ),
      const Padding(
        padding: EdgeInsets.only(right: 16, left: 8),
        child: CircleAvatar(
          radius: 16,
          backgroundColor: AppTheme.primary,
          child: Text(
            "A",
            style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
          ),
        ),
      ),
    ];
  }
}
