import re
import glob
import os

def replace_in_file(filepath, old, new):
    if not os.path.exists(filepath): return
    with open(filepath, 'r') as f:
        content = f.read()
    if old in content:
        content = content.replace(old, new)
        with open(filepath, 'w') as f:
            f.write(content)

# 1. Sidebar Links
sidebar_file = "lib/core/presentation/widgets/main_sidebar.dart"
replace_in_file(sidebar_file, "'blog'", "'profile/blog'")
replace_in_file(sidebar_file, "'my-subscription'", "'profile/my-subscription'")
replace_in_file(sidebar_file, "'subscription'", "'profile/subscription'")
replace_in_file(sidebar_file, "'complaint'", "'profile/complaint'")
replace_in_file(sidebar_file, "'about'", "'profile/about'")
replace_in_file(sidebar_file, "'referral'", "'profile/referral'")

# 2. Settings View
settings_file = "lib/features/profile/presentation/settings_view.dart"
replace_in_file(settings_file, "route: '/blog'", "route: '/profile/blog'")
replace_in_file(settings_file, "route: '/about'", "route: '/profile/about'")
replace_in_file(settings_file, "route: '/complaint'", "route: '/profile/complaint'")
replace_in_file(settings_file, "route: '/my-subscription'", "route: '/profile/my-subscription'")
replace_in_file(settings_file, "route: '/subscription'", "route: '/profile/subscription'")

# 3. Leaderboard User Profile push
leaderboard_file = "lib/features/leaderboard/presentation/leaderboard_view.dart"
replace_in_file(leaderboard_file, "context.push('/user-profile/$id')", "context.push('/leaderboard/user-profile/$id')")

# 4. My Subscription View upgrade link
my_sub_file = "lib/features/subscription/presentation/my_subscription_view.dart"
replace_in_file(my_sub_file, "context.go('/subscription')", "context.go('/profile/subscription')")

print("Done fixing routes.")
