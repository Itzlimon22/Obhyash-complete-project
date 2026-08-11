import re

with open("lib/core/presentation/main_layout.dart", "r") as f:
    content = f.read()

# Replace Widget child with StatefulNavigationShell navigationShell
content = content.replace("final Widget child;", "final StatefulNavigationShell navigationShell;")
content = content.replace("const MainLayout({super.key, required this.child});", "const MainLayout({super.key, required this.navigationShell});")

# Add import for go_router
if "import 'package:go_router/go_router.dart';" not in content:
    content = content.replace("import 'package:flutter/material.dart';", "import 'package:flutter/material.dart';\nimport 'package:go_router/go_router.dart';")

# Update body: widget.child to body: widget.navigationShell
content = content.replace("body: widget.child,", "body: widget.navigationShell,")

# Update _onTabChange to use goBranch for main tabs and push/go for others
on_tab_change_new = """void _onTabChange(String tab) {
    if (tab == 'blog') {
      widget.navigationShell.goBranch(4);
      context.go('/profile/blog');
      return;
    }
    
    int index = 0;
    switch (tab) {
      case 'dashboard': index = 0; break;
      case 'history': index = 1; break;
      case 'setup': index = 2; break;
      case 'leaderboard': index = 3; break;
      default: index = 0;
    }
    
    // Check if we are already on this branch. If so, pop back to its root.
    if (widget.navigationShell.currentIndex == index) {
      context.go(tab == 'dashboard' ? '/' : '/$tab');
    } else {
      widget.navigationShell.goBranch(index, initialLocation: index == widget.navigationShell.currentIndex);
    }
  }"""
  
# Need to replace the old _onTabChange
old_on_tab_change = """void _onTabChange(String tab) {
    if (tab == 'blog') {
      context.go('/blog');
      return;
    }
    if (tab == 'dashboard') {
      context.go('/');
    } else {
      context.go('/$tab');
    }
  }"""
  
content = content.replace(old_on_tab_change, on_tab_change_new)

# Update onNavigate in _ProfileSheet usage
# Profile items should go to branch 4 and then navigate
profile_sheet_call = """_ProfileSheet(
        userName: user?.name ?? '',
        userEmail: user?.email ?? '',
        userInstitute: user?.institute ?? '',
        xp: user?.xp ?? 0,
        isDark: isDark,
        onNavigate: (route) {
          Navigator.pop(ctx);
          widget.navigationShell.goBranch(4);
          // Small delay to allow branch switch before pushing
          Future.delayed(const Duration(milliseconds: 50), () {
            if (mounted) context.push(route);
          });
        },"""
        
old_profile_sheet_call = """_ProfileSheet(
        userName: user?.name ?? '',
        userEmail: user?.email ?? '',
        userInstitute: user?.institute ?? '',
        xp: user?.xp ?? 0,
        isDark: isDark,
        onNavigate: (route) {
          Navigator.pop(ctx);
          context.go(route);
        },"""
        
content = content.replace(old_profile_sheet_call, profile_sheet_call)

with open("lib/core/presentation/main_layout.dart", "w") as f:
    f.write(content)
