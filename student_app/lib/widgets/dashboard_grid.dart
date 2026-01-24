import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';
import 'package:student_app/widgets/dashboard_card.dart';

class DashboardGrid extends StatelessWidget {
  const DashboardGrid({super.key});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 3, // ✅ CHANGED: 3 Columns (Compact)
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: AppSpacing.md,
      crossAxisSpacing: AppSpacing.md,
      childAspectRatio: 1.1, // Adjust this: Higher = Shorter cards
      children: [
        DashboardCard(
          title: "আর্কাইভ", // Archive
          icon: Icons.inventory_2_outlined,
          color: AppTheme.cardArchive,
          onTap: () {},
        ),
        DashboardCard(
          title: "প্র্যাকটিস", // Practice
          icon: Icons.bolt_outlined,
          color: AppTheme.cardPractice,
          onTap: () {},
        ),
        DashboardCard(
          title: "Live Exam",
          icon: Icons.timer_outlined,
          color: AppTheme.cardLive,
          onTap: () {},
        ),
        DashboardCard(
          title: "Mock Exam",
          icon: Icons.edit_note_outlined,
          color: AppTheme.cardMock,
          onTap: () {},
        ),
        DashboardCard(
          title: "AI Chat",
          icon: Icons.smart_toy_outlined,
          color: AppTheme.cardAI,
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
