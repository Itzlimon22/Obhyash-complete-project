with open('obhyash_app/lib/features/user_profile/presentation/user_profile_view.dart', 'r') as f:
    content = f.read()

# 1. Add last30DaysActivity to _UPAnalytics
content = content.replace("final List<_UPSubject> subjects;", "final List<_UPSubject> subjects;\n  final List<int> last30DaysActivity;")
content = content.replace("required this.subjects,", "required this.subjects,\n    this.last30DaysActivity = const [],")
content = content.replace("subjects: [],\n  );", "subjects: [],\n    last30DaysActivity: [],\n  );")

# 2. Update _fetchUPAnalytics to compute last30DaysActivity
fetch_old = """  int totalExams = rows.length;
  int totalCorrect = 0;
  double scoreSum = 0;
  final Map<String, ({int total, int correct, int wrong})> subjMap = {};

  for (final row in rows) {"""

fetch_new = """  int totalExams = rows.length;
  int totalCorrect = 0;
  double scoreSum = 0;
  final Map<String, ({int total, int correct, int wrong})> subjMap = {};
  
  final now = DateTime.now();
  final last30DaysActivity = List.filled(30, 0);

  for (final row in rows) {
    if (row['created_at'] != null) {
      try {
        final date = DateTime.parse(row['created_at']);
        final diff = now.difference(date).inDays;
        if (diff >= 0 && diff < 30) {
          last30DaysActivity[29 - diff] += 1;
        }
      } catch (_) {}
    }"""
# wait, 'created_at' was not selected in the supabase query!
content = content.replace(".select('total_questions, correct_count, wrong_count, subject, score')", ".select('total_questions, correct_count, wrong_count, subject, score, created_at')")
content = content.replace(fetch_old, fetch_new)

# 3. add it to the constructor return
content = content.replace("""    avgScore: (scoreSum / totalExams).round(),
    subjects: subjects,
  );""", """    avgScore: (scoreSum / totalExams).round(),
    subjects: subjects,
    last30DaysActivity: last30DaysActivity,
  );""")

# 4. Add the Gauge and Heatmap in build() before the comparison section.
# We find:
marker = """                      // ── Stats Row ──────────────────────────────────────────"""
# Wait, in the original reverted file, what was before the comparison section?
# It was:
marker = """                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _UPCompareCell("""
# No, let's just use Python regex or manual find.
# In the current file (which has the streak VS banner):
