with open("lib/features/leaderboard/presentation/leaderboard_view.dart", "r") as f:
    content = f.read()

import_stmt = "import 'package:flutter_animate/flutter_animate.dart';"
if import_stmt not in content:
    content = content.replace("import 'package:flutter/material.dart';", f"import 'package:flutter/material.dart';\n{import_stmt}")

# 1. Animate Podium
old_podium = """                    _buildPodiumAvatar(context, isDark, rank1, 1),
                    if (rank3 != null)
                      _buildPodiumAvatar(context, isDark, rank3, 3),
                  ],
                ),
              ),"""
new_podium = """                    _buildPodiumAvatar(context, isDark, rank1, 1),
                    if (rank3 != null)
                      _buildPodiumAvatar(context, isDark, rank3, 3),
                  ].animate(interval: 100.ms).scale(duration: 400.ms, curve: Curves.easeOutBack).slideY(begin: 0.1, duration: 400.ms),
                ),
              ),"""
content = content.replace(old_podium, new_podium)

# 2. Animate list items
old_list_item = """                          itemBuilder: (context, index) {
                            final user = listUsers[index];
                            return _buildListTile(context, isDark, user, index + 4);
                          },"""
new_list_item = """                          itemBuilder: (context, index) {
                            final user = listUsers[index];
                            return _buildListTile(context, isDark, user, index + 4).animate().fadeIn(duration: 300.ms).slideY(begin: 0.05, duration: 300.ms, curve: Curves.easeOut);
                          },"""
content = content.replace(old_list_item, new_list_item)

with open("lib/features/leaderboard/presentation/leaderboard_view.dart", "w") as f:
    f.write(content)
