with open("lib/features/practice/presentation/practice_dashboard.dart", "r") as f:
    content = f.read()

import_stmt = "import 'package:flutter_animate/flutter_animate.dart';"
if import_stmt not in content:
    content = content.replace("import 'package:flutter/material.dart';", f"import 'package:flutter/material.dart';\n{import_stmt}")

# Animate the list items
old_item_builder = """                                      itemBuilder: (ctx, i) =>
                                          _buildListItem(list[i], isDark),"""
new_item_builder = """                                      itemBuilder: (ctx, i) =>
                                          _buildListItem(list[i], isDark).animate().fadeIn(duration: 300.ms).slideY(begin: 0.05, duration: 300.ms, curve: Curves.easeOut),"""
content = content.replace(old_item_builder, new_item_builder)

# Animate the header/tab bar
old_tab_bar = """                  Container(
                    decoration: BoxDecoration("""
new_tab_bar = """                  Container(
                    decoration: BoxDecoration("""
# Actually let's animate the whole Column that wraps the list and toolbar
old_col = """                            : Column(
                                children: [
                                  _buildToolbar(list, isDark),"""
new_col = """                            : Column(
                                children: [
                                  _buildToolbar(list, isDark),"""
# I'll append .animate to the Column in _buildListView
old_col_end = """              ],
            ),
          ),
        ),
      ],
    );"""
new_col_end = """              ],
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, duration: 400.ms, curve: Curves.easeOut),
          ),
        ),
      ],
    );"""
content = content.replace(old_col_end, new_col_end)

with open("lib/features/practice/presentation/practice_dashboard.dart", "w") as f:
    f.write(content)
