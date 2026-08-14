import re

with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'r') as f:
    content = f.read()

# We have duplicate _UPCompareCell. The first one is around line 897, the second is around line 1323.
# The old one starts with `class _UPCompareCell extends StatelessWidget {` and expects `final String label, myVal, opponentVal, opponentName;`.

pattern = r"class _UPCompareCell extends StatelessWidget \{\s*final String label, myVal, opponentVal, opponentName;.*?\}\s*\n"
content = re.sub(pattern, "", content, flags=re.DOTALL)

with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'w') as f:
    f.write(content)

