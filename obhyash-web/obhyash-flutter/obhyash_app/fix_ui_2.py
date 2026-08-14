import re

with open('obhyash_app/lib/features/leaderboard/presentation/leaderboard_view.dart', 'r') as f:
    content = f.read()

old_tab_text = """          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontFamily: 'Anek Bangla',
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: isActive
                  ? Colors.white
                  : (isDark
                        ? const Color(0xFF6B7280)
                        : const Color(0xFF9CA3AF)),
            ),
          ),"""

new_tab_text = """          alignment: Alignment.center,
          child: FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              label,
              style: TextStyle(
                fontFamily: 'Anek Bangla',
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: isActive
                    ? Colors.white
                    : (isDark
                        ? const Color(0xFF6B7280)
                        : const Color(0xFF9CA3AF)),
              ),
            ),
          ),"""

if old_tab_text in content:
    content = content.replace(old_tab_text, new_tab_text)
else:
    print("Warning: old_tab_text not found")

with open('obhyash_app/lib/features/leaderboard/presentation/leaderboard_view.dart', 'w') as f:
    f.write(content)
