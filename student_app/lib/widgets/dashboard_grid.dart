// File: lib/widgets/dashboard_grid.dart
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme.dart';
import 'dashboard_card.dart';
// ✅ Import pages for navigation
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
      childAspectRatio: 1.0, 
      children: [
        DashboardCard(
          title: "মক এক্সাম",
          svgAsset: "assets/icons/file-text.svg",
          color: AppTheme.cardMock,
          onTap: () => _navigateTo(context, const MockExamSetupPage()),
        ),
        DashboardCard(
          title: "ইতিহাস",
          svgAsset: "assets/icons/clock.svg",
          color: AppTheme.cardLive,
          onTap: () {},
        ),
        DashboardCard(
          title: "লিডারবোর্ড",
          svgAsset: "assets/icons/medal.svg",
          color: AppTheme.cardLeaderboard,
          onTap: () {},
        ),
        DashboardCard(
          title: "এনালাইসিস",
          svgAsset: "assets/icons/trending-up.svg",
          color: AppTheme.cardAI,
          onTap: () {},
        ),
        DashboardCard(
          title: "অনুশীলন",
          svgAsset: "assets/icons/dumbbell.svg",
          color: AppTheme.cardPractice,
          onTap: () {},
        ),
        DashboardCard(
          title: "ব্লগ",
          svgAsset: "assets/icons/rss.svg",
          color: AppTheme.cardArchive,
          onTap: () async {
            final Uri url = Uri.parse('https://obhyash.com/blog');
            if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
              debugPrint('Could not launch $url');
            }
          },
        ),
      ],
    );
  }
}
