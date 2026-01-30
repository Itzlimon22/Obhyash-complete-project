// File: lib/widgets/dashboard_grid.dart
import 'package:flutter/material.dart';
import '../theme.dart';
import 'dashboard_card.dart';
// ✅ Import pages for navigation
import '../pages/exam_page.dart';
import '../widgets/exam/mock_exam_setup_page.dart';

class DashboardGrid extends StatelessWidget {
  const DashboardGrid({super.key});

  void _navigateTo(BuildContext context, Widget page) {
    Navigator.push(context, MaterialPageRoute(builder: (context) => page));
  }

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppSpacing.md,
      crossAxisSpacing: AppSpacing.md,
      childAspectRatio: 1.0, // Square cards look cleaner here
      children: [
        DashboardCard(
          title: "Live Exam",
          icon: Icons.timer_outlined,
          color: AppTheme.cardLive,
          // ✅ Navigate to Exam Page
          onTap: () => _navigateTo(context, const ExamPage()),
        ),
        DashboardCard(
          title: "Mock Exam",
          icon: Icons.edit_note_outlined,
          color: AppTheme.cardMock,
          // ✅ Navigate to Setup Page
          onTap: () => _navigateTo(context, const MockExamSetupPage()),
        ),
        DashboardCard(
          title: "AI Chat",
          icon: Icons.smart_toy_outlined,
          color: AppTheme.cardAI,
          onTap: () {
            // TODO: Navigate to AI Chat
          },
        ),
        DashboardCard(
          title: "প্র্যাকটিস", // Practice
          icon: Icons.bolt_outlined,
          color: AppTheme.cardPractice,
          onTap: () {},
        ),
        DashboardCard(
          title: "আর্কাইভ", // Archive
          icon: Icons.inventory_2_outlined,
          color: AppTheme.cardArchive,
          onTap: () {},
        ),
        DashboardCard(
          title: "লিডারবোর্ড", // Leaderboard
          icon: Icons.emoji_events_outlined,
          color: AppTheme.cardLeaderboard,
          onTap: () {},
        ),
      ],
    );
  }
}
