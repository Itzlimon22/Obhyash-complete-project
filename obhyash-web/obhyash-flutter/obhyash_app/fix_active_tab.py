with open("lib/core/presentation/main_layout.dart", "r") as f:
    content = f.read()
    
new_get_active_tab = """String _getActiveTab(String location) {
    if (location.startsWith('/history')) return 'history';
    if (location.startsWith('/setup')) return 'setup';
    if (location.startsWith('/practice')) return 'practice';
    if (location.startsWith('/leaderboard')) return 'leaderboard';
    if (location.startsWith('/analysis')) return 'analysis';
    if (location.startsWith('/my-reports')) return 'my-reports';
    if (location.startsWith('/profile/my-subscription')) return 'my-subscription';
    if (location.startsWith('/profile/subscription')) return 'subscription';
    if (location.startsWith('/profile/complaint')) return 'complaint';
    if (location.startsWith('/profile/about')) return 'about';
    if (location.startsWith('/profile/blog')) return 'blog';
    if (location.startsWith('/profile/referral')) return 'referral';
    if (location.startsWith('/profile')) return 'profile';
    if (location.startsWith('/user-profile') || location.contains('/user-profile')) return 'user_profile';
    if (location.startsWith('/subject') || location.contains('/subject')) return 'subject_report';
    return 'dashboard';
  }"""
  
import re
content = re.sub(r'String _getActiveTab\(String location\) \{.*?\n  \}', new_get_active_tab, content, flags=re.DOTALL)

with open("lib/core/presentation/main_layout.dart", "w") as f:
    f.write(content)
