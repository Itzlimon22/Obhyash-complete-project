with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'r') as f:
    content = f.read()

content = content.replace("final List<_UPSubject> subjects;", "final List<_UPSubject> subjects;\n  final List<int> last30DaysActivity;")
content = content.replace("required this.subjects,", "required this.subjects,\n    this.last30DaysActivity = const [],")
content = content.replace("subjects: [],\n  );", "subjects: [],\n    last30DaysActivity: [],\n  );")

with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'w') as f:
    f.write(content)

