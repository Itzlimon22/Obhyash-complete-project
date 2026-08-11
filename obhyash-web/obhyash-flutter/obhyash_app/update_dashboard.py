with open("lib/features/dashboard/presentation/dashboard_view.dart", "r") as f:
    content = f.read()

# Add import
import_stmt = "import 'package:flutter_animate/flutter_animate.dart';"
if import_stmt not in content:
    content = content.replace("import 'package:flutter/material.dart';", f"import 'package:flutter/material.dart';\n{import_stmt}")

# 1. Animate Header
old_header = """            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "আজকের দিনটি শুভ হোক,","""
new_header = """            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "আজকের দিনটি শুভ হোক,","""
content = content.replace(old_header, new_header) # Wait, it's easier to append .animate() to the Column.

old_header_end = """              ],
            ),
          ),"""
new_header_end = """              ],
            ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, duration: 400.ms, curve: Curves.easeOut),
          ),"""
content = content.replace(old_header_end, new_header_end, 1)

# 2. Animate GridView children
old_grid_end = """                      ),
                    ),
                  ],
                ),"""
new_grid_end = """                      ),
                    ),
                  ].animate(interval: 50.ms).fadeIn(duration: 400.ms).slideY(begin: 0.1, duration: 400.ms, curve: Curves.easeOut),
                ),"""
content = content.replace(old_grid_end, new_grid_end, 1)

# 3. Animate SubjectStatCard wrapper
old_stat_card = """                // Subject Stats List
                SubjectStatCard(
                  data: subjects,
                  isLoading: isLoading,
                  onSubjectClick: (subjectId) {
                    context.go('/subject/$subjectId');
                  },
                ),"""
new_stat_card = """                // Subject Stats List
                SubjectStatCard(
                  data: subjects,
                  isLoading: isLoading,
                  onSubjectClick: (subjectId) {
                    context.go('/subject/$subjectId');
                  },
                ).animate(delay: 200.ms).fadeIn(duration: 400.ms).slideY(begin: 0.05, duration: 400.ms, curve: Curves.easeOut),"""
content = content.replace(old_stat_card, new_stat_card)

with open("lib/features/dashboard/presentation/dashboard_view.dart", "w") as f:
    f.write(content)
