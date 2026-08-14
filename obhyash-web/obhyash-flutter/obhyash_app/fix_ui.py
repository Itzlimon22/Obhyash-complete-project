import re

with open('obhyash_app/lib/features/leaderboard/presentation/leaderboard_view.dart', 'r') as f:
    content = f.read()

# Fix ViewModeTab text overflow
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
                      ? const Color(0xFFA3A3A3)
                      : const Color(0xFF4B5563)),
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
                        ? const Color(0xFFA3A3A3)
                        : const Color(0xFF4B5563)),
              ),
            ),
          ),"""

if old_tab_text in content:
    content = content.replace(old_tab_text, new_tab_text)
else:
    print("Warning: old_tab_text not found")

# Fix LevelSelector centering
old_stack = """                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Padding("""
new_stack = """                  child: Stack(
                    alignment: Alignment.center,
                    clipBehavior: Clip.none,
                    children: [
                      Padding("""

if old_stack in content:
    content = content.replace(old_stack, new_stack)
else:
    print("Warning: old_stack not found")


with open('obhyash_app/lib/features/leaderboard/presentation/leaderboard_view.dart', 'w') as f:
    f.write(content)
