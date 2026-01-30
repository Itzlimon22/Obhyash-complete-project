// File: lib/widgets/dashboard_content.dart
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../pages/exam_page.dart';
import '../pages/subject_report_page.dart';
import 'dashboard_grid.dart'; // ✅ Import the Grid
import 'progress_card.dart';
import '../core/dashboard_constants.dart';
import '../theme.dart';

class DashboardContent extends StatefulWidget {
  const DashboardContent({super.key});

  @override
  State<DashboardContent> createState() => _DashboardContentState();
}

class _DashboardContentState extends State<DashboardContent> {
  String _userStream = 'Loading...';
  String _userName = 'Student';
  bool _isLoading = true;

  // Variable to store real data
  Map<String, Map<String, dynamic>> _realProgressStats = {};

  @override
  void initState() {
    super.initState();
    _fetchUserData();
    _fetchProgressStats();
  }

  // --- 1. DATA FETCHING LOGIC (Kept exactly as your code) ---
  Future<void> _fetchUserData() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user != null) {
      try {
        final data = await Supabase.instance.client
            .from('profiles')
            .select('stream, full_name')
            .eq('id', user.id)
            .single();

        if (mounted) {
          setState(() {
            _userStream = data['stream'] ?? 'HSC';
            _userName = data['full_name'] ?? 'Student';
            _isLoading = false;
          });
        }
      } catch (e) {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _fetchProgressStats() async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return;

    try {
      final response = await Supabase.instance.client
          .from('results')
          .select('subject, score, wrong_count, correct_count, total_questions')
          .eq('user_id', user.id);

      final List<dynamic> data = response as List<dynamic>;
      Map<String, Map<String, dynamic>> calculatedStats = {};

      for (var session in data) {
        String subject = session['subject'] ?? 'Unknown';

        if (!calculatedStats.containsKey(subject)) {
          calculatedStats[subject] = {
            'correct': 0,
            'wrong': 0,
            'skipped': 0,
            'total': 0,
            'percentage': 0.0,
          };
        }

        int correct = (session['correct_count'] as num?)?.toInt() ?? 0;
        int wrong = (session['wrong_count'] as num?)?.toInt() ?? 0;
        int total = (session['total_questions'] as num?)?.toInt() ?? 0;
        int skipped = total - (correct + wrong);
        if (skipped < 0) skipped = 0;

        calculatedStats[subject]!['correct'] += correct;
        calculatedStats[subject]!['wrong'] += wrong;
        calculatedStats[subject]!['skipped'] += skipped;
        calculatedStats[subject]!['total'] += total;
      }

      calculatedStats.forEach((key, value) {
        if (value['total'] > 0) {
          value['percentage'] = value['correct'] / value['total'];
        }
      });

      if (mounted) {
        setState(() {
          _realProgressStats = calculatedStats;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching stats: $e');
    }
  }

  // --- 2. UI BUILD ---
  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // A. HEADER
          _buildHeader(),
          const SizedBox(height: AppSpacing.lg),

          // B. DAILY EXAM CARD (Hero Section)
          _buildDailyExamCard(),
          const SizedBox(height: AppSpacing.xl),

          // C. QUICK ACTIONS (The New Dashboard Grid)
          Text(
            "Quick Actions",
            style: Theme.of(
              context,
            ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: AppSpacing.md),
          const DashboardGrid(), // ✅ Using the modular grid here

          const SizedBox(height: AppSpacing.xl),

          // D. PROGRESS REPORT SECTION
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "সাবজেক্ট ভিত্তিক রিপোর্ট",
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              // Option to add a "View All" button here if needed
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          _buildProgressSection(),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Hello, $_userName 👋",
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        Text(
          "Goal: $_userStream Admission",
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).textTheme.bodySmall?.color,
          ),
        ),
      ],
    );
  }

  Widget _buildDailyExamCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppTheme.primary,
            const Color(0xFF4F46E5),
          ], // Slight gradient
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  "🔥 LIVE NOW",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              const Text(
                "Ends in 20m",
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            "Daily Model Test: Physics",
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            "Topic: Vector & Dynamics",
            style: TextStyle(color: Colors.white70, fontSize: 14),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ExamPage()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppTheme.primary,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                "Start Exam",
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSection() {
    // Only show subjects relevant to the user's stream
    final relevantSubjects = getSubjectsForStream(_userStream);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: Theme.of(context).cardTheme.color,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? Colors.white10 : Colors.grey.shade100,
        ),
      ),
      child: Column(
        children: relevantSubjects.map((subject) {
          final String engName = subject['name'];
          final String name = bengaliSubjectNames[engName] ?? engName;

          final stats =
              _realProgressStats[engName] ??
              {'percentage': 0.0, 'correct': 0, 'wrong': 0, 'skipped': 0};

          return Padding(
            padding: const EdgeInsets.only(bottom: 16.0),
            child: ProgressCard(
              subject: name,
              progress: stats['percentage'],
              correct: stats['correct'].toString(),
              wrong: stats['wrong'].toString(),
              skipped: stats['skipped'].toString(),
              onViewDetails: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => SubjectReportPage(subjectName: name),
                  ),
                );
              },
            ),
          );
        }).toList(),
      ),
    );
  }
}
