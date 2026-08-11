with open("lib/features/history/presentation/exam_history_view.dart", "r") as f:
    content = f.read()

import_stmt = "import 'package:flutter_animate/flutter_animate.dart';"
if import_stmt not in content:
    content = content.replace("import 'package:flutter/material.dart';", f"import 'package:flutter/material.dart';\n{import_stmt}")

# Wrap the ListView in _HistoryListTab build with .animate
old_list = """      child: ListView(
        controller: scrollController,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: ["""
new_list = """      child: ListView(
        controller: scrollController,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        children: ["""
# I'll just append .animate() to the children list
old_children_end = """          if (isLoadingMore) ...[
            const SizedBox(height: 16),
            const Center(
              child: CircularProgressIndicator(color: Color(0xFF047857)),
            ),
          ],
        ],
      ),"""
new_children_end = """          if (isLoadingMore) ...[
            const SizedBox(height: 16),
            const Center(
              child: CircularProgressIndicator(color: Color(0xFF047857)),
            ),
          ],
        ].animate(interval: 30.ms).fadeIn(duration: 400.ms).slideY(begin: 0.05, duration: 400.ms, curve: Curves.easeOut),
      ),"""
content = content.replace(old_children_end, new_children_end)

with open("lib/features/history/presentation/exam_history_view.dart", "w") as f:
    f.write(content)
