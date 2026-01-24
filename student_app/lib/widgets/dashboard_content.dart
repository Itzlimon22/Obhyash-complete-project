import 'package:flutter/material.dart';
import 'package:student_app/theme.dart';
import 'package:student_app/widgets/dashboard_grid.dart';
import 'package:student_app/widgets/section_header.dart';
import 'package:student_app/widgets/progress_card.dart'; // Imports our ProgressCard

class DashboardContent extends StatefulWidget {
  const DashboardContent({super.key});

  @override
  State<DashboardContent> createState() => _DashboardContentState();
}

class _DashboardContentState extends State<DashboardContent> {
  // ✅ 0 = Group Subjects, 1 = General Subjects
  int _selectedTabIndex = 0;

  // Data for "Group Subjects" (Science)
  final List<String> groupSubjects = [
    "পদার্থবিজ্ঞান ১ম পত্র",
    "পদার্থবিজ্ঞান ২য় পত্র",
    "রসায়ন ১ম পত্র",
    "রসায়ন ২য় পত্র",
    "উচ্চতর গণিত ১ম পত্র",
    "উচ্চতর গণিত ২য় পত্র",
    "জীববিজ্ঞান ১ম পত্র",
    "জীববিজ্ঞান ২য় পত্র",
  ];

  // Data for "General Subjects" (Common)
  final List<String> generalSubjects = [
    "বাংলা ১ম পত্র",
    "বাংলা ২য় পত্র",
    "English 1st Paper",
    "English 2nd Paper",
    "ICT",
  ];

  @override
  Widget build(BuildContext context) {
    // ✅ Decide which list to show based on the tab
    final currentSubjects = _selectedTabIndex == 0
        ? groupSubjects
        : generalSubjects;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // --- SECTION A: TODAY'S SCHEDULE ---
          SectionHeader(
            title: "Today's Schedule",
            actionText: "Go to Routine →",
            onActionTap: () {},
          ),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(AppSpacing.lg),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Theme.of(context).dividerColor.withOpacity(0.1),
              ),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.calendar_today,
                  color: AppTheme.textLight.withOpacity(0.5),
                  size: 32,
                ),
                const SizedBox(height: 8),
                const Text(
                  "No tasks scheduled for today.",
                  style: TextStyle(color: AppTheme.textLight),
                ),
              ],
            ),
          ),

          const SizedBox(height: AppSpacing.xl),

          // --- SECTION B: QUICK ACCESS GRID ---
          const DashboardGrid(),

          const SizedBox(height: AppSpacing.xl),

          // --- SECTION C: PROGRESS REPORT ---
          const SectionHeader(title: "প্রোগ্রেস রিপোর্ট"),
          const Text(
            "আপনার বিষয়ভিত্তিক অগ্রগতি দেখুন।",
            style: TextStyle(color: AppTheme.textLight, fontSize: 12),
          ),
          const SizedBox(height: AppSpacing.md),

          // ✅ Interactive Toggle Buttons
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Theme.of(context).cardTheme.color,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Row(
              children: [
                Expanded(child: _buildSegmentButton("Group Subjects", 0)),
                Expanded(child: _buildSegmentButton("General Subjects", 1)),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),

          // ✅ Dynamic Grid based on Selection
          LayoutBuilder(
            builder: (context, constraints) {
              return Wrap(
                spacing: AppSpacing.md,
                runSpacing: AppSpacing.md,
                children: currentSubjects.map((subject) {
                  return _buildGridItem(constraints, subject);
                }).toList(),
              );
            },
          ),

          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _buildGridItem(BoxConstraints constraints, String title) {
    final double width = (constraints.maxWidth - AppSpacing.md) / 2;
    return SizedBox(
      width: width,
      // ✅ Using our new Collapsible Card
      child: ProgressCard(subject: title),
    );
  }

  Widget _buildSegmentButton(String text, int index) {
    final isActive = _selectedTabIndex == index;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedTabIndex = index;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          // Active = Light White background, Inactive = Transparent
          color: isActive ? Colors.white.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          text,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: isActive ? Colors.white : AppTheme.textLight,
          ),
        ),
      ),
    );
  }
}
